import { AgentType, LanguageCode } from './index';

export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type ConfidenceLevel = 'HIGH' | 'MEDIUM' | 'LOW';
export type ValidationStatus = 'VALID' | 'INVALID' | 'NEEDS_INPUT';
export type ArtifactType = 'INVOICE' | 'REPORT' | 'CSV' | 'JSON' | 'DOCUMENT';

export interface SuggestedAction {
  id: string;
  label: string;
  actionQuery: string;
  targetAgent: AgentType;
  iconName?: string;
  primary?: boolean;
}

export interface ArtifactRef {
  id: string;
  title: string;
  type: ArtifactType;
  sourceAgent: AgentType;
  createdAt: string;
  downloadPath?: string;
  downloadFilename?: string;
  data?: any;
}

export interface AgentHandoff {
  sourceAgent: AgentType;
  targetAgent: AgentType;
  reason: string;
  requiredTask: string;
  contextParams: Record<string, any>;
  status: 'PENDING' | 'EXECUTED' | 'FAILED';
}

export interface ActionSimulationResult {
  simulated: boolean;
  expectedChanges: {
    entity: string;
    before?: Record<string, any>;
    after?: Record<string, any>;
    summary: string;
  };
  impactLevel: RiskLevel;
}

export interface AgentCapability {
  id: string;
  name: string;
  description: string;
  riskLevel: RiskLevel;
  requiresApproval: boolean;
  supportedArtifacts: ArtifactType[];
}

export interface AgentCapabilityDeclaration {
  agentId: AgentType;
  agentName: string;
  domain: string;
  capabilities: AgentCapability[];
  handOffTargets: AgentType[];
}

export interface UniversalAgentResponse {
  agent: {
    id: AgentType;
    name: string;
  };
  intent: {
    name: string;
    confidenceLevel: ConfidenceLevel;
    missingFields: string[];
    clarificationPrompt?: string;
  };
  response: {
    text: string;
    localized?: Record<LanguageCode, string>;
  };
  action?: {
    required: boolean;
    type: string;
    parameters: Record<string, any>;
  };
  validation: {
    status: ValidationStatus;
    missingFields: string[];
    errorMessages?: string[];
  };
  approval: {
    required: boolean;
    reason?: string;
    status: 'PENDING' | 'APPROVED' | 'EDITED' | 'CANCELLED' | 'NOT_REQUIRED';
  };
  risk: {
    level: RiskLevel;
    reason: string;
  };
  simulation?: ActionSimulationResult;
  suggestedActions?: SuggestedAction[];
  artifacts?: ArtifactRef[];
  handoff?: AgentHandoff | null;
  metadata?: Record<string, any>;
}
