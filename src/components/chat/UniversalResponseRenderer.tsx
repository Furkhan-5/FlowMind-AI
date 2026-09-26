'use client';

import React from 'react';
import { ChatMessage } from '@/types';
import { SuggestedAction, ArtifactRef } from '@/types/universalAgent';
import { ThoughtStream } from './ThoughtStream';
import { ActionCard } from './ActionCard';
import { AgentLogo } from '@/components/ui/AgentLogo';
import { artifactManager } from '@/lib/ai/artifactManager';
import { Download, Sparkles, RefreshCw, AlertCircle, FileText, CheckCircle } from 'lucide-react';
import { useAppStore } from '@/lib/store/useAppStore';

interface UniversalResponseRendererProps {
  message: ChatMessage;
  onSendSuggestedAction?: (query: string) => void;
}

export const UniversalResponseRenderer: React.FC<UniversalResponseRendererProps> = ({
  message,
  onSendSuggestedAction,
}) => {
  const isUser = message.sender === 'USER';
  const isSystem = message.sender === 'SYSTEM';
  const activeAgent = message.activeAgent || 'CEO';

  const handleDownloadArtifact = (art: ArtifactRef) => {
    artifactManager.downloadArtifact(art);
  };

  if (isUser) {
    return (
      <div className="flex justify-end my-2">
        <div className="max-w-[80%] p-3.5 rounded-2xl bg-purple-600 text-white shadow-lg text-xs leading-relaxed font-medium rounded-tr-none">
          {message.content}
        </div>
      </div>
    );
  }

  if (isSystem) {
    return (
      <div className="flex justify-center my-3">
        <div className="px-4 py-2 rounded-full bg-slate-900 border border-slate-800 text-slate-400 text-xs font-mono flex items-center gap-2">
          <Sparkles className="w-3.5 h-3.5 text-purple-400" />
          <span>{message.content}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-start gap-3 my-3 max-w-[95%] text-white">
      <AgentLogo agentId={activeAgent} size="md" glow />

      <div className="flex-1 space-y-2">
        {/* Agent Name Header & Badges */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-200">{activeAgent} Agent</span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-950/80 border border-purple-800/50 text-purple-300 font-mono">
              Universal Agent Mesh
            </span>
          </div>
          {message.confidenceLevel && (
            <span
              className={`text-[10px] font-bold font-mono px-2 py-0.5 rounded-full border ${
                message.confidenceLevel === 'HIGH'
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                  : message.confidenceLevel === 'MEDIUM'
                  ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                  : 'bg-red-500/10 text-red-400 border-red-500/30'
              }`}
            >
              CONFIDENCE: {message.confidenceLevel}
            </span>
          )}
        </div>

        {/* Inter-Agent Handoff Banner */}
        {message.handoff && (
          <div className="p-2.5 rounded-xl bg-purple-950/90 border border-purple-500/40 text-xs text-purple-200 flex items-center gap-2 shadow-inner">
            <RefreshCw className="w-4 h-4 text-purple-400 animate-spin-slow shrink-0" />
            <div>
              <div className="font-bold text-purple-300">
                🔄 Controlled Inter-Agent Handoff Executed: {message.handoff.sourceAgent} Agent → {message.handoff.targetAgent} Agent
              </div>
              <div className="text-[11px] text-slate-300">{message.handoff.reason}</div>
            </div>
          </div>
        )}

        {/* Safe Thought Stream Observability */}
        {message.thoughtStream && message.thoughtStream.length > 0 && (
          <ThoughtStream steps={message.thoughtStream} />
        )}

        {/* Response Text Box */}
        <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800/80 shadow-md text-xs text-slate-200 leading-relaxed font-sans rounded-tl-none space-y-2">
          <p>{message.content}</p>
        </div>

        {/* Action Card */}
        {message.actionCard && <ActionCard data={message.actionCard} />}

        {/* Universal Artifact Downloads */}
        {message.artifacts && message.artifacts.length > 0 && (
          <div className="p-3 rounded-2xl bg-slate-900 border border-purple-500/30 space-y-2">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-purple-400" />
              <span>Generated Enterprise Artifacts:</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {message.artifacts.map((art) => (
                <button
                  key={art.id}
                  onClick={() => handleDownloadArtifact(art)}
                  className="px-3 py-1.5 rounded-xl bg-purple-950/80 hover:bg-purple-900 border border-purple-700/60 text-xs text-purple-200 font-medium flex items-center gap-1.5 transition-all shadow-md active:scale-95"
                >
                  <Download className="w-3.5 h-3.5 text-purple-400" />
                  <span>{art.title} ({art.type})</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Contextual Suggested Next Actions */}
        {message.suggestedActions && message.suggestedActions.length > 0 && (
          <div className="pt-1 space-y-1.5">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-purple-400" />
              <span>Suggested Next Actions:</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {message.suggestedActions.map((sug) => (
                <button
                  key={sug.id}
                  onClick={() => onSendSuggestedAction && onSendSuggestedAction(sug.actionQuery)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all flex items-center gap-1.5 shadow-sm active:scale-95 ${
                    sug.primary
                      ? 'bg-purple-600 hover:bg-purple-500 text-white font-bold border border-purple-400/40'
                      : 'bg-slate-900/90 hover:bg-slate-800 text-purple-300 border border-slate-800 hover:border-purple-500/40'
                  }`}
                >
                  <span>{sug.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
