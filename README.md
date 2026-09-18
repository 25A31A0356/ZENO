# ZENO — Physical AI Voice Assistant Control Center
> *"Listen. Think. Respond."*

[![Live Demo](https://img.shields.io/badge/Live%20Demo-GitHub%20Pages-00f0ff?style=for-the-badge&logo=googlechrome&logoColor=white)](https://25A31A0356.github.io/ZENO/)

[![Repository](https://img.shields.io/badge/GitHub-25A31A0356%2FZENO-181717?logo=github)](https://github.com/25A31A0356/ZENO)
[![Status](https://img.shields.io/badge/Status-Online-10b981.svg)]()
[![Frontend](https://img.shields.io/badge/Frontend-React%2018%20%7C%20TypeScript%20%7C%20Vite%20%7C%20Tailwind-38bdf8.svg)]()
[![Backend](https://img.shields.io/badge/Backend-Node.js%20%7C%20Express%20%7C%20WebSocket-8b5cf6.svg)]()
[![Hardware](https://img.shields.io/badge/Hardware-ESP32%20%7C%2016x2%20LCD%20%7C%20I2S-f59e0b.svg)]()
[![License](https://img.shields.io/badge/License-MIT-blue.svg)]()

> 🌐 **Live Web Dashboard:** **[https://25A31A0356.github.io/ZENO/](https://25A31A0356.github.io/ZENO/)**

---

## 🌟 Project Overview

**ZENO** is a complete, beginner-friendly physical AI voice assistant inspired by consumer smart speakers (like Alexa/Echo), engineered around an **ESP32 microcontroller**, a **16x2 I2C LCD character display**, an **I2S microphone**, an **I2S audio amplifier with dual speakers**, and a **rechargeable Li-ion battery**.

The web application serves as the **ZENO Control Center & Monitoring Dashboard** — allowing users to monitor live hardware telemetry, talk to ZENO, teach ZENO custom knowledge through documents and Q&A (RAG), control the 16x2 LCD in real-time, test audio hardware, and simulate full presentation runs for engineering demonstrations.

```
                    ┌───────────────────────────────────────────┐
                    │ ZENO                        🟢 ONLINE     │
                    │ Listen. Think. Respond.                   │
                    ├───────────────────────────────────────────┤
                    │                                           │
                    │       ┌───────────────────────────┐       │
                    │       │       🎤 LISTENING        │       │
                    │       │    "What is an ESP32?"    │       │
                    │       └───────────────────────────┘       │
                    │                                           │
                    │  ┌──────────┐ ┌──────────┐ ┌───────────┐  │
                    │  │ ESP32    │ │ MIC      │ │ AI BRAIN  │  │
                    │  │ 🟢 ONLINE│ │ 🟢 READY │ │ 🟢 READY  │  │
                    │  └──────────┘ └──────────┘ └───────────┘  │
                    │  ┌──────────┐ ┌──────────┐ ┌───────────┐  │
                    │  │ SPEAKERS │ │ LCD      │ │ BATTERY   │  │
                    │  │ 🟢 READY │ │ 🟢 READY │ │ 🔋 82%    │  │
                    │  └──────────┘ └──────────┘ └───────────┘  │
                    ├───────────────────────────────────────────┤
                    │ Recent Conversation                       │
                    │ YOU: What is an ESP32?                    │
                    │ ZENO: An ESP32 is a Wi-Fi microcontroller │
                    └───────────────────────────────────────────┘
```

---

## 🚀 Key Features

### 1. 5-Second Status Overview (ZENO Home)
Answers the 6 vital questions within 5 seconds of opening:
- **Is ZENO online?** ➔ Large status indicator (🟢 ONLINE / 🔴 OFFLINE / ⚠️ WARNING)
- **Is the ESP32 connected?** ➔ Live Wi-Fi SSID, RSSI (dBm), IP address, and heartbeat timer
- **Can it hear me?** ➔ Microphone readiness & animated audio indicator
- **Can it think?** ➔ AI Brain state & average response latency (~1.1s)
- **Can it speak?** ➔ Dual speaker amplifier status & output volume
- **What is it doing right now?** ➔ Real-time pipeline state (`IDLE`, `LISTENING`, `THINKING`, `SPEAKING`, `ERROR`)
- **What did it recently say?** ➔ Recent conversation feed with response latency

### 2. Talk to ZENO (Voice & Speech Sandbox)
- **Interactive Push-To-Talk Button**: Large, responsive microphone trigger with real-time speech wave animation.
- **Web Speech Recognition**: Live speech-to-text transcript streaming in real-time.
- **Spoken Voice Playback**: Natural text-to-speech voice playback with customizable voice models and speed.
- **Text Chat Fallback**: Type queries anytime when a physical microphone is unavailable.

### 3. Teach ZENO (Knowledge Base & RAG)
No complicated machine learning terminology:
- **Add Information**: Custom facts, project notes, and engineering data with tag indexing.
- **Upload Document**: Direct parsing and automatic chunking for PDF, TXT, CSV, DOCX, and Markdown files.
- **Create Q&A**: Direct Question & Answer pairs for deterministic 100% accurate responses.
- **Knowledge Search**: Live search bar to browse, inspect, edit, or delete taught knowledge.

### 4. Hardware Control & Diagnostics
- **16x2 LCD Controller**: Realistic retro green/blue dot-matrix display visualizer with custom line inputs and quick presets (`[ONLINE]`, `[LISTENING]`, `[THINKING]`, `[SPEAKING]`, `[OFFLINE]`).
- **Stereo Speaker Test**: Play test audio tone with **Left / Right / Both** channel balance and volume slider.
- **Microphone VU Level Meter**: Live sound-level sensitivity analyzer (`LOW ███░░░░░░░ HIGH`).
- **ESP32 Telemetry**: Battery voltage (3.7V - 4.2V), battery percentage, uptime, firmware version, and reboot commands.

### 5. AI Reasoning Sandbox & Vision
- **Test ZENO AI**: Test prompts directly, inspect retrieved RAG knowledge snippets, and monitor latency.
- **ZENO Vision**: Optional camera snapshot capture for visual object identification and analysis.

### 6. Dual UI Modes
- **Beginner Mode** (Default): Simple, visually clean control panel for everyday operation.
- **Advanced Mode**: Full technical diagnostics, real-time event logs, and latency telemetry.

### 7. One-Click Presentation Demo Mode
- **[START DEMO]** button executes an automated end-to-end presentation sequence: ESP32 connection ➔ Speech detection ➔ Soundwave animation ➔ AI reasoning ➔ LCD update ➔ Voice playback.

---

## 🏗️ System Architecture

```
                    USER
                     │
                     ↓
              ┌─────────────┐
              │    ZENO     │
              │   DEVICE    │
              │   ESP32     │
              └──────┬──────┘
                     │
                   Wi-Fi (REST + WebSocket)
                     │
                     ↓
            ┌─────────────────┐
            │  ZENO BACKEND   │ (Node.js + Express + WebSocket)
            └────────┬────────┘
                     │
        ┌────────────┼────────────┐
        ↓            ↓            ↓
     Speech          AI          TTS
   Recognition     Engine      Engine
    (Web/API)   (Gemini/RAG) (Web/Audio)
        │            │            │
        └────────────┼────────────┘
                     │
              ZENO DASHBOARD (React + TypeScript + Tailwind)
```

---

## 🔌 Hardware Pinout & Wiring Table

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

## 📁 Repository Structure

```text
zeno/
│
├── frontend/                     # React + Vite + TypeScript + Tailwind CSS
│   ├── src/
│   │   ├── components/           # Navbar, ActivityHero, StatusCards, LcdSimulator, BottomNav
│   │   ├── pages/                # Dashboard, Talk, Teach, Device, AiTest, Vision, History, Settings, Logs
│   │   ├── context/              # ZenoContext (WebSocket state synchronization)
│   │   ├── services/             # API client, WebSocket client, Web Speech/Audio service
│   │   └── types/                # TypeScript interface definitions
│   ├── package.json
│   └── vite.config.ts
│
├── backend/                      # Node.js + Express + WebSocket Backend Gateway
│   ├── src/
│   │   ├── api/                  # REST API routes (/api/status, /api/device, /api/chat, etc.)
│   │   ├── database/             # Persistent JSON/SQLite database store
│   │   ├── services/             # AI Engine, RAG Service, Device Watchdog, Vision, Speech
│   │   ├── config.ts             # Configuration and environment variables
│   │   └── server.ts             # Express & WebSocket server bootstrap
│   ├── package.json
│   └── tsconfig.json
│
├── firmware/
│   └── esp32/
│       ├── zeno_esp32.ino        # Full Arduino C++ firmware sketch
│       ├── config.h              # Wi-Fi credentials, backend host IP, pinout
│       └── README.md             # Hardware flashing & assembly instructions
│
├── docs/
│   ├── setup/quickstart.md       # Quickstart guide
│   └── api/api_reference.md      # REST & WebSocket API specification
│
├── .gitignore
├── LICENSE
├── package.json
└── README.md
```

---

## ⚡ Quick Start

### 1. Clone the Repository
```bash
git clone https://github.com/25A31A0356/ZENO.git
cd ZENO
```

### 2. Install Dependencies
```bash
# Install all workspace dependencies
npm install
cd backend && npm install
cd ../frontend && npm install
```

### 3. Configure Environment (Optional)
Configure [`backend/.env`](backend/.env):
```env
PORT=5000
FRONTEND_URL=http://localhost:5173

# Optional: Gemini API Key (Leaves blank to use built-in intelligent engine)
GEMINI_API_KEY=
AI_PROVIDER=gemini
AI_MODEL=gemini-1.5-flash
```

### 4. Run Development Servers
```bash
# Run both backend and frontend concurrently from root
npm run dev
```

- **Frontend Dashboard**: [http://localhost:5173](http://localhost:5173)
- **Backend API Status**: [http://localhost:5000/api/status](http://localhost:5000/api/status)
- **WebSocket Gateway**: `ws://localhost:5000/ws`

---

## 📡 Flashing ESP32 Firmware

1. Open [`firmware/esp32/zeno_esp32.ino`](firmware/esp32/zeno_esp32.ino) in **Arduino IDE**.
2. Open [`firmware/esp32/config.h`](firmware/esp32/config.h) and set your Wi-Fi credentials and computer's local IP address.
3. Install dependencies via Arduino Library Manager:
   - `LiquidCrystal_I2C`
   - `ArduinoWebsockets`
   - `ArduinoJson`
4. Select board **ESP32 Dev Module** and click **Upload**.

---

## 📄 License
This project is open-source under the [MIT License](LICENSE).

**ZENO AI ASSISTANT** — *"Listen. Think. Respond."*
