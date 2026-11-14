'use client';

import React, { useState, useEffect } from 'react';
import { useAppStore } from '@/lib/store/useAppStore';
import { Navbar } from '@/components/layout/Navbar';
import { GlassCard } from '@/components/ui/GlassCard';
import { Activity, MessageSquare, Workflow, Mail, FileText, Shield, TrendingUp } from 'lucide-react';

interface AuditEntry {
  id: string;
  action: string;
  resourceType: string;
  resourceId?: string;
  details?: any;
  createdAt: string;
  userEmail?: string;
}

export default function ActivityPage() {
  const { } = useAppStore();
  const [activities, setActivities] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadActivity = async () => {
      setLoading(true);
      try {
        const res = await fetch('/api/activity', { credentials: 'include' });
        if (res.ok) {
          const data = await res.json();
          setActivities(data.activities || []);
        }
      } catch (err) {
        console.error('[ACTIVITY LOAD]', err);
      } finally {
        setLoading(false);
      }
    };
    loadActivity();
  }, []);

  const getIcon = (resourceType: string) => {
    const icons: Record<string, React.ReactNode> = {
      CONVERSATION: <MessageSquare className="w-4 h-4 text-purple-400" />,
      WORKFLOW: <Workflow className="w-4 h-4 text-blue-400" />,
      EMAIL: <Mail className="w-4 h-4 text-emerald-400" />,
      DOCUMENT: <FileText className="w-4 h-4 text-amber-400" />,
      SECURITY: <Shield className="w-4 h-4 text-red-400" />,
      ANALYTICS: <TrendingUp className="w-4 h-4 text-cyan-400" />,
    };
    return icons[resourceType] || <Activity className="w-4 h-4 text-slate-400" />;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900">
      <Navbar />
      <div className="max-w-5xl mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <Activity className="w-8 h-8 text-cyan-400" />
            Unified Activity Timeline
          </h1>
          <p className="text-slate-400 mt-2">Complete audit trail of all actions taken across FlowMind AI.</p>
        </div>

        {loading ? (
          <div className="text-center text-slate-400 py-12">Loading activity...</div>
        ) : activities.length === 0 ? (
          <GlassCard className="text-center py-16">
            <Activity className="w-12 h-12 text-slate-500 mx-auto mb-4" />
            <p className="text-slate-400">No activity recorded yet. Start using FlowMind AI to build your timeline.</p>
          </GlassCard>
        ) : (
          <div className="relative">
            <div className="absolute left-6 top-0 bottom-0 w-px bg-white/10" />
            <div className="space-y-4">
              {activities.map((entry) => (
                <div key={entry.id} className="flex gap-4 pl-12 relative">
                  <div className="absolute left-4 top-3 w-5 h-5 rounded-full bg-slate-800 border border-white/20 flex items-center justify-center -translate-x-1/2">
                    {getIcon(entry.resourceType)}
                  </div>
                  <GlassCard className="flex-1 p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-white text-sm font-medium">{entry.action.replace(/_/g, ' ')}</p>
                        <p className="text-slate-400 text-xs mt-1">
                          {entry.resourceType} {entry.resourceId ? `• ${entry.resourceId}` : ''} {entry.userEmail ? `• by ${entry.userEmail}` : ''}
                        </p>
                      </div>
                      <span className="text-xs text-slate-500">
                        {new Date(entry.createdAt).toLocaleString('en-IN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </GlassCard>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
