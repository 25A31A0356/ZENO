export type ZenoActivityState = 'IDLE' | 'LISTENING' | 'THINKING' | 'SPEAKING' | 'OFFLINE' | 'ERROR';

export interface DeviceTelemetry {
  deviceId: string;
  name: string;
  connected: boolean;
  ipAddress: string;
  wifiSsid: string;
  wifiRssi: number;
  firmwareVersion: string;
  uptimeSeconds: number;
  batteryPercentage: number;
  batteryVoltage: number;
  isCharging: boolean;
  micReady: boolean;
  speakerReady: boolean;
  lcdReady: boolean;
  lastSeen: string;
  lcdLine1: string;
  lcdLine2: string;
}

export interface Conversation {
  id: string;
  timestamp: string;
  userQuery: string;
  zenoResponse: string;
  responseTimeMs: number;
  source: 'voice' | 'text' | 'vision' | 'demo';
  retrievedKnowledge?: string[];
  audioUrl?: string;
}

export interface KnowledgeItem {
  id: string;
  title: string;
  category: string;
  information: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface DocumentItem {
  id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
  chunkCount: number;
  extractedText: string;
  status: 'processed' | 'processing' | 'failed';
  uploadedAt: string;
}

export interface QAItem {
  id: string;
  question: string;
  answer: string;
  category: string;
  createdAt: string;
}

export interface Settings {
  name: string;
  wakePhrase: string;
  responseStyle: 'short' | 'normal' | 'detailed';
  personality: 'friendly' | 'helpful' | 'technical';
  voiceId: string;
  speechSpeed: number;
  volume: number;
  aiProvider: string;
  aiModel: string;
  temperature: number;
  storeAudio: boolean;
  enableCamera: boolean;
  beginnerMode: boolean;
}

export interface SystemLog {
  id: string;
  timestamp: string;
  level: 'info' | 'warn' | 'error' | 'debug';
  message: string;
  source: 'esp32' | 'backend' | 'ai' | 'speech' | 'tts' | 'system' | 'vision';
}

export interface SystemAlert {
  id: string;
  timestamp: string;
  level: 'warning' | 'error';
  title: string;
  message: string;
  meaning: string;
  fixes: string[];
  resolved: boolean;
}

export interface SystemHealth {
  status: string;
  message: string;
  subsystems: {
    esp32: 'ONLINE' | 'OFFLINE';
    wifi: 'CONNECTED' | 'DISCONNECTED';
    backend: 'ONLINE' | 'OFFLINE';
    speechRecognition: 'READY' | 'DEGRADED' | 'OFFLINE';
    aiEngine: 'READY' | 'DEGRADED' | 'OFFLINE';
    textToSpeech: 'READY' | 'DEGRADED' | 'OFFLINE';
    database: 'CONNECTED' | 'DISCONNECTED';
  };
  metrics: {
    lastRequestTime: string;
    averageResponseTimeMs: number;
    totalConversations: number;
    errorsToday: number;
  };
}
