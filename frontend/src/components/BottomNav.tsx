import React from 'react';
import { Sparkles, Mic, BookOpen, Cpu, Settings as SettingsIcon } from 'lucide-react';

interface BottomNavProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ activeTab, setActiveTab }) => {
  const items = [
    { id: 'dashboard', label: 'Home', icon: <Sparkles className="w-5 h-5" /> },
    { id: 'teach', label: 'Teach', icon: <BookOpen className="w-5 h-5" /> },
    { id: 'talk', label: 'Talk', icon: <Mic className="w-6 h-6" />, isCenter: true },
    { id: 'device', label: 'Device', icon: <Cpu className="w-5 h-5" /> },
    { id: 'settings', label: 'Settings', icon: <SettingsIcon className="w-5 h-5" /> },
  ];

  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#0e111a]/95 backdrop-blur-xl border-t border-[#1f2637] px-4 py-2">
      <div className="flex items-center justify-around max-w-md mx-auto">
        {items.map(item => {
          if (item.isCenter) {
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className="relative -top-4 flex flex-col items-center group"
              >
                <div className="w-13 h-13 rounded-full bg-gradient-to-tr from-cyan-500 to-blue-600 p-3.5 shadow-xl shadow-cyan-500/30 text-white transform group-active:scale-95 transition-all">
                  {item.icon}
                </div>
                <span className="text-[10px] font-bold text-cyan-400 mt-0.5">Talk</span>
              </button>
            );
          }

          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex flex-col items-center gap-1 py-1 px-2 rounded-xl transition-all ${
                isActive ? 'text-cyan-400 font-semibold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {item.icon}
              <span className="text-[10px]">{item.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
