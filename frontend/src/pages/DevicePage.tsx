import React, { useState, useEffect } from 'react';
import { useZeno } from '../context/ZenoContext';
import { api } from '../services/api';
import { audioService } from '../services/audio';
import { webSerialService, SerialConnectionStatus } from '../services/serial';
import { mqttService, MqttConnectionStatus, MqttTelemetry, MqttMicData } from '../services/mqtt';
import {
  Cpu,
  Wifi,
  Battery,
  Mic,
  Volume2,
  RotateCcw,
  Usb,
  Send,
  AlertTriangle,
  Monitor,
  Radio,
  Terminal,
  Eraser,
  Globe,
  Settings as SettingsIcon,
} from 'lucide-react';

export const DevicePage: React.FC = () => {
  const { device, showToast, refreshDevice } = useZeno();

  // --- CONNECTION MODE TAB ---
  const [connMode, setConnMode] = useState<'mqtt' | 'serial'>('mqtt');

  // --- MQTT STATES ---
  const [mqttStatus, setMqttStatus] = useState<MqttConnectionStatus>(mqttService.getStatus());
  const [mqttConfig, setMqttConfig] = useState(mqttService.getConfig());
  const [showMqttSettings, setShowMqttSettings] = useState(false);
  const [espMqttTelemetry, setEspMqttTelemetry] = useState<MqttTelemetry>({ online: false });
  const [espMqttMic, setEspMqttMic] = useState<MqttMicData>({ raw: 0, percent: 0 });
  const [espMqttState, setEspMqttState] = useState<string>('IDLE');
  const [mqttLogs, setMqttLogs] = useState<Array<{ topic: string; message: string; time: string; type: 'in' | 'out' }>>([]);

  // --- WEB SERIAL STATES ---
  const [serialStatus, setSerialStatus] = useState<SerialConnectionStatus>('DISCONNECTED');
  const [serialResponses, setSerialResponses] = useState<Array<{ text: string; time: string; type: 'in' | 'out' }>>([]);
  const isSerialSupported = webSerialService.isSupported();

  // LCD Line inputs & character limits (Max 16 chars each)
  const [lcdLine1, setLcdLine1] = useState<string>('ZENO READY');
  const [lcdLine2, setLcdLine2] = useState<string>('ONLINE');
  const [lcdTheme, setLcdTheme] = useState<'green' | 'blue'>('green');

  // Speaker Test States
  const [speakerChannel, setSpeakerChannel] = useState<'left' | 'right' | 'both'>('both');
  const [speakerVolume, setSpeakerVolume] = useState(80);
  const [isPlayingSpeakerTest, setIsPlayingSpeakerTest] = useState(false);

  // Microphone local analyzer states
  const [isLocalMicTesting, setIsLocalMicTesting] = useState(false);
  const [localMicVuLevel, setLocalMicVuLevel] = useState(0);

  // Status refs to prevent duplicate toast alerts
  const prevMqttStatus = React.useRef<MqttConnectionStatus>('DISCONNECTED');
  const prevEspOnline = React.useRef<boolean>(false);

  // --- MQTT EVENT LISTENERS ---
  useEffect(() => {
    const unsubStatus = mqttService.onStatusChange((status, error) => {
      setMqttStatus(status);
      if (error && prevMqttStatus.current !== status) {
        showToast(error, 'error');
      }
      if (status === 'CONNECTED' && prevMqttStatus.current !== 'CONNECTED') {
        showToast('Connected to Cloud MQTT Broker!', 'success');
      }
      prevMqttStatus.current = status;
    });

    const unsubTelemetry = mqttService.onTelemetry((telemetry) => {
      setEspMqttTelemetry(telemetry);
      if (telemetry.online && !prevEspOnline.current) {
        showToast(`ESP32 Online! IP: ${telemetry.ip || 'Connected'}`, 'success');
      } else if (!telemetry.online && prevEspOnline.current) {
        showToast('ESP32 went Offline', 'warning');
      }
      prevEspOnline.current = telemetry.online;
    });

    const unsubMic = mqttService.onMic((data) => {
      setEspMqttMic(data);
    });

    const unsubLcd = mqttService.onLcd((data) => {
      if (data.line1 !== undefined) setLcdLine1(data.line1);
      if (data.line2 !== undefined) setLcdLine2(data.line2);
    });

    const unsubState = mqttService.onState((st) => {
      setEspMqttState(st);
    });

    const unsubLogs = mqttService.onRawLog((log) => {
      setMqttLogs((prev) => [...prev.slice(-30), log]);
    });

    return () => {
      unsubStatus();
      unsubTelemetry();
      unsubMic();
      unsubLcd();
      unsubState();
      unsubLogs();
    };
  }, [showToast]);

  // --- WEB SERIAL EVENT LISTENERS ---
  useEffect(() => {
    const unsubData = webSerialService.onData((data: string) => {
      const timeStr = new Date().toLocaleTimeString();
      setSerialResponses((prev) => [
        ...prev.slice(-20),
        { text: data, time: timeStr, type: 'in' },
      ]);

      if (data === 'PONG') {
        showToast('ESP32 replied: PONG (Connection Verified!)', 'success');
      } else if (data === 'LCD_OK') {
        showToast('ESP32 confirmed: LCD text updated', 'success');
      } else if (data === 'CLEAR_OK') {
        showToast('ESP32 confirmed: LCD screen cleared', 'info');
      }
    });

    const unsubStatus = webSerialService.onStatusChange((status: SerialConnectionStatus, errorMsg?: string) => {
      setSerialStatus(status);
      if (errorMsg) {
        showToast(errorMsg, status === 'ERROR' ? 'error' : 'info');
      }
      if (status === 'CONNECTED') {
        showToast('ESP32 Connected via USB Web Serial!', 'success');
      }
    });

    return () => {
      unsubData();
      unsubStatus();
    };
  }, [showToast]);

  // Local browser mic test cleanup
  useEffect(() => {
    let stopMic: (() => void) | null = null;
    if (isLocalMicTesting) {
      audioService
        .startMicAnalyzer((level) => {
          setLocalMicVuLevel(level);
        })
        .then((cleanup) => {
          stopMic = cleanup;
        })
        .catch(() => {
          setIsLocalMicTesting(false);
        });
    } else {
      setLocalMicVuLevel(0);
    }
    return () => {
      if (stopMic) stopMic();
    };
  }, [isLocalMicTesting]);

  // --- MQTT ACTIONS ---
  const handleConnectMqtt = () => {
    mqttService.connect(mqttConfig);
  };

  const handleDisconnectMqtt = () => {
    mqttService.disconnect();
    setEspMqttTelemetry({ online: false });
    showToast('Disconnected from MQTT Broker.', 'info');
  };

  const handleSaveMqttConfig = () => {
    mqttService.saveConfig(mqttConfig);
    showToast('MQTT Configuration Saved.', 'success');
    setShowMqttSettings(false);
  };

  // --- WEB SERIAL ACTIONS ---
  const handleConnectSerial = async () => {
    await webSerialService.connect(115200);
  };

  const handleDisconnectSerial = async () => {
    await webSerialService.disconnect();
    showToast('ESP32 disconnected from serial.', 'info');
  };

  const handleTestSerialConnection = async () => {
    if (serialStatus !== 'CONNECTED') {
      showToast('Please connect your ESP32 via USB first.', 'warning');
      return;
    }
    const timeStr = new Date().toLocaleTimeString();
    setSerialResponses((prev) => [...prev.slice(-20), { text: 'PING', time: timeStr, type: 'out' }]);
    const ok = await webSerialService.sendPing();
    if (ok) {
      showToast('Sent: PING -> Waiting for ESP32 response...', 'info');
    }
  };

  // --- UNIFIED HARDWARE CONTROL ACTIONS (MQTT OR SERIAL) ---
  const handleSendToLcd = async () => {
    const l1 = lcdLine1.substring(0, 16);
    const l2 = lcdLine2.substring(0, 16);

    if (connMode === 'mqtt' && mqttStatus === 'CONNECTED') {
      mqttService.sendCommand(`LCD|${l1}|${l2}`);
      showToast(`Sent to ESP32 LCD via MQTT: "${l1}" / "${l2}"`, 'success');
    } else if (connMode === 'serial' && serialStatus === 'CONNECTED') {
      const timeStr = new Date().toLocaleTimeString();
      setSerialResponses((prev) => [
        ...prev.slice(-20),
        { text: `LCD|${l1}|${l2}`, time: timeStr, type: 'out' },
      ]);
      await webSerialService.sendLcdText(l1, l2);
      showToast(`Sent to ESP32 LCD via Serial: "${l1}" / "${l2}"`, 'success');
    }

    // Local mirror update
    await api.updateLcd(l1, l2);
    await refreshDevice();
  };

  const handleLcdPresetTest = async () => {
    const testL1 = 'ZENO LCD TEST';
    const testL2 = 'WORKING OK';
    setLcdLine1(testL1);
    setLcdLine2(testL2);

    if (connMode === 'mqtt' && mqttStatus === 'CONNECTED') {
      mqttService.sendTestLcd();
      showToast('Sent LCD Test pattern via Cloud MQTT!', 'success');
    } else if (connMode === 'serial' && serialStatus === 'CONNECTED') {
      const timeStr = new Date().toLocaleTimeString();
      setSerialResponses((prev) => [
        ...prev.slice(-20),
        { text: `LCD|${testL1}|${testL2}`, time: timeStr, type: 'out' },
      ]);
      await webSerialService.sendLcdText(testL1, testL2);
      showToast('Sent LCD Test pattern via Serial!', 'success');
    }

    await api.updateLcd(testL1, testL2);
    await refreshDevice();
  };

  const handleClearLcd = async () => {
    setLcdLine1('');
    setLcdLine2('');

    if (connMode === 'mqtt' && mqttStatus === 'CONNECTED') {
      mqttService.sendCommand('LCD||');
      showToast('Cleared LCD via MQTT.', 'info');
    } else if (connMode === 'serial' && serialStatus === 'CONNECTED') {
      const timeStr = new Date().toLocaleTimeString();
      setSerialResponses((prev) => [
        ...prev.slice(-20),
        { text: 'LCD|CLEAR', time: timeStr, type: 'out' },
      ]);
      await webSerialService.sendClearLcd();
      showToast('Cleared LCD via Serial.', 'info');
    }

    await api.updateLcd('', '');
    await refreshDevice();
  };

  const handleTriggerMicTest = () => {
    if (connMode === 'mqtt' && mqttStatus === 'CONNECTED') {
      mqttService.sendTestMic();
      showToast('Sent MIC_TEST command to ESP32 via MQTT', 'info');
    } else {
      setIsLocalMicTesting((prev) => !prev);
    }
  };

  const handleTestSpeaker = async () => {
    setIsPlayingSpeakerTest(true);
    try {
      audioService.playTestTone(speakerChannel);
      await api.testSpeaker(speakerChannel, speakerVolume);
      showToast(`Played test sound to ${speakerChannel} speaker (${speakerVolume}%)`, 'success');
    } catch (e) {
      showToast('Speaker test failed', 'error');
    } finally {
      setTimeout(() => setIsPlayingSpeakerTest(false), 600);
    }
  };

  const handleRestart = async () => {
    if (confirm('Send soft reboot command to ESP32?')) {
      try {
        if (connMode === 'mqtt' && mqttStatus === 'CONNECTED') {
          mqttService.sendCommand('RESTART');
        } else if (connMode === 'serial' && serialStatus === 'CONNECTED') {
          await webSerialService.send('RESTART');
        }
        await api.restartDevice();
        showToast('Restart command sent to ESP32 hardware.', 'warning');
        refreshDevice();
      } catch (e) {
        showToast('Failed to send restart command', 'error');
      }
    }
  };

  const formatUptime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    return `${hrs}h ${mins}m`;
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-16">
      {/* Title */}
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-black text-white tracking-tight flex items-center justify-center gap-3">
          <Cpu className="w-8 h-8 text-cyan-400" />
          ZENO DEVICE CONTROL & TELEMETRY
        </h2>
        <p className="text-slate-400 text-sm max-w-xl mx-auto">
          Test and monitor the physical ESP32, 16x2 LCD display, and microphone over <strong>Cloud MQTT (Wi-Fi/TLS)</strong> or <strong>USB Web Serial</strong>.
        </p>

        <div className="pt-1">
          <a
            href="./hardware_monitor.html"
            target="_blank"
            rel="noreferrer"
            className="text-xs font-semibold text-cyan-400 hover:text-cyan-300 underline inline-flex items-center gap-1"
          >
            <span>Open Standalone Single-Page Hardware Monitor</span>
            <span>↗</span>
          </a>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* PRIMARY SECTION: CONNECTION MODE SWITCHER & HARDWARE TEST */}
      {/* ========================================================================= */}
      <div className="zeno-card p-6 sm:p-8 border-cyan-500/40 shadow-2xl relative overflow-hidden space-y-6">
        {/* Mode Switcher Tabs */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#232938]">
          <div className="flex items-center gap-2 bg-[#0a0d14] p-1.5 rounded-2xl border border-[#232938]">
            <button
              onClick={() => setConnMode('mqtt')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                connMode === 'mqtt'
                  ? 'bg-cyan-500 text-white shadow-lg shadow-cyan-500/20'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Globe className="w-4 h-4" />
              🌐 CLOUD MQTT (Wi-Fi / TLS)
            </button>
            <button
              onClick={() => setConnMode('serial')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                connMode === 'serial'
                  ? 'bg-cyan-500 text-white shadow-lg shadow-cyan-500/20'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Usb className="w-4 h-4" />
              🔌 USB WEB SERIAL
            </button>
          </div>

          {/* Status Pill for Active Mode */}
          {connMode === 'mqtt' ? (
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowMqttSettings((prev) => !prev)}
                className="p-2 rounded-xl bg-[#141a29] border border-[#263147] text-slate-300 hover:text-cyan-400 transition-colors"
                title="MQTT Connection Settings"
              >
                <SettingsIcon className="w-4 h-4" />
              </button>

              {mqttStatus === 'CONNECTED' ? (
                <button
                  onClick={handleDisconnectMqtt}
                  className="px-3.5 py-1.5 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-300 text-xs font-bold transition-all"
                >
                  DISCONNECT
                </button>
              ) : (
                <button
                  onClick={handleConnectMqtt}
                  disabled={mqttStatus === 'CONNECTING'}
                  className="zeno-btn-primary px-4 py-1.5 text-xs font-bold uppercase tracking-wider"
                >
                  <Globe className="w-3.5 h-3.5" />
                  CONNECT MQTT
                </button>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-3">
              {serialStatus === 'CONNECTED' ? (
                <button
                  onClick={handleDisconnectSerial}
                  className="px-3.5 py-1.5 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-300 text-xs font-bold transition-all"
                >
                  DISCONNECT
                </button>
              ) : (
                <button
                  onClick={handleConnectSerial}
                  disabled={!isSerialSupported || serialStatus === 'CONNECTING'}
                  className="zeno-btn-primary px-4 py-1.5 text-xs font-bold uppercase tracking-wider"
                >
                  <Usb className="w-3.5 h-3.5" />
                  CONNECT ESP32 USB
                </button>
              )}
            </div>
          )}
        </div>

        {/* MQTT Config Drawer */}
        {connMode === 'mqtt' && showMqttSettings && (
          <div className="p-5 rounded-2xl bg-[#090d16] border border-cyan-500/30 space-y-4 animate-in fade-in duration-200">
            <div className="flex items-center justify-between pb-2 border-b border-[#1c2438]">
              <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-2">
                <SettingsIcon className="w-4 h-4" />
                Cloud MQTT Broker Settings
              </span>
              <span className="text-[11px] text-slate-400">Works seamlessly with HiveMQ Cloud / EMQX</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-slate-400 block mb-1 font-semibold">WebSocket URL (WSS)</label>
                <input
                  type="text"
                  value={mqttConfig.brokerUrl}
                  onChange={(e) => setMqttConfig({ ...mqttConfig, brokerUrl: e.target.value })}
                  placeholder="wss://broker.emqx.io:8084/mqtt"
                  className="w-full bg-[#0d121f] border border-[#263147] rounded-xl px-3 py-2 text-xs text-white font-mono focus:border-cyan-400 outline-none"
                />
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1 font-semibold">Device ID</label>
                <input
                  type="text"
                  value={mqttConfig.deviceId}
                  onChange={(e) => setMqttConfig({ ...mqttConfig, deviceId: e.target.value })}
                  placeholder="001"
                  className="w-full bg-[#0d121f] border border-[#263147] rounded-xl px-3 py-2 text-xs text-white font-mono focus:border-cyan-400 outline-none"
                />
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1 font-semibold">Browser Username (Optional)</label>
                <input
                  type="text"
                  value={mqttConfig.username || ''}
                  onChange={(e) => setMqttConfig({ ...mqttConfig, username: e.target.value })}
                  placeholder="zeno_web"
                  className="w-full bg-[#0d121f] border border-[#263147] rounded-xl px-3 py-2 text-xs text-white font-mono focus:border-cyan-400 outline-none"
                />
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1 font-semibold">Browser Password (Optional)</label>
                <input
                  type="password"
                  value={mqttConfig.password || ''}
                  onChange={(e) => setMqttConfig({ ...mqttConfig, password: e.target.value })}
                  placeholder="••••••••"
                  className="w-full bg-[#0d121f] border border-[#263147] rounded-xl px-3 py-2 text-xs text-white font-mono focus:border-cyan-400 outline-none"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={handleSaveMqttConfig}
                className="zeno-btn-primary px-4 py-2 text-xs font-bold"
              >
                Save & Apply Settings
              </button>
            </div>
          </div>
        )}

        {/* Active Connection Status Banner */}
        {connMode === 'mqtt' ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3.5 rounded-xl bg-[#0e121a] border border-[#232938] flex items-center justify-between">
              <span className="text-xs text-slate-400">Broker Status</span>
              <span
                className={`text-xs font-bold font-mono px-2.5 py-0.5 rounded-full ${
                  mqttStatus === 'CONNECTED'
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                    : mqttStatus === 'CONNECTING'
                    ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                    : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                }`}
              >
                {mqttStatus === 'CONNECTED'
                  ? '● BROKER CONNECTED'
                  : mqttStatus === 'CONNECTING'
                  ? '● CONNECTING...'
                  : '● DISCONNECTED'}
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-[#0e121a] border border-[#232938] flex items-center justify-between">
              <span className="text-xs text-slate-400">ESP32 Device Status</span>
              <span
                className={`text-xs font-bold font-mono px-2.5 py-0.5 rounded-full ${
                  espMqttTelemetry.online
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                    : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                }`}
              >
                {espMqttTelemetry.online ? '● ESP32 ONLINE' : '● ESP32 OFFLINE'}
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-[#0e121a] border border-[#232938] flex items-center justify-between">
              <span className="text-xs text-slate-400">ESP32 IP / State</span>
              <span className="text-xs font-mono font-bold text-cyan-300">
                {espMqttTelemetry.ip || '---'} ({espMqttState})
              </span>
            </div>
          </div>
        ) : (
          <div>
            {!isSerialSupported ? (
              <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-center gap-3">
                <AlertTriangle className="w-5 h-5 shrink-0 text-amber-400" />
                <span>
                  Web Serial is not supported in this browser. Use Chrome/Edge or switch to <strong>Cloud MQTT</strong> above!
                </span>
              </div>
            ) : (
              <div className="p-3.5 rounded-xl bg-[#0e111a] border border-[#232938] text-xs text-slate-400 flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Radio className="w-4 h-4 text-cyan-400" />
                  USB Serial Status:
                </span>
                <span className={`font-mono font-bold ${serialStatus === 'CONNECTED' ? 'text-emerald-400' : 'text-slate-500'}`}>
                  {serialStatus}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Action Buttons Bar */}
        <div className="flex flex-wrap items-center gap-3">
          {connMode === 'serial' && (
            <button
              onClick={handleTestSerialConnection}
              disabled={serialStatus !== 'CONNECTED'}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 ${
                serialStatus === 'CONNECTED'
                  ? 'bg-[#182236] hover:bg-[#202c46] border border-cyan-500/40 text-cyan-300 shadow-md active:scale-95'
                  : 'bg-[#10141f] border border-[#202738] text-slate-500 cursor-not-allowed'
              }`}
            >
              <Radio className="w-3.5 h-3.5 text-cyan-400" />
              TEST SERIAL CONNECTION
            </button>
          )}

          <button
            onClick={handleLcdPresetTest}
            className="zeno-btn-primary px-4 py-2.5 text-xs font-bold uppercase tracking-wider"
          >
            <Monitor className="w-3.5 h-3.5" />
            TEST LCD (PRESET)
          </button>

          <button
            onClick={handleClearLcd}
            className="zeno-btn-secondary px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-slate-300 hover:text-white"
          >
            <Eraser className="w-3.5 h-3.5 text-rose-400" />
            CLEAR LCD
          </button>

          <div className="ml-auto text-[11px] font-mono text-slate-500 hidden md:block">
            I2C 16x2 LCD (SDA: 21, SCL: 22)
          </div>
        </div>

        {/* 16x2 LCD Visual Preview Frame */}
        <div className="bg-[#0e121a] p-5 sm:p-6 rounded-2xl border-4 border-[#242c3d] shadow-2xl space-y-2">
          <div className="flex justify-between items-center text-[11px] text-slate-500 font-mono uppercase px-1">
            <span>16x2 I2C Display (PCF8574 Addr 0x27)</span>
            <button
              onClick={() => setLcdTheme((prev) => (prev === 'green' ? 'blue' : 'green'))}
              className="text-cyan-400 hover:underline"
            >
              {lcdTheme === 'green' ? 'Switch to Blue Backlight' : 'Switch to Green Backlight'}
            </button>
          </div>

          <div
            className={`p-4 sm:p-5 rounded-xl border-2 font-lcd text-2xl sm:text-3xl leading-snug tracking-[0.18em] transition-all select-none overflow-hidden ${
              lcdTheme === 'green'
                ? 'lcd-screen border-emerald-900/60'
                : 'lcd-screen-blue border-cyan-900/60'
            }`}
          >
            <div className="whitespace-pre truncate">{lcdLine1.padEnd(16, ' ').substring(0, 16)}</div>
            <div className="whitespace-pre truncate">{lcdLine2.padEnd(16, ' ').substring(0, 16)}</div>
          </div>
        </div>

        {/* LCD Control Text Inputs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <div className="flex justify-between items-center text-xs font-semibold text-slate-300 mb-1.5">
              <label>Line 1</label>
              <span className={`font-mono text-[11px] ${lcdLine1.length > 16 ? 'text-rose-400 font-bold' : 'text-cyan-400'}`}>
                Line 1: {lcdLine1.length}/16
              </span>
            </div>
            <input
              type="text"
              maxLength={16}
              value={lcdLine1}
              onChange={(e) => setLcdLine1(e.target.value)}
              placeholder="e.g. HELLO ZENO"
              className="w-full bg-[#0c0e12] border border-[#242c3f] rounded-xl px-4 py-3 text-sm text-white font-mono focus:outline-none focus:border-cyan-500 transition-all"
            />
          </div>

          <div>
            <div className="flex justify-between items-center text-xs font-semibold text-slate-300 mb-1.5">
              <label>Line 2</label>
              <span className={`font-mono text-[11px] ${lcdLine2.length > 16 ? 'text-rose-400 font-bold' : 'text-cyan-400'}`}>
                Line 2: {lcdLine2.length}/16
              </span>
            </div>
            <input
              type="text"
              maxLength={16}
              value={lcdLine2}
              onChange={(e) => setLcdLine2(e.target.value)}
              placeholder="e.g. LCD WORKING"
              className="w-full bg-[#0c0e12] border border-[#242c3f] rounded-xl px-4 py-3 text-sm text-white font-mono focus:outline-none focus:border-cyan-500 transition-all"
            />
          </div>
        </div>

        {/* Send Button */}
        <button
          onClick={handleSendToLcd}
          className="zeno-btn-primary w-full text-sm font-bold py-3.5 tracking-wider uppercase rounded-xl"
        >
          <Send className="w-4 h-4" />
          SEND TO PHYSICAL 16x2 LCD
        </button>

        {/* Live Activity Logs */}
        <div className="p-4 rounded-xl bg-[#090c12] border border-[#1f2638] space-y-2 font-mono text-xs">
          <div className="flex items-center justify-between text-slate-400 text-[11px] pb-1 border-b border-[#1f2638]">
            <span className="flex items-center gap-1.5 text-cyan-400 font-bold uppercase tracking-wider">
              <Terminal className="w-3.5 h-3.5" />
              {connMode === 'mqtt' ? 'Live Cloud MQTT Activity Stream' : 'ESP32 Serial Response Monitor'}
            </span>
            <span>{connMode === 'mqtt' ? `Topic: zeno/${mqttConfig.deviceId}/*` : 'Baud: 115200'}</span>
          </div>

          {connMode === 'mqtt' ? (
            <div className="max-h-28 overflow-y-auto space-y-1 text-[11px] text-slate-400 pt-1">
              {mqttLogs.length === 0 ? (
                <div className="text-slate-500 py-1">Awaiting MQTT messages. Connect broker to stream telemetry.</div>
              ) : (
                mqttLogs.map((r, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span className="text-slate-600">{r.time}</span>
                    <span className="text-slate-400 font-mono">[{r.topic}]</span>
                    <span className={r.type === 'out' ? 'text-cyan-400' : 'text-emerald-400 font-bold'}>
                      {r.type === 'out' ? '➔ TX:' : '⬅ RX:'} {r.message}
                    </span>
                  </div>
                ))
              )}
            </div>
          ) : (
            <div className="max-h-28 overflow-y-auto space-y-1 text-[11px] text-slate-400 pt-1">
              {serialResponses.length === 0 ? (
                <div className="text-slate-500 py-1">No serial response received yet. Connect USB to start.</div>
              ) : (
                serialResponses.map((r, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span className="text-slate-600">{r.time}</span>
                    <span className={r.type === 'out' ? 'text-cyan-400' : 'text-emerald-400 font-bold'}>
                      {r.type === 'out' ? '➔ TX:' : '⬅ RX:'} {r.text}
                    </span>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* HARDWARE OVERVIEW TELEMETRY */}
      {/* ========================================================================= */}
      <div className="zeno-card p-6 sm:p-8">
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-[#232938]">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-[#0e111a] border border-[#242c3f] flex items-center justify-center text-cyan-400">
              <Cpu className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Device Status & Telemetry</h3>
              <p className="text-xs text-slate-400">Device ID: {connMode === 'mqtt' ? mqttConfig.deviceId : device.deviceId}</p>
            </div>
          </div>

          <button
            onClick={handleRestart}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-400 text-xs font-bold transition-all"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Restart ZENO
          </button>
        </div>

        {/* Telemetry Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl bg-[#0e111a] border border-[#232938]">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
              Connection
            </span>
            <div className="text-sm font-bold text-white flex items-center gap-2">
              <span
                className={`w-2.5 h-2.5 rounded-full ${
                  (connMode === 'mqtt' ? espMqttTelemetry.online : device.connected)
                    ? 'bg-emerald-500 animate-pulse'
                    : 'bg-rose-500'
                }`}
              />
              {(connMode === 'mqtt' ? espMqttTelemetry.online : device.connected) ? 'Connected' : 'Disconnected'}
            </div>
          </div>

          <div className="p-4 rounded-xl bg-[#0e111a] border border-[#232938]">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
              Wi-Fi RSSI
            </span>
            <div className="text-sm font-bold text-white flex items-center gap-1.5 font-mono">
              <Wifi className="w-4 h-4 text-cyan-400" />
              {espMqttTelemetry.rssi ? `${espMqttTelemetry.rssi} dBm` : `${device.wifiRssi} dBm`}
            </div>
          </div>

          <div className="p-4 rounded-xl bg-[#0e111a] border border-[#232938]">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
              IP Address
            </span>
            <div className="text-sm font-bold text-white font-mono">
              {espMqttTelemetry.ip || device.ipAddress}
            </div>
          </div>

          <div className="p-4 rounded-xl bg-[#0e111a] border border-[#232938]">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
              Firmware
            </span>
            <div className="text-sm font-bold text-cyan-400 font-mono">v1.2.0-MQTT</div>
          </div>

          <div className="p-4 rounded-xl bg-[#0e111a] border border-[#232938]">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
              Uptime
            </span>
            <div className="text-sm font-bold text-white font-mono">{formatUptime(device.uptimeSeconds)}</div>
          </div>

          <div className="p-4 rounded-xl bg-[#0e111a] border border-[#232938]">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
              Battery
            </span>
            <div className="text-sm font-bold text-emerald-400 font-mono flex items-center gap-1">
              <Battery className="w-4 h-4" />
              {device.batteryPercentage}% ({device.batteryVoltage}V)
            </div>
          </div>

          <div className="p-4 rounded-xl bg-[#0e111a] border border-[#232938]">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
              Microphone
            </span>
            <div className="text-sm font-bold text-emerald-400">
              {connMode === 'mqtt' && espMqttMic.raw > 0 ? `ADC: ${espMqttMic.raw}` : 'Ready (I2S/Analog)'}
            </div>
          </div>

          <div className="p-4 rounded-xl bg-[#0e111a] border border-[#232938]">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
              16x2 LCD
            </span>
            <div className="text-sm font-bold text-emerald-400">Ready (I2C)</div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SPEAKER & MICROPHONE HARDWARE TESTS */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* SPEAKER TEST */}
        <div className="zeno-card p-6 flex flex-col justify-between space-y-6">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Volume2 className="w-5 h-5 text-cyan-400" />
                Speaker Test
              </h3>
              <span className="text-xs text-slate-500 font-mono">Dual Speakers</span>
            </div>

            <p className="text-xs text-slate-400 mb-4">
              Verify amplifier output and test left/right stereo audio channel balance.
            </p>

            {/* Channel selection */}
            <div className="space-y-3 mb-6">
              <label className="text-xs font-semibold text-slate-300 block">Channel Balance:</label>
              <div className="grid grid-cols-3 gap-2">
                {(['left', 'both', 'right'] as const).map((ch) => (
                  <button
                    key={ch}
                    onClick={() => setSpeakerChannel(ch)}
                    className={`py-2 rounded-xl text-xs font-bold uppercase transition-all ${
                      speakerChannel === ch
                        ? 'bg-cyan-500 text-white shadow-md shadow-cyan-500/20'
                        : 'bg-[#0e111a] border border-[#232938] text-slate-400 hover:text-white'
                    }`}
                  >
                    [ {ch} ]
                  </button>
                ))}
              </div>
            </div>

            {/* Volume slider */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs text-slate-300 font-semibold">
                <span>Output Volume</span>
                <span className="font-mono text-cyan-400">{speakerVolume}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={speakerVolume}
                onChange={(e) => setSpeakerVolume(parseInt(e.target.value, 10))}
                className="w-full accent-cyan-400 bg-slate-800 h-2 rounded-lg cursor-pointer"
              />
            </div>
          </div>

          <button
            onClick={handleTestSpeaker}
            disabled={isPlayingSpeakerTest}
            className="zeno-btn-primary w-full font-bold text-xs uppercase tracking-wider py-3"
          >
            <Volume2 className={`w-4 h-4 ${isPlayingSpeakerTest ? 'animate-bounce' : ''}`} />
            🔊 Play Test Sound
          </button>
        </div>

        {/* MICROPHONE TEST */}
        <div className="zeno-card p-6 flex flex-col justify-between space-y-6">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Mic className="w-5 h-5 text-cyan-400" />
                Microphone VU Test
              </h3>
              <span className="text-xs text-emerald-400 font-mono font-semibold">
                {connMode === 'mqtt' && espMqttTelemetry.online ? 'STREAMING FROM ESP32' : 'READY'}
              </span>
            </div>

            <p className="text-xs text-slate-400 mb-4">
              {connMode === 'mqtt' && espMqttTelemetry.online
                ? 'Real-time telemetry streamed directly from ESP32 Microphone (GPIO 34) over MQTT.'
                : 'Live audio-level VU meter from browser microphone analyzer.'}
            </p>

            {/* Live Audio Level VU Meter */}
            <div className="p-4 rounded-2xl bg-[#0e111a] border border-[#232938] space-y-3">
              <div className="flex justify-between items-center text-xs font-semibold text-slate-400">
                <span>LOW</span>
                <span className="font-mono text-cyan-400">
                  {connMode === 'mqtt' && espMqttTelemetry.online
                    ? `${espMqttMic.percent}% (ADC: ${espMqttMic.raw})`
                    : `${localMicVuLevel}% LEVEL`}
                </span>
                <span>HIGH</span>
              </div>

              {/* Segmented VU Meter */}
              <div className="flex items-center gap-1 h-8">
                {Array.from({ length: 20 }).map((_, i) => {
                  const threshold = (i / 20) * 100;
                  const currentVal =
                    connMode === 'mqtt' && espMqttTelemetry.online ? espMqttMic.percent : localMicVuLevel;
                  const isActive = currentVal >= threshold;
                  const color =
                    i > 15 ? 'bg-rose-500' : i > 10 ? 'bg-amber-400' : 'bg-emerald-400';

                  return (
                    <div
                      key={i}
                      className={`flex-1 h-full rounded-sm transition-all duration-75 ${
                        isActive ? color : 'bg-[#182030]'
                      }`}
                    />
                  );
                })}
              </div>

              <div className="text-[10px] text-slate-500 text-center font-mono">
                {connMode === 'mqtt'
                  ? espMqttTelemetry.online
                    ? 'Receiving telemetry from physical ESP32'
                    : 'Connect MQTT broker to stream ESP32 microphone'
                  : isLocalMicTesting
                  ? 'Capturing live audio signal'
                  : 'Press button below to start live VU test'}
              </div>
            </div>
          </div>

          <button
            onClick={handleTriggerMicTest}
            className={`w-full py-3 rounded-xl font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
              isLocalMicTesting
                ? 'bg-rose-500/20 border border-rose-500/40 text-rose-300'
                : 'zeno-btn-secondary text-cyan-400'
            }`}
          >
            <Mic className="w-4 h-4" />
            {connMode === 'mqtt' ? 'Trigger ESP32 Mic Sample' : isLocalMicTesting ? 'Stop VU Meter Test' : 'Start Live VU Meter'}
          </button>
        </div>
      </div>
    </div>
  );
};
