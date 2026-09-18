type SocketListener = (data: any) => void;

class SocketClient {
  private ws: WebSocket | null = null;
  private listeners: Map<string, Set<SocketListener>> = new Map();
  private reconnectTimeout: any = null;
  private isExplicitlyClosed = false;

  connect() {
    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      return;
    }

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    const wsUrl = `${protocol}//${host}/ws`;

    try {
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        console.log('[ZENO WS] Connected to backend gateway.');
        this.emit('connection', { status: 'connected' });
      };

      this.ws.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          if (payload.type) {
            this.emit(payload.type, payload);
          }
          this.emit('*', payload);
        } catch (e) {
          console.error('[ZENO WS] Failed to parse message:', e);
        }
      };

      this.ws.onclose = () => {
        console.log('[ZENO WS] Disconnected.');
        this.emit('connection', { status: 'disconnected' });
        if (!this.isExplicitlyClosed) {
          this.reconnectTimeout = setTimeout(() => this.connect(), 2500);
        }
      };

      this.ws.onerror = (err) => {
        console.warn('[ZENO WS] Error:', err);
      };
    } catch (e) {
      console.error('[ZENO WS] Setup error:', e);
      this.reconnectTimeout = setTimeout(() => this.connect(), 3000);
    }
  }

  on(event: string, callback: SocketListener) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);
    return () => this.off(event, callback);
  }

  off(event: string, callback: SocketListener) {
    if (this.listeners.has(event)) {
      this.listeners.get(event)!.delete(callback);
    }
  }

  private emit(event: string, data: any) {
    if (this.listeners.has(event)) {
      for (const cb of this.listeners.get(event)!) {
        try {
          cb(data);
        } catch (e) {
          console.error(`[ZENO WS] Error in handler for ${event}:`, e);
        }
      }
    }
  }

  send(data: any) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    }
  }

  disconnect() {
    this.isExplicitlyClosed = true;
    if (this.reconnectTimeout) clearTimeout(this.reconnectTimeout);
    if (this.ws) this.ws.close();
  }
}

export const socketClient = new SocketClient();
