import React, { useState, useEffect } from 'react';
import { useZeno } from '../context/ZenoContext';
import { LcdSimulator } from '../components/LcdSimulator';
import { api } from '../services/api';
import { audioService } from '../services/audio';
import {
  Cpu,
  Wifi,
  Battery,
  Mic,
  Volume2,
  RotateCcw,
} from 'lucide-react';

export const DevicePage: React.FC = () => {
  const { device, showToast, refreshDevice } = useZeno();

  // Speaker Test States
  const [speakerChannel, setSpeakerChannel] = useState<'left' | 'right' | 'both'>('both');
  const [speakerVolume, setSpeakerVolume] = useState(80);
  const [isPlayingSpeakerTest, setIsPlayingSpeakerTest] = useState(false);

  // Microphone VU meter test states
  const [isMicTesting, setIsMicTesting] = useState(false);
  const [micVuLevel, setMicVuLevel] = useState(0);

  // Mic test cleanup
  useEffect(() => {
    let stopMic: (() => void) | null = null;
    if (isMicTesting) {
      audioService.startMicAnalyzer(level => {
        setMicVuLevel(level);
      }).then(cleanup => {
        stopMic = cleanup;
      });
    } else {
      setMicVuLevel(0);
    }
    return () => {
      if (stopMic) stopMic();
    };
  }, [isMicTesting]);

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
          ZENO DEVICE CONTROL
        </h2>
        <p className="text-slate-400 text-sm max-w-xl mx-auto">
          Monitor physical ESP32 telemetry, test microphones and speakers, and control the 16x2 LCD display.
        </p>
      </div>

      {/* SECTION 11: DEVICE TELEMETRY MATRIX */}
      <div className="zeno-card p-6 sm:p-8">
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-[#232938]">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-[#0e111a] border border-[#242c3f] flex items-center justify-center text-cyan-400">
              <Cpu className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Hardware Overview</h3>
              <p className="text-xs text-slate-400">Device ID: {device.deviceId}</p>
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
              <span className={`w-2.5 h-2.5 rounded-full ${device.connected ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
              {device.connected ? 'Connected' : 'Disconnected'}
            </div>
          </div>

          <div className="p-4 rounded-xl bg-[#0e111a] border border-[#232938]">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
              Wi-Fi RSSI
            </span>
            <div className="text-sm font-bold text-white flex items-center gap-1.5 font-mono">
              <Wifi className="w-4 h-4 text-cyan-400" />
              {device.wifiRssi} dBm (Good)
            </div>
          </div>

          <div className="p-4 rounded-xl bg-[#0e111a] border border-[#232938]">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
              IP Address
            </span>
            <div className="text-sm font-bold text-white font-mono">{device.ipAddress}</div>
          </div>

          <div className="p-4 rounded-xl bg-[#0e111a] border border-[#232938]">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
              Firmware
            </span>
            <div className="text-sm font-bold text-cyan-400 font-mono">{device.firmwareVersion}</div>
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
            <div className="text-sm font-bold text-emerald-400">Ready (I2S)</div>
          </div>

          <div className="p-4 rounded-xl bg-[#0e111a] border border-[#232938]">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
              Speaker Amp
            </span>
            <div className="text-sm font-bold text-emerald-400">Ready (MAX98357A)</div>
          </div>
        </div>
      </div>

      {/* SECTION 12: 16x2 LCD CONTROL */}
      <LcdSimulator />

      {/* SECTION 13 & 14: SPEAKER & MICROPHONE TESTS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* SECTION 13: SPEAKER TEST */}
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
                {(['left', 'both', 'right'] as const).map(ch => (
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
                onChange={e => setSpeakerVolume(parseInt(e.target.value, 10))}
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

        {/* SECTION 14: MICROPHONE TEST */}
        <div className="zeno-card p-6 flex flex-col justify-between space-y-6">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Mic className="w-5 h-5 text-cyan-400" />
                Microphone Test
              </h3>
              <span className="text-xs text-emerald-400 font-mono font-semibold">READY</span>
            </div>

            <p className="text-xs text-slate-400 mb-4">
              Live audio-level VU meter. Audio is evaluated strictly for sensitivity and is not stored.
            </p>

            {/* Live Audio Level VU Meter */}
            <div className="p-4 rounded-2xl bg-[#0e111a] border border-[#232938] space-y-3">
              <div className="flex justify-between items-center text-xs font-semibold text-slate-400">
                <span>LOW</span>
                <span className="font-mono text-cyan-400">{micVuLevel}% LEVEL</span>
                <span>HIGH</span>
              </div>

              {/* Segmented VU Meter */}
              <div className="flex items-center gap-1 h-8">
                {Array.from({ length: 20 }).map((_, i) => {
                  const threshold = (i / 20) * 100;
                  const isActive = micVuLevel >= threshold;
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
                {isMicTesting ? 'Capturing live audio signal' : 'Press button below to start live VU test'}
              </div>
            </div>
          </div>

          <button
            onClick={() => setIsMicTesting(prev => !prev)}
            className={`w-full py-3 rounded-xl font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
              isMicTesting
                ? 'bg-rose-500/20 border border-rose-500/40 text-rose-300'
                : 'zeno-btn-secondary text-cyan-400'
            }`}
          >
            <Mic className="w-4 h-4" />
            {isMicTesting ? 'Stop VU Meter Test' : 'Start Live VU Meter'}
          </button>
        </div>
      </div>
    </div>
  );
};
