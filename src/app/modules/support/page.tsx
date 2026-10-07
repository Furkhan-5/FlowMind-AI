'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAppStore } from '@/lib/store/useAppStore';
import { Navbar } from '@/components/layout/Navbar';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { businessService } from '@/lib/services/businessService';
import { SupportTicket, TicketPriority, TicketStatus } from '@/types';
import {
  LifeBuoy,
  Plus,
  ArrowLeft,
  AlertCircle,
  CheckCircle2,
  Clock,
  Sparkles,
  Download,
  X,
} from 'lucide-react';

export default function SupportModulePage() {
  const { user, addToast } = useAppStore();

  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);

  // Form State
  const [custName, setCustName] = useState('');
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [priority, setPriority] = useState<TicketPriority>('MEDIUM');

  useEffect(() => {
    loadTickets();
  }, []);

  const loadTickets = async () => {
    try {
      const data = await businessService.getTickets(user.organizationId || 'ORG-01');
      setTickets(data);
    } catch {
      addToast({ type: 'error', title: 'Error', message: 'Failed to load tickets dataset.' });
    }
  };

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !desc) return;

    try {
      const created = await businessService.createTicket({ customerName: custName, title, description: desc, priority }, user);
      setTickets((prev) => [created, ...prev]);
      setShowAddModal(false);
      setTitle('');
      setDesc('');
      addToast({ type: 'success', title: 'Ticket Created', message: `Filed support ticket ${created.ticketNumber}.` });
    } catch (err: any) {
      addToast({ type: 'error', title: 'Error', message: err?.message });
    }
  };

  const handleExportCSV = async () => {
    try {
      const csvStr = await businessService.exportModuleData('support', 'csv', user.organizationId, user.role);
      const blob = new Blob([csvStr], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Support_Tickets_Export_${Date.now()}.csv`;
      a.click();
      addToast({ type: 'success', title: 'Export Complete', message: 'Exported support tickets to CSV.' });
    } catch (err: any) {
      addToast({ type: 'error', title: 'Export Failed', message: err?.message });
    }
  };

  return (
    <div className="min-h-screen bg-bloom-bg text-bloom-textDark font-sans selection:bg-purple-200">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-8 py-8 space-y-6 pb-24">
        {/* Header Breadcrumb Banner */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-slate-200 rounded-[28px] p-6 shadow-bloom">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Link href="/modules" className="text-xs font-bold text-slate-500 hover:text-purple-700 flex items-center gap-1">
                <ArrowLeft className="w-3.5 h-3.5" /> Modules
              </Link>
              <span className="text-xs text-slate-300">/</span>
              <span className="text-xs font-bold text-cyan-700">Support Helpdesk</span>
            </div>
            <h1 className="text-2xl font-black text-bloom-dark tracking-tight flex items-center gap-2">
              <LifeBuoy className="w-6 h-6 text-cyan-600" />
              Customer Support & SLA Desk
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <Button onClick={handleExportCSV} variant="outline" size="sm" className="border border-slate-200 text-xs font-bold">
              <Download className="w-3.5 h-3.5 mr-1" /> Export CSV
            </Button>
            <Button onClick={() => setShowAddModal(true)} variant="dark" size="sm" className="bg-cyan-600 hover:bg-cyan-500 font-bold text-xs">
              <Plus className="w-4 h-4 mr-1" /> File Ticket
            </Button>
          </div>
        </div>

        {/* Tickets Queue Table */}
        <section className="bg-white border border-slate-200 rounded-[28px] p-6 shadow-bloom space-y-4">
          <h2 className="text-base font-extrabold text-bloom-dark">Active Support Tickets Queue ({tickets.length})</h2>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-100 text-slate-700 font-bold uppercase text-[10px]">
                <tr>
                  <th className="p-3">Ticket #</th>
                  <th className="p-3">Customer</th>
                  <th className="p-3">Issue Subject</th>
                  <th className="p-3">Priority</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {tickets.map((t) => (
                  <tr key={t.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="p-3 font-mono font-bold text-cyan-700">{t.ticketNumber}</td>
                    <td className="p-3 font-bold text-bloom-dark">{t.customerName}</td>
                    <td className="p-3 text-slate-700 font-semibold">{t.title}</td>
                    <td className="p-3">
                      <Badge variant={t.priority === 'CRITICAL' || t.priority === 'HIGH' ? 'warning' : 'purple'}>
                        {t.priority}
                      </Badge>
                    </td>
                    <td className="p-3">
                      <Badge variant={t.status === 'RESOLVED' ? 'success' : 'purple'}>
                        {t.status}
                      </Badge>
                    </td>
                    <td className="p-3">
                      <button onClick={() => setSelectedTicket(t)} className="text-cyan-600 hover:underline font-bold">
                        View Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Ticket Detail Drawer Modal */}
        {selectedTicket && (
          <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
            <div className="bg-white text-bloom-textDark w-full max-w-2xl rounded-[28px] border border-slate-200 shadow-2xl p-6 space-y-4">
              <div className="flex items-center justify-between border-b pb-3">
                <div className="flex items-center gap-2">
                  <Badge variant="cyan">{selectedTicket.ticketNumber}</Badge>
                  <h3 className="text-base font-extrabold text-bloom-dark">{selectedTicket.title}</h3>
                </div>
                <button onClick={() => setSelectedTicket(null)} className="text-slate-400 hover:text-slate-600">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div><strong>Customer:</strong> {selectedTicket.customerName}</div>
                <div><strong>Priority:</strong> {selectedTicket.priority}</div>
                <div><strong>Status:</strong> {selectedTicket.status}</div>
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                  <strong>Issue Description:</strong>
                  <p className="mt-1 text-slate-600">{selectedTicket.description}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Create Ticket Modal */}
        {showAddModal && (
          <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
            <form onSubmit={handleCreateTicket} className="bg-white w-full max-w-md rounded-[28px] border border-slate-200 p-6 shadow-2xl space-y-4">
              <div className="flex items-center justify-between border-b pb-3">
                <h3 className="text-base font-extrabold text-bloom-dark">File New Support Ticket</h3>
                <button type="button" onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="font-bold text-slate-700">Customer Name</label>
                  <input
                    type="text"
                    required
                    value={custName}
                    onChange={(e) => setCustName(e.target.value)}
                    placeholder="e.g. Acme FinTech"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-bloom-dark font-medium mt-1"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700">Issue Subject</label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. DAG Node Webhook Timeout"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-bloom-dark font-medium mt-1"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700">Priority SLA</label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-bloom-dark font-semibold mt-1"
                  >
                    <option value="LOW">LOW</option>
                    <option value="MEDIUM">MEDIUM</option>
                    <option value="HIGH">HIGH</option>
                    <option value="CRITICAL">CRITICAL</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-700">Detailed Description</label>
                  <textarea
                    required
                    value={desc}
                    onChange={(e) => setDesc(e.target.value)}
                    placeholder="Describe issue symptoms..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-bloom-dark font-medium mt-1 h-20"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <Button type="button" onClick={() => setShowAddModal(false)} variant="outline" size="sm">Cancel</Button>
                <Button type="submit" variant="dark" size="sm" className="bg-cyan-600 hover:bg-cyan-500 font-bold">File Ticket</Button>
              </div>
            </form>
          </div>
        )}
      </main>
    </div>
  );
}
