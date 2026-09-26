import { AgentType } from '@/types';
import { AgentHandoff } from '@/types/universalAgent';

export interface TaskMemoryState {
  currentAgent: AgentType;
  intentAction?: string;
  targetEntity?: string;
  parameters: Record<string, any>;
  missingFields: string[];
  pendingApprovalCardId?: string;
  handoffHistory: AgentHandoff[];
  lastUpdated: string;
}

export class TaskMemoryService {
  private activeContexts: Map<string, TaskMemoryState> = new Map();

  public getTaskMemory(userId: string): TaskMemoryState {
    if (!this.activeContexts.has(userId)) {
      this.activeContexts.set(userId, {
        currentAgent: 'CEO',
        parameters: {},
        missingFields: [],
        handoffHistory: [],
        lastUpdated: new Date().toISOString(),
      });
    }
    return this.activeContexts.get(userId)!;
  }

  public updateTaskMemory(userId: string, partial: Partial<TaskMemoryState>): TaskMemoryState {
    const existing = this.getTaskMemory(userId);
    const updated: TaskMemoryState = {
      ...existing,
      ...partial,
      parameters: {
        ...existing.parameters,
        ...(partial.parameters || {}),
      },
      lastUpdated: new Date().toISOString(),
    };
    this.activeContexts.set(userId, updated);
    return updated;
  }

  public setMissingFields(userId: string, missing: string[]): void {
    const mem = this.getTaskMemory(userId);
    mem.missingFields = missing;
    this.activeContexts.set(userId, mem);
  }

  public addHandoff(userId: string, handoff: AgentHandoff): void {
    const mem = this.getTaskMemory(userId);
    mem.handoffHistory.push(handoff);
    mem.currentAgent = handoff.targetAgent;
    this.activeContexts.set(userId, mem);
  }

  public clearTaskMemory(userId: string): void {
    this.activeContexts.delete(userId);
  }
}

export const taskMemory = new TaskMemoryService();
