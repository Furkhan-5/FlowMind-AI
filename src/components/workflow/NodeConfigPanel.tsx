'use client';

import React, { useState, useEffect } from 'react';
import { WorkflowNodeDSL, NodeType } from '@/types/workflowDSL';
import { Button } from '@/components/ui/Button';
import { X, Save, ShieldAlert, Cpu, GitFork, RefreshCw, Zap } from 'lucide-react';
import { AgentType } from '@/types';

interface NodeConfigPanelProps {
  node: WorkflowNodeDSL;
  onSave: (updatedNode: WorkflowNodeDSL) => void;
  onClose: () => void;
}

export const NodeConfigPanel: React.FC<NodeConfigPanelProps> = ({
  node,
  onSave,
  onClose,
}) => {
  const [name, setName] = useState(node.name);
  const [agentId, setAgentId] = useState<AgentType | undefined>(node.agentId);
  const [configJson, setConfigJson] = useState(JSON.stringify(node.config, null, 2));
  const [maxAttempts, setMaxAttempts] = useState(node.retryPolicy?.maxAttempts || 3);
  const [timeoutMs, setTimeoutMs] = useState(node.timeoutMs || 30000);
  const [expression, setExpression] = useState(node.config.expression || '{{trigger.value}} > 100000');
  const [jsonError, setJsonError] = useState<string | null>(null);

  useEffect(() => {
    setName(node.name);
    setAgentId(node.agentId);
    setConfigJson(JSON.stringify(node.config, null, 2));
    setMaxAttempts(node.retryPolicy?.maxAttempts || 3);
    setTimeoutMs(node.timeoutMs || 30000);
    setExpression(node.config.expression || '{{trigger.value}} > 100000');
    setJsonError(null);
  }, [node]);

  const handleSave = () => {
    try {
      const parsedConfig = JSON.parse(configJson);
      if (node.type === 'CONDITION') {
        parsedConfig.expression = expression;
      }

      onSave({
        ...node,
        name,
        agentId,
        config: parsedConfig,
        retryPolicy: {
          maxAttempts: Number(maxAttempts),
          strategy: 'exponential',
          initialDelayMs: 1000,
        },
        timeoutMs: Number(timeoutMs),
      });
      onClose();
    } catch (e: any) {
      setJsonError('Invalid JSON format in node configuration.');
    }
  };

  return (
    <div className="fixed inset-y-0 right-0 w-full sm:w-[420px] bg-slate-900/95 backdrop-blur-xl border-l border-slate-800 p-6 z-50 text-white shadow-2xl flex flex-col justify-between space-y-4">
      <div className="space-y-4 overflow-y-auto custom-scrollbar pr-1">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Cpu className="w-5 h-5 text-purple-400" />
            <div>
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">Node Configuration</h3>
              <p className="text-[10px] text-slate-400 font-mono">ID: {node.id}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Node Type Badge */}
        <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs">
          <span className="text-slate-400">Node Type:</span>
          <span className="font-bold text-purple-300 font-mono uppercase">{node.type}</span>
        </div>

        {/* Node Name Input */}
        <div className="space-y-1">
          <label className="text-[11px] font-bold text-slate-300">Display Name:</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500 font-medium"
          />
        </div>

        {/* Agent Assignment (if applicable) */}
        {(node.type === 'AGENT' || node.type === 'ACTION' || node.type === 'ARTIFACT') && (
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-300 flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-purple-400" /> Linked Agent Mesh Integration:
            </label>
            <select
              value={agentId || 'Sales'}
              onChange={(e) => setAgentId(e.target.value as AgentType)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500 font-mono"
            >
              {['Sales', 'Finance', 'HR', 'Analytics', 'Support', 'Database', 'Workflow', 'Scheduler', 'Document', 'Email', 'Knowledge', 'Reporting', 'Security'].map((ag) => (
                <option key={ag} value={ag}>{ag} Agent</option>
              ))}
            </select>
          </div>
        )}

        {/* Condition Expression Evaluator */}
        {node.type === 'CONDITION' && (
          <div className="space-y-1 p-3 rounded-xl bg-purple-950/40 border border-purple-800/40">
            <label className="text-[11px] font-bold text-purple-200 flex items-center gap-1.5">
              <GitFork className="w-3.5 h-3.5 text-purple-400" /> Condition Expression:
            </label>
            <input
              type="text"
              value={expression}
              onChange={(e) => setExpression(e.target.value)}
              placeholder="{{trigger.value}} > 100000"
              className="w-full bg-slate-950 border border-purple-500/50 rounded-xl px-3 py-2 text-xs text-purple-200 focus:outline-none focus:border-purple-400 font-mono"
            />
            <p className="text-[10px] text-slate-400 pt-1">
              Supports: <code className="text-purple-300">==</code>, <code className="text-purple-300">&gt;</code>, <code className="text-purple-300">&lt;</code>, <code className="text-purple-300">contains</code>, <code className="text-purple-300">exists</code>
            </p>
          </div>
        )}

        {/* Retry & Timeout Config */}
        <div className="grid grid-cols-2 gap-3 pt-2">
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase">Max Retries:</label>
            <input
              type="number"
              min="1"
              max="5"
              value={maxAttempts}
              onChange={(e) => setMaxAttempts(Number(e.target.value))}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-purple-500 font-mono"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase">Timeout (ms):</label>
            <input
              type="number"
              value={timeoutMs}
              onChange={(e) => setTimeoutMs(Number(e.target.value))}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-purple-500 font-mono"
            />
          </div>
        </div>

        {/* JSON Parameter Config */}
        <div className="space-y-1 pt-2">
          <label className="text-[11px] font-bold text-slate-300">Parameters (JSON Schema):</label>
          <textarea
            rows={6}
            value={configJson}
            onChange={(e) => {
              setConfigJson(e.target.value);
              setJsonError(null);
            }}
            className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs font-mono text-emerald-300 focus:outline-none focus:border-purple-500 leading-relaxed"
          />
          {jsonError && <p className="text-[10px] text-red-400 font-semibold">{jsonError}</p>}
        </div>
      </div>

      {/* Save / Cancel Controls */}
      <div className="flex items-center gap-2 pt-4 border-t border-slate-800">
        <Button size="sm" variant="dark" className="flex-1 bg-purple-600 hover:bg-purple-500 text-xs font-bold" onClick={handleSave} icon={<Save className="w-3.5 h-3.5" />}>
          Save Node Changes
        </Button>
        <Button size="sm" variant="outline" className="text-xs" onClick={onClose}>
          Cancel
        </Button>
      </div>
    </div>
  );
};
