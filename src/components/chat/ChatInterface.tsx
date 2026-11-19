'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useAppStore } from '@/lib/store/useAppStore';
import { UI_TRANSLATIONS, SUPPORTED_LANGUAGES } from '@/lib/i18n/translations';
import { UniversalResponseRenderer } from '@/components/chat/UniversalResponseRenderer';
import { PromptChips } from '@/components/chat/PromptChips';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Send, Mic, Loader2, ShieldCheck, Brain, Plus, Globe } from 'lucide-react';
import { detectLanguageScript, speakTextInNativeAccent, startSpeechRecognition } from '@/lib/i18n/indicEngine';
import { detectInputLanguage } from '@/lib/i18n/languageContextService';
import { VoiceSpectrum } from '@/components/chat/VoiceSpectrum';
import { AgentLogo } from '@/components/ui/AgentLogo';
import { LanguageCode } from '@/types';

export const ChatInterface: React.FC = () => {
  const {
    language,
    setLanguage,
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
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [memoryIndicator, setMemoryIndicator] = useState<string | null>(null);
  const [selectedLanguageMode, setSelectedLanguageMode] = useState<string>('auto');
  const [lastFailedQuery, setLastFailedQuery] = useState<string | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const t = UI_TRANSLATIONS[language] || UI_TRANSLATIONS.en;

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isProcessing]);

  // Initialize: restore last conversation or create new one
  useEffect(() => {
    const initConversation = async () => {
      try {
        const res = await fetch('/api/conversations', { credentials: 'include' });
        if (res.ok) {
          const data = await res.json();
          if (data.conversations && data.conversations.length > 0) {
            setConversationId(data.conversations[0].id);
          }
        }
      } catch (err) {
        // Silent - will create conversation on first message
      }
    };
    if (user?.id && user.id !== 'USR-01') {
      initConversation();
    }
  }, [user?.id]);

  const ensureConversation = useCallback(async (): Promise<string | null> => {
    if (conversationId) return conversationId;

    try {
      const res = await fetch('/api/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'Chat Session' }),
        credentials: 'include',
      });
      if (res.ok) {
        const data = await res.json();
        const newId = data.conversation?.id;
        setConversationId(newId);
        return newId;
      }
    } catch (err) {
      console.error('[CONVERSATION CREATE ERROR]', err);
    }
    return null;
  }, [conversationId]);

  const persistMessages = useCallback(async (
    convId: string,
    userContent: string,
    agentContent: string,
    agentId: string,
    lang: string
  ) => {
    try {
      await Promise.all([
        fetch(`/api/conversations/${convId}/messages`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sender: 'USER', content: userContent, language: lang }),
          credentials: 'include',
        }),
        fetch(`/api/conversations/${convId}/messages`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sender: 'AGENT', content: agentContent, activeAgent: agentId, language: lang }),
          credentials: 'include',
        }),
      ]);
    } catch (err) {
      console.error('[PERSIST MESSAGES ERROR]', err);
    }
  }, []);

  const checkForRelevantMemory = useCallback(async (query: string) => {
    try {
      const res = await fetch(`/api/memory?q=${encodeURIComponent(query)}&scope=ALL`, { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        if (data.memories && data.memories.length > 0) {
          setMemoryIndicator(`💡 Retrieved ${data.memories.length} relevant memory item(s)`);
          setTimeout(() => setMemoryIndicator(null), 3000);
          return data.memories;
        }
      }
    } catch (err) {
      // Silent
    }
    return [];
  }, []);

  const startNewConversation = useCallback(() => {
    setConversationId(null);
    addToast({ title: 'New Conversation', message: 'Started a fresh conversation. Previous history is saved.', type: 'info' });
  }, [addToast]);

  // Real-Time Web Speech Recognition Effect
  useEffect(() => {
    if (!isVoiceActive) return;
    let recognition: any = null;
    recognition = startSpeechRecognition(language, {
      onResult: (transcript: string, isFinal: boolean) => {
        setInput(transcript);
        if (isFinal && transcript.trim()) handleSend(transcript);
      },
      onError: (err: any) => { console.warn('Speech Recognition:', err); },
      onEnd: () => {
        if (useAppStore.getState().isVoiceActive) {
          try { recognition?.start(); } catch (e) {}
        }
      },
    });
    return () => { try { recognition?.stop(); } catch (e) {} };
  }, [isVoiceActive, language]);

  const handleSend = async (textToSend?: string) => {
    const query = (textToSend || input).trim();
    if (!query || isProcessing) return;

    // Resolve target language: explicit preference or auto-detection
    let targetLang: LanguageCode = language;
    if (selectedLanguageMode === 'auto') {
      const detected = detectInputLanguage(query);
      targetLang = detected || language;
    } else {
      targetLang = selectedLanguageMode as LanguageCode;
    }

    // Add user message to UI immediately
    addMessage({
      sender: 'USER',
      content: query,
      language: targetLang,
    });

    // Clear input state immediately if submitted from input box
    if (!textToSend) {
      setInput('');
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }

    setIsProcessing(true);
    setLastFailedQuery(null);

    // Timeout guard (45s) using AbortController
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 45000);

    try {
      // Check for relevant memory context
      const relevantMemories = await checkForRelevantMemory(query);
      const memoryContext = relevantMemories.length > 0
        ? `\n[Context from memory: ${relevantMemories.slice(0, 3).map((m: any) => m.content).join('; ')}]`
        : '';

      let result: any = null;
      try {
        const res = await fetch('/api/agent/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            query,
            language: targetLang,
            selectedAgentOverride: activeAgent,
            messageHistory: messages,
            memoryContext: memoryContext ? memoryContext.trim() : undefined,
          }),
          signal: controller.signal,
          credentials: 'include',
        });
        clearTimeout(timeoutId);

        if (res.ok) {
          const data = await res.json();
          if (data.success && data.result) {
            result = data.result;
          } else {
            throw new Error(data.error || 'Server failed to process request');
          }
        } else {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || `Server responded with status ${res.status}`);
        }
      } catch (fetchErr: any) {
        if (fetchErr.name === 'AbortError') {
          throw new Error('Request timed out after 45 seconds. The server may still be processing your request.');
        }
        console.error('Server agent chat fetch failed:', fetchErr);
        throw fetchErr;
      }

      if (!result) {
        throw new Error('No response received from agent processing pipeline.');
      }

      // Preserve user-selected active agent; only update if explicit executed handoff occurred
      if (result.handoff && result.handoff.targetAgent && (result.handoff.status === 'EXECUTED' || (result.handoff.status as any) === 'CONFIRMED')) {
        setActiveAgent(result.handoff.targetAgent);
      } else if (!activeAgent) {
        setActiveAgent(result.targetAgent);
      }

      const responseAgent = result.targetAgent || activeAgent || 'CEO';

      addMessage({
        sender: 'AGENT',
        activeAgent: responseAgent,
        content: result.responseText,
        language: targetLang,
        thoughtStream: result.thoughtStream,
        actionCard: result.actionCard,
        suggestedActions: result.suggestedActions,
        artifacts: result.artifacts,
        handoff: result.handoff,
        confidenceLevel: result.universalResponse?.intent.confidenceLevel || 'HIGH',
        riskLevel: result.universalResponse?.risk.level || 'LOW',
      });

      // Persist to PostgreSQL (non-blocking)
      ensureConversation().then((convId) => {
        if (convId) {
          persistMessages(convId, query, result.responseText, result.targetAgent, targetLang);

          const shouldSave = /remember|note that|our .+ (is|uses?|are)|always |preference/i.test(query);
          if (shouldSave) {
            fetch('/api/memory', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                memoryKey: query.toLowerCase().replace(/[^a-z0-9\s]/g, '').trim().split(/\s+/).slice(0, 5).join('_'),
                content: query,
                scope: query.toLowerCase().includes('our ') || query.toLowerCase().includes('team') ? 'ORG_SHARED' : 'PRIVATE',
                source: 'CONVERSATION',
                confidence: 0.85,
              }),
              credentials: 'include',
            }).catch(() => {});
          }
        }
      });

      if (result.securityBlocked) {
        addToast({ title: 'Security Alert', message: 'Prompt injection attempt blocked.', type: 'error' });
      } else if (result.actionCard) {
        addToast({ title: 'Action Card Prepared', message: `${result.targetAgent} Agent prepared ${result.actionCard.title}. Awaiting approval.`, type: 'info' });
      }

      speakTextInNativeAccent(result.responseText, targetLang);
    } catch (err: any) {
      console.error('Orchestration error:', err);
      setLastFailedQuery(query);
      const displayError = err?.message
        ? (err.message.startsWith('[') ? err.message : `[REQUEST_PROCESSING_ERROR] ${err.message}`)
        : '[REQUEST_PROCESSING_ERROR] An error occurred while processing your request. Please click retry below or try again.';
      addMessage({
        sender: 'AGENT',
        activeAgent: 'Security',
        content: displayError,
        language: targetLang,
      });
    } finally {
      clearTimeout(timeoutId);
      setIsProcessing(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleTextareaInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
  };

  return (
    <div className="flex flex-col h-[78vh] bg-bloom-bg text-bloom-textDark relative overflow-hidden rounded-2xl border border-slate-200 shadow-sm">
      {/* Top Banner */}
      <div className="px-6 py-3 border-b border-slate-200 bg-white flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <AgentLogo agentId={activeAgent} size="sm" glow />
          <div>
            <h3 className="text-xs font-bold text-slate-900 flex items-center gap-2">
              Active Routing Agent: <span className="text-purple-700 font-extrabold">{activeAgent} Agent</span>
            </h3>
            <p className="text-[10px] text-slate-600 font-medium">Universal Agent Intelligence Mesh • Gemini LLM & Multi-Agent Mesh</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Language Selector Dropdown */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-100 border border-slate-200 text-xs">
            <Globe className="w-3.5 h-3.5 text-purple-600" />
            <select
              value={selectedLanguageMode}
              onChange={(e) => {
                setSelectedLanguageMode(e.target.value);
                if (e.target.value !== 'auto') {
                  setLanguage(e.target.value as LanguageCode);
                }
              }}
              className="bg-transparent text-slate-700 text-[11px] font-semibold focus:outline-none cursor-pointer"
              title="Select Response Language"
            >
              <option value="auto">🌐 Auto Detect Language</option>
              {SUPPORTED_LANGUAGES.map((lang) => (
                <option key={lang.code} value={lang.code}>
                  {lang.flag} {lang.name} ({lang.nativeName})
                </option>
              ))}
            </select>
          </div>

          {memoryIndicator && (
            <span className="text-[10px] text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-1 rounded-full flex items-center gap-1 animate-pulse">
              <Brain className="w-3 h-3" /> {memoryIndicator}
            </span>
          )}

          {conversationId && (
            <span className="hidden sm:inline text-[9px] text-slate-400 font-mono">
              Persisted ✓
            </span>
          )}

          <button
            onClick={startNewConversation}
            title="Start new conversation"
            className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 transition-colors text-slate-500"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>

          <Badge variant="purple" className="text-[10px]">
            <ShieldCheck className="w-3 h-3" /> GOVERNANCE ACTIVE
          </Badge>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4 custom-scrollbar bg-slate-950/5">
        {messages.map((msg) => (
          <UniversalResponseRenderer
            key={msg.id}
            message={msg}
            onSendSuggestedAction={(sugQuery) => handleSend(sugQuery)}
            onRetry={lastFailedQuery ? () => handleSend(lastFailedQuery) : undefined}
          />
        ))}

        {isProcessing && (
          <div className="flex items-center gap-2.5 text-xs text-purple-700 bg-purple-50 p-3.5 rounded-2xl border border-purple-200 w-fit animate-pulse shadow-sm">
            <Loader2 className="w-4 h-4 animate-spin text-purple-600 shrink-0" />
            <span className="font-medium">
              FlowMind AI Mesh is reasoning with Gemini, verifying PostgreSQL database entities, and generating structured response...
            </span>
          </div>
        )}

        <div ref={chatEndRef} />
      </div>

      {/* Bottom Input Area */}
      <div className="p-4 border-t border-slate-200 bg-white space-y-2.5">
        <VoiceSpectrum isActive={isVoiceActive} activeLanguage={language} />

        {isVoiceActive && (
          <div className="flex items-center justify-between bg-red-50 text-red-700 px-3.5 py-2 rounded-xl border border-red-200 text-xs">
            <span className="font-bold flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-red-600 animate-ping" />
              Live Voice Microphone Active — Speak into your mic!
            </span>
          </div>
        )}

        <PromptChips onSelectPrompt={(p) => handleSend(p)} />

        <div className="flex items-end gap-2">
          <button
            onClick={() => setVoiceActive(!isVoiceActive)}
            title={isVoiceActive ? 'Stop Listening' : 'Start Voice Input'}
            className={`p-3 rounded-2xl border transition-all shrink-0 ${
              isVoiceActive
                ? 'bg-red-500 text-white border-red-500 animate-pulse ring-2 ring-red-300'
                : 'bg-slate-100 border-slate-200 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Mic className="w-4 h-4" />
          </button>

          <div className="flex-1 relative">
            <textarea
              ref={textareaRef}
              rows={1}
              value={input}
              onChange={handleTextareaInput}
              onKeyDown={handleKeyDown}
              disabled={isProcessing}
              placeholder={
                isVoiceActive
                  ? '🎙 Listening... Speak now!'
                  : t.chatPlaceholder || 'Ask FlowMind AI or describe an enterprise action (Enter to send, Shift+Enter for new line)...'
              }
              className={`w-full text-bloom-textDark text-xs rounded-2xl px-4 py-3 focus:outline-none transition-colors resize-none custom-scrollbar leading-relaxed ${
                isVoiceActive
                  ? 'bg-red-50/60 border border-red-300 focus:border-red-500 font-medium placeholder-red-400'
                  : 'bg-slate-100 border border-slate-200 focus:border-purple-500 focus:bg-white'
              } ${isProcessing ? 'opacity-70 cursor-not-allowed' : ''}`}
            />
          </div>

          <Button
            variant="dark"
            size="md"
            onClick={() => handleSend()}
            disabled={!input.trim() || isProcessing}
            icon={isProcessing ? <Loader2 className="w-4 h-4 animate-spin text-purple-400" /> : <Send className="w-4 h-4" />}
            className="rounded-2xl px-5 py-3 h-[42px] shrink-0"
          >
            {isProcessing ? 'Thinking...' : 'Send'}
          </Button>
        </div>
      </div>
    </div>
  );
};
