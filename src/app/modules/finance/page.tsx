'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAppStore } from '@/lib/store/useAppStore';
import { Navbar } from '@/components/layout/Navbar';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { businessService } from '@/lib/services/businessService';
import { downloadInvoiceFile, openInvoicePreview } from '@/lib/utils/invoiceGenerator';
import { Invoice, InvoiceStatus } from '@/types';
import {
  DollarSign,
  Plus,
  ArrowLeft,
  FileText,
  Download,
  Printer,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Sparkles,
  X,
} from 'lucide-react';

export default function FinanceModulePage() {
  const { user, addToast } = useAppStore();

  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);

  // Form State
  const [custName, setCustName] = useState('');
  const [custEmail, setCustEmail] = useState('');
  const [itemDesc, setItemDesc] = useState('FlowMind Enterprise License');
  const [amount, setAmount] = useState(250000);

  useEffect(() => {
    loadInvoices();
  }, []);

  const loadInvoices = async () => {
    try {
      const data = await businessService.getInvoices(user.organizationId || 'ORG-01');
      setInvoices(data);
    } catch {
      addToast({ type: 'error', title: 'Error', message: 'Failed to load invoices dataset.' });
    }
  };

  const handleCreateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!custName || !amount) return;

    try {
      const created = await businessService.createInvoice(
        {
          customerName: custName,
          customerEmail: custEmail,
          subtotal: Number(amount),
          items: [{ id: 'i-1', description: itemDesc, quantity: 1, unitPrice: Number(amount), amount: Number(amount) }],
        },
        user
      );
      setInvoices((prev) => [created, ...prev]);
      setShowAddModal(false);
      setCustName('');
      setCustEmail('');
      addToast({ type: 'success', title: 'Invoice Created', message: `Drafted invoice ${created.invoiceNumber}.` });
    } catch (err: any) {
      addToast({ type: 'error', title: 'Error', message: err?.message });
    }
  };

  const handleMarkPaid = async (invId: string) => {
    try {
      const updated = await businessService.markInvoicePaid(invId, user);
      if (updated) {
        setInvoices((prev) => prev.map((i) => (i.id === invId ? { ...i, status: 'PAID', paidAt: new Date().toISOString() } : i)));
        addToast({ type: 'success', title: 'Payment Logged', message: `Invoice marked as PAID.` });
      }
    } catch (err: any) {
      addToast({ type: 'error', title: 'Payment Failed', message: err?.message });
    }
  };

  const handleDownloadPDF = (inv: Invoice) => {
    downloadInvoiceFile({
      invoiceNumber: inv.invoiceNumber,
      clientName: inv.customerName,
      amount: inv.total,
      date: inv.dueDate,
      status: inv.status,
    });
    addToast({ type: 'info', title: 'Downloading Invoice', message: `Generating GST tax invoice ${inv.invoiceNumber}...` });
  };

  const handlePrintHTML = (inv: Invoice) => {
    openInvoicePreview({
      invoiceNumber: inv.invoiceNumber,
      clientName: inv.customerName,
      amount: inv.total,
      date: inv.dueDate,
      status: inv.status,
    });
  };

  const handleExportCSV = async () => {
    try {
      const csvStr = await businessService.exportModuleData('finance', 'csv', user.organizationId, user.role);
      const blob = new Blob([csvStr], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Finance_Invoices_Export_${Date.now()}.csv`;
      a.click();
      addToast({ type: 'success', title: 'Export Complete', message: 'Exported invoices to CSV.' });
    } catch (err: any) {
      addToast({ type: 'error', title: 'Export Failed', message: err?.message });
    }
  };

  const totalRev = invoices.filter((i) => i.status === 'PAID').reduce((a, b) => a + b.total, 0);
  const overdueRev = invoices.filter((i) => i.status === 'OVERDUE').reduce((a, b) => a + b.total, 0);

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
              <span className="text-xs font-bold text-amber-700">Finance & Invoicing</span>
            </div>
            <h1 className="text-2xl font-black text-bloom-dark tracking-tight flex items-center gap-2">
              <DollarSign className="w-6 h-6 text-amber-600" />
              Finance & Tax Invoicing Suite
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <Button onClick={handleExportCSV} variant="outline" size="sm" className="border border-slate-200 text-xs font-bold">
              <Download className="w-3.5 h-3.5 mr-1" /> Export CSV
            </Button>
            <Button onClick={() => setShowAddModal(true)} variant="dark" size="sm" className="bg-amber-600 hover:bg-amber-500 font-bold text-xs">
              <Plus className="w-4 h-4 mr-1" /> Create Invoice
            </Button>
          </div>
        </div>

        {/* Financial Metrics Summary */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <GlassCard variant="white" className="p-4 border-l-4 border-l-emerald-600">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Collected Revenue</span>
            <div className="text-xl font-black text-emerald-600 mt-1">₹{totalRev.toLocaleString()}</div>
          </GlassCard>
          <GlassCard variant="white" className="p-4 border-l-4 border-l-red-600">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Overdue Receivables</span>
            <div className="text-xl font-black text-red-600 mt-1">₹{overdueRev.toLocaleString()}</div>
          </GlassCard>
          <GlassCard variant="white" className="p-4 border-l-4 border-l-amber-600">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Invoices</span>
            <div className="text-xl font-black text-bloom-dark mt-1">{invoices.length} Bills</div>
          </GlassCard>
        </div>

        {/* Invoices Lifecycle Table */}
        <section className="bg-white border border-slate-200 rounded-[28px] p-6 shadow-bloom space-y-4">
          <h2 className="text-base font-extrabold text-bloom-dark">Invoice Ledger ({invoices.length})</h2>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-100 text-slate-700 font-bold uppercase text-[10px]">
                <tr>
                  <th className="p-3">Invoice #</th>
                  <th className="p-3">Customer</th>
                  <th className="p-3">Subtotal</th>
                  <th className="p-3">GST Tax (18%)</th>
                  <th className="p-3">Total Amount</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((inv) => (
                  <tr key={inv.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="p-3 font-mono font-bold text-purple-700">{inv.invoiceNumber}</td>
                    <td className="p-3 font-bold text-bloom-dark">{inv.customerName}</td>
                    <td className="p-3 text-slate-600">₹{inv.subtotal.toLocaleString()}</td>
                    <td className="p-3 text-slate-500">₹{inv.tax.toLocaleString()}</td>
                    <td className="p-3 font-bold text-emerald-600">₹{inv.total.toLocaleString()}</td>
                    <td className="p-3">
                      <Badge variant={inv.status === 'PAID' ? 'success' : inv.status === 'OVERDUE' ? 'warning' : 'purple'}>
                        {inv.status}
                      </Badge>
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        {inv.status !== 'PAID' && (
                          <button onClick={() => handleMarkPaid(inv.id)} className="text-emerald-600 hover:underline font-bold">
                            Mark Paid
                          </button>
                        )}
                        <button onClick={() => handleDownloadPDF(inv)} className="text-purple-600 hover:underline font-bold flex items-center gap-1">
                          <Download className="w-3 h-3" /> PDF
                        </button>
                        <button onClick={() => handlePrintHTML(inv)} className="text-slate-600 hover:underline font-bold flex items-center gap-1">
                          <Printer className="w-3 h-3" /> Print
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Create Invoice Modal */}
        {showAddModal && (
          <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
            <form onSubmit={handleCreateInvoice} className="bg-white w-full max-w-md rounded-[28px] border border-slate-200 p-6 shadow-2xl space-y-4">
              <div className="flex items-center justify-between border-b pb-3">
                <h3 className="text-base font-extrabold text-bloom-dark">Create GST Tax Invoice</h3>
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
                    placeholder="e.g. Tata Digital Pvt Ltd"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-bloom-dark font-medium mt-1"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700">Customer Email</label>
                  <input
                    type="email"
                    value={custEmail}
                    onChange={(e) => setCustEmail(e.target.value)}
                    placeholder="billing@tatadigital.com"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-bloom-dark font-medium mt-1"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700">Line Item Description</label>
                  <input
                    type="text"
                    value={itemDesc}
                    onChange={(e) => setItemDesc(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-bloom-dark font-medium mt-1"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700">Subtotal Amount (₹)</label>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-bloom-dark font-medium mt-1"
                  />
                  <span className="text-[10px] text-slate-500 mt-1 block">+18% GST tax (₹{Math.round(amount * 0.18).toLocaleString()}) will be added automatically.</span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <Button type="button" onClick={() => setShowAddModal(false)} variant="outline" size="sm">Cancel</Button>
                <Button type="submit" variant="dark" size="sm" className="bg-amber-600 hover:bg-amber-500 font-bold">Generate Invoice</Button>
              </div>
            </form>
          </div>
        )}
      </main>
    </div>
  );
}
