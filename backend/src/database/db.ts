import fs from 'fs';
import path from 'path';
import { CONFIG } from '../config.js';

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

interface DatabaseSchema {
  device: DeviceTelemetry;
  conversations: Conversation[];
  knowledge: KnowledgeItem[];
  documents: DocumentItem[];
  qa: QAItem[];
  settings: Settings;
  logs: SystemLog[];
  alerts: SystemAlert[];
}

class Database {
  private filePath: string;
  private data: DatabaseSchema;

  constructor() {
    if (!fs.existsSync(CONFIG.dataDir)) {
      fs.mkdirSync(CONFIG.dataDir, { recursive: true });
    }
    this.filePath = path.join(CONFIG.dataDir, 'zeno_db.json');
    this.data = this.loadData();
  }

  private getDefaultData(): DatabaseSchema {
    return {
      device: {
        deviceId: 'ZENO-ESP32-001',
        name: CONFIG.deviceName,
        connected: false,
        ipAddress: '192.168.1.145',
        wifiSsid: 'ZENO_Mesh_2.4G',
        wifiRssi: -58,
        firmwareVersion: 'v1.0.0-release',
        uptimeSeconds: 15780,
        batteryPercentage: 82,
        batteryVoltage: 3.92,
        isCharging: false,
        micReady: true,
        speakerReady: true,
        lcdReady: true,
        lastSeen: new Date().toISOString(),
        lcdLine1: 'ZENO',
        lcdLine2: 'Ready...',
      },
      conversations: [
        {
          id: 'conv-1',
          timestamp: new Date(Date.now() - 1000 * 60 * 2).toISOString(),
          userQuery: 'What is an ESP32?',
          zenoResponse: 'An ESP32 is a low-cost, low-power system on a chip microcontroller with integrated Wi-Fi and dual-mode Bluetooth.',
          responseTimeMs: 1150,
          source: 'voice',
        },
        {
          id: 'conv-2',
          timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
          userQuery: 'Tell me about the ZENO project.',
          zenoResponse: 'ZENO is an ESP32-based physical AI voice assistant featuring an LCD display, dual speaker audio amplifier, and interactive web dashboard.',
          responseTimeMs: 980,
          source: 'voice',
          retrievedKnowledge: ['ZENO Project Architecture'],
        },
      ],
      knowledge: [
        {
          id: 'k-1',
          title: 'ZENO Project Architecture',
          category: 'Projects',
          information: 'ZENO is an ESP32-based physical AI voice assistant built with an ESP32 microcontroller, 16x2 LCD display, I2S microphone, audio amplifier, dual speakers, and Li-ion battery. The web control dashboard monitors and configures ZENO in real-time.',
          tags: ['zeno', 'esp32', 'architecture', 'hardware'],
          createdAt: new Date(Date.now() - 86400000).toISOString(),
          updatedAt: new Date(Date.now() - 86400000).toISOString(),
        },
        {
          id: 'k-2',
          title: 'ZENO Tagline & Purpose',
          category: 'General',
          information: 'Tagline: "Listen. Think. Respond." ZENO listens via microphone, thinks using an AI reasoning engine with custom knowledge RAG, and responds with natural voice speech and 16x2 LCD status updates.',
          tags: ['tagline', 'purpose', 'core'],
          createdAt: new Date(Date.now() - 86400000).toISOString(),
          updatedAt: new Date(Date.now() - 86400000).toISOString(),
        },
      ],
      documents: [],
      qa: [
        {
          id: 'qa-1',
          question: 'What is ZENO?',
          answer: 'ZENO is a physical AI voice assistant powered by an ESP32 and an intelligent AI brain.',
          category: 'General',
          createdAt: new Date(Date.now() - 86400000).toISOString(),
        },
        {
          id: 'qa-2',
          question: 'Who created ZENO?',
          answer: 'ZENO was developed as an advanced engineering project combining embedded systems, AI, and modern web interfaces.',
          category: 'Projects',
          createdAt: new Date(Date.now() - 86400000).toISOString(),
        },
      ],
      settings: {
        name: 'ZENO',
        wakePhrase: 'Hey ZENO',
        responseStyle: 'short',
        personality: 'friendly',
        voiceId: 'alloy',
        speechSpeed: 1.0,
        volume: 85,
        aiProvider: 'gemini',
        aiModel: 'gemini-1.5-flash',
        temperature: 0.7,
        storeAudio: false,
        enableCamera: true,
        beginnerMode: true,
      },
      logs: [
        {
          id: 'log-1',
          timestamp: new Date(Date.now() - 1000 * 60 * 10).toISOString(),
          level: 'info',
          message: 'ZENO Control Center Server started on port ' + CONFIG.port,
          source: 'backend',
        },
        {
          id: 'log-2',
          timestamp: new Date(Date.now() - 1000 * 60 * 9).toISOString(),
          level: 'info',
          message: 'Knowledge base loaded with 2 initial entries',
          source: 'ai',
        },
      ],
      alerts: [],
    };
  }

  private loadData(): DatabaseSchema {
    try {
      if (fs.existsSync(this.filePath)) {
        const raw = fs.readFileSync(this.filePath, 'utf-8');
        return JSON.parse(raw);
      }
    } catch (e) {
      console.error('Error loading database, resetting to default:', e);
    }
    const defaultData = this.getDefaultData();
    this.saveData(defaultData);
    return defaultData;
  }

  private saveData(dataToSave?: DatabaseSchema) {
    try {
      fs.writeFileSync(this.filePath, JSON.stringify(dataToSave || this.data, null, 2), 'utf-8');
    } catch (e) {
      console.error('Failed to save database to disk:', e);
    }
  }

  // Device Methods
  getDevice(): DeviceTelemetry {
    return this.data.device;
  }

  updateDevice(partial: Partial<DeviceTelemetry>): DeviceTelemetry {
    this.data.device = {
      ...this.data.device,
      ...partial,
      lastSeen: new Date().toISOString(),
    };
    this.saveData();
    return this.data.device;
  }

  // Conversations
  getConversations(limit = 50): Conversation[] {
    return [...this.data.conversations]
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit);
  }

  addConversation(conv: Omit<Conversation, 'id' | 'timestamp'>): Conversation {
    const newConv: Conversation = {
      ...conv,
      id: 'conv-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
      timestamp: new Date().toISOString(),
    };
    this.data.conversations.unshift(newConv);
    // Keep max 200 conversations
    if (this.data.conversations.length > 200) {
      this.data.conversations = this.data.conversations.slice(0, 200);
    }
    this.saveData();
    return newConv;
  }

  deleteConversation(id: string): boolean {
    const prevLen = this.data.conversations.length;
    this.data.conversations = this.data.conversations.filter(c => c.id !== id);
    if (this.data.conversations.length !== prevLen) {
      this.saveData();
      return true;
    }
    return false;
  }

  clearConversations(): void {
    this.data.conversations = [];
    this.saveData();
  }

  // Knowledge Items
  getKnowledge(): KnowledgeItem[] {
    return this.data.knowledge;
  }

  addKnowledge(item: Omit<KnowledgeItem, 'id' | 'createdAt' | 'updatedAt'>): KnowledgeItem {
    const newItem: KnowledgeItem = {
      ...item,
      id: 'k-' + Date.now(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.data.knowledge.unshift(newItem);
    this.saveData();
    return newItem;
  }

  updateKnowledge(id: string, item: Partial<Omit<KnowledgeItem, 'id' | 'createdAt'>>): KnowledgeItem | null {
    const index = this.data.knowledge.findIndex(k => k.id === id);
    if (index === -1) return null;
    this.data.knowledge[index] = {
      ...this.data.knowledge[index],
      ...item,
      updatedAt: new Date().toISOString(),
    };
    this.saveData();
    return this.data.knowledge[index];
  }

  deleteKnowledge(id: string): boolean {
    const prev = this.data.knowledge.length;
    this.data.knowledge = this.data.knowledge.filter(k => k.id !== id);
    if (this.data.knowledge.length !== prev) {
      this.saveData();
      return true;
    }
    return false;
  }

  // Documents
  getDocuments(): DocumentItem[] {
    return this.data.documents;
  }

  addDocument(doc: Omit<DocumentItem, 'id' | 'uploadedAt'>): DocumentItem {
    const newDoc: DocumentItem = {
      ...doc,
      id: 'doc-' + Date.now(),
      uploadedAt: new Date().toISOString(),
    };
    this.data.documents.unshift(newDoc);
    this.saveData();
    return newDoc;
  }

  deleteDocument(id: string): boolean {
    const prev = this.data.documents.length;
    this.data.documents = this.data.documents.filter(d => d.id !== id);
    if (this.data.documents.length !== prev) {
      this.saveData();
      return true;
    }
    return false;
  }

  // Q&A
  getQA(): QAItem[] {
    return this.data.qa;
  }

  addQA(item: Omit<QAItem, 'id' | 'createdAt'>): QAItem {
    const newItem: QAItem = {
      ...item,
      id: 'qa-' + Date.now(),
      createdAt: new Date().toISOString(),
    };
    this.data.qa.unshift(newItem);
    this.saveData();
    return newItem;
  }

  deleteQA(id: string): boolean {
    const prev = this.data.qa.length;
    this.data.qa = this.data.qa.filter(q => q.id !== id);
    if (this.data.qa.length !== prev) {
      this.saveData();
      return true;
    }
    return false;
  }

  // Settings
  getSettings(): Settings {
    return this.data.settings;
  }

  updateSettings(partial: Partial<Settings>): Settings {
    this.data.settings = {
      ...this.data.settings,
      ...partial,
    };
    this.saveData();
    return this.data.settings;
  }

  // Logs
  getLogs(limit = 100): SystemLog[] {
    return [...this.data.logs]
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit);
  }

  addLog(log: Omit<SystemLog, 'id' | 'timestamp'>): SystemLog {
    const newLog: SystemLog = {
      ...log,
      id: 'log-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
      timestamp: new Date().toISOString(),
    };
    this.data.logs.unshift(newLog);
    if (this.data.logs.length > 500) {
      this.data.logs = this.data.logs.slice(0, 500);
    }
    this.saveData();
    return newLog;
  }

  clearLogs(): void {
    this.data.logs = [];
    this.saveData();
  }

  // Alerts
  getAlerts(): SystemAlert[] {
    return this.data.alerts;
  }

  addAlert(alert: Omit<SystemAlert, 'id' | 'timestamp' | 'resolved'>): SystemAlert {
    const newAlert: SystemAlert = {
      ...alert,
      id: 'alert-' + Date.now(),
      timestamp: new Date().toISOString(),
      resolved: false,
    };
    this.data.alerts.unshift(newAlert);
    this.saveData();
    return newAlert;
  }

  resolveAlert(id: string): boolean {
    const alert = this.data.alerts.find(a => a.id === id);
    if (alert) {
      alert.resolved = true;
      this.saveData();
      return true;
    }
    return false;
  }

  clearAlerts(): void {
    this.data.alerts = [];
    this.saveData();
  }
}

export const db = new Database();
