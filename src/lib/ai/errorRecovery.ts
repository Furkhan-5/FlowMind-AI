import { AgentType, ThoughtStep } from '@/types';
import { auditLogger } from '@/lib/security/auditLogger';

export interface RecoveryResult<T> {
  success: boolean;
  result?: T;
  errorEventLogged: boolean;
  attempts: number;
  userFacingMessage?: string;
  thoughtSteps: ThoughtStep[];
}

export class ErrorRecoveryEngine {
  public async executeWithRecovery<T>(
    agentId: AgentType,
    actionName: string,
    executionFn: () => Promise<T>,
    maxRetries: number = 2
  ): Promise<RecoveryResult<T>> {
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const thoughtSteps: ThoughtStep[] = [];
    let attempts = 0;

    while (attempts <= maxRetries) {
      attempts++;
      try {
        thoughtSteps.push({
          agent: agentId,
          action: attempts === 1 ? `Executing ${actionName}` : `↻ Retrying ${actionName} (Attempt ${attempts}/${maxRetries + 1})`,
          timestamp: timeStr,
          status: 'RUNNING',
        });

        const res = await executionFn();

        thoughtSteps.push({
          agent: agentId,
          action: attempts === 1 ? `Completed ${actionName}` : `✓ Recovered ${actionName} on attempt ${attempts}`,
          timestamp: timeStr,
          status: 'DONE',
        });

        return {
          success: true,
          result: res,
          errorEventLogged: false,
          attempts,
          thoughtSteps,
        };
      } catch (err: any) {
        const errorMsg = err?.message || 'Agent execution transient failure';

        auditLogger.logAuditEvent({
          userId: 'SYSTEM',
          organizationId: 'SYSTEM',
          requestId: `ERR-${Date.now()}`,
          agentId,
          actionType: `AGENT_ERROR_${actionName}`,
          parameters: { attempt: attempts, error: errorMsg },
          approvalStatus: 'NOT_REQUIRED',
          executionStatus: 'FAILED',
          errorMessage: errorMsg,
        });

        thoughtSteps.push({
          agent: agentId,
          action: `⚠️ ${agentId} Agent encountered error: ${errorMsg}. Evaluating safe recovery...`,
          timestamp: timeStr,
          status: 'DONE',
        });

        if (attempts > maxRetries) {
          return {
            success: false,
            errorEventLogged: true,
            attempts,
            userFacingMessage: `The ${agentId} Agent encountered an operational exception and reached maximum retries (${maxRetries}). The request has been safely logged for administrator review.`,
            thoughtSteps,
          };
        }
      }
    }

    return {
      success: false,
      errorEventLogged: true,
      attempts,
      userFacingMessage: `${agentId} Agent execution failed safely.`,
      thoughtSteps,
    };
  }
}

export const errorRecovery = new ErrorRecoveryEngine();
