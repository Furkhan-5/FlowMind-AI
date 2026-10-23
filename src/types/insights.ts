export type InsightSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type InsightStatus = 'NEW' | 'ACKNOWLEDGED' | 'RESOLVED';

export interface GovernedActionProposal {
  label: string;
  actionType: string;
  module: string;
  parameters: Record<string, any>;
  workflowId?: string;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  requiresApproval: boolean;
  targetEntityId?: string;
}

export interface ProactiveInsight {
  id: string;
  organizationId: string;
  module: 'CRM' | 'FINANCE' | 'HR' | 'INVENTORY' | 'SUPPORT' | 'WORKFLOW';
  insightType: 'ANOMALY' | 'THRESHOLD_BREACH' | 'TREND_SHIFT' | 'BOTTLENECK';
  title: string;
  description: string;
  severity: InsightSeverity;
  conditionTrigger: string;
  supportingData?: Record<string, any>;
  recommendedAction?: GovernedActionProposal;
  status: InsightStatus;
  assignedToId?: string;
  resolvedAt?: string;
  workflowId?: string;
  dedupHash: string;
  createdAt: string;
  updatedAt: string;
}

export interface InsightHistoryEntry {
  id: string;
  insightId: string;
  actorId?: string;
  actorName?: string;
  action: 'CREATED' | 'ACKNOWLEDGED' | 'ACTION_TRIGGERED' | 'RESOLVED';
  notes?: string;
  timestamp: string;
}
