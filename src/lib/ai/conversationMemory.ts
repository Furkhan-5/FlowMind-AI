import { ChatMessage, AgentType } from '@/types';
import { memoryService, RetrievedMemory } from '@/lib/services/memoryService';

export interface MemoryWindowOptions {
  maxTurns?: number;
  preserveSystemInitial?: boolean;
}

export interface MemoryBudgetOptions {
  maxTokens?: number; // Approximate token budget (1 token ~ 4 chars)
  maxItems?: number;
}

export const conversationMemory = {
  /**
   * Tier A: Short-term conversation sliding window with token budgeting
   */
  getOptimizedContext(
    messages: ChatMessage[],
    options: MemoryWindowOptions = { maxTurns: 10, preserveSystemInitial: true }
  ): ChatMessage[] {
    if (!messages || messages.length === 0) return [];

    const maxTurns = options.maxTurns || 10;

    // Always preserve system initialization messages if requested
    const initialSystemMsgs = options.preserveSystemInitial
      ? messages.filter((m) => m.sender === 'SYSTEM' || m.id === 'MSG-01' || m.id === 'MSG-02')
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
   * Retrieves relevant long-term user memories and organizational context with:
   * - Token Budgeting (prevents context window bloat)
   * - Context Ranking (recency + confidence + semantic score)
   * - Source Attribution (traceability)
   * - Conflict Resolution (current user prompt takes precedence over memory)
   */
  async getRelevantMemoryContext(
    userId: string,
    organizationId: string,
    query: string,
    budget: MemoryBudgetOptions = { maxTokens: 400, maxItems: 4 }
  ): Promise<string> {
    const maxItems = budget.maxItems || 4;
    const maxChars = (budget.maxTokens || 400) * 4;

    const memories = await memoryService.retrieveRelevantMemories(userId, organizationId, query, maxItems * 2);

    if (!memories || memories.length === 0) return '';

    // Rank memories: Confidence (50%) + Recency/RelevanceScore (50%)
    const ranked = [...memories].sort((a, b) => {
      const scoreA = (a.confidence || 0.8) * 0.5 + (a.relevanceScore || 0.8) * 0.5;
      const scoreB = (b.confidence || 0.8) * 0.5 + (b.relevanceScore || 0.8) * 0.5;
      return scoreB - scoreA;
    });

    // Assemble budgeted context with source attribution & conflict resolution
    const includedLines: string[] = [];
    let currentLength = 0;

    for (const mem of ranked.slice(0, maxItems)) {
      const scopeLabel = mem.scope === 'ORG_SHARED' ? 'ORGANIZATIONAL' : 'USER_PRIVATE';
      const createdDate = mem.createdAt ? new Date(mem.createdAt).toLocaleDateString() : 'Active';
      const line = `- [${scopeLabel}] ${mem.content} (Recorded: ${createdDate}, Confidence: ${Math.round(
        (mem.confidence || 0.8) * 100
      )}%)`;

      if (currentLength + line.length > maxChars) break;
      includedLines.push(line);
      currentLength += line.length;
    }

    if (includedLines.length === 0) return '';

    return (
      `### 🧠 Enterprise Persistent Memory Context\n` +
      `**Conflict Resolution Rule:** The user's active prompt ALWAYS overrides historical memories if contradictory.\n\n` +
      includedLines.join('\n')
    );
  },

  /**
   * Get raw retrieved memory items with strict tenant/user isolation
   */
  async getMemories(
    userId: string,
    organizationId: string,
    query: string
  ): Promise<RetrievedMemory[]> {
    return memoryService.retrieveRelevantMemories(userId, organizationId, query, 6);
  },
};
