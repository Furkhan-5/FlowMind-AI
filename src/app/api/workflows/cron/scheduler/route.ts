import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { workflowEngine } from '@/lib/workflow/workflowEngine';
import { workflowOrchestrationService } from '@/lib/workflows/workflowOrchestrationService';
import { auditLogger } from '@/lib/security/auditLogger';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

/**
 * Durable Scheduler Endpoint for Recurring Workflow Automation.
 * Compatible with Vercel Cron, GitHub Actions, and external HTTP cron triggers.
 */
export async function GET(request: NextRequest) {
  const startTime = Date.now();
  const requestId = `CRON-SCHED-${Date.now()}`;

  try {
    // 1. CRON_SECRET Verification
    const authHeader = request.headers.get('authorization');
    const secretParam = request.nextUrl.searchParams.get('secret');
    const cronSecret = process.env.CRON_SECRET || 'flowmind_cron_secret_2026';

    const isAuthorized =
      (authHeader && authHeader === `Bearer ${cronSecret}`) ||
      (secretParam && secretParam === cronSecret);

    if (!isAuthorized) {
      return NextResponse.json(
        {
          success: false,
          error: 'UNAUTHORIZED_CRON_TRIGGER: Invalid or missing CRON_SECRET token.',
          requestId,
        },
        { status: 401 }
      );
    }

    // 2. Scan PostgreSQL for Active Scheduled Workflows
    const now = new Date();
    const activeScheduledWorkflows = await prisma.workflow.findMany({
      where: {
        status: 'ACTIVE',
        triggerType: 'schedule',
      },
      include: {
        versions: {
          orderBy: { versionNumber: 'desc' },
          take: 1,
        },
        executions: {
          orderBy: { startedAt: 'desc' },
          take: 1,
        },
      },
    });

    const executionResults: any[] = [];
    const skippedResults: any[] = [];

    for (const wf of activeScheduledWorkflows) {
      const cfg: any = (wf.triggerConfig as any)?.config || wf.triggerConfig || {};
      const cronExpr = cfg.cronExpression || '0 9 * * 1';
      const scheduledTime = cfg.scheduledTime || '09:00';
      const nextRunAtRaw = cfg.nextRunAt;

      // Determine if workflow is due
      let isDue = false;
      if (nextRunAtRaw) {
        const nextRunDate = new Date(nextRunAtRaw);
        if (!isNaN(nextRunDate.getTime()) && nextRunDate.getTime() <= now.getTime()) {
          isDue = true;
        }
      }

      // Check force trigger flag via query param ?workflowId=...
      const forceWfId = request.nextUrl.searchParams.get('workflowId');
      if (forceWfId && forceWfId === wf.id) {
        isDue = true;
      }

      if (!isDue) {
        skippedResults.push({
          workflowId: wf.id,
          name: wf.name,
          reason: 'NOT_DUE',
          nextRunAt: nextRunAtRaw,
        });
        continue;
      }

      // 3. Idempotency Check: Prevent duplicate executions within the same scheduled execution window (10 minutes)
      const tenMinutesAgo = new Date(now.getTime() - 10 * 60 * 1000);
      const recentExecution = await prisma.workflowExecution.findFirst({
        where: {
          workflowId: wf.id,
          startedAt: { gte: tenMinutesAgo },
        },
      });

      if (recentExecution && !request.nextUrl.searchParams.get('force')) {
        skippedResults.push({
          workflowId: wf.id,
          name: wf.name,
          reason: 'IDEMPOTENT_SKIPPED_RECENT_RUN',
          recentExecutionId: recentExecution.id,
          startedAt: recentExecution.startedAt,
        });
        continue;
      }

      // 4. Execute the Workflow DAG
      const latestVersion = wf.versions[0];
      const versionToRun = latestVersion ? latestVersion.versionNumber : 1;

      try {
        const execution = await workflowEngine.executeWorkflow(
          wf.id,
          versionToRun,
          {
            source: 'DURABLE_CRON_SCHEDULER',
            triggerTimestamp: now.toISOString(),
            scheduledCron: cronExpr,
          },
          {
            id: 'SYSTEM-SCHEDULER',
            name: 'FlowMind Scheduler Daemon',
            organizationId: wf.organizationId,
            role: 'ADMIN',
          }
        );

        // 5. Recalculate next occurrence and persist real ISO timestamp
        const nextSchedule = workflowOrchestrationService.calculateNextRunTime(scheduledTime, cronExpr);

        const updatedConfig = {
          ...cfg,
          lastExecutedAt: now.toISOString(),
          lastExecutionId: execution.id,
          nextRunAt: nextSchedule.nextRunDateISO || nextSchedule.nextRunAt,
          nextRunFormatted: nextSchedule.nextRunFormatted || nextSchedule.nextRunAt,
          timezone: nextSchedule.timezone || 'Asia/Kolkata',
        };

        await prisma.workflow.update({
          where: { id: wf.id },
          data: {
            triggerConfig: {
              type: 'schedule',
              config: updatedConfig,
            },
            updatedAt: new Date(),
          },
        });

        executionResults.push({
          workflowId: wf.id,
          name: wf.name,
          status: execution.status,
          executionId: execution.id,
          nextRunAt: updatedConfig.nextRunAt,
        });
      } catch (execErr: any) {
        console.error(`[SCHEDULER ERROR] Workflow execution failed for ${wf.id}:`, execErr);
        executionResults.push({
          workflowId: wf.id,
          name: wf.name,
          status: 'FAILED',
          error: execErr?.message,
        });
      }
    }

    // 6. Record Audit Log
    await auditLogger.logAuditEvent({
      userId: 'SYSTEM-SCHEDULER',
      organizationId: 'ORG-01',
      requestId,
      agentId: 'Scheduler',
      actionType: 'CRON_SCHEDULER_HEARTBEAT',
      parameters: {
        totalScanned: activeScheduledWorkflows.length,
        executedCount: executionResults.length,
        skippedCount: skippedResults.length,
        durationMs: Date.now() - startTime,
      },
      approvalStatus: 'NOT_REQUIRED',
      executionStatus: 'EXECUTED',
    });

    return NextResponse.json({
      success: true,
      schedulerState: 'HEALTHY',
      timezone: 'Asia/Kolkata',
      activeWorkflowsScanned: activeScheduledWorkflows.length,
      executed: executionResults,
      skipped: skippedResults,
      durationMs: Date.now() - startTime,
      timestamp: now.toISOString(),
    });
  } catch (err: any) {
    console.error('[CRON SCHEDULER SYSTEM ERROR]', err);
    return NextResponse.json(
      {
        success: false,
        error: err?.message || 'Scheduler processing error',
        requestId,
      },
      { status: 500 }
    );
  }
}
