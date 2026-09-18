#ifndef ZENO_CONFIG_H
#define ZENO_CONFIG_H

// =========================================================================
// ZENO PHYSICAL AI ASSISTANT - ESP32 FIRMWARE CONFIGURATION
// "Listen. Think. Respond."
// =========================================================================

// --- 1. WI-FI NETWORK CREDENTIALS ---
#define WIFI_SSID         "YOUR_WIFI_SSID"
#define WIFI_PASSWORD     "YOUR_WIFI_PASSWORD"

// --- 2. ZENO BACKEND SERVER CONFIGURATION ---
// Replace with the local IP address of the machine running ZENO backend
#define ZENO_BACKEND_HOST "192.168.1.100"
#define ZENO_BACKEND_PORT 5000
#define ZENO_WS_PATH      "/ws?client=esp32"
#define HEARTBEAT_INTERVAL_MS 5000

// --- 3. HARDWARE PIN DEFINITIONS (ESP32) ---

// I2C 16x2 LCD Display (HD44780 + PCF8574 backpack)
#define LCD_I2C_ADDR      0x27    // Commonly 0x27 or 0x3F
#define LCD_COLS          16
#define LCD_ROWS          2
#define I2C_SDA_PIN       21
#define I2C_SCL_PIN       22

// I2S Microphone (INMP441 / SPH0645)
#define I2S_MIC_PORT      I2S_NUM_0
#define I2S_MIC_SCK_PIN   14      // Serial Clock (BCLK)
#define I2S_MIC_WS_PIN    15      // Word Select (LRCK)
#define I2S_MIC_SD_PIN    32      // Serial Data (DOUT)
#define SAMPLE_RATE_MIC   16000   // 16kHz Mono audio

// I2S Audio Amplifier & Dual Speakers (MAX98357A / PCM5102)
#define I2S_SPK_PORT      I2S_NUM_1
#define I2S_SPK_BCLK_PIN  26      // Bit Clock
#define I2S_SPK_LRC_PIN   25      // Left/Right Clock (Word Select)
#define I2S_SPK_DIN_PIN   27      // Data In (DIN)
#define SAMPLE_RATE_SPK   16000

// Battery Monitoring (ADC Voltage Divider - 100k / 100k to GPIO34)
#define BATTERY_ADC_PIN   34
#define ADC_MAX_VAL       4095.0
#define VREF_VOLTAGE      3.3
#define VOLTAGE_DIVIDER_R 2.0     // 100k + 100k divider multiplier

// Push Button (Optional physical push-to-talk trigger)
#define TALK_BUTTON_PIN   0       // BOOT button on standard ESP32

#endif // ZENO_CONFIG_H
