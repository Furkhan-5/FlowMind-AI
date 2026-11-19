'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAppStore } from '@/lib/store/useAppStore';
import { SUPPORTED_LANGUAGES, UI_TRANSLATIONS } from '@/lib/i18n/translations';
import { LanguageCode, UserRole } from '@/types';
import { Mic, ChevronDown, LogIn, LogOut, Menu, X, Sparkles } from 'lucide-react';
import { BrandLogo } from '@/components/ui/BrandLogo';

export const Navbar: React.FC = () => {
  const pathname = usePathname() || '';
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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

  // Auto-synchronize store activeModule when navigating via URL or browser back/forward
  useEffect(() => {
    if (pathname === '/workflows' || pathname.startsWith('/workflows/')) {
      setActiveModule('workflows');
    } else if (pathname === '/data-studio' || pathname.startsWith('/data-studio/')) {
      setActiveModule('data-analyst');
    } else if (pathname === '/knowledge-base' || pathname.startsWith('/knowledge-base/') || pathname.startsWith('/memory')) {
      setActiveModule('knowledge');
    } else if (pathname === '/settings/ai-providers' || pathname.startsWith('/settings/ai-providers/')) {
      setActiveModule('byok');
    } else if (pathname === '/modules/crm' || pathname.startsWith('/modules/crm/')) {
      setActiveModule('crm');
    } else if (pathname === '/modules' || pathname.startsWith('/modules/')) {
      setActiveModule('modules');
    } else if (pathname === '/dashboard' || pathname === '/' || pathname === '/app') {
      if (typeof window !== 'undefined') {
        const params = new URLSearchParams(window.location.search);
        if (params.get('module') === 'agents') {
          setActiveModule('agents');
        }
      }
    }
  }, [pathname, setActiveModule]);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  const navItems = [
    {
      id: 'dashboard',
      href: '/dashboard',
      label: t['navigation.dashboard'] || t.dashboard || 'Executive Dashboard',
      match: (path: string) => (path === '/dashboard' || path === '/' || path === '/app') && activeModule !== 'agents',
    },
    {
      id: 'modules',
      href: '/modules',
      label: t['navigation.businessSuite'] || t['navigation.modules'] || 'Business Suite',
      match: (path: string) => path === '/modules' || (path.startsWith('/modules/') && !path.startsWith('/modules/crm')),
    },
    {
      id: 'agents',
      href: '/dashboard?module=agents',
      label: t['navigation.agents'] || t.activeAgents || '15 Active Agents Mesh',
      match: (path: string) => path.startsWith('/agents') || ((path === '/dashboard' || path === '/' || path === '/app') && activeModule === 'agents'),
    },
    {
      id: 'workflows',
      href: '/workflows',
      label: t['navigation.workflows'] || t.workflows || 'AI Workflows',
      match: (path: string) => path === '/workflows' || path.startsWith('/workflows/'),
    },
    {
      id: 'data-analyst',
      href: '/data-studio',
      label: t['navigation.analytics'] || t.dataStudio || 'AI Data Studio',
      match: (path: string) => path === '/data-studio' || path.startsWith('/data-studio/'),
    },
    {
      id: 'knowledge',
      href: '/knowledge-base',
      label: t['navigation.knowledge'] || t.knowledgeBase || 'RAG Knowledge Hub',
      match: (path: string) => path === '/knowledge-base' || path.startsWith('/knowledge-base/') || path.startsWith('/memory'),
    },
    {
      id: 'byok',
      href: '/settings/ai-providers',
      label: t['navigation.settings'] || 'BYOK Keys',
      match: (path: string) => path === '/settings/ai-providers' || path.startsWith('/settings/ai-providers/'),
    },
    {
      id: 'crm',
      href: '/modules/crm',
      label: t['navigation.crm'] || t.crmLeads || 'CRM & Business Suite',
      match: (path: string) => path === '/modules/crm' || path.startsWith('/modules/crm/'),
    },
  ];

  const handleItemClick = (item: typeof navItems[0], e: React.MouseEvent) => {
    setMobileMenuOpen(false);
    if (item.id === 'agents') {
      e.preventDefault();
      setActiveModule('agents');
      if (pathname !== '/dashboard') {
        router.push('/dashboard?module=agents');
      }
    } else if (item.id === 'dashboard') {
      setActiveModule('dashboard');
    } else {
      setActiveModule(item.id);
    }
  };

  return (
    <header className="sticky top-0 z-50 px-4 sm:px-6 pt-3 pb-2 bg-slate-950/70 backdrop-blur-md transition-colors">
      <div className="max-w-7xl mx-auto bg-slate-900/95 border border-slate-800/90 rounded-full px-4 sm:px-6 py-2.5 shadow-2xl flex items-center justify-between transition-all">
        {/* Brand Logo */}
        <Link
          href="/dashboard"
          className="hover:opacity-85 transition-opacity flex items-center gap-2 shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-400 rounded-full"
          title="FlowMind AI Home"
        >
          <BrandLogo size="sm" showText={true} />
        </Link>

        {/* Center Nav Links (Desktop & Laptop) */}
        <nav className="hidden lg:flex items-center gap-1 xl:gap-2">
          {navItems.map((item) => {
            const active = item.match(pathname);
            return (
              <Link
                key={item.id}
                href={item.href}
                onClick={(e) => handleItemClick(item, e)}
                aria-current={active ? 'page' : undefined}
                className={`relative px-3 py-1.5 rounded-full text-xs transition-all duration-200 ease-in-out whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-400 ${
                  active
                    ? 'text-[#E9C5FF] font-semibold bg-purple-500/15 shadow-[0_0_12px_rgba(168,85,247,0.20)]'
                    : 'text-[#94A3B8] font-medium hover:text-[#FFFFFF] hover:bg-white/5'
                }`}
              >
                <span>{item.label}</span>
                {active && (
                  <span
                    className="absolute -bottom-1 left-3 right-3 h-[2px] bg-[#A855F7] rounded-full shadow-[0_0_8px_#A855F7]"
                    aria-hidden="true"
                  />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Right Controls */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          {/* Native Language Selector */}
          <div className="relative">
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value as LanguageCode)}
              aria-label="Select Interface Language"
              className="bg-slate-800 hover:bg-slate-700/80 border border-slate-700 text-slate-200 text-xs font-semibold rounded-full px-2.5 sm:px-3 py-1.5 pr-6 appearance-none cursor-pointer focus:outline-none focus:border-purple-400 transition-colors"
            >
              {SUPPORTED_LANGUAGES.map((lang) => (
                <option key={lang.code} value={lang.code} className="bg-slate-900 text-slate-100">
                  {lang.flag} {lang.nativeName}
                </option>
              ))}
            </select>
            <ChevronDown className="w-3 h-3 text-slate-400 absolute right-2 top-2.5 pointer-events-none" />
          </div>

          {/* Voice Assistant Pill */}
          <button
            onClick={() => setVoiceActive(!isVoiceActive)}
            className={`p-2 rounded-full border transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-400 ${
              isVoiceActive
                ? 'bg-red-500 text-white border-red-500 animate-pulse shadow-lg'
                : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700 hover:text-white'
            }`}
            title="Toggle Voice Assistant"
            aria-label="Toggle Voice Assistant"
          >
            <Mic className="w-3.5 h-3.5" />
          </button>

          {/* Role Selector */}
          <select
            value={user.role}
            onChange={(e) => setRole(e.target.value as UserRole)}
            aria-label="User Role Selector"
            className="hidden sm:block bg-slate-800 border border-slate-700 text-slate-200 text-[11px] font-bold rounded-full px-2.5 py-1 appearance-none cursor-pointer hover:bg-slate-700/80 focus:outline-none focus:border-purple-400 transition-colors"
          >
            <option value="ADMIN">ADMIN</option>
            <option value="MANAGER">MANAGER</option>
            <option value="EMPLOYEE">EMPLOYEE</option>
          </select>

          {/* Authentication State Button / User Badge */}
          {isAuthenticated ? (
            <div className="flex items-center gap-2 pl-1 border-l border-slate-800">
              <div
                className="hidden xl:flex items-center gap-1.5 px-2.5 py-1 bg-purple-950/70 border border-purple-800/70 rounded-full text-xs font-bold text-purple-200"
                title={`Logged in as ${user.name} (${user.email})`}
              >
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="max-w-[100px] truncate">{user.name}</span>
              </div>
              <button
                onClick={async () => {
                  await logout();
                  window.location.href = '/login';
                }}
                className="flex items-center gap-1 px-3 py-1.5 bg-slate-800 hover:bg-red-950/60 hover:text-red-300 border border-slate-700 text-slate-300 text-xs font-bold rounded-full transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-400"
                title="Sign Out"
                aria-label="Sign Out"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          ) : (
            <Link
              href="/login"
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold rounded-full shadow-md transition-all hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-400"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Sign In</span>
            </Link>
          )}

          {/* Mobile Collapsible Hamburger Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 rounded-full bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-400"
            aria-label="Toggle navigation menu"
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? <X className="w-4 h-4 text-purple-400" /> : <Menu className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Mobile Collapsible Menu Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden max-w-7xl mx-auto mt-2 bg-slate-900/98 border border-slate-800 rounded-3xl p-4 shadow-2xl backdrop-blur-2xl animate-fadeIn space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800 text-xs font-bold text-slate-400 px-2">
            <span className="flex items-center gap-1.5 text-purple-300">
              <Sparkles className="w-3.5 h-3.5" /> Navigation Menu
            </span>
            <span className="text-[10px] text-slate-500 font-mono">15 Agents Linked</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
            {navItems.map((item) => {
              const active = item.match(pathname);
              return (
                <Link
                  key={item.id}
                  href={item.href}
                  onClick={(e) => handleItemClick(item, e)}
                  aria-current={active ? 'page' : undefined}
                  className={`flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs transition-all duration-200 ${
                    active
                      ? 'text-[#E9C5FF] font-semibold bg-purple-500/20 border-l-4 border-[#A855F7] shadow-[0_0_12px_rgba(168,85,247,0.20)]'
                      : 'text-[#94A3B8] font-medium hover:text-[#FFFFFF] hover:bg-slate-800/80'
                  }`}
                >
                  <span>{item.label}</span>
                  {active && (
                    <span className="w-2 h-2 rounded-full bg-[#A855F7] shadow-[0_0_6px_#A855F7]" />
                  )}
                </Link>
              );
            })}
          </div>

          {/* Mobile User Role Bar */}
          <div className="pt-2 border-t border-slate-800 flex items-center justify-between px-2 text-xs">
            <span className="text-slate-400 font-medium">Active RBAC Role:</span>
            <select
              value={user.role}
              onChange={(e) => setRole(e.target.value as UserRole)}
              className="bg-slate-800 border border-slate-700 text-slate-200 text-xs font-bold rounded-lg px-2.5 py-1"
            >
              <option value="ADMIN">ADMIN</option>
              <option value="MANAGER">MANAGER</option>
              <option value="EMPLOYEE">EMPLOYEE</option>
            </select>
          </div>
        </div>
      )}
    </header>
  );
};
