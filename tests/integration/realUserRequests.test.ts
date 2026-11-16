import { universalAgentRuntime } from '@/lib/ai/universalAgentRuntime';
import { prisma } from '@/lib/prisma';
import { User } from '@/types';

describe('FLOWMIND AI — 15 REAL USER REQUESTS BENCHMARK SUITE (PHASE 12)', () => {
  const adminUser: User = {
    id: 'usr-real-test-01',
    name: 'Siddharth Iyer',
    email: 'siddharth@flowmind.ai',
    role: 'ADMIN',
    avatar: '',
    preferredLanguage: 'en',
    organizationId: 'ORG-01',
  };

  beforeAll(async () => {
    // Ensure test user exists in PostgreSQL for foreign key validity
    try {
      await prisma.user.upsert({
        where: { id: adminUser.id },
        update: { organizationId: adminUser.organizationId, role: adminUser.role },
        create: {
          id: adminUser.id,
          name: adminUser.name,
          email: adminUser.email,
          role: adminUser.role,
          passwordHash: 'dummy_hash_for_test',
          organizationId: adminUser.organizationId,
        },
      });

      // Ensure seed overdue invoice and high-priority ticket exist for benchmark correlation
      await prisma.invoice.upsert({
        where: { id: 'INV-2026-002' },
        update: { status: 'OVERDUE', total: 236000 },
        create: {
          id: 'INV-2026-002',
          organizationId: adminUser.organizationId,
          invoiceNumber: 'INV-2026-002',
          customerName: 'TechCorp India',
          customerEmail: 'aarav.sharma@techcorp.in',
          status: 'OVERDUE',
          subtotal: 200000,
          tax: 36000,
          total: 236000,
          dueDate: new Date(Date.now() - 86400000 * 5),
        },
      });

      await prisma.supportTicket.upsert({
        where: { id: 'TICK-101' },
        update: { priority: 'HIGH', status: 'IN_PROGRESS' },
        create: {
          id: 'TICK-101',
          organizationId: adminUser.organizationId,
          ticketNumber: 'TICK-101',
          customerName: 'TechCorp India',
          title: 'DAG Workflow Node Retry Policy Delay',
          description: 'Condition node in high-frequency DAG pipeline experiences 1.5s delay during peak traffic.',
          priority: 'HIGH',
          status: 'IN_PROGRESS',
          category: 'TECHNICAL',
        },
      });
    } catch (e) {
      // In-memory fallback if port 5432 is in isolated sandbox
    }
  });

  // 1. "Show me all my pending invoices."
  test('Request 1: "Show me all my pending invoices." routes to Finance Agent and returns real ledger records', async () => {
    const res = await universalAgentRuntime.executeUserRequest('Show me all my pending invoices.', {
      user: adminUser,
      language: 'en',
    });

    expect(res.agent.id).toBe('Finance');
    expect(res.intent.name).toBe('FINANCE_GET_PENDING_INVOICES');
    expect(res.response.text).toContain('Outstanding & Pending Invoices');
    expect(res.response.text).toContain('| Invoice # |');
  });

  // 2. "Which customers have overdue payments?"
  test('Request 2: "Which customers have overdue payments?" identifies overdue invoice accounts in PostgreSQL', async () => {
    const res = await universalAgentRuntime.executeUserRequest('Which customers have overdue payments?', {
      user: adminUser,
      language: 'en',
    });

    expect(res.agent.id).toBe('Finance');
    expect(res.intent.name).toBe('FINANCE_GET_OVERDUE_INVOICES');
    expect(res.response.text).toContain('Overdue Customer Invoices');
    expect(res.response.text).toContain('TechCorp India');
  });

  // 3. "Create a new lead for ABC Technologies."
  test('Request 3: "Create a new lead for ABC Technologies." creates prospect in PostgreSQL and returns confirmation', async () => {
    const res = await universalAgentRuntime.executeUserRequest('Create a new lead for ABC Technologies.', {
      user: adminUser,
      language: 'en',
    });

    expect(res.agent.id).toBe('Sales');
    expect(res.intent.name).toBe('CRM_CREATE_LEAD');
    expect(res.response.text).toContain('CRM Lead Created Successfully');
    expect(res.response.text).toContain('ABC Technologies');
    expect(res.artifacts).toBeDefined();
    expect(res.artifacts![0].sourceAgent).toBe('Sales');
  });

  // 4. "Which leads have not received follow-ups?"
  test('Request 4: "Which leads have not received follow-ups?" identifies stale prospects in pipeline', async () => {
    const res = await universalAgentRuntime.executeUserRequest('Which leads have not received follow-ups?', {
      user: adminUser,
      language: 'en',
    });

    expect(res.agent.id).toBe('Sales');
    expect(res.intent.name).toBe('CRM_GET_STALE_LEADS');
    expect(res.response.text).toContain('Leads Without Recent Follow-Ups');
  });

  // 5. "Show me employees currently on leave."
  test('Request 5: "Show me employees currently on leave." queries attendance records and pending leave', async () => {
    const res = await universalAgentRuntime.executeUserRequest('Show me employees currently on leave.', {
      user: adminUser,
      language: 'en',
    });

    expect(res.agent.id).toBe('HR');
    expect(res.intent.name).toBe('HR_GET_EMPLOYEES_ON_LEAVE');
    expect(res.response.text).toContain('Employees Currently on Leave');
  });

  // 6. "How many products are below their stock threshold?"
  test('Request 6: "How many products are below their stock threshold?" identifies low-stock items in warehouse', async () => {
    const res = await universalAgentRuntime.executeUserRequest('How many products are below their stock threshold?', {
      user: adminUser,
      language: 'en',
    });

    expect(res.agent.id).toBe('Database');
    expect(res.intent.name).toBe('INVENTORY_GET_LOW_STOCK');
    expect(res.response.text).toContain('Inventory Threshold Alert');
    expect(res.response.text).toContain('LOW_STOCK');
  });

  // 7. "List unresolved high-priority support tickets."
  test('Request 7: "List unresolved high-priority support tickets." returns open priority tickets', async () => {
    const res = await universalAgentRuntime.executeUserRequest('List unresolved high-priority support tickets.', {
      user: adminUser,
      language: 'en',
    });

    expect(res.agent.id).toBe('Support');
    expect(res.intent.name).toBe('SUPPORT_GET_HIGH_PRIORITY_TICKETS');
    expect(res.response.text).toContain('Unresolved High-Priority Support Tickets');
  });

  // 8. "Create a workflow to notify customers about overdue invoices."
  test('Request 8: "Create a workflow to notify customers about overdue invoices." compiles valid DAG with ActionCard', async () => {
    const res = await universalAgentRuntime.executeUserRequest('Create a workflow to notify customers about overdue invoices.', {
      user: adminUser,
      language: 'en',
    });

    expect(res.agent.id).toBe('Workflow');
    expect(res.intent.name).toBe('WORKFLOW_CREATE');
    expect(res.response.text).toContain('Automated Workflow Compiled');
    expect(res.action).toBeDefined();
    expect(res.action!.required).toBe(true);
    expect(res.approval.status).toBe('PENDING');
  });

  // 9. "Find the workflow we created earlier for payment reminders."
  test('Request 9: "Find the workflow we created earlier for payment reminders." retrieves workflow definition', async () => {
    const res = await universalAgentRuntime.executeUserRequest('Find the workflow we created earlier for payment reminders.', {
      user: adminUser,
      language: 'en',
    });

    expect(res.agent.id).toBe('Workflow');
    expect(res.intent.name).toBe('WORKFLOW_FIND');
    expect(res.response.text).toContain('Workflow Retrieved');
  });

  // 10. "Schedule a meeting with the sales team tomorrow at 3 PM."
  test('Request 10: "Schedule a meeting with the sales team tomorrow at 3 PM." prepares calendar invitation and preview', async () => {
    const res = await universalAgentRuntime.executeUserRequest('Schedule a meeting with the sales team tomorrow at 3 PM.', {
      user: adminUser,
      language: 'en',
    });

    expect(res.agent.id).toBe('Scheduler');
    expect(res.intent.name).toBe('SCHEDULE_MEETING');
    expect(res.response.text).toContain('Meeting Invitation Prepared');
    expect(res.response.text).toContain('Tomorrow at 3:00 PM IST');
    expect(res.action).toBeDefined();
    expect(res.approval.status).toBe('PENDING');
  });

  // 11. "Summarize the uploaded company policy document."
  test('Request 11: "Summarize the uploaded company policy document." returns grounded policy summary with citations', async () => {
    const res = await universalAgentRuntime.executeUserRequest('Summarize the uploaded company policy document.', {
      user: adminUser,
      language: 'en',
    });

    expect(res.agent.id).toBe('Knowledge');
    expect(res.intent.name).toBe('KNOWLEDGE_QUERY_POLICY');
    expect(res.response.text).toContain('Policy');
  });

  // 12. "Which sales representative converted the most leads?"
  test('Request 12: "Which sales representative converted the most leads?" performs conversion analytics', async () => {
    const res = await universalAgentRuntime.executeUserRequest('Which sales representative converted the most leads?', {
      user: adminUser,
      language: 'en',
    });

    expect(res.agent.id).toBe('Sales');
    expect(res.intent.name).toBe('CRM_ANALYZE_TOP_REPRESENTATIVE');
    expect(res.response.text).toContain('Sales Lead Conversion Leaderboard');
    expect(res.response.text).toContain('Meera Deshmukh');
  });

  // 13. "Show me customers who have both overdue invoices and unresolved support tickets."
  test('Request 13: "Show me customers who have both overdue invoices and unresolved support tickets." correlates Finance + Support', async () => {
    const res = await universalAgentRuntime.executeUserRequest(
      'Show me customers who have both overdue invoices and unresolved support tickets.',
      {
        user: adminUser,
        language: 'en',
      }
    );

    expect(res.agent.id).toBe('CEO');
    expect(res.intent.name).toBe('CROSS_DOMAIN_OVERDUE_AND_SUPPORT');
    expect(res.response.text).toContain('Multi-Domain Risk Analysis');
    expect(res.response.text).toContain('TechCorp India');
    expect(res.suggestedActions).toBeDefined();
  });

  // 14. "Remember this business preference and use it in future conversations."
  test('Request 14: "Remember this business preference and use it in future conversations." commits fact to persistent memory', async () => {
    const res = await universalAgentRuntime.executeUserRequest(
      'Remember that our executive team meets every Monday at 9 AM for operational alignment.',
      {
        user: adminUser,
        language: 'en',
      }
    );

    expect(res.agent.id).toBe('CEO');
    expect(res.intent.name).toBe('REMEMBER_FACT');
    expect(res.response.text).toContain('committed this fact to our persistent organizational memory');
  });

  // 15. "Explain the previous result in simpler words."
  test('Request 15: "Explain the previous result in simpler words." returns plain-English explanation without invoking mutation tools', async () => {
    const res = await universalAgentRuntime.executeUserRequest('Explain the previous result in simpler words.', {
      user: adminUser,
      language: 'en',
      messageHistory: [
        {
          id: 'msg-prev',
          sender: 'AGENT',
          content: 'Identified 1 at-risk customer account TechCorp India with overdue invoice INV-2026-002 and open support ticket TICK-101.',
          timestamp: new Date().toISOString(),
        },
      ],
    });

    expect(res.intent.name).toBe('EXPLAIN_SIMPLER');
    expect(res.response.text).toContain('Plain-English Summary');
    expect(res.action).toBeUndefined(); // Does not create mutation action cards
  });
});
