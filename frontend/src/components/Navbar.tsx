import React from 'react';
import { useZeno } from '../context/ZenoContext';
import {
  Sparkles,
  Play,
  Cpu,
  Mic,
  BookOpen,
  History,
  Activity,
  Settings as SettingsIcon,
  Terminal,
  Eye,
  BrainCircuit,
  SlidersHorizontal,
} from 'lucide-react';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ activeTab, setActiveTab }) => {
  const { device, isAdvancedMode, toggleAdvancedMode, runDemo, isDemoRunning, alerts } = useZeno();

  const getStatusBadge = () => {
    if (!device.connected) {
      return (
        <span className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-semibold tracking-wider">
          <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
          🔴 OFFLINE
        </span>
      );
    }
    if (alerts.filter(a => !a.resolved).length > 0) {
      return (
        <span className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-semibold tracking-wider">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
          ⚠️ WARNING
        </span>
      );
    }
    return (
      <span className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold tracking-wider shadow-lg shadow-emerald-500/10">
        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
        🟢 ZENO ONLINE
      </span>
    );
  };

  const navItems = [
    { id: 'dashboard', label: 'Home', icon: <Sparkles className="w-4 h-4" /> },
    { id: 'talk', label: 'Talk', icon: <Mic className="w-4 h-4" /> },
    { id: 'teach', label: 'Teach ZENO', icon: <BookOpen className="w-4 h-4" /> },
    { id: 'device', label: 'Device', icon: <Cpu className="w-4 h-4" /> },
    { id: 'ai-test', label: 'Test AI', icon: <BrainCircuit className="w-4 h-4" /> },
    { id: 'vision', label: 'Vision', icon: <Eye className="w-4 h-4" /> },
    { id: 'history', label: 'History', icon: <History className="w-4 h-4" /> },
    { id: 'health', label: 'Health', icon: <Activity className="w-4 h-4" /> },
    { id: 'settings', label: 'Settings', icon: <SettingsIcon className="w-4 h-4" /> },
    ...(isAdvancedMode ? [{ id: 'logs', label: 'Logs', icon: <Terminal className="w-4 h-4" /> }] : []),
  ];

  return (
    <header className="sticky top-0 z-40 bg-[#0c0e12]/90 backdrop-blur-xl border-b border-[#1f2637]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo & Tagline */}
          <div className="flex items-center gap-4 cursor-pointer" onClick={() => setActiveTab('dashboard')}>
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-cyan-500 via-blue-600 to-indigo-600 p-0.5 shadow-lg shadow-cyan-500/20">
              <div className="w-full h-full bg-[#121622] rounded-[14px] flex items-center justify-center">
                <span className="text-xl font-extrabold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
                  Z
                </span>
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-black tracking-tight text-white font-sans">ZENO</h1>
                {getStatusBadge()}
              </div>
              <p className="text-xs font-medium text-slate-400 tracking-wide">Listen. Think. Respond.</p>
            </div>
          </div>

          {/* Center Nav Tabs (Desktop) */}
          <nav className="hidden lg:flex items-center gap-1 bg-[#151926]/80 p-1.5 rounded-2xl border border-[#242c3f]">
            {navItems.map(item => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-medium transition-all ${
                  activeTab === item.id
                    ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-md shadow-cyan-500/20'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-[#1f2638]'
                }`}
              >
                {item.icon}
                {item.label}
              </button>
            ))}
          </nav>

          {/* Right Actions: Mode Toggle & Demo Mode */}
          <div className="flex items-center gap-3">
            {/* Beginner / Advanced Mode Switch */}
            <button
              onClick={toggleAdvancedMode}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all ${
                isAdvancedMode
                  ? 'bg-purple-500/15 border-purple-500/40 text-purple-300'
                  : 'bg-slate-800/60 border-slate-700 text-slate-300 hover:border-slate-600'
              }`}
              title="Toggle between simplified beginner view and full technical diagnostic view"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{isAdvancedMode ? 'ADVANCED' : 'BEGINNER'}</span>
            </button>

            {/* Presentation Demo Button */}
            <button
              onClick={runDemo}
              disabled={isDemoRunning}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-xs tracking-wider transition-all shadow-lg ${
                isDemoRunning
                  ? 'bg-amber-500/20 border border-amber-500/50 text-amber-300 cursor-not-allowed animate-pulse'
                  : 'bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white shadow-emerald-500/20 active:scale-95'
              }`}
            >
              <Play className={`w-3.5 h-3.5 ${isDemoRunning ? 'animate-spin' : 'fill-current'}`} />
              {isDemoRunning ? 'DEMO RUNNING...' : 'START DEMO'}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
