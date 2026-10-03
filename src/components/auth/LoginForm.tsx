'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAppStore } from '@/lib/store/useAppStore';
import { UserRole } from '@/types';
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  Sparkles,
  ShieldCheck,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  Building2,
  UserCheck,
  KeyRound,
  Loader2,
  RefreshCw,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';

export const LoginForm: React.FC<{ onSuccess?: () => void }> = ({ onSuccess }) => {
  const router = useRouter();
  const { login, user } = useAppStore();

  const [email, setEmail] = useState('furkh@flowmind.ai');
  const [password, setPassword] = useState('flowmind2026!');
  const [selectedRole, setSelectedRole] = useState<UserRole>('ADMIN');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSubmitted, setForgotSubmitted] = useState(false);

  // Quick Preset Logins
  const DEMO_PRESETS = [
    {
      role: 'ADMIN' as UserRole,
      label: 'Admin',
      name: 'Furkh',
      email: 'furkh@flowmind.ai',
      badge: 'Full Access',
      avatarColor: 'from-purple-600 to-indigo-600',
    },
    {
      role: 'MANAGER' as UserRole,
      label: 'Manager',
      name: 'Aniket Sahu',
      email: 'aniket@flowmind.ai',
      badge: 'Department Lead',
      avatarColor: 'from-blue-600 to-cyan-600',
    },
    {
      role: 'EMPLOYEE' as UserRole,
      label: 'Employee',
      name: 'Sarah Connor',
      email: 'sarah@flowmind.ai',
      badge: 'Operator',
      avatarColor: 'from-emerald-600 to-teal-600',
    },
  ];

  const handleApplyPreset = (preset: (typeof DEMO_PRESETS)[0]) => {
    setEmail(preset.email);
    setSelectedRole(preset.role);
    setPassword('flowmind2026!');
    setErrorMessage(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsLoading(true);

    // Simulate standard security token validation latency
    await new Promise((resolve) => setTimeout(resolve, 600));

    const result = await login({
      email,
      password,
      role: selectedRole,
    });

    setIsLoading(false);

    if (result.success) {
      if (onSuccess) {
        onSuccess();
      } else {
        router.push('/');
      }
    } else {
      setErrorMessage(result.error || 'Authentication failed. Please check your credentials.');
    }
  };

  const handleForgotPasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail || !forgotEmail.includes('@')) {
      return;
    }
    setForgotSubmitted(true);
  };

  return (
    <div className="w-full max-w-md mx-auto relative z-10">
      {/* Container Glass Card */}
      <div className="bg-white/95 backdrop-blur-xl border border-slate-200/90 rounded-[32px] p-6 sm:p-8 shadow-bloom-lg transition-all duration-300">
        
        {/* Header Branding */}
        <div className="text-center space-y-2 mb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-100/70 border border-purple-200 text-purple-700 text-xs font-bold animate-pulse">
            <Sparkles className="w-3.5 h-3.5 text-purple-600" />
            <span>FlowMind AI Operating System</span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Sign In to Enterprise
          </h2>
          <p className="text-xs text-slate-500 leading-relaxed max-w-xs mx-auto">
            Access 15 autonomous business agents, workflow engines & real-time analytics.
          </p>
        </div>

        {/* Quick Demo Persona Switcher */}
        <div className="mb-6 bg-slate-50 border border-slate-200/80 rounded-2xl p-3">
          <div className="flex items-center justify-between text-[11px] font-bold text-slate-600 mb-2.5 px-1">
            <span className="flex items-center gap-1.5 text-purple-700">
              <UserCheck className="w-3.5 h-3.5" /> Quick Demo Personas
            </span>
            <span className="text-[10px] text-slate-400">Click to autofill</span>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {DEMO_PRESETS.map((preset) => {
              const isActive = email === preset.email && selectedRole === preset.role;
              return (
                <button
                  key={preset.role}
                  type="button"
                  onClick={() => handleApplyPreset(preset)}
                  className={`flex flex-col items-center justify-center p-2 rounded-xl text-center border transition-all ${
                    isActive
                      ? 'bg-purple-600 text-white border-purple-600 shadow-md scale-[1.02]'
                      : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200'
                  }`}
                >
                  <span className="text-[11px] font-extrabold truncate w-full">{preset.label}</span>
                  <span className={`text-[9px] mt-0.5 font-medium ${isActive ? 'text-purple-100' : 'text-slate-400'}`}>
                    {preset.name}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Error Alert Message */}
        {errorMessage && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-2xl flex items-start gap-2.5 text-xs text-red-700 animate-fadeIn">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
            <div className="flex-1 font-medium">{errorMessage}</div>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Role Selection Tabs */}
          <div>
            <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Assigned Security Role
            </label>
            <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-100 rounded-full border border-slate-200">
              {(['ADMIN', 'MANAGER', 'EMPLOYEE'] as UserRole[]).map((role) => (
                <button
                  key={role}
                  type="button"
                  onClick={() => setSelectedRole(role)}
                  className={`py-1.5 text-[11px] font-bold rounded-full transition-all ${
                    selectedRole === role
                      ? 'bg-slate-900 text-white shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {role}
                </button>
              ))}
            </div>
          </div>

          {/* Email Address */}
          <div>
            <label htmlFor="email-input" className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Work Email Address
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Mail className="w-4 h-4" />
              </div>
              <input
                id="email-input"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@flowmind.ai"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-colors"
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label htmlFor="password-input" className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                Account Password
              </label>
              <button
                type="button"
                onClick={() => {
                  setForgotEmail(email);
                  setForgotSubmitted(false);
                  setShowForgotPassword(true);
                }}
                className="text-[11px] font-bold text-purple-600 hover:text-purple-700 transition-colors"
              >
                Forgot?
              </button>
            </div>
            <div className="relative flex items-center">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Lock className="w-4 h-4" />
              </div>
              <input
                id="password-input"
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                className="w-full pl-10 pr-11 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-colors"
              />
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setShowPassword((prev) => !prev);
                }}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center justify-center text-slate-400 hover:text-purple-600 transition-colors focus:outline-none cursor-pointer z-10"
                title={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4 text-purple-600" />
                ) : (
                  <Eye className="w-4 h-4 text-slate-400 hover:text-slate-600" />
                )}
              </button>
            </div>
          </div>

          {/* Remember Me Checkbox */}
          <div className="flex items-center justify-between pt-1">
            <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-600">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 rounded border-slate-300 text-purple-600 focus:ring-purple-500"
              />
              <span>Remember active session</span>
            </label>
            <span className="flex items-center gap-1 text-[10px] text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded-full">
              <ShieldCheck className="w-3 h-3" /> 256-bit Encrypted
            </span>
          </div>

          {/* Submit Login Button */}
          <Button
            type="submit"
            variant="dark"
            size="lg"
            className="w-full py-3 text-xs font-bold rounded-2xl shadow-bloom-lg hover:shadow-purple-500/25 transition-all mt-2"
            disabled={isLoading}
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                Authenticating Session...
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                <span>Sign In to Dashboard</span>
                <ArrowRight className="w-4 h-4" />
              </span>
            )}
          </Button>
        </form>

        {/* Divider */}
        <div className="relative my-5">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-200"></div>
          </div>
          <div className="relative flex justify-center text-[10px] uppercase font-bold tracking-wider">
            <span className="bg-white px-2 text-slate-400">or enterprise single sign-on</span>
          </div>
        </div>

        {/* Enterprise SSO Button */}
        <button
          type="button"
          onClick={() => {
            handleApplyPreset(DEMO_PRESETS[0]);
            handleSubmit({ preventDefault: () => {} } as any);
          }}
          className="w-full py-2.5 px-4 bg-slate-100 hover:bg-slate-200/80 border border-slate-200 rounded-2xl text-xs font-bold text-slate-700 flex items-center justify-center gap-2 transition-colors"
        >
          <Building2 className="w-4 h-4 text-purple-600" />
          <span>Continue with Okta / Google Workspace SSO</span>
        </button>

        {/* Link to Sign Up */}
        <div className="text-center pt-4 border-t border-slate-100 mt-4">
          <p className="text-xs text-slate-600">
            Don&apos;t have an account yet?{' '}
            <Link
              href="/signup"
              className="font-bold text-purple-600 hover:text-purple-700 underline underline-offset-4"
            >
              Create Account
            </Link>
          </p>
        </div>

        {/* Footer Security Notice */}
        <p className="text-center text-[10px] text-slate-400 mt-4">
          Protected by FlowMind AI RBAC Guard & Real-Time Audit Logger.
        </p>
      </div>

      {/* Forgot Password Modal */}
      {showForgotPassword && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl border border-slate-200 animate-fadeIn space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-purple-600" /> Reset Password
              </h3>
              <button
                type="button"
                onClick={() => setShowForgotPassword(false)}
                className="text-xs font-bold text-slate-400 hover:text-slate-600 px-2"
              >
                ✕
              </button>
            </div>

            {!forgotSubmitted ? (
              <form onSubmit={handleForgotPasswordSubmit} className="space-y-3">
                <p className="text-xs text-slate-600 leading-relaxed">
                  Enter your registered work email address below to receive a secure password reset link.
                </p>
                <div>
                  <input
                    type="email"
                    required
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    placeholder="name@flowmind.ai"
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                  />
                </div>
                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowForgotPassword(false)}
                    className="px-3 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
                  >
                    Cancel
                  </button>
                  <Button type="submit" variant="primary" size="sm">
                    Send Reset Link
                  </Button>
                </div>
              </form>
            ) : (
              <div className="text-center py-4 space-y-3">
                <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto animate-bounce" />
                <h4 className="text-xs font-bold text-slate-900">Reset Instructions Sent!</h4>
                <p className="text-[11px] text-slate-600">
                  We've dispatched a recovery token to <span className="font-bold text-slate-800">{forgotEmail}</span>.
                </p>
                <Button
                  type="button"
                  variant="dark"
                  size="sm"
                  className="w-full mt-2"
                  onClick={() => setShowForgotPassword(false)}
                >
                  Return to Sign In
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
