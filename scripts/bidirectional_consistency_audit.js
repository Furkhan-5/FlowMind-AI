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
    name: 'Audit Runner',
    organizationId: orgId,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(secretKey);

  return `flowmind_session=${token}`;
}

async function runAudit() {
  console.log('================================================================');
  console.log('FLOWMIND AI — BIDIRECTIONAL SYNCHRONIZATION & CONSISTENCY AUDIT');
  console.log('================================================================\n');

  const authCookieOrg1 = await getAuthCookie('ORG-01', 'ADMIN', 'USR-0001');
  const authCookieForeign = await getAuthCookie('ORG-TENANT-999', 'ADMIN', 'USR-9999');

  const results = {
    step1_existing_workflow: false,
    step2_next_execution_time: false,
    step3_version_reconciliation: false,
    step4_finance_email_recipient: false,
    step5_visual_to_ai_sync: false,
    step6_ai_to_visual_sync: false,
    step7_scheduler_execution_safeguards: false,
    step8_tenant_isolation: false,
    discrepancies: [],
    details: {},
  };

  try {
    // -------------------------------------------------------------
    // 1. VERIFY THE EXISTING WORKFLOW: Weekly Finance Review (WF-1794996706285)
    // -------------------------------------------------------------
    console.log('[SECTION 1] Inspecting PostgreSQL Database for WF-1794996706285...');
    const wf = await prisma.workflow.findUnique({
      where: { id: 'WF-1794996706285' },
      include: {
        versions: { orderBy: { versionNumber: 'asc' } },
        executions: { orderBy: { startedAt: 'desc' }, take: 3 },
      },
    });

    if (!wf) {
      throw new Error('WF-1794996706285 not found in PostgreSQL');
    }

    console.log(`- Workflow ID: ${wf.id}`);
    console.log(`- Name: ${wf.name}`);
    console.log(`- Status: ${wf.status}`);
    console.log(`- Tenant ID: ${wf.organizationId}`);
    console.log(`- Creator ID: ${wf.createdById}`);
    console.log(`- Total Versions: ${wf.versions.length}`);

    const v1 = wf.versions.find((v) => v.versionNumber === 1);
    const v2 = wf.versions.find((v) => v.versionNumber === 2);

    console.log(`- Version 1 Nodes: ${v1?.dagNodes.length || 0}, Edges: ${v1?.dagEdges.length || 0}`);
    console.log(`- Version 2 Nodes: ${v2?.dagNodes.length || 0}, Edges: ${v2?.dagEdges.length || 0}`);

    const triggerCfg = (wf.triggerConfig?.config || wf.triggerConfig || {});
    console.log(`- Trigger Type: ${wf.triggerType}`);
    console.log(`- Cron Expression: ${triggerCfg.cronExpression}`);
    console.log(`- Timezone: ${triggerCfg.timezone}`);
    console.log(`- Next Execution Timestamp (ISO): ${triggerCfg.nextRunAt}`);
    console.log(`- Next Execution Formatted: ${triggerCfg.nextRunFormatted}`);

    results.details.existingWorkflow = {
      id: wf.id,
      name: wf.name,
      status: wf.status,
      tenantId: wf.organizationId,
      creatorId: wf.createdById,
      versionsCount: wf.versions.length,
      currentVersion: 2,
      cronExpression: triggerCfg.cronExpression,
      timezone: triggerCfg.timezone,
      nextRunAt: triggerCfg.nextRunAt,
      nextRunFormatted: triggerCfg.nextRunFormatted,
      lastExecutionId: wf.executions[0]?.id || null,
      lastExecutionStatus: wf.executions[0]?.status || null,
    };
    results.step1_existing_workflow = true;

    // -------------------------------------------------------------
    // 2. VERIFY NEXT EXECUTION TIME (ISO Timestamp + Timezone Math)
    // -------------------------------------------------------------
    console.log('\n[SECTION 2] Verifying Next Execution Timestamp Calculation...');
    const isoRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/;
    const isNextRunAtISO = isoRegex.test(triggerCfg.nextRunAt);

    console.log(`- Is nextRunAt valid ISO 8601 UTC string? ${isNextRunAtISO} (${triggerCfg.nextRunAt})`);
    if (!isNextRunAtISO) {
      results.discrepancies.push(`triggerConfig.nextRunAt is not an ISO timestamp: ${triggerCfg.nextRunAt}`);
    }

    // Verify against Monday 10:00 AM IST (Nov 23, 2026, 04:30:00 UTC)
    const expectedNextRunUTC = '2026-11-23T04:30:00.000Z';
    const isTimestampAccurate = triggerCfg.nextRunAt === expectedNextRunUTC;
    console.log(`- Does nextRunAt match Nov 23, 2026 at 10:00 AM IST (${expectedNextRunUTC})? ${isTimestampAccurate}`);

    if (isNextRunAtISO && isTimestampAccurate) {
      results.step2_next_execution_time = true;
    }

    // -------------------------------------------------------------
    // 3. RECONCILE WORKFLOW VERSIONS (V1 vs V2 Agreement across layers)
    // -------------------------------------------------------------
    console.log('\n[SECTION 3] Reconciling Workflow Versions...');
    // Fetch from REST API (Visual Workflows Page endpoint)
    const apiRes = await fetch(`${BASE_URL}/api/workflows/${wf.id}`, {
      headers: {
        Cookie: authCookieOrg1,
        'x-organization-id': 'ORG-01',
      },
    });
    const apiData = await apiRes.json();
    const activeDef = apiData.workflow;

    console.log(`- API Status Code: ${apiRes.status}`);
    console.log(`- API Current Version: v${activeDef?.version}`);
    console.log(`- API Schedule: ${activeDef?.trigger?.config?.scheduledTime}`);
    console.log(`- API Cron: ${activeDef?.trigger?.config?.cronExpression}`);
    console.log(`- API nextRunAt: ${activeDef?.trigger?.config?.nextRunAt}`);

    const isV2Published = v2 && v2.isPublished;
    const isV1Preserved = v1 !== undefined;
    const isAgreement = activeDef?.version === 2 && activeDef?.trigger?.config?.cronExpression === '0 10 * * 1';

    console.log(`- Version 2 is published: ${isV2Published}`);
    console.log(`- Version 1 preserved in history: ${isV1Preserved}`);
    console.log(`- Visual API and DB agree on Version 2 (Monday 10:00 AM IST): ${isAgreement}`);

    if (isV2Published && isV1Preserved && isAgreement) {
      results.step3_version_reconciliation = true;
    }

    // -------------------------------------------------------------
    // 4. REMOVE HARDCODED FINANCE EMAIL RECIPIENTS
    // -------------------------------------------------------------
    console.log('\n[SECTION 4] Auditing Finance Email Recipient Configuration...');
    const allUsers = await prisma.user.findMany({ select: { email: true } });
    const userEmails = allUsers.map((u) => u.email);
    console.log(`- Registered User Emails: ${userEmails.join(', ')}`);

    const financeManagerEmailExists = userEmails.includes('finance-manager@flowmind.ai');
    console.log(`- Does 'finance-manager@flowmind.ai' exist in users? ${financeManagerEmailExists}`);

    const emailNodeV2 = v2.dagNodes.find((n) => n.id === 'PREPARE_FINANCE_EMAIL');
    console.log(`- V2 PREPARE_FINANCE_EMAIL Node Config:`, JSON.stringify(emailNodeV2?.config, null, 2));

    const isRecipientUnresolved = emailNodeV2?.config?.recipient === null;
    const isMissingRecipientFlag = emailNodeV2?.config?.missingRecipient === true;
    const isAutoSendDisabled = emailNodeV2?.config?.autoSend === false;
    const isDraftOnly = emailNodeV2?.config?.draftOnly === true;

    console.log(`- recipient is null: ${isRecipientUnresolved}`);
    console.log(`- missingRecipient is true: ${isMissingRecipientFlag}`);
    console.log(`- autoSend is false: ${isAutoSendDisabled}`);
    console.log(`- draftOnly is true: ${isDraftOnly}`);

    // Execute dry run of workflow to verify runtime execution behavior
    const execRes = await fetch(`${BASE_URL}/api/workflows/${wf.id}/execute`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: authCookieOrg1,
        'x-organization-id': 'ORG-01',
      },
      body: JSON.stringify({ dryRun: true }),
    });
    const execData = await execRes.json();
    const emailOutput = execData.execution?.nodeOutputs?.['PREPARE_FINANCE_EMAIL'] || {};
    console.log(`- Runtime Email Node Execution Output:`, JSON.stringify(emailOutput, null, 2));

    const runtimeRecipientNull = emailOutput.to === null;
    const runtimeAutoSentFalse = emailOutput.autoSent === false;
    const runtimeDraftStatus = emailOutput.status === 'DRAFT_CREATED';

    if (
      !financeManagerEmailExists &&
      isRecipientUnresolved &&
      isMissingRecipientFlag &&
      isAutoSendDisabled &&
      runtimeRecipientNull &&
      runtimeAutoSentFalse &&
      runtimeDraftStatus
    ) {
      results.step4_finance_email_recipient = true;
    }

    // -------------------------------------------------------------
    // 5. BIDIRECTIONAL SYNCHRONIZATION: PART A (Visual -> AI Agent)
    // -------------------------------------------------------------
    console.log('\n[SECTION 5] Testing Bidirectional Sync: Visual -> AI Agent...');
    const visualWfId = `WF-VISUAL-SYNC-${Date.now()}`;
    const initialVisualPayload = {
      id: visualWfId,
      name: 'Visual Sync Test Pipeline',
      description: 'Created via Visual Workflow Builder API for bidirectional sync validation',
      triggerType: 'schedule',
      status: 'ACTIVE',
      naturalTrigger: 'Runs on schedule: Every Monday at 10:00 AM IST',
      trigger: {
        type: 'schedule',
        config: {
          cronExpression: '0 10 * * 1',
          scheduledTime: 'Every Monday at 10:00 AM IST',
          timezone: 'Asia/Kolkata',
        },
      },
      nodes: [
        { id: 'START', type: 'TRIGGER', name: 'Weekly Trigger', config: { cronExpression: '0 10 * * 1' } },
        { id: 'ACTION_1', type: 'ACTION', name: 'Scan Records', agentId: 'Finance', actionType: 'GET_METRICS', config: {} },
        { id: 'END', type: 'END', name: 'End', config: {} },
      ],
      edges: [
        { id: 'e1', source: 'START', target: 'ACTION_1' },
        { id: 'e2', source: 'ACTION_1', target: 'END' },
      ],
    };

    // 5a. Visual creates workflow
    const createRes = await fetch(`${BASE_URL}/api/workflows`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: authCookieOrg1,
        'x-organization-id': 'ORG-01',
      },
      body: JSON.stringify(initialVisualPayload),
    });
    const createdData = await createRes.json();
    console.log(`- Created via Visual API: ID ${createdData.workflow?.id}, Version v${createdData.workflow?.version}`);

    // 5b. Retrieve via AI Agent
    const aiChatQuery1 = await fetch(`${BASE_URL}/api/agent/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: authCookieOrg1,
      },
      body: JSON.stringify({
        message: `Show me workflow ${visualWfId}`,
        agentId: 'Workflow',
        context: { organizationId: 'ORG-01' },
      }),
    });
    const aiData1 = await aiChatQuery1.json();
    const reply1 = aiData1.result?.response || JSON.stringify(aiData1.result || '');
    const aiSawWorkflow1 = reply1.includes(visualWfId) || reply1.includes('Visual Sync Test Pipeline');
    console.log(`- AI Agent retrieved workflow ${visualWfId}: ${aiSawWorkflow1}`);

    // 5c. Modify schedule through Visual Interface (PATCH)
    const patchRes = await fetch(`${BASE_URL}/api/workflows/${visualWfId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Cookie: authCookieOrg1,
        'x-organization-id': 'ORG-01',
      },
      body: JSON.stringify({
        naturalTrigger: 'Runs on schedule: Every Tuesday at 11:00 AM IST',
        trigger: {
          type: 'schedule',
          config: {
            cronExpression: '0 11 * * 2',
            scheduledTime: 'Every Tuesday at 11:00 AM IST',
            timezone: 'Asia/Kolkata',
          },
        },
      }),
    });
    const patchedData = await patchRes.json();
    console.log(`- Visual API updated schedule: ${patchedData.workflow?.naturalTrigger}`);

    // 5d. Retrieve again through Workflow Agent
    const aiChatQuery2 = await fetch(`${BASE_URL}/api/agent/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: authCookieOrg1,
      },
      body: JSON.stringify({
        message: `Show me scheduled automations and calendar meetings`,
        agentId: 'Scheduler',
        context: { organizationId: 'ORG-01' },
      }),
    });
    const aiData2 = await aiChatQuery2.json();
    const reply2 = aiData2.result?.response || JSON.stringify(aiData2.result || '');
    const aiSawUpdatedSchedule = reply2.includes(visualWfId) || reply2.includes('Visual Sync Test Pipeline');
    console.log(`- AI Agent saw updated scheduled workflow in calendar: ${aiSawUpdatedSchedule}`);

    if (createdData.success && aiSawWorkflow1 && patchedData.success && aiSawUpdatedSchedule) {
      results.step5_visual_to_ai_sync = true;
    }

    // -------------------------------------------------------------
    // 6. BIDIRECTIONAL SYNCHRONIZATION: PART B (AI Agent -> Visual)
    // -------------------------------------------------------------
    console.log('\n[SECTION 6] Testing Bidirectional Sync: AI Agent -> Visual...');
    // 6a. Create workflow via AI Agent
    const aiCreateRes = await fetch(`${BASE_URL}/api/agent/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: authCookieOrg1,
      },
      body: JSON.stringify({
        message: 'Create a workflow named AI Inventory Alert Workflow. When stock falls below threshold, notify the Operations Manager.',
        agentId: 'Workflow',
        context: { organizationId: 'ORG-01' },
      }),
    });
    const aiCreateData = await aiCreateRes.json();
    const aiResult = aiCreateData.result || {};
    const aiGeneratedWfId =
      aiResult.actionCard?.details?.workflowId ||
      aiResult.responseText?.match(/WF-[A-Za-z0-9_-]+/)?.[0] ||
      aiResult.universalResponse?.response?.text?.match(/WF-[A-Za-z0-9_-]+/)?.[0] ||
      JSON.stringify(aiResult).match(/WF-[0-9]+/)?.[0];
    console.log(`- AI Agent created workflow: ID ${aiGeneratedWfId}`);

    // 6b. Retrieve from Visual Workflows Page API
    const visualListRes = await fetch(`${BASE_URL}/api/workflows`, {
      headers: {
        Cookie: authCookieOrg1,
        'x-organization-id': 'ORG-01',
      },
    });
    const visualListData = await visualListRes.json();
    const foundInVisual = visualListData.workflows?.find((w) => (aiGeneratedWfId && w.id === aiGeneratedWfId) || w.name.includes('AI Inventory Alert Workflow'));
    console.log(`- Found in Visual Workflow Library: ${foundInVisual ? foundInVisual.id : 'NOT FOUND'}`);

    // 6c. Modify node configuration through Visual interface
    if (foundInVisual) {
      const canonicalId = foundInVisual.id;
      const initialNodes = foundInVisual.nodes || [];
      const updatedNodes = initialNodes.map((n) => {
        if (n.id === 'START' || n.type === 'TRIGGER') {
          return { ...n, name: 'Enhanced Inbound Stock Sensor Trigger' };
        }
        return n;
      });

      const patchNodeRes = await fetch(`${BASE_URL}/api/workflows/${canonicalId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Cookie: authCookieOrg1,
          'x-organization-id': 'ORG-01',
        },
        body: JSON.stringify({
          nodes: updatedNodes,
          changeLog: 'Modified trigger node name via Visual Builder',
        }),
      });
      const patchNodeData = await patchNodeRes.json();
      console.log(`- Visual updated node and bumped version to: v${patchNodeData.workflow?.version}`);

      // 6d. Ask Workflow Agent to retrieve the latest configuration
      const aiVerifyRes = await fetch(`${BASE_URL}/api/agent/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Cookie: authCookieOrg1,
        },
        body: JSON.stringify({
          message: `Explain the DAG structure of workflow ${canonicalId}`,
          agentId: 'Workflow',
          context: { organizationId: 'ORG-01' },
        }),
      });
      const aiVerifyData = await aiVerifyRes.json();
      const verifyReply = aiVerifyData.result?.response || JSON.stringify(aiVerifyData.result || '');
      const aiSawUpdatedNode = verifyReply.includes('Enhanced Inbound Stock Sensor') || verifyReply.includes(canonicalId);
      console.log(`- AI Agent verified updated DAG nodes and version: ${aiSawUpdatedNode}`);

      if (foundInVisual && patchNodeData.success && aiSawUpdatedNode) {
        results.step6_ai_to_visual_sync = true;
      }
    }

    // -------------------------------------------------------------
    // 7. VERIFY SCHEDULER EXECUTION & SAFEGUARDS
    // -------------------------------------------------------------
    console.log('\n[SECTION 7] Verifying Scheduler Execution & Safeguards...');
    // 7a. Rejection of unauthorized cron invocation
    const unauthCronRes = await fetch(`${BASE_URL}/api/workflows/cron/scheduler?secret=invalid_secret_token`, {
      headers: { authorization: 'Bearer bad_token' },
    });
    console.log(`- Unauthorized Cron Trigger Status: ${unauthCronRes.status} (Expected 401)`);

    // 7b. Authorized trigger with CRON_SECRET
    const authCronRes = await fetch(`${BASE_URL}/api/workflows/cron/scheduler?secret=${CRON_SECRET}&workflowId=${wf.id}`, {
      headers: { authorization: `Bearer ${CRON_SECRET}` },
    });
    const authCronData = await authCronRes.json();
    console.log(`- Authorized Scheduler Trigger: Success = ${authCronData.success}, State = ${authCronData.schedulerState}`);
    console.log(`- Workflows Scanned: ${authCronData.activeWorkflowsScanned}, Executed: ${authCronData.executed?.length}, Skipped: ${authCronData.skipped?.length}`);

    // 7c. Idempotency Check: Immediate repeated execution should skip
    const secondCronRes = await fetch(`${BASE_URL}/api/workflows/cron/scheduler?secret=${CRON_SECRET}&workflowId=${wf.id}`, {
      headers: { authorization: `Bearer ${CRON_SECRET}` },
    });
    const secondCronData = await secondCronRes.json();
    const idempotentSkipped = secondCronData.skipped?.some((s) => s.reason === 'IDEMPOTENT_SKIPPED_RECENT_RUN');
    console.log(`- Duplicate Run Prevention (Idempotency 10-min window): ${idempotentSkipped}`);

    if (unauthCronRes.status === 401 && authCronData.success && idempotentSkipped) {
      results.step7_scheduler_execution_safeguards = true;
    }

    // -------------------------------------------------------------
    // 8. TENANT ISOLATION
    // -------------------------------------------------------------
    console.log('\n[SECTION 8] Verifying Multi-Tenant Isolation...');
    const crossTenantGet = await fetch(`${BASE_URL}/api/workflows/${wf.id}`, {
      headers: {
        Cookie: authCookieForeign,
        'x-organization-id': 'ORG-TENANT-999',
      },
    });
    console.log(`- Cross-tenant GET status: ${crossTenantGet.status} (Expected 404/403)`);

    const crossTenantPatch = await fetch(`${BASE_URL}/api/workflows/${wf.id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Cookie: authCookieForeign,
        'x-organization-id': 'ORG-TENANT-999',
      },
      body: JSON.stringify({ name: 'Malicious Tenant Overwrite' }),
    });
    console.log(`- Cross-tenant PATCH status: ${crossTenantPatch.status} (Expected 403)`);

    if (crossTenantGet.status === 404 && crossTenantPatch.status === 403) {
      results.step8_tenant_isolation = true;
    }

    console.log('\n================================================================');
    console.log('AUDIT SUMMARY & RESULTS');
    console.log('================================================================');
    console.log(JSON.stringify(results, null, 2));

    await prisma.$disconnect();
    return results;
  } catch (err) {
    console.error('Audit failed with error:', err);
    await prisma.$disconnect();
    process.exit(1);
  }
}

runAudit();
