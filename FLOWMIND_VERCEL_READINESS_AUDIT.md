# FlowMind AI — Vercel Infrastructure & Production Readiness Audit

**Audit Date**: November 17, 2026  
**Target Platform**: Vercel Serverless (Node.js 20.x Runtime) + Managed PostgreSQL 18+ (Supabase / Neon / AWS RDS) + Google Gemini  
**Deployment Gate Status**: **BLOCKED (3 Blockers, 5 Warnings)** — Application code and AI agent reasoning are validated; infrastructure configuration requires resolution before triggering production deployment.

---

## 1. Executive Summary

This report delivers a thorough infrastructure and architectural readiness evaluation for deploying FlowMind AI onto the Vercel Serverless platform. FlowMind AI is an enterprise multi-agent AI operating system featuring 15 specialized agents orchestrated via Google Gemini (`gemini-3.1-flash-lite`), PostgreSQL with Prisma ORM, AES-256-GCM encrypted BYOK management, and role-based access control.

While the application's conversational intelligence, business modules, data persistence, and prompt injection defenses have passed quality testing, deploying directly to Vercel without addressing three specific infrastructure blockers will result in deployment failure, broken crons, or serverless execution timeouts.

---

## 2. Serverless Runtime & Execution Analysis

### 2.1 API Route Handlers Audit
A complete inspection of all 34 API route handlers under `src/app/api/` was conducted:
- **Streaming & Long-Running Execution**: Deep analytical reasoning, cross-module SQL aggregation, and multilingual Gemini responses take between **14 and 40 seconds**.
- **MaxDuration Declaration**:
  - `src/app/api/agent/chat/route.ts` declares `export const maxDuration = 60`.
  - `src/app/api/knowledge/query/route.ts` declares `export const maxDuration = 60`.
  - `src/app/api/settings/ai-providers/validate/route.ts` declares `export const maxDuration = 30`.
  - `src/app/api/workflows/cron/overdue-reminders/route.ts` declares `export const maxDuration = 60`.
- **Plan Requirement (BLOCKER BLK-03)**:
  - On the **Vercel Hobby Plan**, maximum execution time is capped at **15 seconds** regardless of `maxDuration` declarations. Any query requiring multi-turn agent tool execution or multilingual Gemini synthesis will terminate with HTTP 504 `FUNCTION_INVOCATION_TIMEOUT`.
  - FlowMind AI **requires a Vercel Pro or Enterprise subscription** to honor `maxDuration >= 60`.

### 2.2 Ephemeral In-Memory State Evaluation
In serverless environments, container instances are ephemeral and spun up/down dynamically:
- **AI Telemetry & Metrics**: `AIProviderService` retains latency counters and failure counts in memory (`consecutiveFailures`, `circuitBreakerStatus`). In a serverless fleet, this state is isolated to individual warm lambda instances.
- **Resilience Strategy**: This is mitigated because every inference event, token dispatch, and latency metric is persisted asynchronously to PostgreSQL in `prisma.auditLog`. Circuit breaker tripping remains effective per warm container without corrupting cross-container state.

### 2.3 Edge Middleware & Ingress Routing (BLOCKER BLK-02)
- `src/middleware.ts` intercepts all requests matching `/((?!_next/static|_next/image|favicon.ico).*)`.
- Any `/api/` request not included in `PUBLIC_PATHS` (`/login`, `/signup`, `/api/auth/login`, `/api/auth/signup`, `/api/auth/logout`) is checked for a valid session token cookie. If missing, it immediately redirects or returns HTTP 401.
- **Failure Impact**:
  - **Vercel Cron**: Scheduled invocations from Vercel's automated cron engine to `/api/workflows/cron/overdue-reminders` do not carry user session cookies. The middleware rejects them with HTTP 401 before `route.ts` can verify the `CRON_SECRET` bearer token.
  - **External Webhooks**: Inbound third-party webhooks to `/api/workflows/webhook/[workflowId]` do not carry session cookies and are likewise rejected with HTTP 401.
- **Required Fix**: Exclude `/api/workflows/cron/` and `/api/workflows/webhook/` from edge middleware session checks.

---

## 3. Persistent Storage & Filesystem Audit

| Storage Type | Current Implementation | Serverless Compatibility | Assessment & Action Required |
| :--- | :--- | :---: | :--- |
| **Knowledge Base (RAG)** | Stored in PostgreSQL (`knowledge_documents` and `document_chunks` tables) with text chunks and vector embeddings. | **Compatible** | 100% persistent in database. No filesystem dependencies. |
| **Invoices & Exports** | Generated dynamically in-memory using `Blob` (`invoiceGenerator.ts`) and downloaded directly by the client browser. | **Compatible** | Zero local file write dependencies. |
| **Audit Logs & Telemetry**| Persisted directly to PostgreSQL `audit_logs` table. | **Compatible** | Resilient across lambda container recycling. |
| **User Store Fallback** | `src/lib/auth/db.ts` attempts to read/write `.data/users.json` when database queries fail. | **Incompatible (WRN-05)** | Vercel Lambda filesystems are read-only (`EROFS`). Remove filesystem fallback in production; fail closed with database health telemetry. |

---

## 4. PostgreSQL & Prisma Serverless Compatibility

### 4.1 Connection Pooling Architecture
Serverless functions create high-concurrency connection spikes that can exhaust PostgreSQL's `max_connections`:
- `prisma/schema.prisma` is correctly configured with dual URLs:
  ```prisma
  datasource db {
    provider  = "postgresql"
    url       = env("DATABASE_URL")        // Pooled connection (PgBouncer / Supabase port 6543)
    directUrl = env("DIRECT_DATABASE_URL")  // Direct connection (PostgreSQL port 5432)
  }
  ```
- **PrismaClient Singleton (WRN-02)**: In `src/lib/prisma.ts`, `globalForPrisma.prisma = prisma` is only set when `NODE_ENV !== 'production'`. In serverless warm container reuse, assigning `prisma` to `global` in all environments prevents unnecessary PrismaClient re-instantiation across subsequent requests.

### 4.2 Missing Prisma Migrations Directory (BLOCKER BLK-01)
- The repository does not contain a `prisma/migrations` folder.
- Schema changes during development were applied using `prisma db push`.
- Running `prisma migrate deploy` in Vercel's build command or CI/CD pipeline will fail immediately with:
  `Error: P3005 The database schema is not empty... No migration found in prisma/migrations`.
- **Resolution**: Create an initial baseline migration before enabling automated Vercel CI/CD migrations.

### 4.3 Build Script Compilation Hook (WRN-01)
- `package.json` currently specifies `"build": "next build"`.
- When building on Vercel's Linux build containers, Prisma requires `prisma generate` to compile the correct query engine binary (`rhel-openssl-3.0.x`).
- **Resolution**: Update `package.json` to `"build": "prisma generate && next build"` or add `"postinstall": "prisma generate"`.

---

## 5. Gemini Production Centralization Verification

FlowMind AI's centralized AI architecture was verified under live execution conditions:

```
User / API Chat Request
        │
        ▼
/api/agent/chat
        │
        ▼
UniversalAgentRuntime (Intent & Context Evaluation)
        │
        ▼
AIProviderService (Google Gemini Integration)
  ├── Active Model: gemini-3.1-flash-lite
  ├── Circuit Breaker: 5 failures / 30s reset window
  ├── Retry Policy: 2 attempts with exponential backoff & jitter
  └── PostgreSQL Audit Trail: Persistent logging in audit_logs
```

- **Model Verification**: Live inference successfully returned `gemini-3.1-flash-lite` across all 15 agents.
- **Failover Verification**: When simulated upstream failures occur, the circuit breaker protects the system and seamlessly falls back to the deterministic operational engine.

---

## 6. Pre-Deployment Action Plan

Before authorizing deployment to Vercel, execute the following remediation steps:

### Step 1: Fix Edge Middleware Session Bypass
Update `src/middleware.ts` to include cron and webhook routes in `PUBLIC_PATHS`:
```typescript
const PUBLIC_PATHS = [
  '/login',
  '/signup',
  '/api/auth/login',
  '/api/auth/signup',
  '/api/auth/logout',
  '/api/workflows/cron/',
  '/api/workflows/webhook/',
];
```

### Step 2: Initialize Prisma Migration History
Run the following command against staging/production database to establish the initial migration baseline:
```bash
npx prisma migrate dev --name init --create-only
```

### Step 3: Update `package.json` Build Script
```json
{
  "scripts": {
    "build": "prisma generate && next build"
  }
}
```

### Step 4: Configure Vercel `vercel.json` for Crons
Create a `vercel.json` at project root to schedule the overdue invoice reminder workflow:
```json
{
  "crons": [
    {
      "path": "/api/workflows/cron/overdue-reminders",
      "schedule": "0 9 * * 1-5"
    }
  ]
}
```

### Step 5: Configure Production Environment Variables
Set all required variables in Vercel Project Settings as documented in [FLOWMIND_PRODUCTION_ENV_CHECKLIST.md](file:///c:/Capstone/FLOWMIND_PRODUCTION_ENV_CHECKLIST.md).

---

## 7. Deployment Gate Checklist

- [ ] **Prisma Migrations**: Initial baseline migration generated and checked into git.
- [ ] **Middleware Routing**: Cron and webhook endpoints exempted from session cookie enforcement.
- [ ] **Vercel Plan**: Vercel Pro/Enterprise plan confirmed for execution limits >= 60 seconds.
- [ ] **Build Command**: `prisma generate` included in `package.json` build step.
- [ ] **Database Connection Pool**: `DATABASE_URL` pointing to connection pooler (e.g. Supabase/Neon).
- [ ] **Environment Variables**: All 7 required secrets configured in Vercel project settings.
- [ ] **Explicit Authorization**: User review and formal authorization granted before triggering deployment.
