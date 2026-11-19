const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function reconcile() {
  const wfId = 'WF-1794996706285';
  console.log(`Reconciling workflow ${wfId}...`);

  // Target values for Version 2 (published/latest version)
  const cronExpression = '0 10 * * 1';
  const scheduledTime = 'Every Monday at 10:00 AM IST';
  const timezone = 'Asia/Kolkata';
  const nextRunAt = '2026-11-23T04:30:00.000Z';
  const nextRunFormatted = 'Monday, November 23, 2026 at 10:00 AM Asia/Kolkata (IST)';

  // 1. Update workflow main record
  const updatedWf = await prisma.workflow.update({
    where: { id: wfId },
    data: {
      status: 'ACTIVE',
      naturalTrigger: `Runs on schedule: ${scheduledTime} (${timezone})`,
      triggerConfig: {
        type: 'schedule',
        config: {
          cronExpression,
          scheduledTime,
          timezone,
          nextRunAt,
          nextRunFormatted,
        },
      },
      updatedAt: new Date(),
    },
  });
  console.log('Main workflow record updated:', updatedWf.id);

  // 2. Update Version 2 dagNodes to resolve recipient to null (unresolved) and sync START trigger node
  const v2 = await prisma.workflowVersion.findUnique({
    where: {
      workflowId_versionNumber: {
        workflowId: wfId,
        versionNumber: 2,
      },
    },
  });

  if (v2) {
    const dagNodes = v2.dagNodes.map((n) => {
      if (n.id === 'START') {
        return {
          ...n,
          name: 'Weekly Monday Scheduled Trigger (Every Monday at 10:00 AM IST)',
          config: {
            ...n.config,
            cronExpression,
            scheduledTime,
            timezone,
            nextRunAt,
            nextRunFormatted,
          },
        };
      }
      if (n.id === 'PREPARE_FINANCE_EMAIL') {
        return {
          ...n,
          name: 'Prepare Email for Finance Manager',
          config: {
            ...n.config,
            recipient: null,
            missingRecipient: true,
            recipientStatus: 'UNRESOLVED_REQUIRES_CONFIGURATION',
            draftOnly: true,
            autoSend: false,
            subject: 'Weekly Finance Review: Overdue Invoices & Balance Summary',
            template: 'FINANCE_MANAGER_WEEKLY_DIGEST',
            notes: 'Finance Manager recipient unconfigured in Organization Settings. Notification saved as draft.',
          },
        };
      }
      return n;
    });

    await prisma.workflowVersion.update({
      where: { id: v2.id },
      data: {
        dagNodes,
        changeLog: 'Reconciled v2 schedule to Monday 10:00 AM IST and resolved finance email recipient to unconfigured draft status',
        isPublished: true,
      },
    });
    console.log('Workflow Version 2 reconciled with zero hardcoded emails and Monday 10:00 schedule.');
  }

  // 3. Verify Version 1 is intact
  const v1 = await prisma.workflowVersion.findUnique({
    where: {
      workflowId_versionNumber: {
        workflowId: wfId,
        versionNumber: 1,
      },
    },
  });
  console.log('Workflow Version 1 intact:', v1 ? `v1 exists with ${v1.dagNodes.length} nodes` : 'NOT FOUND');

  await prisma.$disconnect();
  console.log('Reconciliation complete.');
}

reconcile().catch((err) => {
  console.error('Reconciliation failed:', err);
  process.exit(1);
});
