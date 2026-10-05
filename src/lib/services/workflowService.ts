import { prisma } from '@/lib/prisma';
import { workflowStorage } from '@/lib/workflow/workflowStorage';
import { WorkflowDefinition, WorkflowExecution } from '@/types/workflowDSL';

export const workflowService = {
  async getAllWorkflows(organizationId: string = 'ORG-01'): Promise<WorkflowDefinition[]> {
    try {
      const workflows = await prisma.workflow.findMany({
        where: {
          OR: [{ organizationId }, { organizationId: 'ORG-01' }],
        },
        include: {
          versions: {
            orderBy: { versionNumber: 'desc' },
            take: 1,
          },
        },
        orderBy: { updatedAt: 'desc' },
      });

      if (workflows && workflows.length > 0) {
        return workflows.map((wf: any) => {
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
      console.warn('[workflowService] Prisma query failed, using in-memory workflow storage:', err);
    }

    return workflowStorage.getAllWorkflows(organizationId);
  },

  async getWorkflowById(workflowId: string): Promise<WorkflowDefinition | undefined> {
    try {
      const wf = await prisma.workflow.findUnique({
        where: { id: workflowId },
        include: {
          versions: {
            orderBy: { versionNumber: 'desc' },
            take: 1,
          },
        },
      });

      if (wf) {
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
      }
    } catch (err) {
      console.warn('[workflowService] Prisma fetch workflow failed, falling back:', err);
    }

    return workflowStorage.getLatestWorkflow(workflowId);
  },

  async saveWorkflow(wfData: WorkflowDefinition): Promise<WorkflowDefinition> {
    try {
      const orgId = wfData.organizationId || 'ORG-01';

      const dbWf = await prisma.workflow.upsert({
        where: { id: wfData.id },
        update: {
          name: wfData.name,
          description: wfData.description,
          naturalTrigger: wfData.naturalTrigger,
          triggerType: wfData.trigger?.type || 'manual',
          triggerConfig: wfData.trigger as any,
          status: (wfData.status as any) || 'ACTIVE',
        },
        create: {
          id: wfData.id,
          organizationId: orgId,
          name: wfData.name,
          description: wfData.description,
          naturalTrigger: wfData.naturalTrigger,
          triggerType: wfData.trigger?.type || 'manual',
          triggerConfig: wfData.trigger as any,
          status: (wfData.status as any) || 'ACTIVE',
          isTemplate: false,
        },
      });

      await prisma.workflowVersion.upsert({
        where: {
          workflowId_versionNumber: {
            workflowId: dbWf.id,
            versionNumber: wfData.version || 1,
          },
        },
        update: {
          dagNodes: wfData.nodes as any,
          dagEdges: wfData.edges as any,
        },
        create: {
          workflowId: dbWf.id,
          versionNumber: wfData.version || 1,
          dagNodes: wfData.nodes as any,
          dagEdges: wfData.edges as any,
          isPublished: true,
        },
      });
    } catch (err) {
      console.warn('[workflowService] Prisma save workflow error, saving to workflowStorage:', err);
    }

    return workflowStorage.saveWorkflow(wfData);
  },

  async saveExecution(execution: WorkflowExecution): Promise<WorkflowExecution> {
    try {
      const orgId = execution.organizationId || 'ORG-01';

      await prisma.workflowExecution.upsert({
        where: { id: execution.id },
        update: {
          status: execution.status as any,
          completedAt: execution.completedAt ? new Date(execution.completedAt) : null,
          inputPayload: execution.triggerPayload as any,
          outputResult: execution.nodeOutputs as any,
          logs: execution.logs as any,
          errorMessage: execution.error,
        },
        create: {
          id: execution.id,
          organizationId: orgId,
          workflowId: execution.workflowId,
          triggerSource: 'MANUAL',
          status: execution.status as any,
          startedAt: new Date(execution.startedAt),
          completedAt: execution.completedAt ? new Date(execution.completedAt) : null,
          inputPayload: execution.triggerPayload as any,
          outputResult: execution.nodeOutputs as any,
          logs: execution.logs as any,
          errorMessage: execution.error,
        },
      });
    } catch (err) {
      console.warn('[workflowService] Prisma save execution error, saving to memory:', err);
    }

    return workflowStorage.saveExecution(execution);
  },

  async getExecution(executionId: string): Promise<WorkflowExecution | undefined> {
    try {
      const exec = await prisma.workflowExecution.findUnique({
        where: { id: executionId },
      });

      if (exec) {
        return {
          id: exec.id,
          workflowId: exec.workflowId,
          workflowVersion: 1,
          organizationId: exec.organizationId,
          status: exec.status as any,
          triggerPayload: (exec.inputPayload as any) || {},
          nodeRecords: {},
          nodeOutputs: (exec.outputResult as any) || {},
          logs: (exec.logs as any) || [],
          error: exec.errorMessage || undefined,
          startedAt: exec.startedAt.toISOString(),
          completedAt: exec.completedAt ? exec.completedAt.toISOString() : undefined,
        };
      }
    } catch (err) {
      console.warn('[workflowService] Prisma get execution error:', err);
    }

    return workflowStorage.getExecution(executionId);
  },
};
