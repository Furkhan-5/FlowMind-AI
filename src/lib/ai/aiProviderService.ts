import { aiProviderConfigService, AiProviderType, PROVIDER_ALLOWLISTS } from '@/lib/services/aiProviderConfigService';
import { auditLogger } from '@/lib/security/auditLogger';

export interface AICompletionOptions {
  organizationId?: string;
  capability?: 'CHAT' | 'WORKFLOW' | 'RAG' | 'ANALYTICS';
  prompt: string;
  systemPrompt?: string;
  providerOverride?: AiProviderType;
  modelOverride?: string;
  temperature?: number;
  maxTokens?: number;
  timeoutMs?: number;
  fallbackText?: string;
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
}

export interface AITelemetryStats {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageLatencyMs: number;
  lastCallAt: string | null;
  providerDistribution: Record<string, number>;
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
  };

  /**
   * Generates completion by dynamically routing to active BYOK provider.
   * If BYOK is not configured or fails, falls back gracefully.
   */
  public async generateCompletion(options: AICompletionOptions): Promise<AICompletionResult> {
    const startTime = Date.now();
    const orgId = options.organizationId || 'ORG-01';
    const timeoutMs = options.timeoutMs || 15000;

    this.telemetry.totalRequests++;

    // 1. Identify Candidate Providers
    let targetProvider: AiProviderType | null = options.providerOverride || null;
    let providerRuntime: { apiKey: string; preferredModel: string } | null = null;

    if (targetProvider) {
      providerRuntime = await aiProviderConfigService.getDecryptedKeyForRuntime(orgId, targetProvider);
    } else {
      // Automatic detection: Try Gemini first, then OpenAI
      const geminiRuntime = await aiProviderConfigService.getDecryptedKeyForRuntime(orgId, 'GEMINI');
      if (geminiRuntime) {
        targetProvider = 'GEMINI';
        providerRuntime = geminiRuntime;
      } else {
        const openaiRuntime = await aiProviderConfigService.getDecryptedKeyForRuntime(orgId, 'OPENAI');
        if (openaiRuntime) {
          targetProvider = 'OPENAI';
          providerRuntime = openaiRuntime;
        }
      }
    }

    // 2. If no BYOK configured, execute deterministic fallback
    if (!targetProvider || !providerRuntime) {
      const latencyMs = Date.now() - startTime;
      this.telemetry.successfulRequests++;
      this.telemetry.lastCallAt = new Date().toISOString();
      this.telemetry.providerDistribution.DETERMINISTIC_FALLBACK++;
      this.updateAvgLatency(latencyMs);

      return {
        content: options.fallbackText || 'FlowMind AI deterministic operational intelligence engine.',
        provider: 'DETERMINISTIC_FALLBACK',
        model: 'deterministic-rules-engine',
        latencyMs,
        success: true,
      };
    }

    // 3. Resolve Model from Allowlist
    const allowlist = PROVIDER_ALLOWLISTS[targetProvider];
    let modelToUse = providerRuntime.preferredModel;
    if (options.modelOverride && allowlist.models.includes(options.modelOverride)) {
      modelToUse = options.modelOverride;
    }

    // 4. Dispatch with Retries & Jitter
    let attempt = 0;
    const maxAttempts = 2;
    let lastError = '';

    while (attempt < maxAttempts) {
      attempt++;
      try {
        let result: { content: string; usage?: AITokenUsage };

        if (targetProvider === 'GEMINI') {
          result = await this.callGemini({
            apiKey: providerRuntime.apiKey,
            model: modelToUse,
            prompt: options.prompt,
            systemPrompt: options.systemPrompt,
            temperature: options.temperature ?? 0.4,
            maxTokens: options.maxTokens ?? 1024,
            timeoutMs,
          });
        } else {
          result = await this.callOpenAI({
            apiKey: providerRuntime.apiKey,
            model: modelToUse,
            prompt: options.prompt,
            systemPrompt: options.systemPrompt,
            temperature: options.temperature ?? 0.4,
            maxTokens: options.maxTokens ?? 1024,
            timeoutMs,
          });
        }

        const latencyMs = Date.now() - startTime;
        this.telemetry.successfulRequests++;
        this.telemetry.lastCallAt = new Date().toISOString();
        this.telemetry.providerDistribution[targetProvider] =
          (this.telemetry.providerDistribution[targetProvider] || 0) + 1;
        this.updateAvgLatency(latencyMs);

        return {
          content: result.content,
          provider: targetProvider,
          model: modelToUse,
          latencyMs,
          usage: result.usage,
          success: true,
        };
      } catch (err: any) {
        lastError = err.message || 'Provider invocation failed';
        if (attempt < maxAttempts) {
          // Exponential backoff with jitter (e.g. 200ms - 400ms)
          const delay = Math.pow(2, attempt) * 100 + Math.random() * 100;
          await new Promise((res) => setTimeout(res, delay));
        }
      }
    }

    // 5. In case of provider error, fall back gracefully
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
    };
  }

  /**
   * Google Gemini Adapter
   */
  private async callGemini(args: {
    apiKey: string;
    model: string;
    prompt: string;
    systemPrompt?: string;
    temperature: number;
    maxTokens: number;
    timeoutMs: number;
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
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: fullPrompt }] }],
          generationConfig: {
            temperature: args.temperature,
            maxOutputTokens: args.maxTokens,
          },
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errJson = await response.json().catch(() => ({}));
        throw new Error(errJson?.error?.message || `Gemini API returned status ${response.status}`);
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
    } finally {
      clearTimeout(timeoutId);
    }
  }

  /**
   * OpenAI Adapter
   */
  private async callOpenAI(args: {
    apiKey: string;
    model: string;
    prompt: string;
    systemPrompt?: string;
    temperature: number;
    maxTokens: number;
    timeoutMs: number;
  }): Promise<{ content: string; usage?: AITokenUsage }> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), args.timeoutMs);

    const messages = [];
    if (args.systemPrompt) {
      messages.push({ role: 'system', content: args.systemPrompt });
    }
    messages.push({ role: 'user', content: args.prompt });

    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${args.apiKey}`,
        },
        body: JSON.stringify({
          model: args.model,
          messages,
          temperature: args.temperature,
          max_tokens: args.maxTokens,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errJson = await response.json().catch(() => ({}));
        throw new Error(errJson?.error?.message || `OpenAI API returned status ${response.status}`);
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
    } finally {
      clearTimeout(timeoutId);
    }
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
}

export const aiProviderService = new AIProviderService();
