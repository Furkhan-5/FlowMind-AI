'use client';

import React, { useState, useEffect } from 'react';
import { useAppStore } from '@/lib/store/useAppStore';
import { Navbar } from '@/components/layout/Navbar';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Brain, Trash2, Search, Globe, Lock, RefreshCw } from 'lucide-react';

interface Memory {
  id: string;
  memoryKey: string;
  content: string;
  scope: 'PRIVATE' | 'ORG_SHARED';
  confidence: number;
  source: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export default function MemoryPage() {
  const { addToast } = useAppStore();
  const [memories, setMemories] = useState<Memory[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [scopeFilter, setScopeFilter] = useState<'ALL' | 'PRIVATE' | 'ORG_SHARED'>('ALL');

  const loadMemories = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.set('q', searchQuery);
      if (scopeFilter !== 'ALL') params.set('scope', scopeFilter);

      const res = await fetch(`/api/memory?${params}`, { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setMemories(data.memories || []);
      }
    } catch (err) {
      addToast({ title: 'Error', message: 'Failed to load memories', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadMemories(); }, [scopeFilter]);

  const deleteMemory = async (id: string) => {
    try {
      const res = await fetch(`/api/memory?id=${id}`, { method: 'DELETE', credentials: 'include' });
      if (res.ok) {
        setMemories(prev => prev.filter(m => m.id !== id));
        addToast({ title: 'Memory Deleted', message: 'Memory removed successfully.', type: 'success' });
      }
    } catch (err) {
      addToast({ title: 'Error', message: 'Failed to delete memory', type: 'error' });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900">
      <Navbar />
      <div className="max-w-5xl mx-auto px-6 py-8">
        <div className="mb-8 flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              <Brain className="w-8 h-8 text-purple-400" />
              AI Memory Manager
            </h1>
            <p className="text-slate-400 mt-2">View, manage, and control your personal and organizational memories stored by FlowMind AI.</p>
          </div>
          <Button variant="outline" onClick={loadMemories} icon={<RefreshCw className="w-4 h-4" />}>
            Refresh
          </Button>
        </div>

        {/* Controls */}
        <div className="flex gap-3 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && loadMemories()}
              placeholder="Search memories..."
              className="w-full pl-9 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-400 text-sm focus:outline-none focus:border-purple-500"
            />
          </div>
          {(['ALL', 'PRIVATE', 'ORG_SHARED'] as const).map(s => (
            <button
              key={s}
              onClick={() => setScopeFilter(s)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                scopeFilter === s
                  ? 'bg-purple-600 text-white'
                  : 'bg-white/5 text-slate-300 hover:bg-white/10 border border-white/10'
              }`}
            >
              {s === 'ALL' ? 'All' : s === 'PRIVATE' ? '🔒 Private' : '🌐 Shared'}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="text-center text-slate-400 py-12">Loading memories...</div>
        ) : memories.length === 0 ? (
          <GlassCard className="text-center py-16">
            <Brain className="w-12 h-12 text-slate-500 mx-auto mb-4" />
            <p className="text-slate-400">No memories found. Start chatting with FlowMind AI to build your knowledge base.</p>
          </GlassCard>
        ) : (
          <div className="space-y-3">
            {memories.map((memory) => (
              <GlassCard key={memory.id} className="p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      {memory.scope === 'PRIVATE' ? (
                        <span className="flex items-center gap-1 text-xs text-blue-400 bg-blue-400/10 border border-blue-400/20 px-2 py-0.5 rounded-full">
                          <Lock className="w-3 h-3" /> Private
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-xs text-emerald-400 bg-emerald-400/10 border border-emerald-400/20 px-2 py-0.5 rounded-full">
                          <Globe className="w-3 h-3" /> Organization Shared
                        </span>
                      )}
                      <span className="text-xs text-slate-500">Source: {memory.source}</span>
                      <span className="text-xs text-slate-500">Confidence: {Math.round(memory.confidence * 100)}%</span>
                    </div>
                    <p className="text-white text-sm">{memory.content}</p>
                    {memory.tags.length > 0 && (
                      <div className="flex gap-1 mt-2">
                        {memory.tags.map(tag => (
                          <Badge key={tag} variant="cyan" className="text-[10px]">{tag}</Badge>
                        ))}
                      </div>
                    )}
                    <p className="text-xs text-slate-500 mt-2">
                      Saved {new Date(memory.updatedAt).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' })}
                    </p>
                  </div>
                  <button
                    onClick={() => deleteMemory(memory.id)}
                    className="p-2 rounded-lg text-red-400 hover:bg-red-400/10 transition-colors"
                    title="Delete memory"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </GlassCard>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
