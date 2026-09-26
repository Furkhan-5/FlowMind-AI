export type UserRole = 'ADMIN' | 'MANAGER' | 'EMPLOYEE';

export type LanguageCode = 'en' | 'hi' | 'te' | 'ta' | 'kn' | 'ml';

export interface LanguageOption {
  code: LanguageCode;
  name: string;
  nativeName: string;
  flag: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar: string;
  preferredLanguage: LanguageCode;
  organizationId: string;
}

export interface Organization {
  id: string;
  name: string;
  domain: string;
  logo: string;
  plan: 'STARTUP' | 'ENTERPRISE' | 'PRO';
  createdAt: string;
}

export type AgentType =
  | 'CEO'
  | 'Sales'
  | 'Marketing'
  | 'Finance'
  | 'HR'
  | 'Support'
  | 'Analytics'
  | 'Database'
  | 'Workflow'
  | 'Scheduler'
  | 'Document'
  | 'Email'
  | 'Knowledge'
  | 'Reporting'
  | 'Security';

export interface AgentInfo {
  id: AgentType;
  name: string;
  roleTitle: string;
  domain: string;
  status: 'IDLE' | 'ACTIVE' | 'PROCESSING';
  avatarColor: string;
  description: string;
  tasksCompleted: number;
}

export interface ThoughtStep {
  agent: AgentType;
  action: string;
  timestamp: string;
  status: 'PENDING' | 'RUNNING' | 'DONE';
}

import {
  RiskLevel,
  ConfidenceLevel,
  ValidationStatus,
  SuggestedAction,
  ArtifactRef,
  AgentHandoff,
  ActionSimulationResult,
} from './universalAgent';

export interface ActionCardData {
  id: string;
  title: string;
  description: string;
  agent: AgentType;
  module: string;
  details: Record<string, any>;
  status: 'PENDING' | 'APPROVED' | 'EDITED' | 'CANCELLED';
  confirmLabel?: string;
  riskLevel?: RiskLevel;
  approvalReason?: string;
  validationStatus?: ValidationStatus;
  beforeAfter?: {
    entity: string;
    before?: Record<string, any>;
    after?: Record<string, any>;
  };
  simulation?: ActionSimulationResult;
  suggestedActions?: SuggestedAction[];
  artifacts?: ArtifactRef[];
}

export interface ChatMessage {
  id: string;
  sender: 'USER' | 'AGENT' | 'SYSTEM';
  activeAgent?: AgentType;
  content: string;
  translatedContent?: Record<LanguageCode, string>;
  language: LanguageCode;
  thoughtStream?: ThoughtStep[];
  actionCard?: ActionCardData;
  suggestedActions?: SuggestedAction[];
  artifacts?: ArtifactRef[];
  handoff?: AgentHandoff | null;
  confidenceLevel?: ConfidenceLevel;
  riskLevel?: RiskLevel;
  validationStatus?: ValidationStatus;
  timestamp: string;
}

export interface WorkflowNode {
  id: string;
  label: string;
  type: 'TRIGGER' | 'ACTION' | 'CONDITION';
  agent: AgentType;
  status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED';
  output?: string;
}

export interface Workflow {
  id: string;
  name: string;
  naturalTrigger: string;
  nodes: WorkflowNode[];
  active: boolean;
  successRate: number;
  lastRun: string;
}

export interface Lead {
  id: string;
  name: string;
  company: string;
  email: string;
  phone: string;
  value: number;
  status: 'NEW' | 'CONTACTED' | 'QUALIFIED' | 'PROPOSAL' | 'WON' | 'LOST';
  assignedAgent: string;
}

export interface Invoice {
  id: string;
  clientName: string;
  amount: number;
  dueDate: string;
  status: 'PAID' | 'PENDING' | 'OVERDUE';
  itemsCount: number;
}

export interface Employee {
  id: string;
  name: string;
  role: string;
  department: string;
  status: 'ACTIVE' | 'ON_LEAVE';
  salary: number;
}

export interface InventoryItem {
  id: string;
  productName: string;
  sku: string;
  quantity: number;
  minThreshold: number;
  unitPrice: number;
  status: 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK';
}

export interface SupportTicket {
  id: string;
  customerName: string;
  subject: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED';
  assignedAgent: AgentType;
}

export interface ProactiveAlert {
  id: string;
  type: 'OVERDUE_INVOICE' | 'LOW_STOCK' | 'LEAD_DECAY' | 'WORKFLOW_FAIL';
  title: string;
  description: string;
  severity: 'WARNING' | 'CRITICAL' | 'INFO';
  timestamp: string;
  recommendedAction: ActionCardData;
}

export * from './agentEvents';
export * from './universalAgent';

