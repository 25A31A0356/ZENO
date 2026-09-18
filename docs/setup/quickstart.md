# ZENO Quickstart Guide

Get the **ZENO Physical AI Assistant Control Center** running on your local machine in under 2 minutes.

---

## 1. Prerequisites

- **Node.js** (v18.0.0 or higher)
- **npm** (v9.0.0 or higher)
- (Optional) **ESP32 Dev Board** + 16x2 I2C LCD + INMP441 Microphone + MAX98357A Audio Amplifier + Speakers

---

## 2. Installation

1. Clone or open the repository:
   ```bash
   cd zeno
   ```

2. Install dependencies:
   ```bash
   # Install root dependencies
   npm install

   # Install backend dependencies
   cd backend && npm install

   # Install frontend dependencies
   cd ../frontend && npm install
   ```

---

## 3. Configuration

Backend settings can be configured in [`backend/.env`](file:///c:/Users/tst20/zeno/backend/.env):

```env
PORT=5000
FRONTEND_URL=http://localhost:5173

# Optional: Google Gemini API Key
# If left blank, ZENO automatically uses its built-in intelligent reasoning engine!
GEMINI_API_KEY=
AI_PROVIDER=gemini
AI_MODEL=gemini-1.5-flash
```

---

## 4. Running the Development Servers

From the root `zeno/` directory:

```bash
npm run dev
```

This starts:
- **Backend API & WebSocket Server** on `http://localhost:5000`
- **Frontend Web Dashboard** on `http://localhost:5173`

Open **`http://localhost:5173`** in Google Chrome or Microsoft Edge.

---

## 5. Testing the Control Center

1. **Check System Status**: Look at the 6 cards on the Home screen to confirm device, mic, AI, speaker, and battery states.
2. **Launch Presentation Demo**: Click **[START DEMO]** in the top right to simulate an end-to-end question and vocal answer sequence.
3. **Talk to ZENO**: Click **Talk**, press **START TALKING**, and ask questions (e.g., *"What is an ESP32?"* or *"What is thermodynamics?"*).
4. **Teach ZENO**: Go to **Teach ZENO** to add new facts, upload documents, or configure exact Q&A pairs.
5. **Control the 16x2 LCD**: Go to **Device**, enter custom text in Line 1 / Line 2, and click **SHOW ON ZENO**.
