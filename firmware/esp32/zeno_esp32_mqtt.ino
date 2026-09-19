/**
 * =========================================================================
 * ZENO PHYSICAL AI VOICE ASSISTANT - ESP32 FIRMWARE (MQTT CLOUD SECURE)
 * Tagline: "Listen. Think. Respond."
 * =========================================================================
 * 
 * Supports cloud connectivity to GitHub Pages via MQTT TLS (Port 8883).
 *
 * Hardware Components:
 * - ESP32 Dev Module
 * - 16x2 I2C LCD Display (PCF8574 Backpack, SDA: GPIO 21, SCL: GPIO 22)
 * - Analog Microphone (GPIO 34) or I2S INMP441 Microphone
 * - I2S DAC Audio Amplifier (MAX98357A)
 * - 3.7V Li-ion Battery Voltage Divider
 *
 * Arduino IDE / PlatformIO Libraries Needed:
 * - WiFi & WiFiClientSecure (Built-in to ESP32 core)
 * - PubSubClient by Nick O'Leary
 * - LiquidCrystal_I2C by Frank de Brabander or Marco Schwartz
 * - ArduinoJson by Benoit Blanchon (v6 or v7)
 * =========================================================================
 */

#include <Arduino.h>
#include <WiFi.h>
#include <WiFiClientSecure.h>
#include <PubSubClient.h>
#include <Wire.h>
#include <LiquidCrystal_I2C.h>
#include <ArduinoJson.h>
#include "config.h"

// --- GLOBAL OBJECTS & STATE ---
LiquidCrystal_I2C lcd(LCD_I2C_ADDR, LCD_COLS, LCD_ROWS);
WiFiClientSecure espClient;
PubSubClient mqtt(espClient);

// MQTT Topics
String TOPIC_STATUS  = "zeno/" + String(DEVICE_ID) + "/status";
String TOPIC_MIC     = "zeno/" + String(DEVICE_ID) + "/mic";
String TOPIC_LCD     = "zeno/" + String(DEVICE_ID) + "/lcd";
String TOPIC_STATE   = "zeno/" + String(DEVICE_ID) + "/state";
String TOPIC_COMMAND = "zeno/" + String(DEVICE_ID) + "/command";

// Telemetry & Timing timers
unsigned long lastMicRead = 0;
unsigned long lastStatusPing = 0;
unsigned long stateStartTime = 0;
String currentLcdL1 = "ZENO";
String currentLcdL2 = "Starting...";

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

void sendLCDStatus(String line1, String line2, bool ok) {
  StaticJsonDocument<256> doc;
  doc["ok"] = ok;
  doc["line1"] = line1;
  doc["line2"] = line2;

  char buffer[256];
  serializeJson(doc, buffer);
  mqtt.publish(TOPIC_LCD.c_str(), buffer, true);
}

void sendState(String state) {
  mqtt.publish(TOPIC_STATE.c_str(), state.c_str(), true);
}

// --- 2. TELEMETRY & SENSORS ---
void sendStatus() {
  StaticJsonDocument<256> doc;
  doc["online"] = true;
  doc["wifi"] = (WiFi.status() == WL_CONNECTED);
  doc["ip"] = WiFi.localIP().toString();
  doc["rssi"] = WiFi.RSSI();
  doc["uptime"] = millis() / 1000;

  char buffer[256];
  serializeJson(doc, buffer);
  mqtt.publish(TOPIC_STATUS.c_str(), buffer, true);
}

void sendMicLevel() {
  int raw = analogRead(MIC_ADC_PIN);
  int percent = map(raw, 0, 4095, 0, 100);
  percent = constrain(percent, 0, 100);

  StaticJsonDocument<128> doc;
  doc["raw"] = raw;
  doc["percent"] = percent;

  char buffer[128];
  serializeJson(doc, buffer);
  mqtt.publish(TOPIC_MIC.c_str(), buffer);
}

// --- 3. MQTT INCOMING COMMAND RECEIVER ---
void mqttCallback(char* topic, byte* payload, unsigned int length) {
  String message = "";
  for (unsigned int i = 0; i < length; i++) {
    message += (char)payload[i];
  }
  message.trim();
  Serial.print("[MQTT RX] ");
  Serial.print(topic);
  Serial.print(" -> ");
  Serial.println(message);

  if (String(topic) == TOPIC_COMMAND) {
    if (message == "LCD_TEST") {
      updateLcd("ZENO LCD TEST", "WORKING OK");
      sendLCDStatus("ZENO LCD TEST", "WORKING OK", true);
      sendState("LCD_TEST_RUNNING");
      delay(2000);
      updateLcd("ZENO", "READY");
      sendLCDStatus("ZENO", "READY", true);
      sendState("IDLE");
    } 
    else if (message == "MIC_TEST") {
      sendState("MIC_TEST_RUNNING");
      for (int i = 0; i < 5; i++) {
        sendMicLevel();
        delay(100);
      }
      sendState("IDLE");
    }
    else if (message.startsWith("LCD|")) {
      // Format: LCD|Line 1|Line 2
      int firstPipe = message.indexOf('|');
      int secondPipe = message.indexOf('|', firstPipe + 1);
      if (secondPipe > firstPipe) {
        String l1 = message.substring(firstPipe + 1, secondPipe);
        String l2 = message.substring(secondPipe + 1);
        updateLcd(l1, l2);
        sendLCDStatus(l1, l2, true);
      }
    }
    else if (message == "RESTART") {
      updateLcd("ZENO REBOOT", "PLEASE WAIT");
      delay(1000);
      ESP.restart();
    }
  }
}

// --- 4. NETWORK & MQTT CONNECTIONS ---
void connectWiFi() {
  Serial.print("\n[Wi-Fi] Connecting to: ");
  Serial.println(WIFI_SSID);
  updateLcd("ZENO", "Connecting Wi-Fi");

  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 30) {
    delay(500);
    Serial.print(".");
    attempts++;
  }

  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\n[Wi-Fi] Connected!");
    Serial.print("[Wi-Fi] IP Address: ");
    Serial.println(WiFi.localIP());
    updateLcd("ZENO", "Wi-Fi Connected");
  } else {
    Serial.println("\n[Wi-Fi] Connection failed. Retrying in loop...");
    updateLcd("ZENO", "Wi-Fi Error");
  }
}

void connectMQTT() {
  if (WiFi.status() != WL_CONNECTED) return;

  while (!mqtt.connected()) {
    Serial.print("[MQTT TLS] Connecting to broker ");
    Serial.print(MQTT_SERVER);
    Serial.print(":");
    Serial.print(MQTT_PORT);
    Serial.print("... ");

    String clientId = "ZENO_ESP32_" + String(DEVICE_ID) + "_" + String(random(0xffff), HEX);
    
    // Last will and testament
    const char* willTopic = TOPIC_STATUS.c_str();
    const char* willMessage = "{\"online\":false,\"wifi\":false}";

    bool ok = false;
    if (strlen(MQTT_USERNAME) > 0) {
      ok = mqtt.connect(clientId.c_str(), MQTT_USERNAME, MQTT_PASSWORD, willTopic, 1, true, willMessage);
    } else {
      ok = mqtt.connect(clientId.c_str(), willTopic, 1, true, willMessage);
    }

    if (ok) {
      Serial.println("CONNECTED!");
      mqtt.subscribe(TOPIC_COMMAND.c_str());
      
      sendStatus();
      sendState("IDLE");
      sendLCDStatus("ZENO", "READY", true);
      updateLcd("ZENO", "ONLINE (MQTT)");
    } else {
      Serial.print("FAILED (rc=");
      Serial.print(mqtt.state());
      Serial.println("). Retrying in 4s...");
      updateLcd("MQTT Retry...", String(mqtt.state()));
      delay(4000);
    }
  }
}

// --- SETUP ---
void setup() {
  Serial.begin(115200);
  Wire.begin(I2C_SDA_PIN, I2C_SCL_PIN);

  // Initialize LCD
  lcd.init();
  lcd.backlight();
  updateLcd("ZENO", "BOOTING...");

  // Mic Pin
  pinMode(MIC_ADC_PIN, INPUT);

  // Connect Wi-Fi
  connectWiFi();

  // Allow TLS connection without static root CA cert for cloud brokers
  espClient.setInsecure();

  // MQTT Server Setup
  mqtt.setServer(MQTT_SERVER, MQTT_PORT);
  mqtt.setCallback(mqttCallback);
  mqtt.setBufferSize(512); // Support larger JSON payloads

  connectMQTT();
}

// --- MAIN LOOP ---
void loop() {
  if (WiFi.status() != WL_CONNECTED) {
    connectWiFi();
  }

  if (!mqtt.connected()) {
    connectMQTT();
  }
  mqtt.loop();

  // Stream microphone readings every 150ms
  if (millis() - lastMicRead >= 150) {
    lastMicRead = millis();
    sendMicLevel();
  }

  // Periodic heartbeat every 5s
  if (millis() - lastStatusPing >= 5000) {
    lastStatusPing = millis();
    sendStatus();
  }
}
