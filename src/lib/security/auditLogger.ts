import { AuditEvent, AgentType } from '@/types';

class AuditLoggerService {
  private logs: AuditEvent[] = [];

  public logAuditEvent(event: Omit<AuditEvent, 'id' | 'timestamp'>): AuditEvent {
    const sanitizedParams = this.sanitizeParameters(event.parameters);

    const fullEvent: AuditEvent = {
      ...event,
      id: `AUDIT-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: new Date().toISOString(),
      parameters: sanitizedParams,
    };

    this.logs.unshift(fullEvent);
    
    // Keep last 100 audit events in memory
    if (this.logs.length > 100) {
      this.logs = this.logs.slice(0, 100);
    }

    console.log(`[AUDIT LOG] ${fullEvent.timestamp} | Agent: ${fullEvent.agentId} | Action: ${fullEvent.actionType} | Approval: ${fullEvent.approvalStatus} | Exec: ${fullEvent.executionStatus}`);
    
    return fullEvent;
  }

  public getAuditLogs(): AuditEvent[] {
    return [...this.logs];
  }

  public getAuditLogsForUser(userId: string): AuditEvent[] {
    return this.logs.filter((l) => l.userId === userId);
  }

  private sanitizeParameters(params: Record<string, any>): Record<string, any> {
    if (!params || typeof params !== 'object') return {};

    const sanitized: Record<string, any> = {};
    const SENSITIVE_KEYS = ['password', 'token', 'apikey', 'secret', 'credential', 'auth', 'privatekey', 'systemprompt'];

    for (const [key, value] of Object.entries(params)) {
      const lowerKey = key.toLowerCase();
      if (SENSITIVE_KEYS.some((s) => lowerKey.includes(s))) {
        sanitized[key] = '[REDACTED_SENSITIVE_DATA]';
      } else if (typeof value === 'object' && value !== null) {
        sanitized[key] = this.sanitizeParameters(value);
      } else {
        sanitized[key] = value;
      }
    }

    return sanitized;
  }
}

export const auditLogger = new AuditLoggerService();
