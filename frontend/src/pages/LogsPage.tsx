import React, { useState, useEffect } from 'react';
import { useZeno } from '../context/ZenoContext';
import { api } from '../services/api';
import { SystemLog } from '../types';
import { Terminal, Trash2, Copy, Check } from 'lucide-react';

export const LogsPage: React.FC = () => {
  const { showToast } = useZeno();
  const [logs, setLogs] = useState<SystemLog[]>([]);
  const [filterSource, setFilterSource] = useState<string>('all');
  const [isCopied, setIsCopied] = useState(false);

  const fetchLogs = async () => {
    try {
      const data = await api.getLogs(150);
      setLogs(data);
    } catch (e) {
      console.warn('Failed to fetch logs:', e);
    }
  };

  useEffect(() => {
    fetchLogs();
    const interval = setInterval(fetchLogs, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleClearLogs = async () => {
    if (confirm('Clear all system logs?')) {
      await api.clearLogs();
      fetchLogs();
      showToast('Logs cleared', 'info');
    }
  };

  const handleCopyLogs = () => {
    const formatted = logs
      .map(
        l =>
          `[${new Date(l.timestamp).toLocaleTimeString()}] [${l.level.toUpperCase()}] [${l.source.toUpperCase()}] ${l.message}`
      )
      .join('\n');
    navigator.clipboard.writeText(formatted);
    setIsCopied(true);
    showToast('Logs copied to clipboard', 'success');
    setTimeout(() => setIsCopied(false), 2000);
  };

  const filteredLogs = logs.filter(l => {
    if (filterSource === 'all') return true;
    return l.source === filterSource;
  });

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-16">
      {/* Title */}
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-black text-white tracking-tight flex items-center justify-center gap-3">
          <Terminal className="w-8 h-8 text-cyan-400" />
          ADVANCED SYSTEM LOGS
        </h2>
        <p className="text-slate-400 text-sm max-w-xl mx-auto">
          Real-time event streaming across ESP32 telemetry, speech recognition, AI reasoning, and audio synthesis.
        </p>
      </div>

      {/* Log Console Window */}
      <div className="zeno-card p-4 sm:p-6 bg-[#0a0d14] border-[#1d2436] space-y-4">
        {/* Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[#1d2436]">
          {/* Source filters */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            {['all', 'esp32', 'speech', 'ai', 'tts', 'backend', 'vision'].map(src => (
              <button
                key={src}
                onClick={() => setFilterSource(src)}
                className={`px-2.5 py-1 rounded-lg text-xs font-mono font-semibold uppercase transition-all ${
                  filterSource === src
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                    : 'bg-[#121622] text-slate-400 border border-[#232a3d] hover:text-white'
                }`}
              >
                {src}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyLogs}
              className="px-3 py-1.5 rounded-lg bg-[#141824] hover:bg-[#1c2233] border border-[#252e42] text-xs font-semibold text-slate-300 flex items-center gap-1.5 transition-colors"
            >
              {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              Copy
            </button>
            <button
              onClick={handleClearLogs}
              className="px-3 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-xs font-semibold text-rose-400 flex items-center gap-1.5 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Clear
            </button>
          </div>
        </div>

        {/* Console Output Frame */}
        <div className="bg-[#06080c] rounded-xl p-4 font-mono text-xs max-h-[500px] overflow-y-auto space-y-2 border border-[#171c2b]">
          {filteredLogs.length === 0 ? (
            <div className="text-slate-600 text-center py-8">No log events recorded.</div>
          ) : (
            filteredLogs.map(l => {
              const timeStr = new Date(l.timestamp).toLocaleTimeString();
              let levelColor = 'text-slate-400';
              if (l.level === 'warn') levelColor = 'text-amber-400 font-bold';
              if (l.level === 'error') levelColor = 'text-rose-400 font-bold';

              let sourceBadgeColor = 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20';
              if (l.source === 'esp32') sourceBadgeColor = 'bg-blue-500/10 text-blue-400 border-blue-500/20';
              if (l.source === 'ai') sourceBadgeColor = 'bg-purple-500/10 text-purple-400 border-purple-500/20';
              if (l.source === 'speech') sourceBadgeColor = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
              if (l.source === 'tts') sourceBadgeColor = 'bg-teal-500/10 text-teal-400 border-teal-500/20';

              return (
                <div key={l.id} className="flex items-start gap-3 py-0.5 hover:bg-[#10141f] px-2 rounded">
                  <span className="text-slate-500 shrink-0 select-none">{timeStr}</span>
                  <span
                    className={`px-1.5 py-0.2 rounded border text-[10px] font-bold uppercase tracking-wider shrink-0 ${sourceBadgeColor}`}
                  >
                    {l.source}
                  </span>
                  <span className={`${levelColor} break-words leading-relaxed`}>{l.message}</span>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
