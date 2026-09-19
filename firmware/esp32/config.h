#ifndef ZENO_CONFIG_H
#define ZENO_CONFIG_H

// =========================================================================
// ZENO PHYSICAL AI ASSISTANT - ESP32 FIRMWARE CONFIGURATION
// "Listen. Think. Respond."
// =========================================================================

// --- 1. WI-FI NETWORK CREDENTIALS ---
#define WIFI_SSID         "OnePlus Nord"
#define WIFI_PASSWORD     "123456789"

// --- 2. VERIFIED HIVEMQ CLOUD BROKER (FROM YOUR SCREENSHOT) ---
#define MQTT_SERVER       "2a44315fb0954566911359504d367ddf.s1.eu.hivemq.cloud"
#define MQTT_PORT         8883
#define MQTT_USERNAME     "zeno_user"
#define MQTT_PASSWORD     "zeno_user"
#define DEVICE_ID         "001"

// --- 3. HARDWARE PIN DEFINITIONS (ESP32) ---
#define LCD_I2C_ADDR      0x27    // Commonly 0x27 or 0x3F
#define LCD_COLS          16
#define LCD_ROWS          2
#define I2C_SDA_PIN       21
#define I2C_SCL_PIN       22
#define MIC_ADC_PIN       34

#endif // ZENO_CONFIG_H
