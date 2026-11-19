# FlowMind AI — Scheduler Agent Integration & Durable Scheduling Report

**Enterprise Scheduling Architecture & Integrity Audit**  
**Version:** 2.0 Production  
**Status:** VALIDATED  
**Date:** November 18, 2026  

---

## 1. Executive Summary

Scheduling within FlowMind AI has been upgraded from transient client-side in-memory timers to **Durable PostgreSQL Task & Workflow Scheduling**.

Key Accomplishments:
1. **Durable Task Registration:** Every scheduled meeting, recurring job, or cron automation creates an authoritative record in `prisma.workflow` with `triggerType = 'schedule'`, ensuring persistent availability across serverless cold starts, container restarts, and browser sessions.
2. **Indian Standard Time (IST) Standardization:** All dates and times are resolved in Indian Standard Time (`Asia/Kolkata (IST)`), with transparent wall-clock next run calculations.
3. **Transparent External API Boundary:** The system clearly differentiates between internal enterprise task/workflow scheduling and third-party external calendar integrations (e.g., Google Calendar, Microsoft Outlook), transparently disclosing integration states.

---

## 2. Technical Scheduling Architecture

### 2.1 Durable Registration Pipeline
When a user instructs the system:
> *"Schedule a meeting at 9:00 AM tomorrow."*

The request traverses the following pipeline:
1. **Intent Extraction:** `intentEngine.ts` identifies `SCHEDULE_MEETING`, extracts time (`Tomorrow at 9:00 AM IST`), and determines attendee scope (`Sales Team`, `Executive Team`).
2. **Calendar Invite Preparation:** `email_generate_invite` compiles meeting agendas and Google Meet link placeholders.
3. **PostgreSQL Workflow Registration:** `workflowOrchestrationService.createWorkflow()` registers a workflow in PostgreSQL:
   - `category: 'MEETING'`
   - `triggerType: 'schedule'`
   - `triggerConfig.scheduledTime: 'Tomorrow at 9:00 AM IST'`
   - `triggerConfig.nextRunAt: 'Tomorrow at 9:00 AM IST'`
   - `triggerConfig.timezone: 'Asia/Kolkata (IST)'`
   - `status: 'ACTIVE'`
4. **Action Card Authorization:** An action card is presented to the user requiring authorization before email invitations are dispatched.

### 2.2 Rescheduling Lifecycle
When the user subsequently requests:
> *"Update the meeting workflow to 10 AM."*

1. **Resolution:** `intentEngine.ts` classifies `WORKFLOW_RESCHEDULE` with `newTime = '10:00 AM IST'`.
2. **Tool Execution:** `workflow_reschedule` identifies the existing meeting workflow in `prisma.workflow`.
3. **Atomic Mutation:** `workflowOrchestrationService.rescheduleWorkflow()` updates `triggerConfig.scheduledTime = '10:00 AM IST'`, recalculates `nextRunAt`, and records `WORKFLOW_SCHEDULE_CHANGED` in `prisma.auditLog`.
4. **Synchronization:** Both the Scheduler Agent and Workflow Planner Agent immediately reflect the new 10:00 AM schedule.

---

## 3. Transparency & External Calendar Boundaries

FlowMind AI maintains strict transparency regarding external integrations:
- **Internal Durable Task Registry:** Registered in the PostgreSQL enterprise database, tracked by autonomous agents, and executed by the internal DAG engine.
- **External Calendar APIs (Google Workspace / Microsoft 365):** When enterprise OAuth credentials are not connected, the agent creates full meeting drafts, DAG workflows, and action cards, transparently informing the user that invitations will be dispatched via email or queued for external sync upon OAuth connection.

---

## 4. Verification Evidence

The integration was verified through live end-to-end tests:
- **Meeting Creation:** Confirmed persisted in PostgreSQL with category `MEETING` and `triggerType: 'schedule'`.
- **Query Verification:** Confirmed that both `"What meetings have I scheduled?"` (Scheduler Agent) and `"Show my workflows scheduled for tomorrow"` (Workflow Agent) retrieve the exact same database record.
- **Reschedule Mutation:** Confirmed that `"Update the meeting workflow to 10 AM"` updates the PostgreSQL record and all subsequent queries report `10:00 AM IST`.
- **Zero Conflict Audit:** Confirmed zero calendar collisions detected across the enterprise schedule registry.
