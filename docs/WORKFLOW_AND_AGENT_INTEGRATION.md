# FlowMind AI — Workflow & Agent Integration Guide
> Version: 2.0 | Sprint: Week 8 Production Hardening | Date: November 2026

## Overview

All FlowMind AI workflows are centrally persisted in PostgreSQL and accessible to all authorized chatbots and agents. This document describes the architecture, APIs, and cross-agent integration patterns.

---

## Centralized Workflow Repository

### Database Models

```
workflows
├── id (UUID, stable across sessions)
├── organizationId (tenant isolation)
├── name
├── description
├── category (GENERAL, CRM, FINANCE, HR, INVENTORY, SUPPORT)
├── naturalTrigger (original NL request)
├── triggerType (manual, scheduled, webhook, event)
├── triggerConfig (JSON)
├── status (DRAFT, VALIDATED, ACTIVE, PAUSED, DISABLED, ARCHIVED)
├── createdById
└── versions[] → WorkflowVersion
    ├── versionNumber
    ├── dagNodes (JSON — validated DSL)
    ├── dagEdges (JSON)
    └── executions[] → WorkflowExecution
        ├── status (QUEUED, RUNNING, COMPLETED, FAILED, etc.)
        ├── nodeExecutions[] → WorkflowNodeExecution
        └── approvalRequests[] → ApprovalRequest
```

### Workflow API Endpoints

| Method | Route | Description | Auth |
|--------|-------|-------------|------|
| `GET` | `/api/workflows` | List organization workflows | Any |
| `POST` | `/api/workflows` | Create workflow from NL or DAG | Manager+ |
| `GET` | `/api/workflows/{id}` | Get workflow with versions | Any |
| `PATCH` | `/api/workflows/{id}` | Update workflow | Manager+ |
| `POST` | `/api/workflows/{id}/execute` | Execute a workflow | Manager+ |
| `GET` | `/api/workflows/{id}/executions` | View execution history | Any |
| `POST` | `/api/workflows/webhook/{id}` | Webhook trigger | External |

---

## Cross-Agent Workflow Access

### Scenario: Chatbot MVP Creates, Finance Agent Retrieves

```
1. User → Chatbot MVP:
   "Create a workflow to remind customers about overdue invoices every Monday"

2. Chatbot MVP → Workflow Planner:
   - Parses natural language intent
   - Generates DAG JSON using approved node registry
   - Validates with Kahn's topological sort
   - Saves to PostgreSQL via POST /api/workflows

3. Workflow saved with:
   {
     "id": "WF-abc123",
     "name": "Monday Invoice Reminder",
     "naturalTrigger": "remind customers about overdue invoices every Monday",
     "category": "FINANCE",
     "triggerType": "scheduled",
     "triggerConfig": { "cron": "0 9 * * 1" }
   }

4. User → Finance Agent (later session):
   "Find the invoice reminder workflow"

5. Finance Agent → GET /api/workflows?category=FINANCE&search=invoice+reminder
   Returns the same workflow by stable ID "WF-abc123"

6. Finance Agent presents workflow details without regenerating it
```

### Duplicate Prevention

Before creating a new workflow, the agent searches for existing workflows:
```typescript
const existing = await workflowService.searchWorkflows(orgId, {
  search: naturalLanguageRequest,
  category,
  status: ['ACTIVE', 'VALIDATED'],
});

if (existing.length > 0 && similarity(existing[0].naturalTrigger, request) > 0.8) {
  // Return existing workflow instead of creating duplicate
  return { workflow: existing[0], isExisting: true };
}
```

---

## Agent Capability Registry

Each agent has registered capabilities determining what workflows it can create and execute:

| Agent | Workflow Categories | Execute Permission |
|-------|-------------------|-------------------|
| CEO Agent | ALL | With approval |
| Sales Agent | CRM, GENERAL | Manager+ |
| Finance Agent | FINANCE, GENERAL | Manager+ |
| HR Agent | HR, GENERAL | Manager+ |
| Support Agent | SUPPORT, GENERAL | Any |
| Workflow Planner | ALL | Admin only |
| Analytics Agent | READ-ONLY | Any |

---

## DAG Validation (Kahn's Algorithm)

All workflow DAGs are validated before saving:

```typescript
// From src/lib/workflow/dagValidator.ts
function validateDAG(nodes: WorkflowNode[], edges: WorkflowEdge[]): ValidationResult {
  // 1. Build adjacency + in-degree map
  const inDegree = new Map<string, number>();
  const adjList = new Map<string, string[]>();
  
  for (const node of nodes) {
    inDegree.set(node.id, 0);
    adjList.set(node.id, []);
  }
  
  for (const edge of edges) {
    adjList.get(edge.source)!.push(edge.target);
    inDegree.set(edge.target, (inDegree.get(edge.target) || 0) + 1);
  }
  
  // 2. Kahn's topological sort
  const queue = [...inDegree.entries()]
    .filter(([, degree]) => degree === 0)
    .map(([id]) => id);
  
  let processed = 0;
  while (queue.length > 0) {
    const nodeId = queue.shift()!;
    processed++;
    for (const neighbor of adjList.get(nodeId)!) {
      inDegree.set(neighbor, inDegree.get(neighbor)! - 1);
      if (inDegree.get(neighbor) === 0) queue.push(neighbor);
    }
  }
  
  // 3. Cycle detection
  if (processed !== nodes.length) {
    return { valid: false, error: 'Cyclic dependency detected — workflow rejected' };
  }
  
  return { valid: true, topologicalOrder: [...] };
}
```

---

## Agent Response Contract

Every agent returns a standardized response:

```typescript
interface AgentResponse {
  agentId: string;           // e.g. "Sales", "Finance", "HR"
  taskStatus: 'SUCCESS' | 'PARTIAL' | 'FAILED' | 'NEEDS_INPUT';
  result: any;               // Domain-specific result
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
  sources?: string[];        // Data references (e.g. "Invoice INV-001", "Lead LEAD-101")
  proposedActions?: Array<{
    type: string;
    description: string;
    requiresApproval: boolean;
    riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  }>;
  errors?: string[];
  handoff?: {
    targetAgent: string;
    reason: string;
    context: Record<string, any>;
  };
}
```

---

## Workflow Execution Reliability

### Retry Policies

| Node Type | Max Retries | Backoff Strategy |
|-----------|------------|-----------------|
| API Call | 3 | Exponential (1s, 2s, 4s) |
| Email Send | 2 | Fixed 5s delay |
| Database Write | 3 | Immediate |
| AI Agent Call | 2 | Exponential (2s, 8s) |
| Human Approval | Infinite | Wait until resolved |

### Idempotency

Workflow executions use unique execution IDs to prevent double-execution:
- Webhook triggers include idempotency keys
- Scheduled triggers check for existing running executions before starting
- Failed executions can be retried from the last successful node

### Execution State Persistence

All execution state is persisted in PostgreSQL:
```
WorkflowExecution.status = RUNNING
WorkflowNodeExecution.status = SUCCESS | FAILED | RETRYING
```

Executions survive server restarts — the DAG runner can resume from persisted state.

---

## Approved Node Registry

Only approved node types can be executed (no arbitrary code execution):

```typescript
const APPROVED_NODE_TYPES = [
  'send_email',          // Email via emailService
  'create_lead',         // CRM lead creation
  'update_lead_stage',   // CRM stage progression
  'create_invoice',      // Finance invoice generation
  'send_invoice',        // Finance invoice delivery
  'create_ticket',       // Support ticket
  'update_ticket',       // Support ticket update
  'notify_user',         // In-app notification
  'wait_for_approval',   // Human-in-the-loop pause
  'conditional_branch',  // Branching logic
  'delay',               // Time delay
  'query_database',      // Safe parameterized read
  'trigger_workflow',    // Sub-workflow execution
  'ai_agent_task',       // Agent delegation
  'webhook_call',        // External HTTP call (allowlisted URLs only)
];
```

No LLM-generated SQL or JavaScript is executed directly.

---

## Webhook and Scheduled Triggers

### Webhook Trigger
```
POST /api/workflows/webhook/{workflowId}
Content-Type: application/json

{
  "event": "invoice.overdue",
  "payload": { "invoiceId": "INV-001" },
  "idempotencyKey": "evt_12345"
}
```

### Scheduled Trigger (via Vercel Cron)
```json
// vercel.json
{
  "crons": [
    {
      "path": "/api/cron/execute-scheduled-workflows",
      "schedule": "*/15 * * * *"
    }
  ]
}
```
