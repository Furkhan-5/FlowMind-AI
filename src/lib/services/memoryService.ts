import { prisma } from '@/lib/prisma';

export interface MemoryEntry {
  id?: string;
  key: string;
  content: string;
  scope: 'PRIVATE' | 'ORG_SHARED';
  confidence?: number;
  tags?: string[];
  source?: string;
}

export interface RetrievedMemory {
  id: string;
  key: string;
  content: string;
  scope: string;
  confidence: number;
  relevanceScore: number;
  createdAt: Date;
  updatedAt: Date;
}

// In-memory fallback cache for when database connection is unavailable
const fallbackMemoryStore: Array<{
  id: string;
  organizationId: string;
  userId: string;
  memoryKey: string;
  content: string;
  source: string;
  scope: string;
  confidence: number;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}> = [
  {
    id: 'MEM-SEED-01',
    organizationId: 'ORG-01',
    userId: 'USR-01',
    memoryKey: 'crm_lead_management',
    content: 'Our sales team uses CRM for lead management.',
    source: 'CONVERSATION',
    scope: 'ORG_SHARED',
    confidence: 0.95,
    tags: ['sales', 'crm', 'lead'],
    createdAt: new Date(Date.now() - 86400000 * 2),
    updatedAt: new Date(Date.now() - 86400000 * 2),
  },
  {
    id: 'MEM-SEED-02',
    organizationId: 'ORG-01',
    userId: 'USR-01',
    memoryKey: 'finance_gst_policy',
    content: 'Standard GST rate applied across all B2B Indian invoices is 18%.',
    source: 'SYSTEM',
    scope: 'ORG_SHARED',
    confidence: 0.98,
    tags: ['finance', 'gst', 'tax'],
    createdAt: new Date(Date.now() - 86400000 * 3),
    updatedAt: new Date(Date.now() - 86400000 * 3),
  },
];

export class MemoryService {
  /**
   * Extract and save useful memories from a conversation exchange.
   * Scans for declarative facts, preferences, business tools, or explicit remember requests.
   */
  async extractAndSaveMemory(
    userId: string,
    organizationId: string,
    userMessage: string,
    _agentResponse?: string
  ): Promise<boolean> {
    const lowerMsg = userMessage.toLowerCase().trim();

    // Pattern definitions for high-signal enterprise facts
    const rememberPatterns = [
      /remember\s+(?:that\s+)?(.{5,250})/i,
      /note\s+(?:that\s+)?(.{5,250})/i,
      /keep\s+in\s+mind\s+(?:that\s+)?(.{5,250})/i,
      /our\s+(\w+)\s+(uses?|is|are|runs\s+on)\s+(.{3,150})/i,
      /we\s+(?:always\s+)?use\s+(.{3,150})/i,
      /(?:my|our)\s+preference\s+is\s+(.{5,150})/i,
    ];

    let extractedFact: string | null = null;
    for (const pattern of rememberPatterns) {
      const match = userMessage.match(pattern);
      if (match) {
        extractedFact = userMessage; // save entire statement for context grounding
        break;
      }
    }

    if (!extractedFact) return false;

    const key = this.generateMemoryKey(userMessage);
    const isOrgShared =
      lowerMsg.includes('our ') ||
      lowerMsg.includes('company') ||
      lowerMsg.includes('team') ||
      lowerMsg.includes('we ');

    await this.saveUserMemory(userId, organizationId, {
      key,
      content: userMessage.trim(),
      scope: isOrgShared ? 'ORG_SHARED' : 'PRIVATE',
      confidence: 0.9,
      source: 'CONVERSATION',
      tags: this.extractTags(userMessage),
    });

    return true;
  }

  private generateMemoryKey(content: string): string {
    const words = content
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .split(/\s+/)
      .filter((w) => !['remember', 'that', 'our', 'the', 'is', 'for', 'to', 'in', 'we'].includes(w))
      .slice(0, 5);

    return words.join('_').substring(0, 50) || `mem_${Date.now()}`;
  }

  private extractTags(content: string): string[] {
    const tagKeywords = ['crm', 'sales', 'lead', 'finance', 'invoice', 'gst', 'hr', 'employee', 'leave', 'inventory', 'product', 'support', 'ticket', 'workflow'];
    const lower = content.toLowerCase();
    return tagKeywords.filter((tag) => lower.includes(tag));
  }

  async saveUserMemory(
    userId: string,
    organizationId: string,
    entry: MemoryEntry
  ): Promise<RetrievedMemory> {
    const memId = entry.id || `MEM-${userId.substring(0, 6)}-${entry.key}`.substring(0, 36);

    // Update in-memory fallback cache first
    const existingIdx = fallbackMemoryStore.findIndex(
      (m) => m.organizationId === organizationId && (m.id === memId || (m.userId === userId && m.memoryKey === entry.key))
    );

    const record = {
      id: memId,
      organizationId,
      userId,
      memoryKey: entry.key,
      content: entry.content,
      source: entry.source || 'CONVERSATION',
      scope: entry.scope || 'PRIVATE',
      confidence: entry.confidence ?? 0.85,
      tags: entry.tags || [],
      createdAt: existingIdx >= 0 ? fallbackMemoryStore[existingIdx].createdAt : new Date(),
      updatedAt: new Date(),
    };

    if (existingIdx >= 0) {
      fallbackMemoryStore[existingIdx] = record;
    } else {
      fallbackMemoryStore.unshift(record);
    }

    // Persist to PostgreSQL via Prisma if available
    try {
      await prisma.userMemory.upsert({
        where: { id: memId },
        update: {
          content: entry.content,
          confidence: entry.confidence ?? 0.85,
          tags: entry.tags || [],
          updatedAt: new Date(),
        },
        create: {
          id: memId,
          organizationId,
          userId,
          memoryKey: entry.key,
          content: entry.content,
          source: entry.source || 'CONVERSATION',
          scope: entry.scope || 'PRIVATE',
          confidence: entry.confidence ?? 0.85,
          tags: entry.tags || [],
        },
      });
    } catch {
      // Prisma error handled gracefully via fallbackMemoryStore
    }

    return {
      id: record.id,
      key: record.memoryKey,
      content: record.content,
      scope: record.scope,
      confidence: record.confidence,
      relevanceScore: 1.0,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    };
  }

  async retrieveRelevantMemories(
    userId: string,
    organizationId: string,
    query: string,
    limit: number = 8
  ): Promise<RetrievedMemory[]> {
    const queryTerms = query
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .split(/\s+/)
      .filter((w) => w.length > 2);

    let candidates: Array<{
      id: string;
      memoryKey: string;
      content: string;
      scope: string;
      confidence: number;
      createdAt: Date;
      updatedAt: Date;
    }> = [];

    // Attempt PostgreSQL query first
    try {
      const dbMemories = await prisma.userMemory.findMany({
        where: {
          organizationId,
          OR: [
            { userId, scope: 'PRIVATE' },
            { scope: 'ORG_SHARED' },
          ],
        },
        orderBy: [{ confidence: 'desc' }, { updatedAt: 'desc' }],
        take: 50,
      });

      if (dbMemories && dbMemories.length > 0) {
        candidates = dbMemories.map((m) => ({
          id: m.id,
          memoryKey: m.memoryKey,
          content: m.content,
          scope: m.scope,
          confidence: m.confidence,
          createdAt: m.createdAt,
          updatedAt: m.updatedAt,
        }));
      }
    } catch {
      // Ignore DB error, will use fallback store
    }

    // Merge with fallback in-memory cache
    const fallbackAuthorized = fallbackMemoryStore.filter(
      (m) =>
        m.organizationId === organizationId &&
        (m.scope === 'ORG_SHARED' || m.userId === userId)
    );

    const mergedMap = new Map<string, any>();
    candidates.forEach((c) => mergedMap.set(c.id, c));
    fallbackAuthorized.forEach((f) => {
      if (!mergedMap.has(f.id)) mergedMap.set(f.id, f);
    });

    const pool = Array.from(mergedMap.values());

    // Score candidates based on term overlap and recency
    const scored = pool.map((mem) => {
      const contentLower = mem.content.toLowerCase();
      let keywordHits = 0;

      queryTerms.forEach((term) => {
        if (contentLower.includes(term)) keywordHits++;
      });

      const termMatchRatio = queryTerms.length > 0 ? keywordHits / queryTerms.length : 0;
      let score = termMatchRatio * 0.7 + (mem.confidence || 0.8) * 0.2;

      // Recency boost (within 7 days)
      const ageHours = (Date.now() - new Date(mem.updatedAt).getTime()) / (1000 * 3600);
      if (ageHours < 168) {
        score += 0.1;
      }

      return {
        id: mem.id,
        key: mem.memoryKey,
        content: mem.content,
        scope: mem.scope,
        confidence: mem.confidence,
        relevanceScore: Number(score.toFixed(3)),
        createdAt: mem.createdAt,
        updatedAt: mem.updatedAt,
      };
    });

    return scored
      .filter((m) => m.relevanceScore > 0.15 || queryTerms.length === 0)
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, limit);
  }

  async deleteMemory(userId: string, organizationId: string, memoryId: string): Promise<boolean> {
    const idx = fallbackMemoryStore.findIndex(
      (m) => m.id === memoryId && m.organizationId === organizationId && m.userId === userId
    );
    if (idx >= 0) {
      fallbackMemoryStore.splice(idx, 1);
    }

    try {
      await prisma.userMemory.deleteMany({
        where: { id: memoryId, organizationId, userId },
      });
      return true;
    } catch {
      return idx >= 0;
    }
  }

  buildMemoryContext(memories: RetrievedMemory[]): string {
    if (!memories || memories.length === 0) return '';

    const lines = memories
      .slice(0, 4)
      .map((m) => `- [${m.scope}] ${m.content}`);

    return `\n\n[RELEVANT PERSISTENT CONTEXT FROM MEMORY]:\n${lines.join('\n')}\n`;
  }
}

export const memoryService = new MemoryService();
