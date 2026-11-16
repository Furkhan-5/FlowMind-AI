# FLOWMIND AI — 15 SPECIALIZED AGENTS CAPABILITY & ROUTING REGISTRY
> **Platform:** FlowMind AI Autonomous Operating System  
> **Registry Version:** 3.0 | **Audited:** November 16, 2026  
> **Mesh Architecture:** 15 Specialized Domain Agents + Master CEO Orchestrator

---

## 1. Complete Capability Matrix for All 15 Agents

| Agent ID | Agent Name | Primary Business Domain | Supported Intents | Registered Tools | Required Roles | Output Formats |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **CEO** | Master Orchestrator | Cross-Department Governance & Strategy | `CROSS_DOMAIN_OVERDUE_AND_SUPPORT`<br>`EXPLAIN_SIMPLER`<br>`MEMORY_PERSIST`<br>`GENERAL_EXECUTIVE_QUERY` | `memory_save`<br>Orchestration of all sub-agent tools | `ADMIN`, `MANAGER`, `EMPLOYEE` | `TABLE`, `SUMMARY`, `TEXT` |
| **Sales** | Sales & CRM Agent | CRM, Leads, Pipelines & Deal Conversions | `CRM_GET_LEADS`<br>`CRM_GET_STALE_LEADS`<br>`CRM_GET_LATE_STAGE_DEALS`<br>`CRM_CREATE_LEAD`<br>`CRM_ANALYZE_TOP_REPRESENTATIVE`<br>`CRM_EXPLAIN_PROCESS` | `crm_get_leads`<br>`crm_create_lead`<br>`crm_analyze_conversions` | `ADMIN`, `MANAGER`, `EMPLOYEE` | `TABLE`, `RECORD`, `SUMMARY`, `CONFIRMATION_CARD` |
| **Finance** | Finance & Billing Agent | Invoicing, Receivables, Overdue Payments & Indian 18% GST | `FINANCE_GET_PENDING_INVOICES`<br>`FINANCE_GET_OVERDUE_INVOICES`<br>`FINANCE_CREATE_INVOICE`<br>`FINANCE_ANALYZE_TAX` | `finance_get_invoices`<br>`finance_create_invoice` | `ADMIN`, `MANAGER` (Write), `EMPLOYEE` (Read) | `TABLE`, `RECORD`, `INVOICE` |
| **HR** | People & Culture Agent | Employee Directory, Leave Requests & Attendance | `HR_GET_EMPLOYEES`<br>`HR_GET_EMPLOYEES_ON_LEAVE`<br>`HR_APPROVE_LEAVE` | `hr_get_employees`<br>`hr_get_leaves` | `ADMIN`, `MANAGER`, `EMPLOYEE` (Salary masked) | `TABLE`, `SUMMARY` |
| **Database** | Database & Records Agent | Inventory Catalog, Warehouse Stock & Safety Thresholds | `INVENTORY_GET_PRODUCTS`<br>`INVENTORY_GET_LOW_STOCK`<br>`DB_INSPECT_SCHEMA` | `inventory_get_products` | `ADMIN`, `MANAGER`, `EMPLOYEE` | `TABLE`, `RECORD` |
| **Support** | Customer Support Agent | Support Tickets, Priority Escalations & SLA Monitoring | `SUPPORT_GET_TICKETS`<br>`SUPPORT_GET_HIGH_PRIORITY_TICKETS`<br>`SUPPORT_CREATE_TICKET` | `support_get_tickets` | `ADMIN`, `MANAGER`, `EMPLOYEE` | `TABLE`, `RECORD` |
| **Workflow** | Workflow Automation Agent | DAG Pipeline Compilation, Kahn Validation & Scheduling | `WORKFLOW_CREATE`<br>`WORKFLOW_FIND`<br>`WORKFLOW_EXECUTE` | `workflow_create`<br>`workflow_find` | `ADMIN`, `MANAGER`, `EMPLOYEE` | `CONFIRMATION_CARD`, `RECORD` |
| **Scheduler** | Calendar & Booking Agent | Meeting Invitations, Attendee Resolution & Time Scheduling | `SCHEDULE_MEETING`<br>`BOOK_DEMO` | `email_generate_invite` | `ADMIN`, `MANAGER`, `EMPLOYEE` | `CONFIRMATION_CARD` |
| **Email** | Transactional Communications Agent | Branded HTML Emails, Invoice Notices & Invitations | `EMAIL_DISPATCH_INVITE`<br>`EMAIL_DISPATCH_INVOICE_REMINDER` | `email_generate_invite`<br>`email_generate_reminder` | `ADMIN`, `MANAGER`, `EMPLOYEE` | `CONFIRMATION_CARD` |
| **Knowledge** | RAG Knowledge Hub Agent | 384-Dim Vector Embeddings, Policy SOPs & Grounded Citations | `KNOWLEDGE_QUERY_POLICY`<br>`KNOWLEDGE_INGEST_DOCUMENT` | `knowledge_query` | `ADMIN`, `MANAGER`, `EMPLOYEE` | `SUMMARY`, `CITATIONS` |
| **Analytics** | BI & Metrics Agent | Executive KPIs, Revenue Velocity & Conversion Analysis | `ANALYTICS_OVERVIEW`<br>`METRICS_REVENUE` | `crm_get_leads`<br>`finance_get_invoices` | `ADMIN`, `MANAGER`, `EMPLOYEE` | `SUMMARY`, `JSON`, `CSV` |
| **Security** | DevSecOps & Compliance Agent | BYOK Key Management, Prompt Injection & Tamper Auditing | `SECURITY_AUDIT_LOGS`<br>`SECURITY_MANAGE_BYOK` | `encryption_audit`<br>`prompt_shield` | `ADMIN` only | `SUMMARY`, `LOGS` |
| **Marketing** | Campaign Strategy Agent | Multi-Channel Campaigns & Content Generation | `MARKETING_CREATE_CAMPAIGN` | `campaign_manager` | `ADMIN`, `MANAGER` | `DOCUMENT` |
| **Document** | Document & Artifact Agent | PDF Generation, CSV/JSON Exports & Reports | `DOCUMENT_EXPORT_DATA` | `export_module_data` | `ADMIN`, `MANAGER`, `EMPLOYEE` | `CSV`, `JSON`, `PDF` |
| **Reporting** | Executive Reporting Agent | Consolidated Briefings & Performance Digests | `REPORTING_EXECUTIVE_DIGEST` | `generate_digest` | `ADMIN`, `MANAGER` | `REPORT` |

---

## 2. Confidence-Based Routing Rules

1. **Deterministic Intent Precedence:** High-confidence domain keywords (e.g. `"invoice"`, `"lead"`, `"leave"`, `"stock"`, `"ticket"`, `"meeting"`) route directly to the designated domain agent ($c \ge 0.94$).
2. **Ambiguity Handling:** When request confidence is below $0.80$, the CEO Agent engages the user with concise options rather than guessing or generating synthetic facts.
3. **Multi-Domain Coordination:** When a query spans multiple departments (e.g., Finance overdue invoices + Support tickets), the CEO Orchestrator invokes sub-agents in parallel and merges outputs using the primary customer entity name.
