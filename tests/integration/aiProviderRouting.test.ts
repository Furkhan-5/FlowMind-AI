import { aiProviderService } from '@/lib/ai/aiProviderService';
import { PROVIDER_ALLOWLISTS } from '@/lib/services/aiProviderConfigService';

describe('AI Provider Service — Unified Abstraction & Routing', () => {
  test('should safely fallback to deterministic response when no BYOK keys are configured', async () => {
    const res = await aiProviderService.generateCompletion({
      organizationId: 'NON_EXISTENT_ORG_99',
      capability: 'CHAT',
      prompt: 'Summarize quarterly pipeline performance for sales team',
      fallbackText: 'Sales pipeline is healthy with 42 active qualified leads.',
    });

    expect(res).toBeDefined();
    expect(res.provider).toBe('DETERMINISTIC_FALLBACK');
    expect(res.content).toBe('Sales pipeline is healthy with 42 active qualified leads.');
    expect(res.success).toBe(true);
    expect(res.latencyMs).toBeGreaterThanOrEqual(0);
  });

  test('should enforce server-controlled model allowlists for Gemini', () => {
    const geminiAllowlist = PROVIDER_ALLOWLISTS.GEMINI;
    expect(geminiAllowlist.models).toContain('gemini-1.5-flash');
    expect(geminiAllowlist.models).toContain('gemini-1.5-pro');
    expect(geminiAllowlist.models).not.toContain('gemini-ultra-experimental-v99');
    expect(geminiAllowlist.defaultModel).toBe('gemini-1.5-flash');
  });

  test('should enforce server-controlled model allowlists for OpenAI', () => {
    const openaiAllowlist = PROVIDER_ALLOWLISTS.OPENAI;
    expect(openaiAllowlist.models).toContain('gpt-4o-mini');
    expect(openaiAllowlist.models).toContain('gpt-4o');
    expect(openaiAllowlist.models).not.toContain('davinci-unrestricted');
    expect(openaiAllowlist.defaultModel).toBe('gpt-4o-mini');
  });

  test('telemetry counters track calls and latency accurately without logging prompt strings', async () => {
    const initialTelemetry = aiProviderService.getTelemetry();
    const initialCount = initialTelemetry.totalRequests;

    await aiProviderService.generateCompletion({
      organizationId: 'NON_EXISTENT_ORG_99',
      prompt: 'Calculate 18% GST for invoice',
      fallbackText: 'Invoice GST breakdown calculated.',
    });

    const updatedTelemetry = aiProviderService.getTelemetry();
    expect(updatedTelemetry.totalRequests).toBe(initialCount + 1);
    expect(updatedTelemetry.successfulRequests).toBeGreaterThanOrEqual(1);
    expect(updatedTelemetry.lastCallAt).not.toBeNull();
    // Verify telemetry object does not contain any prompt strings
    expect(JSON.stringify(updatedTelemetry)).not.toContain('Calculate 18% GST');
  });
});
