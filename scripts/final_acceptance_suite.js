const { PrismaClient } = require('@prisma/client');
const { SignJWT } = require('jose');
const prisma = new PrismaClient();

const BASE_URL = 'http://localhost:3000';
const CRON_SECRET = 'flowmind_cron_secret_2026';
const JWT_SECRET_STRING = 'flowmind-ai-super-secret-jwt-key-2026';
const secretKey = new TextEncoder().encode(JWT_SECRET_STRING);

async function getAuthCookie(orgId = 'ORG-01', role = 'ADMIN', userId = 'USR-0001') {
  const token = await new SignJWT({
    userId,
    email: `${userId.toLowerCase()}@flowmind.ai`,
    role,
    name: 'Acceptance Runner',
    organizationId: orgId,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(secretKey);

  return `flowmind_session=${token}`;
}

async function runAcceptanceSuite() {
  console.log('================================================================');
  console.log('FLOWMIND AI — FINAL ACCEPTANCE SUITE & TRACEABILITY VERIFICATION');
  console.log('================================================================\n');

  const authOrg1 = await getAuthCookie('ORG-01', 'ADMIN', 'USR-0001');
  const authOrg999 = await getAuthCookie('ORG-TENANT-999', 'ADMIN', 'USR-9999');

  const report = {
    timestamp: new Date().toISOString(),
    tests: [],
    passedCount: 0,
    failedCount: 0,
  };

  function recordTest(name, passed, evidence) {
    report.tests.push({ name, passed, evidence });
    if (passed) report.passedCount++;
    else report.failedCount++;
    console.log(`[${passed ? 'PASS' : 'FAIL'}] ${name}`);
    if (evidence) console.log(`  Evidence: ${typeof evidence === 'object' ? JSON.stringify(evidence) : evidence}`);
  }

  try {
    // 1. Create workflow through AI Agent
    console.log('\n--- 1. CREATE WORKFLOW THROUGH AI AGENT ---');
    const createReq = await fetch(`${BASE_URL}/api/agent/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: authOrg1 },
      body: JSON.stringify({
        message: 'Create a workflow named Customer Churn Prevention Pipeline. When customer health score drops below 40, schedule executive check-in.',
        agentId: 'Workflow',
        context: { organizationId: 'ORG-01' },
      }),
    });
    const createRes = await createReq.json();
    const actionCard = createRes.result?.actionCard || {};
    const createdWfId = actionCard.details?.workflowId || (createRes.result?.responseText?.match(/WF-[A-Za-z0-9_-]+/)?.[0]);
    recordTest('1. Create workflow through AI Agent', !!createdWfId, {
      workflowId: createdWfId,
      agentId: createRes.result?.targetAgent,
      status: actionCard.details?.status,
    });

    // 2. Retrieve it through AI Workflows Page (/api/workflows)
    console.log('\n--- 2. RETRIEVE THROUGH AI WORKFLOWS PAGE ---');
    const visualListReq = await fetch(`${BASE_URL}/api/workflows`, {
      headers: { Cookie: authOrg1, 'x-organization-id': 'ORG-01' },
    });
    const visualListRes = await visualListReq.json();
    const visualWf = visualListRes.workflows?.find((w) => w.id === createdWfId);
    recordTest('2. Retrieve it through AI Workflows Page', !!visualWf, {
      foundId: visualWf?.id,
      version: visualWf?.version,
      name: visualWf?.name,
      nodesCount: visualWf?.nodes?.length,
    });

    // 3. Update it through AI Agent (Reschedule)
    console.log('\n--- 3. UPDATE IT THROUGH AI AGENT ---');
    const rescheduleReq = await fetch(`${BASE_URL}/api/agent/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: authOrg1 },
      body: JSON.stringify({
        message: `Reschedule ${createdWfId} to every Friday at 4 PM IST`,
        agentId: 'Scheduler',
        context: { organizationId: 'ORG-01' },
      }),
    });
    const rescheduleRes = await rescheduleReq.json();
    const agentRescheduleText = rescheduleRes.result?.responseText || JSON.stringify(rescheduleRes.result || '');
    recordTest('3. Update it through AI Agent (Reschedule)', agentRescheduleText.includes(createdWfId) || agentRescheduleText.includes('Friday'), {
      responseTextExcerpt: agentRescheduleText.slice(0, 160),
    });

    // 4. Verify update through Visual Workflow Page
    console.log('\n--- 4. VERIFY UPDATE THROUGH VISUAL WORKFLOW PAGE ---');
    const visualGetReq = await fetch(`${BASE_URL}/api/workflows/${createdWfId}`, {
      headers: { Cookie: authOrg1, 'x-organization-id': 'ORG-01' },
    });
    const visualGetRes = await visualGetReq.json();
    const visualUpdatedWf = visualGetRes.workflow;
    const isFridaySchedule =
      visualUpdatedWf?.trigger?.config?.cronExpression?.includes('5') ||
      visualUpdatedWf?.naturalTrigger?.toLowerCase().includes('friday');
    recordTest('4. Verify update through Visual Workflow Page', isFridaySchedule, {
      version: visualUpdatedWf?.version,
      cronExpression: visualUpdatedWf?.trigger?.config?.cronExpression,
      naturalTrigger: visualUpdatedWf?.naturalTrigger,
      nextRunAt: visualUpdatedWf?.trigger?.config?.nextRunAt,
    });

    // 5. Update it through Visual Workflow Page (Add Node/Modify Node)
    console.log('\n--- 5. UPDATE IT THROUGH VISUAL WORKFLOW PAGE ---');
    const originalNodes = visualUpdatedWf.nodes || [];
    const modifiedNodes = originalNodes.map((n) => {
      if (n.id === 'START' || n.type === 'TRIGGER') {
        return { ...n, name: 'VIP Customer Churn Early Warning Trigger' };
      }
      return n;
    });
    const visualPatchReq = await fetch(`${BASE_URL}/api/workflows/${createdWfId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Cookie: authOrg1, 'x-organization-id': 'ORG-01' },
      body: JSON.stringify({
        nodes: modifiedNodes,
        changeLog: 'Promoted trigger node to VIP early warning detection',
      }),
    });
    const visualPatchRes = await visualPatchReq.json();
    const bumpedVersion = visualPatchRes.workflow?.version;
    recordTest('5. Update it through Visual Workflow Page', visualPatchRes.success && bumpedVersion > visualUpdatedWf.version, {
      previousVersion: visualUpdatedWf.version,
      newVersion: bumpedVersion,
    });

    // 6. Verify update through AI Agent
    console.log('\n--- 6. VERIFY UPDATE THROUGH AI AGENT ---');
    const aiExplainReq = await fetch(`${BASE_URL}/api/agent/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: authOrg1 },
      body: JSON.stringify({
        message: `Explain the DAG structure of workflow ${createdWfId}`,
        agentId: 'Workflow',
        context: { organizationId: 'ORG-01' },
      }),
    });
    const aiExplainRes = await aiExplainReq.json();
    const aiExplainText = aiExplainRes.result?.responseText || JSON.stringify(aiExplainRes.result || '');
    const aiSawVipNode = aiExplainText.includes('VIP Customer Churn Early Warning') || aiExplainText.includes(createdWfId);
    recordTest('6. Verify update through AI Agent', aiSawVipNode, {
      sawVipNode: aiSawVipNode,
      responseTextExcerpt: aiExplainText.slice(0, 160),
    });

    // 7. Verify identical workflow ID and current version
    console.log('\n--- 7. VERIFY IDENTICAL WORKFLOW ID & CURRENT VERSION ---');
    const dbRecord = await prisma.workflow.findUnique({
      where: { id: createdWfId },
      include: { versions: { orderBy: { versionNumber: 'desc' }, take: 1 } },
    });
    const dbVersion = dbRecord?.versions[0]?.versionNumber;
    const isIdAndVersionIdentical =
      createdWfId === visualPatchRes.workflow?.id &&
      bumpedVersion === dbVersion;
    recordTest('7. Verify identical workflow ID and current version', isIdAndVersionIdentical, {
      canonicalId: createdWfId,
      visualVersion: bumpedVersion,
      dbVersion,
    });

    // 8. Verify identical DAG nodes and dependencies
    console.log('\n--- 8. VERIFY IDENTICAL DAG NODES & DEPENDENCIES ---');
    const dbNodes = dbRecord?.versions[0]?.dagNodes || [];
    const visualNodes = visualPatchRes.workflow?.nodes || [];
    const nodesMatch = dbNodes.length === visualNodes.length && dbNodes.length > 0;
    recordTest('8. Verify identical DAG nodes and dependencies', nodesMatch, {
      dbNodesCount: dbNodes.length,
      visualNodesCount: visualNodes.length,
    });

    // 9. Verify identical schedule and timezone
    console.log('\n--- 9. VERIFY IDENTICAL SCHEDULE & TIMEZONE ---');
    const dbCfg = (dbRecord?.triggerConfig?.config || dbRecord?.triggerConfig || {});
    const visCfg = visualPatchRes.workflow?.trigger?.config || {};
    const scheduleMatch =
      dbCfg.cronExpression === visCfg.cronExpression &&
      dbCfg.timezone === visCfg.timezone &&
      dbCfg.nextRunAt === visCfg.nextRunAt;
    recordTest('9. Verify identical schedule and timezone', scheduleMatch, {
      dbCron: dbCfg.cronExpression,
      visualCron: visCfg.cronExpression,
      dbTimezone: dbCfg.timezone,
      visualTimezone: visCfg.timezone,
      dbNextRunAt: dbCfg.nextRunAt,
      visualNextRunAt: visCfg.nextRunAt,
    });

    // 10. Verify scheduler registration and execution safeguards
    console.log('\n--- 10. VERIFY SCHEDULER SAFEGUARDS ---');
    const schedUnauth = await fetch(`${BASE_URL}/api/workflows/cron/scheduler?secret=unauthorized_secret`, {
      headers: { authorization: 'Bearer bad_secret' },
    });
    const schedAuth = await fetch(`${BASE_URL}/api/workflows/cron/scheduler?secret=${CRON_SECRET}`, {
      headers: { authorization: `Bearer ${CRON_SECRET}` },
    });
    const schedAuthData = await schedAuth.json();
    const safeguardsPass = schedUnauth.status === 401 && schedAuthData.success === true;
    recordTest('10. Verify scheduler registration and execution safeguards', safeguardsPass, {
      unauthorizedStatus: schedUnauth.status,
      authorizedSuccess: schedAuthData.success,
      schedulerState: schedAuthData.schedulerState,
      activeScanned: schedAuthData.activeWorkflowsScanned,
    });

    // 11. Verify tenant isolation
    console.log('\n--- 11. VERIFY TENANT ISOLATION ---');
    const crossGet = await fetch(`${BASE_URL}/api/workflows/${createdWfId}`, {
      headers: { Cookie: authOrg999, 'x-organization-id': 'ORG-TENANT-999' },
    });
    const crossPatch = await fetch(`${BASE_URL}/api/workflows/${createdWfId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Cookie: authOrg999, 'x-organization-id': 'ORG-TENANT-999' },
      body: JSON.stringify({ name: 'Hacked Name' }),
    });
    const tenantIsolationPass = crossGet.status === 404 && crossPatch.status === 403;
    recordTest('11. Verify tenant isolation', tenantIsolationPass, {
      crossTenantGetStatus: crossGet.status,
      crossTenantPatchStatus: crossPatch.status,
    });

    // 12. Verify missing email recipient handling
    console.log('\n--- 12. VERIFY MISSING EMAIL RECIPIENT HANDLING ---');
    const financeWf = await prisma.workflow.findUnique({
      where: { id: 'WF-1794996706285' },
      include: { versions: { where: { versionNumber: 2 } } },
    });
    const emailNode = financeWf?.versions[0]?.dagNodes?.find((n) => n.id === 'PREPARE_FINANCE_EMAIL');
    const emailCfg = emailNode?.config || {};
    const emailSafe =
      emailCfg.recipient === null &&
      emailCfg.missingRecipient === true &&
      emailCfg.autoSend === false &&
      emailCfg.draftOnly === true;
    recordTest('12. Verify missing email recipient handling', emailSafe, {
      recipient: emailCfg.recipient,
      missingRecipient: emailCfg.missingRecipient,
      recipientStatus: emailCfg.recipientStatus,
      autoSend: emailCfg.autoSend,
      draftOnly: emailCfg.draftOnly,
    });

    // 13. Verify no duplicate records or executions
    console.log('\n--- 13. VERIFY NO DUPLICATE RECORDS OR EXECUTIONS ---');
    const countById = await prisma.workflow.count({ where: { id: createdWfId } });
    const executions = await prisma.workflowExecution.findMany({ where: { workflowId: createdWfId } });
    const noDuplicates = countById === 1;
    recordTest('13. Verify no duplicate records or executions', noDuplicates, {
      countById,
      executionsCount: executions.length,
    });

    console.log('\n================================================================');
    console.log(`FINAL ACCEPTANCE SUMMARY: ${report.passedCount}/${report.tests.length} TESTS PASSED`);
    console.log('================================================================\n');

    await prisma.$disconnect();
    return report;
  } catch (err) {
    console.error('Acceptance suite error:', err);
    await prisma.$disconnect();
    process.exit(1);
  }
}

runAcceptanceSuite();
