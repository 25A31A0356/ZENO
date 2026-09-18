# ZENO ESP32 Firmware Guide

This directory contains the complete C++ firmware for the **ZENO** physical AI voice assistant.

---

## 1. Hardware Pinout & Wiring Table

| Component | Component Pin | ESP32 Pin | Description |
|---|---|---|---|
| **16x2 I2C LCD** | VCC | 5V / VIN | 5V Power |
| | GND | GND | Ground |
| | SDA | GPIO 21 | I2C Serial Data |
| | SCL | GPIO 22 | I2C Serial Clock |
| **INMP441 Microphone** | VDD | 3.3V | 3.3V Power |
| | GND | GND | Ground |
| | SD | GPIO 32 | I2S Serial Data Out |
| | WS / L/R | GPIO 15 | I2S Word Select |
| | SCK | GPIO 14 | I2S Bit Clock |
| | L/R | GND | Left Channel Selection |
| **MAX98357A Amplifier** | VIN | 5V / 3.7V Li-ion | Amplifier Power |
| | GND | GND | Ground |
| | DIN | GPIO 27 | I2S Data In |
| | BCLK | GPIO 26 | I2S Bit Clock |
| | LRC | GPIO 25 | I2S Word Select / LRC |
| | GAIN | GND / 3.3V | Default Gain (9dB/12dB) |
| | Speaker + / - | Dual Speakers | 4Ω / 8Ω 3W Speakers |
| **Battery Monitor** | Battery + | 100kΩ -> GPIO 34 | Voltage divider top |
| | Ground | 100kΩ -> GND | Voltage divider bottom |

---

## 2. Required Libraries in Arduino IDE

Install the following libraries via the **Arduino Library Manager** (`Ctrl + Shift + I`):
1. **LiquidCrystal_I2C** by Frank de Brabander (or marcoschwartz)
2. **ArduinoWebsockets** by Gil Maimon
3. **ArduinoJson** by Benoit Blanchon (v6 or v7)

---

## 3. Configuration Steps

1. Open [`config.h`](file:///c:/Users/tst20/zeno/firmware/esp32/config.h).
2. Set your Wi-Fi network credentials:
   ```cpp
   #define WIFI_SSID         "Your_WiFi_Network"
   #define WIFI_PASSWORD     "Your_WiFi_Password"
   ```
3. Set your backend IP address (find using `ipconfig` on Windows or `ifconfig` on Linux/Mac):
   ```cpp
   #define ZENO_BACKEND_HOST "192.168.1.100" // Your computer's local IP
   #define ZENO_BACKEND_PORT 5000
   ```
4. Select **Board: "ESP32 Dev Module"** in Arduino IDE.
5. Select the corresponding COM port and click **Upload**.

---

## 4. Operational Pipeline

When booted:
1. ESP32 connects to Wi-Fi.
2. 16x2 LCD displays `ZENO: System Online`.
3. WebSocket connects to backend gateway (`ws://<backend_ip>:5000/ws?client=esp32`).
4. Microcontroller sends real-time battery, RSSI, and hardware status every 5 seconds.
5. Inbound events update the LCD and play audio through the dual speakers.
