'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useAppStore } from '@/lib/store/useAppStore';
import { Navbar } from '@/components/layout/Navbar';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { MOCK_AGENTS, MOCK_LEADS } from '@/lib/mockData';
import { UI_TRANSLATIONS, getLocalizedAgentName, getLocalizedAgentDomain } from '@/lib/i18n/translations';
import { RobotAssistant } from '@/components/chat/RobotAssistant';
import { ChatInterface } from '@/components/chat/ChatInterface';
import LoginPage from '@/app/login/page';
import { ArrowRight, GitFork, Sparkles, Box } from 'lucide-react';

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

            {activeModule === 'crm' && (
              <div className="space-y-4">
                <h3 className="text-base font-bold text-bloom-dark">{t.crmAndLeads}</h3>
                <GlassCard variant="white" className="p-0 overflow-hidden">
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

      <main className="max-w-7xl mx-auto px-4 sm:px-8 py-6 space-y-12 pb-24">
        {/* Header Ribbon for 3D View Switching */}
        <div className="flex items-center justify-between bg-slate-900 text-white rounded-2xl px-6 py-3 shadow-xl">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-cyan-400" />
            <span className="text-xs font-bold text-slate-200">Classic Operating System Dashboard</span>
          </div>
          <Link
            href="/"
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold shadow-md transition-all hover:scale-105"
          >
            <Box className="w-3.5 h-3.5 text-cyan-300" />
            <span>3D Spatial View</span>
          </Link>
        </div>

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
