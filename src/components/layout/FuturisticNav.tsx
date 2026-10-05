'use client';

import React from 'react';
import Link from 'next/link';
import { useAppStore } from '@/lib/store/useAppStore';
import { SUPPORTED_LANGUAGES } from '@/lib/i18n/translations';
import { LanguageCode } from '@/types';
import { LogIn, LogOut, RotateCcw } from 'lucide-react';

import { BrandLogo } from '@/components/ui/BrandLogo';

interface FuturisticNavProps {
  onReplayIntro?: () => void;
  activeSectionIndex?: number;
  onNavigateSection?: (index: number) => void;
}

export const FuturisticNav: React.FC<FuturisticNavProps> = ({
  onReplayIntro,
  activeSectionIndex = 0,
  onNavigateSection,
}) => {
  const { user, isAuthenticated, logout, language, setLanguage } = useAppStore();

  const NAV_LINKS = [
    { label: 'SYSTEM', sectionIndex: 0 },
    { label: 'THINK', sectionIndex: 1 },
    { label: 'CONNECT', sectionIndex: 2 },
    { label: 'AUTOMATE', sectionIndex: 3 },
    { label: 'INTELLIGENCE', sectionIndex: 4 },
    { label: 'FLOW', sectionIndex: 5 },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-40 px-4 sm:px-8 py-5 transition-all">
      <div className="max-w-7xl mx-auto bg-slate-950/40 dark:bg-slate-950/60 border border-white/10 rounded-full px-6 py-3 backdrop-blur-xl shadow-2xl flex items-center justify-between">
        {/* Brand Logo */}
        <Link href="/" className="hover:opacity-80 transition-opacity">
          <BrandLogo size="md" showText={true} />
        </Link>

        {/* Center Nav Links */}
        <nav className="hidden md:flex items-center gap-6">
          {NAV_LINKS.map((link) => (
            <button
              key={link.label}
              type="button"
              onClick={() => onNavigateSection && onNavigateSection(link.sectionIndex)}
              className={`text-xs font-extrabold tracking-widest transition-all ${
                activeSectionIndex === link.sectionIndex
                  ? 'text-cyan-300 border-b-2 border-cyan-400 pb-0.5'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              {link.label}
            </button>
          ))}
        </nav>

        {/* Right Controls */}
        <div className="flex items-center gap-3">
          {/* Language Selector Dropdown */}
          <div className="relative">
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value as LanguageCode)}
              className="bg-slate-900/90 hover:bg-slate-800 border border-purple-500/40 text-purple-200 text-xs font-bold rounded-full px-3 py-1.5 appearance-none cursor-pointer focus:outline-none focus:border-purple-400 transition-colors shadow-lg"
            >
              {SUPPORTED_LANGUAGES.map((lang) => (
                <option
                  key={lang.code}
                  value={lang.code}
                  className="bg-slate-950 text-slate-100 font-semibold"
                >
                  {lang.flag} {lang.nativeName}
                </option>
              ))}
            </select>
          </div>

          {/* Replay Intro Button */}
          {onReplayIntro && (
            <button
              type="button"
              onClick={onReplayIntro}
              className="p-2 rounded-full border border-white/15 bg-white/5 hover:bg-white/15 text-slate-300 hover:text-white transition-all shadow-sm"
              title="Replay 3D Signature Intro"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Auth Button */}
          {isAuthenticated ? (
            <div className="flex items-center gap-2 pl-2 border-l border-white/10">
              <span className="hidden sm:inline text-xs font-bold text-purple-300 bg-purple-950/60 border border-purple-500/30 px-3 py-1 rounded-full">
                {user.name}
              </span>
              <button
                type="button"
                onClick={async () => {
                  await logout();
                  window.location.href = '/login';
                }}
                className="flex items-center gap-1.5 px-3.5 py-1.5 bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 text-red-300 text-xs font-bold rounded-full transition-all"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          ) : (
            <Link
              href="/login"
              className="flex items-center gap-1.5 px-4 py-1.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold rounded-full shadow-lg transition-all"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Sign In</span>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
};
