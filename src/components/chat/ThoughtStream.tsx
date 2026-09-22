import React from 'react';
import { ThoughtStep } from '@/types';
import { Loader2, CheckCircle2, Clock } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';

interface ThoughtStreamProps {
  steps: ThoughtStep[];
}

export const ThoughtStream: React.FC<ThoughtStreamProps> = ({ steps }) => {
  if (!steps || steps.length === 0) return null;

  return (
    <div className="my-2.5 p-3 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2">
      <div className="flex items-center justify-between border-b border-slate-800/80 pb-1.5">
        <span className="text-[11px] font-bold text-slate-300 tracking-wider uppercase flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-blue-500 animate-ping" />
          Live Agent Thought Stream
        </span>
        <span className="text-[10px] text-slate-400">{steps.length} Steps Logged</span>
      </div>
      <div className="space-y-1.5">
        {steps.map((step, idx) => (
          <div
            key={idx}
            className="flex items-center justify-between text-xs px-2.5 py-1.5 rounded-lg bg-slate-900/60 border border-slate-800/60"
          >
            <div className="flex items-center gap-2">
              <Badge variant="cyan" className="text-[10px] font-bold">
                {step.agent} Agent
              </Badge>
              <span className="text-slate-200">{step.action}</span>
            </div>
            <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
              {step.status === 'DONE' && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
              {step.status === 'RUNNING' && <Loader2 className="w-3.5 h-3.5 text-blue-400 animate-spin" />}
              {step.status === 'PENDING' && <Clock className="w-3.5 h-3.5 text-slate-400" />}
              <span>{step.timestamp}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
