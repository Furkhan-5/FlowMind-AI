import React from 'react';
import Link from 'next/link';
import { useAppStore } from '@/lib/store/useAppStore';
import { SUPPORTED_LANGUAGES, UI_TRANSLATIONS } from '@/lib/i18n/translations';
import { LanguageCode, UserRole } from '@/types';
import { Mic, ChevronDown, LogIn, LogOut } from 'lucide-react';
import { BrandLogo } from '@/components/ui/BrandLogo';

export const Navbar: React.FC = () => {
  const {
    activeModule,
    setActiveModule,
    language,
    setLanguage,
    user,
    isAuthenticated,
    logout,
    setRole,
    isVoiceActive,
    setVoiceActive,
  } = useAppStore();

  const t = UI_TRANSLATIONS[language] || UI_TRANSLATIONS.en;

  const navItems = [
    { id: 'dashboard', label: t.dashboard },
    { id: 'modules', label: 'Business Suite' },
    { id: 'agents', label: t.activeAgents },
    { id: 'workflows', label: t.workflows },
    { id: 'data-analyst', label: t.dataStudio },
    { id: 'knowledge', label: t.knowledgeBase },
    { id: 'crm', label: t.crmLeads },
  ];

  const handleNavClick = (id: string) => {
    if (id === 'dashboard') {
      window.location.href = '/';
      return;
    }

    if (id === 'modules') {
      if (window.location.pathname !== '/modules') {
        window.location.href = '/modules';
      }
      return;
    }

    if (id === 'workflows') {
      if (window.location.pathname !== '/workflows') {
        window.location.href = '/workflows';
      }
      return;
    }

    // For future implementation modules (data-analyst, knowledge, crm) & agents:
    setActiveModule(id);
    if (window.location.pathname !== '/dashboard') {
      window.location.href = '/dashboard';
    }
  };

  return (
    <header className="sticky top-0 z-50 px-4 sm:px-8 pt-4 pb-2 bg-bloom-bg/80 dark:bg-slate-950/80 backdrop-blur-md transition-colors">
      <div className="max-w-7xl mx-auto bg-white/90 dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800 rounded-full px-6 py-3 shadow-bloom flex items-center justify-between transition-colors">
        {/* Brand Logo */}
        <button
          onClick={() => {
            window.location.href = '/';
          }}
          className="hover:opacity-80 transition-opacity flex items-center gap-2"
          title="Go to 3D Executive Landing Page"
        >
          <BrandLogo size="sm" showText={true} />
        </button>

        {/* Center Nav Links */}
        <nav className="hidden md:flex items-center gap-6">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => handleNavClick(item.id)}
              className={`text-xs font-medium transition-all ${
                activeModule === item.id
                  ? 'text-bloom-dark dark:text-purple-300 font-bold underline underline-offset-8 decoration-2 decoration-bloom-accent'
                  : 'text-bloom-textMuted dark:text-slate-400 hover:text-bloom-dark dark:hover:text-white'
              }`}
            >
              {item.label}
            </button>
          ))}
        </nav>

        {/* Right Controls */}
        <div className="flex items-center gap-3">
          {/* Native Language Selector */}
          <div className="relative">
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value as LanguageCode)}
              className="bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-bloom-dark dark:text-slate-100 text-xs font-semibold rounded-full px-3 py-1.5 pr-6 appearance-none cursor-pointer focus:outline-none transition-colors"
            >
              {SUPPORTED_LANGUAGES.map((lang) => (
                <option key={lang.code} value={lang.code} className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100">
                  {lang.flag} {lang.nativeName}
                </option>
              ))}
            </select>
            <ChevronDown className="w-3 h-3 text-slate-500 absolute right-2.5 top-2.5 pointer-events-none" />
          </div>

          {/* Voice Assistant Pill */}
          <button
            onClick={() => setVoiceActive(!isVoiceActive)}
            className={`p-2 rounded-full border transition-all ${
              isVoiceActive
                ? 'bg-red-500 text-white border-red-500 animate-pulse'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
            title="Toggle Voice Assistant"
          >
            <Mic className="w-3.5 h-3.5" />
          </button>

          {/* Role Selector */}
          <select
            value={user.role}
            onChange={(e) => setRole(e.target.value as UserRole)}
            className="bg-slate-100 border border-slate-200 text-slate-700 text-[11px] font-bold rounded-full px-2.5 py-1 appearance-none cursor-pointer"
          >
            <option value="ADMIN">ADMIN</option>
            <option value="MANAGER">MANAGER</option>
            <option value="EMPLOYEE">EMPLOYEE</option>
          </select>

          {/* Authentication State Button / User Badge */}
          {isAuthenticated ? (
            <div className="flex items-center gap-2 pl-1 border-l border-slate-200">
              <div
                className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 bg-purple-50 border border-purple-200/80 rounded-full text-xs font-bold text-purple-900"
                title={`Logged in as ${user.name} (${user.email})`}
              >
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="max-w-[100px] truncate">{user.name}</span>
              </div>
              <button
                onClick={async () => {
                  await logout();
                  window.location.href = '/login';
                }}
                className="flex items-center gap-1 px-3 py-1.5 bg-slate-100 hover:bg-red-50 hover:text-red-600 border border-slate-200 text-slate-700 text-xs font-bold rounded-full transition-all"
                title="Sign Out"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          ) : (
            <Link
              href="/login"
              className="flex items-center gap-1.5 px-4 py-1.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-full shadow-md transition-all hover:shadow-lg"
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
