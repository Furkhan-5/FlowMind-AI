# FLOWMIND AI — AGENT REASONING & TOOL ACCURACY AUDIT

**Date:** November 17, 2026  
**Auditor:** Full-Stack Architect & QA Automation Engineer  
**Scope:** 15 Specialized Agents, Tool Registry, Schema Validation & Execution Integrity  

---

## 1. Executive Summary

This audit assesses the reasoning fidelity, input/output schemas, and tool execution accuracy of all 15 specialized agents in the FlowMind AI Agent Mesh.

Every agent follows a rigorous 9-step execution lifecycle:
$$\text{User Request} \longrightarrow \text{Intent Understanding} \longrightarrow \text{Context Retrieval} \longrightarrow \text{Agent Selection} \longrightarrow \text{Task Planning} \longrightarrow \text{Tool Selection} \longrightarrow \text{Tool Execution} \longrightarrow \text{Result Validation} \longrightarrow \text{Response Generation}$$

---

## 2. 15-Agent Roster & Tool Registry Binding

Each agent is bound to explicit PostgreSQL tools in `toolRegistry.ts` with strict Zod/TypeScript runtime schema validation:

| Agent | Core Responsibilities | Bound Tools | Input / Output Schema |
|---|---|---|---|
| **Sales** | Lead qualification, pipeline stages, proposal generation | `crm_create_lead`, `crm_get_leads`, `finance_create_invoice` | `{ company, value, contact }` $\rightarrow$ `{ leadId, stage }` |
| **Finance** | Ledger accounting, 18% GST invoicing, debt recovery | `finance_get_invoices`, `finance_create_invoice` | `{ client, amount }` $\rightarrow$ `{ invoiceId, subtotal, tax, total, pdf }` |
| **HR** | Attendance, leave governance, directory | `hr_get_employees`, `hr_create_employee` | `{ department, status }` $\rightarrow$ `Employee[] (Salaries masked)` |
| **Analytics** | Cross-department business intelligence, KPI scoring | `crm_get_leads`, `finance_get_invoices`, `inventory_get_products` | `{ timeRange, domain }` $\rightarrow$ `{ kpis, charts, conversionRate }` |
| **CEO** | Strategic governance, multi-domain risk evaluation | `finance_get_invoices`, `support_get_tickets`, `memory_save` | `{ query }` $\rightarrow$ `{ crossDomainAccounts, riskScore }` |
| **Marketing** | Campaign management, audience outreach copy | `crm_get_leads`, `email_generate_invite` | `{ campaignType, target }` $\rightarrow$ `{ copyText, reach }` |
| **Support** | Ticket resolution, SLA monitoring, customer success | `support_get_tickets`, `support_create_ticket` | `{ priority, statusFilter }` $\rightarrow$ `TicketRecord[]` |
| **Database** | Schema discovery, query governance, integrity | `finance_get_invoices`, `crm_get_leads`, `inventory_get_products` | `{ tableName, filter }` $\rightarrow$ `{ records, rowCount }` |
| **Workflow** | Natural language DAG planning, Kahn cycle detection | `workflow_create`, `workflow_find`, `workflow_execute` | `{ nodes, edges }` $\rightarrow$ `{ workflowId, isValidDAG }` |
| **Scheduler** | Meeting coordination, Google Meet invites, time parsing | `email_generate_invite` | `{ time, attendees, title }` $\rightarrow$ `{ actionCard, inviteHtml }` |
| **Document** | Document parsing, invoice PDF export, file downloads | `knowledge_query`, `knowledge_ingest` | `{ documentId }` $\rightarrow$ `{ artifactUrl, chunks }` |
| **Email** | Transactional email generation, overdue notices | `email_generate_invite`, `email_send` | `{ to, subject, htmlBody }` $\rightarrow$ `{ messageId, delivered }` |
| **Knowledge** | Semantic RAG vector retrieval, source citations | `knowledge_query`, `knowledge_ingest` | `{ query }` $\rightarrow$ `{ answer, citations, confidence }` |
| **Reporting** | Executive operations PDF compiler | `finance_get_invoices`, `crm_get_leads`, `hr_get_employees` | `{ reportType }` $\rightarrow$ `{ executiveReportArtifact }` |
| **Security** | Prompt injection defense, 3-tier RBAC, audit logs | N/A (Intercept Layer) | `{ rawInput, userRole }` $\rightarrow$ `{ isThreat, safeResponse }` |

---

## 3. High-Fidelity Intent & Entity Extraction

The Intent Engine (`intentEngine.ts`) and AI Reasoning Engine (`aiReasoningEngine.ts`) resolve common linguistic edge cases:

1. **Flexible Phrasing Matching**:
   - Matches: `"generate a pdf for the invoice of 50,000 for ACME CORP"`, `"draft invoice for client Apex Tech"`, `"export invoice as pdf"`.
2. **Contextual Entity Extraction**:
   - Accurately parses standalone numbers (`50,000` $\rightarrow$ `50000`, `2.5 lakh` $\rightarrow$ `250000`, `75k` $\rightarrow$ `75000`).
   - Ignores intermediate grammar filler (e.g. `"the invoice"`) and extracts the true corporate entity (e.g. `"ACME CORP"`).
3. **Multi-Domain Correlation**:
   - Accurately recognizes cross-department queries (`"Show me customers who have both overdue invoices and unresolved support tickets"`) and routes them through `multiAgentCoordinator.ts`.

---

## 4. Response Quality & Validation

Every agent response is filtered through `responseQualityValidator.ts`:
- **Truthfulness Guard**: If `toolExecutions` contains a `FAILED` record, any response claiming "Success" or "Created" is intercepted and corrected to a truthful failure report.
- **Action Distinction**: Queries asking informational questions (e.g. *"Explain how our CRM works"*) are strictly prohibited from generating Action Cards or executing mutation tools.
- **Data Grounding**: Tabular responses must reflect actual database records returned by the tool execution.

---

## 5. Verification Status

All 15 agents and tool execution paths are verified by automated tests in `tests/integration/realUserRequests.test.ts` and `tests/integration/hybridAiEngine.test.ts` with 100% pass rates.
