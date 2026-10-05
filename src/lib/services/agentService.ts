import { prisma } from '@/lib/prisma';
import { MOCK_AGENTS } from '@/lib/mockData';

export interface RecordAgentTaskInput {
  organizationId?: string;
  agentId: string;
  executionId?: string;
  nodeId?: string;
  prompt: string;
  originalPrompt?: string;
  inputLanguage?: string;
  outputLanguage?: string;
  response?: string;
  status?: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED';
  durationMs?: number;
  metadata?: Record<string, any>;
}

export const agentService = {
  async getAgents(organizationId: string = 'ORG-01') {
    try {
      const agents = await prisma.agent.findMany({
        where: {
          OR: [{ organizationId }, { organizationId: 'ORG-01' }],
        },
      });
      if (agents && agents.length > 0) return agents;
    } catch (err) {
      console.warn('[agentService] Prisma get agents failed, returning defaults:', err);
    }
    return MOCK_AGENTS;
  },

  async recordAgentTask(data: RecordAgentTaskInput) {
    const orgId = data.organizationId || 'ORG-01';
    try {
      const task = await prisma.agentTask.create({
        data: {
          organizationId: orgId,
          agentId: data.agentId,
          executionId: data.executionId,
          nodeId: data.nodeId,
          prompt: data.prompt,
          originalPrompt: data.originalPrompt || data.prompt,
          inputLanguage: data.inputLanguage || 'en',
          outputLanguage: data.outputLanguage || 'en',
          response: data.response,
          status: data.status || 'COMPLETED',
          durationMs: data.durationMs,
          metadata: data.metadata as any,
        },
      });

      // Increment completed tasks count for agent
      await prisma.agent.update({
        where: { id: data.agentId },
        data: { tasksCompleted: { increment: 1 } },
      }).catch(() => {});

      return task;
    } catch (err) {
      console.warn('[agentService] Record agent task failed:', err);
      return null;
    }
  },

  async getAgentTasks(organizationId: string = 'ORG-01', agentId?: string) {
    try {
      return await prisma.agentTask.findMany({
        where: {
          organizationId,
          ...(agentId ? { agentId } : {}),
        },
        orderBy: { createdAt: 'desc' },
        take: 50,
      });
    } catch (err) {
      console.warn('[agentService] Get agent tasks failed:', err);
      return [];
    }
  },
};
