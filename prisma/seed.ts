import { PrismaClient, UserRole } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting FlowMind AI Database Seeding...');

  // 1. Seed Organization
  const org = await prisma.organization.upsert({
    where: { slug: 'flowmind-enterprise' },
    update: {},
    create: {
      id: 'ORG-01',
      name: 'FlowMind Enterprise',
      slug: 'flowmind-enterprise',
      domain: 'flowmind.ai',
      logo: '⚡',
      plan: 'ENTERPRISE',
      status: 'ACTIVE',
    },
  });
  console.log(`✅ Organization seeded: ${org.name} (${org.id})`);

  // 2. Seed Permissions Matrix
  const permissions = [
    { code: 'USER_VIEW', name: 'View Users', category: 'USER', roles: ['ADMIN', 'MANAGER'] },
    { code: 'USER_CREATE', name: 'Create Users', category: 'USER', roles: ['ADMIN'] },
    { code: 'USER_UPDATE', name: 'Update Users', category: 'USER', roles: ['ADMIN'] },
    { code: 'USER_DELETE', name: 'Delete / Deactivate Users', category: 'USER', roles: ['ADMIN'] },
    { code: 'ROLE_CHANGE', name: 'Change User Roles', category: 'USER', roles: ['ADMIN'] },

    { code: 'WORKFLOW_VIEW', name: 'View Workflows', category: 'WORKFLOW', roles: ['ADMIN', 'MANAGER', 'EMPLOYEE'] },
    { code: 'WORKFLOW_CREATE', name: 'Create Workflows', category: 'WORKFLOW', roles: ['ADMIN', 'MANAGER', 'EMPLOYEE'] },
    { code: 'WORKFLOW_EDIT', name: 'Edit Workflows', category: 'WORKFLOW', roles: ['ADMIN', 'MANAGER'] },
    { code: 'WORKFLOW_EXECUTE', name: 'Execute Workflows', category: 'WORKFLOW', roles: ['ADMIN', 'MANAGER', 'EMPLOYEE'] },
    { code: 'WORKFLOW_ACTIVATE', name: 'Activate Workflows', category: 'WORKFLOW', roles: ['ADMIN'] },
    { code: 'WORKFLOW_DISABLE', name: 'Disable Workflows', category: 'WORKFLOW', roles: ['ADMIN'] },

    { code: 'AGENT_VIEW', name: 'View Agents', category: 'AGENT', roles: ['ADMIN', 'MANAGER', 'EMPLOYEE'] },
    { code: 'AGENT_USE', name: 'Use AI Agents', category: 'AGENT', roles: ['ADMIN', 'MANAGER', 'EMPLOYEE'] },
    { code: 'AGENT_MANAGE', name: 'Configure AI Agents', category: 'AGENT', roles: ['ADMIN'] },

    { code: 'APPROVAL_SUBMIT', name: 'Submit Approvals', category: 'GOVERNANCE', roles: ['ADMIN', 'MANAGER', 'EMPLOYEE'] },
    { code: 'APPROVAL_APPROVE', name: 'Approve High-Risk Actions', category: 'GOVERNANCE', roles: ['ADMIN', 'MANAGER'] },
    { code: 'APPROVAL_REJECT', name: 'Reject High-Risk Actions', category: 'GOVERNANCE', roles: ['ADMIN', 'MANAGER'] },

    { code: 'AUDIT_VIEW', name: 'View Audit Logs', category: 'SECURITY', roles: ['ADMIN'] },
    { code: 'SECURITY_SETTINGS_MANAGE', name: 'Manage Security', category: 'SECURITY', roles: ['ADMIN'] },
    { code: 'ORGANIZATION_SETTINGS_MANAGE', name: 'Manage Organization', category: 'ORGANIZATION', roles: ['ADMIN'] },
  ];

  for (const perm of permissions) {
    await prisma.permission.upsert({
      where: { code: perm.code },
      update: { name: perm.name, category: perm.category, roles: perm.roles },
      create: perm,
    });
  }
  console.log(`✅ Permissions seeded (${permissions.length} granular codes)`);

  // 3. Seed Three Real Users (ADMIN, MANAGER, EMPLOYEE)
  const salt = bcrypt.genSaltSync(10);
  const defaultPasswordHash = bcrypt.hashSync('flowmind2026!', salt);

  const usersToSeed = [
    {
      id: 'USR-0001',
      organizationId: org.id,
      name: 'FlowMind Admin',
      email: 'admin@flowmind.ai',
      passwordHash: defaultPasswordHash,
      role: 'ADMIN' as UserRole,
      status: 'ACTIVE' as const,
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
      preferredLanguage: 'en',
    },
    {
      id: 'USR-0002',
      organizationId: org.id,
      name: 'FlowMind Manager',
      email: 'manager@flowmind.ai',
      passwordHash: defaultPasswordHash,
      role: 'MANAGER' as UserRole,
      status: 'ACTIVE' as const,
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=manager@flowmind.ai',
      preferredLanguage: 'en',
    },
    {
      id: 'USR-0003',
      organizationId: org.id,
      name: 'FlowMind Employee',
      email: 'employee@flowmind.ai',
      passwordHash: defaultPasswordHash,
      role: 'EMPLOYEE' as UserRole,
      status: 'ACTIVE' as const,
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=employee@flowmind.ai',
      preferredLanguage: 'hi',
    },
  ];

  for (const u of usersToSeed) {
    await prisma.user.upsert({
      where: { email: u.email },
      update: { role: u.role, name: u.name },
      create: u,
    });
    console.log(`👤 User seeded: ${u.name} <${u.email}> [Role: ${u.role}]`);
  }

  // 4. Seed 15 AI Agents
  const agentsData = [
    { id: 'CEO', name: 'Master CEO Orchestrator', roleTitle: 'Chief Executive Agent', domain: 'Executive Management', avatarColor: 'from-amber-500 to-yellow-600', description: 'Decomposes complex goals, routes tasks to sub-agents, and orchestrates cross-functional workflows.' },
    { id: 'Sales', name: 'Sales Agent', roleTitle: 'Lead & CRM Specialist', domain: 'Sales & CRM', avatarColor: 'from-emerald-500 to-teal-600', description: 'Qualifies leads, computes lead scores, updates pipeline statuses, and triggers sales outreach.' },
    { id: 'Marketing', name: 'Marketing Agent', roleTitle: 'Campaign & Content Strategist', domain: 'Marketing', avatarColor: 'from-purple-500 to-indigo-600', description: 'Drafts marketing campaigns, analyzes engagement, generates multilingual promotional content.' },
    { id: 'Finance', name: 'Finance Agent', roleTitle: 'Billing & Invoice Specialist', domain: 'Finance', avatarColor: 'from-blue-500 to-cyan-600', description: 'Generates GST-compliant tax invoices, handles payment reminders, checks budget thresholds.' },
    { id: 'HR', name: 'HR Agent', roleTitle: 'People & Onboarding Partner', domain: 'Human Resources', avatarColor: 'from-pink-500 to-rose-600', description: 'Manages employee directory, processes leave requests, automates employee onboarding workflows.' },
    { id: 'Support', name: 'Customer Support Agent', roleTitle: 'Ticket & Query Resolver', domain: 'Customer Service', avatarColor: 'from-orange-500 to-amber-600', description: 'Translates incoming tickets across Indic languages, resolves FAQs, escalates complex queries.' },
    { id: 'Analytics', name: 'Analytics Agent', roleTitle: 'Data & Metrics Intelligence', domain: 'Business Intelligence', avatarColor: 'from-violet-500 to-fuchsia-600', description: 'Computes KPI metrics, pipeline conversion rates, revenue trends, and operational bottleneck reports.' },
    { id: 'Database', name: 'Database Agent', roleTitle: 'SQL & Persistence Manager', domain: 'Data Infrastructure', avatarColor: 'from-cyan-500 to-blue-600', description: 'Executes structured database queries, manages multi-tenant entity stores, verifies schema integrity.' },
    { id: 'Workflow', name: 'Workflow Agent', roleTitle: 'DAG Automation Planner', domain: 'Automation', avatarColor: 'from-indigo-500 to-blue-700', description: 'Parses natural language triggers into validated DAG execution graphs with Kahn topological sorting.' },
    { id: 'Scheduler', name: 'Scheduler Agent', roleTitle: 'Cron & Event Dispatcher', domain: 'Task Scheduling', avatarColor: 'from-sky-500 to-indigo-600', description: 'Schedules recurring cron triggers, manages asynchronous task queues, enforces task timeouts.' },
    { id: 'Document', name: 'Document Agent', roleTitle: 'File & PDF Generator', domain: 'Content Processing', avatarColor: 'from-teal-500 to-emerald-700', description: 'Generates PDF invoices, reports, compliance artifacts, and structured JSON export packages.' },
    { id: 'Email', name: 'Email Agent', roleTitle: 'Notification & Mail Dispatcher', domain: 'Communications', avatarColor: 'from-blue-600 to-indigo-800', description: 'Dispatches automated email notifications, transactional receipts, and alert digests.' },
    { id: 'Knowledge', name: 'Knowledge Agent', roleTitle: 'RAG & Memory Search Engine', domain: 'Knowledge Base', avatarColor: 'from-yellow-500 to-amber-700', description: 'Indexes corporate documents, queries vector embeddings, retrieves context for domain agents.' },
    { id: 'Reporting', name: 'Reporting Agent', roleTitle: 'Executive Summary Generator', domain: 'Reporting', avatarColor: 'from-rose-500 to-pink-700', description: 'Compiles periodic weekly/monthly business performance summaries and visual chart data.' },
    { id: 'Security', name: 'Security Agent', roleTitle: 'Action Governance & RBAC Shield', domain: 'Security & Compliance', avatarColor: 'from-red-600 to-rose-800', description: 'Enforces prompt injection detection, Action Governance risk evaluation, and strict 3-tier RBAC.' },
  ];

  for (const ag of agentsData) {
    await prisma.agent.upsert({
      where: { id: ag.id },
      update: { name: ag.name, roleTitle: ag.roleTitle, description: ag.description },
      create: {
        id: ag.id,
        organizationId: org.id,
        name: ag.name,
        roleTitle: ag.roleTitle,
        domain: ag.domain,
        avatarColor: ag.avatarColor,
        description: ag.description,
        status: 'IDLE',
        supportedLanguages: ['en', 'hi', 'te', 'ta', 'kn', 'ml'],
        isEnabled: true,
      },
    });
  }
  console.log(`🤖 Seeded 15 AI Agents in Organization ${org.id}`);

  // 5. Seed Initial Workflow
  const wfId = 'WF-TEMPLATE-01';
  await prisma.workflow.upsert({
    where: { id: wfId },
    update: {},
    create: {
      id: wfId,
      organizationId: org.id,
      name: 'Lead Qualification & GST Invoicing DAG',
      description: 'Checks lead value. If > ₹100,000, notifies manager, runs Sales Agent, and generates GST invoice.',
      naturalTrigger: 'When a new lead is created, check if value > 100000',
      triggerType: 'event',
      triggerConfig: { eventType: 'LEAD_CREATED' },
      status: 'ACTIVE',
      isTemplate: true,
      createdById: 'USR-0001',
    },
  });

  await prisma.workflowVersion.upsert({
    where: { workflowId_versionNumber: { workflowId: wfId, versionNumber: 1 } },
    update: {},
    create: {
      workflowId: wfId,
      versionNumber: 1,
      isPublished: true,
      changeLog: 'Initial production publication',
      dagNodes: [
        { id: 'node_trig', type: 'TRIGGER', name: 'Lead Created Event', config: { eventType: 'LEAD_CREATED' } },
        { id: 'node_cond', type: 'CONDITION', name: 'Check Lead Value (> ₹100k)', config: { expression: '{{trigger.value}} > 100000' } },
        { id: 'node_sales', type: 'AGENT', name: 'Sales Agent Qualification', agentId: 'Sales', actionType: 'CREATE_LEAD', config: { client: '{{trigger.company}}', value: '{{trigger.value}}' } },
        { id: 'node_notify', type: 'NOTIFICATION', name: 'Notify Manager (High Value)', config: { message: 'High Value Lead: {{trigger.company}}' } },
        { id: 'node_invoice', type: 'ARTIFACT', name: 'Generate GST Tax Invoice', agentId: 'Finance', actionType: 'GENERATE_INVOICE', config: { client: '{{trigger.company}}', amount: '{{trigger.value}}' } },
        { id: 'node_normal', type: 'ACTION', name: 'Add to Standard Follow-up', config: { queue: 'NORMAL_LEADS' } },
        { id: 'node_end', type: 'END', name: 'End Execution', config: {} },
      ],
      dagEdges: [
        { id: 'e1', source: 'node_trig', target: 'node_cond' },
        { id: 'e2', source: 'node_cond', target: 'node_sales', condition: { expression: 'TRUE', label: 'TRUE' } },
        { id: 'e3', source: 'node_sales', target: 'node_notify' },
        { id: 'e4', source: 'node_notify', target: 'node_invoice' },
        { id: 'e5', source: 'node_invoice', target: 'node_end' },
        { id: 'e6', source: 'node_cond', target: 'node_normal', condition: { expression: 'FALSE', label: 'FALSE' } },
        { id: 'e7', source: 'node_normal', target: 'node_end' },
      ],
    },
  });

  console.log(`✨ Database Seeding Completed Successfully!`);
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed with error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
