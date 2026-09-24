import React from 'react';
import { useAppStore } from '@/lib/store/useAppStore';
import { SUPPORTED_LANGUAGES, UI_TRANSLATIONS } from '@/lib/i18n/translations';
import { LanguageCode, UserRole } from '@/types';
import { FlowMindBrainBulbLogo } from '@/components/ui/FlowMindBrainBulbLogo';
import {
  LayoutDashboard,
  MessageSquare,
  Bot,
  GitFork,
  FileSpreadsheet,
  BookOpen,
  Users,
  Briefcase,
  DollarSign,
  Package,
  Headphones,
  Bell,
  ShieldCheck,
  ChevronDown,
} from 'lucide-react';
import { clsx } from 'clsx';

export const Sidebar: React.FC = () => {
  const {
    organization,
    user,
    language,
    setLanguage,
    activeModule,
    setActiveModule,
    setRole,
  } = useAppStore();

  const t = UI_TRANSLATIONS[language] || UI_TRANSLATIONS.en;

  const mainNavItems = [
    { id: 'dashboard', label: t.dashboard, icon: LayoutDashboard },
    { id: 'chat', label: t.laymanMvp, icon: MessageSquare, badge: 'Core MVP' },
    { id: 'agents', label: t.activeAgents, icon: Bot, count: 15 },
    { id: 'workflows', label: t.workflows, icon: GitFork },
    { id: 'data-analyst', label: t.dataStudio, icon: FileSpreadsheet },
    { id: 'knowledge', label: t.knowledgeBase, icon: BookOpen },
    { id: 'proactive', label: t.proactiveMonitor, icon: Bell, count: 2 },
  ];

  const businessSuiteItems = [
    { id: 'crm', label: t.crmAndLeads, icon: Users },
    { id: 'finance', label: t.financeInvoicing, icon: DollarSign },
    { id: 'hr', label: t.hrEmployees, icon: Briefcase },
    { id: 'inventory', label: t.inventoryStock, icon: Package },
    { id: 'support', label: t.customerSupport, icon: Headphones },
  ];

  return (
    <aside className="w-64 bg-slate-950/90 border-r border-slate-800/80 flex flex-col h-screen select-none backdrop-blur-xl z-20">
      {/* Brand Header */}
      <div className="p-4 border-b border-slate-800/80 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <FlowMindBrainBulbLogo size="md" glow />
          <div>
            <h1 className="font-bold text-slate-100 text-sm tracking-wide">{t.appName}</h1>
            <p className="text-[10px] text-amber-400 font-medium">{t.subTitle}</p>
          </div>
        </div>
      </div>

      {/* Language Selector */}
      <div className="px-4 py-3 border-b border-slate-800/60 bg-slate-900/40">
        <label className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 block mb-1.5">
          {t.nativeLanguage}
        </label>
        <div className="relative">
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value as LanguageCode)}
            className="w-full bg-slate-800/80 border border-slate-700/80 text-slate-200 text-xs rounded-lg px-3 py-1.5 appearance-none focus:outline-none focus:border-blue-500 transition-colors"
          >
            {SUPPORTED_LANGUAGES.map((lang) => (
              <option key={lang.code} value={lang.code} className="bg-slate-900 text-slate-200">
                {lang.flag} {lang.nativeName} ({lang.name})
              </option>
            ))}
          </select>
          <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-2.5 pointer-events-none" />
        </div>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-5 custom-scrollbar">
        {/* Core AI Platform */}
        <div>
          <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">
            {t.aiPlatformCore}
          </p>
          <div className="space-y-1">
            {mainNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeModule === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveModule(item.id)}
                  className={clsx(
                    "w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all duration-200",
                    isActive
                      ? "bg-blue-600/20 text-blue-400 border border-blue-500/30 shadow-md shadow-blue-500/10"
                      : "text-slate-300 hover:bg-slate-900/80 hover:text-white"
                  )}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className={clsx("w-4 h-4", isActive ? "text-blue-400" : "text-slate-400")} />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span className="bg-blue-500/20 text-blue-400 border border-blue-500/30 text-[9px] px-1.5 py-0.5 rounded-full font-semibold">
                      {item.badge}
                    </span>
                  )}
                  {item.count && (
                    <span className="bg-slate-800 text-slate-300 text-[10px] px-2 py-0.5 rounded-full">
                      {item.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Business Suite */}
        <div>
          <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">
            {t.businessSuite}
          </p>
          <div className="space-y-1">
            {businessSuiteItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeModule === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveModule(item.id)}
                  className={clsx(
                    "w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all duration-200",
                    isActive
                      ? "bg-blue-600/20 text-blue-400 border border-blue-500/30"
                      : "text-slate-300 hover:bg-slate-900/80 hover:text-white"
                  )}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className={clsx("w-4 h-4", isActive ? "text-blue-400" : "text-slate-400")} />
                    <span>{item.label}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Role Switcher & User Footer */}
      <div className="p-3 border-t border-slate-800/80 bg-slate-900/60">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span className="text-[11px] font-medium text-slate-300">{t.rbacRole}</span>
          </div>
          <select
            value={user.role}
            onChange={(e) => setRole(e.target.value as UserRole)}
            className="bg-slate-800 border border-slate-700 text-slate-200 text-[10px] font-bold rounded px-2 py-0.5"
          >
            <option value="ADMIN">ADMIN</option>
            <option value="MANAGER">MANAGER</option>
            <option value="EMPLOYEE">EMPLOYEE</option>
          </select>
        </div>
        <div className="flex items-center gap-2.5 pt-1">
          <img
            src={user.avatar}
            alt={user.name}
            className="w-8 h-8 rounded-full border border-slate-700 object-cover"
          />
          <div className="overflow-hidden">
            <p className="text-xs font-semibold text-slate-200 truncate">{user.name}</p>
            <p className="text-[10px] text-slate-400 truncate">{user.email}</p>
          </div>
        </div>
      </div>
    </aside>
  );
};
