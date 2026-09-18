import React from 'react';
import { useZeno } from '../context/ZenoContext';
import { Mic, BrainCircuit, Volume2, Sparkles, PowerOff, AlertCircle } from 'lucide-react';

interface ActivityHeroProps {
  onOpenTalk: () => void;
}

export const ActivityHero: React.FC<ActivityHeroProps> = ({ onOpenTalk }) => {
  const { state, transcript, isDemoRunning } = useZeno();

  const getStateDetails = () => {
    switch (state) {
      case 'LISTENING':
        return {
          title: 'LISTENING',
          subtitle: transcript ? `"${transcript}"` : 'ZENO is listening to your voice...',
          icon: <Mic className="w-10 h-10 text-cyan-400 animate-bounce" />,
          glowColor: 'from-cyan-500/20 via-blue-500/20 to-transparent',
          borderColor: 'border-cyan-500/50',
          badgeBg: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40',
          animation: 'animate-pulse',
        };
      case 'THINKING':
        return {
          title: 'THINKING...',
          subtitle: transcript ? `Consulting AI engine & knowledge for: "${transcript}"` : 'Processing neural response...',
          icon: <BrainCircuit className="w-10 h-10 text-purple-400 animate-spin" />,
          glowColor: 'from-purple-500/25 via-indigo-500/20 to-transparent',
          borderColor: 'border-purple-500/50',
          badgeBg: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
          animation: 'animate-pulse',
        };
      case 'SPEAKING':
        return {
          title: 'SPEAKING...',
          subtitle: transcript ? `"${transcript}"` : 'ZENO is answering through dual speakers...',
          icon: <Volume2 className="w-10 h-10 text-emerald-400 animate-pulse" />,
          glowColor: 'from-emerald-500/20 via-teal-500/20 to-transparent',
          borderColor: 'border-emerald-500/50',
          badgeBg: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
          animation: 'animate-pulse-slow',
        };
      case 'OFFLINE':
        return {
          title: 'OFFLINE',
          subtitle: 'ESP32 device is not connected. Turn on the device or start Demo Mode.',
          icon: <PowerOff className="w-10 h-10 text-rose-400" />,
          glowColor: 'from-rose-500/10 via-red-500/10 to-transparent',
          borderColor: 'border-rose-500/30',
          badgeBg: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
          animation: '',
        };
      case 'ERROR':
        return {
          title: 'SYSTEM ERROR',
          subtitle: transcript || 'An unexpected error occurred in the speech or AI pipeline.',
          icon: <AlertCircle className="w-10 h-10 text-amber-400" />,
          glowColor: 'from-amber-500/15 via-orange-500/15 to-transparent',
          borderColor: 'border-amber-500/40',
          badgeBg: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
          animation: '',
        };
      case 'IDLE':
      default:
        return {
          title: 'READY',
          subtitle: 'ZENO is standing by. Press the Talk button or say "Hey ZENO".',
          icon: <Sparkles className="w-10 h-10 text-cyan-400" />,
          glowColor: 'from-cyan-500/10 via-blue-500/10 to-transparent',
          borderColor: 'border-[#293245]',
          badgeBg: 'bg-slate-800/80 text-slate-300 border-slate-700',
          animation: '',
        };
    }
  };

  const details = getStateDetails();

  return (
    <div className={`relative overflow-hidden rounded-3xl border ${details.borderColor} bg-[#141824] shadow-2xl transition-all duration-500`}>
      {/* Background ambient glow */}
      <div className={`absolute inset-0 bg-gradient-to-b ${details.glowColor} pointer-events-none opacity-60`} />

      {/* Demo Mode watermark if demo is active */}
      {isDemoRunning && (
        <div className="absolute top-4 right-4 z-20 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-bold tracking-widest animate-pulse">
          DEMO MODE ACTIVE
        </div>
      )}

      <div className="relative z-10 p-8 sm:p-10 flex flex-col items-center text-center">
        {/* Animated Central Orb / Icon Container */}
        <div className="relative mb-6">
          {/* Pulsing rings */}
          {(state === 'LISTENING' || state === 'THINKING' || state === 'SPEAKING') && (
            <div className="absolute -inset-4 rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 opacity-30 blur-xl animate-pulse" />
          )}

          <div className="w-24 h-24 rounded-3xl bg-[#1b2132] border border-white/10 shadow-2xl flex items-center justify-center relative z-10 transition-transform duration-300 hover:scale-105">
            {details.icon}
          </div>
        </div>

        {/* State Badge */}
        <div className={`px-4 py-1.5 rounded-full border text-xs font-extrabold tracking-widest uppercase mb-3 ${details.badgeBg}`}>
          {details.title}
        </div>

        {/* Dynamic Subtitle / Live Transcript */}
        <h2 className="text-xl sm:text-2xl font-bold text-white max-w-2xl leading-relaxed tracking-tight min-h-[3rem] flex items-center justify-center">
          {details.subtitle}
        </h2>

        {/* Real-time soundwave visualizer when listening or speaking */}
        {(state === 'LISTENING' || state === 'SPEAKING') && (
          <div className="flex items-center gap-1.5 mt-6 h-8">
            {[40, 70, 30, 90, 60, 100, 45, 80, 50, 95, 35, 75].map((height, i) => (
              <div
                key={i}
                className="w-1.5 bg-gradient-to-t from-cyan-500 to-blue-400 rounded-full transition-all duration-200 animate-pulse"
                style={{
                  height: `${height}%`,
                  animationDelay: `${i * 70}ms`,
                }}
              />
            ))}
          </div>
        )}

        {/* Quick action button */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
          <button
            onClick={onOpenTalk}
            className="zeno-btn-primary px-6 py-3 text-sm font-semibold rounded-2xl"
          >
            <Mic className="w-4 h-4" />
            Talk to ZENO
          </button>
        </div>
      </div>
    </div>
  );
};
