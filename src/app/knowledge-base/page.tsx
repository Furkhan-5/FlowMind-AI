'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/layout/Navbar';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { useAppStore } from '@/lib/store/useAppStore';
import {
  KnowledgeDocument,
  DocumentFileType,
  DocumentAccessScope,
  RagQueryResult,
  RagSourceCitation,
} from '@/types';
import {
  BookOpen,
  Search,
  Plus,
  FileText,
  Trash2,
  Sparkles,
  ExternalLink,
  ShieldCheck,
  Clock,
  Layers,
  Send,
  RefreshCw,
  X,
  AlertCircle,
  CheckCircle2,
  Database,
} from 'lucide-react';

export default function KnowledgeBasePage() {
  const { user, addToast } = useAppStore();

  const [documents, setDocuments] = useState<KnowledgeDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDept, setSelectedDept] = useState('ALL');

  // Grounded RAG Query State
  const [ragQuery, setRagQuery] = useState('');
  const [isQuerying, setIsQuerying] = useState(false);
  const [ragResult, setRagResult] = useState<RagQueryResult | null>(null);

  // Ingestion Modal State
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [isIngesting, setIsIngesting] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDept, setNewDept] = useState('General');
  const [newFileType, setNewFileType] = useState<DocumentFileType>('PDF');
  const [newAccessScope, setNewAccessScope] = useState<DocumentAccessScope>('ORGANIZATION');
  const [newContent, setNewContent] = useState('');

  useEffect(() => {
    loadDocuments();
  }, [selectedDept]);

  const loadDocuments = async () => {
    setLoading(true);
    try {
      const url =
        selectedDept === 'ALL'
          ? '/api/knowledge'
          : `/api/knowledge?department=${encodeURIComponent(selectedDept)}`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.success) {
        setDocuments(data.documents || []);
      } else {
        addToast({ type: 'error', title: 'Error', message: data.error || 'Failed to load documents' });
      }
    } catch {
      addToast({ type: 'error', title: 'Connection Error', message: 'Failed to fetch knowledge library.' });
    } finally {
      setLoading(false);
    }
  };

  const handleIngestDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newContent.trim()) {
      addToast({ type: 'warning', title: 'Required Fields', message: 'Document title and content are required.' });
      return;
    }

    setIsIngesting(true);
    try {
      const res = await fetch('/api/knowledge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newTitle.trim(),
          fileName: `${newTitle.toLowerCase().replace(/\s+/g, '_')}.${newFileType.toLowerCase()}`,
          fileType: newFileType,
          content: newContent,
          department: newDept,
          accessScope: newAccessScope,
        }),
      });
      const data = await res.json();
      if (data.success) {
        addToast({
          type: 'success',
          title: 'Document Indexed',
          message: `Successfully chunked and embedded into ${data.chunkCount} semantic vectors.`,
        });
        setShowUploadModal(false);
        setNewTitle('');
        setNewContent('');
        loadDocuments();
      } else {
        addToast({ type: 'error', title: 'Ingestion Failed', message: data.error || 'Could not ingest document' });
      }
    } catch {
      addToast({ type: 'error', title: 'Error', message: 'Failed to communicate with ingestion service.' });
    } finally {
      setIsIngesting(false);
    }
  };

  const handleDeleteDocument = async (docId: string, title: string) => {
    if (!confirm(`Are you sure you want to delete and revoke all vector embeddings for "${title}"?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/knowledge/${docId}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        addToast({ type: 'success', title: 'Document Revoked', message: 'Document removed from vector store.' });
        setDocuments((prev) => prev.filter((d) => d.id !== docId));
      } else {
        addToast({ type: 'error', title: 'Delete Failed', message: data.error || 'Failed to delete' });
      }
    } catch {
      addToast({ type: 'error', title: 'Error', message: 'Failed to delete document.' });
    }
  };

  const handleRagSearch = async (queryText?: string) => {
    const text = queryText || ragQuery;
    if (!text.trim() || isQuerying) return;

    setIsQuerying(true);
    try {
      const res = await fetch('/api/knowledge/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: text.trim() }),
      });
      const data = await res.json();
      if (data.success) {
        setRagResult(data.result);
        setRagQuery('');
      } else {
        addToast({ type: 'error', title: 'Query Failed', message: data.error || 'Failed to process RAG query' });
      }
    } catch {
      addToast({ type: 'error', title: 'Error', message: 'Failed to reach RAG knowledge service' });
    } finally {
      setIsQuerying(false);
    }
  };

  const filteredDocs = documents.filter((d) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      d.title.toLowerCase().includes(q) ||
      d.fileName.toLowerCase().includes(q) ||
      d.department?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="min-h-screen bg-bloom-bg dark:bg-slate-950 text-slate-800 dark:text-slate-100 flex flex-col font-sans transition-colors">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-8 py-8 space-y-8 animate-fadeIn">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs font-semibold text-purple-600 dark:text-purple-400">
              <Link href="/dashboard" className="hover:underline">
                Dashboard
              </Link>
              <span>/</span>
              <span className="text-slate-400">Intelligence Suite</span>
              <span>/</span>
              <span className="text-slate-800 dark:text-white font-bold">Knowledge Base</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight flex items-center gap-3">
              <BookOpen className="w-8 h-8 text-purple-600 dark:text-purple-400" />
              RAG Knowledge Intelligence & Vector Q&A
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              Corporate SOPs, policies, and playbooks indexed with 384-dimensional dense semantic vectors.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={loadDocuments}
              className="dark:bg-slate-900 dark:border-slate-700"
              icon={<RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />}
            >
              Refresh
            </Button>

            <Button
              variant="primary"
              size="sm"
              onClick={() => setShowUploadModal(true)}
              className="bg-purple-600 hover:bg-purple-500 text-white shadow-md"
              icon={<Plus className="w-4 h-4" />}
            >
              Ingest Document
            </Button>
          </div>
        </div>

        {/* Interactive Grounded Vector RAG Console */}
        <GlassCard
          variant="white"
          className="p-6 space-y-5 border-2 border-purple-200 dark:border-purple-900/60 shadow-xl"
        >
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="space-y-1">
              <h2 className="text-base sm:text-lg font-bold text-bloom-dark dark:text-white flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-purple-600 animate-pulse" />
                Query Corporate Vector Embeddings (RAG)
              </h2>
              <p className="text-xs text-slate-500">
                Ground answers strictly in verified company policies with cosine similarity and exact citations.
              </p>
            </div>
            <Badge variant="purple">Hallucination Protected</Badge>
          </div>

          {/* Quick Grounded Prompts */}
          <div className="flex items-center gap-2 flex-wrap text-xs">
            <span className="text-slate-400 font-semibold text-[11px]">Recommended Inquiries:</span>
            {[
              'What is the lead qualification criteria and high-value prospect threshold?',
              'What are the approval tiers for contract discounting?',
              'What is the leave encashment policy and notice period?',
              'What is our customer support SLA for critical priority tickets?',
            ].map((q) => (
              <button
                key={q}
                onClick={() => handleRagSearch(q)}
                className="bg-purple-50 dark:bg-purple-950/50 hover:bg-purple-100 dark:hover:bg-purple-900 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 rounded-full px-3 py-1 text-[11px] transition-all text-left"
              >
                {q}
              </button>
            ))}
          </div>

          {/* Search Bar */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={ragQuery}
                onChange={(e) => setRagQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleRagSearch()}
                placeholder="Ask e.g. 'What is our refund escalation policy or employee notice period?'"
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl pl-11 pr-4 py-3 text-xs sm:text-sm text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
              />
            </div>
            <Button
              variant="primary"
              size="md"
              disabled={isQuerying || !ragQuery.trim()}
              onClick={() => handleRagSearch()}
              className="bg-purple-600 hover:bg-purple-500 text-white rounded-2xl px-5"
              icon={isQuerying ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            >
              Retrieve
            </Button>
          </div>

          {/* Grounded RAG Result Display */}
          {ragResult && (
            <div className="bg-slate-900 text-white p-6 rounded-2xl space-y-4 shadow-2xl animate-fadeIn">
              <div className="flex items-center justify-between flex-wrap gap-2 border-b border-white/10 pb-3">
                <div className="flex items-center gap-2">
                  <Badge
                    variant={ragResult.insufficientEvidence ? 'warning' : 'success'}
                    className={
                      ragResult.insufficientEvidence
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                        : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                    }
                  >
                    {ragResult.insufficientEvidence ? 'Insufficient Evidence' : 'Verified Policy Evidence'}
                  </Badge>
                  <span className="text-[11px] text-slate-400">
                    Response Latency: {ragResult.latencyMs}ms • Grounded via Swarm Retrieval Tool
                  </span>
                </div>
              </div>

              {/* Synthesized Answer */}
              <div className="text-xs sm:text-sm text-slate-200 leading-relaxed whitespace-pre-line font-sans">
                {ragResult.answer}
              </div>

              {/* Citations Ribbon */}
              {ragResult.sources && ragResult.sources.length > 0 && (
                <div className="pt-3 border-t border-white/10 space-y-3">
                  <div className="text-xs font-bold text-purple-300 flex items-center gap-2">
                    <Database className="w-3.5 h-3.5" />
                    Exact Retrieved Source Citations ({ragResult.sources.length}):
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {ragResult.sources.map((src, idx) => (
                      <div
                        key={idx}
                        className="bg-slate-800/80 border border-slate-700/80 rounded-xl p-3.5 space-y-2 text-xs"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <span className="font-bold text-purple-400 truncate">
                            {src.documentTitle}
                          </span>
                          <span className="text-[10px] bg-purple-900/60 text-purple-200 px-2 py-0.5 rounded-full font-mono shrink-0">
                            {src.similarityScore}% match
                          </span>
                        </div>

                        {src.sectionTitle && (
                          <div className="text-[11px] text-slate-300 font-semibold">
                            § {src.sectionTitle} (Page {src.pageNumber}, Chunk #{src.chunkIndex})
                          </div>
                        )}

                        <p className="text-[11px] text-slate-400 italic line-clamp-3 bg-slate-900/60 p-2 rounded-lg">
                          "{src.snippet}"
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </GlassCard>

        {/* Knowledge Documents Library */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Layers className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              <h2 className="text-base font-bold text-bloom-dark dark:text-white">
                Indexed Corporate Documents ({filteredDocs.length})
              </h2>
            </div>

            {/* Department Filter & Search */}
            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-full text-[11px] font-semibold">
                {['ALL', 'Sales', 'Finance', 'HR', 'Support'].map((dept) => (
                  <button
                    key={dept}
                    onClick={() => setSelectedDept(dept)}
                    className={`px-3 py-1 rounded-full transition-all ${
                      selectedDept === dept
                        ? 'bg-purple-600 text-white'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    {dept}
                  </button>
                ))}
              </div>

              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Filter documents..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-full pl-8 pr-3 py-1 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-purple-500"
                />
              </div>
            </div>
          </div>

          {/* Documents Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredDocs.length === 0 ? (
              <div className="col-span-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 text-center text-xs text-slate-400">
                No indexed documents found matching the filter criteria.
              </div>
            ) : (
              filteredDocs.map((doc) => (
                <GlassCard
                  key={doc.id}
                  variant="white"
                  className="p-5 space-y-3 flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <Badge variant="purple">{doc.fileType}</Badge>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {(doc.fileSize / 1024).toFixed(1)} KB
                      </span>
                    </div>

                    <h3 className="text-xs sm:text-sm font-bold text-bloom-dark dark:text-white line-clamp-2">
                      {doc.title}
                    </h3>

                    <div className="flex items-center gap-2 text-[11px] text-slate-500">
                      <FileText className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{doc.fileName}</span>
                    </div>
                  </div>

                  <div className="space-y-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                    <div className="flex items-center justify-between text-[11px] text-slate-500">
                      <span>Department:</span>
                      <span className="font-semibold text-slate-700 dark:text-slate-200">
                        {doc.department || 'General'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-500">
                      <span>Vector Chunks:</span>
                      <span className="font-bold text-purple-600 dark:text-purple-400">
                        {doc.chunkCount} Chunks
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-500">
                      <span>Access Scope:</span>
                      <span className="text-[10px] uppercase font-bold text-emerald-600 dark:text-emerald-400">
                        {doc.accessScope}
                      </span>
                    </div>

                    <div className="pt-2 flex items-center justify-end">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteDocument(doc.id, doc.title)}
                        className="text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 text-[11px] px-2 py-1"
                        icon={<Trash2 className="w-3 h-3" />}
                      >
                        Revoke
                      </Button>
                    </div>
                  </div>
                </GlassCard>
              ))
            )}
          </div>
        </div>

        {/* Document Ingestion Modal */}
        {showUploadModal && (
          <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-2xl w-full p-6 space-y-4 shadow-2xl animate-scaleUp">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-purple-600" />
                  <h3 className="text-base font-bold text-bloom-dark dark:text-white">
                    Ingest & Vectorize Corporate Knowledge
                  </h3>
                </div>
                <button
                  onClick={() => setShowUploadModal(false)}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleIngestDocument} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Document Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="e.g. Enterprise Security & Encryption Standard Operating Procedure"
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2 text-xs text-slate-800 dark:text-white focus:outline-none focus:ring-1 focus:ring-purple-500"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Department
                    </label>
                    <select
                      value={newDept}
                      onChange={(e) => setNewDept(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-white focus:outline-none"
                    >
                      <option value="General">General</option>
                      <option value="Sales">Sales</option>
                      <option value="Finance">Finance</option>
                      <option value="HR">HR</option>
                      <option value="Support">Support</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Format Type
                    </label>
                    <select
                      value={newFileType}
                      onChange={(e) => setNewFileType(e.target.value as DocumentFileType)}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-white focus:outline-none"
                    >
                      <option value="PDF">PDF</option>
                      <option value="TXT">TXT</option>
                      <option value="DOCX">DOCX</option>
                      <option value="MD">Markdown</option>
                      <option value="CSV">CSV</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Access Scope
                    </label>
                    <select
                      value={newAccessScope}
                      onChange={(e) => setNewAccessScope(e.target.value as DocumentAccessScope)}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-white focus:outline-none"
                    >
                      <option value="ORGANIZATION">Organization Wide</option>
                      <option value="ROLE_RESTRICTED">Role Restricted</option>
                      <option value="CONFIDENTIAL">Confidential</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Document Text Content (Paragraphs will be auto-chunked & embedded) *
                  </label>
                  <textarea
                    rows={7}
                    required
                    value={newContent}
                    onChange={(e) => setNewContent(e.target.value)}
                    placeholder="Paste corporate SOP, handbook, policy clauses, or procedure instructions here..."
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-xs text-slate-800 dark:text-white focus:outline-none focus:ring-1 focus:ring-purple-500 font-mono"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowUploadModal(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    size="sm"
                    disabled={isIngesting}
                    className="bg-purple-600 hover:bg-purple-500 text-white"
                    icon={
                      isIngesting ? (
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Sparkles className="w-3.5 h-3.5" />
                      )
                    }
                  >
                    {isIngesting ? 'Chunking & Embedding...' : 'Ingest Document'}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
