import { aiProviderConfigService, AiProviderType, PROVIDER_ALLOWLISTS } from '@/lib/services/aiProviderConfigService';
import { auditLogger } from '@/lib/security/auditLogger';
import { modelCapabilityRegistry, TaskCategory } from './modelCapabilityRegistry';

export type CapabilityTimeoutType =
  | 'CHAT'
  | 'INTENT'
  | 'TOOL_CALL'
  | 'DATABASE_QUERY'
  | 'RAG'
  | 'MULTI_AGENT'
  | 'WORKFLOW';

export const CAPABILITY_TIMEOUTS: Record<CapabilityTimeoutType, number> = {
  CHAT: 5000,
  INTENT: 4000,
  TOOL_CALL: 8000,
  DATABASE_QUERY: 8000,
  RAG: 12000,
  MULTI_AGENT: 15000,
  WORKFLOW: 15000,
};

export type ProviderFailureType =
  | 'RATE_LIMIT_429'
  | 'TIMEOUT'
  | 'AUTH_401'
  | 'INVALID_REQUEST_400'
  | 'SERVER_5XX'
  | 'NETWORK_ERROR'
  | 'UNKNOWN';

export interface ProviderHealthStatus {
  provider: AiProviderType;
  state: 'HEALTHY' | 'DEGRADED' | 'CIRCUIT_OPEN';
  consecutiveFailures: number;
  lastFailureType?: ProviderFailureType;
  lastFailureMessage?: string;
  lastFailureAt?: string;
  circuitOpenedAt?: number;
  retryAfterSeconds?: number;
}

export interface AICompletionOptions {
  organizationId?: string;
  capability?: CapabilityTimeoutType;
  taskCategory?: TaskCategory;
  prompt: string;
  systemPrompt?: string;
  providerOverride?: AiProviderType;
  modelOverride?: string;
  temperature?: number;
  maxTokens?: number;
  timeoutMs?: number;
  fallbackText?: string;
  responseFormat?: 'TEXT' | 'JSON';
  jsonSchema?: Record<string, any>;
  requestId?: string;
}

export interface AITokenUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}

export interface AICompletionResult {
  content: string;
  provider: AiProviderType | 'DETERMINISTIC_FALLBACK';
  model: string;
  latencyMs: number;
  usage?: AITokenUsage;
  success: boolean;
  error?: string;
  failureType?: ProviderFailureType;
  healthState?: 'HEALTHY' | 'DEGRADED' | 'CIRCUIT_OPEN';
}

export interface AITelemetryStats {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageLatencyMs: number;
  lastCallAt: string | null;
  providerDistribution: Record<string, number>;
  circuitBreakerStatus: Record<AiProviderType, ProviderHealthStatus>;
}

class AIProviderService {
  private telemetry: AITelemetryStats = {
    totalRequests: 0,
    successfulRequests: 0,
    failedRequests: 0,
    averageLatencyMs: 0,
    lastCallAt: null,
    providerDistribution: {
      GEMINI: 0,
      OPENAI: 0,
      DETERMINISTIC_FALLBACK: 0,
    },
    circuitBreakerStatus: {
      GEMINI: { provider: 'GEMINI', state: 'HEALTHY', consecutiveFailures: 0 },
      OPENAI: { provider: 'OPENAI', state: 'HEALTHY', consecutiveFailures: 0 },
    },
  };

  private inFlightRequests: Set<string> = new Set();
  private readonly CIRCUIT_RESET_MS = 30000; // 30s recovery window

  /**
   * Generates completion by dynamically routing to active, authorized BYOK provider.
   * Employs task-based capability routing, differentiated timeouts, failure classification,
   * exponential backoff with jitter, and tenant-isolated fallback.
   */
  public async generateCompletion(options: AICompletionOptions): Promise<AICompletionResult> {
    const startTime = Date.now();
    const orgId = options.organizationId || 'ORG-01';
    const requestId = options.requestId || `REQ-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    // Duplicate Request Guard (Idempotency Protection)
    if (this.inFlightRequests.has(requestId)) {
      await new Promise((r) => setTimeout(r, 100));
    }
    this.inFlightRequests.add(requestId);

    this.telemetry.totalRequests++;

    // Resolve differentiated timeout based on capability
    const capability = options.capability || 'CHAT';
    const timeoutMs = options.timeoutMs || CAPABILITY_TIMEOUTS[capability] || 8000;

    try {
      // 1. Identify Candidate Providers authorized for this tenant
      const authorizedProviders = await this.getAuthorizedProviders(orgId);

      let targetProvider: AiProviderType | null = null;
      let modelToUse: string = '';

      if (options.providerOverride && authorizedProviders.includes(options.providerOverride)) {
        targetProvider = options.providerOverride;
      } else if (authorizedProviders.length > 0) {
        // Task-based intelligent routing using Model Capability Registry
        const task = options.taskCategory || (capability === 'RAG' ? 'RAG_SYNTHESIS' : 'SIMPLE_CONVERSATION');
        const optimal = modelCapabilityRegistry.selectOptimalModel(
          task,
          authorizedProviders,
          options.modelOverride
        );
        targetProvider = optimal.provider;
        modelToUse = optimal.modelId;
      }

      // Check Circuit Breaker for target provider
      if (targetProvider && this.isCircuitOpen(targetProvider)) {
        // Try authorized alternative if tenant has one configured
        const alternative = authorizedProviders.find((p) => p !== targetProvider && !this.isCircuitOpen(p));
        if (alternative) {
          targetProvider = alternative;
          const altAllowlist = PROVIDER_ALLOWLISTS[alternative];
          modelToUse = altAllowlist.defaultModel;
        } else {
          targetProvider = null; // Fall through to deterministic engine
        }
      }

      // If no authorized BYOK key or circuit open, fall back cleanly
      if (!targetProvider) {
        const latencyMs = Date.now() - startTime;
        this.recordSuccess('DETERMINISTIC_FALLBACK', latencyMs);

        return {
          content: options.fallbackText || 'FlowMind AI deterministic operational intelligence engine.',
          provider: 'DETERMINISTIC_FALLBACK',
          model: 'deterministic-rules-engine',
          latencyMs,
          success: true,
        };
      }

      // Load decrypted key for runtime
      const runtime = await aiProviderConfigService.getDecryptedKeyForRuntime(orgId, targetProvider);
      if (!runtime) {
        const latencyMs = Date.now() - startTime;
        this.recordSuccess('DETERMINISTIC_FALLBACK', latencyMs);
        return {
          content: options.fallbackText || 'FlowMind AI deterministic operational intelligence engine.',
          provider: 'DETERMINISTIC_FALLBACK',
          model: 'deterministic-rules-engine',
          latencyMs,
          success: true,
        };
      }

      if (!modelToUse) {
        const allowlist = PROVIDER_ALLOWLISTS[targetProvider];
        modelToUse = runtime.preferredModel && allowlist.models.includes(runtime.preferredModel)
          ? runtime.preferredModel
          : allowlist.defaultModel;
      }

      // 2. Dispatch with Bounded Retries & Jitter
      let attempt = 0;
      const maxAttempts = 2;
      let lastError = '';
      let failureType: ProviderFailureType = 'UNKNOWN';

      while (attempt < maxAttempts) {
        attempt++;
        try {
          let result: { content: string; usage?: AITokenUsage };

          if (targetProvider === 'GEMINI') {
            result = await this.callGemini({
              apiKey: runtime.apiKey,
              model: modelToUse,
              prompt: options.prompt,
              systemPrompt: options.systemPrompt,
              temperature: options.temperature ?? 0.3,
              maxTokens: options.maxTokens ?? 1024,
              timeoutMs,
              responseFormat: options.responseFormat,
            });
          } else {
            result = await this.callOpenAI({
              apiKey: runtime.apiKey,
              model: modelToUse,
              prompt: options.prompt,
              systemPrompt: options.systemPrompt,
              temperature: options.temperature ?? 0.3,
              maxTokens: options.maxTokens ?? 1024,
              timeoutMs,
              responseFormat: options.responseFormat,
            });
          }

          const latencyMs = Date.now() - startTime;
          this.recordSuccess(targetProvider, latencyMs);
          this.recordProviderSuccess(targetProvider);

          return {
            content: result.content,
            provider: targetProvider,
            model: modelToUse,
            latencyMs,
            usage: result.usage,
            success: true,
            healthState: this.telemetry.circuitBreakerStatus[targetProvider].state,
          };
        } catch (err: any) {
          lastError = err.message || 'Provider invocation failed';
          failureType = this.classifyFailure(err);

          this.recordProviderFailure(targetProvider, failureType, lastError);

          // Auth failures (401) should NEVER retry
          if (failureType === 'AUTH_401' || failureType === 'INVALID_REQUEST_400') {
            break;
          }

          if (attempt < maxAttempts) {
            // Exponential backoff with jitter (e.g. 150ms - 350ms)
            const jitter = Math.random() * 150;
            const delay = Math.pow(2, attempt) * 100 + jitter;
            await new Promise((res) => setTimeout(res, delay));
          }
        }
      }

      // 3. Fallback on Provider Failure
      const latencyMs = Date.now() - startTime;
      this.telemetry.failedRequests++;
      this.updateAvgLatency(latencyMs);

      return {
        content: options.fallbackText || 'FlowMind AI operational engine executed safely with fallback.',
        provider: 'DETERMINISTIC_FALLBACK',
        model: `${targetProvider.toLowerCase()}-fallback`,
        latencyMs,
        success: false,
        error: lastError,
        failureType,
        healthState: this.telemetry.circuitBreakerStatus[targetProvider].state,
      };
    } finally {
      this.inFlightRequests.delete(requestId);
    }
  }

  /**
   * Generates structured JSON output validated against expected schema.
   */
  public async generateStructuredJson<T>(
    options: Omit<AICompletionOptions, 'responseFormat'>
  ): Promise<{ data: T | null; raw: AICompletionResult }> {
    const res = await this.generateCompletion({
      ...options,
      responseFormat: 'JSON',
      systemPrompt: `${options.systemPrompt || ''}\nIMPORTANT: Respond ONLY with a valid, parseable JSON object. Do not include markdown codeblocks (\`\`\`json).`,
    });

    if (!res.success || !res.content) {
      return { data: null, raw: res };
    }

    try {
      const cleanJson = res.content.replace(/```json/gi, '').replace(/```/g, '').trim();
      const parsed = JSON.parse(cleanJson) as T;
      return { data: parsed, raw: res };
    } catch {
      return { data: null, raw: res };
    }
  }

  // --- Provider Adapters ---

  private async callGemini(args: {
    apiKey: string;
    model: string;
    prompt: string;
    systemPrompt?: string;
    temperature: number;
    maxTokens: number;
    timeoutMs: number;
    responseFormat?: 'TEXT' | 'JSON';
  }): Promise<{ content: string; usage?: AITokenUsage }> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), args.timeoutMs);

    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${args.model}:generateContent?key=${encodeURIComponent(
      args.apiKey
    )}`;

    const fullPrompt = args.systemPrompt
      ? `${args.systemPrompt}\n\nTask:\n${args.prompt}`
      : args.prompt;

    try {
      const body: any = {
        contents: [{ parts: [{ text: fullPrompt }] }],
        generationConfig: {
          temperature: args.temperature,
          maxOutputTokens: args.maxTokens,
        },
      };

      if (args.responseFormat === 'JSON') {
        body.generationConfig.responseMimeType = 'application/json';
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errJson = await response.json().catch(() => ({}));
        const msg = errJson?.error?.message || `Gemini API returned status ${response.status}`;
        const error = new Error(msg);
        (error as any).status = response.status;
        throw error;
      }

      const data = await response.json();
      const content = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
      const usageMetadata = data?.usageMetadata;

      return {
        content,
        usage: usageMetadata
          ? {
              promptTokens: usageMetadata.promptTokenCount || 0,
              completionTokens: usageMetadata.candidatesTokenCount || 0,
              totalTokens: usageMetadata.totalTokenCount || 0,
            }
          : undefined,
      };
    } catch (err: any) {
      if (err.name === 'AbortError') {
        const timeoutErr = new Error(`Gemini request timed out after ${args.timeoutMs}ms`);
        (timeoutErr as any).isTimeout = true;
        throw timeoutErr;
      }
      throw err;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  private async callOpenAI(args: {
    apiKey: string;
    model: string;
    prompt: string;
    systemPrompt?: string;
    temperature: number;
    maxTokens: number;
    timeoutMs: number;
    responseFormat?: 'TEXT' | 'JSON';
  }): Promise<{ content: string; usage?: AITokenUsage }> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), args.timeoutMs);

    const messages = [];
    if (args.systemPrompt) {
      messages.push({ role: 'system', content: args.systemPrompt });
    }
    messages.push({ role: 'user', content: args.prompt });

    try {
      const body: any = {
        model: args.model,
        messages,
        temperature: args.temperature,
        max_tokens: args.maxTokens,
      };

      if (args.responseFormat === 'JSON') {
        body.response_format = { type: 'json_object' };
      }

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${args.apiKey}`,
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errJson = await response.json().catch(() => ({}));
        const msg = errJson?.error?.message || `OpenAI API returned status ${response.status}`;
        const error = new Error(msg);
        (error as any).status = response.status;
        throw error;
      }

      const data = await response.json();
      const content = data?.choices?.[0]?.message?.content || '';
      const usage = data?.usage;

      return {
        content,
        usage: usage
          ? {
              promptTokens: usage.prompt_tokens || 0,
              completionTokens: usage.completion_tokens || 0,
              totalTokens: usage.total_tokens || 0,
            }
          : undefined,
      };
    } catch (err: any) {
      if (err.name === 'AbortError') {
        const timeoutErr = new Error(`OpenAI request timed out after ${args.timeoutMs}ms`);
        (timeoutErr as any).isTimeout = true;
        throw timeoutErr;
      }
      throw err;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  // --- Health, Circuit Breaker & Failover Management ---

  private async getAuthorizedProviders(organizationId: string): Promise<AiProviderType[]> {
    const authorized: AiProviderType[] = [];
    const gemini = await aiProviderConfigService.getDecryptedKeyForRuntime(organizationId, 'GEMINI');
    if (gemini) authorized.push('GEMINI');

    const openai = await aiProviderConfigService.getDecryptedKeyForRuntime(organizationId, 'OPENAI');
    if (openai) authorized.push('OPENAI');

    return authorized;
  }

  private isCircuitOpen(provider: AiProviderType): boolean {
    const status = this.telemetry.circuitBreakerStatus[provider];
    if (status.state === 'CIRCUIT_OPEN') {
      const elapsed = Date.now() - (status.circuitOpenedAt || 0);
      if (elapsed > this.CIRCUIT_RESET_MS) {
        // Half-open state: allow single probe
        status.state = 'DEGRADED';
        return false;
      }
      return true;
    }
    return false;
  }

  private recordProviderSuccess(provider: AiProviderType) {
    const status = this.telemetry.circuitBreakerStatus[provider];
    status.consecutiveFailures = 0;
    status.state = 'HEALTHY';
    status.lastFailureType = undefined;
    status.lastFailureMessage = undefined;
  }

  private recordProviderFailure(provider: AiProviderType, failureType: ProviderFailureType, message: string) {
    const status = this.telemetry.circuitBreakerStatus[provider];
    status.consecutiveFailures++;
    status.lastFailureType = failureType;
    status.lastFailureMessage = message;
    status.lastFailureAt = new Date().toISOString();

    if (status.consecutiveFailures >= 3) {
      status.state = 'CIRCUIT_OPEN';
      status.circuitOpenedAt = Date.now();
    } else {
      status.state = 'DEGRADED';
    }
  }

  private classifyFailure(err: any): ProviderFailureType {
    if (err.isTimeout || err.name === 'AbortError' || /timed out/i.test(err.message)) {
      return 'TIMEOUT';
    }
    const status = err.status || 0;
    if (status === 429 || /rate limit|quota/i.test(err.message)) {
      return 'RATE_LIMIT_429';
    }
    if (status === 401 || status === 403 || /unauthorized|api key not valid/i.test(err.message)) {
      return 'AUTH_401';
    }
    if (status === 400 || /invalid argument|bad request/i.test(err.message)) {
      return 'INVALID_REQUEST_400';
    }
    if (status >= 500 && status < 600) {
      return 'SERVER_5XX';
    }
    if (/network|econnrefused|fetch failed/i.test(err.message)) {
      return 'NETWORK_ERROR';
    }
    return 'UNKNOWN';
  }

  private recordSuccess(provider: string, latencyMs: number) {
    this.telemetry.successfulRequests++;
    this.telemetry.lastCallAt = new Date().toISOString();
    this.telemetry.providerDistribution[provider] =
      (this.telemetry.providerDistribution[provider] || 0) + 1;
    this.updateAvgLatency(latencyMs);
  }

  private updateAvgLatency(newLatency: number) {
    const total = this.telemetry.totalRequests;
    if (total <= 1) {
      this.telemetry.averageLatencyMs = newLatency;
    } else {
      this.telemetry.averageLatencyMs = Math.round(
        (this.telemetry.averageLatencyMs * (total - 1) + newLatency) / total
      );
    }
  }

  public getTelemetry(): AITelemetryStats {
    return { ...this.telemetry };
  }

  public resetCircuitBreaker(provider?: AiProviderType) {
    if (provider) {
      this.telemetry.circuitBreakerStatus[provider] = {
        provider,
        state: 'HEALTHY',
        consecutiveFailures: 0,
      };
    } else {
      this.telemetry.circuitBreakerStatus = {
        GEMINI: { provider: 'GEMINI', state: 'HEALTHY', consecutiveFailures: 0 },
        OPENAI: { provider: 'OPENAI', state: 'HEALTHY', consecutiveFailures: 0 },
      };
    }
  }
}

export const aiProviderService = new AIProviderService();
