import { prisma } from '@/lib/prisma';
import { workflowStorage } from '@/lib/workflow/workflowStorage';
import { workflowOrchestrationService } from '@/lib/workflows/workflowOrchestrationService';
import { WorkflowDefinition, WorkflowExecution } from '@/types/workflowDSL';

export const workflowService = {
  async getAllWorkflows(organizationId: string = 'ORG-01'): Promise<WorkflowDefinition[]> {
    return workflowOrchestrationService.listWorkflows(organizationId);
  },

  async getWorkflowById(workflowId: string): Promise<WorkflowDefinition | undefined> {
    const wf = await workflowOrchestrationService.getWorkflow(workflowId);
    return wf || undefined;
  },

  async saveWorkflow(wfData: WorkflowDefinition, user?: any): Promise<WorkflowDefinition> {
    const existing = await workflowOrchestrationService.getWorkflow(wfData.id, wfData.organizationId);
    if (existing) {
      return workflowOrchestrationService.updateWorkflow(
        wfData.id,
        {
          name: wfData.name,
          description: wfData.description,
          status: wfData.status,
          naturalTrigger: wfData.naturalTrigger,
          trigger: wfData.trigger,
          nodes: wfData.nodes,
          edges: wfData.edges,
        },
        user || { id: wfData.createdBy || 'Admin', organizationId: wfData.organizationId || 'ORG-01' }
      );
    }

    return workflowOrchestrationService.createWorkflow(
      {
        id: wfData.id,
        name: wfData.name,
        description: wfData.description,
        naturalTrigger: wfData.naturalTrigger,
        trigger: wfData.trigger,
        triggerType: wfData.trigger?.type || 'manual',
        status: wfData.status,
        nodes: wfData.nodes || [],
        edges: wfData.edges || [],
      },
      user || { id: wfData.createdBy || 'Admin', organizationId: wfData.organizationId || 'ORG-01' }
    );
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
