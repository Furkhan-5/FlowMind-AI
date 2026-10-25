'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAppStore } from '@/lib/store/useAppStore';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import {
  ShieldCheck,
  KeyRound,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Trash2,
  Cpu,
  Lock,
  ArrowLeft,
  Eye,
  EyeOff,
  Activity,
  Layers,
  Sparkles,
  Zap,
} from 'lucide-react';

interface ProviderConfig {
  id: string;
  provider: 'GEMINI' | 'OPENAI';
  status: 'ACTIVE' | 'DISABLED' | 'ERROR';
  preferredModel: string;
  keySuffix: string;
  lastValidatedAt: string | null;
  updatedAt: string;
}

interface TelemetryData {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageLatencyMs: number;
  lastCallAt: string | null;
  providerDistribution: Record<string, number>;
}

export default function AiProvidersSettingsPage() {
  const { user, language } = useAppStore();
  const isAdmin = user.role === 'ADMIN';

  // Config States
  const [configs, setConfigs] = useState<Record<string, ProviderConfig>>({});
  const [loading, setLoading] = useState(true);
  const [telemetry, setTelemetry] = useState<TelemetryData | null>(null);

  // Gemini Form State
  const [geminiKey, setGeminiKey] = useState('');
  const [geminiModel, setGeminiModel] = useState('gemini-1.5-flash');
  const [geminiShowKey, setGeminiShowKey] = useState(false);
  const [geminiValidating, setGeminiValidating] = useState(false);
  const [geminiSaving, setGeminiSaving] = useState(false);
  const [geminiFeedback, setGeminiFeedback] = useState<{ success: boolean; message: string } | null>(null);

  // OpenAI Form State
  const [openaiKey, setOpenaiKey] = useState('');
  const [openaiModel, setOpenaiModel] = useState('gpt-4o-mini');
  const [openaiShowKey, setOpenaiShowKey] = useState(false);
  const [openaiValidating, setOpenaiValidating] = useState(false);
  const [openaiSaving, setOpenaiSaving] = useState(false);
  const [openaiFeedback, setOpenaiFeedback] = useState<{ success: boolean; message: string } | null>(null);

  // Fetch configs and telemetry on load
  const fetchData = async () => {
    try {
      setLoading(true);
      const [resConfigs, resTelemetry] = await Promise.all([
        fetch('/api/settings/ai-providers').then((r) => r.json()),
        fetch('/api/settings/ai-providers/telemetry').then((r) => r.json()),
      ]);

      if (resConfigs.success && Array.isArray(resConfigs.configs)) {
        const mapped: Record<string, ProviderConfig> = {};
        resConfigs.configs.forEach((c: ProviderConfig) => {
          mapped[c.provider] = c;
        });
        setConfigs(mapped);
        if (mapped.GEMINI?.preferredModel) setGeminiModel(mapped.GEMINI.preferredModel);
        if (mapped.OPENAI?.preferredModel) setOpenaiModel(mapped.OPENAI.preferredModel);
      }

      if (resTelemetry.success && resTelemetry.telemetry) {
        setTelemetry(resTelemetry.telemetry);
      }
    } catch (err) {
      console.error('Failed to load BYOK settings:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Validation probe
  const handleValidateKey = async (provider: 'GEMINI' | 'OPENAI') => {
    const rawKey = provider === 'GEMINI' ? geminiKey : openaiKey;
    const setValidating = provider === 'GEMINI' ? setGeminiValidating : setOpenaiValidating;
    const setFeedback = provider === 'GEMINI' ? setGeminiFeedback : setOpenaiFeedback;

    if (!rawKey.trim()) {
      setFeedback({ success: false, message: 'Please enter an API key to test connection' });
      return;
    }

    try {
      setValidating(true);
      setFeedback(null);

      const res = await fetch('/api/settings/ai-providers/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider, apiKey: rawKey.trim() }),
      });

      const data = await res.json();
      if (data.valid) {
        setFeedback({
          success: true,
          message: `Connection successful! Verified with provider endpoint in ${data.latencyMs}ms.`,
        });
      } else {
        setFeedback({
          success: false,
          message: data.error || 'Connection failed: Provider rejected key.',
        });
      }
    } catch (err: any) {
      setFeedback({ success: false, message: `Network error: ${err.message}` });
    } finally {
      setValidating(false);
    }
  };

  // Save Config
  const handleSaveConfig = async (provider: 'GEMINI' | 'OPENAI') => {
    const rawKey = provider === 'GEMINI' ? geminiKey : openaiKey;
    const model = provider === 'GEMINI' ? geminiModel : openaiModel;
    const setSaving = provider === 'GEMINI' ? setGeminiSaving : setOpenaiSaving;
    const setFeedback = provider === 'GEMINI' ? setGeminiFeedback : setOpenaiFeedback;
    const clearInput = provider === 'GEMINI' ? () => setGeminiKey('') : () => setOpenaiKey('');

    if (!rawKey.trim()) {
      setFeedback({ success: false, message: 'API key is required to save configuration' });
      return;
    }

    try {
      setSaving(true);
      setFeedback(null);

      const res = await fetch('/api/settings/ai-providers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider,
          apiKey: rawKey.trim(),
          preferredModel: model,
          skipLiveValidation: false,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setFeedback({
          success: true,
          message: `Saved & AES-256-GCM encrypted successfully! Active model: ${model}.`,
        });
        clearInput();
        fetchData();
      } else {
        setFeedback({
          success: false,
          message: data.error || 'Failed to save configuration.',
        });
      }
    } catch (err: any) {
      setFeedback({ success: false, message: `Save error: ${err.message}` });
    } finally {
      setSaving(false);
    }
  };

  // Revoke Key
  const handleRevokeKey = async (provider: 'GEMINI' | 'OPENAI') => {
    if (!confirm(`Are you sure you want to revoke the BYOK credentials for ${provider}?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/settings/ai-providers/${provider}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        if (provider === 'GEMINI') {
          setGeminiFeedback({ success: true, message: 'Google Gemini key revoked.' });
        } else {
          setOpenaiFeedback({ success: true, message: 'OpenAI key revoked.' });
        }
        fetchData();
      }
    } catch (err: any) {
      alert(`Failed to revoke key: ${err.message}`);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 sm:p-10 font-sans">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Navigation & Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Link
                href="/dashboard"
                className="text-xs font-semibold text-purple-400 hover:text-purple-300 flex items-center gap-1 transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Back to Dashboard
              </Link>
              <span className="text-slate-600">/</span>
              <span className="text-xs font-semibold text-slate-400">Settings</span>
              <span className="text-slate-600">/</span>
              <span className="text-xs font-semibold text-slate-200">AI Providers</span>
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight text-white flex items-center gap-3">
              <span>Bring Your Own Key (BYOK) Management</span>
              <Badge variant="purple" className="flex items-center gap-1 text-[11px] font-bold">
                <Lock className="w-3 h-3" /> AES-256-GCM
              </Badge>
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Configure dynamic enterprise Google Gemini and OpenAI model routing with envelope encryption and strict RBAC governance.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={fetchData}
              disabled={loading}
              className="px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 hover:bg-slate-800 text-xs font-semibold text-slate-300 flex items-center gap-2 transition-all"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              Refresh Status
            </button>
          </div>
        </div>

        {/* RBAC Notice if Non-Admin */}
        {!isAdmin && (
          <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 flex items-center gap-3 text-xs">
            <AlertTriangle className="w-5 h-5 shrink-0 text-amber-400" />
            <div>
              <p className="font-bold">Viewer Mode Active ({user.role})</p>
              <p className="text-amber-300/80">
                You are currently signed in with the {user.role} role. Adding, testing, or revoking BYOK provider credentials requires ADMIN authorization.
              </p>
            </div>
          </div>
        )}

        {/* Telemetry & Security Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <GlassCard variant="dark" className="p-5 flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-medium">Total AI Dispatches</span>
              <Cpu className="w-4 h-4 text-purple-400" />
            </div>
            <p className="text-2xl font-black text-white">{telemetry?.totalRequests ?? 0}</p>
            <p className="text-[10px] text-slate-400 mt-1">Swarm & Workflow executions</p>
          </GlassCard>

          <GlassCard variant="dark" className="p-5 flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-medium">Success Rate</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            </div>
            <p className="text-2xl font-black text-emerald-400">
              {telemetry && telemetry.totalRequests > 0
                ? `${Math.round((telemetry.successfulRequests / telemetry.totalRequests) * 100)}%`
                : '100%'}
            </p>
            <p className="text-[10px] text-slate-400 mt-1">Zero raw prompt leaks</p>
          </GlassCard>

          <GlassCard variant="dark" className="p-5 flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-medium">Avg Latency</span>
              <Activity className="w-4 h-4 text-blue-400" />
            </div>
            <p className="text-2xl font-black text-blue-400">{telemetry?.averageLatencyMs ?? 0} ms</p>
            <p className="text-[10px] text-slate-400 mt-1">With 15s bounded timeout</p>
          </GlassCard>

          <GlassCard variant="dark" className="p-5 flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-medium">Storage Security</span>
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
            </div>
            <p className="text-xs font-bold text-slate-200">AES-256-GCM Envelope</p>
            <p className="text-[10px] text-slate-400 mt-1">Unique 96-bit Nonce / Key</p>
          </GlassCard>
        </div>

        {/* Provider Configuration Panels */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Google Gemini Card */}
          <GlassCard variant="dark" className="p-6 space-y-6 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 flex items-center justify-center text-white font-black text-sm shadow-lg shadow-blue-500/20">
                    G
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-white">Google Gemini</h3>
                    <p className="text-[11px] text-slate-400">Generative Language API v1beta</p>
                  </div>
                </div>

                {configs.GEMINI ? (
                  <Badge variant="success" className="flex items-center gap-1 text-[11px]">
                    <CheckCircle2 className="w-3 h-3" /> CONFIGURED
                  </Badge>
                ) : (
                  <Badge variant="dark" className="text-[11px]">
                    NOT CONFIGURED
                  </Badge>
                )}
              </div>

              {/* Status info if configured */}
              {configs.GEMINI && (
                <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Encrypted Key:</span>
                    <span className="font-mono text-purple-300 font-bold">{configs.GEMINI.keySuffix}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Active Model:</span>
                    <span className="font-semibold text-slate-200">{configs.GEMINI.preferredModel}</span>
                  </div>
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-500">Last Validated:</span>
                    <span className="text-slate-400">
                      {configs.GEMINI.lastValidatedAt
                        ? new Date(configs.GEMINI.lastValidatedAt).toLocaleString()
                        : 'Never'}
                    </span>
                  </div>
                </div>
              )}

              {/* Form Input */}
              <div className="space-y-3 pt-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    {configs.GEMINI ? 'Update Gemini API Key' : 'Enter Gemini API Key'}
                  </label>
                  <div className="relative">
                    <input
                      type={geminiShowKey ? 'text' : 'password'}
                      value={geminiKey}
                      onChange={(e) => setGeminiKey(e.target.value)}
                      disabled={!isAdmin || geminiSaving || geminiValidating}
                      placeholder={configs.GEMINI ? '•••••••••••••••• (Leave blank to keep current)' : 'AIzaSy...'}
                      className="w-full bg-slate-900/90 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 transition-colors pr-10 font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setGeminiShowKey(!geminiShowKey)}
                      className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-200"
                    >
                      {geminiShowKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Preferred Gemini Model (Allowlist)
                  </label>
                  <select
                    value={geminiModel}
                    onChange={(e) => setGeminiModel(e.target.value)}
                    disabled={!isAdmin}
                    className="w-full bg-slate-900/90 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500 cursor-pointer"
                  >
                    <option value="gemini-1.5-flash">gemini-1.5-flash (Fast, Low Latency, Recommended)</option>
                    <option value="gemini-1.5-pro">gemini-1.5-pro (High Reasoning, Large Context)</option>
                    <option value="gemini-1.0-pro">gemini-1.0-pro (Legacy Stable)</option>
                  </select>
                </div>

                {geminiFeedback && (
                  <div
                    className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                      geminiFeedback.success
                        ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400'
                        : 'bg-red-500/10 border border-red-500/30 text-red-400'
                    }`}
                  >
                    {geminiFeedback.success ? (
                      <CheckCircle2 className="w-4 h-4 shrink-0" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 shrink-0" />
                    )}
                    <span>{geminiFeedback.message}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="pt-4 border-t border-slate-800 flex items-center justify-between gap-3">
              {configs.GEMINI ? (
                <button
                  type="button"
                  onClick={() => handleRevokeKey('GEMINI')}
                  disabled={!isAdmin}
                  className="px-3 py-2 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 text-xs font-semibold flex items-center gap-1.5 transition-all"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Revoke Key
                </button>
              ) : <div />}

              <div className="flex items-center gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => handleValidateKey('GEMINI')}
                  disabled={!isAdmin || geminiValidating || !geminiKey.trim()}
                  className="text-xs"
                >
                  {geminiValidating ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : 'Validate Connection'}
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => handleSaveConfig('GEMINI')}
                  disabled={!isAdmin || geminiSaving || !geminiKey.trim()}
                  className="text-xs bg-purple-600 hover:bg-purple-500"
                >
                  {geminiSaving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : 'Save Configuration'}
                </Button>
              </div>
            </div>
          </GlassCard>

          {/* OpenAI Card */}
          <GlassCard variant="dark" className="p-6 space-y-6 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 via-teal-600 to-cyan-600 flex items-center justify-center text-white font-black text-sm shadow-lg shadow-emerald-500/20">
                    O
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-white">OpenAI</h3>
                    <p className="text-[11px] text-slate-400">Chat Completions API v1</p>
                  </div>
                </div>

                {configs.OPENAI ? (
                  <Badge variant="success" className="flex items-center gap-1 text-[11px]">
                    <CheckCircle2 className="w-3 h-3" /> CONFIGURED
                  </Badge>
                ) : (
                  <Badge variant="dark" className="text-[11px]">
                    NOT CONFIGURED
                  </Badge>
                )}
              </div>

              {/* Status info if configured */}
              {configs.OPENAI && (
                <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Encrypted Key:</span>
                    <span className="font-mono text-emerald-300 font-bold">{configs.OPENAI.keySuffix}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Active Model:</span>
                    <span className="font-semibold text-slate-200">{configs.OPENAI.preferredModel}</span>
                  </div>
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-500">Last Validated:</span>
                    <span className="text-slate-400">
                      {configs.OPENAI.lastValidatedAt
                        ? new Date(configs.OPENAI.lastValidatedAt).toLocaleString()
                        : 'Never'}
                    </span>
                  </div>
                </div>
              )}

              {/* Form Input */}
              <div className="space-y-3 pt-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    {configs.OPENAI ? 'Update OpenAI API Key' : 'Enter OpenAI API Key'}
                  </label>
                  <div className="relative">
                    <input
                      type={openaiShowKey ? 'text' : 'password'}
                      value={openaiKey}
                      onChange={(e) => setOpenaiKey(e.target.value)}
                      disabled={!isAdmin || openaiSaving || openaiValidating}
                      placeholder={configs.OPENAI ? '•••••••••••••••• (Leave blank to keep current)' : 'sk-...'}
                      className="w-full bg-slate-900/90 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors pr-10 font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setOpenaiShowKey(!openaiShowKey)}
                      className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-200"
                    >
                      {openaiShowKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Preferred OpenAI Model (Allowlist)
                  </label>
                  <select
                    value={openaiModel}
                    onChange={(e) => setOpenaiModel(e.target.value)}
                    disabled={!isAdmin}
                    className="w-full bg-slate-900/90 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 cursor-pointer"
                  >
                    <option value="gpt-4o-mini">gpt-4o-mini (Fast, Efficient, Recommended)</option>
                    <option value="gpt-4o">gpt-4o (Omni Flagship Multimodal)</option>
                    <option value="gpt-4-turbo">gpt-4-turbo (High Precision Reasoning)</option>
                    <option value="gpt-3.5-turbo">gpt-3.5-turbo (Standard Lightweight)</option>
                  </select>
                </div>

                {openaiFeedback && (
                  <div
                    className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                      openaiFeedback.success
                        ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400'
                        : 'bg-red-500/10 border border-red-500/30 text-red-400'
                    }`}
                  >
                    {openaiFeedback.success ? (
                      <CheckCircle2 className="w-4 h-4 shrink-0" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 shrink-0" />
                    )}
                    <span>{openaiFeedback.message}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="pt-4 border-t border-slate-800 flex items-center justify-between gap-3">
              {configs.OPENAI ? (
                <button
                  type="button"
                  onClick={() => handleRevokeKey('OPENAI')}
                  disabled={!isAdmin}
                  className="px-3 py-2 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 text-xs font-semibold flex items-center gap-1.5 transition-all"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Revoke Key
                </button>
              ) : <div />}

              <div className="flex items-center gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => handleValidateKey('OPENAI')}
                  disabled={!isAdmin || openaiValidating || !openaiKey.trim()}
                  className="text-xs"
                >
                  {openaiValidating ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : 'Validate Connection'}
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => handleSaveConfig('OPENAI')}
                  disabled={!isAdmin || openaiSaving || !openaiKey.trim()}
                  className="text-xs bg-emerald-600 hover:bg-emerald-500"
                >
                  {openaiSaving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : 'Save Configuration'}
                </Button>
              </div>
            </div>
          </GlassCard>
        </div>

        {/* Security Policy Architecture Explanation */}
        <GlassCard variant="white" className="p-6 text-slate-800 space-y-4">
          <div className="flex items-center gap-2 text-purple-700 font-bold text-sm">
            <ShieldCheck className="w-5 h-5 text-purple-600" />
            <span>FlowMind AI Production Security & Cryptographic Standard</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-slate-600">
            <div className="p-3 bg-purple-50/60 rounded-xl border border-purple-100">
              <p className="font-bold text-purple-900 mb-1">AES-256-GCM Envelope</p>
              <p>
                Credentials are encrypted using AES-256 in Galois/Counter Mode with unique 12-byte initialization vectors (nonces) and 16-byte authentication tags to detect ciphertext tampering.
              </p>
            </div>
            <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-100">
              <p className="font-bold text-blue-900 mb-1">Zero Secret Leakage</p>
              <p>
                Stored keys are decrypted only ephemerally in server runtime memory for authorized AI dispatches. No raw keys are ever written to browser cookies, local storage, or audit logs.
              </p>
            </div>
            <div className="p-3 bg-emerald-50/60 rounded-xl border border-emerald-100">
              <p className="font-bold text-emerald-900 mb-1">Action Governance Preserved</p>
              <p>
                Dynamic LLMs operate strictly as intelligence engines under the supervision of Action Governance and Kahn DAG Topological rules. High-risk actions still mandate human approval.
              </p>
            </div>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
