import { AgentType, LanguageCode, ActionCardData } from './index';

export type AgentEventType =
  | 'request_received'
  | 'intent_detected'
  | 'agent_selected'
  | 'agent_started'
  | 'agent_progress'
  | 'action_prepared'
  | 'approval_required'
  | 'action_approved'
  | 'action_edited'
  | 'action_cancelled'
  | 'action_started'
  | 'action_completed'
  | 'action_failed'
  | 'security_blocked';

export interface AgentExecutionEvent {
  id: string;
  type: AgentEventType;
  agentId: AgentType;
  agentName: string;
  message: string;
  timestamp: string;
  status: 'PENDING' | 'RUNNING' | 'DONE' | 'FAILED' | 'SECURITY_BLOCKED' | 'CANCELLED';
}

export interface AuditEvent {
  id: string;
  timestamp: string;
  userId: string;
  organizationId: string;
  requestId: string;
  agentId: AgentType;
  actionType: string;
  parameters: Record<string, any>;
  approvalStatus: 'PENDING' | 'APPROVED' | 'EDITED' | 'CANCELLED' | 'NOT_REQUIRED';
  executionStatus: 'PENDING' | 'EXECUTED' | 'SIMULATED' | 'FAILED' | 'BLOCKED';
  securityEvents?: string[];
  errorMessage?: string;
}

export interface ToastNotification {
  id: string;
  title: string;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
  timestamp: string;
  duration?: number;
}
