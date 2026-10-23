'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/layout/Navbar';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { useAppStore } from '@/lib/store/useAppStore';
import {
  ExecutiveKpiSummary,
  TimeSeriesDataPoint,
  PipelineFunnelStage,
  CategoryDistribution,
  ProactiveInsight,
  NaturalLanguageQueryResult,
} from '@/types';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import {
  BarChart3,
  TrendingUp,
  DollarSign,
  Users,
  Package,
  LifeBuoy,
  Zap,
  Sparkles,
  Download,
  RefreshCw,
  Search,
  ArrowRight,
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Send,
  FileSpreadsheet,
  Filter,
  Layers,
} from 'lucide-react';

export default function DataStudioPage() {
  const { user, addToast } = useAppStore();
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('30d');
  const [activeModuleFilter, setActiveModuleFilter] = useState<string>('ALL');

  // Core Data State
  const [kpis, setKpis] = useState<ExecutiveKpiSummary | null>(null);
  const [timeSeries, setTimeSeries] = useState<TimeSeriesDataPoint[]>([]);
  const [pipelineFunnel, setPipelineFunnel] = useState<PipelineFunnelStage[]>([]);
  const [supportDistributions, setSupportDistributions] = useState<{
    byPriority: CategoryDistribution[];
    byCategory: CategoryDistribution[];
  }>({ byPriority: [], byCategory: [] });
  const [insights, setInsights] = useState<ProactiveInsight[]>([]);

  // NL Analytics Assistant State
  const [nlQuery, setNlQuery] = useState('');
  const [isQuerying, setIsQuerying] = useState(false);
  const [queryResult, setQueryResult] = useState<NaturalLanguageQueryResult | null>(null);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
    loadAnalyticsData(timeRange);
  }, [timeRange]);

  const loadAnalyticsData = async (range: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/analytics?timeRange=${range}`);
      const data = await res.json();
      if (data.success) {
        setKpis(data.kpis);
        setTimeSeries(data.timeSeries || []);
        setPipelineFunnel(data.pipelineFunnel || []);
        setSupportDistributions(data.supportDistributions || { byPriority: [], byCategory: [] });
        setInsights(data.proactiveInsights || []);
      } else {
        addToast({ type: 'error', title: 'Data Studio', message: data.error || 'Failed to load metrics' });
      }
    } catch (err) {
      addToast({ type: 'error', title: 'Connection Error', message: 'Unable to reach analytics API.' });
    } finally {
      setLoading(false);
    }
  };

  const handleNlQuery = async (queryText?: string) => {
    const textToSubmit = queryText || nlQuery;
    if (!textToSubmit.trim() || isQuerying) return;

    setIsQuerying(true);
    try {
      const res = await fetch('/api/analytics/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: textToSubmit.trim() }),
      });
      const data = await res.json();
      if (data.success) {
        setQueryResult(data.result);
        setNlQuery('');
      } else {
        addToast({ type: 'error', title: 'Query Failed', message: data.error || 'Could not process query' });
      }
    } catch {
      addToast({ type: 'error', title: 'Query Error', message: 'Failed to communicate with NL engine' });
    } finally {
      setIsQuerying(false);
    }
  };

  const handleTriggerAction = async (insightId: string) => {
    setActionLoadingId(insightId);
    try {
      const res = await fetch('/api/insights/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ insightId }),
      });
      const data = await res.json();
      if (data.success) {
        addToast({
          type: data.requiresApproval ? 'warning' : 'success',
          title: data.requiresApproval ? 'Action Governed' : 'Action Executed',
          message: data.message,
        });
        // Refresh insights
        loadAnalyticsData(timeRange);
      } else {
        addToast({ type: 'error', title: 'Action Failed', message: data.error || 'Execution failed' });
      }
    } catch {
      addToast({ type: 'error', title: 'Action Error', message: 'Failed to dispatch governed action' });
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleUpdateInsightStatus = async (insightId: string, status: 'ACKNOWLEDGED' | 'RESOLVED') => {
    try {
      const res = await fetch('/api/insights', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ insightId, status }),
      });
      const data = await res.json();
      if (data.success) {
        addToast({ type: 'success', title: 'Status Updated', message: `Insight marked as ${status}.` });
        setInsights((prev) =>
          prev.map((i) => (i.id === insightId ? { ...i, status } : i))
        );
      }
    } catch {
      addToast({ type: 'error', title: 'Update Error', message: 'Failed to update insight status.' });
    }
  };

  const exportCsv = () => {
    if (!kpis) return;
    const rows = [
      ['Metric', 'Value'],
      ['Total Realized Revenue', `₹${kpis.totalRevenue}`],
      ['Monthly Invoiced', `₹${kpis.monthlyInvoiced}`],
      ['Outstanding Balance', `₹${kpis.outstandingBalance}`],
      ['Overdue Balance', `₹${kpis.overdueBalance}`],
      ['Total CRM Leads', `${kpis.totalLeads}`],
      ['Pipeline Value', `₹${kpis.pipelineValue}`],
      ['Lead Conversion Rate', `${kpis.conversionRate}%`],
      ['Total Headcount', `${kpis.totalHeadcount}`],
      ['Monthly Payroll', user.role === 'EMPLOYEE' ? 'MASKED' : `₹${kpis.totalMonthlyPayroll}`],
      ['Catalog Products', `${kpis.totalProducts}`],
      ['Low Stock SKUs', `${kpis.lowStockCount}`],
      ['Open Support Tickets', `${kpis.openTickets}`],
      ['SLA Compliance', `${kpis.slaComplianceRate}%`],
      ['Workflow Runs', `${kpis.totalWorkflowsExecuted}`],
      ['Workflow Success Rate', `${kpis.workflowSuccessRate}%`],
    ];

    const csvContent =
      'data:text/csv;charset=utf-8,' + rows.map((e) => e.join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `flowmind_analytics_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    addToast({
      type: 'success',
      title: 'CSV Export Complete',
      message: 'Executive analytics dataset downloaded successfully.',
    });
  };

  const filteredInsights = insights.filter((i) => {
    if (activeModuleFilter === 'ALL') return true;
    return i.module === activeModuleFilter;
  });

  return (
    <div className="min-h-screen bg-bloom-bg dark:bg-slate-950 text-slate-800 dark:text-slate-100 flex flex-col font-sans transition-colors">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-8 py-8 space-y-8 animate-fadeIn">
        {/* Top Header & Breadcrumbs */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs font-semibold text-purple-600 dark:text-purple-400">
              <Link href="/dashboard" className="hover:underline">
                Dashboard
              </Link>
              <span>/</span>
              <span className="text-slate-400">Intelligence Suite</span>
              <span>/</span>
              <span className="text-slate-800 dark:text-white font-bold">Data Studio</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight flex items-center gap-3">
              <BarChart3 className="w-8 h-8 text-purple-600 dark:text-purple-400" />
              AI Data Studio & Proactive Intelligence
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              Real-time multi-tenant analytics, automated anomaly detection, and governed action dispatching.
            </p>
          </div>

          <div className="flex items-center gap-3 self-start md:self-auto flex-wrap">
            {/* Time Range Selector */}
            <div className="bg-slate-200/70 dark:bg-slate-800 p-1 rounded-full flex items-center text-xs font-bold">
              {(['7d', '30d', '90d'] as const).map((range) => (
                <button
                  key={range}
                  onClick={() => setTimeRange(range)}
                  className={`px-3 py-1.5 rounded-full transition-all ${
                    timeRange === range
                      ? 'bg-purple-600 text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {range.toUpperCase()}
                </button>
              ))}
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => loadAnalyticsData(timeRange)}
              className="dark:bg-slate-900 dark:border-slate-700"
              icon={<RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />}
            >
              Refresh
            </Button>

            <Button
              variant="dark"
              size="sm"
              onClick={exportCsv}
              className="bg-purple-600 hover:bg-purple-500 text-white shadow-md"
              icon={<Download className="w-3.5 h-3.5" />}
            >
              Export CSV
            </Button>
          </div>
        </div>

        {/* Executive KPI Ribbon */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          <GlassCard variant="white" className="p-4 space-y-1">
            <div className="flex items-center justify-between text-slate-500 text-[11px] font-semibold">
              <span>Realized Revenue</span>
              <DollarSign className="w-4 h-4 text-emerald-500" />
            </div>
            <div className="text-lg sm:text-xl font-extrabold text-bloom-dark dark:text-white">
              ₹{kpis ? (kpis.totalRevenue / 1000).toFixed(1) + 'k' : '...'}
            </div>
            <div className="text-[10px] text-emerald-600 font-bold flex items-center gap-1">
              <TrendingUp className="w-3 h-3" />
              <span>{kpis?.paidInvoicesCount || 0} paid invoices</span>
            </div>
          </GlassCard>

          <GlassCard variant="white" className="p-4 space-y-1">
            <div className="flex items-center justify-between text-slate-500 text-[11px] font-semibold">
              <span>Sales Pipeline</span>
              <TrendingUp className="w-4 h-4 text-purple-500" />
            </div>
            <div className="text-lg sm:text-xl font-extrabold text-bloom-dark dark:text-white">
              ₹{kpis ? (kpis.pipelineValue / 1000).toFixed(1) + 'k' : '...'}
            </div>
            <div className="text-[10px] text-purple-600 font-bold">
              {kpis?.conversionRate || 0}% win rate ({kpis?.totalLeads || 0} leads)
            </div>
          </GlassCard>

          <GlassCard variant="white" className="p-4 space-y-1">
            <div className="flex items-center justify-between text-slate-500 text-[11px] font-semibold">
              <span>Workforce</span>
              <Users className="w-4 h-4 text-blue-500" />
            </div>
            <div className="text-lg sm:text-xl font-extrabold text-bloom-dark dark:text-white">
              {kpis ? kpis.totalHeadcount : '...'} Staff
            </div>
            <div className="text-[10px] text-slate-500">
              {user.role === 'EMPLOYEE' ? (
                <span className="text-amber-600 font-medium">Payroll: Masked (RBAC)</span>
              ) : (
                <span className="text-slate-600 dark:text-slate-300 font-semibold">
                  Payroll: ₹{kpis ? (kpis.totalMonthlyPayroll / 1000).toFixed(0) + 'k' : '0'}
                </span>
              )}
            </div>
          </GlassCard>

          <GlassCard variant="white" className="p-4 space-y-1">
            <div className="flex items-center justify-between text-slate-500 text-[11px] font-semibold">
              <span>Inventory Alert</span>
              <Package className="w-4 h-4 text-amber-500" />
            </div>
            <div className="text-lg sm:text-xl font-extrabold text-bloom-dark dark:text-white">
              {kpis ? kpis.lowStockCount : '...'} Low Stock
            </div>
            <div className="text-[10px] text-amber-600 font-bold">
              {kpis?.totalStockUnits || 0} units across {kpis?.totalProducts || 0} SKUs
            </div>
          </GlassCard>

          <GlassCard variant="white" className="p-4 space-y-1">
            <div className="flex items-center justify-between text-slate-500 text-[11px] font-semibold">
              <span>Helpdesk SLA</span>
              <LifeBuoy className="w-4 h-4 text-indigo-500" />
            </div>
            <div className="text-lg sm:text-xl font-extrabold text-bloom-dark dark:text-white">
              {kpis ? kpis.slaComplianceRate : '...'}%
            </div>
            <div className="text-[10px] text-indigo-600 font-bold">
              {kpis?.openTickets || 0} open ({kpis?.criticalTickets || 0} critical)
            </div>
          </GlassCard>

          <GlassCard variant="white" className="p-4 space-y-1">
            <div className="flex items-center justify-between text-slate-500 text-[11px] font-semibold">
              <span>DAG Workflows</span>
              <Zap className="w-4 h-4 text-fuchsia-500" />
            </div>
            <div className="text-lg sm:text-xl font-extrabold text-bloom-dark dark:text-white">
              {kpis ? kpis.workflowSuccessRate : '...'}%
            </div>
            <div className="text-[10px] text-fuchsia-600 font-bold">
              {kpis?.totalWorkflowsExecuted || 0} runs | 15 AI Swarms
            </div>
          </GlassCard>
        </div>

        {/* Proactive Business Insights Banner */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              <h2 className="text-base font-bold text-bloom-dark dark:text-white tracking-wide">
                Proactive Business Intelligence & Governed Actions
              </h2>
            </div>
            {/* Module Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto text-[11px] font-semibold">
              {['ALL', 'FINANCE', 'INVENTORY', 'CRM', 'SUPPORT'].map((mod) => (
                <button
                  key={mod}
                  onClick={() => setActiveModuleFilter(mod)}
                  className={`px-2.5 py-1 rounded-full transition-all ${
                    activeModuleFilter === mod
                      ? 'bg-purple-600 text-white'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                  }`}
                >
                  {mod}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredInsights.length === 0 ? (
              <div className="col-span-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 text-center text-xs text-slate-400">
                No active threshold breaches detected for this filter.
              </div>
            ) : (
              filteredInsights.map((insight) => (
                <GlassCard
                  key={insight.id}
                  variant="white"
                  className="p-5 space-y-3 border-l-4 border-l-purple-600"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Badge
                          variant={
                            insight.severity === 'CRITICAL'
                              ? 'default'
                              : insight.severity === 'HIGH'
                              ? 'warning'
                              : 'purple'
                          }
                          className={
                            insight.severity === 'CRITICAL'
                              ? 'bg-red-100 text-red-800 border-red-300'
                              : ''
                          }
                        >
                          {insight.severity}
                        </Badge>
                        <span className="text-[10px] font-bold text-slate-400 tracking-wider">
                          {insight.module} • {insight.insightType}
                        </span>
                      </div>
                      <h3 className="text-xs sm:text-sm font-bold text-bloom-dark dark:text-white">
                        {insight.title}
                      </h3>
                    </div>

                    <Badge
                      variant={
                        insight.status === 'RESOLVED'
                          ? 'success'
                          : insight.status === 'ACKNOWLEDGED'
                          ? 'warning'
                          : 'default'
                      }
                    >
                      {insight.status}
                    </Badge>
                  </div>

                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    {insight.description}
                  </p>

                  <div className="text-[11px] bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-xl text-slate-500 font-mono">
                    <strong className="text-slate-700 dark:text-slate-200">Trigger Rule:</strong>{' '}
                    {insight.conditionTrigger}
                  </div>

                  {insight.recommendedAction && (
                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2 flex-wrap">
                      <div className="text-[11px] font-semibold text-purple-700 dark:text-purple-300">
                        ⚡ Recommended: {insight.recommendedAction.label}
                      </div>

                      <div className="flex items-center gap-2">
                        {insight.status === 'NEW' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleUpdateInsightStatus(insight.id, 'ACKNOWLEDGED')}
                            className="text-[11px] px-2.5 py-1"
                          >
                            Acknowledge
                          </Button>
                        )}

                        <Button
                          variant="primary"
                          size="sm"
                          disabled={actionLoadingId === insight.id || insight.status === 'RESOLVED'}
                          onClick={() => handleTriggerAction(insight.id)}
                          className="bg-purple-600 hover:bg-purple-500 text-white text-[11px] px-3 py-1"
                          icon={
                            actionLoadingId === insight.id ? (
                              <RefreshCw className="w-3 h-3 animate-spin" />
                            ) : (
                              <Sparkles className="w-3 h-3" />
                            )
                          }
                        >
                          {insight.status === 'RESOLVED'
                            ? 'Resolved'
                            : insight.recommendedAction.requiresApproval
                            ? 'Request Governed Action'
                            : 'Execute Action'}
                        </Button>
                      </div>
                    </div>
                  )}
                </GlassCard>
              ))
            )}
          </div>
        </div>

        {/* Visual Analytics Grid (Recharts) */}
        {mounted && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Financial Trends Area Chart */}
            <GlassCard variant="white" className="lg:col-span-2 p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-bloom-dark dark:text-white flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-purple-600" />
                    Revenue Invoicing vs. Cash Collections
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Real-time financial receivables timeline (INR)
                  </p>
                </div>
                <Badge variant="purple">{timeRange.toUpperCase()} View</Badge>
              </div>

              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={timeSeries} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorInvoiced" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0.0} />
                      </linearGradient>
                      <linearGradient id="colorCollected" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10B981" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#10B981" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                    <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} tickFormatter={(val) => `₹${val / 1000}k`} />
                    <Tooltip
                      formatter={(value: any) => [`₹${Number(value).toLocaleString()}`, '']}
                      contentStyle={{
                        borderRadius: '16px',
                        fontSize: '11px',
                        backgroundColor: '#1E293B',
                        color: '#F8FAFC',
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: '11px' }} />
                    <Area
                      type="monotone"
                      dataKey="invoiced"
                      name="Invoiced Total"
                      stroke="#8B5CF6"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#colorInvoiced)"
                    />
                    <Area
                      type="monotone"
                      dataKey="collected"
                      name="Realized Collections"
                      stroke="#10B981"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#colorCollected)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </GlassCard>

            {/* Support Priority Donut Chart */}
            <GlassCard variant="white" className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-bloom-dark dark:text-white flex items-center gap-2">
                    <LifeBuoy className="w-4 h-4 text-indigo-600" />
                    Support Incident Priority
                  </h3>
                  <p className="text-[11px] text-slate-500">Live ticket queue severity spread</p>
                </div>
              </div>

              <div className="h-48 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={supportDistributions.byPriority}
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={70}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {supportDistributions.byPriority.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        borderRadius: '12px',
                        fontSize: '11px',
                        backgroundColor: '#1E293B',
                        color: '#FFF',
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                {supportDistributions.byPriority.map((p) => (
                  <div key={p.name} className="flex items-center gap-2 text-[11px]">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: p.color }}
                    />
                    <span className="text-slate-600 dark:text-slate-400">{p.name}:</span>
                    <span className="font-bold text-slate-800 dark:text-white">{p.value}</span>
                  </div>
                ))}
              </div>
            </GlassCard>

            {/* Sales Pipeline Funnel Stage Bar Chart */}
            <GlassCard variant="white" className="lg:col-span-3 p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-bloom-dark dark:text-white flex items-center gap-2">
                    <Layers className="w-4 h-4 text-purple-600" />
                    Sales Pipeline Stage Distribution & Stage Values
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Lead conversion pipeline progression from New to Won
                  </p>
                </div>
              </div>

              <div className="h-56 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={pipelineFunnel} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                    <XAxis dataKey="stage" tick={{ fontSize: 10 }} />
                    <YAxis yAxisId="left" tick={{ fontSize: 10 }} />
                    <YAxis
                      yAxisId="right"
                      orientation="right"
                      tick={{ fontSize: 10 }}
                      tickFormatter={(val) => `₹${val / 1000}k`}
                    />
                    <Tooltip
                      contentStyle={{
                        borderRadius: '14px',
                        fontSize: '11px',
                        backgroundColor: '#1E293B',
                        color: '#FFF',
                      }}
                      formatter={(val: any, name: string) => [
                        name === 'Pipeline Value (₹)' ? `₹${Number(val).toLocaleString()}` : val,
                        name,
                      ]}
                    />
                    <Legend wrapperStyle={{ fontSize: '11px' }} />
                    <Bar
                      yAxisId="left"
                      dataKey="count"
                      name="Active Leads"
                      fill="#8B5CF6"
                      radius={[6, 6, 0, 0]}
                    />
                    <Bar
                      yAxisId="right"
                      dataKey="value"
                      name="Pipeline Value (₹)"
                      fill="#EC4899"
                      radius={[6, 6, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </GlassCard>
          </div>
        )}

        {/* Natural Language Analytics Assistant ("Ask Data Studio") */}
        <GlassCard variant="white" className="p-6 space-y-5 border-2 border-purple-200 dark:border-purple-900/60 shadow-xl">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="space-y-1">
              <h2 className="text-base sm:text-lg font-bold text-bloom-dark dark:text-white flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-purple-600 animate-pulse" />
                Natural Language Analytics Assistant
              </h2>
              <p className="text-xs text-slate-500">
                Ask conversational questions in plain English or regional languages to query enterprise data.
              </p>
            </div>
            <Badge variant="purple">AI Swarm Grounded</Badge>
          </div>

          {/* Quick Query Pills */}
          <div className="flex items-center gap-2 flex-wrap text-xs">
            <span className="text-slate-400 font-semibold text-[11px]">Suggested Inquiries:</span>
            {[
              'Summarize this month’s sales performance',
              'Which invoices are overdue and what is their total value?',
              'Which products need stock replenishment?',
              'What is our support ticket SLA compliance?',
            ].map((q) => (
              <button
                key={q}
                onClick={() => handleNlQuery(q)}
                className="bg-purple-50 dark:bg-purple-950/50 hover:bg-purple-100 dark:hover:bg-purple-900 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 rounded-full px-3 py-1 text-[11px] transition-all"
              >
                {q}
              </button>
            ))}
          </div>

          {/* Query Input Box */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={nlQuery}
                onChange={(e) => setNlQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleNlQuery()}
                placeholder="Ask e.g. 'Show me our sales pipeline health and overdue payments...'"
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl pl-11 pr-4 py-3 text-xs sm:text-sm text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
              />
            </div>
            <Button
              variant="primary"
              size="md"
              disabled={isQuerying || !nlQuery.trim()}
              onClick={() => handleNlQuery()}
              className="bg-purple-600 hover:bg-purple-500 text-white rounded-2xl px-5"
              icon={isQuerying ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            >
              Analyze
            </Button>
          </div>

          {/* Assistant Response Box */}
          {queryResult && (
            <div className="bg-gradient-to-br from-slate-900 to-purple-950 text-white p-6 rounded-2xl space-y-4 shadow-xl animate-fadeIn">
              <div className="flex items-center justify-between flex-wrap gap-2 border-b border-white/10 pb-3">
                <div className="flex items-center gap-2">
                  <Badge variant="purple" className="bg-purple-500/20 text-purple-300 border-purple-500/40">
                    {queryResult.intent}
                  </Badge>
                  <span className="text-[11px] text-slate-300">
                    Confidence: {(queryResult.confidence * 100).toFixed(0)}% • Grounded against DB records
                  </span>
                </div>
                <span className="text-[10px] text-slate-400">
                  {new Date(queryResult.timestamp).toLocaleTimeString()}
                </span>
              </div>

              {/* Natural language response */}
              <div className="text-xs sm:text-sm text-slate-200 leading-relaxed font-sans">
                {queryResult.answer}
              </div>

              {/* Dynamic Mini Chart visualization if present */}
              {queryResult.chartData && queryResult.chartData.length > 0 && (
                <div className="pt-2">
                  <div className="text-[11px] font-semibold text-purple-300 pb-2">
                    Synthesized Data Breakdown:
                  </div>
                  <div className="h-44 w-full bg-slate-950/60 p-3 rounded-xl border border-white/10">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={queryResult.chartData}>
                        <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                        <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#CBD5E1' }} />
                        <YAxis tick={{ fontSize: 10, fill: '#CBD5E1' }} />
                        <Tooltip
                          contentStyle={{
                            borderRadius: '12px',
                            fontSize: '11px',
                            backgroundColor: '#0F172A',
                            color: '#FFF',
                          }}
                        />
                        <Bar dataKey="value" fill="#A855F7" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

              {/* Follow-up suggestions */}
              {queryResult.suggestedFollowUps && queryResult.suggestedFollowUps.length > 0 && (
                <div className="pt-2 border-t border-white/10 flex items-center gap-2 flex-wrap">
                  <span className="text-[11px] text-purple-300 font-semibold">Recommended Follow-ups:</span>
                  {queryResult.suggestedFollowUps.map((fu, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleNlQuery(fu)}
                      className="bg-white/10 hover:bg-white/20 text-white rounded-full px-3 py-1 text-[11px] transition-all"
                    >
                      {fu}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </GlassCard>
      </main>
    </div>
  );
}
