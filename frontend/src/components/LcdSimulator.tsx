import React, { useState } from 'react';
import { useZeno } from '../context/ZenoContext';
import { api } from '../services/api';
import { Monitor, Send, Sparkles } from 'lucide-react';

export const LcdSimulator: React.FC = () => {
  const { device, showToast, refreshDevice } = useZeno();
  const [line1, setLine1] = useState(device.lcdLine1 || 'ZENO');
  const [line2, setLine2] = useState(device.lcdLine2 || 'Listening...');
  const [theme, setTheme] = useState<'green' | 'blue'>('green');
  const [isSending, setIsSending] = useState(false);

  const handleSend = async () => {
    setIsSending(true);
    try {
      await api.updateLcd(line1, line2);
      await refreshDevice();
      showToast('Sent to ZENO 16x2 LCD display', 'success');
    } catch (e) {
      showToast('Failed to update LCD display', 'error');
    } finally {
      setIsSending(false);
    }
  };

  const applyPreset = async (l1: string, l2: string) => {
    setLine1(l1);
    setLine2(l2);
    try {
      await api.updateLcd(l1, l2);
      await refreshDevice();
      showToast(`Applied preset: "${l1} / ${l2}"`, 'info');
    } catch (e) {
      showToast('Failed to apply preset', 'error');
    }
  };

  return (
    <div className="zeno-card">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          <Monitor className="w-5 h-5 text-cyan-400" />
          16x2 LCD Display Controller
        </h3>
        <button
          onClick={() => setTheme(prev => (prev === 'green' ? 'blue' : 'green'))}
          className="text-xs px-2.5 py-1 rounded-lg bg-[#0e111a] border border-[#232938] text-slate-400 hover:text-cyan-400 transition-colors"
        >
          {theme === 'green' ? 'Switch to Blue Backlight' : 'Switch to Green Backlight'}
        </button>
      </div>

      {/* Realistic 16x2 LCD Hardware Frame */}
      <div className="bg-[#12161f] p-4 sm:p-6 rounded-2xl border-4 border-[#242b3b] shadow-2xl mb-6">
        <div className="flex justify-between items-center text-[10px] text-slate-500 font-mono uppercase mb-2 px-1">
          <span>HD44780 / I2C 0x27</span>
          <span>16 CHARS × 2 LINES</span>
        </div>

        <div
          className={`p-4 sm:p-5 rounded-xl border-2 font-lcd text-2xl sm:text-3xl leading-snug tracking-[0.18em] transition-all select-none overflow-hidden ${
            theme === 'green'
              ? 'lcd-screen border-emerald-900/60'
              : 'lcd-screen-blue border-cyan-900/60'
          }`}
        >
          <div className="whitespace-pre truncate">{device.lcdLine1.padEnd(16, ' ').substring(0, 16)}</div>
          <div className="whitespace-pre truncate">{device.lcdLine2.padEnd(16, ' ').substring(0, 16)}</div>
        </div>
      </div>

      {/* Input Controls */}
      <div className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1.5">
              Line 1 (Max 16 chars)
            </label>
            <input
              type="text"
              maxLength={16}
              value={line1}
              onChange={e => setLine1(e.target.value)}
              placeholder="e.g. ZENO"
              className="w-full bg-[#0c0e12] border border-[#242c3f] rounded-xl px-3.5 py-2 text-sm text-white font-mono focus:outline-none focus:border-cyan-500 transition-all"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1.5">
              Line 2 (Max 16 chars)
            </label>
            <input
              type="text"
              maxLength={16}
              value={line2}
              onChange={e => setLine2(e.target.value)}
              placeholder="e.g. Listening..."
              className="w-full bg-[#0c0e12] border border-[#242c3f] rounded-xl px-3.5 py-2 text-sm text-white font-mono focus:outline-none focus:border-cyan-500 transition-all"
            />
          </div>
        </div>

        <button
          onClick={handleSend}
          disabled={isSending}
          className="zeno-btn-primary w-full text-sm font-bold py-3"
        >
          <Send className="w-4 h-4" />
          {isSending ? 'Sending to Hardware...' : 'SHOW ON ZENO'}
        </button>

        {/* Quick Presets */}
        <div>
          <div className="text-xs font-semibold text-slate-400 mb-2 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            Display Presets
          </div>
          <div className="flex flex-wrap gap-2">
            {[
              { label: 'ONLINE', l1: 'ZENO', l2: 'System Online' },
              { label: 'LISTENING', l1: 'ZENO', l2: 'Listening...' },
              { label: 'THINKING', l1: 'ZENO', l2: 'Thinking...' },
              { label: 'SPEAKING', l1: 'ZENO', l2: 'Speaking...' },
              { label: 'OFFLINE', l1: 'ZENO', l2: 'Offline' },
            ].map(preset => (
              <button
                key={preset.label}
                onClick={() => applyPreset(preset.l1, preset.l2)}
                className="px-3 py-1.5 rounded-lg bg-[#1a202c] hover:bg-[#252d3d] border border-[#2d374a] text-xs font-mono font-medium text-slate-300 hover:text-white transition-all active:scale-95"
              >
                [ {preset.label} ]
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
