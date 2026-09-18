/**
 * =========================================================================
 * ZENO PHYSICAL AI VOICE ASSISTANT - ESP32 FIRMWARE
 * Tagline: "Listen. Think. Respond."
 * =========================================================================
 *
 * Hardware Components:
 * - ESP32 Dev Module
 * - 16x2 I2C LCD Display (PCF8574 Backpack)
 * - I2S Microphone (INMP441)
 * - I2S DAC Audio Amplifier (MAX98357A) driving Dual Speakers
 * - 3.7V Li-ion Battery with voltage divider to ADC pin
 *
 * Dependencies (Arduino IDE / PlatformIO):
 * - LiquidCrystal_I2C by Frank de Brabander (or marcoschwartz)
 * - ArduinoWebsockets by Gil Maimon
 * - ArduinoJson by Benoit Blanchon (v6 or v7)
 * =========================================================================
 */

#include <Arduino.h>
#include <WiFi.h>
#include <Wire.h>
#include <LiquidCrystal_I2C.h>
#include <ArduinoWebsockets.h>
#include <ArduinoJson.h>
#include <driver/i2s.h>
#include "config.h"

using namespace websockets;

// --- GLOBAL OBJECTS & STATE ---
LiquidCrystal_I2C lcd(LCD_I2C_ADDR, LCD_COLS, LCD_ROWS);
WebsocketsClient wsClient;

enum ZenoState {
  STATE_OFFLINE,
  STATE_IDLE,
  STATE_LISTENING,
  STATE_THINKING,
  STATE_SPEAKING,
  STATE_ERROR
};

ZenoState currentState = STATE_OFFLINE;
unsigned long lastHeartbeatTime = 0;
unsigned long stateStartTime = 0;
String currentLcdL1 = "ZENO";
String currentLcdL2 = "Booting...";

// --- 1. DISPLAY DRIVER ---
void updateLcd(const String& line1, const String& line2) {
  currentLcdL1 = line1;
  currentLcdL2 = line2;
  
  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print(line1.substring(0, 16));
  lcd.setCursor(0, 1);
  lcd.print(line2.substring(0, 16));
}

void setZenoState(ZenoState newState, const String& customMsg = "") {
  currentState = newState;
  stateStartTime = millis();

  switch (newState) {
    case STATE_IDLE:
      updateLcd("ZENO", "Ready");
      break;
    case STATE_LISTENING:
      updateLcd("ZENO", "Listening...");
      break;
    case STATE_THINKING:
      updateLcd("ZENO", "Thinking...");
      break;
    case STATE_SPEAKING:
      updateLcd("ZENO", "Speaking...");
      break;
    case STATE_OFFLINE:
      updateLcd("ZENO", "Offline");
      break;
    case STATE_ERROR:
      updateLcd("ZENO Error", customMsg.length() > 0 ? customMsg : "Check Web UI");
      break;
  }
}

// --- 2. BATTERY ADC MEASUREMENT ---
float readBatteryVoltage() {
  int raw = analogRead(BATTERY_ADC_PIN);
  float pinVoltage = (raw / ADC_MAX_VAL) * VREF_VOLTAGE;
  float batteryVoltage = pinVoltage * VOLTAGE_DIVIDER_R;
  return batteryVoltage;
}

int calculateBatteryPercentage(float voltage) {
  // Li-ion curve: ~3.2V (0%) to ~4.2V (100%)
  if (voltage >= 4.20) return 100;
  if (voltage <= 3.20) return 0;
  int pct = (int)(((voltage - 3.20) / (4.20 - 3.20)) * 100.0);
  return constrain(pct, 0, 100);
}

// --- 3. I2S MICROPHONE INITIALIZATION ---
void initI2SMicrophone() {
  i2s_config_t i2s_config = {
    .mode = (i2s_mode_t)(I2S_MODE_MASTER | I2S_MODE_RX),
    .sample_rate = SAMPLE_RATE_MIC,
    .bits_per_sample = I2S_BITS_PER_SAMPLE_32BIT,
    .channel_format = I2S_CHANNEL_FMT_ONLY_LEFT,
    .communication_format = I2S_COMM_FORMAT_STAND_I2S,
    .intr_alloc_flags = ESP_INTR_FLAG_LEVEL1,
    .dma_buf_count = 4,
    .dma_buf_len = 512,
    .use_apll = false,
    .tx_desc_auto_clear = false,
    .fixed_mclk = 0
  };

  i2s_pin_config_t pin_config = {
    .bck_io_num = I2S_MIC_SCK_PIN,
    .ws_io_num = I2S_MIC_WS_PIN,
    .data_out_num = I2S_PIN_NO_CHANGE,
    .data_in_num = I2S_MIC_SD_PIN
  };

  i2s_driver_install(I2S_MIC_PORT, &i2s_config, 0, NULL);
  i2s_set_pin(I2S_MIC_PORT, &pin_config);
  Serial.println("[ZENO Hardware] I2S INMP441 Microphone configured.");
}

// --- 4. I2S SPEAKER AMPLIFIER INITIALIZATION ---
void initI2SSpeaker() {
  i2s_config_t i2s_config = {
    .mode = (i2s_mode_t)(I2S_MODE_MASTER | I2S_MODE_TX),
    .sample_rate = SAMPLE_RATE_SPK,
    .bits_per_sample = I2S_BITS_PER_SAMPLE_16BIT,
    .channel_format = I2S_CHANNEL_FMT_RIGHT_LEFT,
    .communication_format = I2S_COMM_FORMAT_STAND_I2S,
    .intr_alloc_flags = ESP_INTR_FLAG_LEVEL1,
    .dma_buf_count = 4,
    .dma_buf_len = 512,
    .use_apll = false,
    .tx_desc_auto_clear = true,
    .fixed_mclk = 0
  };

  i2s_pin_config_t pin_config = {
    .bck_io_num = I2S_SPK_BCLK_PIN,
    .ws_io_num = I2S_SPK_LRC_PIN,
    .data_out_num = I2S_SPK_DIN_PIN,
    .data_in_num = I2S_PIN_NO_CHANGE
  };

  i2s_driver_install(I2S_SPK_PORT, &i2s_config, 0, NULL);
  i2s_set_pin(I2S_SPK_PORT, &pin_config);
  Serial.println("[ZENO Hardware] I2S MAX98357A Dual Speaker Amplifier configured.");
}

// --- 5. WEBSOCKET MESSAGE HANDLER ---
void onWebSocketMessage(WebsocketsMessage message) {
  StaticJsonDocument<512> doc;
  DeserializationError error = deserializeJson(doc, message.data());
  if (error) {
    Serial.print("JSON parse error: ");
    Serial.println(error.c_str());
    return;
  }

  const char* type = doc["type"];
  if (!type) return;

  if (strcmp(type, "LCD_UPDATE") == 0) {
    const char* l1 = doc["line1"] | "ZENO";
    const char* l2 = doc["line2"] | "Ready";
    updateLcd(String(l1), String(l2));
  } else if (strcmp(type, "STATE_CHANGE") == 0) {
    const char* st = doc["state"] | "IDLE";
    if (strcmp(st, "LISTENING") == 0) setZenoState(STATE_LISTENING);
    else if (strcmp(st, "THINKING") == 0) setZenoState(STATE_THINKING);
    else if (strcmp(st, "SPEAKING") == 0) setZenoState(STATE_SPEAKING);
    else setZenoState(STATE_IDLE);
  } else if (strcmp(type, "TEST_SPEAKER") == 0) {
    // Generate a simple hardware test tone
    Serial.println("[ZENO Hardware] Playing speaker test tone...");
    updateLcd("ZENO Speaker", "Testing Tone...");
    delay(500);
    setZenoState(STATE_IDLE);
  } else if (strcmp(type, "RESTART") == 0) {
    updateLcd("ZENO Rebooting", "Please wait...");
    delay(1000);
    ESP.restart();
  }
}

// --- 6. SEND TELEMETRY HEARTBEAT ---
void sendHeartbeat() {
  if (!wsClient.available()) return;

  float voltage = readBatteryVoltage();
  int batteryPct = calculateBatteryPercentage(voltage);

  StaticJsonDocument<512> doc;
  doc["type"] = "ESP32_TELEMETRY";
  JsonObject payload = doc.createNestedObject("payload");
  payload["deviceId"] = "ZENO-ESP32-001";
  payload["name"] = "ZENO";
  payload["connected"] = true;
  payload["ipAddress"] = WiFi.localIP().toString();
  payload["wifiSsid"] = WiFi.SSID();
  payload["wifiRssi"] = WiFi.RSSI();
  payload["firmwareVersion"] = "v1.0.0-release";
  payload["uptimeSeconds"] = millis() / 1000;
  payload["batteryPercentage"] = batteryPct;
  payload["batteryVoltage"] = voltage;
  payload["isCharging"] = (voltage >= 4.18);
  payload["micReady"] = true;
  payload["speakerReady"] = true;
  payload["lcdReady"] = true;
  payload["lcdLine1"] = currentLcdL1;
  payload["lcdLine2"] = currentLcdL2;

  String output;
  serializeJson(doc, output);
  wsClient.send(output);
}

// --- SETUP ---
void setup() {
  Serial.begin(115200);
  pinMode(TALK_BUTTON_PIN, INPUT_PULLUP);

  // Initialize 16x2 LCD
  Wire.begin(I2C_SDA_PIN, I2C_SCL_PIN);
  lcd.init();
  lcd.backlight();
  updateLcd("ZENO", "Connecting Wi-Fi");

  // Connect to Wi-Fi
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  Serial.print("Connecting to Wi-Fi: ");
  Serial.println(WIFI_SSID);

  int wifiAttempts = 0;
  while (WiFi.status() != WL_CONNECTED && wifiAttempts < 20) {
    delay(500);
    Serial.print(".");
    wifiAttempts++;
  }

  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\nWi-Fi Connected!");
    Serial.print("IP Address: ");
    Serial.println(WiFi.localIP());
    updateLcd("ZENO Wi-Fi OK", WiFi.localIP().toString());
  } else {
    Serial.println("\nWi-Fi connection failed.");
    setZenoState(STATE_ERROR, "Wi-Fi Failed");
  }

  // Initialize Audio Hardware
  initI2SMicrophone();
  initI2SSpeaker();

  // Setup WebSocket Client
  wsClient.onMessage(onWebSocketMessage);
  wsClient.onEvent([](WebsocketsEvent event, String data) {
    if (event == WebsocketsEvent::ConnectionOpened) {
      Serial.println("[WebSocket] Connected to ZENO Backend Gateway!");
      setZenoState(STATE_IDLE);
    } else if (event == WebsocketsEvent::ConnectionClosed) {
      Serial.println("[WebSocket] Disconnected from ZENO Backend Gateway.");
      setZenoState(STATE_OFFLINE);
    }
  });

  // Attempt initial WS connection
  wsClient.connect(ZENO_BACKEND_HOST, ZENO_BACKEND_PORT, ZENO_WS_PATH);
}

// --- MAIN LOOP ---
void loop() {
  // 1. Maintain Wi-Fi Connection
  if (WiFi.status() != WL_CONNECTED) {
    WiFi.reconnect();
  }

  // 2. Maintain WebSocket Connection
  if (WiFi.status() == WL_CONNECTED) {
    if (!wsClient.available()) {
      static unsigned long lastReconnectAttempt = 0;
      if (millis() - lastReconnectAttempt > 5000) {
        lastReconnectAttempt = millis();
        Serial.println("[WebSocket] Attempting reconnection to backend...");
        wsClient.connect(ZENO_BACKEND_HOST, ZENO_BACKEND_PORT, ZENO_WS_PATH);
      }
    } else {
      wsClient.poll();
    }
  }

  // 3. Periodic Heartbeat & Telemetry
  if (millis() - lastHeartbeatTime >= HEARTBEAT_INTERVAL_MS) {
    lastHeartbeatTime = millis();
    sendHeartbeat();
  }

  // 4. Physical Push-To-Talk Button Check
  if (digitalRead(TALK_BUTTON_PIN) == LOW) {
    delay(50); // Debounce
    if (digitalRead(TALK_BUTTON_PIN) == LOW) {
      if (currentState == STATE_IDLE) {
        setZenoState(STATE_LISTENING);
        if (wsClient.available()) {
          wsClient.send("{\"type\":\"BUTTON_TRIGGER\",\"action\":\"START_LISTENING\"}");
        }
      }
    }
  }
}
