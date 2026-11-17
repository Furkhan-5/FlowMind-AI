# FLOWMIND AI — DETERMINISTIC OPERATIONAL FALLBACK AUDIT

**Date:** November 17, 2026  
**Auditor:** Enterprise SaaS Reliability Engineer & Application Security Architect  
**Objective:** Audit Boundaries, Truthfulness, and Execution Integrity of the Deterministic Engine  

---

## 1. Context and Problem Statement

In previous iterations, when external LLMs were offline or unconfigured, the system would execute rule-based handlers but present responses in language that could be mistaken for live generative AI reasoning. Furthermore, if a user requested a free-form reasoning task that fell outside predefined rules, the engine risked providing generic or ungrounded responses.

This audit establishes the **operational boundaries, truthfulness guarantees, and architectural separation** of the Deterministic Operational Engine.

---

## 2. Core Separation of Responsibilities

```
┌────────────────────────────────────────────────────────┬────────────────────────────────────────────────────────┐
│                   AI REASONING ENGINE                  │             DETERMINISTIC OPERATIONAL ENGINE           │
├────────────────────────────────────────────────────────┼────────────────────────────────────────────────────────┤
│ • Natural-Language Understanding (NLU)                 │ • PostgreSQL CRUD operations via Prisma                │
│ • Complex multi-turn context interpretation            │ • 18% Indian GST arithmetic (Subtotal + 18% = Total)   │
│ • Multi-agent intent synthesis                         │ • File generation (PDF, HTML, CSV exports)             │
│ • Unconstrained conversational explanations            │ • DAG Kahn algorithm cycle validation                  │
│ • Semantic RAG question reformulation                  │ • RBAC column-level data masking (Salary -> 0)         │
│ • Tone localization and formatting                     │ • Anti-self-approval enforcement                       │
└────────────────────────────────────────────────────────┴────────────────────────────────────────────────────────┘
```

---

## 3. Strict Truthfulness & Anti-Fabrication Principles

1. **No Pretended Intelligence**:
   - The engine explicitly returns `reasoningMode: "DETERMINISTIC_OPERATIONAL"` and `aiModel: "deterministic-rules-engine"`.
   - The user thought stream clearly notes: `Deterministic Operational Engine: Verified rules binding for [INTENT]`.
2. **Explicit Limitations for Unsupported Tasks**:
   - When an unconstrained, open-ended question is asked that requires real LLM reasoning (and no external LLM is available), the system transparently reports:
     > *"Executed via FlowMind AI Deterministic Operational Engine. Advanced unconstrained LLM synthesis is offline or unconfigured. Please configure a Google Gemini or OpenAI BYOK API key in Settings > AI Providers to enable generative reasoning."*
3. **No Fabricated Tool States**:
   - The system strictly adheres to the principle: **Never report success unless the underlying tool execution succeeded**.
   - If a database write fails (e.g. invalid foreign key, connection timeout), the agent reports `FAILED` and refuses to output a hallucinated confirmation.

---

## 4. Differentiated Timeouts & Circuit Breaker Logic

To ensure the deterministic fallback activates promptly when external LLMs stall, `aiProviderService.ts` enforces task-specific timeouts:

- **Conversational Chat**: 5,000ms
- **Intent Triage**: 4,000ms
- **Tool Calling**: 8,000ms
- **Database Querying**: 8,000ms
- **RAG Retrieval**: 12,000ms
- **Workflow Compilation**: 15,000ms

### Circuit Breaker States:
1. **HEALTHY**: Normal operation; calls routed to active BYOK provider.
2. **DEGRADED**: Provider experienced 1-2 transient failures; retries with exponential backoff and jitter.
3. **CIRCUIT_OPEN**: Provider experienced 3 consecutive failures or an authentication error (401/403). The circuit trips for 30 seconds, immediately routing requests to the deterministic engine without wasting latency on failed network calls.
4. **HALF_OPEN**: After 30 seconds, a single test probe is allowed through. If successful, state resets to HEALTHY; if it fails, the circuit re-opens for another 30 seconds.

---

## 5. Verification Status

Verified across 10 test suites and 102 automated tests (`npm test`), including dedicated tests in `tests/integration/hybridAiEngine.test.ts`.
