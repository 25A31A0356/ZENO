import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

export const CONFIG = {
  port: parseInt(process.env.PORT || '5000', 10),
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
  geminiApiKey: process.env.GEMINI_API_KEY || '',
  aiProvider: process.env.AI_PROVIDER || 'gemini',
  aiModel: process.env.AI_MODEL || 'gemini-1.5-flash',
  aiTemperature: parseFloat(process.env.AI_TEMPERATURE || '0.7'),
  esp32TimeoutMs: parseInt(process.env.ESP32_HEARTBEAT_TIMEOUT_MS || '15000', 10),
  deviceName: process.env.DEVICE_NAME || 'ZENO',
  dataDir: path.resolve(process.cwd(), process.env.DATA_DIR || './data'),
};
