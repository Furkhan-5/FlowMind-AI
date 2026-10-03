'use client';

import React from 'react';
import Link from 'next/link';
import { SignUpForm } from '@/components/auth/SignUpForm';
import { ArrowLeft, Shield, Cpu, Zap, CheckCircle2 } from 'lucide-react';
import { SUPPORTED_LANGUAGES } from '@/lib/i18n/translations';
import { useAppStore } from '@/lib/store/useAppStore';
import { LanguageCode } from '@/types';

export default function SignUpPage() {
  const { language, setLanguage } = useAppStore();

  return (
    <div className="min-h-screen bg-bloom-bg text-bloom-dark relative flex flex-col justify-between overflow-hidden">
      {/* Background Decorative Ambient Glows */}
      <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-purple-300/30 rounded-full blur-[120px] pointer-events-none animate-pulse" />
      <div className="absolute bottom-0 left-1/4 w-[600px] h-[600px] bg-indigo-300/30 rounded-full blur-[140px] pointer-events-none" />

      {/* Top Header */}
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
            href="/login"
            className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-white/80 hover:bg-white border border-slate-200 text-xs font-bold text-slate-700 shadow-sm transition-all hover:shadow-md"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Sign In</span>
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 max-w-7xl mx-auto w-full px-6 py-6 lg:py-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center flex-1">
        {/* Left Column: Product Information */}
        <div className="lg:col-span-6 space-y-6 text-center lg:text-left">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/90 border border-slate-200/80 text-slate-800 text-xs font-bold shadow-bloom">
            <Shield className="w-3.5 h-3.5 text-purple-600" />
            <span>Join 10,000+ Enterprise Teams</span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 leading-[1.15] tracking-tight">
            Deploy Autonomous <span className="bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-800 bg-clip-text text-transparent">AI Agents</span> Today
          </h1>

          <p className="text-sm sm:text-base text-slate-600 leading-relaxed max-w-xl mx-auto lg:mx-0">
            Sign up to unlock your personal business operating system. Seamlessly connect CEO, Finance, Sales, HR, and Database agents in minutes.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-left max-w-lg mx-auto lg:mx-0">
            {[
              { icon: Cpu, label: 'Instant Agent Provisioning' },
              { icon: Zap, label: 'No-Code Visual Workflows' },
              { icon: Shield, label: 'AES-256 Data Protection' },
              { icon: CheckCircle2, label: 'Free Tier Available' },
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
        </div>

        {/* Right Column: Sign Up Form */}
        <div className="lg:col-span-6 flex justify-center">
          <SignUpForm />
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-20 py-4 px-6 text-center text-[11px] text-slate-400 border-t border-slate-200/50 bg-white/40">
        <p>© 2026 FlowMind AI Inc. All rights reserved. • ISO 27001 Certified Security</p>
      </footer>
    </div>
  );
}
