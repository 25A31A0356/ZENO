import { db, DeviceTelemetry } from '../database/db.js';
import { CONFIG } from '../config.js';
import { wsService } from './websocket.service.js';

export type ZenoActivityState = 'IDLE' | 'LISTENING' | 'THINKING' | 'SPEAKING' | 'OFFLINE' | 'ERROR';

export class DeviceService {
  private currentState: ZenoActivityState = 'IDLE';
  private currentTranscript: string = '';
  private checkInterval: NodeJS.Timeout | null = null;
  private isDemoRunning: boolean = false;

  constructor() {
    this.startWatchdog();
  }

  /**
   * Periodic watchdog checking if the ESP32 has missed heartbeats.
   */
  private startWatchdog() {
    this.checkInterval = setInterval(() => {
      if (this.isDemoRunning) return;
      const device = db.getDevice();
      if (!device.connected) return;

      const lastSeenTime = new Date(device.lastSeen).getTime();
      const now = Date.now();
      if (now - lastSeenTime > CONFIG.esp32TimeoutMs) {
        db.updateDevice({ connected: false });
        this.setState('OFFLINE', 'ESP32 disconnected (heartbeat timeout)');
        db.addLog({
          level: 'warn',
          message: 'ESP32 heartbeat timed out. Marked offline.',
          source: 'esp32',
        });
        db.addAlert({
          level: 'error',
          title: 'ESP32 Disconnected',
          message: 'ZENO cannot communicate with the ESP32.',
          meaning: 'The microcontroller is not sending periodic heartbeats over Wi-Fi.',
          fixes: [
            '1. Check power supply and battery switch',
            '2. Ensure Wi-Fi credentials in config.h match your network',
            '3. Restart ZENO ESP32',
          ],
        });
        wsService.broadcastDeviceUpdate(db.getDevice());
      }
    }, 5000);
  }

  getCurrentState(): ZenoActivityState {
    const device = db.getDevice();
    if (!device.connected && !this.isDemoRunning) {
      return 'OFFLINE';
    }
    return this.currentState;
  }

  getCurrentTranscript(): string {
    return this.currentTranscript;
  }

  setState(state: ZenoActivityState, transcript: string = '') {
    this.currentState = state;
    this.currentTranscript = transcript;

    // Update LCD state display accordingly
    let line1 = 'ZENO';
    let line2 = 'Online';

    switch (state) {
      case 'LISTENING':
        line2 = 'Listening...';
        break;
      case 'THINKING':
        line2 = 'Thinking...';
        break;
      case 'SPEAKING':
        line2 = 'Speaking...';
        break;
      case 'IDLE':
        line2 = 'Ready';
        break;
      case 'OFFLINE':
        line2 = 'Offline';
        break;
      case 'ERROR':
        line2 = 'System Error';
        break;
    }

    db.updateDevice({ lcdLine1: line1, lcdLine2: line2 });

    wsService.broadcastState({
      state,
      transcript,
      lcdLine1: line1,
      lcdLine2: line2,
    });
  }

  /**
   * Heartbeat from physical ESP32 or simulated device.
   */
  processHeartbeat(telemetry: Partial<DeviceTelemetry>): DeviceTelemetry {
    const wasOffline = !db.getDevice().connected;
    const updated = db.updateDevice({
      ...telemetry,
      connected: true,
      lastSeen: new Date().toISOString(),
    });

    if (wasOffline) {
      db.addLog({
        level: 'info',
        message: `ESP32 connected successfully (IP: ${updated.ipAddress}, Wi-Fi: ${updated.wifiSsid})`,
        source: 'esp32',
      });
      this.setState('IDLE', 'Device connected and ready');
    }

    wsService.broadcastDeviceUpdate(updated);
    return updated;
  }

  /**
   * Sends custom text to the 16x2 LCD.
   */
  updateLcd(line1: string, line2: string): DeviceTelemetry {
    const cleanL1 = (line1 || '').substring(0, 16);
    const cleanL2 = (line2 || '').substring(0, 16);
    const updated = db.updateDevice({
      lcdLine1: cleanL1,
      lcdLine2: cleanL2,
    });

    db.addLog({
      level: 'info',
      message: `LCD updated: [L1: "${cleanL1}"] [L2: "${cleanL2}"]`,
      source: 'esp32',
    });

    wsService.broadcastDeviceUpdate(updated);
    wsService.sendToEsp32({
      type: 'LCD_UPDATE',
      line1: cleanL1,
      line2: cleanL2,
    });

    return updated;
  }

  /**
   * Trigger Speaker Test.
   */
  testSpeaker(channel: 'left' | 'right' | 'both' = 'both', volume = 80) {
    db.addLog({
      level: 'info',
      message: `Speaker test triggered (Channel: ${channel}, Volume: ${volume}%)`,
      source: 'tts',
    });

    wsService.sendToEsp32({
      type: 'TEST_SPEAKER',
      channel,
      volume,
    });

    return { success: true, message: `Speaker test tone dispatched to ${channel} speaker(s).` };
  }

  /**
   * Trigger Mic Test.
   */
  testMicrophone() {
    db.addLog({
      level: 'info',
      message: 'Microphone test initiated',
      source: 'speech',
    });

    wsService.sendToEsp32({
      type: 'TEST_MIC',
    });

    return { success: true, message: 'Microphone input test active.' };
  }

  /**
   * Restart device command.
   */
  restartDevice() {
    db.addLog({
      level: 'warn',
      message: 'Software restart command issued to ESP32',
      source: 'esp32',
    });

    wsService.sendToEsp32({
      type: 'RESTART',
    });

    this.setState('IDLE', 'Rebooting ESP32...');

    return { success: true, message: 'Restart command sent to ESP32.' };
  }

  /**
   * Orchestrates an automated presentation demo sequence.
   */
  async runDemo() {
    this.isDemoRunning = true;
    db.updateDevice({ connected: true });
    wsService.broadcastDeviceUpdate(db.getDevice());

    db.addLog({
      level: 'info',
      message: '=== DEMO MODE SEQUENCE STARTED ===',
      source: 'system',
    });

    // Step 1: Idle
    this.setState('IDLE', 'ZENO is waiting for user prompt...');
    await new Promise(r => setTimeout(r, 1200));

    // Step 2: Listening
    const demoPrompt = 'What is thermodynamics?';
    this.setState('LISTENING', demoPrompt);
    db.addLog({
      level: 'info',
      message: `Speech input detected: "${demoPrompt}"`,
      source: 'speech',
    });
    await new Promise(r => setTimeout(r, 2200));

    // Step 3: Thinking
    this.setState('THINKING', 'Consulting AI engine & knowledge base...');
    db.addLog({
      level: 'info',
      message: 'Processing query via AI reasoning engine...',
      source: 'ai',
    });
    await new Promise(r => setTimeout(r, 1800));

    // Step 4: Speaking
    const demoResponse =
      'Thermodynamics is the branch of physics studying heat, work, and temperature, and their relations to energy and physical properties of matter.';
    this.setState('SPEAKING', demoResponse);
    db.addLog({
      level: 'info',
      message: 'Audio TTS generated and playing through dual speakers',
      source: 'tts',
    });

    // Save conversation
    db.addConversation({
      userQuery: demoPrompt,
      zenoResponse: demoResponse,
      responseTimeMs: 1100,
      source: 'demo',
      retrievedKnowledge: ['Physics Core Principles'],
    });

    await new Promise(r => setTimeout(r, 3500));

    // Step 5: Return to Idle
    this.setState('IDLE', 'Ready');
    this.isDemoRunning = false;

    db.addLog({
      level: 'info',
      message: '=== DEMO MODE SEQUENCE COMPLETED ===',
      source: 'system',
    });

    return { success: true, message: 'Demo completed successfully.' };
  }
}

export const deviceService = new DeviceService();
