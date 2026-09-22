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
  } = useAppStore();

  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const t = UI_TRANSLATIONS[language] || UI_TRANSLATIONS.en;

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isProcessing]);

  const handleSend = (textToSend?: string) => {
    const query = textToSend || input;
    if (!query.trim() || isProcessing) return;

    addMessage({
      sender: 'USER',
      content: query,
      language,
    });

    setInput('');
    setIsProcessing(true);

    setTimeout(() => {
      let routedAgent: AgentType = 'Sales';
      let thoughtSteps = [];
      let actionCardData = undefined;
      let responseContent = '';

      const lower = query.toLowerCase();

      if (lower.includes('sales') || lower.includes('రేపు') || lower.includes('मीटिंग') || lower.includes('meeting')) {
        routedAgent = 'Sales';
        setActiveAgent('Sales');
        responseContent = `I have routed your request to the Sales & Scheduler Agents. Meeting is scheduled and CRM leads updated.`;
        thoughtSteps = [
          { agent: 'Sales' as AgentType, action: 'Parsed natural language intent', timestamp: '12:05:01', status: 'DONE' as const },
          { agent: 'Scheduler' as AgentType, action: 'Checked calendar conflicts for tomorrow 10:00 AM', timestamp: '12:05:02', status: 'DONE' as const },
          { agent: 'Email' as AgentType, action: 'Prepared calendar invitation email', timestamp: '12:05:03', status: 'DONE' as const },
        ];
        actionCardData = {
          id: `ACT-${Date.now()}`,
          title: 'Schedule Sales Team Meeting & Send Invitations',
          description: 'Sales & Scheduler Agents parsed your request and drafted calendar invites for 4 attendees.',
          agent: 'Sales' as AgentType,
          module: 'Sales',
          details: { time: 'Tomorrow 10:00 AM IST', room: 'Virtual Meet Room 1', attendees: '4 Sales Managers' },
          status: 'PENDING' as const,
          confirmLabel: 'Approve & Schedule Meeting',
        };
      } else if (lower.includes('invoice') || lower.includes('payroll') || lower.includes('payment') || lower.includes('ലാഭം')) {
        routedAgent = 'Finance';
        setActiveAgent('Finance');
        responseContent = `Finance Agent generated invoice draft and calculated tax breakdown. Please review approval card below.`;
        thoughtSteps = [
          { agent: 'Finance' as AgentType, action: 'Queried invoice database & calculated GST (18%)', timestamp: '12:06:01', status: 'DONE' as const },
          { agent: 'Document' as AgentType, action: 'Generated PDF preview for client invoice', timestamp: '12:06:02', status: 'DONE' as const },
        ];
        actionCardData = {
          id: `ACT-${Date.now()}`,
          title: 'Issue Invoice PDF (#INV-2026-909)',
          description: 'Finance Agent verified tax codes and created client welcome invoice PDF.',
          agent: 'Finance' as AgentType,
          module: 'Finance',
          details: { client: 'Apex Tech Solutions', amount: '₹1,25,000', tax: '₹22,500 (18% GST)' },
          status: 'PENDING' as const,
          confirmLabel: 'Approve & Issue Invoice',
        };
      } else {
        routedAgent = 'CEO';
        setActiveAgent('CEO');
        responseContent = `CEO Master Orchestrator processed your query across Analytics and Knowledge RAG agents. Here is your operational report.`;
        thoughtSteps = [
          { agent: 'Knowledge' as AgentType, action: 'Searched internal vector DB with HNSW index', timestamp: '12:07:01', status: 'DONE' as const },
          { agent: 'Analytics' as AgentType, action: 'Calculated real-time KPI metrics', timestamp: '12:07:02', status: 'DONE' as const },
        ];
      }

      addMessage({
        sender: 'AGENT',
        activeAgent: routedAgent,
        content: responseContent,
        language,
        thoughtStream: thoughtSteps,
        actionCard: actionCardData,
      });

      setIsProcessing(false);
    }, 1200);
  };

  return (
    <div className="flex flex-col h-[75vh] bg-bloom-bg text-bloom-textDark relative overflow-hidden">
      {/* Top Banner */}
      <div className="px-6 py-3 border-b border-slate-200 bg-white flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-purple-100 border border-purple-200 flex items-center justify-center">
            <Bot className="w-4 h-4 text-purple-700" />
          </div>
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
        <PromptChips onSelectPrompt={(p) => handleSend(p)} />

        <div className="flex items-center gap-2">
          <button
            onClick={() => setVoiceActive(!isVoiceActive)}
            className={`p-2.5 rounded-full border transition-all ${
              isVoiceActive
                ? 'bg-red-500 text-white border-red-500 animate-pulse'
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
            placeholder={t.chatPlaceholder}
            className="flex-1 bg-slate-100 border border-slate-200 text-bloom-textDark text-xs rounded-full px-5 py-3 focus:outline-none focus:border-purple-500 transition-colors"
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
