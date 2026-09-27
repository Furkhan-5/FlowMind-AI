'use client';

import React from 'react';
import { WorkflowExecution, ExecutionStatus } from '@/types/workflowDSL';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Play, Pause, XCircle, CheckCircle2, AlertTriangle, Clock, RefreshCw, Terminal } from 'lucide-react';
import { workflowEngine } from '@/lib/workflow/workflowEngine';

interface ExecutionRunnerConsoleProps {
  execution: WorkflowExecution;
  onRefresh?: () => void;
}

export const ExecutionRunnerConsole: React.FC<ExecutionRunnerConsoleProps> = ({
  execution,
  onRefresh,
}) => {
  const isRunning = execution.status === 'RUNNING';
  const isPaused = execution.status === 'PAUSED';
  const isCompleted = execution.status === 'COMPLETED';
  const isFailed = execution.status === 'FAILED';

  const handlePause = () => {
    workflowEngine.pauseExecution(execution.id);
    onRefresh && onRefresh();
  };

  const handleResume = () => {
    workflowEngine.resumeExecution(execution.id);
    onRefresh && onRefresh();
  };

  const handleCancel = () => {
    workflowEngine.cancelExecution(execution.id);
    onRefresh && onRefresh();
  };

  return (
    <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 text-white space-y-4 shadow-2xl">
      {/* Console Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4 text-purple-400" />
          <h4 className="text-xs font-bold text-white uppercase tracking-wider">Live DAG Execution Console</h4>
          <span className="text-[10px] font-mono text-purple-300">#{execution.id}</span>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={isCompleted ? 'success' : isFailed ? 'default' : isPaused ? 'warning' : 'purple'}>
            STATUS: {execution.status}
          </Badge>

          {isRunning && (
            <Button size="sm" variant="outline" className="text-xs text-amber-300 border-amber-500/40" onClick={handlePause} icon={<Pause className="w-3 h-3" />}>
              Pause
            </Button>
          )}

          {isPaused && (
            <Button size="sm" variant="dark" className="text-xs bg-emerald-600 hover:bg-emerald-500" onClick={handleResume} icon={<Play className="w-3 h-3" />}>
              Resume
            </Button>
          )}

          {(isRunning || isPaused) && (
            <Button size="sm" variant="ghost" className="text-xs text-red-400 hover:bg-red-950/40" onClick={handleCancel} icon={<XCircle className="w-3 h-3" />}>
              Cancel
            </Button>
          )}
        </div>
      </div>

      {/* Execution Timeline Logs */}
      <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 font-mono text-[11px] space-y-2 max-h-64 overflow-y-auto custom-scrollbar">
        {execution.logs.map((log) => (
          <div key={log.id} className="flex items-start gap-2.5 leading-relaxed">
            <span className="text-slate-500 shrink-0">{log.timestamp}</span>
            <span
              className={
                log.status === 'SUCCESS' || log.status === 'COMPLETED'
                  ? 'text-emerald-400'
                  : log.status === 'FAILED'
                  ? 'text-red-400 font-bold'
                  : log.status === 'RUNNING'
                  ? 'text-purple-300'
                  : 'text-slate-300'
              }
            >
              {log.message}
            </span>
          </div>
        ))}
      </div>

      {/* Node Execution Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs font-mono">
        {Object.values(execution.nodeRecords).map((rec) => (
          <div key={rec.nodeId} className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
            <div className="flex items-center justify-between text-[10px]">
              <span className="text-slate-400 font-bold">{rec.nodeId}</span>
              <span className={rec.status === 'SUCCESS' ? 'text-emerald-400 font-bold' : rec.status === 'FAILED' ? 'text-red-400' : 'text-amber-300'}>
                {rec.status}
              </span>
            </div>
            {rec.durationMs && <div className="text-[10px] text-slate-500">Duration: {rec.durationMs}ms</div>}
            {rec.error && <div className="text-[10px] text-red-400 truncate">{rec.error}</div>}
          </div>
        ))}
      </div>
    </div>
  );
};
