'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAppStore } from '@/lib/store/useAppStore';
import { Navbar } from '@/components/layout/Navbar';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { businessService } from '@/lib/services/businessService';
import { Product, StockMovement } from '@/types';
import {
  Box,
  Plus,
  ArrowLeft,
  AlertTriangle,
  CheckCircle2,
  TrendingDown,
  TrendingUp,
  RotateCcw,
  Download,
  X,
} from 'lucide-react';

export default function InventoryModulePage() {
  const { user, addToast } = useAppStore();

  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProd, setSelectedProd] = useState<Product | null>(null);
  const [showStockModal, setShowStockModal] = useState(false);

  // Stock Adjustment Form
  const [stockDelta, setStockDelta] = useState(10);
  const [movementType, setMovementType] = useState<'STOCK_IN' | 'STOCK_OUT' | 'ADJUSTMENT'>('STOCK_IN');
  const [reference, setReference] = useState('Manual Stock Receipt');

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      const data = await businessService.getProducts(user.organizationId || 'ORG-01');
      setProducts(data);
    } catch {
      addToast({ type: 'error', title: 'Error', message: 'Failed to load inventory dataset.' });
    }
  };

  const handleAdjustStock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProd) return;

    try {
      const delta = movementType === 'STOCK_OUT' ? -Math.abs(stockDelta) : Math.abs(stockDelta);
      const updated = await businessService.updateStock(selectedProd.id, delta, movementType, reference, user);
      if (updated) {
        setProducts((prev) => prev.map((p) => (p.id === selectedProd.id ? updated : p)));
        setShowStockModal(false);
        addToast({ type: 'success', title: 'Stock Updated', message: `Updated stock level for ${updated.name}.` });
      }
    } catch (err: any) {
      addToast({ type: 'error', title: 'Error', message: err?.message });
    }
  };

  const handleExportCSV = async () => {
    try {
      const csvStr = await businessService.exportModuleData('inventory', 'csv', user.organizationId, user.role);
      const blob = new Blob([csvStr], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Inventory_Stock_Export_${Date.now()}.csv`;
      a.click();
      addToast({ type: 'success', title: 'Export Complete', message: 'Exported inventory dataset to CSV.' });
    } catch (err: any) {
      addToast({ type: 'error', title: 'Export Failed', message: err?.message });
    }
  };

  const lowStockCount = products.filter((p) => p.quantity <= p.reorderLevel).length;

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
              <span className="text-xs font-bold text-emerald-700">Inventory & Supply Chain</span>
            </div>
            <h1 className="text-2xl font-black text-bloom-dark tracking-tight flex items-center gap-2">
              <Box className="w-6 h-6 text-emerald-600" />
              Inventory & Stock Management Hub
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <Button onClick={handleExportCSV} variant="outline" size="sm" className="border border-slate-200 text-xs font-bold">
              <Download className="w-3.5 h-3.5 mr-1" /> Export CSV
            </Button>
          </div>
        </div>

        {/* Low Stock Alert Notification Banner */}
        {lowStockCount > 0 && (
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-center gap-3 text-xs font-semibold text-amber-900">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
            <span>
              <strong>Low-Stock Alerts Detected:</strong> {lowStockCount} items have reached or fallen below reorder threshold limits. Inventory Agent recommends launching automated PO workflow.
            </span>
          </div>
        )}

        {/* Product Catalog Grid / Table */}
        <section className="bg-white border border-slate-200 rounded-[28px] p-6 shadow-bloom space-y-4">
          <h2 className="text-base font-extrabold text-bloom-dark">Product Catalog ({products.length})</h2>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-100 text-slate-700 font-bold uppercase text-[10px]">
                <tr>
                  <th className="p-3">SKU</th>
                  <th className="p-3">Product Name</th>
                  <th className="p-3">Category</th>
                  <th className="p-3">In Stock</th>
                  <th className="p-3">Reorder Threshold</th>
                  <th className="p-3">Unit Price</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map((p) => (
                  <tr key={p.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="p-3 font-mono font-bold text-emerald-700">{p.sku}</td>
                    <td className="p-3 font-bold text-bloom-dark">{p.name}</td>
                    <td className="p-3 text-slate-600">{p.category}</td>
                    <td className="p-3 font-black text-slate-800">{p.quantity} units</td>
                    <td className="p-3 text-slate-500">{p.reorderLevel} units</td>
                    <td className="p-3 font-bold text-emerald-600">₹{p.unitPrice.toLocaleString()}</td>
                    <td className="p-3">
                      <Badge variant={p.status === 'IN_STOCK' ? 'success' : 'warning'}>
                        {p.status}
                      </Badge>
                    </td>
                    <td className="p-3">
                      <button
                        onClick={() => {
                          setSelectedProd(p);
                          setShowStockModal(true);
                        }}
                        className="text-emerald-600 hover:underline font-bold"
                      >
                        Adjust Stock
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Adjust Stock Form Modal */}
        {showStockModal && selectedProd && (
          <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
            <form onSubmit={handleAdjustStock} className="bg-white w-full max-w-md rounded-[28px] border border-slate-200 p-6 shadow-2xl space-y-4">
              <div className="flex items-center justify-between border-b pb-3">
                <h3 className="text-base font-extrabold text-bloom-dark">Adjust Stock ({selectedProd.name})</h3>
                <button type="button" onClick={() => setShowStockModal(false)} className="text-slate-400 hover:text-slate-600">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="font-bold text-slate-700">Movement Type</label>
                  <select
                    value={movementType}
                    onChange={(e) => setMovementType(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-bloom-dark font-semibold mt-1"
                  >
                    <option value="STOCK_IN">Stock Receipt (+ Increase)</option>
                    <option value="STOCK_OUT">Stock Issue (- Decrease)</option>
                    <option value="ADJUSTMENT">Stock Audit Adjustment</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-700">Quantity Units</label>
                  <input
                    type="number"
                    required
                    value={stockDelta}
                    onChange={(e) => setStockDelta(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-bloom-dark font-medium mt-1"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700">Audit Reference / PO #</label>
                  <input
                    type="text"
                    value={reference}
                    onChange={(e) => setReference(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-bloom-dark font-medium mt-1"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <Button type="button" onClick={() => setShowStockModal(false)} variant="outline" size="sm">Cancel</Button>
                <Button type="submit" variant="dark" size="sm" className="bg-emerald-600 hover:bg-emerald-500 font-bold">Commit Stock Record</Button>
              </div>
            </form>
          </div>
        )}
      </main>
    </div>
  );
}
