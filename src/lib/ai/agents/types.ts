import { AgentType, LanguageCode, UserRole, ThoughtStep, ActionCardData } from '@/types';

export interface AgentRequestContext {
  userQuery: string;
  language: LanguageCode;
  userRole: UserRole;
  contextParams?: Record<string, any>;
  intentAction?: string;
}

export interface AgentExecutionResult {
  responseText: string;
  thoughtSteps: ThoughtStep[];
  proposedAction?: ActionCardData;
  confidence: number;
}

export interface AgentDefinition {
  id: AgentType;
  name: string;
  roleTitle: string;
  domain: string;
  description: string;
  systemPrompt: string;
  capabilities: string[];
  canProposeActions: boolean;
  requiresApproval: boolean;
  execute(context: AgentRequestContext): Promise<AgentExecutionResult> | AgentExecutionResult;
}
