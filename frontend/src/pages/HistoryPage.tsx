import React, { useState } from 'react';
import { useZeno } from '../context/ZenoContext';
import { api } from '../services/api';
import { audioService } from '../services/audio';
import {
  History,
  Search,
  Trash2,
  Volume2,
  Clock,
  Zap,
} from 'lucide-react';

export const HistoryPage: React.FC = () => {
  const { conversations, refreshConversations, showToast, settings } = useZeno();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterPeriod, setFilterPeriod] = useState<'all' | 'today' | 'week' | 'month'>('all');
  const [selectedConv, setSelectedConv] = useState<any | null>(null);

  const handleDelete = async (id: string) => {
    try {
      await api.deleteConversation(id);
      await refreshConversations();
      showToast('Conversation deleted', 'info');
      if (selectedConv?.id === id) setSelectedConv(null);
    } catch (e) {
      showToast('Failed to delete conversation', 'error');
    }
  };

  const handleClearAll = async () => {
    if (confirm('Are you sure you want to delete ALL conversation history? This cannot be undone.')) {
      try {
        await api.clearConversations();
        await refreshConversations();
        setSelectedConv(null);
        showToast('All conversation history deleted.', 'success');
      } catch (e) {
        showToast('Failed to clear history', 'error');
      }
    }
  };

  const handlePlayVoice = (text: string) => {
    audioService.speak(text, settings?.speechSpeed || 1.0);
    showToast('Playing voice response', 'info');
  };

  // Filter conversations
  const filtered = conversations.filter(c => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      c.userQuery.toLowerCase().includes(q) || c.zenoResponse.toLowerCase().includes(q);

    if (!matchesSearch) return false;

    const convDate = new Date(c.timestamp).getTime();
    const now = Date.now();

    if (filterPeriod === 'today') {
      return now - convDate <= 24 * 60 * 60 * 1000;
    }
    if (filterPeriod === 'week') {
      return now - convDate <= 7 * 24 * 60 * 60 * 1000;
    }
    if (filterPeriod === 'month') {
      return now - convDate <= 30 * 24 * 60 * 60 * 1000;
    }

    return true;
  });

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-16">
      {/* Title */}
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-black text-white tracking-tight flex items-center justify-center gap-3">
          <History className="w-8 h-8 text-cyan-400" />
          CONVERSATIONS
        </h2>
        <p className="text-slate-400 text-sm max-w-xl mx-auto">
          Review previous voice and text exchanges, inspect response latency, and replay audio answers.
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div className="zeno-card p-4 sm:p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Search */}
        <div className="w-full sm:w-80 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search conversations..."
            className="w-full bg-[#0c0e12] border border-[#242c3f] rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
          />
        </div>

        {/* Time Filters */}
        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          {(['all', 'today', 'week', 'month'] as const).map(p => (
            <button
              key={p}
              onClick={() => setFilterPeriod(p)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize whitespace-nowrap transition-all ${
                filterPeriod === p
                  ? 'bg-cyan-500 text-white shadow-md shadow-cyan-500/20'
                  : 'bg-[#0e111a] border border-[#232938] text-slate-400 hover:text-white'
              }`}
            >
              {p === 'all' ? 'All Time' : p === 'week' ? 'This Week' : p === 'month' ? 'This Month' : 'Today'}
            </button>
          ))}

          {conversations.length > 0 && (
            <button
              onClick={handleClearAll}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold text-rose-400 hover:bg-rose-500/10 border border-rose-500/30 whitespace-nowrap transition-all ml-auto"
            >
              Delete All History
            </button>
          )}
        </div>
      </div>

      {/* Conversations List */}
      <div className="space-y-4">
        {filtered.length === 0 ? (
          <div className="zeno-card p-12 text-center text-slate-500 space-y-2">
            <History className="w-10 h-10 mx-auto text-slate-600 mb-2" />
            <p className="text-sm font-semibold text-slate-400">No conversations found.</p>
            <p className="text-xs">Start a voice conversation or clear your search filter.</p>
          </div>
        ) : (
          filtered.map(c => (
            <div
              key={c.id}
              className="zeno-card p-5 sm:p-6 space-y-3 hover:border-[#333e57] transition-all"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded bg-blue-500/15 border border-blue-500/30 text-blue-400 text-[10px] font-bold uppercase tracking-wider">
                    {c.source || 'VOICE'}
                  </span>
                  <span className="text-sm font-bold text-white">
                    "{c.userQuery}"
                  </span>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-xs text-slate-500 font-mono flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {new Date(c.timestamp).toLocaleDateString()} {new Date(c.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  <button
                    onClick={() => handleDelete(c.id)}
                    className="p-1 text-slate-500 hover:text-rose-400 transition-colors"
                    title="Delete Conversation"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Response */}
              <div className="p-4 rounded-xl bg-[#0e111a] border border-[#202738] space-y-1">
                <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider block">
                  ZENO:
                </span>
                <p className="text-sm text-slate-200 leading-relaxed font-sans">
                  "{c.zenoResponse}"
                </p>
              </div>

              {/* Bottom stats and replay */}
              <div className="flex items-center justify-between pt-1 text-[11px] text-slate-500">
                <div className="flex items-center gap-3 font-mono">
                  <span className="text-amber-400 flex items-center gap-1">
                    <Zap className="w-3 h-3" />
                    {(c.responseTimeMs / 1000).toFixed(2)}s processing
                  </span>
                  {c.retrievedKnowledge && c.retrievedKnowledge.length > 0 && (
                    <span className="text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/20">
                      RAG: {c.retrievedKnowledge.join(', ')}
                    </span>
                  )}
                </div>

                <button
                  onClick={() => handlePlayVoice(c.zenoResponse)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#1a2130] hover:bg-[#242e42] text-cyan-300 font-semibold text-xs border border-cyan-500/20 transition-colors"
                >
                  <Volume2 className="w-3.5 h-3.5" />
                  Replay Voice
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
