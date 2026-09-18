import React, { useState } from 'react';
import { useZeno } from '../context/ZenoContext';
import { audioService } from '../services/audio';
import { Mic, MicOff, Volume2, Send, RotateCcw, BrainCircuit, Sparkles, AlertCircle } from 'lucide-react';

export const TalkPage: React.FC = () => {
  const { sendChatMessage, state, showToast, settings } = useZeno();
  const [isListening, setIsListening] = useState(false);
  const [interimText, setInterimText] = useState('');
  const [textInput, setTextInput] = useState('');
  const [lastExchange, setLastExchange] = useState<{ query: string; answer: string; time: string } | null>(null);

  // Check speech recognition support
  const isSpeechSupported = audioService.isSpeechRecognitionSupported();

  const handleStartListening = () => {
    if (isListening) {
      audioService.stopListening();
      setIsListening(false);
      return;
    }

    setInterimText('');
    setIsListening(true);

    audioService.startListening(
      async (transcript, isFinal) => {
        setInterimText(transcript);
        if (isFinal && transcript.trim()) {
          setIsListening(false);
          await processQuery(transcript.trim(), 'voice');
        }
      },
      () => {
        setIsListening(false);
        showToast('Microphone error or permission denied. You can type below instead.', 'warning');
      },
      () => {
        setIsListening(false);
      }
    );
  };

  const processQuery = async (query: string, source: 'voice' | 'text' = 'voice') => {
    if (!query.trim()) return;
    try {
      const answer = await sendChatMessage(query, source);
      setLastExchange({
        query,
        answer,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      });
      setTextInput('');
      setInterimText('');
    } catch (e: any) {
      showToast(e.message || 'Error processing request', 'error');
    }
  };

  const handleSpeakAgain = () => {
    if (lastExchange?.answer) {
      audioService.speak(lastExchange.answer, settings?.speechSpeed || 1.0);
      showToast('Speaking response again', 'info');
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8 pb-16">
      {/* Title */}
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-black text-white tracking-tight">TALK TO ZENO</h2>
        <p className="text-slate-400 text-sm">
          Speak naturally or type your question. ZENO will listen, think, and respond.
        </p>
      </div>

      {/* Main Interactive Mic Centerpiece */}
      <div className="zeno-card p-8 sm:p-12 flex flex-col items-center justify-center text-center relative overflow-hidden">
        {/* Glow effect */}
        <div
          className={`absolute -inset-20 bg-gradient-to-r from-cyan-500/20 via-blue-500/20 to-purple-500/20 rounded-full blur-3xl transition-opacity duration-500 ${
            isListening || state === 'SPEAKING' ? 'opacity-100' : 'opacity-30'
          }`}
        />

        {/* State Indicators */}
        <div className="relative z-10 mb-8">
          {state === 'LISTENING' || isListening ? (
            <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 text-xs font-bold tracking-widest uppercase animate-pulse">
              <Mic className="w-3.5 h-3.5" />
              🎤 LISTENING...
            </div>
          ) : state === 'THINKING' ? (
            <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-purple-500/20 border border-purple-500/40 text-purple-300 text-xs font-bold tracking-widest uppercase animate-pulse">
              <BrainCircuit className="w-3.5 h-3.5 animate-spin" />
              🧠 THINKING...
            </div>
          ) : state === 'SPEAKING' ? (
            <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold tracking-widest uppercase animate-pulse">
              <Volume2 className="w-3.5 h-3.5" />
              🔊 ZENO IS SPEAKING...
            </div>
          ) : (
            <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-800 border border-slate-700 text-slate-300 text-xs font-bold tracking-widest uppercase">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              TAP TO SPEAK
            </div>
          )}
        </div>

        {/* Large Microphone Push-To-Talk Button */}
        <div className="relative z-10 mb-8">
          {/* Animated ripple rings while active */}
          {isListening && (
            <>
              <div className="absolute -inset-4 rounded-full bg-cyan-500/30 animate-ping" />
              <div className="absolute -inset-8 rounded-full bg-cyan-500/15 animate-pulse" />
            </>
          )}

          <button
            onClick={handleStartListening}
            className={`relative w-36 h-36 sm:w-44 sm:h-44 rounded-full flex flex-col items-center justify-center gap-2 shadow-2xl transition-all duration-300 transform active:scale-95 ${
              isListening
                ? 'bg-gradient-to-tr from-cyan-500 to-blue-600 border-4 border-cyan-300 text-white shadow-cyan-500/50 scale-105'
                : 'bg-gradient-to-tr from-[#1b2233] to-[#252f47] border-4 border-[#323e5c] hover:border-cyan-500 text-cyan-400 hover:text-white shadow-black/60 hover:scale-102'
            }`}
          >
            {isListening ? (
              <>
                <MicOff className="w-12 h-12 animate-pulse" />
                <span className="text-xs font-extrabold tracking-widest uppercase">STOP</span>
              </>
            ) : (
              <>
                <Mic className="w-12 h-12" />
                <span className="text-xs font-extrabold tracking-widest uppercase">
                  START TALKING
                </span>
              </>
            )}
          </button>
        </div>

        {/* Live Interim Speech Preview */}
        {interimText && (
          <div className="relative z-10 w-full max-w-xl p-4 rounded-2xl bg-[#0c0e12]/90 border border-cyan-500/40 text-cyan-300 text-sm font-medium text-center animate-pulse">
            <span className="text-xs text-slate-400 block mb-1">Detected Speech:</span>
            "{interimText}"
          </div>
        )}

        {!isSpeechSupported && (
          <div className="relative z-10 flex items-center gap-2 text-xs text-amber-400 bg-amber-500/10 px-4 py-2 rounded-xl border border-amber-500/20 mt-4">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>Web Speech API is unavailable in this browser. You can use the text box below.</span>
          </div>
        )}
      </div>

      {/* Latest Exchange Card */}
      {lastExchange && (
        <div className="zeno-card p-6 border-cyan-500/30 space-y-4">
          <div className="flex items-center justify-between border-b border-[#232938] pb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Latest Voice Exchange
            </span>
            <span className="text-xs text-slate-500 font-mono">{lastExchange.time}</span>
          </div>

          <div className="space-y-3">
            {/* User Speech */}
            <div className="p-3.5 rounded-xl bg-[#0e111a] border border-[#202738]">
              <span className="text-xs font-bold text-blue-400 uppercase tracking-wider block mb-1">
                YOU:
              </span>
              <p className="text-sm font-semibold text-slate-100">"{lastExchange.query}"</p>
            </div>

            {/* ZENO Response */}
            <div className="p-4 rounded-xl bg-cyan-950/20 border border-cyan-500/30">
              <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider block mb-1">
                ZENO:
              </span>
              <p className="text-sm text-slate-100 leading-relaxed font-sans">
                "{lastExchange.answer}"
              </p>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              onClick={handleSpeakAgain}
              className="zeno-btn-secondary text-xs font-semibold px-4 py-2"
            >
              <RotateCcw className="w-3.5 h-3.5 text-cyan-400" />
              Speak Again
            </button>
          </div>
        </div>
      )}

      {/* Alternative: Text Chat Input */}
      <div className="zeno-card p-4">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            processQuery(textInput, 'text');
          }}
          className="flex items-center gap-3"
        >
          <input
            type="text"
            value={textInput}
            onChange={e => setTextInput(e.target.value)}
            placeholder="Or type a question for ZENO here... (e.g. What is thermodynamics?)"
            className="flex-1 bg-[#0c0e12] border border-[#242c3f] rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-cyan-500 transition-colors"
          />
          <button
            type="submit"
            disabled={!textInput.trim()}
            className="zeno-btn-primary px-5 py-3 text-xs font-bold rounded-xl"
          >
            <Send className="w-4 h-4" />
            <span className="hidden sm:inline">Ask ZENO</span>
          </button>
        </form>
      </div>
    </div>
  );
};
