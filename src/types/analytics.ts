export type DateRangePreset = '7d' | '30d' | '90d' | '1y' | 'all';
export type AnalyticsModuleFilter = 'ALL' | 'CRM' | 'FINANCE' | 'HR' | 'INVENTORY' | 'SUPPORT' | 'WORKFLOW';

export interface ExecutiveKpiSummary {
  // Finance
  totalRevenue: number;
  monthlyInvoiced: number;
  outstandingBalance: number;
  overdueBalance: number;
  paidInvoicesCount: number;
  overdueInvoicesCount: number;

  // CRM
  totalLeads: number;
  pipelineValue: number;
  conversionRate: number;
  wonDealsCount: number;
  staleLeadsCount: number;

  // HR
  totalHeadcount: number;
  activeStaff: number;
  pendingLeavesCount: number;
  totalMonthlyPayroll: number; // Masked for EMPLOYEE role

  // Inventory
  totalProducts: number;
  lowStockCount: number;
  outOfStockCount: number;
  totalStockUnits: number;

  // Support
  totalTickets: number;
  openTickets: number;
  criticalTickets: number;
  slaComplianceRate: number;

  // Workflows & AI Swarm
  totalWorkflowsExecuted: number;
  workflowSuccessRate: number;
  pendingApprovalsCount: number;
  activeAgentsCount: number;
}

export interface TimeSeriesDataPoint {
  date: string;
  invoiced: number;
  collected: number;
  newLeads: number;
  tickets: number;
}

export interface PipelineFunnelStage {
  stage: string;
  count: number;
  value: number;
  percentage: number;
}

export interface CategoryDistribution {
  name: string;
  value: number;
  color?: string;
}

export interface NaturalLanguageQueryResult {
  query: string;
  intent: string;
  answer: string;
  metrics?: Record<string, any>;
  chartType?: 'LINE' | 'BAR' | 'FUNNEL' | 'PIE' | 'TABLE' | 'NONE';
  chartData?: any[];
  suggestedFollowUps: string[];
  confidence: number;
  timestamp: string;
  appliedFilters: Record<string, any>;
  authorizedRole: string;
}
