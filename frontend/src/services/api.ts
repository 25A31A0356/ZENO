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

export const api = {
  // Status & Health
  async getStatus() {
    const res = await fetch(`${API_BASE}/status`);
    return res.json();
  },

  async getHealth(): Promise<SystemHealth> {
    const res = await fetch(`${API_BASE}/system/health`);
    return res.json();
  },

  // Device & Telemetry
  async getDevice(): Promise<DeviceTelemetry> {
    const res = await fetch(`${API_BASE}/device`);
    return res.json();
  },

  async updateLcd(line1: string, line2: string) {
    const res = await fetch(`${API_BASE}/device/lcd`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ line1, line2 }),
    });
    return res.json();
  },

  async testSpeaker(channel: 'left' | 'right' | 'both' = 'both', volume = 80) {
    const res = await fetch(`${API_BASE}/device/test-speaker`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ channel, volume }),
    });
    return res.json();
  },

  async testMicrophone() {
    const res = await fetch(`${API_BASE}/device/test-mic`, {
      method: 'POST',
    });
    return res.json();
  },

  async testDisplay() {
    const res = await fetch(`${API_BASE}/device/test-display`, {
      method: 'POST',
    });
    return res.json();
  },

  async restartDevice() {
    const res = await fetch(`${API_BASE}/device/restart`, {
      method: 'POST',
    });
    return res.json();
  },

  // Chat & AI
  async sendChat(query: string, source: 'voice' | 'text' | 'demo' = 'text'): Promise<{ conversation: Conversation; sources?: any[] }> {
    const res = await fetch(`${API_BASE}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, source }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to send chat');
    }
    return res.json();
  },

  // Conversations History
  async getConversations(limit = 50): Promise<Conversation[]> {
    const res = await fetch(`${API_BASE}/conversations?limit=${limit}`);
    return res.json();
  },

  async deleteConversation(id: string) {
    const res = await fetch(`${API_BASE}/conversations/${id}`, {
      method: 'DELETE',
    });
    return res.json();
  },

  async clearConversations() {
    const res = await fetch(`${API_BASE}/conversations`, {
      method: 'DELETE',
    });
    return res.json();
  },

  // Teach ZENO (Knowledge)
  async getKnowledge(): Promise<KnowledgeItem[]> {
    const res = await fetch(`${API_BASE}/knowledge`);
    return res.json();
  },

  async addKnowledge(item: { title: string; category: string; information: string; tags: string[] }): Promise<KnowledgeItem> {
    const res = await fetch(`${API_BASE}/knowledge`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(item),
    });
    return res.json();
  },

  async updateKnowledge(id: string, item: Partial<KnowledgeItem>): Promise<KnowledgeItem> {
    const res = await fetch(`${API_BASE}/knowledge/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(item),
    });
    return res.json();
  },

  async deleteKnowledge(id: string) {
    const res = await fetch(`${API_BASE}/knowledge/${id}`, {
      method: 'DELETE',
    });
    return res.json();
  },

  // Documents
  async getDocuments(): Promise<DocumentItem[]> {
    const res = await fetch(`${API_BASE}/documents`);
    return res.json();
  },

  async uploadDocument(file: File): Promise<{ success: boolean; document: DocumentItem; message: string }> {
    const formData = new FormData();
    formData.append('document', file);
    const res = await fetch(`${API_BASE}/documents`, {
      method: 'POST',
      body: formData,
    });
    return res.json();
  },

  async deleteDocument(id: string) {
    const res = await fetch(`${API_BASE}/documents/${id}`, {
      method: 'DELETE',
    });
    return res.json();
  },

  // Q&A
  async getQA(): Promise<QAItem[]> {
    const res = await fetch(`${API_BASE}/qa`);
    return res.json();
  },

  async addQA(qa: { question: string; answer: string; category: string }): Promise<QAItem> {
    const res = await fetch(`${API_BASE}/qa`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(qa),
    });
    return res.json();
  },

  async deleteQA(id: string) {
    const res = await fetch(`${API_BASE}/qa/${id}`, {
      method: 'DELETE',
    });
    return res.json();
  },

  // Settings
  async getSettings(): Promise<Settings> {
    const res = await fetch(`${API_BASE}/settings`);
    return res.json();
  },

  async updateSettings(settings: Partial<Settings>): Promise<Settings> {
    const res = await fetch(`${API_BASE}/settings`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings),
    });
    return res.json();
  },

  // Logs & Alerts
  async getLogs(limit = 100): Promise<SystemLog[]> {
    const res = await fetch(`${API_BASE}/logs?limit=${limit}`);
    return res.json();
  },

  async clearLogs() {
    const res = await fetch(`${API_BASE}/logs`, { method: 'DELETE' });
    return res.json();
  },

  async getAlerts(): Promise<SystemAlert[]> {
    const res = await fetch(`${API_BASE}/alerts`);
    return res.json();
  },

  async resolveAlert(id: string) {
    const res = await fetch(`${API_BASE}/alerts/${id}/resolve`, {
      method: 'POST',
    });
    return res.json();
  },

  // Vision
  async analyzeVision(image: string, question: string) {
    const res = await fetch(`${API_BASE}/vision/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image, question }),
    });
    return res.json();
  },

  // Presentation Demo
  async runDemo() {
    const res = await fetch(`${API_BASE}/demo/run`, {
      method: 'POST',
    });
    return res.json();
  },
};
