# FlowMind AI — AI Memory Architecture
> Version: 2.0 | Sprint: Week 8 Production Hardening | Date: November 2026

## Overview

FlowMind AI implements a **three-tier persistent memory system** backed by PostgreSQL, ensuring all conversation context, user preferences, and organizational knowledge survive browser refreshes, session changes, and server restarts.

---

## Memory Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                        USER REQUEST                                  │
│                (via ChatInterface / Specialized Agent)               │
└─────────────────────────┬───────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    MEMORY RETRIEVAL LAYER                            │
│                                                                      │
│  1. Short-term: Zustand in-memory sliding window (last 10 turns)    │
│  2. Long-term: PostgreSQL UserMemory table (keyword + recency rank)  │
│  3. Org Memory: PostgreSQL OrgMemory table (shared business context) │
│                                                                      │
│  → Combined context injected into agent prompt                       │
└─────────────────────────┬───────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────────┐
│                     AGENT ORCHESTRATOR                               │
│                                                                      │
│  → Prompt = User Query + Short-term History + Relevant Memories      │
│  → Routes to appropriate specialist agent                            │
│  → Generates structured response                                     │
└─────────────────────────┬───────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────────┐
│                   PERSISTENCE LAYER (async, non-blocking)            │
│                                                                      │
│  A. Message Persistence:                                             │
│     POST /api/conversations/{id}/messages                            │
│     → Stores: sender, content, agentId, language, metadata          │
│     → Table: messages (FK: conversation_id)                          │
│                                                                      │
│  B. Memory Extraction:                                               │
│     Pattern matching on user message                                 │
│     → "remember that X", "our X uses Y", "note that Z"              │
│     → POST /api/memory                                               │
│     → Table: user_memories (scope: PRIVATE | ORG_SHARED)            │
│                                                                      │
│  C. Audit Logging:                                                   │
│     → Table: audit_logs (all significant actions)                    │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Memory Tiers

### Tier A — Short-Term Memory (In-Memory, Per Session)

| Property | Detail |
|----------|--------|
| Storage | Zustand React state |
| Scope | Current browser tab / session |
| Capacity | Sliding window of last 10 message pairs |
| Persistence | Lost on page refresh (intentional for performance) |
| Use | Maintains conversational coherence within a session |

### Tier B — Long-Term User Memory (PostgreSQL)

| Property | Detail |
|----------|--------|
| Storage | `user_memories` table |
| Scope | Per user, per organization |
| Privacy | `PRIVATE` or `ORG_SHARED` |
| Retrieval | Keyword search + recency + confidence scoring |
| Trigger | Pattern matching: "remember that...", "our X is...", etc. |
| Persistence | Survives restarts, logouts, and new sessions |
| API | `GET /api/memory?q=<query>`, `POST /api/memory`, `DELETE /api/memory?id=<id>` |

### Tier C — Organizational Memory (PostgreSQL)

| Property | Detail |
|----------|--------|
| Storage | `org_memories` table |
| Scope | Entire organization (all users) |
| Access | RBAC-enforced (Admin can write, all can read authorized entries) |
| Categories | POLICY, CRM_CONTEXT, WORKFLOW, GENERAL |
| Use | Shared company policies, approved business facts, operational context |

---

## Memory Models (Prisma)

### UserMemory
```prisma
model UserMemory {
  id             String   @id
  organizationId String
  userId         String
  memoryKey      String
  content        String
  source         String   @default("CONVERSATION") // CONVERSATION, EXPLICIT, SYSTEM
  scope          String   @default("PRIVATE")       // PRIVATE, ORG_SHARED
  confidence     Float    @default(0.8)
  tags           String[]
  expiresAt      DateTime?
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt
}
```

### OrgMemory
```prisma
model OrgMemory {
  id             String   @id
  organizationId String
  memoryKey      String
  content        String
  source         String
  category       String   @default("GENERAL")
  confidence     Float    @default(0.9)
  tags           String[]
  createdById    String?
  expiresAt      DateTime?
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt
}
```

---

## Memory Acceptance Tests

### Test 1: Message Persistence
1. Send a message in Chatbot MVP
2. Verify: `SELECT * FROM messages ORDER BY timestamp DESC LIMIT 1`
3. Expected: Message row exists with correct user_id, content, conversation_id
4. Status: ✅ PASS (after Phase 1 implementation)

### Test 2: Memory Extraction
1. Send: "Remember that our sales team uses CRM for lead management"
2. Verify: `SELECT * FROM user_memories WHERE content ILIKE '%sales team%'`
3. Expected: Row with scope='ORG_SHARED', confidence >= 0.8
4. Status: ✅ PASS (after Phase 1 implementation)

### Test 3: Memory Retrieval (New Conversation)
1. Close browser, restart dev server
2. Open Chatbot MVP, start new conversation
3. Ask: "Which module does our sales team use?"
4. Expected: Response references CRM from stored memory
5. Status: ✅ PASS (memory context injected via `/api/memory?q=sales team`)

### Test 4: Memory Isolation
1. Log in as User A, save private memory
2. Log in as User B (same org)
3. Ask about User A's private memory
4. Expected: User B cannot retrieve User A's PRIVATE memories
5. Status: ✅ PASS (WHERE clause enforces userId for PRIVATE scope)

---

## Memory Service API

### `GET /api/memory?q={query}&scope={PRIVATE|ORG_SHARED|ALL}`
Returns ranked relevant memories for the authenticated user.

**Response:**
```json
{
  "memories": [
    {
      "id": "usr123-crm_preference",
      "key": "crm_preference",
      "content": "Our sales team uses CRM for lead management",
      "scope": "ORG_SHARED",
      "confidence": 0.85,
      "relevanceScore": 0.72
    }
  ]
}
```

### `POST /api/memory`
Save a new memory or update an existing one (upsert by key).

**Body:**
```json
{
  "memoryKey": "sales_tool",
  "content": "Our sales team uses CRM for lead management",
  "scope": "ORG_SHARED",
  "confidence": 0.85,
  "tags": ["sales", "crm"]
}
```

### `DELETE /api/memory?id={id}`
Delete a memory (user can only delete their own PRIVATE memories).

---

## Privacy & Security

- Private memories are strictly scoped to `userId` — no cross-user access
- Org-shared memories are accessible to all users in the same `organizationId`
- Memory extraction is pattern-based, not automatic for every message
- Users can view, correct, and delete their memories via `/memory` page
- Audit log entry created for memory save/delete operations
- Memory content is never logged or exposed in error messages
