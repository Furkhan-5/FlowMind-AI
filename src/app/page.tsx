'use client';

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useAppStore } from '@/lib/store/useAppStore';
import { FuturisticNav } from '@/components/layout/FuturisticNav';
import { CustomCursor } from '@/components/ui/CustomCursor';
import { SmoothScrollProvider } from '@/components/ui/SmoothScrollProvider';
import { RobotAssistant } from '@/components/chat/RobotAssistant';
import { ChatInterface } from '@/components/chat/ChatInterface';
import { GlassCard } from '@/components/ui/GlassCard';
import { Badge } from '@/components/ui/Badge';
import { MOCK_AGENTS } from '@/lib/mockData';
import { UI_TRANSLATIONS, getLocalizedAgentName, getLocalizedAgentDomain } from '@/lib/i18n/translations';
import { BrandLogo } from '@/components/ui/BrandLogo';

import {
  ArrowRight,
  Cpu,
  Zap,
  Shield,
  Layers,
  GitFork,
  ChevronDown,
  Activity,
  CheckCircle2,
  Brain,
  Network,
  Workflow,
} from 'lucide-react';

import LoginPage from '@/app/login/page';

// Dynamic 3D WebGL Canvas Imports with SSR False
const SignatureIntro3D = dynamic(
  () => import('@/components/canvas/SignatureIntro3D').then((mod) => mod.SignatureIntro3D),
  { ssr: false }
);

const ContinuousFlowCanvas = dynamic(
  () => import('@/components/canvas/ContinuousFlowCanvas').then((mod) => mod.ContinuousFlowCanvas),
  { ssr: false }
);

const VoiceStudioHero = dynamic(
  () => import('@/components/studio/VoiceStudioHero').then((mod) => mod.VoiceStudioHero),
  { ssr: false }
);

export default function Home() {
  const { activeModule, setActiveModule, language, isAuthenticated, isAuthChecking } = useAppStore();

  const [showIntro, setShowIntro] = useState(true);
  const [activeSection, setActiveSection] = useState(0);

  const t = UI_TRANSLATIONS[language] || UI_TRANSLATIONS.en;

  // Track scroll position to update active 3D section trajectory (0 to 5)
  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      const windowHeight = window.innerHeight;
      const sectionIndex = Math.min(5, Math.floor((scrollY + windowHeight * 0.4) / windowHeight));
      setActiveSection(sectionIndex);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Redirect if unauthenticated
  if (!isAuthChecking && !isAuthenticated) {
    return <LoginPage />;
  }

  // Lock background body scroll when activeModule modal is open
  useEffect(() => {
    if (activeModule !== 'dashboard') {
      document.body.style.overflow = 'hidden';
      document.documentElement.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
    };
  }, [activeModule]);

  const handleNavigateSection = (index: number) => {
    setActiveSection(index);
    const targetY = index * window.innerHeight;
    window.scrollTo({ top: targetY, behavior: 'smooth' });
  };

  const renderModuleModal = () => {
    if (activeModule === 'dashboard') return null;

    return (
      <div
        data-lenis-prevent
        onWheel={(e) => e.stopPropagation()}
        onTouchMove={(e) => e.stopPropagation()}
        className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xl flex items-center justify-center p-4 sm:p-6 animate-fadeIn overscroll-contain"
      >
        <div
          data-lenis-prevent
          onWheel={(e) => e.stopPropagation()}
          className="bg-slate-900/95 text-white w-full max-w-5xl max-h-[85vh] rounded-[28px] border border-white/15 shadow-2xl flex flex-col overflow-hidden relative overscroll-contain"
        >
          <div className="p-4 bg-slate-950/90 border-b border-white/10 flex items-center justify-between shrink-0">
            <span className="text-xs font-bold text-purple-300 uppercase tracking-widest flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
              {t.activeWorkspace} ({activeModule.toUpperCase()})
            </span>
            <button
              onClick={() => setActiveModule('dashboard')}
              className="text-xs font-bold bg-white/10 hover:bg-white/20 text-white px-3.5 py-1.5 rounded-full transition-all border border-white/10"
            >
              {t.backToOverview}
            </button>
          </div>

          <div
            data-lenis-prevent
            onWheel={(e) => e.stopPropagation()}
            className="flex-1 overflow-y-auto custom-scrollbar p-6 overscroll-contain"
          >
            {activeModule === 'chat' && <ChatInterface />}

            {activeModule === 'workflows' && (
              <div className="space-y-6 text-center py-8">
                <div className="w-20 h-20 mx-auto rounded-3xl bg-gradient-to-tr from-purple-600 to-indigo-500 p-0.5 shadow-2xl shadow-purple-500/30">
                  <div className="w-full h-full bg-slate-950 rounded-[22px] flex items-center justify-center">
                    <GitFork className="w-10 h-10 text-cyan-400 animate-pulse" />
                  </div>
                </div>
                <div className="space-y-2 max-w-lg mx-auto">
                  <h3 className="text-2xl font-black text-white tracking-tight">Zero-Code Visual Workflow DAG Engine</h3>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Compile natural language prompts into executable Directed Acyclic Graphs (DAGs) verified via Kahn's Topological Sort algorithm with live execution tracing and retry policies.
                  </p>
                </div>

                <div className="pt-4 flex flex-wrap items-center justify-center gap-4">
                  <Link
                    href="/workflows"
                    onClick={() => setActiveModule('dashboard')}
                    className="px-8 py-3.5 rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-black text-xs tracking-widest shadow-xl transition-all hover:scale-105 inline-flex items-center gap-2"
                  >
                    <GitFork className="w-4 h-4 text-cyan-300" />
                    <span>OPEN VISUAL DAG WORKFLOW BUILDER</span>
                  </Link>
                </div>
              </div>
            )}

            {activeModule === 'agents' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {MOCK_AGENTS.map((agent) => (
                    <GlassCard key={agent.id} variant="dark" className="space-y-3 bg-slate-950/60 border-white/10">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="text-xs font-bold text-white tracking-wide">{getLocalizedAgentName(agent.id, language)}</h4>
                          <p className="text-[10px] text-cyan-300">{getLocalizedAgentDomain(agent.id, language)}</p>
                        </div>
                        <Badge variant={agent.status === 'ACTIVE' ? 'success' : 'default'}>
                          {agent.status}
                        </Badge>
                      </div>
                      <p className="text-xs text-slate-300 leading-relaxed">{agent.description}</p>
                      <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-white/10">
                        <span>Tasks Completed:</span>
                        <span className="font-bold text-cyan-400">{agent.tasksCompleted}</span>
                      </div>
                    </GlassCard>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <SmoothScrollProvider>
      <div className="min-h-screen bg-[#040209] text-white font-sans relative overflow-x-hidden select-none selection:bg-purple-600 selection:text-white">
        {/* Custom Interactive 3D Cursor */}
        <CustomCursor />

        {/* 1. Signature 3D Intro Experience (Hands Touch & FlowMind Reveal) */}
        {showIntro ? (
          <SignatureIntro3D onComplete={() => setShowIntro(false)} />
        ) : (
          <>
            {/* 2. Continuous Master 3D WebGL Canvas */}
            <ContinuousFlowCanvas activeSection={activeSection} />

            {/* 3. Futuristic Navigation Header */}
            <FuturisticNav
              onReplayIntro={() => setShowIntro(true)}
              activeSectionIndex={activeSection}
              onNavigateSection={handleNavigateSection}
            />

            {/* Main 3D Continuous Scroll Sections */}
            <main className="relative z-10">
              {/* HERO SECTION */}
              <section className="min-h-screen flex flex-col justify-center items-center px-6 text-center pt-24 pb-12 relative">
                <div className="max-w-4xl mx-auto space-y-6 animate-fadeIn">
                  {/* Minimal Pill Tag */}
                  <div className="inline-flex items-center justify-center px-6 py-2 rounded-full bg-slate-950/90 border border-purple-500/50 text-cyan-300 text-xs font-black tracking-wide backdrop-blur-xl shadow-[0_0_25px_rgba(168,85,247,0.3)]">
                    <span>Autonomous AI Business Operating System</span>
                  </div>

                  {/* Title & Subtitle */}
                  <h1 className="text-6xl sm:text-8xl lg:text-9xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-100 to-purple-200 drop-shadow-[0_0_45px_rgba(168,85,247,0.5)]">
                    FLOWMIND AI
                  </h1>

                  <h2 className="text-2xl sm:text-4xl font-black text-cyan-300 tracking-wider drop-shadow-[0_0_30px_rgba(56,189,248,0.7)]">
                    &ldquo;Intelligence that flows.&rdquo;
                  </h2>

                  {/* High-Contrast Visible Description Card */}
                  <div className="inline-block bg-slate-950/80 border border-white/20 rounded-full px-8 py-3.5 backdrop-blur-2xl shadow-[0_0_40px_rgba(0,0,0,0.9)]">
                    <p className="text-sm sm:text-base text-slate-100 font-bold max-w-xl mx-auto leading-relaxed tracking-wide">
                      Connect ideas, workflows, and intelligence into one continuous 3D autonomous system.
                    </p>
                  </div>

                  {/* Minimal High-Contrast Action CTA Buttons */}
                  <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
                    <button
                      type="button"
                      onClick={() => setActiveModule('agents')}
                      className="px-8 py-3.5 rounded-full bg-gradient-to-r from-purple-500 via-indigo-600 to-purple-600 hover:from-purple-400 hover:to-indigo-500 text-white font-black text-xs tracking-widest shadow-[0_0_30px_rgba(168,85,247,0.5)] transition-all hover:scale-105"
                    >
                      ENTER WORKSPACE
                    </button>

                    <Link
                      href="/workflows"
                      className="px-8 py-3.5 rounded-full bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-500 hover:to-purple-500 text-white font-black text-xs tracking-widest shadow-[0_0_30px_rgba(129,140,248,0.5)] transition-all hover:scale-105 inline-flex items-center gap-2"
                    >
                      <GitFork className="w-4 h-4 text-cyan-300" />
                      <span>DAG WORKFLOWS</span>
                    </Link>

                    <button
                      type="button"
                      onClick={() => handleNavigateSection(1)}
                      className="px-8 py-3.5 rounded-full bg-slate-950/90 hover:bg-slate-900 border-2 border-cyan-400 text-cyan-300 font-black text-xs tracking-widest backdrop-blur-xl shadow-[0_0_25px_rgba(56,189,248,0.4)] transition-all hover:scale-105"
                    >
                      EXPLORE 3D SYSTEM
                    </button>
                  </div>
                </div>

                {/* AI Text-to-Speech Studio Hero Card */}
                <div className="w-full max-w-5xl mt-12">
                  <VoiceStudioHero />
                </div>

                {/* Scroll Indicator */}
                <button
                  type="button"
                  onClick={() => handleNavigateSection(1)}
                  className="absolute bottom-6 flex flex-col items-center gap-1 text-xs font-black tracking-widest text-slate-200 hover:text-cyan-300 transition-colors drop-shadow-[0_2px_10px_rgba(0,0,0,0.9)]"
                >
                  <span>SCROLL TO EXPLORE</span>
                  <ChevronDown className="w-4 h-4 animate-bounce text-cyan-400" />
                </button>
              </section>

              {/* SECTION 01 — THINK */}
              <section className="min-h-screen flex items-center px-6 sm:px-12 py-16 relative">
                <div className="max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                  <div className="lg:col-span-6 space-y-4 bg-slate-950/40 p-8 rounded-[28px] border border-white/10 backdrop-blur-md shadow-2xl">
                    <div className="inline-flex items-center gap-2 text-xs font-mono font-bold text-purple-400 tracking-widest uppercase">
                      <Brain className="w-4 h-4 text-purple-400" />
                      <span>SECTION 01 — THINK</span>
                    </div>
                    <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
                      &ldquo;Think beyond the workflow.&rdquo;
                    </h2>
                    <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                      Transform raw business goals into self-executing intelligent processes. FlowMind AI synthesizes multi-agent thoughts before execution.
                    </p>
                    <div className="flex flex-wrap items-center gap-2 pt-2">
                      <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-purple-500/20 border border-purple-400/30 text-purple-300">
                        24 Neural Brain Nodes
                      </span>
                      <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-emerald-500/20 border border-emerald-400/30 text-emerald-300">
                        Real-Time Synthesis
                      </span>
                    </div>
                  </div>
                </div>
              </section>

              {/* SECTION 02 — CONNECT */}
              <section className="min-h-screen flex items-center px-6 sm:px-12 py-16 relative">
                <div className="max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                  <div className="lg:col-span-6 lg:col-start-7 space-y-4 bg-slate-950/40 p-8 rounded-[28px] border border-white/10 backdrop-blur-md shadow-2xl text-right">
                    <div className="inline-flex items-center justify-end gap-2 text-xs font-mono font-bold text-cyan-400 tracking-widest uppercase">
                      <span>SECTION 02 — CONNECT</span>
                      <Network className="w-4 h-4 text-cyan-400" />
                    </div>
                    <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
                      &ldquo;Everything connected.&rdquo;
                    </h2>
                    <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                      Data, Tools, People, AI, and Workflows linked in 3D spatial harmony. Zero silos, zero friction.
                    </p>
                    <div className="flex items-center justify-end gap-2 pt-2">
                      <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-cyan-500/20 border border-cyan-400/30 text-cyan-300">
                        OAuth2 & Enterprise SSO
                      </span>
                      <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-purple-500/20 border border-purple-400/30 text-purple-300">
                        Live API Mesh
                      </span>
                    </div>
                  </div>
                </div>
              </section>

              {/* SECTION 03 — AUTOMATE */}
              <section className="min-h-screen flex items-center px-6 sm:px-12 py-16 relative">
                <div className="max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                  <div className="lg:col-span-6 space-y-4 bg-slate-950/40 p-8 rounded-[28px] border border-white/10 backdrop-blur-md shadow-2xl">
                    <div className="inline-flex items-center gap-2 text-xs font-mono font-bold text-indigo-400 tracking-widest uppercase">
                      <Workflow className="w-4 h-4 text-indigo-400" />
                      <span>SECTION 03 — AUTOMATE</span>
                    </div>
                    <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
                      &ldquo;Let intelligence move work forward.&rdquo;
                    </h2>
                    <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                      5-stage pipeline automation: <span className="text-cyan-300 font-bold">Input ➔ Intelligence ➔ Decision ➔ Action ➔ Result</span>. Zero-code Natural Language to DAG workflow compilation.
                    </p>
                    <div className="flex flex-wrap items-center gap-3 pt-3">
                      <Link
                        href="/workflows"
                        className="px-6 py-3 rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-black text-xs tracking-widest shadow-xl transition-all hover:scale-105 inline-flex items-center gap-2"
                      >
                        <GitFork className="w-4 h-4 text-cyan-300" />
                        <span>LAUNCH DAG WORKFLOW BUILDER</span>
                      </Link>
                      <span className="px-3 py-1.5 rounded-full text-[11px] font-bold bg-emerald-500/20 border border-emerald-400/30 text-emerald-300">
                        Topological Kahn's DAG Runner
                      </span>
                    </div>
                  </div>
                </div>
              </section>

              {/* SECTION 04 — INTELLIGENCE */}
              <section className="min-h-screen flex items-center px-6 sm:px-12 py-16 relative text-center">
                <div className="max-w-3xl mx-auto w-full space-y-5 bg-slate-950/40 p-8 sm:p-12 rounded-[32px] border border-white/10 backdrop-blur-md shadow-2xl">
                  <div className="inline-flex items-center gap-2 text-xs font-mono font-bold text-purple-400 tracking-widest uppercase">
                    <span>SECTION 04 — INTELLIGENCE</span>
                  </div>
                  <h2 className="text-4xl sm:text-6xl font-black text-white tracking-tight">
                    &ldquo;One system. Infinite possibilities.&rdquo;
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-300 max-w-lg mx-auto leading-relaxed">
                    15 specialized domain agents operating concurrently across Finance, Sales, HR, Database, Marketing, and Security.
                  </p>
                  <div className="pt-2 flex items-center justify-center gap-3">
                    <button
                      type="button"
                      onClick={() => setActiveModule('agents')}
                      className="px-6 py-2.5 rounded-full bg-white text-slate-950 font-bold text-xs shadow-lg transition-all hover:bg-slate-200"
                    >
                      Inspect 15 Domain Agents
                    </button>
                    <Link
                      href="/workflows"
                      className="px-6 py-2.5 rounded-full bg-purple-600/80 hover:bg-purple-600 border border-purple-400/40 text-white font-bold text-xs shadow-lg transition-all inline-flex items-center gap-1.5"
                    >
                      <GitFork className="w-3.5 h-3.5 text-cyan-300" />
                      <span>Visual DAG Builder</span>
                    </Link>
                  </div>
                </div>
              </section>

              {/* SECTION 05 — FLOW (CLIMAX CONVERGENCE) */}
              <section className="min-h-screen flex flex-col justify-center items-center px-6 text-center py-20 relative">
                <div className="max-w-4xl mx-auto space-y-6 bg-slate-950/50 p-10 sm:p-14 rounded-[36px] border border-white/10 backdrop-blur-xl shadow-2xl">
                  <span className="text-xs font-mono font-bold text-cyan-400 tracking-widest uppercase">
                    SECTION 05 — CONVERGENCE
                  </span>
                  <h2 className="text-5xl sm:text-7xl lg:text-8xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-white via-cyan-200 to-purple-300">
                    LET INTELLIGENCE FLOW.
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-300 max-w-lg mx-auto leading-relaxed">
                    Experience the unified AI Business Operating System. Everything connected, everything flowing in 3D spatial harmony.
                  </p>
                  <div className="pt-4 flex flex-wrap items-center justify-center gap-4">
                    <button
                      type="button"
                      onClick={() => setActiveModule('agents')}
                      className="px-10 py-4 rounded-full bg-gradient-to-r from-cyan-400 via-purple-500 to-indigo-500 text-slate-950 font-black text-xs tracking-widest shadow-2xl transition-all hover:scale-105"
                    >
                      LAUNCH FLOWMIND SYSTEM
                    </button>
                    <Link
                      href="/workflows"
                      className="px-8 py-4 rounded-full bg-slate-900 border border-purple-500/50 hover:bg-slate-800 text-purple-200 font-black text-xs tracking-widest shadow-2xl transition-all hover:scale-105 inline-flex items-center gap-2"
                    >
                      <GitFork className="w-4 h-4 text-cyan-400" />
                      <span>BUILD DAG WORKFLOW</span>
                    </Link>
                  </div>
                </div>
              </section>
            </main>

            {/* Minimal Footer */}
            <footer className="relative z-10 py-10 border-t border-white/10 bg-slate-950/80 backdrop-blur-md text-center space-y-2">
              <div className="flex items-center justify-center">
                <BrandLogo size="sm" showText={true} />
              </div>
              <p className="text-[11px] font-semibold text-cyan-400 tracking-widest uppercase">
                &ldquo;Intelligence that flows.&rdquo;
              </p>
              <p className="text-[10px] text-slate-500">
                © 2026 FlowMind AI Inc. All rights reserved. • ISO 27001 Certified Enterprise System
              </p>
            </footer>

            {/* Floating AI Robot Assistant Widget */}
            <RobotAssistant />

            {/* Module Overlays */}
            {renderModuleModal()}
          </>
        )}
      </div>
    </SmoothScrollProvider>
  );
}
