import { ChatMessage, AgentType } from '@/types';
import { memoryService, RetrievedMemory } from '@/lib/services/memoryService';

export interface MemoryWindowOptions {
  maxTurns?: number;
  preserveSystemInitial?: boolean;
}

export const conversationMemory = {
  /**
   * Tier A: Short-term conversation sliding window
   */
  getOptimizedContext(
    messages: ChatMessage[],
    options: MemoryWindowOptions = { maxTurns: 10, preserveSystemInitial: true }
  ): ChatMessage[] {
    if (!messages || messages.length === 0) return [];

    const maxTurns = options.maxTurns || 10;

    // Always preserve system initialization messages if requested
    const initialSystemMsgs = options.preserveSystemInitial
      ? messages.filter((m) => m.sender === 'SYSTEM' || (m.id === 'MSG-01' || m.id === 'MSG-02'))
      : [];

    // Filter non-system conversation turns
    const conversationTurns = messages.filter((m) => m.sender === 'USER' || m.sender === 'AGENT');

    // Take sliding window of recent maxTurns
    const recentTurns = conversationTurns.slice(-maxTurns);

    // Merge system messages with recent turns, deduplicating IDs
    const mergedMap = new Map<string, ChatMessage>();
    initialSystemMsgs.forEach((m) => mergedMap.set(m.id, m));
    recentTurns.forEach((m) => mergedMap.set(m.id, m));

    return Array.from(mergedMap.values());
  },

  /**
   * Extracts action parameters from recent cards
   */
  extractRelevantEntityContext(messages: ChatMessage[]): Record<string, any> {
    const contextMap: Record<string, any> = {};

    messages.forEach((msg) => {
      if (msg.actionCard && msg.actionCard.details) {
        Object.assign(contextMap, msg.actionCard.details);
      }
    });

    return contextMap;
  },

  /**
   * Tier B & C: Extract declarative facts from conversation and persist into Long-Term Memory
   */
  async extractAndPersistMemory(
    userId: string,
    organizationId: string,
    userMessage: string,
    agentResponse?: string
  ): Promise<boolean> {
    return memoryService.extractAndSaveMemory(userId, organizationId, userMessage, agentResponse);
  },

  /**
   * Retrieves relevant long-term user memories and organizational context
   */
  async getRelevantMemoryContext(
    userId: string,
    organizationId: string,
    query: string
  ): Promise<string> {
    const memories = await memoryService.retrieveRelevantMemories(userId, organizationId, query, 4);
    return memoryService.buildMemoryContext(memories);
  },

  /**
   * Get raw retrieved memory items
   */
  async getMemories(
    userId: string,
    organizationId: string,
    query: string
  ): Promise<RetrievedMemory[]> {
    return memoryService.retrieveRelevantMemories(userId, organizationId, query, 6);
  },
};
