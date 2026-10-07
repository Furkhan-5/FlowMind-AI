'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { KeyRound, Lock, Eye, EyeOff, CheckCircle2, AlertCircle, Loader2, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/Button';

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [token, setToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    const queryToken = searchParams.get('token');
    if (queryToken) {
      setToken(queryToken);
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!token.trim()) {
      setErrorMessage('Password reset token is required.');
      return;
    }

    if (newPassword.length < 6) {
      setErrorMessage('New password must be at least 6 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage('Passwords do not match.');
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword, confirmPassword }),
      });

      const data = await res.json();
      setIsLoading(false);

      if (!res.ok || !data.success) {
        setErrorMessage(data.error || 'Failed to reset password.');
      } else {
        setIsSuccess(true);
      }
    } catch (err) {
      setIsLoading(false);
      setErrorMessage('Network or server error during password reset.');
    }
  };

  return (
    <div className="w-full max-w-md bg-white/95 backdrop-blur-xl border border-slate-200/90 rounded-[32px] p-8 shadow-bloom-lg z-10 my-auto">
      <div className="text-center space-y-2 mb-6">
        <div className="w-12 h-12 rounded-2xl bg-purple-100 text-purple-600 flex items-center justify-center mx-auto mb-2">
          <KeyRound className="w-6 h-6" />
        </div>
        <h2 className="text-2xl font-black text-slate-900">Set New Password</h2>
        <p className="text-xs text-slate-500">
          Enter your reset token and your new account password below.
        </p>
      </div>

      {errorMessage && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-2xl flex items-start gap-2 text-xs text-red-700">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
          <span>{errorMessage}</span>
        </div>
      )}

      {!isSuccess ? (
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Token */}
          <div>
            <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Reset Token
            </label>
            <input
              type="text"
              required
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="RESET-..."
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
            />
          </div>

          {/* New Password */}
          <div>
            <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              New Password
            </label>
            <div className="relative flex items-center">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Lock className="w-4 h-4" />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="At least 6 characters"
                className="w-full pl-10 pr-11 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-purple-600"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Confirm Password */}
          <div>
            <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Confirm New Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Lock className="w-4 h-4" />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter new password"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
              />
            </div>
          </div>

          <Button
            type="submit"
            variant="dark"
            size="lg"
            className="w-full py-3 text-xs font-bold rounded-2xl mt-2"
            disabled={isLoading}
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                Updating Password...
              </span>
            ) : (
              'Update Password & Sign In'
            )}
          </Button>
        </form>
      ) : (
        <div className="text-center py-4 space-y-4 animate-fadeIn">
          <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
          <h3 className="text-base font-bold text-slate-900">Password Updated Successfully!</h3>
          <p className="text-xs text-slate-600">
            Your password has been changed. You may now log in with your new credentials.
          </p>

          <Button
            type="button"
            variant="dark"
            size="lg"
            className="w-full"
            onClick={() => router.push('/login')}
          >
            Go to Login Page
          </Button>
        </div>
      )}
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen bg-bloom-bg flex flex-col justify-between items-center p-6 text-bloom-dark relative overflow-hidden">
      <div className="w-[500px] h-[500px] bg-purple-300/30 rounded-full blur-[120px] absolute pointer-events-none animate-pulse" />

      {/* Header */}
      <header className="w-full max-w-md flex items-center justify-between z-10 py-4">
        <Link href="/" className="font-black text-slate-900 text-lg flex items-center gap-2">
          <span className="w-6 h-6 rounded-full bg-slate-900 text-white flex items-center justify-center text-xs font-black">+</span>
          FlowMind AI
        </Link>
        <Link href="/login" className="text-xs font-bold text-slate-600 hover:text-slate-900 flex items-center gap-1">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Login
        </Link>
      </header>

      {/* Main Card inside Suspense */}
      <Suspense fallback={
        <div className="w-full max-w-md bg-white/95 backdrop-blur-xl border border-slate-200/90 rounded-[32px] p-8 text-center text-slate-500 text-xs font-semibold z-10 my-auto">
          <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-purple-600" />
          Loading reset form...
        </div>
      }>
        <ResetPasswordForm />
      </Suspense>

      <footer className="text-[11px] text-slate-400 py-4">
        © 2026 FlowMind AI Security Guard
      </footer>
    </div>
  );
}

