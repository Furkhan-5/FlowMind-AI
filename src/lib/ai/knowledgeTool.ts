import { ragService } from '@/lib/services/ragService';
import { AgentType, User } from '@/types';
import { auditLogger } from '@/lib/security/auditLogger';

export interface AgentKnowledgeRetrievalResult {
  agentId: AgentType;
  query: string;
  relevantContext: string;
  citations: Array<{
    documentTitle: string;
    sectionTitle?: string;
    similarityScore: number;
  }>;
  hasSufficientContext: boolean;
}

export class KnowledgeToolService {
  /**
   * Domain-Aware Knowledge Retrieval for 15-Agent Swarm:
   * Restricts retrieval context based on agent domain and user role permissions.
   */
  public async retrieveForAgent(
    agentId: AgentType,
    query: string,
    user: User
  ): Promise<AgentKnowledgeRetrievalResult> {
    const orgId = user.organizationId || 'ORG-01';

    // Domain query specialization
    let enrichedQuery = query;
    if (agentId === 'Sales') enrichedQuery += ' sales qualification pricing discount';
    else if (agentId === 'Finance') enrichedQuery += ' gst tax invoice compliance overdue';
    else if (agentId === 'HR') enrichedQuery += ' leave policy employee handbook vacation';
    else if (agentId === 'Support') enrichedQuery += ' support sla ticket incident resolution';

    const ragResult = await ragService.queryKnowledgeBase(enrichedQuery, user);

    auditLogger.logAuditEvent({
      userId: user.id,
      organizationId: orgId,
      requestId: `REQ-AGENT-RAG-${Date.now()}`,
      agentId,
      actionType: 'AGENT_KNOWLEDGE_TOOL_INVOCATION',
      parameters: { query, sourceCount: ragResult.sources.length },
      approvalStatus: 'NOT_REQUIRED',
      executionStatus: 'EXECUTED',
    });

    return {
      agentId,
      query,
      relevantContext: ragResult.answer,
      citations: ragResult.sources.map((s) => ({
        documentTitle: s.documentTitle,
        sectionTitle: s.sectionTitle,
        similarityScore: s.similarityScore,
      })),
      hasSufficientContext: !ragResult.insufficientEvidence,
    };
  }
}

export const knowledgeTool = new KnowledgeToolService();
