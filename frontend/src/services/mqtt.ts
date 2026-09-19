import mqtt, { MqttClient } from 'mqtt';

export type MqttConnectionStatus = 'DISCONNECTED' | 'CONNECTING' | 'CONNECTED' | 'ERROR' | 'RECONNECTING';

export interface MqttConfig {
  brokerUrl: string;
  username?: string;
  password?: string;
  deviceId: string;
}

export interface MqttTelemetry {
  online: boolean;
  wifi?: boolean;
  ip?: string;
  rssi?: number;
}

export interface MqttMicData {
  raw: number;
  percent: number;
}

export interface MqttLcdData {
  ok: boolean;
  line1: string;
  line2: string;
}

const STORAGE_KEY = 'zeno_mqtt_config';

const DEFAULT_CONFIG: MqttConfig = {
  brokerUrl: 'wss://2a44315fb0954566911359504d367ddf.s1.eu.hivemq.cloud:8884/mqtt',
  username: 'zeno_user',
  password: '123456789',
  deviceId: '001',
};

class MqttService {
  private client: MqttClient | null = null;
  private status: MqttConnectionStatus = 'DISCONNECTED';
  private config: MqttConfig = DEFAULT_CONFIG;
  private lastMessageTime = 0;
  private timeoutInterval: any = null;

  // Listeners
  private statusListeners: Set<(status: MqttConnectionStatus, error?: string) => void> = new Set();
  private telemetryListeners: Set<(data: MqttTelemetry) => void> = new Set();
  private micListeners: Set<(data: MqttMicData) => void> = new Set();
  private lcdListeners: Set<(data: MqttLcdData) => void> = new Set();
  private stateListeners: Set<(state: string) => void> = new Set();
  private rawLogListeners: Set<(log: { topic: string; message: string; time: string; type: 'in' | 'out' }) => void> = new Set();

  constructor() {
    this.loadConfig();
  }

  public isSupported(): boolean {
    return typeof WebSocket !== 'undefined';
  }

  public getConfig(): MqttConfig {
    return { ...this.config };
  }

  public saveConfig(newConfig: Partial<MqttConfig>) {
    this.config = { ...this.config, ...newConfig };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.config));
    } catch {}
  }

  private loadConfig() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        this.config = { ...DEFAULT_CONFIG, ...JSON.parse(stored) };
      }
    } catch {}
  }

  public getStatus(): MqttConnectionStatus {
    return this.status;
  }

  public isConnected(): boolean {
    return this.status === 'CONNECTED' && !!this.client?.connected;
  }

  public connect(customConfig?: Partial<MqttConfig>) {
    if (customConfig) {
      this.saveConfig(customConfig);
    }

    if (this.client) {
      try {
        this.client.end(true);
      } catch {}
      this.client = null;
    }

    this.setStatus('CONNECTING');

    const clientId = 'zeno_web_' + Math.random().toString(16).substring(2, 10);
    const options: mqtt.IClientOptions = {
      clientId,
      clean: true,
      reconnectPeriod: 4000,
      connectTimeout: 10000,
    };

    if (this.config.username && this.config.username.trim() !== '') {
      options.username = this.config.username.trim();
    }
    if (this.config.password && this.config.password.trim() !== '') {
      options.password = this.config.password.trim();
    }

    try {
      const client = mqtt.connect(this.config.brokerUrl, options);
      this.client = client;

      client.on('connect', () => {
        this.setStatus('CONNECTED');
        this.subscribeTopics();
        this.startTimeoutChecker();
      });

      client.on('error', (err) => {
        console.error('[ZENO MQTT] Error:', err);
        this.setStatus('ERROR', err.message || 'MQTT Connection Error');
      });

      client.on('close', () => {
        if (this.status === 'CONNECTED') {
          this.setStatus('RECONNECTING');
        }
      });

      client.on('offline', () => {
        this.setStatus('RECONNECTING');
      });

      client.on('message', (topic, payload) => {
        const text = payload.toString();
        this.lastMessageTime = Date.now();
        this.emitRawLog(topic, text, 'in');

        const deviceId = this.config.deviceId;
        const topicStatus = `zeno/${deviceId}/status`;
        const topicMic = `zeno/${deviceId}/mic`;
        const topicLcd = `zeno/${deviceId}/lcd`;
        const topicState = `zeno/${deviceId}/state`;

        if (topic === topicStatus) {
          try {
            const data: MqttTelemetry = JSON.parse(text);
            this.telemetryListeners.forEach(cb => cb(data));
          } catch {}
        } else if (topic === topicMic) {
          try {
            const data: MqttMicData = JSON.parse(text);
            this.micListeners.forEach(cb => cb(data));
          } catch {}
        } else if (topic === topicLcd) {
          try {
            const data: MqttLcdData = JSON.parse(text);
            this.lcdListeners.forEach(cb => cb(data));
          } catch {}
        } else if (topic === topicState) {
          this.stateListeners.forEach(cb => cb(text));
        }
      });
    } catch (err: any) {
      console.error('[ZENO MQTT] Connect error:', err);
      this.setStatus('ERROR', err?.message || 'Failed to initialize MQTT');
    }
  }

  private subscribeTopics() {
    if (!this.client || !this.client.connected) return;
    const deviceId = this.config.deviceId;
    const topics = [
      `zeno/${deviceId}/status`,
      `zeno/${deviceId}/mic`,
      `zeno/${deviceId}/lcd`,
      `zeno/${deviceId}/state`,
    ];
    this.client.subscribe(topics, (err) => {
      if (err) {
        console.warn('[ZENO MQTT] Subscribe failed:', err);
      } else {
        console.log('[ZENO MQTT] Subscribed to:', topics);
      }
    });
  }

  public disconnect() {
    this.stopTimeoutChecker();
    if (this.client) {
      try {
        this.client.end(true);
      } catch {}
      this.client = null;
    }
    this.setStatus('DISCONNECTED');
  }

  public sendCommand(command: string): boolean {
    if (!this.client || !this.client.connected) {
      return false;
    }
    const topic = `zeno/${this.config.deviceId}/command`;
    this.client.publish(topic, command);
    this.emitRawLog(topic, command, 'out');
    return true;
  }

  public sendTestLcd(): boolean {
    return this.sendCommand('LCD_TEST');
  }

  public sendTestMic(): boolean {
    return this.sendCommand('MIC_TEST');
  }

  public sendLcdText(line1: string, line2: string): boolean {
    const payload = JSON.stringify({
      line1: line1.substring(0, 16),
      line2: line2.substring(0, 16),
    });
    const topic = `zeno/${this.config.deviceId}/lcd`;
    if (this.client && this.client.connected) {
      this.client.publish(topic, payload);
      this.emitRawLog(topic, payload, 'out');
      return true;
    }
    return false;
  }

  private setStatus(status: MqttConnectionStatus, error?: string) {
    this.status = status;
    this.statusListeners.forEach(cb => cb(status, error));
  }

  private emitRawLog(topic: string, message: string, type: 'in' | 'out') {
    const log = {
      topic,
      message,
      time: new Date().toLocaleTimeString(),
      type,
    };
    this.rawLogListeners.forEach(cb => cb(log));
  }

  private startTimeoutChecker() {
    this.stopTimeoutChecker();
    this.timeoutInterval = setInterval(() => {
      if (this.lastMessageTime > 0 && Date.now() - this.lastMessageTime > 16000) {
        this.telemetryListeners.forEach(cb => cb({ online: false, wifi: false }));
      }
    }, 5000);
  }

  private stopTimeoutChecker() {
    if (this.timeoutInterval) {
      clearInterval(this.timeoutInterval);
      this.timeoutInterval = null;
    }
  }

  // Listener subscriptions
  public onStatusChange(cb: (status: MqttConnectionStatus, error?: string) => void) {
    this.statusListeners.add(cb);
    cb(this.status);
    return () => this.statusListeners.delete(cb);
  }

  public onTelemetry(cb: (data: MqttTelemetry) => void) {
    this.telemetryListeners.add(cb);
    return () => this.telemetryListeners.delete(cb);
  }

  public onMic(cb: (data: MqttMicData) => void) {
    this.micListeners.add(cb);
    return () => this.micListeners.delete(cb);
  }

  public onLcd(cb: (data: MqttLcdData) => void) {
    this.lcdListeners.add(cb);
    return () => this.lcdListeners.delete(cb);
  }

  public onState(cb: (state: string) => void) {
    this.stateListeners.add(cb);
    return () => this.stateListeners.delete(cb);
  }

  public onRawLog(cb: (log: { topic: string; message: string; time: string; type: 'in' | 'out' }) => void) {
    this.rawLogListeners.add(cb);
    return () => this.rawLogListeners.delete(cb);
  }
}

export const mqttService = new MqttService();
