import { modelCapabilityRegistry } from '@/lib/ai/modelCapabilityRegistry';
import { aiProviderService, CAPABILITY_TIMEOUTS } from '@/lib/ai/aiProviderService';
import { aiReasoningEngine } from '@/lib/ai/aiReasoningEngine';
import { conversationMemory } from '@/lib/ai/conversationMemory';
import { modelBenchmarkHarness, BENCHMARK_SCENARIOS } from '@/lib/ai/modelBenchmarkHarness';
import { universalAgentRuntime } from '@/lib/ai/universalAgentRuntime';
import { User } from '@/types';

describe('FLOWMIND AI — HYBRID LLM INTELLIGENCE & REASONING ENGINE SUITE', () => {
  const testUser: User = {
    id: 'USER-HYBRID-TEST',
    organizationId: 'ORG-HYBRID-01',
    name: 'Hybrid AI Tester',
    email: 'tester@flowmind.ai',
    role: 'ADMIN',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
    preferredLanguage: 'en',
  };

  // =========================================================================
  // 1. Model Capability Registry & Task-Based Routing (Phase 3)
  // =========================================================================
  describe('1. Model Capability Registry & Intelligent Routing', () => {
    test('contains complete capability profiles for all supported Gemini and OpenAI models', () => {
      const geminiFlash = modelCapabilityRegistry.getModelProfile('gemini-1.5-flash');
      expect(geminiFlash).toBeDefined();
      expect(geminiFlash?.provider).toBe('GEMINI');
      expect(geminiFlash?.contextWindow).toBe(1048576); // 1M tokens
      expect(geminiFlash?.supportsToolCalling).toBe(true);

      const gpt4oMini = modelCapabilityRegistry.getModelProfile('gpt-4o-mini');
      expect(gpt4oMini).toBeDefined();
      expect(gpt4oMini?.provider).toBe('OPENAI');
      expect(gpt4oMini?.contextWindow).toBe(128000);
      expect(gpt4oMini?.supportsStructuredJson).toBe(true);
    });

    test('selects COST_OPTIMIZED model for high-throughput intent classification', () => {
      const selected = modelCapabilityRegistry.selectOptimalModel(
        'INTENT_CLASSIFICATION',
        ['GEMINI', 'OPENAI'],
        undefined,
        'COST_OPTIMIZED'
      );
      expect(['gemini-flash-lite-latest', 'gemini-1.5-flash', 'gemini-3.1-flash-lite']).toContain(selected.modelId);
    });

    test('selects PERFORMANCE_OPTIMIZED model for complex multi-agent reasoning', () => {
      const selected = modelCapabilityRegistry.selectOptimalModel(
        'COMPLEX_REASONING',
        ['GEMINI', 'OPENAI'],
        undefined,
        'PERFORMANCE_OPTIMIZED'
      );
      expect(selected.modelId).toBe('gpt-4o'); // Highest reasoning score (98)
    });

    test('honors explicit model override when authorized for the tenant', () => {
      const selected = modelCapabilityRegistry.selectOptimalModel(
        'CRM_OPERATIONS',
        ['GEMINI', 'OPENAI'],
        'gemini-1.5-pro'
      );
      expect(['gemini-1.5-pro', 'gemini-pro-latest']).toContain(selected.modelId);
      expect(selected.reason).toContain('Honored explicit model override');
    });
  });

  // =========================================================================
  // 2. Differentiated Timeouts, Failover & Circuit Breaker (Phase 5)
  // =========================================================================
  describe('2. Differentiated Timeouts, Health Tracking & Circuit Breaker', () => {
    test('enforces differentiated timeout policies by capability', () => {
      expect(CAPABILITY_TIMEOUTS.CHAT).toBe(5000); // 5s for fast dialogue
      expect(CAPABILITY_TIMEOUTS.INTENT).toBe(4000); // 4s for intent classification
      expect(CAPABILITY_TIMEOUTS.TOOL_CALL).toBe(8000); // 8s for structured tools
      expect(CAPABILITY_TIMEOUTS.DATABASE_QUERY).toBe(8000); // 8s for database
      expect(CAPABILITY_TIMEOUTS.RAG).toBe(12000); // 12s for document search
      expect(CAPABILITY_TIMEOUTS.WORKFLOW).toBe(15000); // 15s for complex DAG
    });

    test('circuit breaker tracks state and isolates unhealthy providers', () => {
      aiProviderService.resetCircuitBreaker();
      const telemetry = aiProviderService.getTelemetry();
      expect(telemetry.circuitBreakerStatus.GEMINI.state).toBe('HEALTHY');
      expect(telemetry.circuitBreakerStatus.OPENAI.state).toBe('HEALTHY');
    });

    test('gracefully falls back to deterministic rules engine when no keys are configured', async () => {
      const result = await aiProviderService.generateCompletion({
        organizationId: 'ORG-UNCONFIGURED',
        capability: 'CHAT',
        prompt: 'Hello FlowMind AI',
        fallbackText: 'Deterministic operational fallback active.',
      });

      expect(result.success).toBe(true);
      expect(result.provider).toBe('DETERMINISTIC_FALLBACK');
      expect(result.model).toBe('deterministic-rules-engine');
      expect(result.content).toBe('Deterministic operational fallback active.');
    });
  });

  // =========================================================================
  // 3. Clear Separation: AI Reasoning Engine vs Deterministic Engine (Phase 2)
  // =========================================================================
  describe('3. Separation of AI Reasoning & Deterministic Execution', () => {
    test('deterministic operational mode explicitly flags limitations and never fabricates LLM reasoning', async () => {
      const plan = await aiReasoningEngine.analyzeAndPlan('Show all overdue customer accounts', {
        user: testUser,
        targetAgent: 'Finance',
      });

      expect(plan.mode).toBe('DETERMINISTIC_OPERATIONAL');
      expect(plan.provider).toBe('DETERMINISTIC_FALLBACK');
      expect(plan.model).toBe('deterministic-rules-engine');
      expect(plan.isFallback).toBe(true);
      expect(plan.primaryIntent).toBe('FINANCE_GET_OVERDUE_INVOICES');
      expect(plan.requiredTools).toContain('finance_get_invoices');
      expect(plan.limitationsNote).toContain('Deterministic Operational Engine');
    });

    test('synthesizes transparent data-grounded response without hallucinating', async () => {
      const plan = await aiReasoningEngine.analyzeAndPlan('What is the current leave policy?', {
        user: testUser,
        targetAgent: 'HR',
      });

      const draft = 'Full-time employees accrue 20 days paid vacation annually.';
      const syn = await aiReasoningEngine.synthesizeResponse(
        'What is the current leave policy?',
        'HR',
        [],
        plan,
        draft,
        testUser
      );

      expect(syn.mode).toBe('DETERMINISTIC_OPERATIONAL');
      expect(syn.responseText).toBe(draft);
      expect(syn.model).toBe('deterministic-rules-engine');
    });
  });

  // =========================================================================
  // 4. Memory Context Intelligence & Token Budgeting (Phase 6)
  // =========================================================================
  describe('4. Memory Context Intelligence & Token Budgeting', () => {
    test('enforces strict token budgeting on retrieved memory context', async () => {
      const context = await conversationMemory.getRelevantMemoryContext(
        testUser.id,
        testUser.organizationId,
        'CRM sales tools',
        { maxTokens: 100, maxItems: 2 }
      );

      // Verify token budget constraints (100 tokens ~ 400 chars)
      expect(context.length).toBeLessThan(600);
      if (context.length > 0) {
        expect(context).toContain('Enterprise Persistent Memory Context');
        expect(context).toContain('Conflict Resolution Rule');
      }
    });

    test('embeds explicit conflict resolution header giving user prompt precedence', async () => {
      const context = await conversationMemory.getRelevantMemoryContext(
        testUser.id,
        testUser.organizationId,
        'our sales process'
      );

      if (context.length > 0) {
        expect(context).toContain('The user\'s active prompt ALWAYS overrides historical memories');
      }
    });
  });

  // =========================================================================
  // 5. Automated Model Benchmark Harness (Phase 7)
  // =========================================================================
  describe('5. Provider & Agent Benchmark Harness Evaluation', () => {
    test('runs benchmark harness and verifies all 15 core scenarios pass deterministically', () => {
      expect(BENCHMARK_SCENARIOS.length).toBe(15);
      const results = modelBenchmarkHarness.runBenchmark();
      expect(results.length).toBeGreaterThanOrEqual(5);

      const det = results.find((r) => r.provider === 'DETERMINISTIC_FALLBACK');
      expect(det).toBeDefined();
      expect(det?.groundedCorrectnessPercent).toBe(100);
      expect(det?.averageLatencyMs).toBeLessThan(50); // Fast local execution

      const geminiFlash = results.find((r) => r.modelId === 'gemini-1.5-flash');
      expect(geminiFlash).toBeDefined();
      expect(geminiFlash?.intentAccuracyPercent).toBeGreaterThanOrEqual(95);

      const gpt4o = results.find((r) => r.modelId === 'gpt-4o');
      expect(gpt4o).toBeDefined();
      expect(gpt4o?.intentAccuracyPercent).toBeGreaterThanOrEqual(98);
    });
  });

  // =========================================================================
  // 6. End-to-End Runtime Transparency & Metadata (Phase 2 & 4)
  // =========================================================================
  describe('6. End-to-End Universal Runtime Transparency', () => {
    test('runtime returns explicit reasoningMode and model metadata in thought stream', async () => {
      const res = await universalAgentRuntime.executeUserRequest('Show me all my pending invoices.', {
        user: testUser,
        language: 'en',
      });

      expect(res.intent.name).toBe('FINANCE_GET_PENDING_INVOICES');
      expect(res.metadata).toBeDefined();
      expect(res.metadata?.reasoningMode).toBe('DETERMINISTIC_OPERATIONAL');
      expect(res.metadata?.aiProvider).toBe('DETERMINISTIC_FALLBACK');
      expect(res.metadata?.aiModel).toBe('deterministic-rules-engine');

      const thoughtStep = res.metadata?.thoughtSteps?.[0];
      expect(thoughtStep?.action).toContain('Deterministic Operational Engine');
    });
  });
});
