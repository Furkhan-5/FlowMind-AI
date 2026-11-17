import { AiProviderType } from '@/lib/services/aiProviderConfigService';

export type TaskComplexity = 'SIMPLE' | 'INTERMEDIATE' | 'COMPLEX' | 'CRITICAL';

export type TaskCategory =
  | 'SIMPLE_CONVERSATION'
  | 'INTENT_CLASSIFICATION'
  | 'STRUCTURED_TOOL_CALL'
  | 'CRM_OPERATIONS'
  | 'FINANCIAL_ANALYSIS'
  | 'COMPLEX_REASONING'
  | 'MULTI_AGENT_PLANNING'
  | 'RAG_SYNTHESIS'
  | 'WORKFLOW_GENERATION';

export type RoutingStrategy = 'BALANCED' | 'COST_OPTIMIZED' | 'PERFORMANCE_OPTIMIZED';

export interface ModelCapabilityProfile {
  provider: AiProviderType;
  modelId: string;
  displayName: string;
  contextWindow: number;
  maxOutputTokens: number;
  supportsToolCalling: boolean;
  supportsStructuredJson: boolean;
  costPer1MPromptTokensUsd: number;
  costPer1MCompletionTokensUsd: number;
  averageLatencyMs: number;
  recommendedComplexity: TaskComplexity[];
  recommendedTasks: TaskCategory[];
  reasoningQualityScore: number; // 1 - 100
  toolCallingReliabilityScore: number; // 1 - 100
}

export const MODEL_CAPABILITY_PROFILES: Record<string, ModelCapabilityProfile> = {
  // Google Gemini Profiles
  'gemini-1.5-flash': {
    provider: 'GEMINI',
    modelId: 'gemini-1.5-flash',
    displayName: 'Google Gemini 1.5 Flash',
    contextWindow: 1048576, // 1M tokens
    maxOutputTokens: 8192,
    supportsToolCalling: true,
    supportsStructuredJson: true,
    costPer1MPromptTokensUsd: 0.075,
    costPer1MCompletionTokensUsd: 0.3,
    averageLatencyMs: 380,
    recommendedComplexity: ['SIMPLE', 'INTERMEDIATE'],
    recommendedTasks: [
      'SIMPLE_CONVERSATION',
      'INTENT_CLASSIFICATION',
      'STRUCTURED_TOOL_CALL',
      'CRM_OPERATIONS',
      'RAG_SYNTHESIS',
    ],
    reasoningQualityScore: 88,
    toolCallingReliabilityScore: 92,
  },
  'gemini-1.5-pro': {
    provider: 'GEMINI',
    modelId: 'gemini-1.5-pro',
    displayName: 'Google Gemini 1.5 Pro',
    contextWindow: 2097152, // 2M tokens
    maxOutputTokens: 8192,
    supportsToolCalling: true,
    supportsStructuredJson: true,
    costPer1MPromptTokensUsd: 1.25,
    costPer1MCompletionTokensUsd: 5.0,
    averageLatencyMs: 1150,
    recommendedComplexity: ['COMPLEX', 'CRITICAL'],
    recommendedTasks: [
      'COMPLEX_REASONING',
      'MULTI_AGENT_PLANNING',
      'RAG_SYNTHESIS',
      'WORKFLOW_GENERATION',
      'FINANCIAL_ANALYSIS',
    ],
    reasoningQualityScore: 96,
    toolCallingReliabilityScore: 95,
  },

  // OpenAI GPT Profiles
  'gpt-4o-mini': {
    provider: 'OPENAI',
    modelId: 'gpt-4o-mini',
    displayName: 'OpenAI GPT-4o Mini',
    contextWindow: 128000, // 128k tokens
    maxOutputTokens: 16384,
    supportsToolCalling: true,
    supportsStructuredJson: true,
    costPer1MPromptTokensUsd: 0.15,
    costPer1MCompletionTokensUsd: 0.6,
    averageLatencyMs: 420,
    recommendedComplexity: ['SIMPLE', 'INTERMEDIATE'],
    recommendedTasks: [
      'SIMPLE_CONVERSATION',
      'INTENT_CLASSIFICATION',
      'STRUCTURED_TOOL_CALL',
      'CRM_OPERATIONS',
      'FINANCIAL_ANALYSIS',
    ],
    reasoningQualityScore: 90,
    toolCallingReliabilityScore: 96,
  },
  'gpt-4o': {
    provider: 'OPENAI',
    modelId: 'gpt-4o',
    displayName: 'OpenAI GPT-4o (Omni)',
    contextWindow: 128000,
    maxOutputTokens: 16384,
    supportsToolCalling: true,
    supportsStructuredJson: true,
    costPer1MPromptTokensUsd: 2.5,
    costPer1MCompletionTokensUsd: 10.0,
    averageLatencyMs: 890,
    recommendedComplexity: ['COMPLEX', 'CRITICAL'],
    recommendedTasks: [
      'COMPLEX_REASONING',
      'MULTI_AGENT_PLANNING',
      'WORKFLOW_GENERATION',
      'FINANCIAL_ANALYSIS',
      'RAG_SYNTHESIS',
    ],
    reasoningQualityScore: 98,
    toolCallingReliabilityScore: 98,
  },
};

export class ModelCapabilityRegistryService {
  /**
   * Selects optimal model for a given task, considering available authorized provider keys
   * and enterprise routing strategy.
   */
  public selectOptimalModel(
    task: TaskCategory,
    availableProviders: AiProviderType[],
    preferredModelOverride?: string,
    strategy: RoutingStrategy = 'BALANCED'
  ): { provider: AiProviderType; modelId: string; reason: string } {
    // 1. If explicit override requested and available in provider allowlist, honor it
    if (preferredModelOverride && MODEL_CAPABILITY_PROFILES[preferredModelOverride]) {
      const profile = MODEL_CAPABILITY_PROFILES[preferredModelOverride];
      if (availableProviders.includes(profile.provider)) {
        return {
          provider: profile.provider,
          modelId: profile.modelId,
          reason: `Honored explicit model override: ${profile.displayName}`,
        };
      }
    }

    // 2. Identify all candidate models supported by currently available providers
    const candidates = Object.values(MODEL_CAPABILITY_PROFILES).filter((p) =>
      availableProviders.includes(p.provider)
    );

    if (candidates.length === 0) {
      // Default fallback
      return {
        provider: 'GEMINI',
        modelId: 'gemini-1.5-flash',
        reason: 'Default candidate fallback when no live provider profiles match',
      };
    }

    // 3. Match candidate models to the specific task
    const taskMatches = candidates.filter((p) => p.recommendedTasks.includes(task));
    const pool = taskMatches.length > 0 ? taskMatches : candidates;

    // 4. Score based on routing strategy
    pool.sort((a, b) => {
      if (strategy === 'COST_OPTIMIZED') {
        return a.costPer1MPromptTokensUsd - b.costPer1MPromptTokensUsd;
      }
      if (strategy === 'PERFORMANCE_OPTIMIZED') {
        return b.reasoningQualityScore - a.reasoningQualityScore;
      }
      // BALANCED: (Quality * 0.6) + (SpeedScore * 0.2) + (CostScore * 0.2)
      const scoreA = a.reasoningQualityScore * 0.6 + (1000 / a.averageLatencyMs) * 10 - a.costPer1MPromptTokensUsd * 2;
      const scoreB = b.reasoningQualityScore * 0.6 + (1000 / b.averageLatencyMs) * 10 - b.costPer1MPromptTokensUsd * 2;
      return scoreB - scoreA;
    });

    const chosen = pool[0];
    return {
      provider: chosen.provider,
      modelId: chosen.modelId,
      reason: `Selected ${chosen.displayName} for ${task} under ${strategy} routing strategy`,
    };
  }

  public getModelProfile(modelId: string): ModelCapabilityProfile | undefined {
    return MODEL_CAPABILITY_PROFILES[modelId];
  }

  public getAllProfiles(): ModelCapabilityProfile[] {
    return Object.values(MODEL_CAPABILITY_PROFILES);
  }
}

export const modelCapabilityRegistry = new ModelCapabilityRegistryService();
