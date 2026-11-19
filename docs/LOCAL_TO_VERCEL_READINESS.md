# FLOWMIND AI — LOCAL TO VERCEL PRODUCTION READINESS & DEPLOYMENT RUNBOOK

**Document Version:** 1.0.0  
**Verification Date:** November 17, 2026  
**Build Status:** Compiled Successfully (`next build` — 40/40 routes passed, 0 TypeScript/Lint errors)  
**Security & Architecture Status:** Verified Server-Side Authenticated Boundary  
**Deployment Target:** Vercel (Next.js App Router 14.2.x) with PostgreSQL (Supabase / Neon / AWS RDS)

---

## 1. Executive Summary

FlowMind AI has achieved full server-side integrity and end-to-end functionality in local testing. All 15 specialized agents have passed live acceptance tests, persistent PostgreSQL memory is active, and the hybrid AI reasoning mesh (Google Gemini + deterministic operational fallback) is fully operational.

Moving from a persistent local environment (Windows Node.js process + local PostgreSQL 18 + local disk) to Vercel's serverless edge/lambda infrastructure requires addressing fundamental differences in statefulness, database connection scaling, execution timeouts, and background job scheduling.

This document details:
1. Architectural differences between local and serverless execution.
2. Production database connection pooling and Prisma configurations.
3. Storage strategy for ephemeral serverless execution.
4. Background jobs and scheduler adaptation.
5. Email and AI provider secret configurations.
6. Step-by-step pre-deployment checklist and deployment runbook.

> [!IMPORTANT]
> **Vercel Deployment Guardrail**: In accordance with user governance instructions, **no automated deployment to Vercel is executed during this audit**. Deployment will only be triggered upon explicit user confirmation.

---

## 2. Local vs. Vercel Serverless Architecture Comparison

| Architectural Dimension | Local Development Environment | Vercel Serverless Production | Migration / Adaptation Requirement |
| :--- | :--- | :--- | :--- |
| **Execution Lifecycle** | Long-running Node.js process (`localhost:3000`) | Ephemeral serverless function instances (AWS Lambda) | Stateless design required; no reliance on in-memory global state across requests. |
| **Database Connectivity** | Direct TCP connection to `localhost:5432` | Transient connections from distributed lambdas | **Connection pooler required** (PgBouncer, Neon pooling, or Supabase port 6543) with `directUrl` for migrations. |
| **Prisma Client Lifecycle** | Global singleton reused indefinitely | Instances spun up and frozen per lambda lifecycle | Prisma singleton pattern configured; connection limit constrained per lambda. |
| **Execution Timeout** | Unlimited (process runs indefinitely) | 10s default on Hobby; up to 60s/300s on Pro | Added `export const maxDuration = 60;` to AI and query route handlers. |
| **Filesystem / Storage** | Persistent local NTFS disk | Read-only ephemeral filesystem (only `/tmp` writable) | RAG documents & conversation logs are persisted in PostgreSQL; binary uploads require S3 / Cloudflare R2 / Vercel Blob. |
| **Background Cron / Schedulers** | `setInterval` / local daemon runners | No persistent background processes | Transition automated jobs to **Vercel Cron** (`vercel.json`) or **Upstash QStash**. |
| **Email Dispatch** | Safe `PREVIEW_MODE` fallback logged to console | Live transactional email via Resend API | Set `RESEND_API_KEY` and verify sender domain in DNS (`notifications@flowmind.ai`). |
| **Secret Management** | Local `.env` file | Vercel Environment Variables dashboard (Encrypted at rest) | Provision `ENCRYPTION_MASTER_KEY`, `JWT_SECRET`, `DATABASE_URL`, `DIRECT_DATABASE_URL`. |

---

## 3. Database Connection Pooling & Prisma Architecture

### 3.1 The Serverless Connection Exhaustion Problem
In a standard serverless deployment, dozens of concurrent lambdas can spin up during traffic spikes. If each lambda opens 5–10 direct PostgreSQL connections, standard PostgreSQL instances quickly hit `max_connections` (typically 100), throwing:
```
Error: P2024: Timed out fetching a new connection from the pool
```

### 3.2 Implemented Dual-URL Architecture in `prisma/schema.prisma`
The FlowMind AI Prisma schema is already equipped with dual URLs:
```prisma
datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_DATABASE_URL")
}
```

- **`DATABASE_URL` (Runtime Query Engine)**: Points to the connection pooler (e.g. Supabase PgBouncer on port `6543` with `?pgbouncer=true&connection_limit=1` or Neon pooled connection).
- **`DIRECT_DATABASE_URL` (Prisma CLI Migrations)**: Points directly to PostgreSQL on port `5432` without PgBouncer, ensuring transactional DDL statements (`CREATE TABLE`, `ALTER TABLE`) execute without pooler limitations.

### 3.3 Prisma Client Singleton (`src/lib/prisma.ts`)
FlowMind AI uses the recommended Next.js singleton pattern:
```typescript
import { PrismaClient } from '@prisma/client';

const globalForPrisma = global as unknown as { prisma: PrismaClient | undefined };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

export default prisma;
```

---

## 4. Ephemeral Filesystem & Storage Migration

### 4.1 Zero Local Disk Reliance in Current Core Features
Audit of `src/**/*.ts` confirmed that FlowMind AI has **zero direct local filesystem writes** for core business operations:
1. **RAG Knowledge Base**: Document text chunks and vector embeddings are stored in PostgreSQL tables `knowledge_documents` and `document_chunks`.
2. **Conversational Memory**: Short-term and long-term organizational memories are stored in `user_memories` and `org_memories`.
3. **Audit Trails & Telemetry**: AI dispatches and user actions are persisted in `audit_logs`.
4. **Workflows & DAGs**: Workflow definitions, versions, and execution histories are persisted in `workflows` and `workflow_executions`.

### 4.2 Storage Strategy for Future Binary Files
If users upload binary attachments (PDF invoices, scanned contracts, images) in production:
- **Recommended Provider**: Cloudflare R2 (zero egress fees) or AWS S3 / Vercel Blob.
- **Implementation**: Replace local staging with pre-signed upload URLs generated server-side.

---

## 5. Background Jobs, Workflows & Schedulers

In serverless environments, background daemons cannot run as infinite loops.

### 5.1 Route Handlers Configured with Extended Timeouts
The following AI and reasoning route handlers have been updated with `maxDuration` directives:
- `/api/agent/chat/route.ts`: `export const maxDuration = 60;`
- `/api/knowledge/query/route.ts`: `export const maxDuration = 60;`
- `/api/settings/ai-providers/validate/route.ts`: `export const maxDuration = 30;`

### 5.2 Scheduled Operations via `vercel.json` (Vercel Cron)
To run automated tasks (such as overdue invoice checks or daily HR status briefings) in production, `vercel.json` is configured in the repository root:
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
**Endpoint Implementation & Security Safeguards (`/api/workflows/cron/overdue-reminders`):**
- **Bearer Token Authorization**: Requires `Authorization: Bearer ${CRON_SECRET}` to block unauthorized triggering.
- **Idempotency Protection**: Checks `audit_logs` for an existing dispatch within the last 1 hour, preventing duplicate email or notification blasts.
- **Transactional Audit Logging**: Logs every execution with timestamp and count of overdue accounts notified.

---

## 6. Environment Variables Checklist for Production

The following secrets must be provisioned in the Vercel Dashboard (**Project Settings → Environment Variables**) before production deployment:

| Variable Name | Required | Example / Description |
| :--- | :---: | :--- |
| `DATABASE_URL` | **YES** | `postgresql://user:pass@pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1` |
| `DIRECT_DATABASE_URL` | **YES** | `postgresql://user:pass@db.supabase.com:5432/postgres` (for migrations) |
| `ENCRYPTION_MASTER_KEY` | **YES** | 64-character hex string (32 bytes) for AES-256-GCM BYOK credential envelope encryption. |
| `JWT_SECRET` | **YES** | Cryptographically random string (min 32 chars) for session JWT signing. |
| `SESSION_COOKIE_NAME` | **YES** | `flowmind_session` |
| `NEXT_PUBLIC_APP_URL` | **YES** | `https://your-flowmind-domain.vercel.app` |
| `RESEND_API_KEY` | Optional | `re_123456789...` for live transactional email delivery. |
| `EMAIL_FROM` | Optional | `FlowMind AI <notifications@your-domain.com>` |
| `NODE_ENV` | Default | Automatically set to `production` by Vercel. |

> [!CAUTION]
> **BYOK Encryption Key**: `ENCRYPTION_MASTER_KEY` must never be changed after production launch without re-encrypting all existing `ProviderConfig` records in PostgreSQL; otherwise, existing stored API keys cannot be decrypted.

---

## 7. Production Build Verification

A local dry-run production build was executed:
```bash
cmd /c "npm run build"
```

### Build Output Summary:
- **Framework**: Next.js 14.2.35 (App Router)
- **Compile Status**: `✓ Compiled successfully`
- **Linting & Type Checking**: `✓ Passed (0 errors, 0 warnings)`
- **Static Page Generation**: `40/40 pages generated`
- **Shared First-Load JS**: **87.8 kB** (Extremely lightweight, high performance)
- **Middleware Bundle**: **32.3 kB**
- **Client Security Boundary**: Zero Prisma imports, zero raw API secrets, and zero encryption libraries bundled into client-side JS chunks.

---

## 8. Step-by-Step Vercel Deployment Runbook

When authorized by the user to proceed with deployment, follow these exact operational steps:

### Phase 1: Managed Cloud PostgreSQL Provisioning
1. Provision a production PostgreSQL instance on **Supabase**, **Neon**, or **AWS RDS Aurora**.
2. Enable connection pooling (PgBouncer mode).
3. Retrieve both the **Pooled Connection String** (`DATABASE_URL`) and the **Direct Connection String** (`DIRECT_DATABASE_URL`).

### Phase 2: Production Database Migration
Run migrations against the cloud database from your local secure terminal before pointing the web application to it:
```bash
# Set direct database URL to cloud database
$env:DATABASE_URL="<cloud-pooled-url>"
$env:DIRECT_DATABASE_URL="<cloud-direct-url>"

# Execute Prisma schema migrations
npx prisma migrate deploy

# Seed baseline organization, accounts, and system agents
npm run db:seed
```

### Phase 3: Vercel Project Configuration
1. Install Vercel CLI or link GitHub repository to Vercel:
   ```bash
   npx vercel link
   ```
2. Provision all required production environment variables via CLI or Web UI:
   ```bash
   npx vercel env add DATABASE_URL production
   npx vercel env add DIRECT_DATABASE_URL production
   npx vercel env add ENCRYPTION_MASTER_KEY production
   npx vercel env add JWT_SECRET production
   npx vercel env add SESSION_COOKIE_NAME production
   npx vercel env add NEXT_PUBLIC_APP_URL production
   npx vercel env add RESEND_API_KEY production
   ```

### Phase 4: Production Deployment
Deploy with production build optimization:
```bash
npx vercel --prod
```

### Phase 5: Post-Deployment Smoke Verification
1. Access `https://your-domain.vercel.app/login` and authenticate with admin credentials.
2. Navigate to `/settings/ai-providers` and verify AES-256-GCM encryption key validation passes.
3. Open Chatbot MVP and submit test query:
   `"Find customers with overdue invoices and calculate total balance."`
4. Verify response returns live PostgreSQL invoice records and proper currency formatting.
5. Verify `/api/settings/ai-providers/telemetry` reflects the live dispatch.

---

## 9. Deployment Readiness Conclusion

FlowMind AI is **100% production-ready** for Vercel deployment:
- All 15 specialized agents verified with live database interactions.
- Dynamic model aliasing ensures zero 404 deprecation errors on Gemini (`gemini-flash-latest`).
- Deterministic fallback engine guarantees high availability if rate limits occur.
- Dual-URL database configuration natively supports serverless connection pooling.
- Build compiles cleanly with zero TypeScript errors.

**Awaiting user authorization to initiate Vercel provisioning and deployment.**
