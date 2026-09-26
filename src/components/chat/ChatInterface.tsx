import React, { useState, useRef, useEffect } from 'react';
import { useAppStore } from '@/lib/store/useAppStore';
import { UI_TRANSLATIONS } from '@/lib/i18n/translations';
import { ThoughtStream } from '@/components/chat/ThoughtStream';
import { ActionCard } from '@/components/chat/ActionCard';
import { PromptChips } from '@/components/chat/PromptChips';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Send, Mic, Bot, Sparkles, ShieldCheck } from 'lucide-react';
import { AgentType } from '@/types';
import { detectLanguageScript, speakTextInNativeAccent, startSpeechRecognition } from '@/lib/i18n/indicEngine';
import { agentOrchestrator } from '@/lib/ai/agentOrchestrator';
import { VoiceSpectrum } from '@/components/chat/VoiceSpectrum';
import { AgentLogo } from '@/components/ui/AgentLogo';

export const ChatInterface: React.FC = () => {
  const {
    language,
    messages,
    addMessage,
    activeAgent,
    setActiveAgent,
    isVoiceActive,
    setVoiceActive,
    user,
    addToast,
  } = useAppStore();

  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const t = UI_TRANSLATIONS[language] || UI_TRANSLATIONS.en;

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isProcessing]);

  // Real-Time Web Speech Recognition Effect
  useEffect(() => {
    if (!isVoiceActive) return;

    let recognition: any = null;

    recognition = startSpeechRecognition(language, {
      onResult: (transcript, isFinal) => {
        setInput(transcript);
        if (isFinal && transcript.trim()) {
          handleSend(transcript);
        }
      },
      onError: (err) => {
        console.warn('Microphone or Speech Recognition Notice:', err);
      },
      onEnd: () => {
        if (useAppStore.getState().isVoiceActive) {
          try { recognition?.start(); } catch (e) {}
        }
      },
    });

    return () => {
      try {
        recognition?.stop();
      } catch (e) {}
    };
  }, [isVoiceActive, language]);

  const handleSend = async (textToSend?: string) => {
    const query = textToSend || input;
    if (!query.trim() || isProcessing) return;

    const detectedLang = detectLanguageScript(query);
    const targetLang = detectedLang !== 'en' ? detectedLang : language;

    addMessage({
      sender: 'USER',
      content: query,
      language: targetLang,
    });

    setInput('');
    setIsProcessing(true);

    try {
      const result = await agentOrchestrator.processRequest(query, {
        user,
        language: targetLang,
        messageHistory: messages,
      });

      setActiveAgent(result.targetAgent);

      addMessage({
        sender: 'AGENT',
        activeAgent: result.targetAgent,
        content: result.responseText,
        language: targetLang,
        thoughtStream: result.thoughtStream,
        actionCard: result.actionCard,
      });

      if (result.securityBlocked) {
        addToast({
          title: 'Security Alert',
          message: 'Prompt injection attempt blocked by Security Agent.',
          type: 'error',
        });
      } else if (result.actionCard) {
        addToast({
          title: 'Action Card Prepared',
          message: `${result.targetAgent} Agent prepared ${result.actionCard.title}. Awaiting approval.`,
          type: 'info',
        });
      }

      speakTextInNativeAccent(result.responseText, targetLang);
    } catch (err: any) {
      console.error('Orchestration error:', err);
      addMessage({
        sender: 'AGENT',
        activeAgent: 'Security',
        content: 'An error occurred while processing your request.',
        language: targetLang,
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="flex flex-col h-[75vh] bg-bloom-bg text-bloom-textDark relative overflow-hidden">
      {/* Top Banner */}
      <div className="px-6 py-3 border-b border-slate-200 bg-white flex items-center justify-between">
        <div className="flex items-center gap-3">
          <AgentLogo agentId={activeAgent} size="sm" glow />
          <div>
            <h3 className="text-xs font-bold text-bloom-dark flex items-center gap-2">
              Active Routing Agent: <span className="text-purple-700 font-extrabold">{activeAgent} Agent</span>
            </h3>
            <p className="text-[10px] text-bloom-textMuted">Layman Mode Active &bull; Transparent Thought Stream & Action Cards</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="purple" className="text-[10px]">
            <ShieldCheck className="w-3 h-3" /> {user.role} SANITIZED
          </Badge>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4 custom-scrollbar">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex flex-col ${msg.sender === 'USER' ? 'items-end' : 'items-start'}`}
          >
            <div className="flex items-center gap-2 mb-1 px-1">
              {msg.sender !== 'USER' && (
                <AgentLogo agentId={msg.activeAgent || activeAgent} size="xs" />
              )}
              <span className="text-[10px] font-bold text-slate-500">
                {msg.sender === 'USER' ? `${user.name} (You)` : `${msg.activeAgent || 'AI'} Agent`}
              </span>
              <span className="text-[10px] text-slate-400">{msg.timestamp}</span>
            </div>

            <div
              className={`max-w-2xl rounded-2xl px-4 py-3 text-xs leading-relaxed border shadow-sm ${
                msg.sender === 'USER'
                  ? 'bg-bloom-dark text-white border-bloom-darkCard rounded-br-none'
                  : 'bg-white text-bloom-textDark border-slate-200 rounded-bl-none'
              }`}
            >
              <p>{msg.content}</p>

              {msg.thoughtStream && <ThoughtStream steps={msg.thoughtStream} />}
              {msg.actionCard && <ActionCard data={msg.actionCard} />}
            </div>
          </div>
        ))}

        {isProcessing && (
          <div className="flex items-center gap-2 text-xs text-purple-700 bg-purple-50 p-3 rounded-2xl border border-purple-200 w-fit animate-pulse">
            <Sparkles className="w-4 h-4 animate-spin text-purple-600" />
            <span>Master Orchestrator routing query across 15 specialized agents...</span>
          </div>
        )}

        <div ref={chatEndRef} />
      </div>

      {/* Bottom Input Area */}
      <div className="p-4 border-t border-slate-200 bg-white space-y-2">
        <VoiceSpectrum isActive={isVoiceActive} activeLanguage={language} />

        {isVoiceActive && (
          <div className="flex items-center justify-between bg-red-50 text-red-700 px-3.5 py-2 rounded-xl border border-red-200 text-xs">
            <span className="font-bold flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-red-600 animate-ping" />
              Live Voice Microphone Active – Speak into your mic to type automatically!
            </span>
            <button
              onClick={() => handleSend('రేపు 10 గంటలకు మీటింగ్ పెట్టండి')}
              className="bg-red-600 text-white px-3 py-1 rounded-full hover:bg-red-700 text-xs font-bold transition-colors"
            >
              ⚡ Speech Demo Test
            </button>
          </div>
        )}

        <PromptChips onSelectPrompt={(p) => handleSend(p)} />

        <div className="flex items-center gap-2">
          <button
            onClick={() => setVoiceActive(!isVoiceActive)}
            title={isVoiceActive ? 'Stop Listening' : 'Start Voice Input'}
            className={`p-2.5 rounded-full border transition-all ${
              isVoiceActive
                ? 'bg-red-500 text-white border-red-500 animate-pulse ring-2 ring-red-300'
                : 'bg-slate-100 border-slate-200 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Mic className="w-4 h-4" />
          </button>

          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder={
              isVoiceActive
                ? '🎤 Listening... Speak now (spoken words will type here!)'
                : t.chatPlaceholder
            }
            className={`flex-1 text-bloom-textDark text-xs rounded-full px-5 py-3 focus:outline-none transition-colors ${
              isVoiceActive
                ? 'bg-red-50/60 border-red-300 focus:border-red-500 font-medium placeholder-red-400'
                : 'bg-slate-100 border-slate-200 focus:border-purple-500'
            }`}
          />

          <Button
            variant="dark"
            size="md"
            onClick={() => handleSend()}
            disabled={!input.trim() || isProcessing}
            icon={<Send className="w-4 h-4" />}
          >
            Send
          </Button>
        </div>
      </div>
    </div>
  );
};
