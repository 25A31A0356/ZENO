import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { DeviceTelemetry, Conversation, SystemAlert, Settings, ZenoActivityState } from '../types';
import { api } from '../services/api';
import { socketClient } from '../services/socket';
import { audioService } from '../services/audio';

interface ToastInfo {
  id: string;
  message: string;
  type: 'success' | 'warning' | 'error' | 'info';
}

interface ZenoContextType {
  device: DeviceTelemetry;
  state: ZenoActivityState;
  transcript: string;
  conversations: Conversation[];
  alerts: SystemAlert[];
  settings: Settings | null;
  isAdvancedMode: boolean;
  isDemoRunning: boolean;
  toasts: ToastInfo[];
  toggleAdvancedMode: () => void;
  runDemo: () => Promise<void>;
  refreshDevice: () => Promise<void>;
  refreshConversations: () => Promise<void>;
  refreshAlerts: () => Promise<void>;
  sendChatMessage: (query: string, source?: 'voice' | 'text') => Promise<string>;
  showToast: (message: string, type?: 'success' | 'warning' | 'error' | 'info') => void;
  removeToast: (id: string) => void;
}

const defaultDevice: DeviceTelemetry = {
  deviceId: 'ZENO-ESP32-001',
  name: 'ZENO',
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
  lcdLine2: 'Connecting...',
};

const ZenoContext = createContext<ZenoContextType | undefined>(undefined);

export const ZenoProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [device, setDevice] = useState<DeviceTelemetry>(defaultDevice);
  const [state, setState] = useState<ZenoActivityState>('OFFLINE');
  const [transcript, setTranscript] = useState<string>('');
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [alerts, setAlerts] = useState<SystemAlert[]>([]);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [isAdvancedMode, setIsAdvancedMode] = useState<boolean>(false);
  const [isDemoRunning, setIsDemoRunning] = useState<boolean>(false);
  const [toasts, setToasts] = useState<ToastInfo[]>([]);

  const showToast = (message: string, type: 'success' | 'warning' | 'error' | 'info' = 'info') => {
    const id = 't-' + Date.now() + '-' + Math.random().toString(36).substring(2, 5);
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      removeToast(id);
    }, 4000);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  const refreshDevice = async () => {
    try {
      const dev = await api.getDevice();
      setDevice(dev);
    } catch (e) {
      console.warn('Failed to fetch device data:', e);
    }
  };

  const refreshConversations = async () => {
    try {
      const convs = await api.getConversations(20);
      setConversations(convs);
    } catch (e) {
      console.warn('Failed to fetch conversations:', e);
    }
  };

  const refreshAlerts = async () => {
    try {
      const alts = await api.getAlerts();
      setAlerts(alts);
    } catch (e) {
      console.warn('Failed to fetch alerts:', e);
    }
  };

  const toggleAdvancedMode = () => {
    setIsAdvancedMode(prev => {
      const next = !prev;
      showToast(next ? 'Switched to Advanced Mode' : 'Switched to Beginner Mode', 'info');
      return next;
    });
  };

  // Initial load
  useEffect(() => {
    const init = async () => {
      try {
        const [statusData, convs, alts, sttgs] = await Promise.all([
          api.getStatus(),
          api.getConversations(20),
          api.getAlerts(),
          api.getSettings(),
        ]);

        if (statusData.device) {
          setDevice(statusData.device);
        }
        if (statusData.state) {
          setState(statusData.state);
        }
        setConversations(convs);
        setAlerts(alts);
        setSettings(sttgs);
        if (sttgs && typeof sttgs.beginnerMode === 'boolean') {
          setIsAdvancedMode(!sttgs.beginnerMode);
        }
      } catch (e) {
        console.warn('Initial status fetch error:', e);
      }
    };

    init();

    // Connect WebSocket
    socketClient.connect();

    const unsubState = socketClient.on('STATE_CHANGE', (data: any) => {
      if (data.state) setState(data.state);
      if (data.transcript !== undefined) setTranscript(data.transcript);
      if (data.lcdLine1 && data.lcdLine2) {
        setDevice(prev => ({
          ...prev,
          lcdLine1: data.lcdLine1,
          lcdLine2: data.lcdLine2,
        }));
      }
    });

    const unsubDevice = socketClient.on('DEVICE_UPDATE', (data: any) => {
      if (data.device) {
        setDevice(data.device);
        if (!data.device.connected) {
          setState('OFFLINE');
        } else if (state === 'OFFLINE') {
          setState('IDLE');
        }
      }
    });

    const unsubConn = socketClient.on('connection', (data: any) => {
      if (data.status === 'connected') {
        refreshDevice();
      }
    });

    // Periodic poll fallback for reliability
    const interval = setInterval(() => {
      refreshDevice();
      refreshConversations();
    }, 6000);

    return () => {
      unsubState();
      unsubDevice();
      unsubConn();
      clearInterval(interval);
      socketClient.disconnect();
    };
  }, []);

  const sendChatMessage = async (query: string, source: 'voice' | 'text' = 'text'): Promise<string> => {
    try {
      setState('LISTENING');
      setTranscript(query);

      const result = await api.sendChat(query, source);
      const answer = result.conversation.zenoResponse;

      // Speak answer through browser synthesis if voice mode
      if (source === 'voice') {
        audioService.speak(answer, settings?.speechSpeed || 1.0);
      }

      await refreshConversations();
      showToast('ZENO responded', 'success');
      return answer;
    } catch (err: any) {
      showToast(err.message || 'Error communicating with ZENO', 'error');
      setState('ERROR');
      throw err;
    }
  };

  const runDemo = async () => {
    setIsDemoRunning(true);
    showToast('Starting ZENO Presentation Demo Mode...', 'info');
    try {
      await api.runDemo();
      await refreshConversations();
      await refreshDevice();
      showToast('Demo completed successfully!', 'success');
    } catch (e) {
      showToast('Demo sequence error', 'error');
    } finally {
      setIsDemoRunning(false);
    }
  };

  return (
    <ZenoContext.Provider
      value={{
        device,
        state,
        transcript,
        conversations,
        alerts,
        settings,
        isAdvancedMode,
        isDemoRunning,
        toasts,
        toggleAdvancedMode,
        runDemo,
        refreshDevice,
        refreshConversations,
        refreshAlerts,
        sendChatMessage,
        showToast,
        removeToast,
      }}
    >
      {children}
    </ZenoContext.Provider>
  );
};

export const useZeno = () => {
  const context = useContext(ZenoContext);
  if (!context) {
    throw new Error('useZeno must be used within a ZenoProvider');
  }
  return context;
};
