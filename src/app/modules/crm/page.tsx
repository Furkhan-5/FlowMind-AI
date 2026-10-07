'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAppStore } from '@/lib/store/useAppStore';
import { Navbar } from '@/components/layout/Navbar';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { businessService } from '@/lib/services/businessService';
import { Lead, LeadStage, LeadStageHistory, Customer360 } from '@/types';
import {
  Building2,
  Plus,
  Search,
  ArrowLeft,
  Sparkles,
  TrendingUp,
  DollarSign,
  User,
  Calendar,
  Tag,
  FileText,
  X,
  CheckCircle2,
  AlertCircle,
  Download,
} from 'lucide-react';

const STAGES: { id: LeadStage; label: string; color: string }[] = [
  { id: 'NEW', label: 'New Leads', color: 'border-blue-400 bg-blue-50/40 text-blue-800' },
  { id: 'CONTACTED', label: 'Contacted', color: 'border-purple-400 bg-purple-50/40 text-purple-800' },
  { id: 'QUALIFIED', label: 'Qualified', color: 'border-indigo-400 bg-indigo-50/40 text-indigo-800' },
  { id: 'PROPOSAL', label: 'Proposal Sent', color: 'border-amber-400 bg-amber-50/40 text-amber-800' },
  { id: 'NEGOTIATION', label: 'Negotiation', color: 'border-orange-400 bg-orange-50/40 text-orange-800' },
  { id: 'WON', label: 'Closed Won', color: 'border-emerald-400 bg-emerald-50/40 text-emerald-800' },
  { id: 'LOST', label: 'Closed Lost', color: 'border-red-400 bg-red-50/40 text-red-800' },
];

export default function CrmModulePage() {
  const { user, addToast } = useAppStore();

  const [leads, setLeads] = useState<Lead[]>([]);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [customer360, setCustomer360] = useState<Customer360 | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);

  // New Lead Form State
  const [newLeadName, setNewLeadName] = useState('');
  const [newLeadCompany, setNewLeadCompany] = useState('');
  const [newLeadEmail, setNewLeadEmail] = useState('');
  const [newLeadValue, setNewLeadValue] = useState(150000);

  useEffect(() => {
    loadLeads();
  }, []);

  const loadLeads = async () => {
    try {
      const data = await businessService.getLeads(user.organizationId || 'ORG-01');
      setLeads(data);
    } catch {
      addToast({ type: 'error', title: 'Error', message: 'Failed to load CRM leads.' });
    }
  };

  const handleStageMove = async (leadId: string, newStage: LeadStage) => {
    try {
      const updated = await businessService.updateLeadStage(leadId, newStage, user);
      if (updated) {
        setLeads((prev) => prev.map((l) => (l.id === leadId ? { ...l, stage: newStage } : l)));
        addToast({ type: 'success', title: 'Stage Updated', message: `Lead moved to ${newStage}` });
      }
    } catch (err: any) {
      addToast({ type: 'error', title: 'Update Failed', message: err?.message });
    }
  };

  const handleCreateLead = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLeadName || !newLeadCompany) return;

    try {
      const created = await businessService.createLead(
        { name: newLeadName, company: newLeadCompany, email: newLeadEmail, value: Number(newLeadValue) },
        user
      );
      setLeads((prev) => [created, ...prev]);
      setShowAddModal(false);
      setNewLeadName('');
      setNewLeadCompany('');
      setNewLeadEmail('');
      addToast({ type: 'success', title: 'Lead Created', message: `Added ${created.company} to CRM.` });
    } catch (err: any) {
      addToast({ type: 'error', title: 'Error', message: err?.message });
    }
  };

  const handleViewCustomer360 = async (lead: Lead) => {
    setSelectedLead(lead);
    const c360 = await businessService.getCustomer360(lead.company, user.organizationId);
    setCustomer360(c360);
  };

  const handleExportCSV = async () => {
    try {
      const csvStr = await businessService.exportModuleData('crm', 'csv', user.organizationId, user.role);
      const blob = new Blob([csvStr], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `CRM_Leads_Export_${Date.now()}.csv`;
      a.click();
      addToast({ type: 'success', title: 'Export Complete', message: 'Exported CRM leads to CSV.' });
    } catch (err: any) {
      addToast({ type: 'error', title: 'Export Failed', message: err?.message });
    }
  };

  const totalValue = leads.reduce((a, b) => a + (b.value || 0), 0);
  const wonValue = leads.filter((l) => l.stage === 'WON').reduce((a, b) => a + (b.value || 0), 0);

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
              <span className="text-xs font-bold text-purple-700">CRM Suite</span>
            </div>
            <h1 className="text-2xl font-black text-bloom-dark tracking-tight flex items-center gap-2">
              <Building2 className="w-6 h-6 text-purple-600" />
              CRM & Pipeline Command Center
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <Button onClick={handleExportCSV} variant="outline" size="sm" className="border border-slate-200 text-xs font-bold">
              <Download className="w-3.5 h-3.5 mr-1" /> Export CSV
            </Button>
            <Button onClick={() => setShowAddModal(true)} variant="dark" size="sm" className="bg-purple-600 hover:bg-purple-500 font-bold text-xs">
              <Plus className="w-4 h-4 mr-1" /> Add Lead
            </Button>
          </div>
        </div>

        {/* Pipeline Metrics Summary */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <GlassCard variant="white" className="p-4 border-l-4 border-l-purple-600">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Pipeline Value</span>
            <div className="text-xl font-black text-bloom-dark mt-1">₹{totalValue.toLocaleString()}</div>
          </GlassCard>
          <GlassCard variant="white" className="p-4 border-l-4 border-l-emerald-600">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Closed Won Revenue</span>
            <div className="text-xl font-black text-emerald-600 mt-1">₹{wonValue.toLocaleString()}</div>
          </GlassCard>
          <GlassCard variant="white" className="p-4 border-l-4 border-l-indigo-600">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Active Deals</span>
            <div className="text-xl font-black text-bloom-dark mt-1">{leads.length} Prospects</div>
          </GlassCard>
        </div>

        {/* Visual CRM Pipeline Board */}
        <div className="space-y-3">
          <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wider">Visual Deal Pipeline Board</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-7 gap-3 overflow-x-auto pb-4">
            {STAGES.map((stg) => {
              const stageLeads = leads.filter((l) => l.stage === stg.id);
              return (
                <div key={stg.id} className="bg-slate-100/70 border border-slate-200/80 rounded-2xl p-3 min-w-[200px] flex flex-col space-y-3">
                  <div className={`px-2.5 py-1 rounded-xl text-xs font-extrabold border flex items-center justify-between ${stg.color}`}>
                    <span>{stg.label}</span>
                    <span className="px-1.5 py-0.5 rounded-md bg-white/80 text-[10px]">{stageLeads.length}</span>
                  </div>

                  <div className="space-y-2 flex-1">
                    {stageLeads.map((lead) => (
                      <div
                        key={lead.id}
                        onClick={() => handleViewCustomer360(lead)}
                        className="bg-white border border-slate-200 hover:border-purple-400 rounded-xl p-3 shadow-sm hover:shadow-md transition-all cursor-pointer space-y-2 group"
                      >
                        <div className="flex items-center justify-between">
                          <h4 className="text-xs font-bold text-bloom-dark group-hover:text-purple-700 transition-colors truncate">{lead.company}</h4>
                          <Badge variant="purple">{lead.score} pts</Badge>
                        </div>
                        <p className="text-[11px] text-slate-500 truncate">{lead.name}</p>
                        <div className="text-xs font-extrabold text-emerald-600">₹{lead.value.toLocaleString()}</div>

                        {/* Stage Selector */}
                        <select
                          value={lead.stage}
                          onClick={(e) => e.stopPropagation()}
                          onChange={(e) => handleStageMove(lead.id, e.target.value as LeadStage)}
                          className="w-full bg-slate-50 border border-slate-200 text-[10px] font-bold text-slate-700 rounded-lg px-2 py-1 mt-1 focus:outline-none"
                        >
                          {STAGES.map((s) => (
                            <option key={s.id} value={s.id}>{s.label}</option>
                          ))}
                        </select>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Lead Detail & Customer 360 Modal Drawer */}
        {selectedLead && customer360 && (
          <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
            <div className="bg-white text-bloom-textDark w-full max-w-4xl max-h-[85vh] rounded-[28px] border border-slate-200 shadow-2xl overflow-hidden flex flex-col">
              <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge variant="purple">Customer 360 View</Badge>
                  <h3 className="text-base font-extrabold text-bloom-dark">{customer360.customerName}</h3>
                </div>
                <button onClick={() => setSelectedLead(null)} className="p-1 rounded-full hover:bg-slate-200 text-slate-500">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 overflow-y-auto space-y-6 flex-1">
                {/* AI Risk Summary Card */}
                <div className="p-4 bg-purple-50 border border-purple-200 rounded-2xl text-xs font-semibold text-purple-900">
                  {customer360.aiRiskSummary}
                </div>

                {/* Related Invoices & Tickets Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <GlassCard variant="white" className="space-y-2 p-4">
                    <h4 className="text-xs font-bold text-bloom-dark uppercase tracking-wider">Related Invoices ({customer360.invoices.length})</h4>
                    {customer360.invoices.map((inv) => (
                      <div key={inv.id} className="flex items-center justify-between text-xs p-2 bg-slate-50 rounded-xl border border-slate-100">
                        <span className="font-mono font-bold text-purple-700">{inv.invoiceNumber}</span>
                        <span className="font-bold text-emerald-600">₹{inv.total.toLocaleString()}</span>
                        <Badge variant={inv.status === 'PAID' ? 'success' : 'warning'}>{inv.status}</Badge>
                      </div>
                    ))}
                  </GlassCard>

                  <GlassCard variant="white" className="space-y-2 p-4">
                    <h4 className="text-xs font-bold text-bloom-dark uppercase tracking-wider">Related Support Tickets ({customer360.tickets.length})</h4>
                    {customer360.tickets.map((t) => (
                      <div key={t.id} className="flex items-center justify-between text-xs p-2 bg-slate-50 rounded-xl border border-slate-100">
                        <span className="font-mono font-bold text-cyan-700">{t.ticketNumber}</span>
                        <span className="truncate max-w-[120px] font-semibold">{t.title}</span>
                        <Badge variant="purple">{t.priority}</Badge>
                      </div>
                    ))}
                  </GlassCard>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Add Lead Form Modal */}
        {showAddModal && (
          <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
            <form onSubmit={handleCreateLead} className="bg-white w-full max-w-md rounded-[28px] border border-slate-200 p-6 shadow-2xl space-y-4">
              <div className="flex items-center justify-between border-b pb-3">
                <h3 className="text-base font-extrabold text-bloom-dark">Create New CRM Lead</h3>
                <button type="button" onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="font-bold text-slate-700">Contact Name</label>
                  <input
                    type="text"
                    required
                    value={newLeadName}
                    onChange={(e) => setNewLeadName(e.target.value)}
                    placeholder="e.g. Ramesh Kumar"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-bloom-dark font-medium mt-1"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700">Company Name</label>
                  <input
                    type="text"
                    required
                    value={newLeadCompany}
                    onChange={(e) => setNewLeadCompany(e.target.value)}
                    placeholder="e.g. Reliance Tech Solutions"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-bloom-dark font-medium mt-1"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700">Email Address</label>
                  <input
                    type="email"
                    value={newLeadEmail}
                    onChange={(e) => setNewLeadEmail(e.target.value)}
                    placeholder="ramesh@company.in"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-bloom-dark font-medium mt-1"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700">Deal Value (₹)</label>
                  <input
                    type="number"
                    value={newLeadValue}
                    onChange={(e) => setNewLeadValue(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-bloom-dark font-medium mt-1"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <Button type="button" onClick={() => setShowAddModal(false)} variant="outline" size="sm">Cancel</Button>
                <Button type="submit" variant="dark" size="sm" className="bg-purple-600 hover:bg-purple-500 font-bold">Save Lead</Button>
              </div>
            </form>
          </div>
        )}
      </main>
    </div>
  );
}
