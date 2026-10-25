import { prisma } from '@/lib/prisma';
import {
  KnowledgeDocument,
  DocumentChunk,
  DocumentFileType,
  DocumentStatus,
  DocumentAccessScope,
  RagQueryResult,
  RagSourceCitation,
  User,
} from '@/types';
import { auditLogger } from '@/lib/security/auditLogger';
import { aiProviderService } from '@/lib/ai/aiProviderService';

// Initial Seed Documents for Enterprise Knowledge Base
const SEED_DOCUMENTS: Array<{
  doc: KnowledgeDocument;
  chunks: DocumentChunk[];
}> = [
  {
    doc: {
      id: 'DOC-POL-001',
      organizationId: 'ORG-01',
      title: 'FlowMind Enterprise Sales & Lead Qualification Playbook',
      fileName: 'sales_playbook_2026.pdf',
      fileType: 'PDF',
      fileSize: 48200,
      status: 'INDEXED',
      accessScope: 'ORGANIZATION',
      allowedRoles: ['ADMIN', 'MANAGER', 'EMPLOYEE'],
      chunkCount: 3,
      createdAt: new Date(Date.now() - 86400000 * 7).toISOString(),
      updatedAt: new Date().toISOString(),
    },
    chunks: [
      {
        id: 'CHUNK-001-1',
        documentId: 'DOC-POL-001',
        documentTitle: 'FlowMind Enterprise Sales & Lead Qualification Playbook',
        organizationId: 'ORG-01',
        chunkIndex: 1,
        pageNumber: 1,
        sectionTitle: 'Lead Qualification Criteria (BANT Model)',
        content:
          'FlowMind AI qualifies inbound prospects utilizing Budget, Authority, Need, and Timeline (BANT). High-value enterprise leads are defined as organizations with over 50 employees and projected contract value exceeding ₹1,50,000. All high-value leads must be contacted within 24 hours by a dedicated Account Executive.',
        createdAt: new Date().toISOString(),
      },
      {
        id: 'CHUNK-001-2',
        documentId: 'DOC-POL-001',
        documentTitle: 'FlowMind Enterprise Sales & Lead Qualification Playbook',
        organizationId: 'ORG-01',
        chunkIndex: 2,
        pageNumber: 2,
        sectionTitle: 'Discounting & Proposal Approval Matrix',
        content:
          'Standard discounts up to 10% may be authorized by Sales Managers. Any discount between 10% and 25% requires written sign-off from the Finance Agent and Chief Commercial Officer. Discounts exceeding 25% are strictly prohibited unless approved via the Action Governance executive board.',
        createdAt: new Date().toISOString(),
      },
      {
        id: 'CHUNK-001-3',
        documentId: 'DOC-POL-001',
        documentTitle: 'FlowMind Enterprise Sales & Lead Qualification Playbook',
        organizationId: 'ORG-01',
        chunkIndex: 3,
        pageNumber: 3,
        sectionTitle: 'Deal Closing & Pipeline Progression',
        content:
          'When a deal reaches Proposal Sent stage, follow-up touchpoints are scheduled for Day 3 and Day 7. If no response is received by Day 14, the deal is flagged as Stale in the CRM and an automated re-engagement workflow is dispatched.',
        createdAt: new Date().toISOString(),
      },
    ],
  },
  {
    doc: {
      id: 'DOC-POL-002',
      organizationId: 'ORG-01',
      title: 'Corporate Finance & GST Invoicing Compliance Guide',
      fileName: 'gst_invoicing_policy.pdf',
      fileType: 'PDF',
      fileSize: 36500,
      status: 'INDEXED',
      accessScope: 'ROLE_RESTRICTED',
      allowedRoles: ['ADMIN', 'MANAGER'],
      chunkCount: 2,
      createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
      updatedAt: new Date().toISOString(),
    },
    chunks: [
      {
        id: 'CHUNK-002-1',
        documentId: 'DOC-POL-002',
        documentTitle: 'Corporate Finance & GST Invoicing Compliance Guide',
        organizationId: 'ORG-01',
        chunkIndex: 1,
        pageNumber: 1,
        sectionTitle: 'Goods & Services Tax (GST) Rates and Mandates',
        content:
          'All domestic B2B enterprise software licenses and workflow automation subscriptions in India are subject to 18% Integrated Goods and Services Tax (IGST) for interstate supply, or 9% CGST + 9% SGST for intra-state supply. Tax invoices must include customer GSTIN, HSN/SAC code 998314, and invoice date within 30 days of service.',
        createdAt: new Date().toISOString(),
      },
      {
        id: 'CHUNK-002-2',
        documentId: 'DOC-POL-002',
        documentTitle: 'Corporate Finance & GST Invoicing Compliance Guide',
        organizationId: 'ORG-01',
        chunkIndex: 2,
        pageNumber: 2,
        sectionTitle: 'Accounts Receivable & Overdue Follow-up SLA',
        content:
          'Payment terms are Net 15 days from invoice issuance date. If payment is not received by Day 16, status moves to Overdue. Overdue balances exceeding ₹50,000 trigger an automated alert to the Finance Agent. Day 30 overdue leads to account suspension pending management review.',
        createdAt: new Date().toISOString(),
      },
    ],
  },
  {
    doc: {
      id: 'DOC-POL-003',
      organizationId: 'ORG-01',
      title: 'Human Resources Employee Handbook & Leave Governance',
      fileName: 'hr_employee_handbook.md',
      fileType: 'MARKDOWN',
      fileSize: 28400,
      status: 'INDEXED',
      accessScope: 'ORGANIZATION',
      allowedRoles: ['ADMIN', 'MANAGER', 'EMPLOYEE'],
      chunkCount: 2,
      createdAt: new Date(Date.now() - 86400000 * 6).toISOString(),
      updatedAt: new Date().toISOString(),
    },
    chunks: [
      {
        id: 'CHUNK-003-1',
        documentId: 'DOC-POL-003',
        documentTitle: 'Human Resources Employee Handbook & Leave Governance',
        organizationId: 'ORG-01',
        chunkIndex: 1,
        pageNumber: 1,
        sectionTitle: 'Annual Leave Entitlements & Application Process',
        content:
          'Full-time FlowMind AI employees accrue 20 days of paid annual vacation leave and 12 days of casual/sick leave annually. Leave requests must be submitted at least 48 hours in advance through the HR Suite and require direct manager approval. Self-approval of leave by any employee or manager is strictly prohibited.',
        createdAt: new Date().toISOString(),
      },
      {
        id: 'CHUNK-003-2',
        documentId: 'DOC-POL-003',
        documentTitle: 'Human Resources Employee Handbook & Leave Governance',
        organizationId: 'ORG-01',
        chunkIndex: 2,
        pageNumber: 2,
        sectionTitle: 'Compensation Confidentiality & Payroll Cycles',
        content:
          'Employee compensation and payroll structures are strictly confidential. Individual employee salary records are masked from general staff directory views. Payroll is processed monthly on the 28th day for the active period. Discrepancies must be raised with the HR Agent within 5 business days.',
        createdAt: new Date().toISOString(),
      },
    ],
  },
  {
    doc: {
      id: 'DOC-POL-004',
      organizationId: 'ORG-01',
      title: 'Customer Support Helpdesk SLA & Incident Escalation Policy',
      fileName: 'support_sla_policy.txt',
      fileType: 'TXT',
      fileSize: 21900,
      status: 'INDEXED',
      accessScope: 'ORGANIZATION',
      allowedRoles: ['ADMIN', 'MANAGER', 'EMPLOYEE'],
      chunkCount: 2,
      createdAt: new Date(Date.now() - 86400000 * 4).toISOString(),
      updatedAt: new Date().toISOString(),
    },
    chunks: [
      {
        id: 'CHUNK-004-1',
        documentId: 'DOC-POL-004',
        documentTitle: 'Customer Support Helpdesk SLA & Incident Escalation Policy',
        organizationId: 'ORG-01',
        chunkIndex: 1,
        pageNumber: 1,
        sectionTitle: 'Service Level Agreement (SLA) Response Tiers',
        content:
          'Critical priority support tickets (affecting core production workflow execution) require initial response within 1 hour and resolution target within 4 hours. High priority tickets require response within 4 hours. Medium and Low priority tickets hold an SLA target of 24 to 48 hours.',
        createdAt: new Date().toISOString(),
      },
      {
        id: 'CHUNK-004-2',
        documentId: 'DOC-POL-004',
        documentTitle: 'Customer Support Helpdesk SLA & Incident Escalation Policy',
        organizationId: 'ORG-01',
        chunkIndex: 2,
        pageNumber: 2,
        sectionTitle: 'Unassigned Ticket Escalation Protocol',
        content:
          'Any Critical priority ticket remaining unassigned for more than 2 hours automatically escalates to the Customer Support Manager and dispatches an emergency notification to the Support Agent on duty.',
        createdAt: new Date().toISOString(),
      },
    ],
  },
];

// Fallback in-memory store
let docsStore: KnowledgeDocument[] = SEED_DOCUMENTS.map((s) => s.doc);
let chunksStore: DocumentChunk[] = SEED_DOCUMENTS.flatMap((s) => s.chunks);

/**
 * Deterministic Semantic Vector Embedding Generator:
 * Generates a normalized 384-dimensional vector from text using semantic hashing and
 * ngram term-frequency weighting, ensuring vector length ||v|| = 1.0.
 */
const STOP_WORDS = new Set([
  'a', 'an', 'and', 'are', 'as', 'at', 'be', 'by', 'for', 'from', 'has', 'he',
  'in', 'is', 'it', 'its', 'of', 'on', 'that', 'the', 'to', 'was', 'were',
  'will', 'with', 'what', 'which', 'who', 'how', 'when', 'where', 'why'
]);

function generateSemanticEmbedding(text: string): number[] {
  const dim = 384;
  const vec = new Array(dim).fill(0);
  const normalized = text.toLowerCase().replace(/[^a-z0-9\s]/g, ' ');
  const rawTokens = normalized.split(/\s+/).filter(Boolean);
  const tokens = rawTokens.filter((t) => !STOP_WORDS.has(t) && t.length > 1);

  if (tokens.length === 0) return vec;

  // Compute token hashes and distribute across vector dimensions
  tokens.forEach((token, idx) => {
    let hash = 0;
    for (let i = 0; i < token.length; i++) {
      hash = (hash << 5) - hash + token.charCodeAt(i);
      hash |= 0;
    }
    const targetIdx = Math.abs(hash) % dim;
    const sign = hash % 2 === 0 ? 1 : -1;
    vec[targetIdx] += sign * (1 + 1 / (idx + 1));

    // Bigram semantic feature
    if (idx > 0) {
      const prev = tokens[idx - 1];
      const bigramHash = Math.abs((hash * 31 + prev.charCodeAt(0)) | 0) % dim;
      vec[bigramHash] += 0.5;
    }
  });

  // Normalize to unit length (L2 norm)
  let norm = 0;
  for (let i = 0; i < dim; i++) {
    norm += vec[i] * vec[i];
  }
  norm = Math.sqrt(norm);
  if (norm > 0) {
    for (let i = 0; i < dim; i++) {
      vec[i] = Number((vec[i] / norm).toFixed(6));
    }
  }

  return vec;
}

/**
 * Calculates Cosine Similarity between two normalized vectors:
 * cos(theta) = dot(A, B) / (||A|| * ||B||)
 */
function computeCosineSimilarity(a: number[], b: number[]): number {
  if (!a || !b || a.length !== b.length) return 0;
  let dotProduct = 0;
  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
  }
  return Math.max(0, Math.min(1, dotProduct));
}

// Compute embeddings for all seeded chunks
chunksStore.forEach((c) => {
  if (!c.embedding) {
    c.embedding = generateSemanticEmbedding(c.content + ' ' + (c.sectionTitle || ''));
  }
});

export class RagService {
  /**
   * Retrieves list of knowledge documents with tenant and RBAC permission filtering
   */
  public async getDocuments(
    orgId: string = 'ORG-01',
    userRole: string = 'EMPLOYEE'
  ): Promise<KnowledgeDocument[]> {
    try {
      const dbDocs = await prisma.knowledgeDocument.findMany({
        where: { organizationId: orgId },
        orderBy: { createdAt: 'desc' },
      });

      if (dbDocs && dbDocs.length > 0) {
        return dbDocs
          .map((d) => ({
            id: d.id,
            organizationId: d.organizationId,
            title: d.title,
            fileName: d.fileName,
            fileType: d.fileType as DocumentFileType,
            fileSize: d.fileSize,
            fileUrl: d.fileUrl || undefined,
            status: d.status as DocumentStatus,
            errorMessage: d.errorMessage || undefined,
            accessScope: d.accessScope as DocumentAccessScope,
            department: d.department || undefined,
            allowedRoles: d.allowedRoles,
            chunkCount: d.chunkCount,
            createdById: d.createdById || undefined,
            createdAt: d.createdAt.toISOString(),
            updatedAt: d.updatedAt.toISOString(),
          }))
          .filter((d) => {
            if (userRole === 'ADMIN') return true;
            return d.allowedRoles.includes(userRole);
          });
      }
    } catch {
      // In-memory fallback
    }

    return docsStore
      .filter((d) => d.organizationId === orgId)
      .filter((d) => {
        if (userRole === 'ADMIN') return true;
        return d.allowedRoles.includes(userRole);
      });
  }

  /**
   * Ingests a new document: validates, parses, chunks, generates embeddings, and persists
   */
  public async ingestDocument(
    data: {
      title: string;
      fileName: string;
      fileType: DocumentFileType;
      content: string;
      accessScope?: DocumentAccessScope;
      allowedRoles?: string[];
      department?: string;
    },
    user: User
  ): Promise<{ document: KnowledgeDocument; chunks: DocumentChunk[] }> {
    const orgId = user.organizationId || 'ORG-01';

    // 1. Prompt Injection Sanitization for uploaded untrusted text
    const sanitizedContent = data.content
      .replace(/ignore\s+previous\s+instructions/gi, '[FILTERED_DIRECTIVE]')
      .replace(/system\s+prompt\s+override/gi, '[FILTERED_DIRECTIVE]');

    const docId = `DOC-${Date.now()}`;
    const newDoc: KnowledgeDocument = {
      id: docId,
      organizationId: orgId,
      title: data.title || data.fileName,
      fileName: data.fileName,
      fileType: data.fileType,
      fileSize: Buffer.byteLength(data.content, 'utf-8'),
      status: 'INDEXED',
      accessScope: data.accessScope || 'ORGANIZATION',
      allowedRoles: data.allowedRoles || ['ADMIN', 'MANAGER', 'EMPLOYEE'],
      department: data.department || 'General',
      chunkCount: 0,
      createdById: user.id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // 2. Text Chunking (Sliding window with paragraph boundaries)
    const paragraphs = sanitizedContent.split(/\n\s*\n/).filter((p) => p.trim().length > 20);
    const chunks: DocumentChunk[] = [];

    paragraphs.forEach((para, idx) => {
      const chunkText = para.trim();
      const firstLine = chunkText.split('\n')[0].replace(/^[#\s*]+/, '').trim();
      const sectionTitle = firstLine.length > 5 && firstLine.length < 60 ? firstLine : `Section ${idx + 1}`;
      const embedding = generateSemanticEmbedding(chunkText + ' ' + sectionTitle);

      chunks.push({
        id: `CHUNK-${docId}-${idx + 1}`,
        documentId: docId,
        documentTitle: newDoc.title,
        organizationId: orgId,
        chunkIndex: idx + 1,
        content: chunkText,
        pageNumber: Math.floor(idx / 3) + 1,
        sectionTitle,
        tokenCount: Math.round(chunkText.split(/\s+/).length * 1.3),
        embedding,
        createdAt: new Date().toISOString(),
      });
    });

    newDoc.chunkCount = chunks.length;

    // 3. Persist to PostgreSQL via Prisma
    try {
      await prisma.knowledgeDocument.create({
        data: {
          id: newDoc.id,
          organizationId: newDoc.organizationId,
          title: newDoc.title,
          fileName: newDoc.fileName,
          fileType: newDoc.fileType,
          fileSize: newDoc.fileSize,
          status: 'INDEXED',
          accessScope: newDoc.accessScope as any,
          department: newDoc.department,
          allowedRoles: newDoc.allowedRoles,
          chunkCount: newDoc.chunkCount,
          createdById: newDoc.createdById,
        },
      });

      for (const ch of chunks) {
        await prisma.documentChunk.create({
          data: {
            id: ch.id,
            documentId: ch.documentId,
            organizationId: ch.organizationId,
            chunkIndex: ch.chunkIndex,
            content: ch.content,
            pageNumber: ch.pageNumber,
            sectionTitle: ch.sectionTitle,
            tokenCount: ch.tokenCount,
            embedding: ch.embedding as any,
          },
        });
      }
    } catch (err) {
      console.warn('[RAG Service] PostgreSQL write failed, persisting to in-memory store:', err);
    }

    // Update in-memory store
    docsStore.unshift(newDoc);
    chunksStore.unshift(...chunks);

    auditLogger.logAuditEvent({
      userId: user.id,
      organizationId: orgId,
      requestId: `REQ-RAG-INGEST-${Date.now()}`,
      agentId: 'Knowledge',
      actionType: 'INGEST_KNOWLEDGE_DOCUMENT',
      parameters: { documentId: newDoc.id, title: newDoc.title, chunkCount: chunks.length },
      approvalStatus: 'NOT_REQUIRED',
      executionStatus: 'EXECUTED',
    });

    return { document: newDoc, chunks };
  }

  /**
   * Deletes a knowledge document and revokes all its chunks from the vector store
   */
  public async deleteDocument(docId: string, user: User): Promise<boolean> {
    const orgId = user.organizationId || 'ORG-01';

    try {
      await prisma.knowledgeDocument.delete({
        where: { id: docId },
      });
    } catch {
      // Handled in store
    }

    docsStore = docsStore.filter((d) => d.id !== docId);
    chunksStore = chunksStore.filter((c) => c.documentId !== docId);

    auditLogger.logAuditEvent({
      userId: user.id,
      organizationId: orgId,
      requestId: `REQ-RAG-DEL-${Date.now()}`,
      agentId: 'Knowledge',
      actionType: 'DELETE_KNOWLEDGE_DOCUMENT',
      parameters: { documentId: docId },
      approvalStatus: 'NOT_REQUIRED',
      executionStatus: 'EXECUTED',
    });

    return true;
  }

  /**
   * Semantic Vector Search & Retrieval:
   * Finds top-K matching chunks, applies RBAC and tenant filters, and computes similarity scores
   */
  public async searchChunks(
    query: string,
    orgId: string = 'ORG-01',
    userRole: string = 'EMPLOYEE',
    topK: number = 4
  ): Promise<DocumentChunk[]> {
    const queryVec = generateSemanticEmbedding(query);
    const queryTerms = query
      .toLowerCase()
      .split(/\s+/)
      .filter((w) => !STOP_WORDS.has(w) && w.length > 2);

    // Get list of permitted document IDs for this user
    const permittedDocs = await this.getDocuments(orgId, userRole);
    const permittedDocIds = new Set(permittedDocs.map((d) => d.id));

    // Score all available chunks
    const scoredChunks = chunksStore
      .filter((c) => c.organizationId === orgId && permittedDocIds.has(c.documentId))
      .map((chunk) => {
        const chunkEmbedding =
          chunk.embedding && chunk.embedding.length === 384
            ? chunk.embedding
            : generateSemanticEmbedding(chunk.content + ' ' + (chunk.sectionTitle || ''));
        let score = computeCosineSimilarity(queryVec, chunkEmbedding);

        // Keyword boost (BM25 style overlap)
        const contentLower = chunk.content.toLowerCase();
        let keywordHits = 0;
        queryTerms.forEach((term) => {
          if (contentLower.includes(term)) keywordHits++;
        });
        const keywordBoost = Math.min(0.2, (keywordHits / Math.max(1, queryTerms.length)) * 0.2);

        return {
          ...chunk,
          similarityScore: Number((score + keywordBoost).toFixed(4)),
        };
      });

    scoredChunks.sort((a, b) => (b.similarityScore || 0) - (a.similarityScore || 0));

    return scoredChunks.slice(0, topK);
  }

  /**
   * RAG Query Pipeline:
   * Generates grounded answer backed strictly by retrieved document chunks with exact citations
   */
  public async queryKnowledgeBase(query: string, user: User): Promise<RagQueryResult> {
    const startTime = Date.now();
    const orgId = user.organizationId || 'ORG-01';

    const topChunks = await this.searchChunks(query, orgId, user.role, 3);
    const bestScore = topChunks.length > 0 ? topChunks[0].similarityScore || 0 : 0;

    auditLogger.logAuditEvent({
      userId: user.id,
      organizationId: orgId,
      requestId: `REQ-RAG-QUERY-${Date.now()}`,
      agentId: 'Knowledge',
      actionType: 'RAG_KNOWLEDGE_QUERY',
      parameters: { query, topScore: bestScore },
      approvalStatus: 'NOT_REQUIRED',
      executionStatus: 'EXECUTED',
    });

    // Check evidence threshold (minimum 0.20 similarity required to avoid hallucination)
    if (topChunks.length === 0 || bestScore < 0.20) {
      return {
        query,
        answer:
          'The indexed FlowMind AI corporate knowledge base does not contain sufficient verified policy or procedure documentation to answer your specific inquiry. Please upload the relevant corporate SOP or consult your department administrator.',
        sources: [],
        insufficientEvidence: true,
        timestamp: new Date().toISOString(),
        latencyMs: Date.now() - startTime,
      };
    }

    const citations: RagSourceCitation[] = topChunks.map((c) => ({
      documentId: c.documentId,
      documentTitle: c.documentTitle || 'Corporate Policy Document',
      chunkIndex: c.chunkIndex,
      pageNumber: c.pageNumber,
      sectionTitle: c.sectionTitle,
      similarityScore: Math.round((c.similarityScore || 0) * 100),
      snippet: c.content,
    }));

    // Synthesize grounded response
    const primaryEvidence = topChunks[0].content;
    const secondaryEvidence = topChunks[1] ? topChunks[1].content : '';

    let defaultGrounded = `Based on corporate policy documentation (**${topChunks[0].documentTitle}**, ${topChunks[0].sectionTitle}):\n\n`;
    defaultGrounded += `${primaryEvidence}\n\n`;
    if (secondaryEvidence && topChunks[1].similarityScore && topChunks[1].similarityScore > 0.25) {
      defaultGrounded += `Additionally, according to **${topChunks[1].documentTitle}** (${topChunks[1].sectionTitle}):\n${secondaryEvidence}`;
    }

    const ragPrompt = `You are the FlowMind Enterprise RAG Knowledge Assistant.
Answer the user's question strictly grounded on the corporate policy excerpts below.
Cite the document titles and section titles explicitly. Never speculate or hallucinate outside the given text.

User Question: ${query}

Excerpts:
1. [${topChunks[0].documentTitle} - ${topChunks[0].sectionTitle}]: ${primaryEvidence}
${secondaryEvidence ? `2. [${topChunks[1].documentTitle} - ${topChunks[1].sectionTitle}]: ${secondaryEvidence}` : ''}
`;

    const aiRes = await aiProviderService.generateCompletion({
      organizationId: orgId,
      capability: 'RAG',
      prompt: ragPrompt,
      systemPrompt: 'You are FlowMind AI RAG Assistant. Ground all statements strictly in the provided documents.',
      fallbackText: defaultGrounded,
      temperature: 0.1,
    });

    return {
      query,
      answer: aiRes.content,
      sources: citations,
      insufficientEvidence: false,
      timestamp: new Date().toISOString(),
      latencyMs: Date.now() - startTime,
    };
  }
}

export const ragService = new RagService();
