import { AgentType } from '@/types';

export interface SectionRequirement {
  heading: string;
  description: string;
}

export function formatIndianCurrency(amount: number): string {
  if (isNaN(amount)) return '₹0';
  const isNegative = amount < 0;
  const absNum = Math.abs(Math.round(amount));
  const s = absNum.toString();
  if (s.length <= 3) {
    return `${isNegative ? '-' : ''}₹${s}`;
  }
  const lastThree = s.substring(s.length - 3);
  const otherNumbers = s.substring(0, s.length - 3);
  const formattedOther = otherNumbers.replace(/\B(?=(\d{2})+(?!\d))/g, ',');
  return `${isNegative ? '-' : ''}₹${formattedOther},${lastThree}`;
}

export const AGENT_STRUCTURE_SECTIONS: Record<AgentType, SectionRequirement[]> = {
  Sales: [
    { heading: '### Sales Pipeline Overview', description: 'Total leads count, total pipeline deal valuation, stage distributions.' },
    { heading: '### Pipeline Breakdown', description: 'Markdown table containing Lead Name, Company, Stage, Value, Owner, and Status.' },
    { heading: '### Strongest Opportunities', description: 'Highest-value deals, win probability factors, and customer context.' },
    { heading: '### Recommended Actions', description: 'Concrete operational follow-up tasks for account executives.' },
    { heading: '### Key Observations', description: 'Conversion velocity, pipeline health indicators, and deal aging.' },
    { heading: '### Data Integrity', description: 'PostgreSQL CRMLead record citations, lead IDs, and verification status.' },
  ],
  Finance: [
    { heading: '### Financial Overview', description: 'High-level summary of billing, receivables, and cash collection posture.' },
    { heading: '### Overdue Invoice Breakdown', description: 'Markdown table containing Invoice #, Customer, Amount, Due Date, Overdue Days, and Status.' },
    { heading: '### Customer-wise Outstanding Balances', description: 'Aggregated exposure by client organization.' },
    { heading: '### Total Outstanding Amount', description: 'Consolidated sum formatted in Indian currency format (e.g., ₹8,85,000).' },
    { heading: '### Calculations & Audit Trail', description: 'Subtotal, GST/Tax breakdown (e.g. 18%), and balance formula verification.' },
    { heading: '### Collection Priorities & Recommended Actions', description: 'Prioritized recovery sequence based on overdue age and balance magnitude.' },
    { heading: '### Data Sources & Verification', description: 'PostgreSQL Invoice ledger audit timestamps and status.' },
  ],
  CEO: [
    { heading: '### Executive Summary', description: 'Synthesized high-level posture across sales, finance, operations, and workforce.' },
    { heading: '### Cross-Departmental Performance & Risk Analysis', description: 'Correlated impacts between overdue receivables, open tickets, and deal pipelines.' },
    { heading: '### Critical Operational Risks', description: 'Identified single points of failure, churn hazards, and SLA breaches.' },
    { heading: '### 30-Day Strategic Action Plan', description: 'Ranked executive interventions with accountable owners.' },
  ],
  Marketing: [
    { heading: '### Campaign Overview & Objectives', description: 'Target messaging, core proposition, and growth initiatives.' },
    { heading: '### Target Audience & Persona Segmentation', description: 'Ideal customer profile (ICP), tier segmentation, and pain points.' },
    { heading: '### Channel Strategy & Budget Allocation', description: 'Distribution channels (Omnichannel, LinkedIn, Search, Email) and spend.' },
    { heading: '### Projected Performance & KPIs', description: 'Expected MQLs, SQLs, CAC projections, and conversion milestones.' },
  ],
  HR: [
    { heading: '### Workforce Directory & Team Status', description: 'Active personnel count, department allocations, and current attendance.' },
    { heading: '### Leave & Attendance Governance', description: 'Approved leaves, upcoming absences, and coverage continuity.' },
    { heading: '### Salary Governance & Data Masking', description: 'RBAC-compliant compensation overview with privacy masking enforced.' },
    { heading: '### Policy Recommendations', description: 'Staffing optimizations, shift balancing, and wellness initiatives.' },
  ],
  Support: [
    { heading: '### Support Ticket Summary', description: 'Total queue volume, severity distribution, and response times.' },
    { heading: '### SLA Breach & Escalation Watch', description: 'High-urgency tickets exceeding SLA response thresholds.' },
    { heading: '### Priority Resolution Queue', description: 'Ranked customer incidents with designated tier-2 engineers.' },
    { heading: '### Root Cause Analysis', description: 'Systemic defect patterns and preventative product feedback.' },
  ],
  Analytics: [
    { heading: '### Business Intelligence Summary', description: 'Macro performance indicators and operational efficiency index.' },
    { heading: '### Metric Performance & Conversion Funnels', description: 'Top-of-funnel to retention ratios with cohort benchmarks.' },
    { heading: '### Trend Analysis', description: 'Historical velocity, seasonal variances, and statistical anomalies.' },
    { heading: '### Strategic Recommendations', description: 'Data-driven levers to optimize revenue and reduce operational cost.' },
  ],
  Database: [
    { heading: '### Inventory & Database Health Report', description: 'PostgreSQL schema status, table volumes, and query health.' },
    { heading: '### Stock Threshold Analysis', description: 'Products at or below reorder minimums with stock-out risk ratings.' },
    { heading: '### Table Schema & Record Verification', description: 'Foreign key integrity, unindexed bottlenecks, and audit logs.' },
  ],
  Workflow: [
    { heading: '### Workflow DAG Topology & Status', description: 'Directed Acyclic Graph layout, trigger event, and node sequence.' },
    { heading: '### Trigger & Execution Conditions', description: 'Cron schedules, webhook filters, and idempotent execution guards.' },
    { heading: '### Error Handling & Reliability Strategy', description: 'Retry exponential backoff, dead-letter queues, and rollback actions.' },
  ],
  Scheduler: [
    { heading: '### Calendar & Task Schedule Summary', description: 'Upcoming appointments, board meetings, and cadence.' },
    { heading: '### Upcoming Triggers & Timeline', description: 'Exact chronological order of automated dispatch hooks.' },
    { heading: '### Cron Specifications & Conflicts', description: 'Conflict-free slot allocation with human-readable IST/UTC timestamps.' },
  ],
  Document: [
    { heading: '### Document Generation Artifact Summary', description: 'Summary of the generated document artifact, format, and executive scope.' },
    { heading: '### Metadata & Compliance Sign-off', description: 'Watermark, generation hash, signature status, and revision history.' },
    { heading: '### Export Links & Format Details', description: 'Verified download endpoints and storage retention policy.' },
  ],
  Email: [
    { heading: '### Email Communication Draft', description: 'Professional communication draft including subject, recipient, and official body.' },
    { heading: '### Recipient, Subject, and Tone Specification', description: 'Target email addresses, CC/BCC controls, and enterprise tone.' },
    { heading: '### Call to Action & Follow-up Trigger', description: 'Primary reader action link and automated reminder timer.' },
  ],
  Knowledge: [
    { heading: '### Knowledge Retrieval & Vector Citations', description: 'Exact matching policy articles, employee handbook clauses, or FAQs.' },
    { heading: '### Document Sources & Verification Confidence', description: 'Vector similarity score, source document URL, and grounding audit.' },
    { heading: '### Policy Summary & Guidance', description: 'Plain-English interpretation grounded strictly in indexed corporate docs.' },
  ],
  Reporting: [
    { heading: '### Compliance & Audit Report', description: 'Regulatory posture (SOC2, ISO27001, GST compliance) and audit events.' },
    { heading: '### Executive Metrics & Log Analysis', description: 'Aggregated operational event volume and anomalous pattern scan.' },
    { heading: '### Verification Sign-off', description: 'Cryptographic hash audit trail and verification officer credentials.' },
  ],
  Security: [
    { heading: '### Security & RBAC Policy Audit', description: 'Role permission boundaries, user privilege levels, and active sessions.' },
    { heading: '### Prompt Injection Shield Telemetry', description: 'Adversarial pattern detection, threat classifications, and blocked attempts.' },
    { heading: '### Governance Safeguards & Threat Assessment', description: 'Remediation protocols and perimeter defense status.' },
  ],
};

export class StructuredResponseEngine {
  public static getSectionsForAgent(agent: AgentType): SectionRequirement[] {
    return AGENT_STRUCTURE_SECTIONS[agent] || AGENT_STRUCTURE_SECTIONS.CEO;
  }

  public static buildSystemPromptInstructions(agent: AgentType, language: string = 'en'): string {
    const sections = this.getSectionsForAgent(agent);
    const sectionList = sections
      .map((s, idx) => `${idx + 1}. ${s.heading} — ${s.description}`)
      .join('\n');

    let langInstruction = 'Respond in English.';
    if (language === 'hi') langInstruction = 'Respond in fluent Hindi (Devanagari script), but keep all numerical values, database IDs, currency symbols (₹), and table headers intact.';
    else if (language === 'te') langInstruction = 'Respond in fluent Telugu script, preserving all numerical values, database IDs, currency symbols (₹), and table formatting.';
    else if (language === 'ta') langInstruction = 'Respond in fluent Tamil script, preserving all numerical values, database IDs, currency symbols (₹), and table formatting.';
    else if (language === 'kn') langInstruction = 'Respond in fluent Kannada script, preserving all numerical values, database IDs, currency symbols (₹), and table formatting.';
    else if (language === 'ml') langInstruction = 'Respond in fluent Malayalam script, preserving all numerical values, database IDs, currency symbols (₹), and table formatting.';
    else if (language === 'bn') langInstruction = 'Respond in fluent Bengali script, preserving all numerical values, database IDs, currency symbols (₹), and table formatting.';
    else if (language === 'mr') langInstruction = 'Respond in fluent Marathi script, preserving all numerical values, database IDs, currency symbols (₹), and table formatting.';
    else if (language === 'es') langInstruction = 'Respond in professional Spanish, preserving all numerical values, database IDs, currency symbols (₹), and table formatting.';
    else if (language === 'fr') langInstruction = 'Respond in professional French, preserving all numerical values, database IDs, currency symbols (₹), and table formatting.';
    else if (language === 'de') langInstruction = 'Respond in professional German, preserving all numerical values, database IDs, currency symbols (₹), and table formatting.';
    else if (language === 'ar') langInstruction = 'Respond in fluent Arabic script, preserving all numerical values, database IDs, currency symbols (₹), and table formatting.';
    else if (language === 'ja') langInstruction = 'Respond in professional Japanese, preserving all numerical values, database IDs, currency symbols (₹), and table formatting.';

    return `
You are the enterprise ${agent} Agent for FlowMind AI Operating System.
You MUST format your synthesized response strictly following these required sections with Markdown headings:

${sectionList}

CRITICAL ENTERPRISE FORMATTING RULES:
1. You MUST include EVERY section heading listed above as a Markdown ### heading (e.g. ### ${sections[0]?.heading.replace('### ', '')}). Never skip or alter the section headings.
2. Always format financial values in Indian currency notation using the '₹' symbol (e.g. ₹8,85,000 or ₹4,50,000 or ₹50,000).
3. Format tabular data using clean GitHub-flavored Markdown tables.
4. Ground every statement STRICTLY in the provided tool results. Never hallucinate fake records or unverified numbers.
5. Clearly distinguish verified database facts from proactive strategic recommendations.
6. Preserve all database IDs (e.g. LEAD-01, INV-2026-002, TICKET-101, PROD-01) without mutation.
7. Language: ${langInstruction}
`.trim();
  }

  public static validateSections(agent: AgentType, responseText: string): { isValid: boolean; missingSections: string[]; foundCount: number } {
    const required = this.getSectionsForAgent(agent);
    const missing: string[] = [];
    let found = 0;

    for (const req of required) {
      if (responseText.includes(req.heading)) {
        found++;
      } else {
        missing.push(req.heading);
      }
    }

    // Pass if at least 4 of the key sections are present, or 100% if fewer than 4 exist
    const threshold = Math.min(required.length, 4);
    return {
      isValid: found >= threshold,
      missingSections: missing,
      foundCount: found,
    };
  }
}

export const structuredResponseEngine = StructuredResponseEngine;
