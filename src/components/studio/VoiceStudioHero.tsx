'use client';

import React, { useState } from 'react';
import { VoiceWaveform } from '@/components/ui/VoiceWaveform';
import {
  Play,
  Pause,
  Volume2,
  Sliders,
  Download,
  Languages,
  Zap,
  Check,
  RefreshCw,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';

export const VoiceStudioHero: React.FC = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [promptText, setPromptText] = useState(
    'Welcome to FlowMind AI. All 15 autonomous business agents are active, monitoring real-time workflows and multilingual enterprise operations.'
  );
  const [selectedVoice, setSelectedVoice] = useState('CEO Neural');
  const [speed, setSpeed] = useState('1.0x');
  const [isGenerating, setIsGenerating] = useState(false);

  const VOICES = [
    { id: 'CEO Neural', label: 'CEO Executive', flag: '👑', lang: 'English (US)' },
    { id: 'Indic Multilingual', label: 'Indic Neural', flag: '🇮🇳', lang: 'Hindi/Telugu/Tamil' },
    { id: 'Finance Analyst', label: 'Finance Studio', flag: '📊', lang: 'English (UK)' },
    { id: 'Support Agent', label: 'Customer AI', flag: '🎧', lang: 'Natural Tone' },
  ];

  const handleGenerate = () => {
    setIsGenerating(true);
    setIsPlaying(false);
    setTimeout(() => {
      setIsGenerating(false);
      setIsPlaying(true);
    }, 800);
  };

  return (
    <div className="w-full bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-950 border border-purple-500/30 rounded-[32px] p-6 sm:p-8 shadow-bloom-lg relative overflow-hidden text-white">
      {/* Background Decorative Glows */}
      <div className="absolute -top-24 -right-24 w-72 h-72 bg-purple-600/25 rounded-full blur-3xl pointer-events-none animate-pulse" />
      <div className="absolute -bottom-24 -left-24 w-72 h-72 bg-indigo-600/25 rounded-full blur-3xl pointer-events-none" />

      {/* Top Banner Tag */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-300 text-xs font-bold">
          <span>Figma-Inspired AI Voice & Text-to-Speech Studio</span>
        </div>

        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          <span className="text-[11px] font-bold text-emerald-400 tracking-wider uppercase">
            Neural Engine v4.2 Ready
          </span>
        </div>
      </div>

      {/* Main Grid: Input & Waveform Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
        {/* Left Column: Voice Selector & Prompt Input */}
        <div className="lg:col-span-7 space-y-4">
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-purple-300 mb-2">
              Select Neural Voice Persona
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {VOICES.map((v) => {
                const isActive = selectedVoice === v.id;
                return (
                  <button
                    key={v.id}
                    type="button"
                    onClick={() => setSelectedVoice(v.id)}
                    className={`p-2.5 rounded-2xl border text-left transition-all ${
                      isActive
                        ? 'bg-purple-600/90 border-purple-400 text-white shadow-lg scale-[1.02]'
                        : 'bg-slate-800/60 hover:bg-slate-800 border-slate-700/80 text-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 text-xs font-bold truncate">
                      <span>{v.flag}</span>
                      <span className="truncate">{v.label}</span>
                    </div>
                    <div className="text-[10px] text-slate-300/80 mt-0.5 truncate">{v.lang}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Prompt Input Box */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-purple-300 mb-1.5">
              Text-to-Speech Script Prompt
            </label>
            <div className="relative">
              <textarea
                rows={3}
                value={promptText}
                onChange={(e) => setPromptText(e.target.value)}
                placeholder="Type script here to generate neural AI voice..."
                className="w-full p-4 bg-slate-950/80 border border-purple-500/30 rounded-2xl text-xs font-medium text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500/40 custom-scrollbar resize-none"
              />
              <button
                type="button"
                onClick={() => setPromptText('FlowMind AI: Connecting 15 business agents with natural speech synthesis.')}
                className="absolute bottom-3 right-3 text-[10px] font-bold text-purple-400 hover:text-purple-300 flex items-center gap-1 bg-purple-900/40 px-2 py-1 rounded-lg border border-purple-500/30"
              >
                <RefreshCw className="w-3 h-3" /> Sample Script
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Audio Playback & Waveform Studio */}
        <div className="lg:col-span-5 bg-slate-900/90 border border-slate-800 rounded-3xl p-5 space-y-4 shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Volume2 className="w-4 h-4 text-cyan-400" />
              <span className="text-xs font-bold text-slate-200">Voice Output Visualizer</span>
            </div>
            <span className="text-[10px] font-mono font-bold text-purple-400 bg-purple-950 px-2 py-0.5 rounded-full border border-purple-800/60">
              24kHz • HD Stereo
            </span>
          </div>

          {/* Audio Waveform */}
          <VoiceWaveform isActive={isPlaying} barCount={26} />

          {/* Speed & Pitch Controls */}
          <div className="flex items-center justify-between text-xs font-semibold text-slate-400 pt-1">
            <div className="flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-purple-400" />
              <span>Speed:</span>
              <div className="flex gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
                {['0.75x', '1.0x', '1.25x', '1.5x'].map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setSpeed(s)}
                    className={`px-1.5 py-0.5 text-[10px] font-bold rounded-md transition-colors ${
                      speed === s ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="button"
              onClick={() => alert('Downloading HD MP3 Speech file...')}
              className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors"
              title="Download Speech (.MP3)"
            >
              <Download className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsPlaying(!isPlaying)}
              className={`flex-1 py-3 px-4 rounded-2xl text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                isPlaying
                  ? 'bg-amber-500 hover:bg-amber-600 text-slate-950 shadow-lg'
                  : 'bg-purple-600 hover:bg-purple-500 text-white shadow-lg'
              }`}
            >
              {isPlaying ? (
                <>
                  <Pause className="w-4 h-4 fill-slate-950" /> Pause Speech
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-white" /> Play Speech Synthesis
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleGenerate}
              disabled={isGenerating}
              className="py-3 px-4 rounded-2xl bg-indigo-600/80 hover:bg-indigo-600 text-white text-xs font-bold flex items-center justify-center gap-1.5 border border-indigo-400/40 transition-all"
            >
              {isGenerating ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <Zap className="w-4 h-4 text-cyan-300" /> Synthesize
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
