import React from 'react';
import { useAppStore } from '@/lib/store/useAppStore';
import { SUPPORTED_LANGUAGES, UI_TRANSLATIONS } from '@/lib/i18n/translations';
import { LanguageCode, UserRole } from '@/types';
import { Mic, ChevronDown } from 'lucide-react';
import { FlowMindBrainBulbLogo } from '@/components/ui/FlowMindBrainBulbLogo';

export const Navbar: React.FC = () => {
  const {
    activeModule,
    setActiveModule,
    language,
    setLanguage,
    user,
    setRole,
    isVoiceActive,
    setVoiceActive,
  } = useAppStore();

  const t = UI_TRANSLATIONS[language] || UI_TRANSLATIONS.en;

  const navItems = [
    { id: 'dashboard', label: t.dashboard },
    { id: 'agents', label: t.activeAgents },
    { id: 'workflows', label: t.workflows },
    { id: 'data-analyst', label: t.dataStudio },
    { id: 'knowledge', label: t.knowledgeBase },
    { id: 'crm', label: t.crmLeads },
  ];

  return (
    <header className="sticky top-0 z-50 px-4 sm:px-8 pt-4 pb-2 bg-bloom-bg/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto bg-white/90 border border-slate-200/80 rounded-full px-6 py-3 shadow-bloom flex items-center justify-between">
        {/* Brand Logo */}
        <button
          onClick={() => setActiveModule('dashboard')}
          className="flex items-center gap-2.5 font-bold text-bloom-dark text-base tracking-tight hover:opacity-90 transition-opacity group"
        >
          <FlowMindBrainBulbLogo size="md" glow />
          <span className="font-extrabold bg-gradient-to-r from-amber-600 via-purple-900 to-slate-900 bg-clip-text text-transparent">
            FlowMind AI
          </span>
        </button>

        {/* Center Nav Links (Chatbot MVP link removed from Navbar) */}
        <nav className="hidden md:flex items-center gap-6">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveModule(item.id)}
              className={`text-xs font-medium transition-all ${
                activeModule === item.id
                  ? 'text-bloom-dark font-bold underline underline-offset-8 decoration-2 decoration-bloom-accent'
                  : 'text-bloom-textMuted hover:text-bloom-dark'
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
              className="bg-slate-100 hover:bg-slate-200 border border-slate-200 text-bloom-dark text-xs font-semibold rounded-full px-3 py-1.5 pr-6 appearance-none focus:outline-none cursor-pointer transition-colors"
            >
              {SUPPORTED_LANGUAGES.map((lang) => (
                <option key={lang.code} value={lang.code} className="bg-white text-slate-800">
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
                : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
            }`}
            title="Toggle Voice Assistant"
          >
            <Mic className="w-3.5 h-3.5" />
          </button>

          {/* Role Pill */}
          <select
            value={user.role}
            onChange={(e) => setRole(e.target.value as UserRole)}
            className="bg-slate-100 border border-slate-200 text-slate-700 text-[11px] font-bold rounded-full px-2.5 py-1 appearance-none cursor-pointer"
          >
            <option value="ADMIN">ADMIN</option>
            <option value="MANAGER">MANAGER</option>
            <option value="EMPLOYEE">EMPLOYEE</option>
          </select>
        </div>
      </div>
    </header>
  );
};
