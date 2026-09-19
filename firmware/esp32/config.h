#ifndef ZENO_CONFIG_H
#define ZENO_CONFIG_H

// =========================================================================
// ZENO PHYSICAL AI ASSISTANT - ESP32 FIRMWARE CONFIGURATION
// "Listen. Think. Respond."
// =========================================================================

// --- 1. WI-FI NETWORK CREDENTIALS ---
#define WIFI_SSID         "YOUR_WIFI_NAME"          // <-- Replace with your Wi-Fi name
#define WIFI_PASSWORD     "YOUR_WIFI_PASSWORD"      // <-- Replace with your Wi-Fi password

// --- 2. HIVEMQ CLOUD BROKER CONFIGURATION ---
#define MQTT_SERVER       "2a44315fb0954566911359504d367ddf.s1.eu.hivemq.cloud"
#define MQTT_PORT         8883                      // Standard TLS Port
#define MQTT_USERNAME     "zeno_esp32"              // <-- Username created in HiveMQ Access Management
#define MQTT_PASSWORD     "YOUR_PASSWORD"           // <-- Password created in HiveMQ Access Management
#define DEVICE_ID         "001"

// --- 3. HARDWARE PIN DEFINITIONS (ESP32) ---

// 16x2 I2C LCD Display (HD44780 + PCF8574 backpack)
#define LCD_I2C_ADDR      0x27    // Commonly 0x27 or 0x3F
#define LCD_COLS          16
#define LCD_ROWS          2
#define I2C_SDA_PIN       21
#define I2C_SCL_PIN       22

// Microphone (Analog ADC or I2S)
#define MIC_ADC_PIN       34      // Analog Microphone OUT / AO connected to GPIO 34

// Push Button
#define TALK_BUTTON_PIN   0       // BOOT button on ESP32

#endif // ZENO_CONFIG_H
