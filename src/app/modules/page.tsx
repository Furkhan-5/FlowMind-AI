'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAppStore } from '@/lib/store/useAppStore';
import { Navbar } from '@/components/layout/Navbar';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { businessService } from '@/lib/services/businessService';
import { BusinessInsight, Lead, Invoice, Employee, Product, SupportTicket } from '@/types';
import {
  Building2,
  Users,
  DollarSign,
  Box,
  LifeBuoy,
  Sparkles,
  ArrowRight,
  Plus,
  Search,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  ShieldCheck,
  FileSpreadsheet,
  Download,
  Activity,
  Layers,
} from 'lucide-react';

export default function BusinessModulesHubPage() {
  const { user, addToast } = useAppStore();

  const [insights, setInsights] = useState<BusinessInsight[]>([]);
  const [stats, setStats] = useState({
    totalLeads: 0,
    pipelineValue: 0,
    totalEmployees: 0,
    outstandingInvoices: 0,
    lowStockCount: 0,
    openTickets: 0,
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const crmStats = await businessService.getCrmStats(user.organizationId || 'ORG-01');
      const employees = await businessService.getEmployees(user.organizationId || 'ORG-01', user.role);
      const invoices = await businessService.getInvoices(user.organizationId || 'ORG-01');
      const products = await businessService.getProducts(user.organizationId || 'ORG-01');
      const tickets = await businessService.getTickets(user.organizationId || 'ORG-01');
      const realInsights = await businessService.getBusinessInsights(user.organizationId || 'ORG-01');

      const outstanding = invoices.filter((i) => i.status !== 'PAID' && i.status !== 'CANCELLED').reduce((a, b) => a + b.total, 0);
      const lowStock = products.filter((p) => p.quantity <= p.reorderLevel).length;
      const openTix = tickets.filter((t) => t.status === 'OPEN' || t.status === 'IN_PROGRESS').length;

      setStats({
        totalLeads: crmStats.totalLeads,
        pipelineValue: crmStats.pipelineValue,
        totalEmployees: employees.length,
        outstandingInvoices: outstanding,
        lowStockCount: lowStock,
        openTickets: openTix,
      });

      setInsights(realInsights);
    } catch (err: any) {
      console.error('Failed to load business module stats:', err);
    }
  };

  const handleGlobalSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    setIsSearching(true);
    try {
      const q = searchQuery.toLowerCase();
      const leads = await businessService.getLeads();
      const emps = await businessService.getEmployees(user.organizationId, user.role);
      const invs = await businessService.getInvoices();
      const tix = await businessService.getTickets();

      const matchedLeads = leads.filter((l) => l.name.toLowerCase().includes(q) || l.company.toLowerCase().includes(q)).map((l) => ({ type: 'CRM Lead', name: `${l.name} (${l.company})`, status: l.stage, route: '/modules/crm' }));
      const matchedEmps = emps.filter((e) => e.name.toLowerCase().includes(q) || e.department.toLowerCase().includes(q)).map((e) => ({ type: 'Employee', name: `${e.name} - ${e.designation}`, status: e.employmentStatus, route: '/modules/hr' }));
      const matchedInvs = invs.filter((i) => i.invoiceNumber.toLowerCase().includes(q) || i.customerName.toLowerCase().includes(q)).map((i) => ({ type: 'Invoice', name: `${i.invoiceNumber} (${i.customerName})`, status: i.status, route: '/modules/finance' }));
      const matchedTix = tix.filter((t) => t.ticketNumber.toLowerCase().includes(q) || t.title.toLowerCase().includes(q)).map((t) => ({ type: 'Support Ticket', name: `${t.ticketNumber} - ${t.title}`, status: t.status, route: '/modules/support' }));

      setSearchResults([...matchedLeads, ...matchedEmps, ...matchedInvs, ...matchedTix]);
    } catch {
      addToast({ type: 'error', title: 'Search Error', message: 'Failed to search business records.' });
    } finally {
      setIsSearching(false);
    }
  };

  const handleExportAllJSON = async () => {
    try {
      const dataStr = await businessService.exportModuleData('crm', 'json', user.organizationId, user.role);
      const blob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `FlowMind_Business_Suite_Export_${Date.now()}.json`;
      a.click();
      addToast({ type: 'success', title: 'Export Complete', message: 'Downloaded authorized business suite dataset.' });
    } catch (err: any) {
      addToast({ type: 'error', title: 'Export Failed', message: err?.message });
    }
  };

  return (
    <div className="min-h-screen bg-bloom-bg text-bloom-textDark font-sans selection:bg-purple-200">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-8 py-8 space-y-8 pb-24">
        {/* Header Title Banner */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900 text-white rounded-[28px] p-6 shadow-2xl border border-white/10 relative overflow-hidden">
          <div className="space-y-2 z-10">
            <div className="flex items-center gap-2 text-cyan-400 text-xs font-black tracking-widest uppercase">
              <Sparkles className="w-4 h-4" />
              <span>Integrated Business Operations Suite</span>
              <Badge variant="purple">Week 5 Release</Badge>
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight text-white">
              Business Command Center
            </h1>
            <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
              Unified PostgreSQL persistence, role-based governance, and real-time AI agent swarm integration across CRM, HR, Finance, Inventory, and Support.
            </p>
          </div>

          <div className="flex items-center gap-3 z-10">
            <Button
              onClick={handleExportAllJSON}
              variant="dark"
              size="sm"
              className="bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-bold rounded-full flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Suite JSON</span>
            </Button>
          </div>
        </div>

        {/* Global Unified Search Bar */}
        <form onSubmit={handleGlobalSearch} className="relative">
          <div className="relative flex items-center">
            <Search className="w-4 h-4 text-slate-400 absolute left-4 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Unified Global Search across Leads, Employees, Invoices, Products, and Support Tickets..."
              className="w-full bg-white border border-slate-200 rounded-full pl-11 pr-24 py-3 text-xs text-bloom-dark placeholder-slate-400 font-semibold focus:outline-none focus:border-purple-500 shadow-sm transition-all"
            />
            <button
              type="submit"
              className="absolute right-2 px-4 py-1.5 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs rounded-full transition-all"
            >
              Search
            </button>
          </div>

          {searchResults.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-200 rounded-2xl p-4 shadow-2xl z-30 space-y-2 max-h-60 overflow-y-auto">
              <div className="text-[10px] font-bold text-purple-700 uppercase tracking-wider">Search Results ({searchResults.length})</div>
              <div className="space-y-1.5">
                {searchResults.map((res, idx) => (
                  <Link
                    key={idx}
                    href={res.route}
                    className="flex items-center justify-between p-2 rounded-xl hover:bg-slate-50 border border-slate-100 text-xs transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <Badge variant="purple">{res.type}</Badge>
                      <span className="font-bold text-bloom-dark">{res.name}</span>
                    </div>
                    <span className="text-[11px] font-semibold text-slate-500">{res.status}</span>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </form>

        {/* Top Operational Metrics KPI Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <GlassCard variant="white" className="space-y-1 p-5 border-l-4 border-l-purple-600 shadow-bloom">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-[11px] font-bold uppercase tracking-wider">CRM Leads</span>
              <Building2 className="w-4 h-4 text-purple-600" />
            </div>
            <div className="text-2xl font-black text-bloom-dark">{stats.totalLeads}</div>
            <div className="text-[11px] font-bold text-emerald-600 flex items-center gap-1">
              <span>₹{(stats.pipelineValue / 100000).toFixed(2)}L Pipeline</span>
            </div>
          </GlassCard>

          <GlassCard variant="white" className="space-y-1 p-5 border-l-4 border-l-indigo-600 shadow-bloom">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-[11px] font-bold uppercase tracking-wider">HR Employees</span>
              <Users className="w-4 h-4 text-indigo-600" />
            </div>
            <div className="text-2xl font-black text-bloom-dark">{stats.totalEmployees}</div>
            <div className="text-[11px] font-bold text-slate-500">Active Staff Directory</div>
          </GlassCard>

          <GlassCard variant="white" className="space-y-1 p-5 border-l-4 border-l-amber-600 shadow-bloom">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-[11px] font-bold uppercase tracking-wider">Outstanding Invoices</span>
              <DollarSign className="w-4 h-4 text-amber-600" />
            </div>
            <div className="text-2xl font-black text-bloom-dark">₹{stats.outstandingInvoices.toLocaleString()}</div>
            <div className="text-[11px] font-bold text-amber-600">Pending & Overdue</div>
          </GlassCard>

          <GlassCard variant="white" className="space-y-1 p-5 border-l-4 border-l-emerald-600 shadow-bloom">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-[11px] font-bold uppercase tracking-wider">Low Stock Alerts</span>
              <Box className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-2xl font-black text-bloom-dark">{stats.lowStockCount}</div>
            <div className="text-[11px] font-bold text-emerald-600">Threshold Reached</div>
          </GlassCard>

          <GlassCard variant="white" className="space-y-1 p-5 border-l-4 border-l-cyan-600 shadow-bloom">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-[11px] font-bold uppercase tracking-wider">Open Support Tickets</span>
              <LifeBuoy className="w-4 h-4 text-cyan-600" />
            </div>
            <div className="text-2xl font-black text-bloom-dark">{stats.openTickets}</div>
            <div className="text-[11px] font-bold text-cyan-600">Active Queue</div>
          </GlassCard>
        </div>

        {/* 5 Core Domain Business Modules Grid */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-black text-bloom-dark tracking-tight">
              Enterprise Domain Modules
            </h2>
            <span className="text-xs font-semibold text-slate-500">Click module card to launch full operating workspace</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-5">
            {/* 1. CRM Module */}
            <Link
              href="/modules/crm"
              className="p-6 rounded-[24px] bg-white border border-purple-200/80 hover:border-purple-500 hover:shadow-2xl transition-all group flex flex-col justify-between space-y-4"
            >
              <div className="space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-purple-600 text-white flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                  <Building2 className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-bloom-dark group-hover:text-purple-700 transition-colors">
                    1. CRM Suite
                  </h3>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    Lead pipeline board, stage movement history, notes, and AI Sales Intelligence.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1 text-xs font-bold text-purple-700 pt-2 border-t border-slate-100">
                <span>Launch CRM</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>

            {/* 2. HR Module */}
            <Link
              href="/modules/hr"
              className="p-6 rounded-[24px] bg-white border border-indigo-200/80 hover:border-indigo-500 hover:shadow-2xl transition-all group flex flex-col justify-between space-y-4"
            >
              <div className="space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                  <Users className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-bloom-dark group-hover:text-indigo-700 transition-colors">
                    2. HR & Workforce
                  </h3>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    Staff directory, leave approval governance, payroll security engine.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1 text-xs font-bold text-indigo-700 pt-2 border-t border-slate-100">
                <span>Launch HR</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>

            {/* 3. Finance Module */}
            <Link
              href="/modules/finance"
              className="p-6 rounded-[24px] bg-white border border-amber-200/80 hover:border-amber-500 hover:shadow-2xl transition-all group flex flex-col justify-between space-y-4"
            >
              <div className="space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-amber-600 text-white flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                  <DollarSign className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-bloom-dark group-hover:text-amber-700 transition-colors">
                    3. Finance & Invoicing
                  </h3>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    Invoice lifecycle manager, GST tax breakdowns, PDF invoice download.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1 text-xs font-bold text-amber-700 pt-2 border-t border-slate-100">
                <span>Launch Finance</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>

            {/* 4. Inventory Module */}
            <Link
              href="/modules/inventory"
              className="p-6 rounded-[24px] bg-white border border-emerald-200/80 hover:border-emerald-500 hover:shadow-2xl transition-all group flex flex-col justify-between space-y-4"
            >
              <div className="space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                  <Box className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-bloom-dark group-hover:text-emerald-700 transition-colors">
                    4. Inventory & Stock
                  </h3>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    Products catalog, stock movements history, low-stock reorder triggers.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1 text-xs font-bold text-emerald-700 pt-2 border-t border-slate-100">
                <span>Launch Inventory</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>

            {/* 5. Support Module */}
            <Link
              href="/modules/support"
              className="p-6 rounded-[24px] bg-white border border-cyan-200/80 hover:border-cyan-500 hover:shadow-2xl transition-all group flex flex-col justify-between space-y-4"
            >
              <div className="space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-cyan-600 text-white flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                  <LifeBuoy className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-bloom-dark group-hover:text-cyan-700 transition-colors">
                    5. Support Helpdesk
                  </h3>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    Tickets queue, priority SLAs, assignment, AI ticket summarization.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1 text-xs font-bold text-cyan-700 pt-2 border-t border-slate-100">
                <span>Launch Support</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>
          </div>
        </section>

        {/* Real FlowMind AI Insights Panel */}
        <section className="bg-white border border-slate-200/80 rounded-[32px] p-6 shadow-bloom space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-600 animate-pulse" />
              <h3 className="text-lg font-extrabold text-bloom-dark">
                FlowMind AI Autonomous Insights
              </h3>
            </div>
            <Badge variant="purple">Live Data Swarm</Badge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {insights.map((ins) => (
              <div
                key={ins.id}
                className="p-4 rounded-2xl border border-slate-200 bg-slate-50/70 hover:bg-slate-50 transition-colors space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-purple-700 uppercase tracking-wider">
                    {ins.module} Domain Insight
                  </span>
                  <Badge variant={ins.type === 'WARNING' || ins.type === 'ALERT' ? 'warning' : 'purple'}>
                    {ins.type}
                  </Badge>
                </div>
                <h4 className="text-sm font-bold text-bloom-dark">{ins.title}</h4>
                <p className="text-xs text-slate-600 leading-relaxed">{ins.description}</p>
                {ins.actionModule && (
                  <Link
                    href={`/modules/${ins.actionModule}`}
                    className="inline-flex items-center gap-1 text-xs font-bold text-purple-600 hover:text-purple-700 pt-1"
                  >
                    <span>{ins.actionLabel || 'View Details'}</span>
                    <ArrowRight className="w-3 h-3" />
                  </Link>
                )}
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
