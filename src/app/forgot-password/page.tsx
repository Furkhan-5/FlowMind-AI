'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, KeyRound, Mail, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [resetData, setResetData] = useState<{ resetToken: string; resetLink: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!email || !email.includes('@')) {
      setErrorMessage('Please enter a valid work email address.');
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();
      setIsLoading(false);

      if (!res.ok || !data.success) {
        setErrorMessage(data.error || 'Failed to process password reset.');
      } else {
        setResetData({
          resetToken: data.resetToken,
          resetLink: data.resetLink,
        });
      }
    } catch (err) {
      setIsLoading(false);
      setErrorMessage('Network or server error during password reset.');
    }
  };

  return (
    <div className="min-h-screen bg-bloom-bg flex flex-col justify-between items-center p-6 text-bloom-dark relative overflow-hidden">
      <div className="w-[500px] h-[500px] bg-purple-300/30 rounded-full blur-[120px] absolute pointer-events-none animate-pulse" />

      {/* Top Bar */}
      <header className="w-full max-w-md flex items-center justify-between z-10 py-4">
        <Link href="/" className="font-black text-slate-900 text-lg flex items-center gap-2">
          <span className="w-6 h-6 rounded-full bg-slate-900 text-white flex items-center justify-center text-xs font-black">+</span>
          FlowMind AI
        </Link>
        <Link href="/login" className="text-xs font-bold text-slate-600 hover:text-slate-900 flex items-center gap-1">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Login
        </Link>
      </header>

      {/* Card */}
      <div className="w-full max-w-md bg-white/95 backdrop-blur-xl border border-slate-200/90 rounded-[32px] p-8 shadow-bloom-lg z-10 my-auto">
        <div className="text-center space-y-2 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-purple-100 text-purple-600 flex items-center justify-center mx-auto mb-2">
            <KeyRound className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-black text-slate-900">Forgot Your Password?</h2>
          <p className="text-xs text-slate-500">
            Enter your work email address to generate a secure recovery token.
          </p>
        </div>

        {errorMessage && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-2xl flex items-start gap-2 text-xs text-red-700">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        {!resetData ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Work Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="furkh@flowmind.ai"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                />
              </div>
            </div>

            <Button
              type="submit"
              variant="dark"
              size="lg"
              className="w-full py-3 text-xs font-bold rounded-2xl"
              disabled={isLoading}
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Generating Recovery Link...
                </span>
              ) : (
                'Send Recovery Instructions'
              )}
            </Button>
          </form>
        ) : (
          <div className="text-center py-4 space-y-4 animate-fadeIn">
            <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
            <h3 className="text-base font-bold text-slate-900">Recovery Token Generated</h3>
            <p className="text-xs text-slate-600">
              We generated a secure reset link for <span className="font-bold text-slate-800">{email}</span>.
            </p>

            <div className="p-3 bg-purple-50 border border-purple-200 rounded-2xl text-left space-y-1">
              <span className="text-[10px] font-bold text-purple-700 uppercase">Security Token:</span>
              <p className="text-xs font-mono font-bold text-purple-900 break-all">{resetData.resetToken}</p>
            </div>

            <Link
              href={resetData.resetLink}
              className="block w-full py-3 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-2xl shadow-md transition-all text-center"
            >
              Proceed to Reset Password
            </Link>
          </div>
        )}
      </div>

      <footer className="text-[11px] text-slate-400 py-4">
        © 2026 FlowMind AI Security Guard
      </footer>
    </div>
  );
}
