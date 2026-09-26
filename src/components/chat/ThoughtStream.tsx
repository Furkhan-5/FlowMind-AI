'use client';

import React, { useState } from 'react';
import { ThoughtStep } from '@/types';
import { Loader2, CheckCircle2, Clock, ShieldAlert, XCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { AgentLogo } from '@/components/ui/AgentLogo';

interface ThoughtStreamProps {
  steps: ThoughtStep[];
}

export const ThoughtStream: React.FC<ThoughtStreamProps> = ({ steps }) => {
  const [isExpanded, setIsExpanded] = useState(true);

  if (!steps || steps.length === 0) return null;

  return (
    <div className="my-2.5 p-3 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-2 text-white">
      {/* Stream Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-2">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-2 hover:opacity-80 transition-opacity"
        >
          <span className="w-2 h-2 rounded-full bg-blue-500 animate-ping" />
          <span className="text-[11px] font-bold text-slate-300 tracking-wider uppercase">
            Live Agent Thought Stream
          </span>
          {isExpanded ? <ChevronUp className="w-3.5 h-3.5 text-slate-400" /> : <ChevronDown className="w-3.5 h-3.5 text-slate-400" />}
        </button>

        <span className="text-[10px] font-mono text-slate-400">{steps.length} Steps Logged</span>
      </div>

      {/* Steps List */}
      {isExpanded && (
        <div className="space-y-1.5 pt-1">
          {steps.map((step, idx) => {
            const isSecurityBlocked = step.action.includes('SECURITY BLOCKED') || step.status === ('SECURITY_BLOCKED' as any);
            const isCancelled = step.action.includes('cancelled') || step.status === ('CANCELLED' as any);

            return (
              <div
                key={idx}
                className={`flex items-center justify-between text-xs px-3 py-2 rounded-xl border transition-all ${
                  isSecurityBlocked
                    ? 'bg-red-950/60 border-red-500/40 text-red-200'
                    : isCancelled
                    ? 'bg-slate-900/60 border-slate-800 text-slate-400'
                    : 'bg-slate-900/80 border-slate-800/80 text-slate-200'
                }`}
              >
                <div className="flex items-center gap-2">
                  <AgentLogo agentId={step.agent} size="xs" />
                  <Badge variant={isSecurityBlocked ? 'warning' : 'purple'} className="text-[9px] font-bold">
                    {step.agent} Agent
                  </Badge>
                  <span className="text-slate-200">{step.action}</span>
                </div>

                <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-mono">
                  {step.status === 'DONE' && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
                  {step.status === 'RUNNING' && <Loader2 className="w-3.5 h-3.5 text-blue-400 animate-spin" />}
                  {step.status === 'PENDING' && <Clock className="w-3.5 h-3.5 text-amber-400" />}
                  {isSecurityBlocked && <ShieldAlert className="w-3.5 h-3.5 text-red-400" />}
                  {isCancelled && <XCircle className="w-3.5 h-3.5 text-slate-400" />}
                  <span>{step.timestamp}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
