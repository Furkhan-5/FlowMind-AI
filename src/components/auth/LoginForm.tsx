'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAppStore } from '@/lib/store/useAppStore';
import { UserRole } from '@/types';
import {
  Eye,
  EyeOff,
  AlertCircle,
  Loader2,
  Check,
  UserCheck,
} from 'lucide-react';

import { BrandLogo } from '@/components/ui/BrandLogo';

export const LoginForm: React.FC<{ onSuccess?: () => void; initialMode?: 'LOGIN' | 'SIGNUP' }> = ({
  onSuccess,
  initialMode = 'SIGNUP',
}) => {
  const router = useRouter();
  const { login, signup } = useAppStore();

  const [mode, setMode] = useState<'LOGIN' | 'SIGNUP'>(initialMode);
  const [firstName, setFirstName] = useState('John');
  const [lastName, setLastName] = useState('Francisco');
  const [email, setEmail] = useState('johnfrans@gmail.com');
  const [password, setPassword] = useState('flowmind2026!');
  const [selectedRole, setSelectedRole] = useState<UserRole>('ADMIN');
  const [showPassword, setShowPassword] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const DEMO_PRESETS = [
    { role: 'ADMIN' as UserRole, name: 'Furkh', email: 'furkh@flowmind.ai', label: 'Admin' },
    { role: 'MANAGER' as UserRole, name: 'Aniket', email: 'aniket@flowmind.ai', label: 'Manager' },
    { role: 'EMPLOYEE' as UserRole, name: 'Sarah', email: 'sarah@flowmind.ai', label: 'Employee' },
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

    await new Promise((resolve) => setTimeout(resolve, 500));

    if (mode === 'LOGIN') {
      const result = await login({
        email,
        password,
        role: selectedRole,
      });
      setIsLoading(false);
      if (result.success) {
        if (onSuccess) onSuccess();
        else router.push('/');
      } else {
        setErrorMessage(result.error || 'Authentication failed. Please check credentials.');
      }
    } else {
      const fullName = `${firstName} ${lastName}`.trim() || 'User';
      const result = await signup({
        name: fullName,
        email,
        password,
        confirmPassword: password,
        role: selectedRole,
      });
      setIsLoading(false);
      if (result.success) {
        if (onSuccess) onSuccess();
        else router.push('/');
      } else {
        setErrorMessage(result.error || 'Account creation failed.');
      }
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto bg-[#050505] rounded-[36px] border border-white/10 shadow-2xl overflow-hidden grid grid-cols-1 lg:grid-cols-12 text-white my-auto">
      {/* LEFT PANEL: Purple Radial Gradient & Onboarding Steps */}
      <div className="lg:col-span-6 bg-gradient-to-b from-[#7e22ce] via-[#3b0764] to-[#040209] p-8 sm:p-12 m-3 rounded-[32px] flex flex-col justify-between relative overflow-hidden min-h-[520px]">
        {/* Top Brand Logo */}
        <div className="flex items-center justify-center">
          <BrandLogo size="md" showText={true} />
        </div>

        {/* Center Headline & Onboarding Steps */}
        <div className="space-y-6 my-auto text-center">
          <div className="space-y-2">
            <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
              Get Started with Us
            </h2>
            <p className="text-xs sm:text-sm text-purple-200/90 font-medium max-w-xs mx-auto">
              Complete these easy steps to register your account.
            </p>
          </div>

          {/* Step Indicators Stack */}
          <div className="space-y-3 pt-2 max-w-sm mx-auto">
            {/* Step 1 - Active */}
            <div className="w-full bg-white text-slate-950 px-5 py-3.5 rounded-2xl flex items-center gap-3.5 shadow-xl font-bold text-xs text-left transition-all">
              <span className="w-6 h-6 rounded-full bg-slate-950 text-white flex items-center justify-center text-xs font-black shrink-0">
                1
              </span>
              <span className="truncate">{mode === 'SIGNUP' ? 'Sign up your account' : 'Sign in your account'}</span>
            </div>

            {/* Step 2 - Inactive */}
            <div className="w-full bg-white/10 text-slate-300 px-5 py-3.5 rounded-2xl flex items-center gap-3.5 font-semibold text-xs text-left border border-white/10 backdrop-blur-md">
              <span className="w-6 h-6 rounded-full bg-white/20 text-white flex items-center justify-center text-xs font-bold shrink-0">
                2
              </span>
              <span className="truncate">Set up your workspace</span>
            </div>

            {/* Step 3 - Inactive */}
            <div className="w-full bg-white/10 text-slate-300 px-5 py-3.5 rounded-2xl flex items-center gap-3.5 font-semibold text-xs text-left border border-white/10 backdrop-blur-md">
              <span className="w-6 h-6 rounded-full bg-white/20 text-white flex items-center justify-center text-xs font-bold shrink-0">
                3
              </span>
              <span className="truncate">Set up your profile</span>
            </div>
          </div>
        </div>

        {/* Bottom Preset Switcher Pills */}
        <div className="pt-4 border-t border-white/10 flex items-center justify-between text-[11px] text-purple-200">
          <span className="font-semibold flex items-center gap-1">
            <UserCheck className="w-3.5 h-3.5 text-cyan-300" /> Demo Autofill:
          </span>
          <div className="flex items-center gap-1.5">
            {DEMO_PRESETS.map((p) => (
              <button
                key={p.role}
                type="button"
                onClick={() => handleApplyPreset(p)}
                className={`px-2.5 py-1 rounded-full text-[10px] font-bold transition-all border ${
                  email === p.email
                    ? 'bg-white text-slate-950 border-white shadow'
                    : 'bg-white/10 hover:bg-white/20 border-white/20 text-white'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* RIGHT PANEL: Black Background Auth Form */}
      <div className="lg:col-span-6 bg-[#050505] p-8 sm:p-12 flex flex-col justify-center">
        {/* Header */}
        <div className="space-y-1 mb-6">
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            {mode === 'SIGNUP' ? 'Sign Up Account' : 'Sign In Account'}
          </h1>
          <p className="text-xs text-slate-400 font-medium">
            {mode === 'SIGNUP'
              ? 'Enter your personal data to create your account.'
              : 'Enter your credentials to access your account.'}
          </p>
        </div>

        {/* Social Buttons (Google & Github) */}
        <div className="grid grid-cols-2 gap-3 mb-5">
          <button
            type="button"
            onClick={() => handleApplyPreset(DEMO_PRESETS[0])}
            className="py-3 px-4 bg-[#18181b] hover:bg-[#27272a] border border-[#27272a] rounded-xl flex items-center justify-center gap-2 text-xs font-bold text-white transition-colors"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="#EA4335"
                d="M12 5c1.6 0 3 .6 4.1 1.6l3.1-3.1C17.3 1.7 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.3 9 5 12 5z"
              />
              <path
                fill="#4285F4"
                d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.8z"
              />
              <path
                fill="#FBBC05"
                d="M5.6 14.8c-.2-.7-.4-1.5-.4-2.3s.2-1.6.4-2.3L1.9 7.3C.7 9.7 0 12 0 12.5s.7 2.8 1.9 5.2l3.7-2.9z"
              />
              <path
                fill="#34A853"
                d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2.3-6.4-5.2L1.9 16C3.7 19.7 7.5 23 12 23z"
              />
            </svg>
            <span>Google</span>
          </button>

          <button
            type="button"
            onClick={() => handleApplyPreset(DEMO_PRESETS[1])}
            className="py-3 px-4 bg-[#18181b] hover:bg-[#27272a] border border-[#27272a] rounded-xl flex items-center justify-center gap-2 text-xs font-bold text-white transition-colors"
          >
            <svg className="w-4 h-4 fill-white" viewBox="0 0 24 24">
              <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
            </svg>
            <span>Github</span>
          </button>
        </div>

        {/* Divider */}
        <div className="relative my-4 text-center border-t border-[#27272a]">
          <span className="relative -top-2.5 bg-[#050505] px-3 text-xs text-slate-500 font-medium">Or</span>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="mb-4 p-3 bg-red-950/60 border border-red-500/40 rounded-xl flex items-center gap-2 text-xs text-red-300">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Main Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5">
          {/* First & Last Name (Sign Up Mode) */}
          {mode === 'SIGNUP' && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-white mb-1.5">First Name</label>
                <input
                  type="text"
                  required
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="eg. John"
                  className="w-full p-3 bg-[#18181b] border border-[#27272a] rounded-xl text-xs font-medium text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-white mb-1.5">Last Name</label>
                <input
                  type="text"
                  required
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="eg. Francisco"
                  className="w-full p-3 bg-[#18181b] border border-[#27272a] rounded-xl text-xs font-medium text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 transition-colors"
                />
              </div>
            </div>
          )}

          {/* Email */}
          <div>
            <label className="block text-xs font-bold text-white mb-1.5">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="eg. johnfrans@gmail.com"
              className="w-full p-3 bg-[#18181b] border border-[#27272a] rounded-xl text-xs font-medium text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 transition-colors"
            />
          </div>

          {/* Password */}
          <div>
            <label className="block text-xs font-bold text-white mb-1.5">Password</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="w-full p-3 pr-10 bg-[#18181b] border border-[#27272a] rounded-xl text-xs font-medium text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3 text-slate-400 hover:text-white transition-colors"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-[11px] text-slate-500 mt-1">Must be at least 8 characters.</p>
          </div>

          {/* Role Pill Selector */}
          <div className="pt-1">
            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
              Select Enterprise Security Role:
            </label>
            <div className="grid grid-cols-3 gap-1.5 bg-[#18181b] p-1 rounded-xl border border-[#27272a]">
              {(['ADMIN', 'MANAGER', 'EMPLOYEE'] as UserRole[]).map((role) => (
                <button
                  key={role}
                  type="button"
                  onClick={() => setSelectedRole(role)}
                  className={`py-1 text-[10px] font-bold rounded-lg transition-all ${
                    selectedRole === role ? 'bg-purple-600 text-white shadow' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {role}
                </button>
              ))}
            </div>
          </div>

          {/* Submit Action Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3.5 bg-white hover:bg-slate-200 text-slate-950 font-black text-xs tracking-wider rounded-xl shadow-xl transition-all hover:scale-[1.01] mt-3 flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                <span>Processing...</span>
              </>
            ) : (
              <span>{mode === 'SIGNUP' ? 'Sign Up' : 'Sign In'}</span>
            )}
          </button>
        </form>

        {/* Toggle Mode Switch Link */}
        <div className="text-center pt-5 mt-2">
          {mode === 'SIGNUP' ? (
            <p className="text-xs text-slate-400">
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => setMode('LOGIN')}
                className="font-bold text-white hover:underline"
              >
                Log in
              </button>
            </p>
          ) : (
            <p className="text-xs text-slate-400">
              Don&apos;t have an account?{' '}
              <button
                type="button"
                onClick={() => setMode('SIGNUP')}
                className="font-bold text-white hover:underline"
              >
                Sign Up
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

