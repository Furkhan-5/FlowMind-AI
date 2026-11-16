# FLOWMIND AI — AGENT TOOL EXECUTION AUDIT
> **Audit Date:** November 16, 2026 | **Registry Version:** 3.0  
> **Backend Integration:** `businessService.ts`, `ragService.ts`, `emailService.ts`, `workflowService.ts`, `memoryService.ts`  
> **Database Persistence:** PostgreSQL 18 + Prisma ORM 5.19.1

---

## 1. Registered Tools & Backend Execution Map

Every tool registered in `ToolRegistryService` (`src/lib/ai/toolRegistry.ts`) is mapped to a concrete, authenticated backend service method:

| Tool Name | Domain | Backend Service Invocation | PostgreSQL Table(s) | Role Authorization |
| :--- | :--- | :--- | :--- | :--- |
| `crm_get_leads` | CRM | `businessService.getLeads(orgId)` | `leads` | `ADMIN`, `MANAGER`, `EMPLOYEE` |
| `crm_create_lead` | CRM | `businessService.createLead(data, user)` | `leads`, `activity_logs` | `ADMIN`, `MANAGER`, `EMPLOYEE` |
| `crm_analyze_conversions` | CRM | Aggregation over `businessService.getLeads` | `leads` | `ADMIN`, `MANAGER`, `EMPLOYEE` |
| `finance_get_invoices` | Finance | `businessService.getInvoices(orgId)` | `invoices`, `invoice_items` | `ADMIN`, `MANAGER`, `EMPLOYEE` |
| `finance_create_invoice` | Finance | `businessService.createInvoice(data, user)` | `invoices`, `invoice_items` | `ADMIN`, `MANAGER` |
| `hr_get_employees` | HR | `businessService.getEmployees(orgId, role)` | `employees` (Salary masked) | `ADMIN`, `MANAGER`, `EMPLOYEE` |
| `hr_get_leaves` | HR | `businessService.getLeaveRequests(orgId)` | `leave_requests` | `ADMIN`, `MANAGER`, `EMPLOYEE` |
| `inventory_get_products` | Inventory | `businessService.getProducts(orgId)` | `products` | `ADMIN`, `MANAGER`, `EMPLOYEE` |
| `support_get_tickets` | Support | `businessService.getTickets(orgId)` | `support_tickets` | `ADMIN`, `MANAGER`, `EMPLOYEE` |
| `knowledge_query` | Knowledge | `ragService.queryKnowledgeBase(query, user)` | `knowledge_documents`, `document_chunks` | `ADMIN`, `MANAGER`, `EMPLOYEE` |
| `email_generate_invite` | Communications | `emailService.generateMeetingInviteEmail(...)` | In-memory / ICS Generation | `ADMIN`, `MANAGER`, `EMPLOYEE` |
| `workflow_create` | Workflow | `workflowService.saveWorkflow(wfDef)` | `workflows`, `workflow_versions` | `ADMIN`, `MANAGER`, `EMPLOYEE` |
| `workflow_find` | Workflow | `workflowService.getAllWorkflows(orgId)` | `workflows`, `workflow_versions` | `ADMIN`, `MANAGER`, `EMPLOYEE` |
| `memory_save` | Persistent Memory | `memoryService.extractAndSaveMemory(userId, orgId, content)` | `user_memories` | `ADMIN`, `MANAGER`, `EMPLOYEE` |

---

## 2. Tool Execution Rules & Safety Baselines

1. **No Silent Failures:** When a backend tool execution fails (e.g. database connection error or schema constraint violation), `toolRegistry.executeTool` catches the exception, logs the event with full error metadata, and returns a `ToolExecutionRecord` with `executionStatus: 'FAILED'`.
2. **Honesty Enforcement:** The `ResponseQualityValidator` verifies that if any tool fails, the agent never outputs a message claiming success. It outputs a clear, honest error notification explaining the issue to the user.
3. **Server-Side Authorization:** Every tool checks the requesting user's `UserRole`. If an unauthorized role attempts to call a restricted tool (e.g. `EMPLOYEE` calling `finance_create_invoice`), access is blocked with a security audit event logged and `executionStatus: 'BLOCKED'`.
4. **Execution Performance:** All 14 built-in tools complete in under 50 milliseconds in local integration benchmarks.
