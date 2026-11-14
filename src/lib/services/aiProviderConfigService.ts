import { prisma } from '@/lib/prisma';
import { encryptionService } from '@/lib/security/encryptionService';
import { auditLogger } from '@/lib/security/auditLogger';

export type AiProviderType = 'GEMINI' | 'OPENAI';
export type ProviderConfigStatus = 'ACTIVE' | 'DISABLED' | 'ERROR';

export interface SanitizedProviderConfig {
  id: string;
  provider: AiProviderType;
  status: ProviderConfigStatus;
  preferredModel: string;
  keySuffix: string;
  lastValidatedAt: string | null;
  updatedAt: string;
}

export interface SaveProviderConfigInput {
  organizationId: string;
  provider: AiProviderType;
  rawApiKey: string;
  preferredModel?: string;
  userRole: string;
  userId: string;
  skipLiveValidation?: boolean;
}

export const PROVIDER_ALLOWLISTS: Record<AiProviderType, { defaultModel: string; models: string[] }> = {
  GEMINI: {
    defaultModel: 'gemini-1.5-flash',
    models: ['gemini-1.5-flash', 'gemini-1.5-pro', 'gemini-1.0-pro'],
  },
  OPENAI: {
    defaultModel: 'gpt-4o-mini',
    models: ['gpt-4o-mini', 'gpt-4o', 'gpt-4-turbo', 'gpt-3.5-turbo'],
  },
};

export class AiProviderConfigService {
  private fallbackStore: Map<string, any> = new Map();

  /**
   * Retrieves all configured AI providers for an organization.
   * STRICT SECURITY: Never returns encrypted ciphertexts, IVs, or auth tags.
   */
  public async getProviderConfigs(
    organizationId: string = 'ORG-01',
    userRole: string = 'ADMIN'
  ): Promise<SanitizedProviderConfig[]> {
    let records: any[] = [];
    try {
      records = await prisma.aiProviderConfig.findMany({
        where: { organizationId },
        orderBy: { provider: 'asc' },
      });
    } catch (err) {
      // Prisma uninitialized/offline
    }

    if (records.length === 0) {
      records = Array.from(this.fallbackStore.values()).filter((r: any) => r.organizationId === organizationId);
    }

    return records.map((record) => {
      let keySuffix = '••••••••';
      try {
        const decrypted = encryptionService.decryptSecret(
          record.encryptedApiKey,
          record.iv,
          record.authTag
        );
        keySuffix = encryptionService.maskApiKey(decrypted);
      } catch {
        keySuffix = '••••[UNVERIFIABLE]';
      }

      return {
        id: record.id,
        provider: record.provider as AiProviderType,
        status: record.status as ProviderConfigStatus,
        preferredModel: record.preferredModel || PROVIDER_ALLOWLISTS[record.provider as AiProviderType].defaultModel,
        keySuffix,
        lastValidatedAt: record.lastValidatedAt ? (record.lastValidatedAt instanceof Date ? record.lastValidatedAt.toISOString() : record.lastValidatedAt) : null,
        updatedAt: record.updatedAt instanceof Date ? record.updatedAt.toISOString() : (record.updatedAt || new Date().toISOString()),
      };
    });
  }

  /**
   * Saves or updates a provider API key with AES-256-GCM envelope encryption.
   * Strictly enforces ADMIN role authorization.
   */
  public async saveProviderConfig(input: SaveProviderConfigInput): Promise<SanitizedProviderConfig> {
    const { organizationId, provider, rawApiKey, preferredModel, userRole, userId, skipLiveValidation } = input;

    // RBAC Security Enforcement
    if (userRole !== 'ADMIN') {
      auditLogger.logAuditEvent({
        userId,
        organizationId,
        requestId: `REQ-BYOK-UNAUTH-${Date.now()}`,
        agentId: 'Security',
        actionType: 'BYOK_CONFIG_ACCESS_DENIED',
        parameters: { provider, attemptedRole: userRole },
        approvalStatus: 'NOT_REQUIRED',
        executionStatus: 'BLOCKED',
        securityEvents: ['Unauthorized attempt to configure enterprise BYOK provider'],
      });
      throw new Error('ACCESS_DENIED: Only users with the ADMIN role are authorized to manage AI provider keys');
    }

    if (!rawApiKey || rawApiKey.trim().length < 8) {
      throw new Error('INVALID_KEY: The provided API key is empty or too short');
    }

    // Model Allowlist Validation
    const allowlist = PROVIDER_ALLOWLISTS[provider];
    if (!allowlist) {
      throw new Error(`UNSUPPORTED_PROVIDER: Provider ${provider} is not supported. Must be GEMINI or OPENAI.`);
    }

    const selectedModel = preferredModel && allowlist.models.includes(preferredModel)
      ? preferredModel
      : allowlist.defaultModel;

    // Live Validation Check
    let isValid = true;
    let validationError: string | undefined = undefined;

    if (!skipLiveValidation) {
      const probe = await this.validateProviderKey(provider, rawApiKey.trim());
      isValid = probe.valid;
      validationError = probe.error;
    }

    // Encrypt raw secret
    const encrypted = encryptionService.encryptSecret(rawApiKey.trim());

    let upserted: any;
    try {
      upserted = await prisma.aiProviderConfig.upsert({
        where: {
          organizationId_provider: {
            organizationId,
            provider,
          },
        },
        update: {
          encryptedApiKey: encrypted.ciphertext,
          iv: encrypted.iv,
          authTag: encrypted.authTag,
          preferredModel: selectedModel,
          status: isValid ? 'ACTIVE' : 'ERROR',
          lastValidatedAt: isValid ? new Date() : null,
          createdById: userId,
        },
        create: {
          organizationId,
          provider,
          encryptedApiKey: encrypted.ciphertext,
          iv: encrypted.iv,
          authTag: encrypted.authTag,
          preferredModel: selectedModel,
          status: isValid ? 'ACTIVE' : 'ERROR',
          lastValidatedAt: isValid ? new Date() : null,
          createdById: userId,
        },
      });
    } catch {
      upserted = {
        id: `BYOK-CONF-${organizationId}-${provider}`,
        organizationId,
        provider,
        encryptedApiKey: encrypted.ciphertext,
        iv: encrypted.iv,
        authTag: encrypted.authTag,
        preferredModel: selectedModel,
        status: isValid ? 'ACTIVE' : 'ERROR',
        lastValidatedAt: isValid ? new Date() : null,
        createdById: userId,
        updatedAt: new Date(),
      };
    }

    this.fallbackStore.set(`${organizationId}-${provider}`, upserted);

    auditLogger.logAuditEvent({
      userId,
      organizationId,
      requestId: `REQ-BYOK-SAVE-${Date.now()}`,
      agentId: 'Security',
      actionType: 'SAVE_BYOK_PROVIDER_CONFIG',
      parameters: {
        provider,
        preferredModel: selectedModel,
        status: upserted.status,
        keyMasked: encryptionService.maskApiKey(rawApiKey.trim()),
      },
      approvalStatus: 'APPROVED',
      executionStatus: 'EXECUTED',
    });

    if (!isValid && validationError) {
      throw new Error(`VALIDATION_FAILED: ${validationError}`);
    }

    return {
      id: upserted.id,
      provider: upserted.provider as AiProviderType,
      status: upserted.status as ProviderConfigStatus,
      preferredModel: upserted.preferredModel || selectedModel,
      keySuffix: encryptionService.maskApiKey(rawApiKey.trim()),
      lastValidatedAt: upserted.lastValidatedAt ? upserted.lastValidatedAt.toISOString() : null,
      updatedAt: upserted.updatedAt.toISOString(),
    };
  }

  /**
   * Probes provider API endpoint to verify credential validity.
   * Zero secret exposure in error traces or response bodies.
   */
  public async validateProviderKey(
    provider: AiProviderType,
    rawApiKey: string
  ): Promise<{ valid: boolean; error?: string; latencyMs: number }> {
    const startTime = Date.now();

    try {
      if (provider === 'GEMINI') {
        // Probe Google Generative Language API
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8000);

        const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(rawApiKey)}`;
        const response = await fetch(url, {
          method: 'GET',
          signal: controller.signal,
          headers: { 'Content-Type': 'application/json' },
        });

        clearTimeout(timeoutId);
        const latencyMs = Date.now() - startTime;

        if (response.ok) {
          return { valid: true, latencyMs };
        }

        const status = response.status;
        if (status === 400 || status === 403 || status === 401) {
          return { valid: false, error: 'Google Gemini rejected this API key (Invalid Key or API Access Denied)', latencyMs };
        }
        return { valid: false, error: `Google Gemini returned HTTP status ${status}`, latencyMs };
      }

      if (provider === 'OPENAI') {
        // Probe OpenAI Models Endpoint
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8000);

        const response = await fetch('https://api.openai.com/v1/models', {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${rawApiKey}`,
          },
          signal: controller.signal,
        });

        clearTimeout(timeoutId);
        const latencyMs = Date.now() - startTime;

        if (response.ok) {
          return { valid: true, latencyMs };
        }

        const status = response.status;
        if (status === 401) {
          return { valid: false, error: 'OpenAI rejected this API key (HTTP 401 Unauthorized)', latencyMs };
        }
        return { valid: false, error: `OpenAI returned HTTP status ${status}`, latencyMs };
      }

      return { valid: false, error: `Unsupported provider: ${provider}`, latencyMs: 0 };
    } catch (err: any) {
      const latencyMs = Date.now() - startTime;
      if (err.name === 'AbortError') {
        return { valid: false, error: 'Connection timed out while verifying API key with provider endpoint', latencyMs };
      }
      return { valid: false, error: `Network connectivity failure: ${err.message || 'Unable to reach provider'}`, latencyMs };
    }
  }

  /**
   * Removes provider key from organization.
   * Strictly enforces ADMIN role authorization.
   */
  public async deleteProviderConfig(
    organizationId: string = 'ORG-01',
    provider: AiProviderType,
    userRole: string,
    userId: string
  ): Promise<boolean> {
    if (userRole !== 'ADMIN') {
      throw new Error('ACCESS_DENIED: Only users with the ADMIN role can delete AI provider configurations');
    }

    const key = `${organizationId}-${provider}`;
    const hadFallback = this.fallbackStore.has(key);
    this.fallbackStore.delete(key);

    try {
      await prisma.aiProviderConfig.delete({
        where: {
          organizationId_provider: {
            organizationId,
            provider,
          },
        },
      });

      auditLogger.logAuditEvent({
        userId,
        organizationId,
        requestId: `REQ-BYOK-DEL-${Date.now()}`,
        agentId: 'Security',
        actionType: 'DELETE_BYOK_PROVIDER_CONFIG',
        parameters: { provider },
        approvalStatus: 'APPROVED',
        executionStatus: 'EXECUTED',
      });

      return true;
    } catch (err) {
      if (hadFallback) {
        auditLogger.logAuditEvent({
          userId,
          organizationId,
          requestId: `REQ-BYOK-DEL-${Date.now()}`,
          agentId: 'Security',
          actionType: 'DELETE_BYOK_PROVIDER_CONFIG',
          parameters: { provider },
          approvalStatus: 'APPROVED',
          executionStatus: 'EXECUTED',
        });
        return true;
      }
      return false;
    }
  }

  /**
   * Internal Server-Only Method: Decrypts secret into memory for execution runtime.
   * NEVER exposed to frontend or network clients.
   */
  public async getDecryptedKeyForRuntime(
    organizationId: string = 'ORG-01',
    provider: AiProviderType
  ): Promise<{ apiKey: string; preferredModel: string } | null> {
    let record: any = null;
    try {
      record = await prisma.aiProviderConfig.findUnique({
        where: {
          organizationId_provider: {
            organizationId,
            provider,
          },
        },
      });
    } catch (err) {
      // Prisma offline or test mode
    }

    if (!record) {
      record = this.fallbackStore.get(`${organizationId}-${provider}`);
    }

    if (!record || record.status !== 'ACTIVE') return null;

    try {
      const apiKey = encryptionService.decryptSecret(
        record.encryptedApiKey,
        record.iv,
        record.authTag
      );

      const preferredModel = record.preferredModel || PROVIDER_ALLOWLISTS[provider].defaultModel;

      return {
        apiKey,
        preferredModel,
      };
    } catch (err) {
      console.error(`[AiProviderConfigService] Decryption failed for provider ${provider}:`, err);
      return null;
    }
  }
}

export const aiProviderConfigService = new AiProviderConfigService();
