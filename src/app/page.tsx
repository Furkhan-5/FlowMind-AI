'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import { useAppStore } from '@/lib/store/useAppStore';
import { UI_TRANSLATIONS, getLocalizedAgentName, getLocalizedAgentDomain } from '@/lib/i18n/translations';
import { Navbar } from '@/components/layout/Navbar';
import { RobotAssistant } from '@/components/chat/RobotAssistant';
import { ChatInterface } from '@/components/chat/ChatInterface';
import { GlassCard } from '@/components/ui/GlassCard';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { MOCK_AGENTS, MOCK_LEADS } from '@/lib/mockData';
import {
  Sparkles,
  ArrowRight,
  GitFork,
  FileSpreadsheet,
  CheckCircle2,
} from 'lucide-react';

import { AgentLogo } from '@/components/ui/AgentLogo';

// Dynamic import with SSR false for Three.js WebGL Canvases to prevent server-side WebGL errors
const Hero3DCanvas = dynamic(
  () => import('@/components/canvas/Hero3DCanvas').then((mod) => mod.Hero3DCanvas),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-72 sm:h-96 rounded-3xl bg-purple-100/40 border border-purple-200/50 animate-pulse flex items-center justify-center text-xs font-bold text-purple-600">
        Loading 3D Canvas...
      </div>
    ),
  }
);

const AgentMesh3D = dynamic(
  () => import('@/components/canvas/AgentMesh3D').then((mod) => mod.AgentMesh3D),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-64 rounded-3xl bg-purple-100/40 border border-purple-200/50 animate-pulse flex items-center justify-center text-xs font-bold text-purple-600">
        Loading 3D Canvas...
      </div>
    ),
  }
);

export default function Home() {
  const { activeModule, setActiveModule, language } = useAppStore();
  const t = UI_TRANSLATIONS[language] || UI_TRANSLATIONS.en;

  const renderModuleModal = () => {
    if (activeModule === 'dashboard') return null;

    return (
      <div className="fixed inset-0 z-50 bg-bloom-dark/40 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 animate-fadeIn">
        <div className="bg-bloom-bg w-full max-w-5xl max-h-[90vh] rounded-[32px] border border-slate-200 shadow-bloom-lg flex flex-col overflow-hidden relative">
          <div className="p-4 bg-white border-b border-slate-200 flex items-center justify-between">
            <span className="text-xs font-bold text-bloom-dark uppercase tracking-wider flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-purple-600 animate-ping" />
              {t.activeWorkspace} ({activeModule.toUpperCase()})
            </span>
            <button
              onClick={() => setActiveModule('dashboard')}
              className="text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1 rounded-full transition-colors"
            >
              {t.backToOverview}
            </button>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar">
            {activeModule === 'chat' && <ChatInterface />}

            {activeModule === 'agents' && (
              <div className="p-6 space-y-6">
                <AgentMesh3D />
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {MOCK_AGENTS.map((agent) => (
                    <GlassCard key={agent.id} variant="white" className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <AgentLogo agentId={agent.id} size="md" glow />
                          <div>
                            <h4 className="text-xs font-bold text-bloom-dark">{getLocalizedAgentName(agent.id, language)}</h4>
                            <p className="text-[10px] text-bloom-textMuted">{getLocalizedAgentDomain(agent.id, language)}</p>
                          </div>
                        </div>
                        <Badge variant={agent.status === 'ACTIVE' ? 'success' : 'default'}>
                          {agent.status}
                        </Badge>
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed">{agent.description}</p>
                      <div className="flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-100">
                        <span>Tasks Completed:</span>
                        <span className="font-bold text-purple-600">{agent.tasksCompleted}</span>
                      </div>
                    </GlassCard>
                  ))}
                </div>
              </div>
            )}

            {activeModule === 'workflows' && (
              <div className="p-6 space-y-6">
                <GlassCard variant="white" className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-bold text-bloom-dark flex items-center gap-2">
                        <GitFork className="w-4 h-4 text-purple-600" />
                        {t.workflowEngineTitle}
                      </h3>
                      <p className="text-xs text-bloom-textMuted">{t.workflowEngineDesc}</p>
                    </div>
                    <Button size="sm" variant="dark" icon={<Sparkles className="w-3.5 h-3.5" />}>
                      {t.buildWorkflowBtn}
                    </Button>
                  </div>

                  {useAppStore.getState().workflows.map((wf) => (
                    <div key={wf.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-bold text-bloom-dark">{wf.name}</h4>
                        <div className="flex items-center gap-2">
                          <Badge variant="success">{t.successRate}: {wf.successRate}%</Badge>
                          <span className="text-[10px] text-slate-400">{t.lastRun}: {wf.lastRun}</span>
                        </div>
                      </div>
                      <p className="text-xs text-purple-900 font-medium bg-purple-100/60 p-3 rounded-xl border border-purple-200/60">
                        "{wf.naturalTrigger}"
                      </p>
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-2 pt-1">
                        {wf.nodes.map((node) => (
                          <div key={node.id} className="p-3 rounded-xl bg-white border border-slate-200 text-xs space-y-1 shadow-sm">
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] font-bold text-purple-700">{node.type}</span>
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                            </div>
                            <p className="text-bloom-dark font-medium text-[11px]">{node.label}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </GlassCard>
              </div>
            )}

            {activeModule === 'data-analyst' && (
              <div className="p-6 space-y-6">
                <GlassCard variant="white" className="space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div>
                      <h3 className="text-sm font-bold text-bloom-dark flex items-center gap-2">
                        <FileSpreadsheet className="w-4 h-4 text-purple-600" />
                        {t.dataStudioTitle}
                      </h3>
                      <p className="text-xs text-bloom-textMuted">{t.dataStudioDesc}</p>
                    </div>
                    <Button size="sm" variant="outline">
                      {t.uploadCsvPdf}
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 rounded-2xl bg-purple-50/50 border border-purple-100 space-y-2">
                      <h4 className="text-xs font-bold text-purple-950">{t.schemaAutoDiscovery}</h4>
                      <p className="text-[11px] text-purple-700">{t.schemaDesc}</p>
                    </div>
                    <div className="p-4 rounded-2xl bg-purple-50/50 border border-purple-100 space-y-2">
                      <h4 className="text-xs font-bold text-purple-950">{t.zScoreCleaned}</h4>
                      <p className="text-[11px] text-purple-700">{t.zScoreDesc}</p>
                    </div>
                    <div className="p-4 rounded-2xl bg-purple-50/50 border border-purple-100 space-y-2">
                      <h4 className="text-xs font-bold text-purple-950">{t.recommendedChart}</h4>
                      <p className="text-[11px] text-purple-700">{t.recommendedChartDesc}</p>
                    </div>
                  </div>
                </GlassCard>
              </div>
            )}

            {activeModule === 'crm' && (
              <div className="p-6 space-y-6">
                <GlassCard variant="white" className="space-y-4">
                  <h3 className="text-sm font-bold text-bloom-dark">{t.crmLeads}</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
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

      <main className="max-w-7xl mx-auto px-4 sm:px-8 py-6 space-y-12 pb-24">
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
            <div className="pt-2">
              <Button
                variant="dark"
                size="lg"
                onClick={() => setActiveModule('agents')}
                icon={<ArrowRight className="w-4 h-4" />}
              >
                {t.exploreAgents}
              </Button>
            </div>
          </div>

          {/* 3D Botanical Banner dynamically loaded client-side */}
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
