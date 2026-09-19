/**
 * =========================================================================
 * ZENO PHYSICAL AI VOICE ASSISTANT - ESP32 FIRMWARE (EMQX CLOUD BROKER)
 * Tagline: "Listen. Think. Respond."
 * =========================================================================
 * 
 * High-Reliability Architecture:
 * - ESP32 connects via TCP Port 1883 (No SSL/TLS certificate dropouts)
 * - Browser connects via WSS Port 8084 (Full HTTPS WebSocket support)
 *
 * Required Libraries (Arduino IDE -> Tools -> Manage Libraries):
 * 1. PubSubClient by Nick O'Leary
 * 2. LiquidCrystal I2C by Frank de Brabander / Marco Schwartz
 * 3. ArduinoJson by Benoit Blanchon
 * =========================================================================
 */

#include <Arduino.h>
#include <WiFi.h>
#include <PubSubClient.h>
#include <Wire.h>
#include <LiquidCrystal_I2C.h>
#include <ArduinoJson.h>

// =========================================================================
// 1. WI-FI & MQTT BROKER CONFIGURATION
// =========================================================================
const char* WIFI_SSID     = "OnePlus Nord";
const char* WIFI_PASSWORD = "123456789";

// EMQX Global Public Broker (Ultra-reliable, zero auth barriers)
const char* MQTT_SERVER   = "broker.emqx.io";
const int   MQTT_PORT     = 1883;                    // Standard MQTT TCP Port
const char* MQTT_USERNAME = "";
const char* MQTT_PASSWORD = "";

const char* DEVICE_ID     = "001";

// =========================================================================
// 2. HARDWARE PIN DEFINITIONS
// =========================================================================
#define LCD_SDA_PIN 21
#define LCD_SCL_PIN 22
#define MIC_ADC_PIN 34
#define LCD_ADDRESS 0x27   // Commonly 0x27 (or 0x3F)

LiquidCrystal_I2C lcd(LCD_ADDRESS, 16, 2);
WiFiClient espClient;
PubSubClient mqtt(espClient);

// MQTT Topics
String TOPIC_STATUS  = "zeno/" + String(DEVICE_ID) + "/status";
String TOPIC_MIC     = "zeno/" + String(DEVICE_ID) + "/mic";
String TOPIC_LCD     = "zeno/" + String(DEVICE_ID) + "/lcd";
String TOPIC_STATE   = "zeno/" + String(DEVICE_ID) + "/state";
String TOPIC_COMMAND = "zeno/" + String(DEVICE_ID) + "/command";

// Timing intervals
unsigned long lastMicTime = 0;
unsigned long lastStatusTime = 0;

// =========================================================================
// 3. LCD HELPER FUNCTIONS
// =========================================================================
void showLCD(String line1, String line2) {
  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print(line1.substring(0, 16));
  lcd.setCursor(0, 1);
  lcd.print(line2.substring(0, 16));
}

void publishLcdStatus(String line1, String line2, bool ok) {
  StaticJsonDocument<256> doc;
  doc["ok"] = ok;
  doc["line1"] = line1;
  doc["line2"] = line2;

  char buffer[256];
  serializeJson(doc, buffer);
  mqtt.publish(TOPIC_LCD.c_str(), buffer, true);
}

void publishState(String state) {
  mqtt.publish(TOPIC_STATE.c_str(), state.c_str(), true);
}

// =========================================================================
// 4. TELEMETRY & SENSORS
// =========================================================================
void publishStatus() {
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

void publishMic() {
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

// =========================================================================
// 5. MQTT INCOMING COMMAND HANDLER
// =========================================================================
void mqttCallback(char* topic, byte* payload, unsigned int length) {
  String command = "";
  for (unsigned int i = 0; i < length; i++) {
    command += (char)payload[i];
  }
  command.trim();
  Serial.println("[MQTT RX] Received: " + command);

  // LCD Preset Test
  if (command == "LCD_TEST") {
    showLCD("ZENO LCD TEST", "WORKING OK");
    publishLcdStatus("ZENO LCD TEST", "WORKING OK", true);
    publishState("LCD_TEST_RUNNING");
    delay(2000);
    showLCD("ZENO", "READY");
    publishLcdStatus("ZENO", "READY", true);
    publishState("IDLE");
  } 
  // Microphone Test
  else if (command == "MIC_TEST") {
    publishState("MIC_TEST_RUNNING");
    for (int i = 0; i < 6; i++) {
      publishMic();
      delay(80);
    }
    publishState("IDLE");
  }
  // Custom LCD Text (Format: LCD|Line 1|Line 2)
  else if (command.startsWith("LCD|")) {
    int firstPipe = command.indexOf('|');
    int secondPipe = command.indexOf('|', firstPipe + 1);
    if (secondPipe > firstPipe) {
      String l1 = command.substring(firstPipe + 1, secondPipe);
      String l2 = command.substring(secondPipe + 1);
      showLCD(l1, l2);
      publishLcdStatus(l1, l2, true);
    }
  }
  // Reboot ESP32
  else if (command == "RESTART") {
    showLCD("ZENO REBOOT", "PLEASE WAIT");
    delay(1000);
    ESP.restart();
  }
}

// =========================================================================
// 6. WI-FI & MQTT CONNECTIONS
// =========================================================================
void connectWiFi() {
  Serial.print("\n[Wi-Fi] Connecting to: ");
  Serial.println(WIFI_SSID);
  showLCD("ZENO", "Connecting Wi-Fi");

  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 30) {
    delay(500);
    Serial.print(".");
    attempts++;
  }

  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\n[Wi-Fi] Connected! IP: " + WiFi.localIP().toString());
    showLCD("ZENO", "Wi-Fi Connected");
  } else {
    Serial.println("\n[Wi-Fi] Connection failed. Will retry in loop...");
    showLCD("ZENO", "Wi-Fi Failed");
  }
}

void connectMQTT() {
  if (WiFi.status() != WL_CONNECTED) return;

  while (!mqtt.connected()) {
    Serial.print("[MQTT] Connecting to broker ");
    Serial.print(MQTT_SERVER);
    Serial.print("...");

    String clientId = "ZENO_ESP32_" + String(DEVICE_ID) + "_" + String(random(0xffff), HEX);
    
    // Last Will and Testament: Automatically marks offline if connection drops
    const char* willTopic = TOPIC_STATUS.c_str();
    const char* willMsg = "{\"online\":false,\"wifi\":false}";

    if (mqtt.connect(clientId.c_str(), willTopic, 1, true, willMsg)) {
      Serial.println(" CONNECTED!");
      mqtt.subscribe(TOPIC_COMMAND.c_str());
      
      publishStatus();
      publishState("IDLE");
      publishLcdStatus("ZENO", "READY", true);
      showLCD("ZENO", "ONLINE (MQTT)");
    } else {
      Serial.print(" FAILED (rc=");
      Serial.print(mqtt.state());
      Serial.println("). Retrying in 4s...");
      delay(4000);
    }
  }
}

// =========================================================================
// 7. ARDUINO SETUP
// =========================================================================
void setup() {
  Serial.begin(115200);

  // Initialize 16x2 LCD
  Wire.begin(LCD_SDA_PIN, LCD_SCL_PIN);
  lcd.init();
  lcd.backlight();
  showLCD("ZENO", "BOOTING...");

  // Initialize Microphone ADC Pin
  pinMode(MIC_ADC_PIN, INPUT);

  // Connect to Wi-Fi
  connectWiFi();

  // Setup MQTT Client
  mqtt.setServer(MQTT_SERVER, MQTT_PORT);
  mqtt.setCallback(mqttCallback);
  mqtt.setBufferSize(512);

  connectMQTT();
}

// =========================================================================
// 8. ARDUINO MAIN LOOP
// =========================================================================
void loop() {
  if (WiFi.status() != WL_CONNECTED) {
    connectWiFi();
  }

  if (!mqtt.connected()) {
    connectMQTT();
  }
  mqtt.loop();

  // Send sound level telemetry every 150ms
  if (millis() - lastMicTime >= 150) {
    lastMicTime = millis();
    publishMic();
  }

  // Send heartbeat status every 5 seconds
  if (millis() - lastStatusTime >= 5000) {
    lastStatusTime = millis();
    publishStatus();
  }
}
