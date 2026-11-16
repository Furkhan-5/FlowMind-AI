import { AgentType, LanguageCode, User, UserRole, ChatMessage } from '@/types';
import { ConfidenceLevel, RiskLevel, ValidationStatus, SuggestedAction, ArtifactRef, AgentHandoff, ActionSimulationResult } from '@/types/universalAgent';

export type { SuggestedAction };

export type OperationType =
  | 'INFORMATIONAL'
  | 'DATA_RETRIEVAL'
  | 'ACTION_MUTATION'
  | 'ANALYTICAL'
  | 'WORKFLOW'
  | 'COMMUNICATION'
  | 'KNOWLEDGE_RAG'
  | 'MEMORY'
  | 'CONVERSATIONAL';

export type BusinessDomain =
  | 'CRM'
  | 'FINANCE'
  | 'HR'
  | 'INVENTORY'
  | 'SUPPORT'
  | 'WORKFLOW'
  | 'KNOWLEDGE'
  | 'ANALYTICS'
  | 'COMMUNICATION'
  | 'SECURITY'
  | 'EXECUTIVE'
  | 'GENERAL';

export interface InterpretedIntent {
  primaryIntent: string;
  secondaryIntent?: string;
  operationType: OperationType;
  businessDomain: BusinessDomain;
  targetAgent: AgentType;
  requiredTools: string[];
  entities: Record<string, any>;
  parameters: Record<string, any>;
  confidence: number;
  confidenceLevel: ConfidenceLevel;
  expectedResponseFormat: 'TABLE' | 'RECORD' | 'SUMMARY' | 'CONFIRMATION_CARD' | 'TEXT';
  isMultiDomain?: boolean;
  secondaryDomains?: BusinessDomain[];
  isFollowUp?: boolean;
}

export interface AgentTaskEnvelope {
  requestId: string;
  userId: string;
  organizationId: string;
  conversationId?: string;
  userMessage: string;
  language: LanguageCode;
  userRole: UserRole;
  interpretedIntent: InterpretedIntent;
  context: {
    recentMessages: ChatMessage[];
    memoryContext?: string;
    taskParameters?: Record<string, any>;
  };
  availableTools: string[];
  permissions: string[];
  requiredOutputFormat: string;
}

export interface ToolExecutionRecord {
  toolName: string;
  inputParameters: Record<string, any>;
  executionStatus: 'SUCCESS' | 'FAILED' | 'SKIPPED';
  durationMs: number;
  resultData?: any;
  errorMessage?: string;
}

export interface DataSourceRef {
  sourceType: 'POSTGRES_TABLE' | 'RAG_DOCUMENT' | 'USER_MEMORY' | 'ORG_MEMORY' | 'SYSTEM_RULE';
  identifier: string;
  title?: string;
  confidence?: number;
}

export interface AgentResponseEnvelope {
  agentId: AgentType;
  requestId: string;
  interpretedIntent: string;
  executionStatus: 'COMPLETED' | 'AWAITING_CONFIRMATION' | 'NEEDS_INPUT' | 'FAILED' | 'NOT_SUPPORTED';
  userFacingResponse: string;
  actualResultData?: any;
  toolExecutionDetails?: ToolExecutionRecord[];
  dataSourceReferences?: DataSourceRef[];
  missingInformation?: string[];
  errors?: string[];
  suggestedNextActions?: SuggestedAction[];
  artifacts?: ArtifactRef[];
  handoff?: AgentHandoff | null;
  riskLevel: RiskLevel;
  approvalRequired: boolean;
  simulation?: ActionSimulationResult;
}

/**
 * Validates that an AgentTaskEnvelope conforms strictly to the schema.
 */
export function validateAgentTaskEnvelope(envelope: any): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!envelope || typeof envelope !== 'object') {
    return { valid: false, errors: ['Task envelope must be a valid non-null object.'] };
  }

  if (!envelope.requestId || typeof envelope.requestId !== 'string') {
    errors.push('Missing or invalid requestId.');
  }
  if (!envelope.userId || typeof envelope.userId !== 'string') {
    errors.push('Missing or invalid userId.');
  }
  if (!envelope.organizationId || typeof envelope.organizationId !== 'string') {
    errors.push('Missing or invalid organizationId.');
  }
  if (!envelope.userMessage || typeof envelope.userMessage !== 'string') {
    errors.push('Missing or invalid userMessage.');
  }
  if (!envelope.interpretedIntent || typeof envelope.interpretedIntent !== 'object') {
    errors.push('Missing or invalid interpretedIntent.');
  } else {
    if (!envelope.interpretedIntent.primaryIntent) errors.push('interpretedIntent.primaryIntent is required.');
    if (!envelope.interpretedIntent.operationType) errors.push('interpretedIntent.operationType is required.');
    if (!envelope.interpretedIntent.targetAgent) errors.push('interpretedIntent.targetAgent is required.');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validates that an AgentResponseEnvelope conforms strictly to the schema.
 */
export function validateAgentResponseEnvelope(envelope: any): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!envelope || typeof envelope !== 'object') {
    return { valid: false, errors: ['Response envelope must be a valid non-null object.'] };
  }

  if (!envelope.agentId || typeof envelope.agentId !== 'string') {
    errors.push('Missing or invalid agentId.');
  }
  if (!envelope.requestId || typeof envelope.requestId !== 'string') {
    errors.push('Missing or invalid requestId.');
  }
  if (!envelope.userFacingResponse || typeof envelope.userFacingResponse !== 'string') {
    errors.push('Missing or invalid userFacingResponse.');
  }
  if (!envelope.executionStatus || !['COMPLETED', 'AWAITING_CONFIRMATION', 'NEEDS_INPUT', 'FAILED', 'NOT_SUPPORTED'].includes(envelope.executionStatus)) {
    errors.push(`Invalid executionStatus: ${envelope.executionStatus}`);
  }
  if (!envelope.riskLevel || !['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'].includes(envelope.riskLevel)) {
    errors.push(`Invalid riskLevel: ${envelope.riskLevel}`);
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
