# FlowMind AI — Production Environment Configuration Checklist

This checklist documents all environment variables required for deploying FlowMind AI to production (Vercel Serverless + Managed PostgreSQL + Google Gemini).

---

## 1. Environment Variables Matrix

| Variable Name | Required | Scope | Format Specification | Production Purpose | Security Status |
| :--- | :---: | :---: | :--- | :--- | :---: |
| `DATABASE_URL` | **YES** | Server | `postgresql://user:pass@pooler-host:6543/db?pgbouncer=true` | PgBouncer / Connection Pool URL for Prisma Client | **VERIFIED (Server-only)** |
| `DIRECT_DATABASE_URL` | **YES** | Server | `postgresql://user:pass@direct-host:5432/db` | Direct unpooled connection URL for Prisma CLI & DDL | **VERIFIED (Server-only)** |
| `GEMINI_API_KEY` | **YES** | Server | `AIzaSy...` or Google AI Studio API key | Centralized LLM inference across all 15 agents | **VERIFIED (Server-only)** |
| `ENCRYPTION_MASTER_KEY`| **YES** | Server | 64-character hex string (32 bytes / 256 bits) | AES-256-GCM BYOK encryption of tenant credentials | **VERIFIED (Server-only)** |
| `JWT_SECRET` | **YES** | Server | Minimum 32-character high-entropy random string | HMAC-SHA256 session token signature generation | **VERIFIED (Server-only)** |
| `CRON_SECRET` | **YES** | Server | Minimum 32-character high-entropy random string | Bearer token authorization for Vercel Cron routes | **VERIFIED (Server-only)** |
| `NODE_ENV` | **YES** | System | `production` | Enables production optimizations and security rules | **VERIFIED (System)** |
| `SESSION_COOKIE_NAME` | NO | Server | Alphanumeric (default: `flowmind_session_token`) | HTTP-only cookie name for authentication sessions | **VERIFIED (Server-only)** |
| `RESEND_API_KEY` | NO | Server | `re_...` | Transactional email provider for notification workflows | **OPTIONAL** |
| `EMAIL_FROM` | NO | Server | `noreply@flowmind.ai` | Sender address for outgoing emails | **OPTIONAL** |

---

## 2. Key Generation & Cryptographic Guidelines

### A. ENCRYPTION_MASTER_KEY (AES-256-GCM)
The encryption service (`src/lib/services/encryptionService.ts`) requires exactly 32 bytes (256 bits).
Generate using Node.js crypto:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```
*Note: This key must remain constant once credentials have been encrypted in the database. Rotating it requires a key-rotation migration script to decrypt existing records with the old key and re-encrypt with the new key.*

### B. JWT_SECRET (HMAC-SHA256)
Generate a high-entropy 256-bit string:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"
```

### C. CRON_SECRET (Vercel Cron Bearer Token)
Generate a secure authorization token:
```bash
node -e "console.log(require('crypto').randomBytes(24).toString('hex'))"
```

---

## 3. Client-Side Secret Leakage Audit

A comprehensive static analysis was conducted across all files under `src/` to identify potential exposure through `NEXT_PUBLIC_` variables:

```powershell
Get-ChildItem -Path src -Recurse -Filter *.ts* | Select-String "NEXT_PUBLIC"
```

**Audit Result: PASS (0 occurrences found)**
- No credentials, master keys, connection strings, or service tokens are prefixed with `NEXT_PUBLIC_`.
- No sensitive environment variables are included in Next.js browser client bundles.
- All credential operations occur exclusively in Server Components or API Route Handlers.

---

## 4. Pre-Deployment Validation Commands

Run these verification commands before initiating a production build to validate environment readiness without leaking secret values:

### 1. Verify Prisma Environment Configuration
```powershell
node -e "
  const db = process.env.DATABASE_URL;
  const direct = process.env.DIRECT_DATABASE_URL;
  console.log('DATABASE_URL defined:', !!db);
  console.log('DIRECT_DATABASE_URL defined:', !!direct);
  if (db && !db.includes('pgbouncer=true') && !db.includes('pooler')) {
    console.warn('WARNING: DATABASE_URL appears to be direct rather than connection-pooled.');
  }
"
```

### 2. Verify AES-256-GCM Master Key Length
```powershell
node -e "
  const key = process.env.ENCRYPTION_MASTER_KEY;
  if (!key) {
    console.error('ERROR: ENCRYPTION_MASTER_KEY is undefined!');
  } else if (key.length !== 64) {
    console.error('ERROR: ENCRYPTION_MASTER_KEY must be exactly 64 hex characters (32 bytes). Current length:', key.length);
  } else {
    console.log('PASS: ENCRYPTION_MASTER_KEY is valid 256-bit hex string.');
  }
"
```

### 3. Verify Gemini API Key Availability
```powershell
node -e "
  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    console.error('ERROR: GEMINI_API_KEY is undefined!');
  } else {
    console.log('PASS: GEMINI_API_KEY is present (Masked: ••••••••' + key.slice(-4) + ')');
  }
"
```

---

## 5. Vercel Project Settings Configuration

In the Vercel Dashboard under **Project Settings > Environment Variables**:

1. Add `DATABASE_URL` -> Target: **Production**, **Preview**.
2. Add `DIRECT_DATABASE_URL` -> Target: **Production**, **Preview**.
3. Add `GEMINI_API_KEY` -> Target: **Production**, **Preview**.
4. Add `ENCRYPTION_MASTER_KEY` -> Target: **Production**, **Preview**.
5. Add `JWT_SECRET` -> Target: **Production**, **Preview**.
6. Add `CRON_SECRET` -> Target: **Production**, **Preview**.
7. Set `NODE_ENV` to `production` (Automatically set by Vercel for production deployments).
