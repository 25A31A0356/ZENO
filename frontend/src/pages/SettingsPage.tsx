import React, { useState, useEffect } from 'react';
import { useZeno } from '../context/ZenoContext';
import { api } from '../services/api';
import { Settings } from '../types';
import {
  Settings as SettingsIcon,
  Sparkles,
  Volume2,
  BrainCircuit,
  Shield,
  Save,
} from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const { settings, showToast } = useZeno();
  const [formData, setFormData] = useState<Settings>({
    name: 'ZENO',
    wakePhrase: 'Hey ZENO',
    responseStyle: 'short',
    personality: 'friendly',
    voiceId: 'alloy',
    speechSpeed: 1.0,
    volume: 85,
    aiProvider: 'gemini',
    aiModel: 'gemini-1.5-flash',
    temperature: 0.7,
    storeAudio: false,
    enableCamera: true,
    beginnerMode: true,
  });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (settings) {
      setFormData(settings);
    }
  }, [settings]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await api.updateSettings(formData);
      showToast('Settings saved successfully', 'success');
    } catch (e) {
      showToast('Failed to save settings', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-16">
      {/* Title */}
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-black text-white tracking-tight flex items-center justify-center gap-3">
          <SettingsIcon className="w-8 h-8 text-cyan-400" />
          ZENO SETTINGS
        </h2>
        <p className="text-slate-400 text-sm max-w-xl mx-auto">
          Customize ZENO's personality, vocal responses, AI engine parameters, and privacy preferences.
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* 1. ZENO PERSONALITY */}
        <div className="zeno-card p-6 sm:p-8 space-y-6">
          <div className="flex items-center gap-3 pb-3 border-b border-[#232938]">
            <Sparkles className="w-5 h-5 text-cyan-400" />
            <h3 className="text-base font-bold text-white uppercase tracking-wider">
              ZENO Personality
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Assistant Name
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                className="w-full bg-[#0c0e12] border border-[#242c3f] rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Wake Phrase
              </label>
              <input
                type="text"
                value={formData.wakePhrase}
                onChange={e => setFormData({ ...formData, wakePhrase: e.target.value })}
                className="w-full bg-[#0c0e12] border border-[#242c3f] rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          {/* Response style */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-2">
              Response Style
            </label>
            <div className="grid grid-cols-3 gap-3">
              {(['short', 'normal', 'detailed'] as const).map(style => (
                <button
                  key={style}
                  type="button"
                  onClick={() => setFormData({ ...formData, responseStyle: style })}
                  className={`py-2.5 px-4 rounded-xl text-xs font-bold capitalize transition-all border ${
                    formData.responseStyle === style
                      ? 'bg-cyan-500 text-white border-cyan-400 shadow-lg shadow-cyan-500/20'
                      : 'bg-[#0e111a] border-[#232938] text-slate-400 hover:text-white'
                  }`}
                >
                  {style}
                </button>
              ))}
            </div>
            <p className="text-[11px] text-slate-500 mt-1.5">
              Short is recommended for fastest spoken voice interaction.
            </p>
          </div>

          {/* Personality Tone */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-2">
              Personality Tone
            </label>
            <div className="grid grid-cols-3 gap-3">
              {(['friendly', 'helpful', 'technical'] as const).map(p => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setFormData({ ...formData, personality: p })}
                  className={`py-2.5 px-4 rounded-xl text-xs font-bold capitalize transition-all border ${
                    formData.personality === p
                      ? 'bg-purple-500 text-white border-purple-400 shadow-lg shadow-purple-500/20'
                      : 'bg-[#0e111a] border-[#232938] text-slate-400 hover:text-white'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 2. VOICE & SPEECH */}
        <div className="zeno-card p-6 sm:p-8 space-y-6">
          <div className="flex items-center gap-3 pb-3 border-b border-[#232938]">
            <Volume2 className="w-5 h-5 text-cyan-400" />
            <h3 className="text-base font-bold text-white uppercase tracking-wider">
              Voice & Audio
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Voice Model
              </label>
              <select
                value={formData.voiceId}
                onChange={e => setFormData({ ...formData, voiceId: e.target.value })}
                className="w-full bg-[#0c0e12] border border-[#242c3f] rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500"
              >
                <option value="alloy">Alloy (Balanced Natural Voice)</option>
                <option value="echo">Echo (Warm Voice)</option>
                <option value="fable">Fable (Expressive Voice)</option>
                <option value="onyx">Onyx (Deep Voice)</option>
                <option value="nova">Nova (Crisp Voice)</option>
                <option value="shimmer">Shimmer (Clear Voice)</option>
              </select>
            </div>

            <div>
              <div className="flex justify-between text-xs font-semibold text-slate-300 mb-1.5">
                <span>Speech Speed</span>
                <span className="font-mono text-cyan-400">{formData.speechSpeed}x</span>
              </div>
              <input
                type="range"
                min="0.8"
                max="1.4"
                step="0.1"
                value={formData.speechSpeed}
                onChange={e => setFormData({ ...formData, speechSpeed: parseFloat(e.target.value) })}
                className="w-full accent-cyan-400 bg-slate-800 h-2 rounded-lg cursor-pointer mt-2"
              />
            </div>
          </div>
        </div>

        {/* 3. AI ENGINE */}
        <div className="zeno-card p-6 sm:p-8 space-y-6">
          <div className="flex items-center gap-3 pb-3 border-b border-[#232938]">
            <BrainCircuit className="w-5 h-5 text-purple-400" />
            <h3 className="text-base font-bold text-white uppercase tracking-wider">
              AI Engine Configuration
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                AI Provider
              </label>
              <input
                type="text"
                disabled
                value="Google Gemini / Local Smart Fallback"
                className="w-full bg-[#0e111a] border border-[#242c3f] rounded-xl px-4 py-2.5 text-xs text-slate-400 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Model Name
              </label>
              <input
                type="text"
                value={formData.aiModel}
                onChange={e => setFormData({ ...formData, aiModel: e.target.value })}
                className="w-full bg-[#0c0e12] border border-[#242c3f] rounded-xl px-4 py-2.5 text-xs text-white font-mono focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between text-xs font-semibold text-slate-300 mb-1.5">
              <span>Model Temperature (Creativity)</span>
              <span className="font-mono text-purple-400">{formData.temperature}</span>
            </div>
            <input
              type="range"
              min="0.1"
              max="1.0"
              step="0.05"
              value={formData.temperature}
              onChange={e => setFormData({ ...formData, temperature: parseFloat(e.target.value) })}
              className="w-full accent-purple-400 bg-slate-800 h-2 rounded-lg cursor-pointer"
            />
          </div>
        </div>

        {/* 4. PRIVACY */}
        <div className="zeno-card p-6 sm:p-8 space-y-4">
          <div className="flex items-center gap-3 pb-3 border-b border-[#232938]">
            <Shield className="w-5 h-5 text-emerald-400" />
            <h3 className="text-base font-bold text-white uppercase tracking-wider">
              Privacy & Security
            </h3>
          </div>

          <div className="space-y-3">
            <label className="flex items-center justify-between p-3.5 rounded-xl bg-[#0e111a] border border-[#232938] cursor-pointer">
              <div>
                <span className="text-sm font-semibold text-white block">
                  Store Voice Recordings
                </span>
                <span className="text-xs text-slate-400">
                  When disabled, raw audio is never written to disk.
                </span>
              </div>
              <input
                type="checkbox"
                checked={formData.storeAudio}
                onChange={e => setFormData({ ...formData, storeAudio: e.target.checked })}
                className="w-5 h-5 accent-cyan-500 rounded cursor-pointer"
              />
            </label>

            <label className="flex items-center justify-between p-3.5 rounded-xl bg-[#0e111a] border border-[#232938] cursor-pointer">
              <div>
                <span className="text-sm font-semibold text-white block">
                  Allow Camera Optical Stream
                </span>
                <span className="text-xs text-slate-400">
                  Enables ZENO Vision snapshot inspection.
                </span>
              </div>
              <input
                type="checkbox"
                checked={formData.enableCamera}
                onChange={e => setFormData({ ...formData, enableCamera: e.target.checked })}
                className="w-5 h-5 accent-cyan-500 rounded cursor-pointer"
              />
            </label>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isSaving}
            className="zeno-btn-primary px-8 py-3.5 text-sm font-bold uppercase tracking-wider"
          >
            <Save className="w-4 h-4" />
            {isSaving ? 'Saving Settings...' : 'Save Settings'}
          </button>
        </div>
      </form>
    </div>
  );
};
