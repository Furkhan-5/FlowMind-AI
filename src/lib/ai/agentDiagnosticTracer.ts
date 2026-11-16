import { AgentType, UserRole } from '@/types';

export interface DiagnosticTraceRecord {
  requestId: string;
  timestamp: string;
  userId: string;
  organizationId: string;
  selectedAgent: AgentType;
  interpretedIntent: string;
  operationType: string;
  routingConfidence: number;
  contextRetrievalStatus: 'CACHE_HIT' | 'DATABASE_HIT' | 'NONE';
  selectedTools: string[];
  toolExecutionStatus: 'ALL_SUCCESS' | 'PARTIAL_SUCCESS' | 'FAILED' | 'NO_TOOLS';
  executionDurationMs: number;
  validationStatus: 'PASSED' | 'CORRECTED' | 'FAILED';
  qualityScore: number;
  failureReason?: string;
}

export class AgentDiagnosticTracerService {
  private traces: DiagnosticTraceRecord[] = [];
  private readonly MAX_RETENTION_RECORDS = 500;

  /**
   * Logs a sanitized diagnostic trace for authorized monitoring.
   */
  public recordTrace(trace: DiagnosticTraceRecord) {
    this.traces.unshift(trace);

    // Apply retention control
    if (this.traces.length > this.MAX_RETENTION_RECORDS) {
      this.traces.length = this.MAX_RETENTION_RECORDS;
    }
  }

  /**
   * Retrieves diagnostic traces with strict role-based access control (ADMIN only).
   */
  public getTraces(userRole: UserRole, limit: number = 50): DiagnosticTraceRecord[] {
    if (userRole !== 'ADMIN') {
      return [];
    }
    return this.traces.slice(0, limit);
  }

  /**
   * Diagnostic statistics for operations dashboard.
   */
  public getDiagnosticSummary(userRole: UserRole) {
    if (userRole !== 'ADMIN') {
      return null;
    }

    const total = this.traces.length;
    if (total === 0) {
      return { total: 0, avgDurationMs: 0, successRate: '100%', avgQualityScore: 1.0 };
    }

    const avgDurationMs = Math.round(
      this.traces.reduce((acc, t) => acc + t.executionDurationMs, 0) / total
    );
    const passedCount = this.traces.filter((t) => t.validationStatus !== 'FAILED').length;
    const avgQualityScore = parseFloat(
      (this.traces.reduce((acc, t) => acc + t.qualityScore, 0) / total).toFixed(2)
    );

    return {
      total,
      avgDurationMs,
      successRate: `${((passedCount / total) * 100).toFixed(1)}%`,
      avgQualityScore,
      recentTraces: this.traces.slice(0, 10),
    };
  }

  public clearTracesForTesting() {
    this.traces = [];
  }
}

export const agentDiagnosticTracer = new AgentDiagnosticTracerService();
