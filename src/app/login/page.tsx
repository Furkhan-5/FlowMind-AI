'use client';

import React from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { useAppStore } from '@/lib/store/useAppStore';
import { LoginForm } from '@/components/auth/LoginForm';
import { ArrowLeft, Sparkles, Shield, Cpu, Zap, CheckCircle2 } from 'lucide-react';
import { SUPPORTED_LANGUAGES } from '@/lib/i18n/translations';
import { LanguageCode } from '@/types';

// Dynamic import with SSR false for 3D Hero canvas if available
const Hero3DCanvas = dynamic(
  () => import('@/components/canvas/Hero3DCanvas').then((mod) => mod.Hero3DCanvas),
  {
    ssr: false,
    loading: () => null,
  }
);

export default function LoginPage() {
  const { isAuthenticated, user, logout, language, setLanguage } = useAppStore();

  return (
    <div className="min-h-screen bg-bloom-bg text-bloom-dark relative flex flex-col justify-between overflow-hidden selection:bg-purple-500 selection:text-white">
      {/* Background Decorative Ambient Glows */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-purple-300/30 rounded-full blur-[120px] pointer-events-none animate-pulse" />
      <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-indigo-300/30 rounded-full blur-[140px] pointer-events-none" />

      {/* Top Navigation Bar */}
      <header className="relative z-20 px-6 py-5 max-w-7xl mx-auto w-full flex items-center justify-between">
        <Link
          href="/"
          className="flex items-center gap-2 font-bold text-bloom-dark text-base tracking-tight hover:opacity-80 transition-opacity"
        >
          <span className="w-7 h-7 rounded-full bg-bloom-dark text-white flex items-center justify-center text-xs font-black shadow-bloom">
            +
          </span>
          <span className="text-lg font-black tracking-tight">FlowMind AI</span>
        </Link>

        <div className="flex items-center gap-4">
          {/* Language Selector */}
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value as LanguageCode)}
            className="bg-white/80 hover:bg-white border border-slate-200 text-slate-700 text-xs font-semibold rounded-full px-3 py-1.5 appearance-none cursor-pointer shadow-sm focus:outline-none transition-colors"
          >
            {SUPPORTED_LANGUAGES.map((lang) => (
              <option key={lang.code} value={lang.code}>
                {lang.flag} {lang.nativeName}
              </option>
            ))}
          </select>

          <Link
            href="/"
            className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-white/80 hover:bg-white border border-slate-200 text-xs font-bold text-slate-700 shadow-sm transition-all hover:shadow-md"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Overview</span>
          </Link>
        </div>
      </header>

      {/* Main Content Grid */}
      <main className="relative z-10 max-w-7xl mx-auto w-full px-6 py-6 lg:py-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center flex-1">
        {/* Left Column: Product Highlights & 3D Canvas */}
        <div className="lg:col-span-6 space-y-6 text-center lg:text-left">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/90 border border-slate-200/80 text-slate-800 text-xs font-bold shadow-bloom">
            <Shield className="w-3.5 h-3.5 text-purple-600" />
            <span>Enterprise Multi-Agent OS</span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 leading-[1.15] tracking-tight">
            Intelligent Automation for <span className="bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-800 bg-clip-text text-transparent">Modern Teams</span>
          </h1>

          <p className="text-sm sm:text-base text-slate-600 leading-relaxed max-w-xl mx-auto lg:mx-0">
            Log in to manage your 15 autonomous specialized domain agents, orchestrate complex visual workflows, and analyze business intelligence in real time.
          </p>

          {/* Key Capabilities List */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-left max-w-lg mx-auto lg:mx-0">
            {[
              { icon: Cpu, label: '15 Autonomous AI Agents' },
              { icon: Zap, label: 'Real-Time Workflow Execution' },
              { icon: Shield, label: '3-Tier RBAC & Audit Logs' },
              { icon: CheckCircle2, label: 'Multilingual Support (6 Languages)' },
            ].map((feat, idx) => (
              <div
                key={idx}
                className="flex items-center gap-2.5 p-3 rounded-2xl bg-white/70 border border-slate-200/60 shadow-sm text-xs font-bold text-slate-800"
              >
                <feat.icon className="w-4 h-4 text-purple-600 shrink-0" />
                <span>{feat.label}</span>
              </div>
            ))}
          </div>

          {/* 3D Canvas Background Container */}
          <div className="hidden lg:block w-full h-48 rounded-3xl overflow-hidden relative opacity-90 border border-slate-200/60 shadow-bloom">
            <Hero3DCanvas />
          </div>
        </div>

        {/* Right Column: Form Component */}
        <div className="lg:col-span-6 flex justify-center">
          {isAuthenticated ? (
            <div className="w-full max-w-md bg-white/95 backdrop-blur-xl border border-slate-200/90 rounded-[32px] p-8 shadow-bloom-lg text-center space-y-4 animate-fadeIn">
              <div className="w-16 h-16 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center mx-auto text-xl font-bold">
                ✓
              </div>
              <h3 className="text-xl font-black text-slate-900">Already Authenticated</h3>
              <p className="text-xs text-slate-600">
                You are currently signed in as <span className="font-bold text-purple-600">{user.email}</span> ({user.role}).
              </p>

              <div className="flex flex-col gap-2.5 pt-2">
                <Link
                  href="/"
                  className="w-full py-2.5 px-4 bg-purple-600 hover:bg-purple-700 text-white rounded-2xl text-xs font-bold shadow-md transition-all text-center"
                >
                  Proceed to Dashboard
                </Link>
                <button
                  type="button"
                  onClick={() => logout()}
                  className="w-full py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl text-xs font-bold transition-all"
                >
                  Sign Out & Switch Account
                </button>
              </div>
            </div>
          ) : (
            <LoginForm />
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-20 py-4 px-6 text-center text-[11px] text-slate-400 border-t border-slate-200/50 bg-white/40 backdrop-blur-sm">
        <p>© 2026 FlowMind AI Inc. All rights reserved. • Enterprise Security Standard ISO 27001</p>
      </footer>
    </div>
  );
}
