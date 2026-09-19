// Web Serial API Service for ZENO ESP32 USB Communication

export type SerialConnectionStatus = 'DISCONNECTED' | 'CONNECTING' | 'CONNECTED' | 'ERROR';

export type SerialDataListener = (data: string) => void;
export type SerialStatusListener = (status: SerialConnectionStatus, errorMsg?: string) => void;

class WebSerialService {
  private port: any = null;
  private reader: any = null;
  private keepReading = false;
  private status: SerialConnectionStatus = 'DISCONNECTED';
  private dataListeners: Set<SerialDataListener> = new Set();
  private statusListeners: Set<SerialStatusListener> = new Set();
  private readBuffer = '';

  constructor() {
    if (this.isSupported()) {
      (navigator as any).serial?.addEventListener('disconnect', (event: any) => {
        if (this.port && event.target === this.port) {
          this.handleDisconnect('ESP32 was disconnected from USB.');
        }
      });
    }
  }

  /**
   * Checks if the Web Serial API is supported in the current browser.
   */
  isSupported(): boolean {
    return typeof navigator !== 'undefined' && 'serial' in navigator;
  }

  /**
   * Returns current connection status.
   */
  getStatus(): SerialConnectionStatus {
    return this.status;
  }

  /**
   * Connects to ESP32 via Web Serial.
   */
  async connect(baudRate = 115200): Promise<boolean> {
    if (!this.isSupported()) {
      this.setStatus('ERROR', 'Web Serial is not supported in this browser. Use a Chromium-based browser such as Google Chrome or Microsoft Edge.');
      return false;
    }

    try {
      this.setStatus('CONNECTING');

      // Request user to select ESP32 COM port
      this.port = await (navigator as any).serial.requestPort();
      await this.port.open({ baudRate });

      this.keepReading = true;
      this.startReadingLoop();
      this.setStatus('CONNECTED');
      return true;
    } catch (err: any) {
      if (err.name === 'NotFoundError') {
        // User cancelled port picker dialog
        this.setStatus('DISCONNECTED');
      } else {
        console.warn('Web Serial connection error:', err);
        this.setStatus('ERROR', err.message || 'Failed to open serial port. Ensure no other application (like Arduino IDE Serial Monitor) is using it.');
      }
      return false;
    }
  }

  /**
   * Disconnects from serial port.
   */
  async disconnect(): Promise<void> {
    this.keepReading = false;

    try {
      if (this.reader) {
        await this.reader.cancel();
        this.reader = null;
      }
      if (this.port) {
        await this.port.close();
        this.port = null;
      }
    } catch (err) {
      console.warn('Error during serial port close:', err);
    }

    this.setStatus('DISCONNECTED');
  }

  /**
   * Continuous read loop for incoming serial data from ESP32.
   */
  private async startReadingLoop() {
    while (this.port && this.port.readable && this.keepReading) {
      const textDecoder = new TextDecoderStream();
      const readableStreamClosed = this.port.readable.pipeTo(textDecoder.writable);
      this.reader = textDecoder.readable.getReader();

      try {
        while (true) {
          const { value, done } = await this.reader.read();
          if (done) break;
          if (value) {
            this.handleIncomingChunk(value);
          }
        }
      } catch (err) {
        console.warn('Serial read error:', err);
        break;
      } finally {
        this.reader?.releaseLock();
      }

      await readableStreamClosed.catch(() => {});
    }

    if (this.status === 'CONNECTED' && !this.keepReading) {
      this.setStatus('DISCONNECTED');
    }
  }

  /**
   * Buffers chunks and extracts newline-delimited responses.
   */
  private handleIncomingChunk(chunk: string) {
    this.readBuffer += chunk;
    const lines = this.readBuffer.split(/\r?\n/);
    this.readBuffer = lines.pop() || '';

    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.length > 0) {
        this.emitData(trimmed);
      }
    }
  }

  /**
   * Sends raw string to ESP32 over Web Serial with newline.
   */
  async send(message: string): Promise<boolean> {
    if (!this.port || !this.port.writable || this.status !== 'CONNECTED') {
      this.setStatus('ERROR', 'ESP32 is not connected. Please connect via USB first.');
      return false;
    }

    try {
      const textEncoder = new TextEncoder();
      const writer = this.port.writable.getWriter();
      const dataWithNewline = message.endsWith('\n') ? message : message + '\n';
      await writer.write(textEncoder.encode(dataWithNewline));
      writer.releaseLock();
      return true;
    } catch (err: any) {
      console.warn('Serial write error:', err);
      this.setStatus('ERROR', 'Failed to send data to ESP32. Check USB connection.');
      return false;
    }
  }

  /**
   * Helper protocol methods
   */
  async sendPing(): Promise<boolean> {
    return this.send('PING');
  }

  async sendLcdText(line1: string, line2: string): Promise<boolean> {
    const l1 = (line1 || '').substring(0, 16);
    const l2 = (line2 || '').substring(0, 16);
    return this.send(`LCD|${l1}|${l2}`);
  }

  async sendClearLcd(): Promise<boolean> {
    return this.send('LCD|CLEAR');
  }

  // --- EVENT LISTENERS ---
  onData(callback: SerialDataListener) {
    this.dataListeners.add(callback);
    return () => this.dataListeners.delete(callback);
  }

  onStatusChange(callback: SerialStatusListener) {
    this.statusListeners.add(callback);
    return () => this.statusListeners.delete(callback);
  }

  private emitData(data: string) {
    for (const cb of this.dataListeners) {
      try {
        cb(data);
      } catch (e) {
        console.error('Error in serial data listener:', e);
      }
    }
  }

  private setStatus(status: SerialConnectionStatus, errorMsg?: string) {
    this.status = status;
    for (const cb of this.statusListeners) {
      try {
        cb(status, errorMsg);
      } catch (e) {
        console.error('Error in serial status listener:', e);
      }
    }
  }

  private handleDisconnect(reason: string) {
    this.port = null;
    this.reader = null;
    this.keepReading = false;
    this.setStatus('DISCONNECTED', reason);
  }
}

export const webSerialService = new WebSerialService();
