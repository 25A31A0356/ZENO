import React, { useState } from 'react';
import { useZeno } from '../context/ZenoContext';
import { api } from '../services/api';
import { BrainCircuit, Send, Sparkles, BookOpen, Zap, CornerDownRight } from 'lucide-react';

export const AiTestPage: React.FC = () => {
  const { showToast } = useZeno();
  const [promptInput, setPromptInput] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [result, setResult] = useState<{
    query: string;
    answer: string;
    responseTimeMs: number;
    sources: any[];
  } | null>(null);

  const samplePrompts = [
    "Explain Newton's second law.",
    "What is thermodynamics?",
    "What is an ESP32?",
    "Tell me about the ZENO project.",
    "What is the current time and status?",
  ];

  const handleAsk = async (queryText: string) => {
    const q = queryText.trim();
    if (!q) return;

    setIsThinking(true);
    setResult(null);

    try {
      const startTime = Date.now();
      const res = await api.sendChat(q, 'text');
      const responseTimeMs = Date.now() - startTime;

      setResult({
        query: q,
        answer: res.conversation.zenoResponse,
        responseTimeMs,
        sources: res.sources || [],
      });
      showToast('AI response generated', 'success');
    } catch (e: any) {
      showToast(e.message || 'Error querying AI engine', 'error');
    } finally {
      setIsThinking(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-16">
      {/* Title */}
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-black text-white tracking-tight flex items-center justify-center gap-3">
          <BrainCircuit className="w-8 h-8 text-purple-400" />
          TEST ZENO AI
        </h2>
        <p className="text-slate-400 text-sm max-w-xl mx-auto">
          Test the AI brain directly. Inspect retrieved knowledge sources and verify voice response reasoning.
        </p>
      </div>

      {/* Input Sandbox */}
      <div className="zeno-card p-6 sm:p-8 space-y-6">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleAsk(promptInput);
          }}
          className="space-y-4"
        >
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Ask ZENO anything...
            </label>
            <div className="relative">
              <textarea
                rows={3}
                value={promptInput}
                onChange={e => setPromptInput(e.target.value)}
                placeholder="e.g. Explain Newton's second law or ask about your taught project knowledge..."
                className="w-full bg-[#0c0e12] border border-[#242c3f] rounded-2xl p-4 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 transition-colors resize-none"
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4">
            {/* Quick Sample Prompts */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs text-slate-500 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-400" />
                Samples:
              </span>
              {samplePrompts.map((s, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setPromptInput(s);
                    handleAsk(s);
                  }}
                  className="text-[11px] bg-[#0e111a] hover:bg-[#1b2234] border border-[#232938] text-slate-300 px-2.5 py-1 rounded-lg transition-colors"
                >
                  "{s}"
                </button>
              ))}
            </div>

            <button
              type="submit"
              disabled={isThinking || !promptInput.trim()}
              className="zeno-btn-primary bg-gradient-to-r from-purple-500 to-indigo-600 px-6 py-2.5 text-xs font-bold uppercase tracking-wider rounded-xl ml-auto"
            >
              <Send className="w-4 h-4" />
              {isThinking ? 'Thinking...' : 'ASK ZENO'}
            </button>
          </div>
        </form>

        {/* Results Display */}
        {result && (
          <div className="space-y-4 pt-6 border-t border-[#232938] animate-in fade-in duration-300">
            {/* Latency & Metrics header */}
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="font-bold uppercase tracking-wider text-purple-400">
                Evaluation Output
              </span>
              <span className="font-mono text-amber-400 flex items-center gap-1">
                <Zap className="w-3.5 h-3.5" />
                {(result.responseTimeMs / 1000).toFixed(2)}s latency
              </span>
            </div>

            {/* Question */}
            <div className="p-4 rounded-xl bg-[#0e111a] border border-[#202738]">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                QUESTION
              </span>
              <p className="text-sm font-semibold text-white">"{result.query}"</p>
            </div>

            {/* Retrieved Knowledge Sources (if applicable) */}
            {result.sources && result.sources.length > 0 && (
              <div className="p-4 rounded-xl bg-purple-950/20 border border-purple-500/30 space-y-2">
                <span className="text-[10px] font-bold text-purple-300 uppercase tracking-wider flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5" />
                  RETRIEVED KNOWLEDGE SOURCES (RAG)
                </span>
                <div className="space-y-1.5 pl-2">
                  {result.sources.map((s, idx) => (
                    <div key={idx} className="text-xs text-slate-300 flex items-start gap-1.5">
                      <CornerDownRight className="w-3 h-3 text-purple-400 mt-0.5 shrink-0" />
                      <div>
                        <strong className="text-purple-300">{s.title}:</strong> {s.content}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Final Answer */}
            <div className="p-5 rounded-2xl bg-[#121826] border border-cyan-500/40 shadow-xl space-y-2">
              <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider block">
                FINAL ZENO ANSWER
              </span>
              <p className="text-base text-slate-100 font-sans leading-relaxed">
                "{result.answer}"
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
