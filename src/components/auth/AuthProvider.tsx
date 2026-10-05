'use client';

import React, { useEffect } from 'react';
import { useAppStore } from '@/lib/store/useAppStore';
import { usePathname, useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { BrandLogo } from '@/components/ui/BrandLogo';

const PUBLIC_ROUTES = [
  '/login',
  '/signup',
  '/forgot-password',
  '/reset-password',
];

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { checkAuth, isAuthChecking, isAuthenticated } = useAppStore();
  const pathname = usePathname();
  const router = useRouter();

  const isPublicRoute = PUBLIC_ROUTES.some((route) => pathname === route || pathname.startsWith(`${route}/`));

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    if (!isAuthChecking && !isAuthenticated && !isPublicRoute) {
      window.location.href = '/login';
    }
  }, [isAuthChecking, isAuthenticated, isPublicRoute]);

  // If checking authentication status or unauthenticated on a protected route, render smooth loading screen
  if ((isAuthChecking || (!isAuthenticated && !isPublicRoute)) && !isPublicRoute) {
    return (
      <div className="min-h-screen bg-[#050505] text-white flex flex-col items-center justify-center p-6 relative overflow-hidden">
        <div className="w-96 h-96 bg-purple-900/20 rounded-full blur-[100px] absolute pointer-events-none animate-pulse" />
        <div className="relative z-10 flex flex-col items-center text-center space-y-4">
          <BrandLogo size="xl" showText={false} />

          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-100 border border-purple-200 text-purple-700 text-xs font-bold">
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
