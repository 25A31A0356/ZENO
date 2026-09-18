import React from 'react';
import { useZeno } from '../context/ZenoContext';
import { ActivityHero } from '../components/ActivityHero';
import { StatusCards } from '../components/StatusCards';
import { LcdSimulator } from '../components/LcdSimulator';
import { MessageSquare, Clock, Zap, ArrowRight, Mic, BookOpen, Cpu, Sparkles } from 'lucide-react';

interface DashboardPageProps {
  setActiveTab: (tab: string) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ setActiveTab }) => {
  const { conversations, isAdvancedMode } = useZeno();

  const recentConversations = conversations.slice(0, 3);

  return (
    <div className="space-y-8 pb-12">
      {/* 1. Central Live ZENO Activity Panel */}
      <section>
        <div className="flex items-center justify-between mb-3 px-1">
          <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
            Live ZENO Activity
          </h2>
          <span className="text-xs text-slate-500 font-mono">Real-time Pipeline</span>
        </div>
        <ActivityHero onOpenTalk={() => setActiveTab('talk')} />
      </section>

      {/* 2. Six Core Hardware & Service Overview Cards */}
      <section>
        <div className="flex items-center justify-between mb-4 px-1">
          <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400">
            System & Hardware Health
          </h2>
          <span className="text-xs text-slate-500">6 Subsystem Nodes</span>
        </div>
        <StatusCards onNavigate={setActiveTab} />
      </section>

      {/* 3. Quick Action Bar */}
      <section className="bg-gradient-to-r from-[#161c2a] via-[#1a2133] to-[#161c2a] p-5 rounded-2xl border border-[#273147] shadow-xl">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-cyan-400" />
              Quick Actions
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">Instant controls for voice, teaching, and hardware</p>
          </div>
          <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
            <button
              onClick={() => setActiveTab('talk')}
              className="zeno-btn-primary flex-1 sm:flex-initial text-xs font-bold px-5"
            >
              <Mic className="w-4 h-4" />
              TALK
            </button>
            <button
              onClick={() => setActiveTab('teach')}
              className="zeno-btn-secondary flex-1 sm:flex-initial text-xs font-bold px-5"
            >
              <BookOpen className="w-4 h-4 text-purple-400" />
              TEACH ZENO
            </button>
            <button
              onClick={() => setActiveTab('device')}
              className="zeno-btn-secondary flex-1 sm:flex-initial text-xs font-bold px-5"
            >
              <Cpu className="w-4 h-4 text-cyan-400" />
              DEVICE
            </button>
          </div>
        </div>
      </section>

      {/* 4. Recent Conversations & Optional 16x2 LCD in Advanced Mode */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Conversations Feed */}
        <section className={`zeno-card ${isAdvancedMode ? 'lg:col-span-2' : 'lg:col-span-3'}`}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-cyan-400" />
              Recent Conversations
            </h3>
            <button
              onClick={() => setActiveTab('history')}
              className="text-xs font-semibold text-cyan-400 hover:text-cyan-300 flex items-center gap-1 transition-colors"
            >
              View All
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {recentConversations.length === 0 ? (
            <div className="text-center py-8 text-slate-500 text-sm">
              No conversations recorded yet. Tap <strong>Talk</strong> to begin speaking with ZENO!
            </div>
          ) : (
            <div className="space-y-4">
              {recentConversations.map(conv => (
                <div
                  key={conv.id}
                  className="p-4 rounded-xl bg-[#0e111a] border border-[#202738] space-y-2 hover:border-[#2d374e] transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded bg-blue-500/15 border border-blue-500/30 text-blue-400 text-[10px] font-bold tracking-wider uppercase">
                        YOU
                      </span>
                      <span className="text-sm font-semibold text-slate-200">
                        "{conv.userQuery}"
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-[11px] text-slate-500 shrink-0 font-mono">
                      <Clock className="w-3 h-3" />
                      <span>{new Date(conv.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </div>

                  <div className="flex items-start gap-2 pl-2 border-l-2 border-cyan-500/40 mt-1">
                    <div>
                      <span className="text-xs font-bold text-cyan-400 mr-2">ZENO:</span>
                      <span className="text-xs text-slate-300 leading-relaxed">
                        {conv.zenoResponse}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 pt-1 text-[10px] text-slate-500 font-mono">
                    <span className="flex items-center gap-1 text-amber-400/90">
                      <Zap className="w-3 h-3" />
                      {(conv.responseTimeMs / 1000).toFixed(2)}s response
                    </span>
                    {conv.retrievedKnowledge && conv.retrievedKnowledge.length > 0 && (
                      <span className="text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/20 truncate max-w-xs">
                        Knowledge: {conv.retrievedKnowledge.join(', ')}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* 16x2 LCD Controller Panel in Advanced Mode */}
        {isAdvancedMode && (
          <section className="lg:col-span-1">
            <LcdSimulator />
          </section>
        )}
      </div>
    </div>
  );
};
