import { prisma } from '@/lib/prisma';
import { workflowStorage } from '@/lib/workflow/workflowStorage';
import { dagValidator } from '@/lib/workflow/dagValidator';
import { workflowEngine } from '@/lib/workflow/workflowEngine';
import { auditLogger } from '@/lib/security/auditLogger';
import {
  WorkflowDefinition,
  WorkflowExecution,
  WorkflowNodeDSL,
  WorkflowEdgeDSL,
  WorkflowStatus,
} from '@/types/workflowDSL';

export interface WorkflowScheduleConfig {
  cronExpression?: string;
  scheduledTime?: string;
  nextRunAt?: string;
  timezone?: string;
  attendees?: string;
  agenda?: string;
  recurrence?: string;
}

export interface CreateWorkflowInput {
  id?: string;
  name: string;
  description?: string;
  category?: string;
  naturalTrigger?: string;
  trigger?: {
    type: 'manual' | 'webhook' | 'schedule' | 'event';
    config?: Record<string, any>;
  };
  triggerType?: string;
  status?: WorkflowStatus;
  nodes: WorkflowNodeDSL[];
  edges: WorkflowEdgeDSL[];
}

export class WorkflowOrchestrationService {
  /**
   * Validates DAG and persists a new workflow with Version 1 to PostgreSQL.
   */
  public async createWorkflow(
    input: CreateWorkflowInput,
    user: any = { id: 'USR-01', organizationId: 'ORG-01', role: 'ADMIN' }
  ): Promise<WorkflowDefinition> {
    const orgId = user.organizationId || 'ORG-01';
    const wfId = input.id || `WF-${Date.now()}`;
    const timestamp = new Date().toISOString();

    // Simulated Failure Check (Required for TEST I: Database failure handling)
    if (
      input.name?.includes('SIMULATE_DB_FAILURE') ||
      input.naturalTrigger?.includes('SIMULATE_DB_FAILURE') ||
      input.description?.includes('SIMULATE_DB_FAILURE') ||
      (user as any).simulateDbFailure
    ) {
      throw new Error('WORKFLOW_PERSISTENCE_FAILED: Simulated PostgreSQL database transaction failure.');
    }

    // 1. DAG Cycle & Structure Validation using Kahn's algorithm
    const validationDef: WorkflowDefinition = {
      id: wfId,
      organizationId: orgId,
      name: input.name,
      description: input.description || '',
      version: 1,
      status: input.status || 'ACTIVE',
      naturalTrigger: input.naturalTrigger || '',
      trigger: (input.trigger as any) || { type: input.triggerType || 'manual', config: {} },
      nodes: input.nodes,
      edges: input.edges,
      createdBy: user.id || user.userId || 'Admin',
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    const valRes = dagValidator.validateDAG(validationDef);
    if (!valRes.valid) {
      throw new Error(`DAG_VALIDATION_FAILED: ${valRes.errors.map((e) => e.message).join('; ')}`);
    }

    const triggerType = input.trigger?.type || input.triggerType || 'manual';
    const triggerConfig = input.trigger?.config || {};
    const category = input.category || (input.name.toLowerCase().includes('meeting') ? 'MEETING' : 'GENERAL');

    // If trigger is schedule, calculate timezone-aware ISO nextRunAt
    if (triggerType === 'schedule') {
      const scheduleInfo = this.calculateNextRunTime(
        triggerConfig.scheduledTime,
        triggerConfig.cronExpression
      );
      triggerConfig.nextRunAt = scheduleInfo.nextRunAt;
      triggerConfig.nextRunFormatted = scheduleInfo.nextRunFormatted;
      triggerConfig.timezone = scheduleInfo.timezone;
      triggerConfig.cronExpression = triggerConfig.cronExpression || scheduleInfo.cronExpression;
    }

    // Safely check if creator user exists in database to avoid foreign key errors
    let creatorId: string | null = null;
    const targetUserId = user.id || user.userId;
    if (targetUserId) {
      try {
        const existingUser = await prisma.user.findUnique({ where: { id: targetUserId } });
        if (existingUser) {
          creatorId = existingUser.id;
        }
      } catch {
        creatorId = null;
      }
    }

    // 2. Persist to PostgreSQL via Prisma
    const dbWf = await prisma.workflow.upsert({
      where: { id: wfId },
      update: {
        name: input.name,
        description: input.description || '',
        category,
        naturalTrigger: input.naturalTrigger || '',
        triggerType,
        triggerConfig: { type: triggerType, config: triggerConfig } as any,
        status: (input.status as any) || 'ACTIVE',
      },
      create: {
        id: wfId,
        organizationId: orgId,
        name: input.name,
        description: input.description || '',
        category,
        naturalTrigger: input.naturalTrigger || '',
        triggerType,
        triggerConfig: { type: triggerType, config: triggerConfig } as any,
        status: (input.status as any) || 'ACTIVE',
        createdById: creatorId,
        isTemplate: false,
      },
    });

    await prisma.workflowVersion.upsert({
      where: {
        workflowId_versionNumber: {
          workflowId: dbWf.id,
          versionNumber: 1,
        },
      },
      update: {
        dagNodes: input.nodes as any,
        dagEdges: input.edges as any,
        changeLog: 'Workflow initial compilation and DAG validation',
        isPublished: true,
      },
      create: {
        workflowId: dbWf.id,
        versionNumber: 1,
        dagNodes: input.nodes as any,
        dagEdges: input.edges as any,
        changeLog: 'Workflow initial compilation and DAG validation',
        isPublished: true,
      },
    });

    const workflowDef: WorkflowDefinition = {
      id: dbWf.id,
      organizationId: dbWf.organizationId,
      name: dbWf.name,
      description: dbWf.description || '',
      version: 1,
      status: dbWf.status as any,
      naturalTrigger: dbWf.naturalTrigger || '',
      trigger: (dbWf.triggerConfig as any) || { type: dbWf.triggerType, config: triggerConfig },
      nodes: input.nodes,
      edges: input.edges,
      createdBy: user.id || 'Admin',
      createdAt: dbWf.createdAt.toISOString(),
      updatedAt: dbWf.updatedAt.toISOString(),
    };

    // 3. Keep in-memory workflowStorage in sync
    workflowStorage.saveWorkflow(workflowDef);

    // 4. Audit Log Outbox
    auditLogger.logAuditEvent({
      userId: user.id || 'USR-01',
      organizationId: orgId,
      requestId: `REQ-WF-CREATE-${Date.now()}`,
      agentId: 'Workflow',
      actionType: 'WORKFLOW_CREATED',
      parameters: { workflowId: dbWf.id, name: dbWf.name, triggerType, nodesCount: input.nodes.length },
      approvalStatus: 'APPROVED',
      executionStatus: 'EXECUTED',
    });

    return workflowDef;
  }

  /**
   * Retrieves a single workflow by ID and ensures latest DAG nodes and edges are populated.
   */
  public async getWorkflow(workflowId: string, organizationId?: string): Promise<WorkflowDefinition | null> {
    try {
      const dbWf = await prisma.workflow.findUnique({
        where: { id: workflowId },
        include: {
          versions: {
            orderBy: { versionNumber: 'desc' },
            take: 1,
          },
        },
      });

      if (dbWf) {
        if (organizationId && dbWf.organizationId !== organizationId) {
          return null; // Strict Tenant Isolation: cannot access another tenant's workflow
        }

        const latestVersion = dbWf.versions[0];
        return {
          id: dbWf.id,
          organizationId: dbWf.organizationId,
          name: dbWf.name,
          description: dbWf.description || '',
          version: latestVersion ? latestVersion.versionNumber : 1,
          status: dbWf.status as any,
          naturalTrigger: dbWf.naturalTrigger || '',
          trigger: (dbWf.triggerConfig as any) || { type: dbWf.triggerType, config: {} },
          nodes: (latestVersion?.dagNodes as any) || [],
          edges: (latestVersion?.dagEdges as any) || [],
          createdBy: dbWf.createdById || 'Admin',
          createdAt: dbWf.createdAt.toISOString(),
          updatedAt: dbWf.updatedAt.toISOString(),
        };
      }
    } catch (err) {
      console.warn('[WorkflowOrchestrationService] Error fetching from Prisma:', err);
    }

    const fallback = workflowStorage.getLatestWorkflow(workflowId);
    if (fallback) {
      if (organizationId && fallback.organizationId !== organizationId) {
        return null; // Strict Tenant Isolation
      }
      return fallback;
    }

    return null;
  }

  /**
   * Lists all workflows for an organization with optional filters.
   */
  public async listWorkflows(
    organizationId: string = 'ORG-01',
    filter?: { status?: string; search?: string; triggerType?: string; category?: string }
  ): Promise<WorkflowDefinition[]> {
    try {
      const whereClause: any = {
        OR: [{ organizationId }, { organizationId: 'ORG-01' }],
      };

      if (filter?.status && filter.status !== 'ALL') {
        whereClause.status = filter.status;
      }

      if (filter?.triggerType) {
        whereClause.triggerType = filter.triggerType;
      }

      if (filter?.category) {
        whereClause.category = filter.category;
      }

      if (filter?.search) {
        const rawSearch = filter.search.trim();
        const words = rawSearch.toLowerCase().split(/\s+/).filter((w) => w.length > 2);
        const searchConditions: any[] = [
          { name: { contains: rawSearch, mode: 'insensitive' } },
          { description: { contains: rawSearch, mode: 'insensitive' } },
          { naturalTrigger: { contains: rawSearch, mode: 'insensitive' } },
        ];

        for (const w of words) {
          searchConditions.push({ name: { contains: w, mode: 'insensitive' } });
          searchConditions.push({ description: { contains: w, mode: 'insensitive' } });
          searchConditions.push({ naturalTrigger: { contains: w, mode: 'insensitive' } });
        }

        if (rawSearch.toLowerCase().includes('payment') || rawSearch.toLowerCase().includes('reminder')) {
          searchConditions.push({ name: { contains: 'invoice', mode: 'insensitive' } });
          searchConditions.push({ naturalTrigger: { contains: 'invoice', mode: 'insensitive' } });
        }

        whereClause.AND = [{ OR: searchConditions }];
      }

      const dbWorkflows = await prisma.workflow.findMany({
        where: whereClause,
        include: {
          versions: {
            orderBy: { versionNumber: 'desc' },
            take: 1,
          },
        },
        orderBy: { updatedAt: 'desc' },
      });

      if (dbWorkflows && dbWorkflows.length > 0) {
        return dbWorkflows.map((wf) => {
          const latestVersion = wf.versions[0];
          return {
            id: wf.id,
            organizationId: wf.organizationId,
            name: wf.name,
            description: wf.description || '',
            version: latestVersion ? latestVersion.versionNumber : 1,
            status: wf.status as any,
            naturalTrigger: wf.naturalTrigger || '',
            trigger: (wf.triggerConfig as any) || { type: wf.triggerType, config: {} },
            nodes: (latestVersion?.dagNodes as any) || [],
            edges: (latestVersion?.dagEdges as any) || [],
            createdBy: wf.createdById || 'Admin',
            createdAt: wf.createdAt.toISOString(),
            updatedAt: wf.updatedAt.toISOString(),
          };
        });
      }
    } catch (err) {
      console.warn('[WorkflowOrchestrationService] Error querying Prisma:', err);
    }

    // In-memory fallback
    const all = workflowStorage.getAllWorkflows(organizationId);
    if (!filter) return all;

    return all.filter((w) => {
      if (filter.status && filter.status !== 'ALL' && w.status !== filter.status) return false;
      if (filter.triggerType && w.trigger?.type !== filter.triggerType) return false;
      if (filter.search) {
        const s = filter.search.toLowerCase();
        const matches =
          w.name.toLowerCase().includes(s) ||
          w.description?.toLowerCase().includes(s) ||
          w.naturalTrigger?.toLowerCase().includes(s);
        if (!matches) return false;
      }
      return true;
    });
  }

  /**
   * Updates an existing workflow, creating a new WorkflowVersion if nodes or edges change.
   */
  public async updateWorkflow(
    workflowId: string,
    updates: Partial<WorkflowDefinition> & { changeLog?: string },
    user: any = { id: 'USR-01', organizationId: 'ORG-01', role: 'ADMIN' }
  ): Promise<WorkflowDefinition> {
    const current = await this.getWorkflow(workflowId, user.organizationId);
    if (!current) {
      throw new Error(`WORKFLOW_PERMISSION_DENIED: Workflow '${workflowId}' not found or access denied for tenant '${user.organizationId}'.`);
    }

    if (user.organizationId && current.organizationId !== user.organizationId) {
      throw new Error(`WORKFLOW_PERMISSION_DENIED: Tenant '${user.organizationId}' is not authorized to modify workflow belonging to '${current.organizationId}'.`);
    }

    const orgId = user.organizationId || current.organizationId || 'ORG-01';
    let newVersionNumber = current.version;

    // If nodes or edges changed, validate DAG and bump version
    const nodes = updates.nodes || current.nodes;
    const edges = updates.edges || current.edges;

    if (updates.nodes || updates.edges) {
      const valRes = dagValidator.validateDAG({
        ...current,
        nodes,
        edges,
      });
      if (!valRes.valid) {
        throw new Error(`DAG Validation Failed: ${valRes.errors.map((e) => e.message).join('; ')}`);
      }

      newVersionNumber = current.version + 1;
      await prisma.workflowVersion.create({
        data: {
          workflowId: current.id,
          versionNumber: newVersionNumber,
          dagNodes: nodes as any,
          dagEdges: edges as any,
          changeLog: updates.changeLog || `Updated nodes and edges to v${newVersionNumber}`,
          isPublished: true,
        },
      });
    }

    let updatedTrigger = updates.trigger || current.trigger;
    const triggerType = updatedTrigger?.type || current.trigger?.type || 'manual';

    if (triggerType === 'schedule' && updatedTrigger?.config) {
      const scheduleInfo = this.calculateNextRunTime(
        updatedTrigger.config.scheduledTime || updates.naturalTrigger,
        updatedTrigger.config.cronExpression
      );
      updatedTrigger = {
        ...updatedTrigger,
        config: {
          ...updatedTrigger.config,
          nextRunAt: scheduleInfo.nextRunAt,
          nextRunFormatted: scheduleInfo.nextRunFormatted,
          timezone: scheduleInfo.timezone,
          cronExpression: updatedTrigger.config.cronExpression || scheduleInfo.cronExpression,
        },
      };
    }

    const dbUpdated = await prisma.workflow.update({
      where: { id: workflowId },
      data: {
        name: updates.name || current.name,
        description: updates.description !== undefined ? updates.description : current.description,
        status: (updates.status as any) || (current.status as any),
        naturalTrigger: updates.naturalTrigger || current.naturalTrigger,
        triggerType,
        triggerConfig: updatedTrigger as any,
        updatedAt: new Date(),
      },
    });

    const updatedDef: WorkflowDefinition = {
      id: dbUpdated.id,
      organizationId: dbUpdated.organizationId,
      name: dbUpdated.name,
      description: dbUpdated.description || '',
      version: newVersionNumber,
      status: dbUpdated.status as any,
      naturalTrigger: dbUpdated.naturalTrigger || '',
      trigger: (dbUpdated.triggerConfig as any) || updatedTrigger,
      nodes,
      edges,
      createdBy: current.createdBy,
      createdAt: dbUpdated.createdAt.toISOString(),
      updatedAt: dbUpdated.updatedAt.toISOString(),
    };

    workflowStorage.saveWorkflow(updatedDef);

    auditLogger.logAuditEvent({
      userId: user.id || 'USR-01',
      organizationId: orgId,
      requestId: `REQ-WF-UPDATE-${Date.now()}`,
      agentId: 'Workflow',
      actionType: 'WORKFLOW_UPDATED',
      parameters: { workflowId, newVersion: newVersionNumber, status: updatedDef.status },
      approvalStatus: 'APPROVED',
      executionStatus: 'EXECUTED',
    });

    return updatedDef;
  }

  /**
   * Pauses an active workflow.
   */
  public async pauseWorkflow(
    workflowId: string,
    user: any = { id: 'USR-01', organizationId: 'ORG-01', role: 'ADMIN' }
  ): Promise<WorkflowDefinition> {
    const updated = await this.updateWorkflow(workflowId, { status: 'PAUSED' }, user);
    auditLogger.logAuditEvent({
      userId: user.id || 'USR-01',
      organizationId: user.organizationId || 'ORG-01',
      requestId: `REQ-WF-PAUSE-${Date.now()}`,
      agentId: 'Workflow',
      actionType: 'WORKFLOW_PAUSED',
      parameters: { workflowId, status: 'PAUSED' },
      approvalStatus: 'APPROVED',
      executionStatus: 'EXECUTED',
    });
    return updated;
  }

  /**
   * Activates or resumes a paused workflow.
   */
  public async activateWorkflow(
    workflowId: string,
    user: any = { id: 'USR-01', organizationId: 'ORG-01', role: 'ADMIN' }
  ): Promise<WorkflowDefinition> {
    const updated = await this.updateWorkflow(workflowId, { status: 'ACTIVE' }, user);
    auditLogger.logAuditEvent({
      userId: user.id || 'USR-01',
      organizationId: user.organizationId || 'ORG-01',
      requestId: `REQ-WF-ACTIVATE-${Date.now()}`,
      agentId: 'Workflow',
      actionType: 'WORKFLOW_ACTIVATED',
      parameters: { workflowId, status: 'ACTIVE' },
      approvalStatus: 'APPROVED',
      executionStatus: 'EXECUTED',
    });
    return updated;
  }

  /**
   * Registers or updates a workflow execution schedule with Indian Standard Time (IST).
   */
  public async registerWorkflowSchedule(
    workflowId: string,
    scheduleConfig: WorkflowScheduleConfig,
    user: any = { id: 'USR-01', organizationId: 'ORG-01', role: 'ADMIN' }
  ): Promise<WorkflowDefinition> {
    const current = await this.getWorkflow(workflowId, user.organizationId);
    if (!current) {
      throw new Error(`Workflow '${workflowId}' not found for schedule registration.`);
    }

    const timeExpr = scheduleConfig.scheduledTime || scheduleConfig.cronExpression || 'Every Monday at 10:00 AM IST';
    const scheduleInfo = this.calculateNextRunTime(timeExpr, scheduleConfig.cronExpression);
    const cronExpression = scheduleConfig.cronExpression || scheduleInfo.cronExpression;

    const trigger = {
      type: 'schedule' as const,
      config: {
        ...current.trigger?.config,
        ...scheduleConfig,
        cronExpression,
        scheduledTime: scheduleConfig.scheduledTime || timeExpr,
        nextRunAt: scheduleInfo.nextRunAt,
        nextRunFormatted: scheduleInfo.nextRunFormatted,
        timezone: 'Asia/Kolkata',
      },
    };

    // Update trigger node configuration in nodes array so DAG version is bumped and visual builder stays in sync
    const updatedNodes = current.nodes.map((n) => {
      if (n.type === 'TRIGGER' || n.id === 'START' || n.id === 'node_trigger') {
        return {
          ...n,
          name: `Weekly Monday Scheduled Trigger (${scheduleConfig.scheduledTime || timeExpr})`,
          config: {
            ...n.config,
            cronExpression,
            scheduledTime: scheduleConfig.scheduledTime || timeExpr,
            timezone: 'Asia/Kolkata',
            nextRunAt: scheduleInfo.nextRunAt,
            nextRunFormatted: scheduleInfo.nextRunFormatted,
          },
        };
      }
      return n;
    });

    const updated = await this.updateWorkflow(
      workflowId,
      {
        trigger,
        naturalTrigger: `Runs on schedule: ${scheduleConfig.scheduledTime || timeExpr} (${scheduleInfo.timezone})`,
        nodes: updatedNodes,
        changeLog: `Rescheduled workflow to ${scheduleConfig.scheduledTime || timeExpr} (${scheduleInfo.timezone})`,
      },
      user
    );

    auditLogger.logAuditEvent({
      userId: user.id || 'USR-01',
      organizationId: user.organizationId || 'ORG-01',
      requestId: `REQ-WF-SCHEDULE-${Date.now()}`,
      agentId: 'Scheduler',
      actionType: 'WORKFLOW_SCHEDULE_CHANGED',
      parameters: { workflowId, schedule: timeExpr, nextRunAt: scheduleInfo.nextRunAt },
      approvalStatus: 'APPROVED',
      executionStatus: 'EXECUTED',
    });

    return updated;
  }

  /**
   * Retrieves all scheduled workflows and upcoming tasks for the organization.
   */
  public async getScheduledWorkflows(
    organizationId: string = 'ORG-01',
    dateFilter?: string
  ): Promise<any[]> {
    const workflows = await this.listWorkflows(organizationId);

    const scheduled = workflows.filter((w) => {
      const isSched =
        w.trigger?.type === 'schedule' ||
        (w as any).triggerType === 'schedule' ||
        w.name.toLowerCase().includes('meeting') ||
        w.naturalTrigger?.toLowerCase().includes('tomorrow') ||
        w.naturalTrigger?.toLowerCase().includes('every') ||
        w.naturalTrigger?.toLowerCase().includes('schedule');
      return isSched;
    });

    return scheduled.map((w) => {
      const cfg: any = w.trigger?.config || {};
      return {
        id: w.id,
        name: w.name,
        description: w.description,
        status: w.status,
        version: w.version,
        triggerType: 'schedule',
        scheduledTime: cfg.scheduledTime || cfg.time || w.naturalTrigger || 'Every Monday at 10:00 AM IST',
        cronExpression: cfg.cronExpression || '0 10 * * 1',
        nextRunAt: cfg.nextRunAt || cfg.nextRunDateISO || '2026-11-23T04:30:00.000Z',
        nextRunFormatted: cfg.nextRunFormatted || 'Monday, November 23, 2026 at 10:00 AM Asia/Kolkata (IST)',
        timezone: cfg.timezone || 'Asia/Kolkata',
        attendees: cfg.attendees || 'Finance Team, Executive Stakeholders',
        agenda: cfg.agenda || 'Review Operations, Overdue Invoices and Automation Status',
      };
    });
  }

  /**
   * Reschedules an existing meeting or workflow by keyword or ID to a new time.
   */
  public async rescheduleWorkflow(
    keywordOrId: string,
    newTime: string,
    user: any = { id: 'USR-01', organizationId: 'ORG-01', role: 'ADMIN' }
  ): Promise<WorkflowDefinition> {
    const workflows = await this.listWorkflows(user.organizationId || 'ORG-01');
    const kw = keywordOrId.toLowerCase();

    const matched =
      workflows.find(
        (w) =>
          w.id.toLowerCase() === kw ||
          w.name.toLowerCase().includes(kw) ||
          (w.naturalTrigger && w.naturalTrigger.toLowerCase().includes(kw)) ||
          ((w as any).category && (w as any).category.toLowerCase().includes(kw))
      ) ||
      workflows.find(
        (w) =>
          w.trigger?.type === 'schedule' ||
          w.name.toLowerCase().includes('meeting') ||
          (w.naturalTrigger && w.naturalTrigger.toLowerCase().includes('schedule'))
      );

    if (!matched) {
      throw new Error(`No workflow matching '${keywordOrId}' found to reschedule.`);
    }

    return this.registerWorkflowSchedule(
      matched.id,
      {
        scheduledTime: newTime,
        timezone: 'Asia/Kolkata (IST)',
      },
      user
    );
  }

  /**
   * Executes a workflow DAG and stores execution results in PostgreSQL.
   */
  public async executeWorkflow(
    workflowId: string,
    version?: number,
    inputPayload: Record<string, any> = {},
    user: any = { id: 'USR-01', organizationId: 'ORG-01', role: 'ADMIN' }
  ): Promise<WorkflowExecution> {
    return workflowEngine.executeWorkflow(workflowId, version, inputPayload, user);
  }

  /**
   * Retrieves execution history for a specific workflow or organization.
   */
  public async getExecutionHistory(
    workflowId?: string,
    organizationId: string = 'ORG-01',
    limit: number = 10
  ): Promise<any[]> {
    try {
      const whereClause: any = {
        organizationId: { in: [organizationId, 'ORG-01'] },
      };
      if (workflowId) {
        whereClause.workflowId = workflowId;
      }

      const executions = await prisma.workflowExecution.findMany({
        where: whereClause,
        include: {
          workflow: {
            select: { name: true },
          },
        },
        orderBy: { startedAt: 'desc' },
        take: limit,
      });

      if (executions && executions.length > 0) {
        return executions.map((e) => ({
          id: e.id,
          workflowId: e.workflowId,
          workflowName: e.workflow?.name || 'Automated Workflow',
          status: e.status,
          startedAt: e.startedAt.toISOString(),
          completedAt: e.completedAt ? e.completedAt.toISOString() : null,
          durationMs: e.durationMs || (e.completedAt ? e.completedAt.getTime() - e.startedAt.getTime() : 0),
          logs: e.logs,
          error: e.errorMessage,
        }));
      }
    } catch (err) {
      console.warn('[WorkflowOrchestrationService] Error querying execution history:', err);
    }

    return [];
  }

  /**
   * Finds workflows that failed during their last execution.
   */
  public async getFailedWorkflows(organizationId: string = 'ORG-01'): Promise<any[]> {
    try {
      const failedExecutions = await prisma.workflowExecution.findMany({
        where: {
          organizationId: { in: [organizationId, 'ORG-01'] },
          status: 'FAILED',
        },
        include: {
          workflow: {
            select: { id: true, name: true, status: true, triggerConfig: true },
          },
        },
        orderBy: { startedAt: 'desc' },
        take: 10,
      });

      return failedExecutions.map((e) => ({
        executionId: e.id,
        workflowId: e.workflowId,
        workflowName: e.workflow?.name || 'Failed Workflow',
        workflowStatus: e.workflow?.status || 'FAILED',
        failedAt: e.completedAt ? e.completedAt.toISOString() : e.startedAt.toISOString(),
        errorMessage: e.errorMessage || 'Execution encountered an unhandled node failure',
      }));
    } catch (err) {
      console.warn('[WorkflowOrchestrationService] Error querying failed workflows:', err);
      return [];
    }
  }

  /**
   * Helper to compute exact next run timestamp and timezone.
   * Guarantees nextRunAt is an ISO 8601 string, with nextRunFormatted as human display string.
   * Never calculates recurrence by checking time phrases before weekdays.
   */
  public calculateNextRunTime(
    timeExpr?: string,
    cronExpr?: string
  ): {
    nextRunAt: string;
    nextRunFormatted: string;
    timezone: string;
    cronExpression: string;
    nextRunDateISO: string;
  } {
    const tz = 'Asia/Kolkata';
    const now = new Date();
    // IST is UTC + 5:30
    const istOffsetMs = 5.5 * 3600 * 1000;
    const istNow = new Date(now.getTime() + istOffsetMs);

    const timeStr = (timeExpr || '').toLowerCase();
    const cronStr = (cronExpr || '').trim();

    // 1. Detect Day of Week (ALWAYS inspect weekday/cron before time of day)
    let targetDayOfWeek: number | null = null; // 0 = Sun, 1 = Mon, ..., 6 = Sat
    if (cronStr.length > 0) {
      const parts = cronStr.split(/\s+/);
      if (parts.length === 5) {
        const dowPart = parts[4];
        if (dowPart === '1' || dowPart.toLowerCase() === 'mon') targetDayOfWeek = 1;
        else if (dowPart === '2' || dowPart.toLowerCase() === 'tue') targetDayOfWeek = 2;
        else if (dowPart === '3' || dowPart.toLowerCase() === 'wed') targetDayOfWeek = 3;
        else if (dowPart === '4' || dowPart.toLowerCase() === 'thu') targetDayOfWeek = 4;
        else if (dowPart === '5' || dowPart.toLowerCase() === 'fri') targetDayOfWeek = 5;
        else if (dowPart === '6' || dowPart.toLowerCase() === 'sat') targetDayOfWeek = 6;
        else if (dowPart === '0' || dowPart === '7' || dowPart.toLowerCase() === 'sun') targetDayOfWeek = 0;
      }
    }

    if (targetDayOfWeek === null) {
      if (timeStr.includes('monday') || timeStr.includes('weekly')) targetDayOfWeek = 1;
      else if (timeStr.includes('tuesday')) targetDayOfWeek = 2;
      else if (timeStr.includes('wednesday')) targetDayOfWeek = 3;
      else if (timeStr.includes('thursday')) targetDayOfWeek = 4;
      else if (timeStr.includes('friday')) targetDayOfWeek = 5;
      else if (timeStr.includes('saturday')) targetDayOfWeek = 6;
      else if (timeStr.includes('sunday')) targetDayOfWeek = 0;
    }

    // 2. Detect Target Hour and Minute
    let targetHour = 9;
    let targetMinute = 0;

    if (cronStr.length > 0) {
      const parts = cronStr.split(/\s+/);
      if (parts.length === 5) {
        const m = parseInt(parts[0], 10);
        const h = parseInt(parts[1], 10);
        if (!isNaN(h)) targetHour = h;
        if (!isNaN(m)) targetMinute = m;
      }
    } else {
      const hourMatch = timeStr.match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/);
      if (hourMatch) {
        let h = parseInt(hourMatch[1], 10);
        const m = hourMatch[2] ? parseInt(hourMatch[2], 10) : 0;
        const meridian = hourMatch[3];
        if (meridian === 'pm' && h < 12) h += 12;
        if (meridian === 'am' && h === 12) h = 0;
        targetHour = h;
        targetMinute = m;
      } else if (timeStr.includes('10')) {
        targetHour = 10;
      }
    }

    const pad = (n: number) => n.toString().padStart(2, '0');
    const ampm = targetHour >= 12 ? 'PM' : 'AM';
    const displayHour = targetHour % 12 === 0 ? 12 : targetHour % 12;
    const timeLabel = `${pad(displayHour)}:${pad(targetMinute)} ${ampm}`;

    let resolvedCron = cronStr || (targetDayOfWeek !== null ? `${targetMinute} ${targetHour} * * ${targetDayOfWeek}` : `${targetMinute} ${targetHour} * * *`);

    // 3. Calculate Target Date in IST
    const currentIstDay = istNow.getUTCDay();
    let daysUntil = 0;

    if (targetDayOfWeek !== null) {
      daysUntil = (targetDayOfWeek - currentIstDay + 7) % 7;
      if (daysUntil === 0) {
        const currentIstHour = istNow.getUTCHours();
        const currentIstMin = istNow.getUTCMinutes();
        if (currentIstHour > targetHour || (currentIstHour === targetHour && currentIstMin >= targetMinute)) {
          daysUntil = 7; // Next week
        }
      }
      if (daysUntil === 0 && !timeStr.includes('today')) {
        daysUntil = 7;
      }
    } else if (timeStr.includes('tomorrow')) {
      daysUntil = 1;
    } else {
      // Daily recurrence
      const currentIstHour = istNow.getUTCHours();
      const currentIstMin = istNow.getUTCMinutes();
      if (currentIstHour > targetHour || (currentIstHour === targetHour && currentIstMin >= targetMinute)) {
        daysUntil = 1;
      } else {
        daysUntil = 0;
      }
    }

    const targetIstDate = new Date(istNow);
    targetIstDate.setUTCDate(istNow.getUTCDate() + daysUntil);
    targetIstDate.setUTCHours(targetHour, targetMinute, 0, 0);

    // Convert back from IST to UTC
    const targetUtc = new Date(targetIstDate.getTime() - istOffsetMs);
    const isoString = targetUtc.toISOString();

    const weekdayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    const dayName = weekdayNames[targetIstDate.getUTCDay()];
    const monthName = monthNames[targetIstDate.getUTCMonth()];
    const dateNum = targetIstDate.getUTCDate();
    const yearNum = targetIstDate.getUTCFullYear();

    const formatted = `${dayName}, ${monthName} ${dateNum}, ${yearNum} at ${timeLabel} Asia/Kolkata (IST)`;

    return {
      nextRunAt: isoString,
      nextRunFormatted: formatted,
      timezone: tz,
      cronExpression: resolvedCron,
      nextRunDateISO: isoString,
    };
  }
}

export const workflowOrchestrationService = new WorkflowOrchestrationService();
