# ZENO REST & WebSocket API Reference

The ZENO backend provides comprehensive REST endpoints and real-time WebSocket channels for ESP32 hardware and the Web Control Dashboard.

---

## 1. System Status & Health

### `GET /api/status`
Returns high-level system status, current pipeline state, and device telemetry.
```json
{
  "name": "ZENO",
  "tagline": "Listen. Think. Respond.",
  "overallStatus": "ONLINE",
  "state": "IDLE",
  "device": { ... },
  "alertsCount": 0
}
```

### `GET /api/system/health`
Detailed subsystem status (ESP32, Wi-Fi, Backend, STT, AI, TTS, Database) and performance metrics.

---

## 2. Device Control & Hardware

### `GET /api/device`
Returns current ESP32 telemetry (IP, Wi-Fi RSSI, uptime, battery voltage/percentage, LCD lines).

### `POST /api/device/heartbeat`
ESP32 heartbeat endpoint. Updates last seen timestamp and telemetry.

### `POST /api/device/lcd`
Updates the 16x2 LCD display.
```json
{
  "line1": "ZENO",
  "line2": "Listening..."
}
```

### `POST /api/device/test-speaker`
Dispatches a test tone to the hardware amplifier (`channel`: `"left" | "right" | "both"`, `volume`: `0-100`).

### `POST /api/device/test-mic`
Initiates a microphone test.

### `POST /api/device/restart`
Sends a soft reboot command to the microcontroller.

---

## 3. AI & Chat

### `POST /api/chat`
Submits a query to the ZENO AI reasoning pipeline with RAG context retrieval.
```json
{
  "query": "What is thermodynamics?",
  "source": "voice"
}
```
**Response:**
```json
{
  "conversation": {
    "id": "conv-12345",
    "userQuery": "What is thermodynamics?",
    "zenoResponse": "Thermodynamics is the branch of physics...",
    "responseTimeMs": 1150
  },
  "sources": [...]
}
```

---

## 4. Teach ZENO (Knowledge Base & RAG)

### `GET /api/knowledge`
Retrieves all taught knowledge entries.

### `POST /api/knowledge`
Adds new knowledge item (`title`, `category`, `information`, `tags`).

### `DELETE /api/knowledge/:id`
Deletes a knowledge item.

### `POST /api/documents`
Multipart document upload (`document` file buffer: PDF, TXT, CSV, DOCX, Markdown). Parses and indexes content into knowledge chunks.

### `GET /api/qa` & `POST /api/qa`
Manages direct Question & Answer pairs.

---

## 5. Conversations History

### `GET /api/conversations?limit=50`
Returns recent conversation history.

### `DELETE /api/conversations/:id`
Deletes an individual conversation.

### `DELETE /api/conversations`
Clears all conversation history.

---

## 6. Vision (Multimodal AI)

### `POST /api/vision/analyze`
Submits a base64 frame for AI optical inspection.
```json
{
  "image": "data:image/jpeg;base64,...",
  "question": "What is this object?"
}
```

---

## 7. Real-time WebSocket Protocol (`/ws`)

Connect to `ws://localhost:5000/ws` (or with `?client=esp32` for physical devices).

### Outbound Events from Server:
- `STATE_CHANGE`: `{ "type": "STATE_CHANGE", "state": "LISTENING" | "THINKING" | "SPEAKING" | "IDLE", "transcript": "..." }`
- `DEVICE_UPDATE`: `{ "type": "DEVICE_UPDATE", "device": { ... } }`
- `AUDIO_LEVEL`: `{ "type": "AUDIO_LEVEL", "level": 45 }`

### Inbound Events to Server:
- `ESP32_TELEMETRY`: Telemetry payload from microcontroller.
- `LCD_UPDATE`: `{ "type": "LCD_UPDATE", "line1": "...", "line2": "..." }`
- `TEST_SPEAKER`: `{ "type": "TEST_SPEAKER", "channel": "both", "volume": 80 }`
