# FlowMind AI — Vercel Deployment Checklist
> Version: 1.0 | Sprint: Week 8 Production Hardening | Date: November 2026

## ⚠️ IMPORTANT: DO NOT DEPLOY WITHOUT COMPLETING ALL LOCAL GATES

All 7 local validation gates must PASS before initiating Vercel deployment.

---

## Pre-Deployment Gates (Local Validation)

### Gate 1 — Database & Persistence

| Check | Command | Status |
|-------|---------|--------|
| PostgreSQL connectivity | `npx prisma db pull` | ⬜ Pending |
| Schema migrations clean | `npx prisma migrate status` | ⬜ Pending |
| All 29+ Prisma models accessible | `npx prisma studio` | ⬜ Pending |
| Conversation persistence after restart | Manual test | ⬜ Pending |
| Memory extraction working | Query `user_memories` table | ⬜ Pending |
| Memory retrieval from new session | Manual test | ⬜ Pending |

### Gate 2 — Chatbot & AI Agents

| Check | Expected | Status |
|-------|----------|--------|
| Chatbot MVP persists to PostgreSQL | Messages in `messages` table | ⬜ Pending |
| Cross-conversation memory retrieval | CRM question returns saved memory | ⬜ Pending |
| All 15 agents routing correctly | No "unknown agent" errors | ⬜ Pending |
| BYOK provider failsafe | Deterministic fallback when no key | ⬜ Pending |
| Security prompt injection blocked | 6/6 injection tests blocked | ⬜ Pending |

### Gate 3 — Workflow Automation

| Check | Expected | Status |
|-------|----------|--------|
| Workflow creation via chat | Saved to `workflows` table | ⬜ Pending |
| DAG validation (Kahn's) | Cyclic DAGs rejected | ⬜ Pending |
| Cross-chatbot workflow retrieval | Same workflow ID accessible | ⬜ Pending |
| Workflow execution persisted | `workflow_executions` rows created | ⬜ Pending |

### Gate 4 — Email

| Check | Expected | Status |
|-------|----------|--------|
| Meeting invite preview generated | HTML email rendered correctly | ⬜ Pending |
| Invoice reminder verified against DB | Only real invoices sent | ⬜ Pending |
| Preview mode when no provider | Returns preview JSON | ⬜ Pending |
| Resend integration (if key provided) | Email delivered successfully | ⬜ Pending |
| Duplicate prevention | Same invoice not reminded twice | ⬜ Pending |

### Gate 5 — RAG Knowledge Hub

| Check | Expected | Status |
|-------|----------|--------|
| Document upload and chunking | Status → INDEXED in DB | ⬜ Pending |
| Semantic retrieval returning results | Score > 0.20 for relevant query | ⬜ Pending |
| Citation accuracy | Source doc title + section returned | ⬜ Pending |
| Insufficient evidence handling | "No relevant document" response | ⬜ Pending |
| Tenant isolation | ORG-B cannot retrieve ORG-A docs | ⬜ Pending |

### Gate 6 — CRM & Business Operations

| Check | Expected | Status |
|-------|----------|--------|
| Lead CRUD via `/api/crm/leads` | 201/200 responses | ⬜ Pending |
| Lead stage history tracked | `lead_stage_histories` rows created | ⬜ Pending |
| Finance invoice creation | 18% GST calculated correctly | ⬜ Pending |
| Data Studio KPIs from real DB | No mock data in production | ⬜ Pending |

### Gate 7 — Security & Quality

| Check | Command | Status |
|-------|---------|--------|
| All 33 Jest tests pass | `npm test` | ✅ PASS |
| TypeScript no errors | `npx tsc --noEmit` | ⬜ Pending |
| No hardcoded secrets | `git grep -r "password\|secret\|key"` | ⬜ Pending |
| RBAC enforcement tested | Unauthorized requests return 401/403 | ⬜ Pending |
| Production build succeeds | `npm run build` | ⬜ Pending |

---

## Vercel Configuration

### Required Environment Variables (Vercel Dashboard)

```bash
# Database (use Neon, Supabase, or PlanetScale for Vercel-compatible PostgreSQL)
DATABASE_URL=postgresql://user:pass@host:5432/flowmind_prod?schema=public&connection_limit=5&pool_timeout=20
DIRECT_DATABASE_URL=postgresql://user:pass@host:5432/flowmind_prod?schema=public

# Auth
JWT_SECRET=<generate: openssl rand -base64 32>
SESSION_COOKIE_NAME=flowmind_session

# Encryption (for BYOK)
ENCRYPTION_MASTER_KEY=<generate: openssl rand -hex 32>

# App URL
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app

# Email (Resend)
RESEND_API_KEY=re_xxxxxxxxxxxx
EMAIL_FROM=noreply@your-domain.com

# AI Providers (optional — users can BYOK via settings)
# GEMINI_API_KEY=AIzaSy...
# OPENAI_API_KEY=sk-...

# Node
NODE_ENV=production
```

### Prisma Configuration for Serverless

Add to `prisma/schema.prisma`:
```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_DATABASE_URL")
}
```

Add to `src/lib/prisma.ts` (ensure connection pooling for serverless):
```typescript
import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
```

---

## Production Database Setup

### Step 1: Provision PostgreSQL

**Recommended providers for Vercel:**
- **Neon** (serverless PostgreSQL, Vercel-native integration)
- **Supabase** (managed PostgreSQL with connection pooling)
- **Railway** (simple PostgreSQL hosting)
- **PlanetScale** (requires driver adapter)

### Step 2: Run migrations in production

```bash
# Option A: Prisma migrate deploy (recommended)
npx prisma migrate deploy

# Option B: Prisma db push (for prototyping)
npx prisma db push
```

### Step 3: Seed initial data (if needed)

```bash
npx prisma db seed
```

### Step 4: Verify connection

```bash
npx prisma db pull --force
```

---

## Document and File Storage

**Current:** Documents stored in-memory only during development.

**Required for production:**
- Use **Vercel Blob**, **AWS S3**, **Cloudflare R2**, or **Supabase Storage**
- Update `ragService.ts` to store/retrieve files from object storage
- Store `fileUrl` in `KnowledgeDocument.fileUrl` field (already in schema)

**Recommended:** Vercel Blob
```bash
npm install @vercel/blob
```

---

## Background Jobs

**Current:** No persistent background job system.

**Required for production (scheduled workflows & email):**
- Use **Vercel Cron Jobs** (via `vercel.json`)
- Or use **Trigger.dev**, **Inngest**, or **QStash** for durable jobs

Example `vercel.json`:
```json
{
  "crons": [
    {
      "path": "/api/cron/scan-insights",
      "schedule": "0 * * * *"
    },
    {
      "path": "/api/cron/send-scheduled-emails",
      "schedule": "*/15 * * * *"
    }
  ]
}
```

---

## Deployment Steps (When Gates Are All PASS)

1. **Final local test run:** `npm test && npx tsc --noEmit && npm run build`
2. **Review environment variables** — ensure no localhost URLs in production config
3. **Connect GitHub repo to Vercel**
4. **Configure all environment variables** in Vercel dashboard
5. **Run production DB migration:** `npx prisma migrate deploy`
6. **Deploy:** Vercel will auto-build on push to `main`
7. **Verify deployment:** Test all 7 gates against production URL
8. **Monitor:** Check Vercel function logs for first 24 hours

---

## Post-Deployment Verification

```bash
# Health check
curl https://your-app.vercel.app/api/auth/me

# Database connectivity (should return 401 without auth)
curl https://your-app.vercel.app/api/conversations

# TypeScript build artifacts clean
# Check Vercel build logs for no errors
```

---

## ⚠️ PRODUCTION BLOCKERS (Must Fix Before Deploy)

1. **Local filesystem RAG storage** → Must migrate to object storage (Vercel Blob/S3)
2. **In-memory job queue** → Must migrate to durable queue (Inngest/Trigger.dev)
3. **Scheduled email timers** → Must use Vercel Cron, not in-memory timeouts
4. **Connection pooling** → Prisma must use pooling URL for serverless (Neon/Supabase)
5. **JWT secret strength** → Must use cryptographically random 32+ character secret

---

## Final Deployment Authorization

**Status: NOT READY FOR DEPLOYMENT** (as of initial audit)

Required actions:
- [ ] All 7 local gates passing
- [ ] PostgreSQL production database provisioned
- [ ] Object storage configured for RAG documents
- [ ] Background job system configured
- [ ] All production env vars documented and ready
- [ ] Final `npm run build` succeeds with zero errors

**DO NOT DEPLOY TO VERCEL WITHOUT EXPLICIT USER APPROVAL**
