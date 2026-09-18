import { WebSocketServer, WebSocket } from 'ws';
import type { Server } from 'http';
import { DeviceTelemetry } from '../database/db.js';

export class WebSocketService {
  private wss: WebSocketServer | null = null;
  private webClients: Set<WebSocket> = new Set();
  private esp32Clients: Set<WebSocket> = new Set();

  initialize(server: Server) {
    this.wss = new WebSocketServer({ server, path: '/ws' });

    this.wss.on('connection', (ws: WebSocket, req) => {
      const url = req.url || '';
      const userAgent = req.headers['user-agent'] || '';
      const isEsp32 = url.includes('client=esp32') || userAgent.includes('ESP32');

      if (isEsp32) {
        this.esp32Clients.add(ws);
        console.log('[WebSocket] Physical ESP32 client connected.');
      } else {
        this.webClients.add(ws);
        console.log('[WebSocket] Web Dashboard client connected.');
      }

      ws.on('message', (message: string) => {
        try {
          const data = JSON.parse(message.toString());
          this.handleIncomingMessage(ws, data, isEsp32);
        } catch (e) {
          console.error('[WebSocket] Failed to parse message:', e);
        }
      });

      ws.on('close', () => {
        if (isEsp32) {
          this.esp32Clients.delete(ws);
          console.log('[WebSocket] ESP32 client disconnected.');
        } else {
          this.webClients.delete(ws);
          console.log('[WebSocket] Web Dashboard client disconnected.');
        }
      });

      ws.on('error', err => {
        console.error('[WebSocket] Socket error:', err);
      });
    });
  }

  private handleIncomingMessage(ws: WebSocket, data: any, isEsp32: boolean) {
    if (data.type === 'PING') {
      ws.send(JSON.stringify({ type: 'PONG', timestamp: Date.now() }));
      return;
    }

    if (isEsp32 && data.type === 'ESP32_TELEMETRY') {
      // Broadcast ESP32 telemetry to all connected web dashboards
      this.broadcastToWeb({
        type: 'DEVICE_TELEMETRY',
        data: data.payload,
      });
    }

    if (data.type === 'AUDIO_LEVEL') {
      this.broadcastToWeb({
        type: 'AUDIO_LEVEL',
        level: data.level,
      });
    }
  }

  broadcastToWeb(payload: any) {
    const message = JSON.stringify(payload);
    for (const client of this.webClients) {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    }
  }

  sendToEsp32(payload: any) {
    const message = JSON.stringify(payload);
    for (const client of this.esp32Clients) {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    }
  }

  broadcastState(payload: { state: string; transcript?: string; lcdLine1?: string; lcdLine2?: string }) {
    this.broadcastToWeb({
      type: 'STATE_CHANGE',
      ...payload,
    });
  }

  broadcastDeviceUpdate(device: DeviceTelemetry) {
    this.broadcastToWeb({
      type: 'DEVICE_UPDATE',
      device,
    });
  }

  broadcastAudioLevel(level: number) {
    this.broadcastToWeb({
      type: 'AUDIO_LEVEL',
      level,
    });
  }
}

export const wsService = new WebSocketService();
