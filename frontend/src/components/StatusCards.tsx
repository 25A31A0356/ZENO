import React from 'react';
import { useZeno } from '../context/ZenoContext';
import {
  Cpu,
  Mic,
  BrainCircuit,
  Volume2,
  Battery,
  Monitor,
  Wifi,
  Clock,
  Zap,
} from 'lucide-react';
import { api } from '../services/api';
import { audioService } from '../services/audio';

interface StatusCardsProps {
  onNavigate: (tab: string) => void;
}

export const StatusCards: React.FC<StatusCardsProps> = ({ onNavigate }) => {
  const { device, showToast, refreshDevice } = useZeno();

  const handleTestSpeaker = async () => {
    try {
      audioService.playTestTone('both');
      await api.testSpeaker('both', 80);
      showToast('Speaker test tone played successfully.', 'success');
    } catch (e) {
      showToast('Failed to trigger speaker test', 'error');
    }
  };

  const handleTestMic = async () => {
    try {
      await api.testMicrophone();
      showToast('Microphone test active: Speak into your device', 'info');
      onNavigate('device');
    } catch (e) {
      showToast('Failed to trigger microphone test', 'error');
    }
  };

  const handleTestDisplay = async () => {
    try {
      await api.testDisplay();
      await refreshDevice();
      showToast('Display test pattern sent to 16x2 LCD', 'success');
    } catch (e) {
      showToast('Failed to test display', 'error');
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
      {/* CARD 1 — DEVICE */}
      <div className="zeno-card flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Cpu className="w-4 h-4 text-cyan-400" />
              Device
            </span>
            {device.connected ? (
              <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Online
              </span>
            ) : (
              <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-semibold">
                <span className="w-2 h-2 rounded-full bg-rose-500" />
                Offline
              </span>
            )}
          </div>

          <div className="mb-4">
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              ESP32
              {device.connected ? (
                <span className="text-sm font-normal text-emerald-400 font-mono">Connected</span>
              ) : (
                <span className="text-sm font-normal text-rose-400 font-mono">Disconnected</span>
              )}
            </h3>
            <div className="mt-2 space-y-1 text-xs text-slate-400">
              <div className="flex items-center gap-1.5">
                <Wifi className="w-3.5 h-3.5 text-cyan-400" />
                <span>Wi-Fi: {device.connected ? `${device.wifiSsid} (${device.wifiRssi} dBm)` : 'Not Connected'}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-slate-500" />
                <span>Last seen: {device.connected ? 'Active now' : 'Device not transmitting'}</span>
              </div>
            </div>
          </div>
        </div>

        <button
          onClick={() => onNavigate('device')}
          className="zeno-btn-secondary w-full text-xs font-semibold mt-2"
        >
          Device Details
        </button>
      </div>

      {/* CARD 2 — MICROPHONE */}
      <div className="zeno-card flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Mic className="w-4 h-4 text-cyan-400" />
              Microphone
            </span>
            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              Ready
            </span>
          </div>

          <div className="mb-4">
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              🎤 Ready
            </h3>
            <p className="text-xs text-slate-400 mt-1">Listening system ready</p>

            {/* Sound-wave indicator */}
            <div className="flex items-center gap-1 mt-4 h-6 px-3 py-1.5 rounded-lg bg-[#0e111a] border border-[#232938]">
              {[30, 60, 45, 80, 50, 70, 40, 65, 35].map((h, i) => (
                <div
                  key={i}
                  className="w-1 bg-cyan-400/80 rounded-full"
                  style={{ height: `${h}%` }}
                />
              ))}
              <span className="text-[10px] text-slate-500 ml-auto font-mono">I2S Mic Active</span>
            </div>
          </div>
        </div>

        <button
          onClick={handleTestMic}
          className="zeno-btn-secondary w-full text-xs font-semibold mt-2"
        >
          Test Microphone
        </button>
      </div>

      {/* CARD 3 — AI BRAIN */}
      <div className="zeno-card flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <BrainCircuit className="w-4 h-4 text-purple-400" />
              AI Brain
            </span>
            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              Ready
            </span>
          </div>

          <div className="mb-4">
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              🧠 Ready
            </h3>
            <p className="text-xs text-slate-400 mt-1">AI service connected</p>
            <div className="mt-3 flex items-center gap-2 text-xs font-mono text-cyan-300 bg-[#0e111a] px-3 py-2 rounded-lg border border-[#232938]">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span>Response time: ~1.1 sec</span>
            </div>
          </div>
        </div>

        <button
          onClick={() => onNavigate('ai-test')}
          className="zeno-btn-secondary w-full text-xs font-semibold mt-2"
        >
          Test AI
        </button>
      </div>

      {/* CARD 4 — SPEAKER */}
      <div className="zeno-card flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Volume2 className="w-4 h-4 text-cyan-400" />
              Audio
            </span>
            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              Ready
            </span>
          </div>

          <div className="mb-4">
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              🔊 Ready
            </h3>
            <p className="text-xs text-slate-400 mt-1">Dual speakers available</p>
            <div className="mt-3 flex items-center justify-between text-xs text-slate-400 bg-[#0e111a] px-3 py-2 rounded-lg border border-[#232938]">
              <span>Stereo DAC / Amplifier</span>
              <span className="text-emerald-400 font-mono font-semibold">80% Vol</span>
            </div>
          </div>
        </div>

        <button
          onClick={handleTestSpeaker}
          className="zeno-btn-secondary w-full text-xs font-semibold mt-2"
        >
          Test Speaker
        </button>
      </div>

      {/* CARD 5 — BATTERY */}
      <div className="zeno-card flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Battery className="w-4 h-4 text-emerald-400" />
              Battery
            </span>
            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold">
              Good
            </span>
          </div>

          <div className="mb-4">
            <div className="flex items-baseline gap-3">
              <h3 className="text-3xl font-black text-white font-mono">
                {device.batteryPercentage}%
              </h3>
              <span className="text-xs font-semibold text-slate-400">
                {device.batteryVoltage.toFixed(2)} V
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              {device.isCharging ? '⚡ Charging via USB' : 'Li-ion Battery Powered (Good)'}
            </p>

            {/* Battery Level Bar */}
            <div className="w-full bg-[#0e111a] h-2.5 rounded-full mt-3 overflow-hidden border border-[#232938]">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  device.batteryPercentage > 50
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-400'
                    : device.batteryPercentage > 20
                    ? 'bg-amber-400'
                    : 'bg-rose-500'
                }`}
                style={{ width: `${device.batteryPercentage}%` }}
              />
            </div>
          </div>
        </div>

        <div className="text-[11px] text-slate-500 text-center py-1">
          Estimated runtime: ~5.5 hours
        </div>
      </div>

      {/* CARD 6 — LCD */}
      <div className="zeno-card flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Monitor className="w-4 h-4 text-cyan-400" />
              Display
            </span>
            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold">
              Connected
            </span>
          </div>

          <div className="mb-3">
            <h3 className="text-sm font-bold text-slate-300 mb-2">16x2 LCD Output:</h3>

            {/* Mini LCD Display Frame */}
            <div className="lcd-screen p-2.5 rounded-lg border border-emerald-950 font-lcd text-lg leading-tight tracking-wider">
              <div className="truncate">{device.lcdLine1.padEnd(16, ' ')}</div>
              <div className="truncate">{device.lcdLine2.padEnd(16, ' ')}</div>
            </div>
          </div>
        </div>

        <button
          onClick={handleTestDisplay}
          className="zeno-btn-secondary w-full text-xs font-semibold mt-2"
        >
          Test Display
        </button>
      </div>
    </div>
  );
};
