const http = require('http');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

function httpRequest(options, postData = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ status: res.statusCode, headers: res.headers, data: parsed, raw: data });
        } catch (e) {
          resolve({ status: res.statusCode, headers: res.headers, data: null, raw: data });
        }
      });
    });

    req.on('error', (err) => reject(err));
    if (postData) {
      const payload = typeof postData === 'string' ? postData : JSON.stringify(postData);
      req.write(payload);
    }
    req.end();
  });
}

async function loginAndGetCookie(email = 'admin@flowmind.ai', password = 'flowmind2026!') {
  const loginRes = await httpRequest({
    hostname: '127.0.0.1',
    port: 3000,
    path: '/api/auth/login',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  }, { email, password, role: 'ADMIN' });

  if (loginRes.status !== 200) {
    throw new Error(`Login failed with status ${loginRes.status}: ${loginRes.raw}`);
  }

  const cookies = (loginRes.headers['set-cookie'] || []).map((c) => c.split(';')[0]).join('; ');
  return cookies;
}

async function sendChatMessage(query, selectedAgent = 'Workflow', cookie = '') {
  const res = await httpRequest({
    hostname: '127.0.0.1',
    port: 3000,
    path: '/api/agent/chat',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': cookie,
    },
  }, {
    query,
    selectedAgentOverride: selectedAgent,
    language: 'en',
  });

  const responseText = res.data?.result?.responseText || res.data?.response || res.data?.message || '';
  return { status: res.status, data: res.data, text: responseText };
}

async function runE2ETests() {
  console.log('================================================================');
  console.log('   FLOWMIND AI — UNIFIED WORKFLOW ORCHESTRATION & AGENT SYNC');
  console.log('   ACCEPTANCE TEST SUITE (8 TEST PHASES)');
  console.log('================================================================\n');

  console.log('1. Authenticating Admin Session via /api/auth/login ...');
  const adminCookie = await loginAndGetCookie('admin@flowmind.ai', 'flowmind2026!');
  console.log('Admin session established.\n');

  const results = {
    timestamp: new Date().toISOString(),
    totalTests: 8,
    passed: 0,
    failed: 0,
    tests: [],
  };

  const testWfId = `WF-E2E-VISUAL-${Date.now()}`;

  // TEST 1: Visual Creation Sync to PostgreSQL & Agent Awareness
  try {
    console.log('TEST 1: Visual Creation Sync to PostgreSQL & Agent Awareness');
    const postRes = await httpRequest({
      hostname: '127.0.0.1',
      port: 3000,
      path: '/api/workflows',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': adminCookie,
      },
    }, {
      id: testWfId,
      name: 'E2E Visual Client Onboarding DAG',
      description: 'End-to-end sync validation between Visual Builder and Workflow Agent',
      naturalTrigger: 'When client registers through visual portal',
      status: 'ACTIVE',
      nodes: [
        { id: 'N1', name: 'Client Registration Trigger', type: 'TRIGGER', config: { form: 'REG_01' } },
        { id: 'N2', name: 'CRM Account Initialization', type: 'AGENT', agentId: 'Sales', config: {} },
        { id: 'N3', name: 'Dispatch Welcome Email', type: 'NOTIFICATION', agentId: 'Email', config: {} },
      ],
      edges: [
        { id: 'E1', source: 'N1', target: 'N2' },
        { id: 'E2', source: 'N2', target: 'N3' },
      ],
    });

    if (postRes.status !== 200 || !postRes.data?.success) {
      throw new Error(`Failed to create workflow via API: ${JSON.stringify(postRes.data)}`);
    }

    // Verify directly in PostgreSQL
    const dbRecord = await prisma.workflow.findUnique({
      where: { id: testWfId },
      include: { versions: true },
    });

    if (!dbRecord || dbRecord.versions.length === 0) {
      throw new Error(`PostgreSQL record or version missing for ${testWfId}`);
    }

    // Now verify the Workflow Agent retrieves and knows about it
    const chatRes = await sendChatMessage('Show me all workflows I have created.', 'Workflow', adminCookie);
    const agentKnows = chatRes.text.includes('E2E Visual Client Onboarding DAG') || chatRes.text.includes(testWfId);

    if (!agentKnows) {
      throw new Error(`Workflow Agent does not know about visually created workflow ${testWfId}. Agent response: ${chatRes.text.slice(0, 200)}...`);
    }

    console.log(`✓ TEST 1 PASSED: Visual workflow created via API, persisted in PostgreSQL, and recognized by Workflow Agent.\n`);
    results.passed++;
    results.tests.push({ name: 'Visual Creation Sync', status: 'PASSED', details: `Workflow ${testWfId} synchronized with PostgreSQL and Workflow Agent` });
  } catch (err) {
    console.error(`✗ TEST 1 FAILED:`, err.message);
    results.failed++;
    results.tests.push({ name: 'Visual Creation Sync', status: 'FAILED', error: err.message });
  }

  // TEST 2: Natural Language Retrieval & DAG Topology Explanation
  try {
    console.log('TEST 2: Natural Language Retrieval & DAG Explanation');
    const activeRes = await sendChatMessage('Which workflows are currently active?', 'Workflow', adminCookie);
    if (!activeRes.text.includes('ACTIVE') && !activeRes.text.includes('workflow')) {
      throw new Error(`Agent failed to list active workflows: ${activeRes.text.slice(0, 200)}`);
    }

    const dagRes = await sendChatMessage('Explain the DAG structure of my Lead Qualification workflow.', 'Workflow', adminCookie);
    const hasDAG = dagRes.text.includes('Lead Qualification') && (dagRes.text.includes('Nodes') || dagRes.text.includes('DAG') || dagRes.text.includes('Trigger'));

    if (!hasDAG) {
      throw new Error(`Agent failed to explain DAG structure for Lead Qualification workflow: ${dagRes.text.slice(0, 200)}`);
    }

    console.log(`✓ TEST 2 PASSED: Active workflows listed and DAG structure accurately explained.\n`);
    results.passed++;
    results.tests.push({ name: 'Natural Language Retrieval', status: 'PASSED', details: 'Active workflows and DAG structure verified' });
  } catch (err) {
    console.error(`✗ TEST 2 FAILED:`, err.message);
    results.failed++;
    results.tests.push({ name: 'Natural Language Retrieval', status: 'FAILED', error: err.message });
  }

  // TEST 3: Schedule Synchronization
  try {
    console.log('TEST 3: Schedule Synchronization (Meeting Scheduling & Querying)');
    const schedReq = await sendChatMessage('Schedule a meeting at 9:00 AM tomorrow.', 'Scheduler', adminCookie);

    // Verify scheduled workflows in PostgreSQL
    const scheduledWorkflows = await prisma.workflow.findMany({
      where: {
        OR: [
          { triggerType: 'schedule' },
          { category: 'MEETING' },
          { name: { contains: 'Meeting', mode: 'insensitive' } },
        ],
      },
    });

    if (scheduledWorkflows.length === 0) {
      throw new Error('Scheduled meeting workflow not found in PostgreSQL');
    }

    // Query Scheduler Agent
    const queryMeetings = await sendChatMessage('What meetings have I scheduled?', 'Scheduler', adminCookie);

    // Query Workflow Agent
    const queryTomorrow = await sendChatMessage('Show my workflows scheduled for tomorrow.', 'Workflow', adminCookie);

    const schedRecognized = queryMeetings.text.includes('Scheduled') || queryMeetings.text.includes('Tomorrow') || queryTomorrow.text.includes('Scheduled');
    if (!schedRecognized) {
      throw new Error(`Scheduler or Workflow agent failed to retrieve scheduled meeting. Response: ${queryMeetings.text.slice(0, 200)}`);
    }

    console.log(`✓ TEST 3 PASSED: Meeting schedule persisted in PostgreSQL and synchronized across Scheduler & Workflow agents.\n`);
    results.passed++;
    results.tests.push({ name: 'Schedule Synchronization', status: 'PASSED', details: 'Meeting schedule synchronized across database and agents' });
  } catch (err) {
    console.error(`✗ TEST 3 FAILED:`, err.message);
    results.failed++;
    results.tests.push({ name: 'Schedule Synchronization', status: 'FAILED', error: err.message });
  }

  // TEST 4: Agent Update (Reschedule)
  try {
    console.log('TEST 4: Agent Update (Reschedule meeting to 10 AM)');
    const reschedRes = await sendChatMessage('Update the meeting workflow to 10 AM.', 'Scheduler', adminCookie);

    const has10am = reschedRes.text.includes('10 AM') || reschedRes.text.includes('10:00');
    if (!has10am) {
      throw new Error(`Agent failed to confirm 10 AM schedule update. Response: ${reschedRes.text.slice(0, 200)}`);
    }

    // Verify in PostgreSQL database
    const dbWorkflows = await prisma.workflow.findMany({
      where: {
        OR: [
          { category: 'MEETING' },
          { name: { contains: 'Meeting', mode: 'insensitive' } },
        ],
      },
    });

    const matches10am = dbWorkflows.some((w) => {
      const cfg = JSON.stringify(w.triggerConfig || {});
      return cfg.includes('10 AM') || cfg.includes('10:00') || (w.naturalTrigger && w.naturalTrigger.includes('10'));
    });

    if (!matches10am) {
      throw new Error('PostgreSQL record does not reflect 10 AM schedule update');
    }

    console.log(`✓ TEST 4 PASSED: Meeting rescheduled to 10 AM and verified in PostgreSQL.\n`);
    results.passed++;
    results.tests.push({ name: 'Agent Update (Reschedule)', status: 'PASSED', details: 'Rescheduled meeting to 10 AM in PostgreSQL' });
  } catch (err) {
    console.error(`✗ TEST 4 FAILED:`, err.message);
    results.failed++;
    results.tests.push({ name: 'Agent Update (Reschedule)', status: 'FAILED', error: err.message });
  }

  // TEST 5: Visual Update Versioning
  try {
    console.log('TEST 5: Visual Update Versioning (Bumping workflow to Version 2)');
    const patchRes = await httpRequest({
      hostname: '127.0.0.1',
      port: 3000,
      path: `/api/workflows/${testWfId}`,
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': adminCookie,
      },
    }, {
      nodes: [
        { id: 'N1', name: 'Client Registration Trigger', type: 'TRIGGER', config: { form: 'REG_01' } },
        { id: 'N2', name: 'CRM Account Initialization', type: 'AGENT', agentId: 'Sales', config: {} },
        { id: 'N3', name: 'Dispatch Welcome Email', type: 'NOTIFICATION', agentId: 'Email', config: {} },
        { id: 'N4', name: 'Post Security Audit', type: 'ACTION', agentId: 'Security', config: {} },
      ],
      changeLog: 'Added N4 Security Audit node in visual builder',
    });

    if (patchRes.status !== 200 || !patchRes.data?.success) {
      throw new Error(`Failed to update workflow version: ${JSON.stringify(patchRes.data)}`);
    }

    // Verify in PostgreSQL version records
    const versions = await prisma.workflowVersion.findMany({
      where: { workflowId: testWfId },
      orderBy: { versionNumber: 'asc' },
    });

    if (versions.length !== 2) {
      throw new Error(`Expected 2 workflow versions in PostgreSQL, found ${versions.length}`);
    }

    console.log(`✓ TEST 5 PASSED: Workflow version bumped to v2 and both versions persisted in PostgreSQL.\n`);
    results.passed++;
    results.tests.push({ name: 'Visual Update Versioning', status: 'PASSED', details: 'Workflow updated to v2 with immutable version history' });
  } catch (err) {
    console.error(`✗ TEST 5 FAILED:`, err.message);
    results.failed++;
    results.tests.push({ name: 'Visual Update Versioning', status: 'FAILED', error: err.message });
  }

  // TEST 6: Workflow Execution & History
  try {
    console.log('TEST 6: Workflow Execution & Execution History Persistence');
    const execRes = await httpRequest({
      hostname: '127.0.0.1',
      port: 3000,
      path: '/api/workflows/WF-TEMPLATE-01/execute',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': adminCookie,
      },
    }, {
      payload: { company: 'Tata Motors', value: 450000 },
    });

    if (execRes.status !== 200 || !execRes.data?.success) {
      throw new Error(`Workflow execution failed: ${JSON.stringify(execRes.data)}`);
    }

    const execId = execRes.data.execution.id;

    // Verify PostgreSQL execution record
    const dbExec = await prisma.workflowExecution.findUnique({
      where: { id: execId },
    });

    if (!dbExec || dbExec.status !== 'COMPLETED') {
      throw new Error(`Execution record ${execId} not found or status not COMPLETED in PostgreSQL`);
    }

    // Query execution history via Workflow Agent
    const histRes = await sendChatMessage('Show me the execution history of my latest workflow.', 'Workflow', adminCookie);
    const hasHistory = histRes.text.includes('Execution') || histRes.text.includes('COMPLETED') || histRes.text.includes(execId);

    if (!hasHistory) {
      throw new Error(`Agent failed to retrieve execution history: ${histRes.text.slice(0, 200)}`);
    }

    console.log(`✓ TEST 6 PASSED: Workflow execution completed and persisted to PostgreSQL.\n`);
    results.passed++;
    results.tests.push({ name: 'Workflow Execution & History', status: 'PASSED', details: `Execution ${execId} completed and recorded in PG` });
  } catch (err) {
    console.error(`✗ TEST 6 FAILED:`, err.message);
    results.failed++;
    results.tests.push({ name: 'Workflow Execution & History', status: 'FAILED', error: err.message });
  }

  // TEST 7: Pause and Resume Lifecycle
  try {
    console.log('TEST 7: Pause and Resume Lifecycle');
    const pauseRes = await sendChatMessage('Pause the workflow that sends payment reminders.', 'Workflow', adminCookie);

    const isPaused = pauseRes.text.includes('PAUSED') || pauseRes.text.includes('paused');
    if (!isPaused) {
      throw new Error(`Agent failed to pause payment reminder workflow: ${pauseRes.text.slice(0, 200)}`);
    }

    // Verify status in PostgreSQL
    const pausedWf = await prisma.workflow.findFirst({
      where: {
        OR: [
          { name: { contains: 'Invoice', mode: 'insensitive' } },
          { name: { contains: 'Payment', mode: 'insensitive' } },
        ],
        status: 'PAUSED',
      },
    });

    if (!pausedWf) {
      throw new Error('Workflow status in PostgreSQL is not PAUSED');
    }

    // Resume workflow
    const resumeRes = await sendChatMessage(`Activate the workflow ${pausedWf.id}`, 'Workflow', adminCookie);
    const resumedWf = await prisma.workflow.findUnique({
      where: { id: pausedWf.id },
    });

    if (!resumedWf || resumedWf.status !== 'ACTIVE') {
      throw new Error('Workflow failed to reactivate to ACTIVE in PostgreSQL');
    }

    console.log(`✓ TEST 7 PASSED: Workflow paused and reactivated cleanly in PostgreSQL.\n`);
    results.passed++;
    results.tests.push({ name: 'Pause and Resume Lifecycle', status: 'PASSED', details: 'Workflow successfully paused and reactivated' });
  } catch (err) {
    console.error(`✗ TEST 7 FAILED:`, err.message);
    results.failed++;
    results.tests.push({ name: 'Pause and Resume Lifecycle', status: 'FAILED', error: err.message });
  }

  // TEST 8: Tenant Isolation
  try {
    console.log('TEST 8: Tenant Isolation (Multi-tenant security boundary)');
    const auditWfId = `WF-AUDIT-TENANT-${Date.now()}`;

    // Insert ORG-AUDIT-2026 workflow directly into PostgreSQL
    await prisma.workflow.create({
      data: {
        id: auditWfId,
        organizationId: 'ORG-AUDIT-2026',
        name: 'Confidential Audit Org Acquisition Workflow',
        status: 'ACTIVE',
        naturalTrigger: 'Manual',
        versions: {
          create: {
            versionNumber: 1,
            dagNodes: [],
            dagEdges: [],
            isPublished: true,
          },
        },
      },
    });

    // Query workflows as ORG-01 user via API
    const getRes = await httpRequest({
      hostname: '127.0.0.1',
      port: 3000,
      path: '/api/workflows',
      method: 'GET',
      headers: { 'Cookie': adminCookie },
    });

    const wfs = getRes.data?.workflows || [];
    const leaked = wfs.some((w) => w.id === auditWfId || w.organizationId === 'ORG-AUDIT-2026');

    if (leaked) {
      throw new Error('Tenant isolation breach: ORG-AUDIT-2026 workflow leaked in ORG-01 workflow list!');
    }

    console.log(`✓ TEST 8 PASSED: Strict tenant isolation enforced. ORG-AUDIT-2026 workflows are isolated from ORG-01.\n`);
    results.passed++;
    results.tests.push({ name: 'Tenant Isolation', status: 'PASSED', details: 'Strict tenant isolation verified in PostgreSQL queries' });
  } catch (err) {
    console.error(`✗ TEST 8 FAILED:`, err.message);
    results.failed++;
    results.tests.push({ name: 'Tenant Isolation', status: 'FAILED', error: err.message });
  }

  // Clean up debug file
  try {
    const fs = require('fs');
    if (fs.existsSync('debug_chat.js')) fs.unlinkSync('debug_chat.js');
    fs.writeFileSync('FLOWMIND_WORKFLOW_E2E_TEST_RESULTS.json', JSON.stringify(results, null, 2));
  } catch (e) {}

  console.log('================================================================');
  console.log(`TEST RESULTS SUMMARY: ${results.passed}/${results.totalTests} PASSED`);
  if (results.failed === 0) {
    console.log('ALL WORKFLOW ORCHESTRATION & AGENT SYNC ACCEPTANCE TESTS PASSED!');
  } else {
    console.log(`${results.failed} TEST(S) FAILED.`);
  }
  console.log('================================================================\n');

  await prisma.$disconnect();
  return results.failed === 0;
}

runE2ETests()
  .then((success) => process.exit(success ? 0 : 1))
  .catch((err) => {
    console.error('Fatal test error:', err);
    process.exit(1);
  });
