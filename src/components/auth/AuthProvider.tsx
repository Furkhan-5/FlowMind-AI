'use client';

import React, { useEffect } from 'react';
import { useAppStore } from '@/lib/store/useAppStore';
import { usePathname, useRouter } from 'next/navigation';
import { Loader2, Sparkles } from 'lucide-react';

const PUBLIC_ROUTES = [
  '/login',
  '/signup',
  '/forgot-password',
  '/reset-password',
];

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { checkAuth, initTheme, isAuthChecking, isAuthenticated } = useAppStore();
  const pathname = usePathname();
  const router = useRouter();

  const isPublicRoute = PUBLIC_ROUTES.some((route) => pathname === route || pathname.startsWith(`${route}/`));

  useEffect(() => {
    initTheme();
    checkAuth();
  }, [checkAuth, initTheme]);

  useEffect(() => {
    if (!isAuthChecking && !isAuthenticated && !isPublicRoute) {
      window.location.href = '/login';
    }
  }, [isAuthChecking, isAuthenticated, isPublicRoute]);

  // If checking authentication status or unauthenticated on a protected route, render smooth loading screen
  if ((isAuthChecking || (!isAuthenticated && !isPublicRoute)) && !isPublicRoute) {
    return (
      <div className="min-h-screen bg-bloom-bg flex flex-col items-center justify-center p-6 text-bloom-dark relative overflow-hidden">
        <div className="w-96 h-96 bg-purple-300/30 rounded-full blur-[100px] absolute pointer-events-none animate-pulse" />
        <div className="relative z-10 flex flex-col items-center text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-slate-900 text-white flex items-center justify-center text-2xl font-black shadow-bloom-lg animate-bounce">
            +
          </div>

          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-100 border border-purple-200 text-purple-700 text-xs font-bold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>FlowMind AI Operating System</span>
          </div>

          <h3 className="text-xl font-black text-slate-900 tracking-tight">
            {isAuthChecking ? 'Authenticating Session...' : 'Redirecting to Login...'}
          </h3>

          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
            <Loader2 className="w-4 h-4 text-purple-600 animate-spin" />
            <span>Validating enterprise 256-bit JWT credentials...</span>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
