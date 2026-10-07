'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useAppStore } from '@/lib/store/useAppStore';
import { Navbar } from '@/components/layout/Navbar';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { MOCK_AGENTS, MOCK_LEADS, MOCK_INVOICES } from '@/lib/mockData';
import { UI_TRANSLATIONS, getLocalizedAgentName, getLocalizedAgentDomain } from '@/lib/i18n/translations';
import { RobotAssistant } from '@/components/chat/RobotAssistant';
import { ChatInterface } from '@/components/chat/ChatInterface';
import LoginPage from '@/app/login/page';
import {
  ArrowRight,
  GitFork,
  Sparkles,
  Box,
  FileSpreadsheet,
  BookOpen,
  Users,
  Bot,
  Database,
  BarChart3,
  Search,
  CheckCircle2,
  FileText,
  DollarSign,
  ShieldCheck,
} from 'lucide-react';

const Hero3DCanvas = dynamic(
  () => import('@/components/canvas/Hero3DCanvas').then((mod) => mod.Hero3DCanvas),
  { ssr: false }
);

const AgentMesh3D = dynamic(
  () => import('@/components/canvas/AgentMesh3D').then((mod) => mod.AgentMesh3D),
  { ssr: false }
);

export default function DashboardPage() {
  const { activeModule, setActiveModule, language, isAuthenticated, isAuthChecking } = useAppStore();

  const t = UI_TRANSLATIONS[language] || UI_TRANSLATIONS.en;

  if (!isAuthChecking && !isAuthenticated) {
    return <LoginPage />;
  }

  const renderModuleModal = () => {
    if (activeModule === 'dashboard') return null;

    return (
      <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 animate-fadeIn">
        <div className="bg-white text-bloom-textDark w-full max-w-5xl max-h-[85vh] rounded-[28px] border border-slate-200 shadow-2xl flex flex-col overflow-hidden relative">
          <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between shrink-0">
            <span className="text-xs font-bold text-purple-700 uppercase tracking-wider flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              {t.activeWorkspace} ({activeModule.toUpperCase()})
            </span>
            <button
              onClick={() => setActiveModule('dashboard')}
              className="text-xs font-bold bg-slate-200 hover:bg-slate-300 text-slate-700 px-3.5 py-1.5 rounded-full transition-all"
            >
              {t.backToOverview}
            </button>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
            {activeModule === 'chat' && <ChatInterface />}

            {activeModule === 'workflows' && (
              <div className="space-y-6 text-center py-8">
                <GitFork className="w-16 h-16 text-purple-600 mx-auto animate-bounce" />
                <h3 className="text-2xl font-bold text-bloom-dark">Visual Workflow DAG Automation Engine</h3>
                <p className="text-xs text-bloom-textMuted max-w-xl mx-auto leading-relaxed">
                  Compile natural language prompts into executable Directed Acyclic Graphs (DAGs) verified via Kahn's Topological Sort algorithm with live execution tracing and retry policies.
                </p>
                <div className="pt-4 flex items-center justify-center gap-4">
                  <Link
                    href="/workflows"
                    onClick={() => setActiveModule('dashboard')}
                    className="px-8 py-3.5 rounded-full bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs tracking-wider shadow-xl transition-all hover:scale-105 inline-flex items-center gap-2"
                  >
                    <GitFork className="w-4 h-4" />
                    <span>OPEN VISUAL DAG WORKFLOW BUILDER</span>
                  </Link>
                </div>
              </div>
            )}

            {activeModule === 'agents' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {MOCK_AGENTS.map((agent) => (
                    <GlassCard key={agent.id} variant="white" className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="text-xs font-bold text-bloom-dark tracking-wide">{getLocalizedAgentName(agent.id, language)}</h4>
                          <p className="text-[10px] text-purple-600">{getLocalizedAgentDomain(agent.id, language)}</p>
                        </div>
                        <Badge variant={agent.status === 'ACTIVE' ? 'success' : 'default'}>
                          {agent.status}
                        </Badge>
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed">{agent.description}</p>
                      <div className="flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-100">
                        <span>Tasks Completed:</span>
                        <span className="font-bold text-purple-700">{agent.tasksCompleted}</span>
                      </div>
                    </GlassCard>
                  ))}
                </div>
              </div>
            )}

            {activeModule === 'data-analyst' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <h3 className="text-lg font-bold text-bloom-dark flex items-center gap-2">
                      <FileSpreadsheet className="w-5 h-5 text-purple-600" />
                      AI Data Studio & Automated Analytics
                    </h3>
                    <p className="text-xs text-slate-500">Auto-clean CSV datasets, impute missing values, and generate recommended chart visualizers.</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="purple">Future Module — Interactive Preview</Badge>
                  </div>
                </div>

                <div className="bg-purple-50 border border-purple-200 rounded-xl p-3 text-xs text-purple-900 font-medium">
                  💡 <strong>Planned Architecture Note:</strong> AI Data Studio is queued as a future phase release. The full interactive dataset cleaner and chart visualizer UI are pre-wired.
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <GlassCard variant="white" className="space-y-2 text-center p-6">
                    <BarChart3 className="w-8 h-8 text-purple-600 mx-auto" />
                    <h4 className="text-xs font-bold text-bloom-dark">Chart Recommendation</h4>
                    <p className="text-[11px] text-slate-500">Auto-selects optimal bar, line, and pie charts based on dataset metrics.</p>
                  </GlassCard>
                  <GlassCard variant="white" className="space-y-2 text-center p-6">
                    <Database className="w-8 h-8 text-emerald-600 mx-auto" />
                    <h4 className="text-xs font-bold text-bloom-dark">Dataset Auto-Cleaner</h4>
                    <p className="text-[11px] text-slate-500">Detects null rows, removes z-score outliers, and standardizes column schemas.</p>
                  </GlassCard>
                  <GlassCard variant="white" className="space-y-2 text-center p-6">
                    <FileText className="w-8 h-8 text-indigo-600 mx-auto" />
                    <h4 className="text-xs font-bold text-bloom-dark">Executive PDF Summarizer</h4>
                    <p className="text-[11px] text-slate-500">Generates downloadable executive performance digests in PDF/CSV format.</p>
                  </GlassCard>
                </div>
              </div>
            )}

            {activeModule === 'knowledge' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <h3 className="text-lg font-bold text-bloom-dark flex items-center gap-2">
                      <BookOpen className="w-5 h-5 text-purple-600" />
                      RAG Knowledge Hub & Vector Q&A Engine
                    </h3>
                    <p className="text-xs text-slate-500">Indexed corporate documentation with vector similarity search for exact agent context retrieval.</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="success">Future Module — Interactive Preview</Badge>
                  </div>
                </div>

                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-xs text-emerald-900 font-medium">
                  💡 <strong>Planned Architecture Note:</strong> RAG Knowledge Hub is queued as a future phase release. Vector indexing structures and retrieval query pipes are pre-wired.
                </div>

                <div className="p-4 bg-slate-900 text-white rounded-2xl space-y-3">
                  <div className="flex items-center gap-2 text-xs font-semibold text-purple-300">
                    <Search className="w-4 h-4 text-purple-400" />
                    Query Corporate Vector Embeddings:
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="e.g. What is our refund policy for enterprise quarterly contracts?"
                      className="flex-1 bg-slate-800 border border-purple-500/40 rounded-xl px-4 py-2 text-xs text-white placeholder-slate-400 focus:outline-none"
                    />
                    <Button variant="dark" size="sm" className="bg-purple-600 hover:bg-purple-500 text-white font-bold">
                      Query Knowledge Base
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {activeModule === 'crm' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <h3 className="text-lg font-bold text-bloom-dark flex items-center gap-2">
                      <Users className="w-5 h-5 text-purple-600" />
                      CRM & Enterprise Business Operations Suite
                    </h3>
                    <p className="text-xs text-slate-500">Manage leads, monitor pipeline status, and track GST tax invoicing.</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Link
                      href="/modules"
                      onClick={() => setActiveModule('dashboard')}
                      className="px-4 py-1.5 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold rounded-full shadow-md transition-all flex items-center gap-1"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>LAUNCH FULL SUITE (/modules)</span>
                    </Link>
                  </div>
                </div>

                <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-3 text-xs text-indigo-900 font-medium">
                  💡 <strong>Planned Architecture Note:</strong> CRM & Business Suite is queued as a future phase release. Lead tables and invoice download generators are pre-wired.
                </div>

                <GlassCard variant="white" className="p-0 overflow-hidden space-y-3">
                  <div className="p-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                    <h4 className="text-xs font-bold text-bloom-dark uppercase tracking-wider">Active Enterprise Pipeline Leads</h4>
                    <span className="text-[11px] font-semibold text-emerald-600">Total Value: ₹5,50,000</span>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-slate-100 text-slate-700 font-bold uppercase text-[10px]">
                        <tr>
                          <th className="p-3">{t.leadId}</th>
                          <th className="p-3">{t.name}</th>
                          <th className="p-3">{t.company}</th>
                          <th className="p-3">{t.value}</th>
                          <th className="p-3">{t.status}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {MOCK_LEADS.map((lead) => (
                          <tr key={lead.id} className="border-b border-slate-100 hover:bg-slate-50">
                            <td className="p-3 font-mono text-purple-700 font-semibold">{lead.id}</td>
                            <td className="p-3 font-semibold text-bloom-dark">{lead.name}</td>
                            <td className="p-3 text-slate-600">{lead.company}</td>
                            <td className="p-3 font-bold text-emerald-600">₹{lead.value.toLocaleString()}</td>
                            <td className="p-3"><Badge variant="purple">{lead.status}</Badge></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </GlassCard>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-bloom-bg text-bloom-textDark font-sans selection:bg-purple-200 relative">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-8 py-6 space-y-8 pb-24">
        {/* Header Ribbon for 3D View Switching */}
        <div className="flex items-center justify-between bg-slate-900 text-white rounded-2xl px-6 py-3 shadow-xl">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-cyan-400" />
            <span className="text-xs font-bold text-slate-200">Executive Operating System Dashboard</span>
          </div>
          <Link
            href="/"
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold shadow-md transition-all hover:scale-105"
          >
            <Box className="w-3.5 h-3.5 text-cyan-300" />
            <span>3D Spatial View</span>
          </Link>
        </div>

        {/* TOP SECTION: Quick Enterprise Workspaces Cards Bar */}
        <section className="bg-white border border-slate-200/80 rounded-[32px] p-6 shadow-bloom space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="space-y-0.5">
              <span className="text-[10px] font-bold text-purple-600 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" /> Enterprise Platform Hub
              </span>
              <h2 className="text-lg font-extrabold text-bloom-dark tracking-tight">
                Primary Operational Workspaces
              </h2>
            </div>
            <Badge variant="purple">15 AGENTS CONCURRENT</Badge>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* AI Data Studio Card */}
            <div
              onClick={() => setActiveModule('data-analyst')}
              className="p-4 rounded-2xl border border-purple-200/80 bg-purple-50/50 hover:bg-purple-50 hover:border-purple-400 transition-all cursor-pointer space-y-2 group shadow-sm"
            >
              <div className="flex items-center justify-between">
                <div className="w-9 h-9 rounded-xl bg-purple-600 text-white flex items-center justify-center shadow-md">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <Badge variant="purple">Analytics</Badge>
              </div>
              <div>
                <h3 className="text-sm font-bold text-bloom-dark group-hover:text-purple-700 transition-colors">
                  AI Data Studio
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Dataset auto-cleaner, z-score outlier removal, and automated chart visualizers.
                </p>
              </div>
            </div>

            {/* RAG Knowledge Hub Card */}
            <div
              onClick={() => setActiveModule('knowledge')}
              className="p-4 rounded-2xl border border-emerald-200/80 bg-emerald-50/50 hover:bg-emerald-50 hover:border-emerald-400 transition-all cursor-pointer space-y-2 group shadow-sm"
            >
              <div className="flex items-center justify-between">
                <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-md">
                  <BookOpen className="w-5 h-5" />
                </div>
                <Badge variant="success">Vector RAG</Badge>
              </div>
              <div>
                <h3 className="text-sm font-bold text-bloom-dark group-hover:text-emerald-700 transition-colors">
                  RAG Knowledge Hub
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Indexed document memory with vector similarity search context retrieval.
                </p>
              </div>
            </div>

            {/* CRM & Business Suite Card */}
            <div
              onClick={() => setActiveModule('crm')}
              className="p-4 rounded-2xl border border-blue-200/80 bg-blue-50/50 hover:bg-blue-50 hover:border-blue-400 transition-all cursor-pointer space-y-2 group shadow-sm"
            >
              <div className="flex items-center justify-between">
                <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md">
                  <Users className="w-5 h-5" />
                </div>
                <Badge variant="purple">Business Suite</Badge>
              </div>
              <div>
                <h3 className="text-sm font-bold text-bloom-dark group-hover:text-blue-700 transition-colors">
                  CRM & Business Suite
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Pipeline leads, GST billing ledger, employee onboarding, and HR management.
                </p>
              </div>
            </div>

            {/* AI Workflows DAG Card */}
            <Link
              href="/workflows"
              className="p-4 rounded-2xl border border-indigo-200/80 bg-indigo-50/50 hover:bg-indigo-50 hover:border-indigo-400 transition-all cursor-pointer space-y-2 group shadow-sm"
            >
              <div className="flex items-center justify-between">
                <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-md">
                  <GitFork className="w-5 h-5" />
                </div>
                <Badge variant="purple">Topological DAG</Badge>
              </div>
              <div>
                <h3 className="text-sm font-bold text-bloom-dark group-hover:text-indigo-700 transition-colors">
                  AI Workflows DAG
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Zero-code natural language to topological Kahn's DAG execution engine.
                </p>
              </div>
            </Link>

            {/* 15 Active Agents Mesh Card */}
            <div
              onClick={() => setActiveModule('agents')}
              className="p-4 rounded-2xl border border-amber-200/80 bg-amber-50/50 hover:bg-amber-50 hover:border-amber-400 transition-all cursor-pointer space-y-2 group shadow-sm"
            >
              <div className="flex items-center justify-between">
                <div className="w-9 h-9 rounded-xl bg-amber-600 text-white flex items-center justify-center shadow-md">
                  <Bot className="w-5 h-5" />
                </div>
                <Badge variant="purple">15 Agents</Badge>
              </div>
              <div>
                <h3 className="text-sm font-bold text-bloom-dark group-hover:text-amber-700 transition-colors">
                  15 Active Agents Mesh
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Concurrently active domain agents coordinated by Master CEO Orchestrator.
                </p>
              </div>
            </div>

            {/* Layman Conversational Chat MVP Card */}
            <div
              onClick={() => setActiveModule('chat')}
              className="p-4 rounded-2xl border border-pink-200/80 bg-pink-50/50 hover:bg-pink-50 hover:border-pink-400 transition-all cursor-pointer space-y-2 group shadow-sm"
            >
              <div className="flex items-center justify-between">
                <div className="w-9 h-9 rounded-xl bg-pink-600 text-white flex items-center justify-center shadow-md">
                  <Sparkles className="w-5 h-5" />
                </div>
                <Badge variant="success">Layman Chat</Badge>
              </div>
              <div>
                <h3 className="text-sm font-bold text-bloom-dark group-hover:text-pink-700 transition-colors">
                  Layman Conversational MVP
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Multilingual Indic chatbot with Web Speech STT/TTS and HITL Action Cards.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Hero Section */}
        <section className="bg-white border border-slate-200/80 rounded-[32px] p-6 sm:p-10 shadow-bloom space-y-8 relative overflow-hidden">
          <div className="text-center max-w-3xl mx-auto space-y-4">
            <div className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-slate-100 border border-slate-200 text-bloom-dark font-bold text-sm shadow-sm">
              +
            </div>
            <h1 className="text-3xl sm:text-5xl font-extrabold text-bloom-dark tracking-tight leading-tight">
              {t.heroTitle}
            </h1>
            <p className="text-xs sm:text-sm text-bloom-textMuted max-w-xl mx-auto leading-relaxed">
              {t.heroSubtitle}
            </p>
            <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
              <Button
                variant="dark"
                size="lg"
                onClick={() => setActiveModule('agents')}
                icon={<ArrowRight className="w-4 h-4" />}
              >
                {t.exploreAgents}
              </Button>

              <Link
                href="/workflows"
                className="px-6 py-3 rounded-full bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs tracking-wider shadow-lg transition-all inline-flex items-center gap-2"
              >
                <GitFork className="w-4 h-4" />
                <span>Visual DAG Workflows</span>
              </Link>
            </div>
          </div>

          <Hero3DCanvas />
        </section>

        {/* Feature Section */}
        <section className="space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-3 max-w-md">
              <h2 className="text-2xl sm:text-4xl font-extrabold text-bloom-dark tracking-tight">
                {t.whatIsFlowMind}
              </h2>
              <Button
                variant="dark"
                size="sm"
                onClick={() => setActiveModule('agents')}
              >
                {t.exploreNow}
              </Button>
            </div>
            <p className="text-xs sm:text-sm text-bloom-textMuted max-w-md leading-relaxed font-medium">
              {t.flowmindDesc}
            </p>
          </div>

          {/* Feature Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            <GlassCard variant="lavender" className="md:col-span-6 flex flex-col justify-between min-h-[220px]">
              <div className="space-y-2">
                <h3 className="text-lg font-bold text-bloom-dark">{t.intelligenceTitle}</h3>
                <p className="text-xs text-slate-600 max-w-xs leading-relaxed">
                  {t.intelligenceDesc}
                </p>
              </div>
              <div className="flex items-center gap-2 pt-4">
                <Badge variant="purple">{t.agentsActiveTag}</Badge>
                <Badge variant="default">{t.indicScriptsTag}</Badge>
              </div>
            </GlassCard>

            <GlassCard variant="dark" className="md:col-span-3 flex flex-col justify-between min-h-[220px]">
              <div className="space-y-2">
                <h3 className="text-base font-bold text-white">{t.alwaysActiveTitle}</h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {t.alwaysActiveDesc}
                </p>
              </div>
              <div className="pt-4">
                <span className="text-[10px] text-purple-300 font-semibold uppercase tracking-wider">
                  {t.uptimeTag}
                </span>
              </div>
            </GlassCard>

            <GlassCard variant="dark" className="md:col-span-3 flex flex-col justify-between min-h-[220px]">
              <div className="space-y-2">
                <h3 className="text-base font-bold text-white">{t.handsFreeTitle}</h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {t.handsFreeDesc}
                </p>
              </div>
              <div className="pt-4">
                <span className="text-[10px] text-emerald-400 font-semibold uppercase tracking-wider">
                  {t.anomalyTag}
                </span>
              </div>
            </GlassCard>
          </div>
        </section>

        {/* Enterprise Logo Ribbon */}
        <section className="py-4 border-y border-slate-200/80">
          <div className="flex flex-wrap items-center justify-between gap-6 text-xs font-semibold text-slate-400">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              {t.backedBy}
            </span>
            <span className="hover:text-slate-700 transition-colors">Google Workspace</span>
            <span className="hover:text-slate-700 transition-colors">Slack</span>
            <span className="hover:text-slate-700 transition-colors">Stripe</span>
            <span className="hover:text-slate-700 transition-colors">Razorpay</span>
            <span className="hover:text-slate-700 transition-colors">GitHub</span>
            <span className="hover:text-slate-700 transition-colors">AWS</span>
            <span className="hover:text-slate-700 transition-colors">Microsoft 365</span>
          </div>
        </section>

        {/* Use Cases Section */}
        <section className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
          <div className="md:col-span-5 space-y-4">
            <span className="text-[11px] font-bold text-purple-600 uppercase tracking-wider">
              {t.useCasesLabel}
            </span>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-bloom-dark tracking-tight">
              {t.useCasesTitle}
            </h2>
            <p className="text-xs sm:text-sm text-bloom-textMuted leading-relaxed">
              {t.useCasesDesc}
            </p>
          </div>

          <GlassCard variant="white" className="md:col-span-7 space-y-6">
            <div className="space-y-2">
              <h3 className="text-xl font-bold text-bloom-dark">{t.businessTitle}</h3>
              <p className="text-xs text-bloom-textMuted max-w-lg leading-relaxed">
                {t.businessDesc}
              </p>
              <button
                onClick={() => setActiveModule('agents')}
                className="inline-flex items-center gap-2 text-xs font-bold text-purple-700 hover:text-purple-900 pt-2 transition-colors"
              >
                <span>{t.learnMore}</span>
              </button>
            </div>

            <AgentMesh3D />
          </GlassCard>
        </section>
      </main>

      {/* Floating Robot Assistant Widget */}
      <RobotAssistant />

      {/* Render Active Tool Modal overlay when selected */}
      {renderModuleModal()}
    </div>
  );
}
