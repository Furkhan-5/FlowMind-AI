'use client';

import React from 'react';
import Link from 'next/link';
import { useAppStore } from '@/lib/store/useAppStore';
import { LoginForm } from '@/components/auth/LoginForm';
import { ArrowLeft } from 'lucide-react';
import { SUPPORTED_LANGUAGES } from '@/lib/i18n/translations';
import { LanguageCode } from '@/types';

import { BrandLogo } from '@/components/ui/BrandLogo';

export default function LoginPage() {
  const { isAuthenticated, user, logout, language, setLanguage } = useAppStore();

  return (
    <div className="min-h-screen bg-[#000000] text-white relative flex flex-col justify-between overflow-x-hidden font-sans selection:bg-purple-600 selection:text-white">
      {/* Top Header */}
      <header className="relative z-20 px-6 py-4 max-w-7xl mx-auto w-full flex items-center justify-between">
        <Link href="/" className="hover:opacity-80 transition-opacity">
          <BrandLogo size="sm" showText={true} />
        </Link>

        <div className="flex items-center gap-3">
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value as LanguageCode)}
            className="bg-[#18181b] hover:bg-[#27272a] border border-[#27272a] text-slate-200 text-xs font-semibold rounded-full px-3 py-1.5 appearance-none cursor-pointer focus:outline-none transition-colors"
          >
            {SUPPORTED_LANGUAGES.map((lang) => (
              <option key={lang.code} value={lang.code}>
                {lang.flag} {lang.nativeName}
              </option>
            ))}
          </select>

          <Link
            href="/"
            className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-[#18181b] hover:bg-[#27272a] border border-[#27272a] text-xs font-bold text-slate-200 shadow-sm transition-all"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to App</span>
          </Link>
        </div>
      </header>

      {/* Main Container */}
      <main className="relative z-10 w-full max-w-7xl mx-auto px-4 py-6 sm:py-10 flex-1 flex items-center justify-center">
        {isAuthenticated ? (
          <div className="w-full max-w-md bg-[#09090b] border border-[#27272a] rounded-[32px] p-8 shadow-2xl text-center space-y-4 animate-fadeIn">
            <div className="w-16 h-16 rounded-full bg-purple-900/50 text-purple-300 border border-purple-500/30 flex items-center justify-center mx-auto text-xl font-bold">
              ✓
            </div>
            <h3 className="text-xl font-black text-white">Already Authenticated</h3>
            <p className="text-xs text-slate-400">
              You are currently signed in as <span className="font-bold text-purple-400">{user?.email}</span> ({user?.role}).
            </p>

            <div className="flex flex-col gap-2.5 pt-2">
              <Link
                href="/"
                className="w-full py-3 px-4 bg-white hover:bg-slate-200 text-slate-950 rounded-xl text-xs font-bold shadow-md transition-all text-center"
              >
                Proceed to Dashboard
              </Link>
              <button
                type="button"
                onClick={() => logout()}
                className="w-full py-3 px-4 bg-[#18181b] hover:bg-[#27272a] border border-[#27272a] text-slate-300 rounded-xl text-xs font-bold transition-all"
              >
                Sign Out & Switch Account
              </button>
            </div>
          </div>
        ) : (
          <LoginForm initialMode="LOGIN" />
        )}
      </main>

      {/* Footer */}
      <footer className="relative z-20 py-4 px-6 text-center text-[11px] text-slate-500 border-t border-[#18181b] bg-[#000000]">
        <p>© 2026 FlowMind AI Inc. All rights reserved. • ISO 27001 Enterprise Security Standard</p>
      </footer>
    </div>
  );
}

