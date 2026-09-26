import { ChatMessage, AgentType } from '@/types';

export interface MemoryWindowOptions {
  maxTurns?: number;
  preserveSystemInitial?: boolean;
}

export const conversationMemory = {
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

  extractRelevantEntityContext(messages: ChatMessage[]): Record<string, any> {
    const contextMap: Record<string, any> = {};

    messages.forEach((msg) => {
      if (msg.actionCard && msg.actionCard.details) {
        Object.assign(contextMap, msg.actionCard.details);
      }
    });

    return contextMap;
  },
};
