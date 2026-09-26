import { AgentType } from '@/types';
import { AgentCapabilityDeclaration } from '@/types/universalAgent';

export const AGENT_CAPABILITIES: Record<AgentType, AgentCapabilityDeclaration> = {
  CEO: {
    agentId: 'CEO',
    agentName: 'CEO Agent',
    domain: 'Enterprise Strategy & Cross-Agent Orchestration',
    capabilities: [
      {
        id: 'orchestrate_agents',
        name: 'Master Routing',
        description: 'Analyze request and delegate to appropriate domain agent',
        riskLevel: 'LOW',
        requiresApproval: false,
        supportedArtifacts: ['REPORT'],
      },
      {
        id: 'executive_summary',
        name: 'Executive Summary',
        description: 'Synthesize cross-departmental business performance',
        riskLevel: 'LOW',
        requiresApproval: false,
        supportedArtifacts: ['REPORT', 'DOCUMENT'],
      },
    ],
    handOffTargets: ['Sales', 'Finance', 'HR', 'Analytics', 'Support', 'Workflow', 'Security'],
  },
  Sales: {
    agentId: 'Sales',
    agentName: 'Sales Agent',
    domain: 'CRM, Lead Pipeline & Demo Scheduling',
    capabilities: [
      {
        id: 'create_lead',
        name: 'Create Lead',
        description: 'Add new prospect to CRM pipeline',
        riskLevel: 'MEDIUM',
        requiresApproval: true,
        supportedArtifacts: ['REPORT', 'CSV'],
      },
      {
        id: 'schedule_demo',
        name: 'Schedule Demo',
        description: 'Book sales demo meeting with prospect',
        riskLevel: 'LOW',
        requiresApproval: true,
        supportedArtifacts: ['DOCUMENT'],
      },
      {
        id: 'update_lead_status',
        name: 'Qualify Lead',
        description: 'Update prospect status from New to Qualified',
        riskLevel: 'MEDIUM',
        requiresApproval: true,
        supportedArtifacts: ['REPORT'],
      },
    ],
    handOffTargets: ['Finance', 'Analytics', 'Scheduler', 'Email'],
  },
  Marketing: {
    agentId: 'Marketing',
    agentName: 'Marketing Agent',
    domain: 'Ad Campaigns, SEO & Content Strategy',
    capabilities: [
      {
        id: 'create_campaign',
        name: 'Draft Ad Campaign',
        description: 'Prepare multi-channel ad campaign draft',
        riskLevel: 'MEDIUM',
        requiresApproval: true,
        supportedArtifacts: ['REPORT', 'DOCUMENT'],
      },
    ],
    handOffTargets: ['Sales', 'Analytics', 'Email'],
  },
  Finance: {
    agentId: 'Finance',
    agentName: 'Finance Agent',
    domain: 'GST Invoicing, Tax Calculations & Billing',
    capabilities: [
      {
        id: 'generate_invoice',
        name: 'Generate GST Invoice',
        description: 'Create and dispatch GST tax invoice with 18% tax breakdown',
        riskLevel: 'HIGH',
        requiresApproval: true,
        supportedArtifacts: ['INVOICE', 'REPORT'],
      },
      {
        id: 'download_invoice',
        name: 'Download Invoice PDF/HTML',
        description: 'Export printable GST invoice file',
        riskLevel: 'LOW',
        requiresApproval: false,
        supportedArtifacts: ['INVOICE'],
      },
      {
        id: 'calculate_tax',
        name: 'GST Tax Calculation',
        description: 'Calculate CGST and SGST rates for invoice items',
        riskLevel: 'LOW',
        requiresApproval: false,
        supportedArtifacts: ['REPORT'],
      },
    ],
    handOffTargets: ['Sales', 'Analytics', 'Reporting', 'Document'],
  },
  HR: {
    agentId: 'HR',
    agentName: 'HR Agent',
    domain: 'Employee Records, Leave Management & Onboarding',
    capabilities: [
      {
        id: 'approve_leave',
        name: 'Approve Leave Request',
        description: 'Process employee casual/sick leave balance and approval',
        riskLevel: 'MEDIUM',
        requiresApproval: true,
        supportedArtifacts: ['REPORT'],
      },
      {
        id: 'onboard_employee',
        name: 'Employee Onboarding',
        description: 'Generate employee onboarding checklist and credentials',
        riskLevel: 'HIGH',
        requiresApproval: true,
        supportedArtifacts: ['DOCUMENT', 'REPORT'],
      },
    ],
    handOffTargets: ['Finance', 'Security', 'Email'],
  },
  Analytics: {
    agentId: 'Analytics',
    agentName: 'Analytics Agent',
    domain: 'Business Intelligence, KPI Tracking & Revenue Trends',
    capabilities: [
      {
        id: 'query_kpi',
        name: 'Query KPI Metrics',
        description: 'Calculate real-time MRR, ARR, and churn rates',
        riskLevel: 'LOW',
        requiresApproval: false,
        supportedArtifacts: ['REPORT', 'CSV'],
      },
      {
        id: 'revenue_forecast',
        name: 'Revenue Forecasting',
        description: 'Generate revenue projection trends',
        riskLevel: 'LOW',
        requiresApproval: false,
        supportedArtifacts: ['REPORT', 'CSV', 'JSON'],
      },
    ],
    handOffTargets: ['Finance', 'Sales', 'CEO', 'Reporting'],
  },
  Support: {
    agentId: 'Support',
    agentName: 'Support Agent',
    domain: 'Customer Helpdesk, Ticket Escalation & FAQs',
    capabilities: [
      {
        id: 'resolve_ticket',
        name: 'Resolve Ticket',
        description: 'Update support ticket status and notify customer',
        riskLevel: 'MEDIUM',
        requiresApproval: true,
        supportedArtifacts: ['JSON', 'REPORT'],
      },
    ],
    handOffTargets: ['Sales', 'Knowledge', 'Email'],
  },
  Database: {
    agentId: 'Database',
    agentName: 'Database Agent',
    domain: 'SQL Querying, Schema Inspection & Optimization',
    capabilities: [
      {
        id: 'read_schema',
        name: 'Inspect Database Schema',
        description: 'Query database metadata and table indexes',
        riskLevel: 'LOW',
        requiresApproval: false,
        supportedArtifacts: ['JSON'],
      },
    ],
    handOffTargets: ['Analytics', 'Security'],
  },
  Workflow: {
    agentId: 'Workflow',
    agentName: 'Workflow Agent',
    domain: 'Multi-Step Automation & Task Pipeline',
    capabilities: [
      {
        id: 'run_workflow',
        name: 'Execute Automation Workflow',
        description: 'Run automated multi-step trigger-action pipeline',
        riskLevel: 'HIGH',
        requiresApproval: true,
        supportedArtifacts: ['JSON', 'REPORT'],
      },
    ],
    handOffTargets: ['Scheduler', 'Email', 'Database'],
  },
  Scheduler: {
    agentId: 'Scheduler',
    agentName: 'Scheduler Agent',
    domain: 'Calendar Sync, Meeting Invites & Reminders',
    capabilities: [
      {
        id: 'book_meeting',
        name: 'Book Calendar Meeting',
        description: 'Schedule meeting slot across calendar participants',
        riskLevel: 'LOW',
        requiresApproval: true,
        supportedArtifacts: ['DOCUMENT'],
      },
    ],
    handOffTargets: ['Sales', 'HR', 'Email'],
  },
  Document: {
    agentId: 'Document',
    agentName: 'Document Agent',
    domain: 'PDF Parsing, Contract Summaries & OCR',
    capabilities: [
      {
        id: 'parse_contract',
        name: 'Parse Contract Terms',
        description: 'Extract clauses, dates, and values from documents',
        riskLevel: 'LOW',
        requiresApproval: false,
        supportedArtifacts: ['DOCUMENT', 'REPORT'],
      },
    ],
    handOffTargets: ['Finance', 'Security'],
  },
  Email: {
    agentId: 'Email',
    agentName: 'Email Agent',
    domain: 'Outbound Broadcasts, Follow-ups & Notification Emails',
    capabilities: [
      {
        id: 'send_email',
        name: 'Dispatch Outbound Email',
        description: 'Send client follow-up or broadcast message',
        riskLevel: 'MEDIUM',
        requiresApproval: true,
        supportedArtifacts: ['DOCUMENT'],
      },
    ],
    handOffTargets: ['Sales', 'Support', 'HR'],
  },
  Knowledge: {
    agentId: 'Knowledge',
    agentName: 'Knowledge Agent',
    domain: 'Enterprise Semantic Search & Knowledge Retrieval',
    capabilities: [
      {
        id: 'search_kb',
        name: 'Search Knowledge Base',
        description: 'Retrieve SOPs, policy docs, and product manuals',
        riskLevel: 'LOW',
        requiresApproval: false,
        supportedArtifacts: ['DOCUMENT'],
      },
    ],
    handOffTargets: ['Support', 'HR'],
  },
  Reporting: {
    agentId: 'Reporting',
    agentName: 'Reporting Agent',
    domain: 'Executive PDF/CSV Export & Weekly Summaries',
    capabilities: [
      {
        id: 'export_report',
        name: 'Export Executive Report',
        description: 'Generate multi-page PDF/CSV analytical summaries',
        riskLevel: 'LOW',
        requiresApproval: false,
        supportedArtifacts: ['REPORT', 'CSV', 'JSON'],
      },
    ],
    handOffTargets: ['CEO', 'Analytics', 'Finance'],
  },
  Security: {
    agentId: 'Security',
    agentName: 'Security Agent',
    domain: 'Prompt Injection Defense, RBAC & Audit Trails',
    capabilities: [
      {
        id: 'security_scan',
        name: 'Security Threat Scan',
        description: 'Analyze input for injection attacks and policy violations',
        riskLevel: 'CRITICAL',
        requiresApproval: false,
        supportedArtifacts: ['REPORT'],
      },
    ],
    handOffTargets: ['CEO'],
  },
};

export class CapabilityRegistryService {
  public getCapabilities(agentId: AgentType): AgentCapabilityDeclaration {
    return (
      AGENT_CAPABILITIES[agentId] || {
        agentId,
        agentName: `${agentId} Agent`,
        domain: 'General Domain Operations',
        capabilities: [],
        handOffTargets: ['CEO'],
      }
    );
  }

  public canAgentHandle(agentId: AgentType, actionId: string): boolean {
    const decl = this.getCapabilities(agentId);
    return decl.capabilities.some((c) => c.id === actionId);
  }

  public getSupportedArtifacts(agentId: AgentType): string[] {
    const decl = this.getCapabilities(agentId);
    const set = new Set<string>();
    decl.capabilities.forEach((c) => c.supportedArtifacts.forEach((a) => set.add(a)));
    return Array.from(set);
  }
}

export const capabilityRegistry = new CapabilityRegistryService();
