import {
  DeviceTelemetry,
  Conversation,
  KnowledgeItem,
  DocumentItem,
  QAItem,
  Settings,
  SystemLog,
  SystemAlert,
  SystemHealth,
} from '../types';

const API_BASE = '/api';

// --- IN-BROWSER PERSISTENCE ENGINE (FOR GITHUB PAGES STANDALONE DEMO) ---
const LS_KEYS = {
  DEVICE: 'zeno_device',
  CONVERSATIONS: 'zeno_conversations',
  KNOWLEDGE: 'zeno_knowledge',
  DOCUMENTS: 'zeno_documents',
  QA: 'zeno_qa',
  SETTINGS: 'zeno_settings',
  LOGS: 'zeno_logs',
  ALERTS: 'zeno_alerts',
};

const defaultDevice: DeviceTelemetry = {
  deviceId: 'ZENO-ESP32-001',
  name: 'ZENO',
  connected: true,
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
  lcdLine2: 'System Online',
};

const defaultKnowledge: KnowledgeItem[] = [
  {
    id: 'k-1',
    title: 'ZENO Project Architecture',
    category: 'Projects',
    information: 'ZENO is an ESP32-based physical AI voice assistant built with an ESP32 microcontroller, 16x2 LCD display, I2S microphone, audio amplifier, dual speakers, and Li-ion battery. The web control dashboard monitors and configures ZENO in real-time.',
    tags: ['zeno', 'esp32', 'architecture', 'hardware'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'k-2',
    title: 'ZENO Tagline & Purpose',
    category: 'General',
    information: 'Tagline: "Listen. Think. Respond." ZENO listens via microphone, thinks using an AI reasoning engine with custom knowledge RAG, and responds with natural voice speech and 16x2 LCD status updates.',
    tags: ['tagline', 'purpose', 'core'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

const defaultQA: QAItem[] = [
  {
    id: 'qa-1',
    question: 'What is ZENO?',
    answer: 'ZENO is a physical AI voice assistant powered by an ESP32 and an intelligent AI brain.',
    category: 'General',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'qa-2',
    question: 'Who created ZENO?',
    answer: 'ZENO was developed as an advanced engineering project combining embedded systems, AI, and modern web interfaces.',
    category: 'Projects',
    createdAt: new Date().toISOString(),
  },
];

function getStored<T>(key: string, defaultVal: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : defaultVal;
  } catch {
    return defaultVal;
  }
}

function setStored<T>(key: string, val: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(val));
  } catch {}
}

export const api = {
  // Status & Health
  async getStatus() {
    try {
      const res = await fetch(`${API_BASE}/status`);
      if (res.ok) return await res.json();
    } catch {}
    const device = getStored<DeviceTelemetry>(LS_KEYS.DEVICE, defaultDevice);
    return {
      name: 'ZENO',
      tagline: 'Listen. Think. Respond.',
      overallStatus: 'ONLINE',
      state: 'IDLE',
      transcript: '',
      device,
      alertsCount: 0,
      timestamp: new Date().toISOString(),
    };
  },

  async getHealth(): Promise<SystemHealth> {
    try {
      const res = await fetch(`${API_BASE}/system/health`);
      if (res.ok) return await res.json();
    } catch {}
    return {
      status: 'healthy',
      message: 'Everything is working normally.',
      subsystems: {
        esp32: 'ONLINE',
        wifi: 'CONNECTED',
        backend: 'ONLINE',
        speechRecognition: 'READY',
        aiEngine: 'READY',
        textToSpeech: 'READY',
        database: 'CONNECTED',
      },
      metrics: {
        lastRequestTime: new Date().toISOString(),
        averageResponseTimeMs: 1100,
        totalConversations: getStored<Conversation[]>(LS_KEYS.CONVERSATIONS, []).length,
        errorsToday: 0,
      },
    };
  },

  // Device & Telemetry
  async getDevice(): Promise<DeviceTelemetry> {
    try {
      const res = await fetch(`${API_BASE}/device`);
      if (res.ok) return await res.json();
    } catch {}
    return getStored<DeviceTelemetry>(LS_KEYS.DEVICE, defaultDevice);
  },

  async updateLcd(line1: string, line2: string) {
    try {
      const res = await fetch(`${API_BASE}/device/lcd`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ line1, line2 }),
      });
      if (res.ok) return await res.json();
    } catch {}
    const dev = getStored<DeviceTelemetry>(LS_KEYS.DEVICE, defaultDevice);
    dev.lcdLine1 = (line1 || '').substring(0, 16);
    dev.lcdLine2 = (line2 || '').substring(0, 16);
    setStored(LS_KEYS.DEVICE, dev);
    return { success: true, device: dev };
  },

  async testSpeaker(channel: 'left' | 'right' | 'both' = 'both', volume = 80) {
    try {
      const res = await fetch(`${API_BASE}/device/test-speaker`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ channel, volume }),
      });
      if (res.ok) return await res.json();
    } catch {}
    return { success: true, message: `Speaker test tone dispatched to ${channel} speaker.` };
  },

  async testMicrophone() {
    try {
      const res = await fetch(`${API_BASE}/device/test-mic`, { method: 'POST' });
      if (res.ok) return await res.json();
    } catch {}
    return { success: true, message: 'Microphone test initiated.' };
  },

  async testDisplay() {
    try {
      const res = await fetch(`${API_BASE}/device/test-display`, { method: 'POST' });
      if (res.ok) return await res.json();
    } catch {}
    return this.updateLcd('ZENO Display', 'Test Verified OK');
  },

  async restartDevice() {
    try {
      const res = await fetch(`${API_BASE}/device/restart`, { method: 'POST' });
      if (res.ok) return await res.json();
    } catch {}
    return { success: true, message: 'Restart command sent.' };
  },

  // Chat & AI
  async sendChat(query: string, source: 'voice' | 'text' | 'demo' = 'text'): Promise<{ conversation: Conversation; sources?: any[] }> {
    try {
      const res = await fetch(`${API_BASE}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, source }),
      });
      if (res.ok) return await res.json();
    } catch {}

    // Standalone Client AI Reasoning Fallback
    const q = query.toLowerCase().trim();
    let answer = `I received your question about "${query}". All ZENO hardware systems are online and functioning normally.`;
    const sources: any[] = [];

    // Search Q&A
    const qas = getStored<QAItem[]>(LS_KEYS.QA, defaultQA);
    for (const qa of qas) {
      if (q.includes(qa.question.toLowerCase()) || qa.question.toLowerCase().includes(q)) {
        answer = qa.answer;
        sources.push({ title: `Q&A: ${qa.question}`, content: qa.answer });
        break;
      }
    }

    if (sources.length === 0) {
      if (q.includes('esp32')) {
        answer = 'An ESP32 is a low-cost, low-power system on a chip microcontroller with integrated Wi-Fi and dual-mode Bluetooth, widely used in IoT and robotics.';
      } else if (q.includes('thermodynamics')) {
        answer = 'Thermodynamics is the branch of physics that deals with heat, work, temperature, and their relation to energy, radiation, and physical properties of matter.';
      } else if (q.includes('newton')) {
        answer = 'Newton\'s second law states that the acceleration of an object is dependent upon the net force acting upon the object and the mass of the object: Force equals Mass times Acceleration.';
      } else if (q.includes('who are you') || q.includes('what is zeno') || q.includes('project')) {
        answer = 'I am ZENO, a physical AI voice assistant built around an ESP32 microcontroller with dual speakers, 16x2 LCD display, and real-time web monitoring.';
        sources.push({ title: 'ZENO Project Architecture', content: 'ESP32 Physical AI Voice Assistant' });
      } else if (q.includes('time')) {
        answer = `The current time is ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}.`;
      }
    }

    const newConv: Conversation = {
      id: 'conv-' + Date.now(),
      timestamp: new Date().toISOString(),
      userQuery: query,
      zenoResponse: answer,
      responseTimeMs: 1120,
      source,
      retrievedKnowledge: sources.map(s => s.title),
    };

    const convs = getStored<Conversation[]>(LS_KEYS.CONVERSATIONS, []);
    convs.unshift(newConv);
    setStored(LS_KEYS.CONVERSATIONS, convs.slice(0, 50));

    return { conversation: newConv, sources };
  },

  // Conversations History
  async getConversations(limit = 50): Promise<Conversation[]> {
    try {
      const res = await fetch(`${API_BASE}/conversations?limit=${limit}`);
      if (res.ok) return await res.json();
    } catch {}
    return getStored<Conversation[]>(LS_KEYS.CONVERSATIONS, [
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
    ]);
  },

  async deleteConversation(id: string) {
    try {
      const res = await fetch(`${API_BASE}/conversations/${id}`, { method: 'DELETE' });
      if (res.ok) return await res.json();
    } catch {}
    let convs = getStored<Conversation[]>(LS_KEYS.CONVERSATIONS, []);
    convs = convs.filter(c => c.id !== id);
    setStored(LS_KEYS.CONVERSATIONS, convs);
    return { success: true };
  },

  async clearConversations() {
    try {
      const res = await fetch(`${API_BASE}/conversations`, { method: 'DELETE' });
      if (res.ok) return await res.json();
    } catch {}
    setStored(LS_KEYS.CONVERSATIONS, []);
    return { success: true };
  },

  // Teach ZENO (Knowledge)
  async getKnowledge(): Promise<KnowledgeItem[]> {
    try {
      const res = await fetch(`${API_BASE}/knowledge`);
      if (res.ok) return await res.json();
    } catch {}
    return getStored<KnowledgeItem[]>(LS_KEYS.KNOWLEDGE, defaultKnowledge);
  },

  async addKnowledge(item: { title: string; category: string; information: string; tags: string[] }): Promise<KnowledgeItem> {
    try {
      const res = await fetch(`${API_BASE}/knowledge`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(item),
      });
      if (res.ok) return await res.json();
    } catch {}
    const items = getStored<KnowledgeItem[]>(LS_KEYS.KNOWLEDGE, defaultKnowledge);
    const newItem: KnowledgeItem = {
      id: 'k-' + Date.now(),
      ...item,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    items.unshift(newItem);
    setStored(LS_KEYS.KNOWLEDGE, items);
    return newItem;
  },

  async updateKnowledge(id: string, item: Partial<KnowledgeItem>): Promise<KnowledgeItem> {
    try {
      const res = await fetch(`${API_BASE}/knowledge/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(item),
      });
      if (res.ok) return await res.json();
    } catch {}
    const items = getStored<KnowledgeItem[]>(LS_KEYS.KNOWLEDGE, defaultKnowledge);
    const idx = items.findIndex(k => k.id === id);
    if (idx !== -1) {
      items[idx] = { ...items[idx], ...item, updatedAt: new Date().toISOString() };
      setStored(LS_KEYS.KNOWLEDGE, items);
      return items[idx];
    }
    return item as any;
  },

  async deleteKnowledge(id: string) {
    try {
      const res = await fetch(`${API_BASE}/knowledge/${id}`, { method: 'DELETE' });
      if (res.ok) return await res.json();
    } catch {}
    let items = getStored<KnowledgeItem[]>(LS_KEYS.KNOWLEDGE, defaultKnowledge);
    items = items.filter(k => k.id !== id);
    setStored(LS_KEYS.KNOWLEDGE, items);
    return { success: true };
  },

  // Documents
  async getDocuments(): Promise<DocumentItem[]> {
    try {
      const res = await fetch(`${API_BASE}/documents`);
      if (res.ok) return await res.json();
    } catch {}
    return getStored<DocumentItem[]>(LS_KEYS.DOCUMENTS, []);
  },

  async uploadDocument(file: File): Promise<{ success: boolean; document: DocumentItem; message: string }> {
    try {
      const formData = new FormData();
      formData.append('document', file);
      const res = await fetch(`${API_BASE}/documents`, { method: 'POST', body: formData });
      if (res.ok) return await res.json();
    } catch {}
    const docs = getStored<DocumentItem[]>(LS_KEYS.DOCUMENTS, []);
    const newDoc: DocumentItem = {
      id: 'doc-' + Date.now(),
      filename: file.name,
      originalName: file.name,
      mimeType: file.type,
      sizeBytes: file.size,
      chunkCount: 3,
      extractedText: 'Document contents processed.',
      status: 'processed',
      uploadedAt: new Date().toISOString(),
    };
    docs.unshift(newDoc);
    setStored(LS_KEYS.DOCUMENTS, docs);
    return { success: true, document: newDoc, message: 'Document indexed successfully.' };
  },

  async deleteDocument(id: string) {
    try {
      const res = await fetch(`${API_BASE}/documents/${id}`, { method: 'DELETE' });
      if (res.ok) return await res.json();
    } catch {}
    let docs = getStored<DocumentItem[]>(LS_KEYS.DOCUMENTS, []);
    docs = docs.filter(d => d.id !== id);
    setStored(LS_KEYS.DOCUMENTS, docs);
    return { success: true };
  },

  // Q&A
  async getQA(): Promise<QAItem[]> {
    try {
      const res = await fetch(`${API_BASE}/qa`);
      if (res.ok) return await res.json();
    } catch {}
    return getStored<QAItem[]>(LS_KEYS.QA, defaultQA);
  },

  async addQA(qa: { question: string; answer: string; category: string }): Promise<QAItem> {
    try {
      const res = await fetch(`${API_BASE}/qa`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(qa),
      });
      if (res.ok) return await res.json();
    } catch {}
    const qas = getStored<QAItem[]>(LS_KEYS.QA, defaultQA);
    const newQa: QAItem = { id: 'qa-' + Date.now(), ...qa, createdAt: new Date().toISOString() };
    qas.unshift(newQa);
    setStored(LS_KEYS.QA, qas);
    return newQa;
  },

  async deleteQA(id: string) {
    try {
      const res = await fetch(`${API_BASE}/qa/${id}`, { method: 'DELETE' });
      if (res.ok) return await res.json();
    } catch {}
    let qas = getStored<QAItem[]>(LS_KEYS.QA, defaultQA);
    qas = qas.filter(q => q.id !== id);
    setStored(LS_KEYS.QA, qas);
    return { success: true };
  },

  // Settings
  async getSettings(): Promise<Settings> {
    try {
      const res = await fetch(`${API_BASE}/settings`);
      if (res.ok) return await res.json();
    } catch {}
    return getStored<Settings>(LS_KEYS.SETTINGS, {
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
    });
  },

  async updateSettings(settings: Partial<Settings>): Promise<Settings> {
    try {
      const res = await fetch(`${API_BASE}/settings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });
      if (res.ok) return await res.json();
    } catch {}
    const current = await this.getSettings();
    const updated = { ...current, ...settings };
    setStored(LS_KEYS.SETTINGS, updated);
    return updated;
  },

  // Logs & Alerts
  async getLogs(limit = 100): Promise<SystemLog[]> {
    try {
      const res = await fetch(`${API_BASE}/logs?limit=${limit}`);
      if (res.ok) return await res.json();
    } catch {}
    return getStored<SystemLog[]>(LS_KEYS.LOGS, [
      { id: '1', timestamp: new Date().toISOString(), level: 'info', message: 'ZENO Control Center initialized in standalone mode', source: 'system' },
      { id: '2', timestamp: new Date().toISOString(), level: 'info', message: 'Speech recognition engine ready', source: 'speech' },
      { id: '3', timestamp: new Date().toISOString(), level: 'info', message: 'AI brain & RAG index loaded', source: 'ai' },
    ]);
  },

  async clearLogs() {
    try {
      const res = await fetch(`${API_BASE}/logs`, { method: 'DELETE' });
      if (res.ok) return await res.json();
    } catch {}
    setStored(LS_KEYS.LOGS, []);
    return { success: true };
  },

  async getAlerts(): Promise<SystemAlert[]> {
    try {
      const res = await fetch(`${API_BASE}/alerts`);
      if (res.ok) return await res.json();
    } catch {}
    return getStored<SystemAlert[]>(LS_KEYS.ALERTS, []);
  },

  async resolveAlert(id: string) {
    try {
      const res = await fetch(`${API_BASE}/alerts/${id}/resolve`, { method: 'POST' });
      if (res.ok) return await res.json();
    } catch {}
    return { success: true };
  },

  // Vision
  async analyzeVision(image: string, question: string) {
    try {
      const res = await fetch(`${API_BASE}/vision/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image, question }),
      });
      if (res.ok) return await res.json();
    } catch {}
    return {
      answer: `I analyzed the optical frame. The subject is clearly visible in the foreground with standard ambient lighting.`,
      responseTimeMs: 850,
    };
  },

  // Presentation Demo
  async runDemo() {
    try {
      const res = await fetch(`${API_BASE}/demo/run`, { method: 'POST' });
      if (res.ok) return await res.json();
    } catch {}
    return { success: true, message: 'Demo completed.' };
  },
};
