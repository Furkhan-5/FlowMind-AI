'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAppStore } from '@/lib/store/useAppStore';
import { Navbar } from '@/components/layout/Navbar';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import {
  WorkflowDefinition,
  WorkflowNodeDSL,
  WorkflowExecution,
} from '@/types/workflowDSL';
import { workflowPlanner } from '@/lib/workflow/workflowPlanner';
import { workflowStorage } from '@/lib/workflow/workflowStorage';
import { workflowEngine } from '@/lib/workflow/workflowEngine';
import { VisualDAGGraph } from '@/components/workflow/VisualDAGGraph';
import { NodeConfigPanel } from '@/components/workflow/NodeConfigPanel';
import { ExecutionRunnerConsole } from '@/components/workflow/ExecutionRunnerConsole';
import {
  GitFork,
  Play,
  Pause,
  Save,
  Plus,
  Search,
  CheckCircle2,
  AlertTriangle,
  Zap,
  Copy,
  Terminal,
  FileText,
  Clock,
  RotateCcw,
  ArrowLeft,
} from 'lucide-react';

export default function WorkflowsPage() {
  const { user, addToast } = useAppStore();

  const [workflows, setWorkflows] = useState<WorkflowDefinition[]>([]);
  const [activeWorkflow, setActiveWorkflow] = useState<WorkflowDefinition | null>(null);
  const [selectedNode, setSelectedNode] = useState<WorkflowNodeDSL | null>(null);
  const [currentExecution, setCurrentExecution] = useState<WorkflowExecution | null>(null);

  const [nlInput, setNlInput] = useState('');
  const [isPlanning, setIsPlanning] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  useEffect(() => {
    refreshWorkflows();
  }, []);

  const refreshWorkflows = () => {
    const list = workflowStorage.getAllWorkflows(user.organizationId || 'ORG-01');
    setWorkflows(list);
    if (list.length > 0 && !activeWorkflow) {
      setActiveWorkflow(list[0]);
    }
  };

  const handleGenerateWorkflow = () => {
    if (!nlInput.trim() || isPlanning) return;
    setIsPlanning(true);

    try {
      const planRes = workflowPlanner.generateDAGFromNaturalLanguage(nlInput, user);
      if (planRes.success && planRes.workflow) {
        workflowStorage.saveWorkflow(planRes.workflow);
        setActiveWorkflow(planRes.workflow);
        refreshWorkflows();
        addToast({
          type: 'success',
          title: 'DAG Workflow Planned',
          message: planRes.naturalLanguageSummary,
        });
        setNlInput('');
      } else {
        addToast({
          type: 'error',
          title: 'Planner Validation Error',
          message: planRes.clarificationRequired || planRes.validationErrors?.join(', ') || 'Failed to construct valid DAG.',
        });
      }
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'Planning Error',
        message: err?.message || 'Failed to parse prompt into workflow.',
      });
    } finally {
      setIsPlanning(false);
    }
  };

  const handleRunWorkflow = async () => {
    if (!activeWorkflow) return;
    try {
      addToast({
        type: 'info',
        title: 'Execution Enqueued',
        message: `Running workflow '${activeWorkflow.name}' (v${activeWorkflow.version})...`,
      });

      const exec = await workflowEngine.executeWorkflow(
        activeWorkflow.id,
        activeWorkflow.version,
        { company: 'Acme Technologies', value: 125000 }
      );

      setCurrentExecution(exec);
      addToast({
        type: exec.status === 'COMPLETED' ? 'success' : 'error',
        title: `Workflow ${exec.status}`,
        message: `Execution #${exec.id} finished with status ${exec.status}.`,
      });
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'Execution Error',
        message: err?.message || 'Failed to execute workflow DAG.',
      });
    }
  };

  const handleDryRunTest = async () => {
    if (!activeWorkflow) return;
    try {
      const exec = await workflowEngine.executeWorkflow(
        activeWorkflow.id,
        activeWorkflow.version,
        { company: 'Dry Run Test Entity', value: 75000, dryRun: true }
      );
      setCurrentExecution(exec);
      addToast({
        type: 'info',
        title: 'Dry Run Simulation Complete',
        message: `Simulated execution trace completed. Zero database changes committed.`,
      });
    } catch (err: any) {
      addToast({ type: 'error', title: 'Dry Run Error', message: err?.message });
    }
  };

  const handleSaveNodeChanges = (updatedNode: WorkflowNodeDSL) => {
    if (!activeWorkflow) return;

    const updatedNodes = activeWorkflow.nodes.map((n) => (n.id === updatedNode.id ? updatedNode : n));
    const newVersion = workflowStorage.createNewVersion(activeWorkflow.id, {
      nodes: updatedNodes,
    });

    setActiveWorkflow(newVersion);
    refreshWorkflows();
    addToast({
      type: 'success',
      title: 'Workflow Version Created',
      message: `Updated node '${updatedNode.name}'. Created Version ${newVersion.version}.`,
    });
  };

  const copyWebhookUrl = () => {
    if (!activeWorkflow) return;
    const url = `${window.location.origin}/api/workflows/webhook/${activeWorkflow.id}`;
    navigator.clipboard.writeText(url);
    addToast({
      type: 'success',
      title: 'Webhook URL Copied',
      message: `Inbound Webhook URL copied to clipboard.`,
    });
  };

  const filteredWorkflows = workflows.filter((wf) => {
    const matchesSearch = wf.name.toLowerCase().includes(searchQuery.toLowerCase()) || wf.naturalTrigger.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || wf.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="min-h-screen bg-bloom-bg text-bloom-textDark font-sans selection:bg-purple-200 relative">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-8 py-6 space-y-8 pb-24">
        {/* Header Banner */}
        <div className="bg-white border border-slate-200/80 rounded-[32px] p-6 sm:p-8 shadow-bloom space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-purple-600 uppercase tracking-wider flex items-center gap-1.5">
                <GitFork className="w-3.5 h-3.5" /> Zero-Code Natural Language Workflow Engine
              </span>
              <h1 className="text-2xl sm:text-4xl font-extrabold text-bloom-dark tracking-tight">
                Visual Workflow DAG Automation
              </h1>
            </div>
            <div className="flex items-center gap-2">
              <Link
                href="/"
                className="px-3.5 py-1.5 rounded-full bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-md"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Overview</span>
              </Link>
              <Badge variant="purple">15 AGENTS LINKED</Badge>
              <Badge variant="success">TOPOLOGICAL DAG RUNNER</Badge>
            </div>
          </div>

          {/* Natural Language Prompt Input Bar */}
          <div className="p-4 rounded-2xl bg-purple-950 text-white space-y-3 shadow-xl">
            <div className="flex items-center justify-between text-xs text-purple-200 font-medium">
              <span className="flex items-center gap-1.5">
                <Zap className="w-4 h-4 text-purple-400" />
                Describe your business workflow in natural language:
              </span>
              <span className="text-[10px] text-purple-300 font-mono">Workflow Planner Agent</span>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="text"
                value={nlInput}
                onChange={(e) => setNlInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleGenerateWorkflow()}
                placeholder='e.g., "When a new lead is created, check if value > 100000. If so, ask Sales Agent to process, notify manager, and generate invoice. Otherwise add to normal queue."'
                className="flex-1 bg-slate-900 border border-purple-500/40 rounded-full px-5 py-3 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-purple-400 font-medium"
              />
              <Button
                variant="dark"
                size="md"
                onClick={handleGenerateWorkflow}
                disabled={!nlInput.trim() || isPlanning}
                icon={<Zap className="w-4 h-4" />}
                className="bg-purple-600 hover:bg-purple-500 text-white font-bold"
              >
                {isPlanning ? 'Planning DAG...' : 'Plan DAG Workflow'}
              </Button>
            </div>
          </div>
        </div>

        {/* Main Workflows Workspace Grid */}
        <div className="grid grid-cols-1 md:col-span-12 lg:grid-cols-12 gap-6">
          {/* Left Sidebar: Workflow List & Search */}
          <div className="lg:col-span-4 space-y-4">
            <GlassCard variant="white" className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-bloom-dark uppercase tracking-wider">
                  Workflows Library ({filteredWorkflows.length})
                </h3>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="text-[10px] bg-slate-100 border border-slate-200 rounded-lg px-2 py-1 font-bold"
                >
                  <option value="ALL">All Status</option>
                  <option value="ACTIVE">Active</option>
                  <option value="VALIDATED">Validated</option>
                  <option value="DRAFT">Draft</option>
                </select>
              </div>

              {/* Search Bar */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search workflows..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-3 py-1.5 text-xs text-bloom-textDark focus:outline-none focus:border-purple-500 font-medium"
                />
              </div>

              {/* Workflow Items List */}
              <div className="space-y-2.5 max-h-[500px] overflow-y-auto custom-scrollbar pr-1">
                {filteredWorkflows.map((wf) => {
                  const isActive = activeWorkflow?.id === wf.id;
                  return (
                    <div
                      key={wf.id}
                      onClick={() => setActiveWorkflow(wf)}
                      className={`p-3.5 rounded-2xl border transition-all cursor-pointer space-y-2 ${
                        isActive
                          ? 'bg-purple-50/80 border-purple-500 shadow-md ring-1 ring-purple-400'
                          : 'bg-slate-50/60 border-slate-200 hover:bg-slate-100/80'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-bold text-bloom-dark truncate max-w-[200px]">{wf.name}</h4>
                        <Badge variant={wf.status === 'ACTIVE' ? 'success' : 'purple'} className="text-[9px]">
                          v{wf.version} &bull; {wf.status}
                        </Badge>
                      </div>

                      <p className="text-[11px] text-purple-900 font-medium bg-white/80 p-2 rounded-xl border border-slate-200 truncate">
                        "{wf.naturalTrigger}"
                      </p>

                      <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1">
                        <span>{wf.nodes.length} Nodes</span>
                        <span>{wf.edges.length} Edges</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </GlassCard>
          </div>

          {/* Right Workspace: Visual DAG Graph & Controls */}
          <div className="lg:col-span-8 space-y-6">
            {activeWorkflow ? (
              <>
                {/* Active Workflow Toolbar Header */}
                <GlassCard variant="white" className="space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-base font-bold text-bloom-dark">{activeWorkflow.name}</h2>
                        <Badge variant="purple" className="text-[10px]">Version {activeWorkflow.version}</Badge>
                      </div>
                      <p className="text-xs text-bloom-textMuted">{activeWorkflow.description}</p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <Button size="sm" variant="dark" className="bg-emerald-600 hover:bg-emerald-500 text-xs font-bold" onClick={handleRunWorkflow} icon={<Play className="w-3.5 h-3.5" />}>
                        Run Workflow
                      </Button>
                      <Button size="sm" variant="outline" className="text-xs" onClick={handleDryRunTest} icon={<Clock className="w-3.5 h-3.5 text-purple-600" />}>
                        Test Dry Run
                      </Button>
                      <Button size="sm" variant="outline" className="text-xs" onClick={copyWebhookUrl} icon={<Copy className="w-3.5 h-3.5 text-purple-600" />}>
                        Webhook URL
                      </Button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl">
                    <span>Trigger: <strong className="text-purple-700 font-mono">{activeWorkflow.trigger.type.toUpperCase()}</strong></span>
                    <span>Organization: <strong className="text-slate-800">{activeWorkflow.organizationId}</strong></span>
                    <span>Created By: <strong className="text-slate-800">{activeWorkflow.createdBy}</strong></span>
                  </div>
                </GlassCard>

                {/* Interactive Visual DAG Graph */}
                <VisualDAGGraph
                  workflow={activeWorkflow}
                  selectedNodeId={selectedNode?.id}
                  onSelectNode={(node) => setSelectedNode(node)}
                />

                {/* Live Execution Console (when an execution is active) */}
                {currentExecution && (
                  <ExecutionRunnerConsole
                    execution={currentExecution}
                    onRefresh={() => {
                      const updated = workflowStorage.getExecution(currentExecution.id);
                      if (updated) setCurrentExecution({ ...updated });
                    }}
                  />
                )}
              </>
            ) : (
              <GlassCard variant="white" className="p-12 text-center space-y-3">
                <GitFork className="w-12 h-12 text-purple-400 mx-auto" />
                <h3 className="text-base font-bold text-bloom-dark">No Workflow Selected</h3>
                <p className="text-xs text-bloom-textMuted">Describe a new workflow in natural language above to get started.</p>
              </GlassCard>
            )}
          </div>
        </div>
      </main>

      {/* Node Config Side Panel */}
      {selectedNode && (
        <NodeConfigPanel
          node={selectedNode}
          onSave={handleSaveNodeChanges}
          onClose={() => setSelectedNode(null)}
        />
      )}
    </div>
  );
}
