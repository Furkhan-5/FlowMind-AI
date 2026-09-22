'use client';

import React, { useState } from 'react';
import { useAppStore } from '@/lib/store/useAppStore';
import { UI_TRANSLATIONS } from '@/lib/i18n/translations';
import { AgentType, ChatMessage } from '@/types';
import { MOCK_AGENTS } from '@/lib/mockData';
import { ThoughtStream } from '@/components/chat/ThoughtStream';
import { ActionCard } from '@/components/chat/ActionCard';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import {
  Bot,
  X,
  Send,
  Mic,
  Sparkles,
  ChevronRight,
  ShieldCheck,
  CheckCircle2,
  RefreshCw,
} from 'lucide-react';

export const RobotAssistant: React.FC = () => {
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

  const [isOpen, setIsOpen] = useState(true);
  const [selectedAgent, setSelectedAgentState] = useState<AgentType | null>(null);
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const t = UI_TRANSLATIONS[language] || UI_TRANSLATIONS.en;

  const handleSelectAgent = (agentId: AgentType) => {
    setSelectedAgentState(agentId);
    setActiveAgent(agentId);

    const agentObj = MOCK_AGENTS.find((a) => a.id === agentId);
    const welcomeMsg = `Hi! I am connecting you to the **${agentObj?.name || agentId}**. ${agentObj?.description || ''} What query or workflow would you like to execute today?`;

    addMessage({
      sender: 'AGENT',
      activeAgent: agentId,
      content: welcomeMsg,
      language,
    });
  };

  const handleSendQuery = (customText?: string) => {
    const query = customText || input;
    if (!query.trim() || isProcessing || !selectedAgent) return;

    addMessage({
      sender: 'USER',
      content: query,
      language,
    });

    setInput('');
    setIsProcessing(true);

    setTimeout(() => {
      let thoughtSteps = [];
      let actionCardData = undefined;
      let responseContent = '';

      const lower = query.toLowerCase();

      if (selectedAgent === 'Sales') {
        responseContent = `Sales Agent processed your lead query. I have updated the CRM pipeline and scheduled follow-ups.`;
        thoughtSteps = [
          { agent: 'Sales' as AgentType, action: 'Queried CRM leads database', timestamp: '21:15:01', status: 'DONE' as const },
          { agent: 'Scheduler' as AgentType, action: 'Scheduled 48-hour lead follow-up reminder', timestamp: '21:15:02', status: 'DONE' as const },
        ];
        actionCardData = {
          id: `ACT-${Date.now()}`,
          title: 'Update CRM Lead Status & Send Proposal',
          description: 'Sales Agent drafted proposal letter and updated deal stage to PROPOSAL.',
          agent: 'Sales' as AgentType,
          module: 'Sales',
          details: { client: 'Apex Tech Solutions', dealValue: '₹1,25,000', assigned: 'Sales Manager' },
          status: 'PENDING' as const,
          confirmLabel: 'Approve & Send Proposal',
        };
      } else if (selectedAgent === 'Finance') {
        responseContent = `Finance Agent verified invoice amounts and calculated 18% GST tax break-up. Invoice PDF is ready.`;
        thoughtSteps = [
          { agent: 'Finance' as AgentType, action: 'Calculated 18% GST & verified bank account codes', timestamp: '21:15:05', status: 'DONE' as const },
          { agent: 'Document' as AgentType, action: 'Generated PDF invoice preview', timestamp: '21:15:06', status: 'DONE' as const },
        ];
        actionCardData = {
          id: `ACT-${Date.now()}`,
          title: 'Issue Official Invoice PDF (#INV-2026-990)',
          description: 'Finance Agent verified tax codes and created client welcome invoice PDF.',
          agent: 'Finance' as AgentType,
          module: 'Finance',
          details: { client: 'Hyderabad Pharma Ltd', amount: '₹3,40,000', tax: '₹61,200 (18% GST)' },
          status: 'PENDING' as const,
          confirmLabel: 'Approve & Dispatch Invoice',
        };
      } else if (selectedAgent === 'HR') {
        responseContent = `HR Agent processed employee leave approvals and verified monthly payroll slip logs.`;
        thoughtSteps = [
          { agent: 'HR' as AgentType, action: 'Checked employee leave balance', timestamp: '21:15:10', status: 'DONE' as const },
          { agent: 'Security' as AgentType, action: 'Enforced HR data confidentiality rule', timestamp: '21:15:11', status: 'DONE' as const },
        ];
      } else {
        responseContent = `${selectedAgent} Agent completed your query across system modules and logged state changes.`;
        thoughtSteps = [
          { agent: selectedAgent, action: `Executed ${selectedAgent} domain task`, timestamp: '21:15:15', status: 'DONE' as const },
        ];
      }

      addMessage({
        sender: 'AGENT',
        activeAgent: selectedAgent,
        content: responseContent,
        language,
        thoughtStream: thoughtSteps,
        actionCard: actionCardData,
      });

      setIsProcessing(false);
    }, 1100);
  };

  const getAgentPrompts = (agent: AgentType) => {
    switch (agent) {
      case 'Sales':
        return ['Show today\'s CRM leads', 'Schedule sales meeting tomorrow at 10 AM', 'Draft proposal for Apex Tech'];
      case 'Finance':
        return ['Draft welcome invoice for new lead', 'Check overdue payments', 'Calculate monthly GST tax break-up'];
      case 'HR':
        return ['Approve employee leave request', 'Generate monthly payroll summary', 'Onboard new team member'];
      case 'Support':
        return ['Show open helpdesk tickets', 'Check urgent SLA breaches', 'Draft customer resolution email'];
      case 'Analytics':
        return ['Show monthly revenue forecast', 'Calculate automation cost savings', 'Generate executive KPI chart'];
      default:
        return ['Execute domain task', 'Show recent status log', 'Summarize key metrics'];
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      {/* Floating Robot Launcher Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="group relative flex items-center gap-3 bg-bloom-dark hover:bg-bloom-darkCard text-white px-5 py-3 rounded-full shadow-bloom-lg border border-purple-500/30 transition-all transform hover:scale-105"
        >
          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-purple-600 to-indigo-500 flex items-center justify-center text-white shadow-md animate-bounce">
            <Bot className="w-5 h-5" />
          </div>
          <div className="text-left">
            <p className="text-xs font-extrabold tracking-tight">AI Robot Assistant</p>
            <p className="text-[10px] text-purple-300 font-medium">Select Agent & Chat</p>
          </div>
          <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-slate-950 animate-ping" />
        </button>
      )}

      {/* Robot Popup Panel */}
      {isOpen && (
        <div className="w-[92vw] sm:w-[440px] max-h-[85vh] bg-white rounded-[32px] border border-slate-200 shadow-bloom-lg flex flex-col overflow-hidden animate-fadeIn relative">
          {/* Robot Header */}
          <div className="p-4 bg-bloom-dark text-white flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-purple-600/30 border border-purple-400/40 flex items-center justify-center text-white">
                <Bot className="w-5 h-5 text-purple-300" />
              </div>
              <div>
                <h3 className="text-xs font-extrabold tracking-tight">FlowMind Robot Assistant</h3>
                <p className="text-[10px] text-purple-300">Select 1 of 15 Agents to Interact</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {selectedAgent && (
                <button
                  onClick={() => setSelectedAgentState(null)}
                  className="text-[10px] bg-purple-900/60 hover:bg-purple-800 text-purple-200 px-2.5 py-1 rounded-full border border-purple-700/50 flex items-center gap-1"
                  title="Switch Agent"
                >
                  <RefreshCw className="w-3 h-3" /> Switch Agent
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-full hover:bg-slate-800 text-slate-300 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* STEP 1: Select Agent Grid (When no agent is selected) */}
          {!selectedAgent ? (
            <div className="p-5 flex-1 overflow-y-auto space-y-4 custom-scrollbar bg-bloom-bg">
              {/* Robot Greeting Speech Bubble */}
              <div className="p-4 rounded-2xl bg-white border border-purple-200 shadow-sm space-y-2 relative">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-bloom-dark">🤖 Robot Assistant:</span>
                </div>
                <p className="text-xs text-slate-700 leading-relaxed">
                  "Hi! 👋 Welcome to FlowMind AI. Please select which specialized domain agent you would like to interact with today:"
                </p>
              </div>

              {/* 15 Agents Picker Grid */}
              <div className="space-y-2">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                  15 Specialized Domain Agents:
                </span>
                <div className="grid grid-cols-2 gap-2">
                  {MOCK_AGENTS.map((agent) => (
                    <button
                      key={agent.id}
                      onClick={() => handleSelectAgent(agent.id)}
                      className="p-3 rounded-2xl bg-white hover:bg-purple-50/80 border border-slate-200 hover:border-purple-300 text-left transition-all duration-200 shadow-sm flex flex-col justify-between group"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <div className={`w-6 h-6 rounded-full ${agent.avatarColor} text-white flex items-center justify-center text-[10px] font-bold`}>
                          {agent.id.substring(0, 2)}
                        </div>
                        <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-purple-600 transition-colors" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-bloom-dark group-hover:text-purple-900">{agent.name}</h4>
                        <p className="text-[10px] text-slate-500 truncate">{agent.domain}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            /* STEP 2: Agent Conversation View (When an agent is selected) */
            <div className="flex-1 flex flex-col h-[520px] bg-bloom-bg">
              {/* Agent Title Bar */}
              <div className="px-4 py-2 bg-purple-50 border-b border-purple-200 flex items-center justify-between">
                <span className="text-xs font-bold text-purple-900 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                  Connected to: {selectedAgent} Agent
                </span>
                <Badge variant="purple" className="text-[9px]">
                  <ShieldCheck className="w-3 h-3" /> {user.role} SANITIZED
                </Badge>
              </div>

              {/* Chat Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${msg.sender === 'USER' ? 'items-end' : 'items-start'}`}
                  >
                    <div className="flex items-center gap-1.5 mb-1 px-1">
                      <span className="text-[10px] font-bold text-slate-500">
                        {msg.sender === 'USER' ? 'You' : `${msg.activeAgent || selectedAgent} Agent`}
                      </span>
                    </div>
                    <div
                      className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed border shadow-sm ${
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
                  <div className="flex items-center gap-2 text-xs text-purple-700 bg-purple-50 p-2.5 rounded-xl border border-purple-200 animate-pulse w-fit">
                    <Sparkles className="w-3.5 h-3.5 animate-spin text-purple-600" />
                    <span>Executing query with {selectedAgent} Agent...</span>
                  </div>
                )}
              </div>

              {/* Agent Quick Prompts */}
              <div className="p-2 border-t border-slate-200 bg-white space-y-2">
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 custom-scrollbar">
                  <span className="text-[9px] font-bold text-purple-700 uppercase tracking-wider shrink-0">
                    Suggested:
                  </span>
                  {getAgentPrompts(selectedAgent).map((p, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSendQuery(p)}
                      className="shrink-0 px-2.5 py-1 rounded-full text-[10px] bg-purple-50 hover:bg-purple-100 text-purple-900 border border-purple-200 font-medium transition-colors"
                    >
                      {p}
                    </button>
                  ))}
                </div>

                {/* Input Controls */}
                <div className="flex items-center gap-2 pt-1">
                  <button
                    onClick={() => setVoiceActive(!isVoiceActive)}
                    className={`p-2 rounded-full border transition-all ${
                      isVoiceActive
                        ? 'bg-red-500 text-white border-red-500 animate-pulse'
                        : 'bg-slate-100 border-slate-200 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    <Mic className="w-3.5 h-3.5" />
                  </button>

                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSendQuery()}
                    placeholder={`Ask ${selectedAgent} Agent...`}
                    className="flex-1 bg-slate-100 border border-slate-200 text-bloom-textDark text-xs rounded-full px-4 py-2 focus:outline-none focus:border-purple-500 transition-colors"
                  />

                  <Button
                    variant="dark"
                    size="sm"
                    onClick={() => handleSendQuery()}
                    disabled={!input.trim() || isProcessing}
                    icon={<Send className="w-3.5 h-3.5" />}
                  >
                    Send
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
