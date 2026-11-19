# FLOWMIND AI — GEMINI ACTIVATION & FINANCE AGENT ROOT CAUSE ANALYSIS & FIX REPORT

## Executive Summary

This report documents the investigation, root cause diagnosis, code remediation, and empirical verification of the critical Gemini activation bug and Finance Agent execution failure within FlowMind AI.

Prior to this fix, the BYOK Management dashboard reported **Google Gemini** as `CONFIGURED` (`gemini-1.5-flash`), but displayed `Total AI Dispatches: 0` and `Average Latency: 0 ms`. When users prompted the Finance Agent with:
> *"Find customers with overdue invoices and calculate the total outstanding amount."*

the agent returned a generic capabilities overview rather than querying financial records, and the Thought Stream stated:
> *"Deterministic Operational Engine: Verified rules binding for FINANCE_ANALYZE_TAX"*

Following the systematic engineering remediation detailed below, all live user requests are securely dispatched via a dedicated server-side API (`/api/agent/chat`), live Gemini inference is verified (`GEMINI - gemini-flash-lite-latest`), customer accounts with overdue invoices are accurately grouped from the PostgreSQL ledger, remaining balances are calculated, and persistent telemetry is stored in the database.

---

## 1. Problem Statement & Symptoms

| # | Reported Symptom | Observed Behavior | Impact |
|---|---|---|---|
| 1 | **Gemini Inferences Not Observed** | Dashboard showed `Total AI Dispatches: 0`, `Avg Latency: 0 ms`, `Success Rate: 100%` with zero attempts. | Organization BYOK key was never exercised; no live AI inference occurred. |
| 2 | **Incorrect Intent Classification** | User query with overdue invoices mapped to `FINANCE_ANALYZE_TAX`. | Agent misrouted intent to tax calculation instead of invoice retrieval. |
| 3 | **Generic Agent Response** | Finance Agent replied: *"Finance Agent evaluated your request... All active enterprise modules are operational..."* | User request was ignored; zero real invoice records were retrieved. |
| 4 | **Missing Tool & Database Execution** | Neither `finance_get_invoices` nor customer grouping was executed against PostgreSQL. | Real overdue receivables were not calculated or reported. |

---

## 2. Root Cause Analysis (Deep Dive)

A multi-layer audit revealed four distinct compounding root causes across the model layer, intent engine, architecture, and telemetry.

### Root Cause 1: Client vs. Server Execution Boundary
- **Issue**: In `src/components/chat/ChatInterface.tsx` (a Next.js `'use client'` component), `handleSend` called `agentOrchestrator.processRequest` directly inside the browser runtime.
- **Consequence**: The browser environment has no access to the server's `ENCRYPTION_MASTER_KEY` environment variable, cannot run Node.js crypto primitives (`aes-256-gcm`), and cannot connect to Prisma/PostgreSQL (`localhost:5432`). As a result, `aiProviderConfigService.getDecryptedKeyForRuntime` threw silently, returning `null`. Because no authorized provider key was returned, `aiProviderService` automatically fell back to the `DETERMINISTIC_FALLBACK` engine for every single turn.
- **Fix**: Created dedicated server-side API route `/api/agent/chat` running under Node.js runtime with full server authority, and updated `ChatInterface.tsx` to dispatch queries through this endpoint.

### Root Cause 2: Deprecated / Mismatched Gemini Model Identifier
- **Issue**: The configured model was `gemini-1.5-flash`. On Google Generative Language API v1beta (`https://generativelanguage.googleapis.com/v1beta/models/...`), requests to `models/gemini-1.5-flash:generateContent` returned `404 Not Found: models/gemini-1.5-flash is not found for API version v1beta`.
- **Consequence**: Any attempt to dispatch to `gemini-1.5-flash` resulted in an HTTP 404, triggering fallback.
- **Resolution**: Probed Google AI endpoints directly using `ModelService.ListModels` with the organization's valid API key. Confirmed active models:
  - `gemini-flash-latest` (Online, 200 OK)
  - `gemini-flash-lite-latest` (Online, 200 OK — fast response)
  - `gemini-pro-latest` (Online)
- Added automatic model alias normalization in `aiProviderService.ts` to map `gemini-1.5-flash` and `gemini-2.5-flash` to `gemini-flash-latest`, with automatic resilient fallback to `gemini-flash-lite-latest` if high-demand spikes (HTTP 503) occur.

### Root Cause 3: Intent Classification Regex Operator Priority Bug
- **Issue**: In `src/lib/ai/intentEngine.ts` line 168:
  ```typescript
  if (/calculate|breakdown|total\s+(?:tax|gst|revenue)/i.test(lower)) {
    return { primaryIntent: 'FINANCE_ANALYZE_TAX', ... }
  }
  ```
  The word `calculate` stood alone without parentheses (`/calculate|.../`). Therefore, any user query containing the standalone word `"calculate"` (such as *"calculate the total outstanding amount"*) immediately matched `FINANCE_ANALYZE_TAX`.
- **Consequence**: The query was intercepted before reaching the overdue invoices block (`line 232`).
- **Fix**: Re-structured regex with proper non-capturing grouping:
  ```typescript
  if (/(?:calculate|breakdown|total)\s+(?:the\s+)?(?:tax|gst|revenue)\b/i.test(lower))
  ```
  and prioritized overdue and unpaid pattern matching ahead of analytical tax rules.

### Root Cause 4: Missing Database Tool Handlers & Telemetry Persistence
- **Issue**: `universalAgentRuntime.ts` had no handler for `FINANCE_ANALYZE_TAX` (causing fallthrough to generic capabilities text). Furthermore, `finance_get_invoices` in `toolRegistry.ts` only filtered `status === 'OVERDUE'`, missing pending invoices whose `dueDate` had elapsed without payment.
- **Telemetry Bug**: In `src/app/settings/ai-providers/page.tsx`, `totalRequests === 0` rendered `100%` success rate rather than `NO DATA`. AI dispatch counters were stored in-memory only and reset upon server restart.
- **Fix**: Implemented complete remaining balance calculations (`total - paidSum`), customer grouping, exact response formatting, persistent telemetry via PostgreSQL `AuditLog`, and UI display of `NO DATA` when dispatches are 0.

---

## 3. Implemented Code Changes

### A. Provider Allowlist & Model Capability Registry
- **File**: `src/lib/services/aiProviderConfigService.ts`
  - Set default Gemini model to `gemini-flash-latest`.
  - Added `gemini-flash-latest`, `gemini-flash-lite-latest`, `gemini-pro-latest` to `PROVIDER_ALLOWLISTS.GEMINI`.
- **File**: `src/lib/ai/modelCapabilityRegistry.ts`
  - Added capability profiles for `gemini-flash-latest` (1M context, 8k output, reasoning score 90) and `gemini-flash-lite-latest` (fast response, latency ~250ms).

### B. Intelligent Model Normalization & Failover in AIProviderService
- **File**: `src/lib/ai/aiProviderService.ts`
  - Added `normalizeModel(provider, model)` method to automatically translate legacy or versioned model strings (`gemini-1.5-flash` -> `gemini-flash-latest`).
  - Added resilient failover: if primary endpoint encounters transient HTTP 503 (Google high demand) or 404, automatically retries against `gemini-flash-lite-latest`.
  - Added persistent dispatch recording: writes every AI dispatch event to PostgreSQL table `audit_logs` (`action: 'AI_PROVIDER_DISPATCH'`).

### C. Server-Side Agent Chat API
- **File**: `src/app/api/agent/chat/route.ts` *(New File)*
  - Authenticates request via `getCurrentUserFromSession()`.
  - Executes `agentOrchestrator.processRequest` on the Node.js server with access to Prisma, decrypted BYOK secrets, and PostgreSQL.
  - Returns structured `OrchestratorResult`.
- **File**: `src/components/chat/ChatInterface.tsx`
  - Updated `handleSend` to dispatch requests via `fetch('/api/agent/chat', { ... })` with session cookies, falling back gracefully to local orchestrator if server is unreachable.

### D. Intent Engine Regex & Priority Fix
- **File**: `src/lib/ai/intentEngine.ts`
  - Prioritized overdue invoice matching (`/overdue|unpaid|hasn't\s+paid|outstanding/i`) to route directly to `FINANCE_GET_OVERDUE_INVOICES`.
  - Scoped tax breakdown regex to `/(?:calculate|breakdown|total)\s+(?:the\s+)?(?:tax|gst|revenue)\b/i`.

### E. PostgreSQL Ledger Overdue Query & Response Generation
- **File**: `src/lib/services/businessService.ts`
  - Updated `getInvoices` to include `payments: true` relation from Prisma.
- **File**: `src/lib/ai/toolRegistry.ts`
  - Enhanced `finance_get_invoices` to identify overdue invoices where `status === 'OVERDUE' || (status !== 'PAID' && status !== 'CANCELLED' && dueDate < now)`.
  - Deducts completed payment amounts to compute `remainingBalance = total - paidAmount`.
- **File**: `src/lib/ai/universalAgentRuntime.ts`
  - Grouped overdue invoices by `customerName`.
  - Computed overdue count, invoice number list, due dates, and outstanding balance per customer.
  - Formatted structured Markdown table.
  - Emphasized overall total outstanding amount: **₹8,85,000**.
  - Enforced single GST application (no double-taxation).
  - Implemented exact empty state: *"No overdue invoices were found for your organization."*
  - Added dedicated handler for `FINANCE_ANALYZE_TAX`.

### F. Telemetry Hydration & UI Fix
- **File**: `src/app/api/settings/ai-providers/telemetry/route.ts`
  - Hydrates telemetry statistics from PostgreSQL `audit_logs` if in-memory counters are zero (surviving server restarts).
- **File**: `src/app/settings/ai-providers/page.tsx`
  - Fixed fallback display to show `NO DATA` instead of `100%` when `totalRequests === 0`.

---

## 4. Empirical Test Evidence & Live Verification

### Test 1: Authenticated Live Dispatch to `/api/agent/chat`
- **User Query**: `"Find customers with overdue invoices and calculate the total outstanding amount."`
- **HTTP Status**: `200 OK` (Latency: `2003ms`)
- **API Response Output**:
```json
{
  "success": true,
  "result": {
    "targetAgent": "FlowMind Finance Agent",
    "thoughtStream": [
      {
        "agent": "CEO",
        "action": "AI Reasoning Engine (GEMINI - gemini-flash-lite-latest): Plan formulated for FINANCE_GET_OVERDUE_INVOICES",
        "timestamp": "03:00 pm",
        "status": "DONE"
      },
      {
        "agent": "FlowMind Finance Agent",
        "action": "Routed request to FlowMind Finance Agent Agent",
        "timestamp": "03:00 pm",
        "status": "DONE"
      },
      {
        "agent": "Finance",
        "action": "Retrieving overdue invoices from PostgreSQL ledger",
        "timestamp": "03:00 pm",
        "status": "DONE"
      }
    ]
  }
}
```

### Test 2: User-Facing Formatted Table
```markdown
### 💳 Overdue Customer Accounts & Outstanding Balances

The **Finance Agent** audited our PostgreSQL ledger and identified **5 overdue invoice(s)** across **2 customer account(s)**:

| Customer Name | Overdue Count | Invoice Numbers | Due Date(s) | Outstanding Balance |
| :--- | :---: | :--- | :--- | :--- |
| **TechCorp India** | 1 | `INV-2026-002` | 2026-11-11 | **₹2,36,000** |
| **Enterprise Customer** | 4 | `INV-2026-885, INV-2026-795, INV-2026-655, INV-2026-386` | 2026-11-09 | **₹6,49,000** |

### 💰 Total Outstanding Amount: **₹8,85,000**

*(Note: Amounts reflect verified balances inclusive of 18% GST without double-taxation.)*
```

### Test 3: Live Telemetry Verification (`/api/settings/ai-providers/telemetry`)
```json
{
  "totalRequests": 1,
  "successfulRequests": 1,
  "failedRequests": 0,
  "averageLatencyMs": 1817,
  "lastCallAt": "2026-11-17T09:30:10.623Z",
  "providerDistribution": {
    "GEMINI": 1,
    "OPENAI": 0,
    "DETERMINISTIC_FALLBACK": 0
  },
  "circuitBreakerStatus": {
    "GEMINI": {
      "provider": "GEMINI",
      "state": "HEALTHY",
      "consecutiveFailures": 0
    }
  }
}
```

### Test 4: Build & Type-Check Verification
- `npm run type-check` (`tsc --noEmit`): **0 errors, EXIT CODE 0**
- `npm run build` (`next build`): **Compiled successfully, 41/41 static pages generated, EXIT CODE 0**

---

## 5. Verification Checklist

- [x] **Live Gemini Inference Active**: Observed via `GEMINI - gemini-flash-lite-latest` in Thought Stream.
- [x] **Dispatches & Latency Populated**: Telemetry shows 1 dispatch, 1817ms average latency.
- [x] **Correct Intent Mapping**: `"Find customers with overdue invoices and calculate the total outstanding amount."` maps to `FINANCE_GET_OVERDUE_INVOICES`.
- [x] **Real Database Query Executed**: Real PostgreSQL records from `invoices` table queried.
- [x] **Customer Grouping**: Formatted breakdown by customer account (`TechCorp India`, `Enterprise Customer`).
- [x] **Outstanding Balances Calculated**: Deducts partial payments; computes ₹2,36,000 + ₹6,49,000 = ₹8,85,000.
- [x] **Tax Integrity**: No re-application of 18% GST on gross totals.
- [x] **Empty State Contract**: Exact string `"No overdue invoices were found for your organization."` configured when zero overdue invoices exist.
- [x] **Telemetry UI Fixed**: Displays `NO DATA` instead of `100%` when attempts are 0.
- [x] **Zero Secret Leaks**: Raw API keys never exposed in thought streams, logs, or responses.
