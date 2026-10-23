export type DocumentFileType = 'PDF' | 'TXT' | 'MARKDOWN' | 'DOCX' | 'CSV';
export type DocumentStatus = 'UPLOADED' | 'PROCESSING' | 'INDEXED' | 'FAILED';
export type DocumentAccessScope = 'ORGANIZATION' | 'DEPARTMENT' | 'ROLE_RESTRICTED';

export interface KnowledgeDocument {
  id: string;
  organizationId: string;
  title: string;
  fileName: string;
  fileType: DocumentFileType;
  fileSize: number;
  fileUrl?: string;
  status: DocumentStatus;
  errorMessage?: string;
  accessScope: DocumentAccessScope;
  department?: string;
  allowedRoles: string[];
  chunkCount: number;
  createdById?: string;
  createdAt: string;
  updatedAt: string;
  metadata?: Record<string, any>;
}

export interface DocumentChunk {
  id: string;
  documentId: string;
  documentTitle?: string;
  organizationId: string;
  chunkIndex: number;
  content: string;
  pageNumber?: number;
  sectionTitle?: string;
  tokenCount?: number;
  embedding?: number[];
  similarityScore?: number;
  createdAt: string;
}

export interface RagSourceCitation {
  documentId: string;
  documentTitle: string;
  chunkIndex: number;
  pageNumber?: number;
  sectionTitle?: string;
  similarityScore: number;
  snippet: string;
  accessScope?: string;
}

export interface RagQueryResult {
  query: string;
  answer: string;
  sources: RagSourceCitation[];
  insufficientEvidence: boolean;
  language?: string;
  timestamp: string;
  latencyMs?: number;
}
