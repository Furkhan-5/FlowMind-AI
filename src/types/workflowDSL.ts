import { AgentType, UserRole } from './index';
import { RiskLevel } from './universalAgent';

export type WorkflowStatus = 'DRAFT' | 'VALIDATED' | 'ACTIVE' | 'PAUSED' | 'DISABLED' | 'ARCHIVED';
export type ExecutionStatus = 'QUEUED' | 'RUNNING' | 'WAITING' | 'PAUSED' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
export type NodeExecutionStatus = 'PENDING' | 'READY' | 'RUNNING' | 'SUCCESS' | 'FAILED' | 'RETRYING' | 'TERMINAL_FAILURE' | 'SKIPPED';

export type TriggerType = 'manual' | 'webhook' | 'schedule' | 'event';
export type NodeType =
  | 'TRIGGER'
  | 'ACTION'
  | 'AGENT'
  | 'CONDITION'
  | 'DELAY'
  | 'TRANSFORM'
  | 'NOTIFICATION'
  | 'WEBHOOK'
  | 'APPROVAL'
  | 'ARTIFACT'
  | 'END';

export interface RetryPolicy {
  maxAttempts: number;
  strategy: 'fixed' | 'exponential';
  initialDelayMs: number;
}

export interface WorkflowNodeDSL {
  id: string;
  type: NodeType;
  name: string;
  agentId?: AgentType;
  actionType?: string;
  config: Record<string, any>;
  retryPolicy?: RetryPolicy;
  timeoutMs?: number;
  riskLevel?: RiskLevel;
}

export interface WorkflowEdgeDSL {
  id: string;
  source: string;
  target: string;
  condition?: {
    expression: string;
    label?: 'TRUE' | 'FALSE' | string;
  };
}

export interface WorkflowTriggerDSL {
  type: TriggerType;
  config: {
    cronExpression?: string;
    scheduleDescription?: string;
    webhookUrl?: string;
    webhookSecret?: string;
    eventType?: string;
  };
}

export interface WorkflowDefinition {
  id: string;
  organizationId: string;
  name: string;
  description: string;
  version: number;
  status: WorkflowStatus;
  naturalTrigger: string;
  trigger: WorkflowTriggerDSL;
  nodes: WorkflowNodeDSL[];
  edges: WorkflowEdgeDSL[];
  metadata?: Record<string, any>;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface WorkflowLogEntry {
  id: string;
  timestamp: string;
  nodeId?: string;
  nodeName?: string;
  nodeType?: NodeType;
  status: ExecutionStatus | NodeExecutionStatus;
  message: string;
  durationMs?: number;
  outputSummary?: string;
  error?: string;
}

export interface NodeExecutionRecord {
  nodeId: string;
  status: NodeExecutionStatus;
  startedAt?: string;
  completedAt?: string;
  durationMs?: number;
  attempts: number;
  input?: Record<string, any>;
  output?: Record<string, any>;
  error?: string;
}

export interface WorkflowExecution {
  id: string;
  workflowId: string;
  workflowVersion: number;
  organizationId: string;
  status: ExecutionStatus;
  currentNodeId?: string;
  triggerPayload?: Record<string, any>;
  nodeRecords: Record<string, NodeExecutionRecord>;
  nodeOutputs: Record<string, any>;
  logs: WorkflowLogEntry[];
  error?: string;
  startedAt: string;
  completedAt?: string;
}

export interface DAGValidationError {
  nodeId?: string;
  edgeId?: string;
  type: 'SCHEMA' | 'CYCLE' | 'UNREACHABLE' | 'MISSING_NODE' | 'INVALID_CONDITION' | 'SECURITY';
  message: string;
}

export interface DAGValidationResult {
  valid: boolean;
  errors: DAGValidationError[];
  topologicalOrder?: string[];
  entryNodeIds?: string[];
  terminalNodeIds?: string[];
}
