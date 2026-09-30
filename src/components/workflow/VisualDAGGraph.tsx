'use client';

import React, { useState } from 'react';
import { WorkflowDefinition, WorkflowNodeDSL } from '@/types/workflowDSL';
import { AgentLogo } from '@/components/ui/AgentLogo';
import { Zap, GitFork, CheckCircle2, ShieldAlert, FileText, Bell, Clock, Play, ArrowDown, ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';

interface VisualDAGGraphProps {
  workflow: WorkflowDefinition;
  selectedNodeId?: string;
  onSelectNode?: (node: WorkflowNodeDSL) => void;
}

export const VisualDAGGraph: React.FC<VisualDAGGraphProps> = ({
  workflow,
  selectedNodeId,
  onSelectNode,
}) => {
  const [zoom, setZoom] = useState(1);

  const getNodeIcon = (type: string, agentId?: string) => {
    switch (type) {
      case 'TRIGGER': return <Zap className="w-4 h-4 text-amber-400" />;
      case 'CONDITION': return <GitFork className="w-4 h-4 text-purple-400" />;
      case 'NOTIFICATION': return <Bell className="w-4 h-4 text-blue-400" />;
      case 'ARTIFACT': return <FileText className="w-4 h-4 text-emerald-400" />;
      case 'DELAY': return <Clock className="w-4 h-4 text-yellow-400" />;
      case 'END': return <CheckCircle2 className="w-4 h-4 text-slate-400" />;
      default:
        if (agentId) return <AgentLogo agentId={agentId as any} size="xs" />;
        return <Play className="w-4 h-4 text-purple-400" />;
    }
  };

  return (
    <div className="relative p-6 rounded-3xl bg-slate-950 border border-slate-800 shadow-2xl overflow-hidden min-h-[420px] flex flex-col justify-between">
      {/* Graph Toolbar Controls */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3 z-10">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-white uppercase tracking-wider">DAG Node Execution Graph</span>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-950 text-purple-300 font-mono border border-purple-800/40">
            {workflow.nodes.length} Nodes &bull; {workflow.edges.length} Edges
          </span>
        </div>
        <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 rounded-xl p-1 text-slate-400">
          <button onClick={() => setZoom(Math.min(zoom + 0.1, 1.3))} className="p-1 hover:text-white"><ZoomIn className="w-3.5 h-3.5" /></button>
          <span className="text-[10px] font-mono text-purple-300 px-1">{Math.round(zoom * 100)}%</span>
          <button onClick={() => setZoom(Math.max(zoom - 0.1, 0.7))} className="p-1 hover:text-white"><ZoomOut className="w-3.5 h-3.5" /></button>
          <button onClick={() => setZoom(1)} className="p-1 hover:text-white"><Maximize2 className="w-3.5 h-3.5" /></button>
        </div>
      </div>

      {/* Nodes Render Container */}
      <div className="py-8 flex flex-col items-center gap-6 transition-transform" style={{ transform: `scale(${zoom})` }}>
        {workflow.nodes.map((node, index) => {
          const isSelected = selectedNodeId === node.id;
          const isCondition = node.type === 'CONDITION';
          
          // Check if any incoming edge has a conditional branch label
          const incomingEdge = workflow.edges.find((e) => e.target === node.id);
          const branchLabel = incomingEdge?.condition?.label;

          return (
            <React.Fragment key={node.id}>
              {/* Branch Badge Label if incoming from a Condition node */}
              {branchLabel && (
                <div className="my-1 flex items-center gap-1.5">
                  <div className="h-3 w-0.5 bg-purple-500/50" />
                  <span
                    className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded-full border shadow-sm ${
                      branchLabel === 'TRUE'
                        ? 'bg-emerald-950 text-emerald-300 border-emerald-800/60'
                        : 'bg-red-950 text-red-300 border-red-800/60'
                    }`}
                  >
                    {branchLabel === 'TRUE' ? '✓ TRUE Branch' : '❌ FALSE Branch'}
                  </span>
                  <div className="h-3 w-0.5 bg-purple-500/50" />
                </div>
              )}

              {/* Node Card */}
              <div
                onClick={() => onSelectNode && onSelectNode(node)}
                className={`w-72 p-3.5 rounded-2xl cursor-pointer transition-all border shadow-lg relative ${
                  isSelected
                    ? 'bg-purple-950/90 border-purple-500 shadow-purple-500/20 ring-2 ring-purple-500'
                    : isCondition
                    ? 'bg-slate-900 border-purple-500/40 hover:border-purple-400'
                    : branchLabel === 'TRUE'
                    ? 'bg-slate-900/95 border-emerald-800/40 hover:border-emerald-500'
                    : branchLabel === 'FALSE'
                    ? 'bg-slate-900/95 border-red-800/40 hover:border-red-500'
                    : 'bg-slate-900/90 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between border-b border-slate-800/80 pb-2 mb-2">
                  <div className="flex items-center gap-2">
                    {getNodeIcon(node.type, node.agentId)}
                    <span className="text-[10px] font-mono font-bold uppercase text-purple-300">{node.type}</span>
                  </div>
                  {node.riskLevel && (
                    <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-purple-950 text-purple-200 border border-purple-800/50">
                      {node.riskLevel} RISK
                    </span>
                  )}
                </div>

                <h4 className="text-xs font-bold text-white mb-1">{node.name}</h4>
                <p className="text-[10px] text-slate-400 font-mono truncate">
                  {node.type === 'CONDITION'
                    ? `Expr: ${node.config.expression || 'TRUE'}`
                    : node.agentId
                    ? `Agent: ${node.agentId} Agent`
                    : `Node ID: ${node.id}`}
                </p>

                {isCondition && (
                  <div className="mt-2 pt-2 border-t border-slate-800 flex justify-between text-[10px] font-bold font-mono">
                    <span className="text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/40">✓ TRUE Branch</span>
                    <span className="text-red-400 bg-red-950/60 px-2 py-0.5 rounded border border-red-800/40">❌ FALSE Branch</span>
                  </div>
                )}
              </div>

              {/* Edge Connection Arrow Indicator */}
              {index < workflow.nodes.length - 1 && !branchLabel && (
                <div className="flex flex-col items-center text-purple-400 my-1">
                  <div className="h-4 w-0.5 bg-purple-500/50" />
                  <ArrowDown className="w-4 h-4 text-purple-400 animate-bounce" />
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};
