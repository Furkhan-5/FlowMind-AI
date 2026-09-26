import { AgentType, LanguageCode, User, ChatMessage, ActionCardData, ThoughtStep, AgentExecutionEvent } from '@/types';
import { promptInjectionShield } from '@/lib/security/promptInjectionShield';
import { auditLogger } from '@/lib/security/auditLogger';
import { conversationMemory } from './conversationMemory';
import { parseCanonicalBusinessIntent } from './intentParser';
import { agentRegistry } from './agentRegistry';

export interface OrchestrationOptions {
  user: User;
  language: LanguageCode;
  selectedAgentOverride?: AgentType | null;
  messageHistory?: ChatMessage[];
}

export interface OrchestratorResult {
  targetAgent: AgentType;
  responseText: string;
  thoughtStream: ThoughtStep[];
  actionCard?: ActionCardData;
  events: AgentExecutionEvent[];
  securityBlocked: boolean;
  intentAction: string;
}

export class MasterAgentOrchestrator {
  public async processRequest(
    userQuery: string,
    options: OrchestrationOptions
  ): Promise<OrchestratorResult> {
    const { user, language, selectedAgentOverride, messageHistory = [] } = options;
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const requestId = `REQ-${Date.now()}`;

    // 1. Security Check: Prompt Injection Shield
    const securityCheck = promptInjectionShield.analyze(userQuery, language);
    if (securityCheck.isThreat) {
      auditLogger.logAuditEvent({
        userId: user.id,
        organizationId: user.organizationId,
        requestId,
        agentId: 'Security',
        actionType: 'PROMPT_INJECTION_BLOCKED',
        parameters: { rawInput: userQuery.substring(0, 50), threatType: securityCheck.threatType },
        approvalStatus: 'NOT_REQUIRED',
        executionStatus: 'BLOCKED',
        securityEvents: [securityCheck.reason || 'Prompt injection blocked'],
        errorMessage: securityCheck.safeResponse,
      });

      const blockedThought: ThoughtStep[] = [
        { agent: 'Security', action: 'Scanning input for security violations', timestamp: timeStr, status: 'DONE' },
        { agent: 'Security', action: `SECURITY BLOCKED: ${securityCheck.reason}`, timestamp: timeStr, status: 'DONE' },
      ];

      const blockedEvent: AgentExecutionEvent = {
        id: `EVT-${Date.now()}`,
        type: 'security_blocked',
        agentId: 'Security',
        agentName: 'Security Agent',
        message: securityCheck.safeResponse,
        timestamp: timeStr,
        status: 'SECURITY_BLOCKED',
      };

      return {
        targetAgent: 'Security',
        responseText: securityCheck.safeResponse,
        thoughtStream: blockedThought,
        events: [blockedEvent],
        securityBlocked: true,
        intentAction: 'SECURITY_BLOCKED',
      };
    }

    // 2. Conversation Memory Context Window Optimization
    const optimizedContext = conversationMemory.getOptimizedContext(messageHistory, { maxTurns: 8 });

    // 3. Business Intent Parsing
    const parsedIntent = parseCanonicalBusinessIntent(userQuery, language);

    // 4. Agent Selection (Honor user override if specified, else route via intent parser)
    const targetAgentType: AgentType = selectedAgentOverride || parsedIntent.targetAgent;
    const agentDef = agentRegistry.getAgent(targetAgentType) || agentRegistry.getAgent('CEO')!;

    // 5. Execute Agent Logic
    const executionResult = await agentDef.execute({
      userQuery: securityCheck.sanitizedInput,
      language,
      userRole: user.role,
      contextParams: parsedIntent.parameters,
      intentAction: parsedIntent.action,
    });

    // 6. Build Standardized Safe Events (SAFE EXECUTION STATUS EVENTS ONLY)
    const events: AgentExecutionEvent[] = [
      {
        id: `EVT-${Date.now()}-1`,
        type: 'request_received',
        agentId: 'CEO',
        agentName: 'CEO Agent',
        message: 'Request received and context loaded',
        timestamp: timeStr,
        status: 'DONE',
      },
      {
        id: `EVT-${Date.now()}-2`,
        type: 'intent_detected',
        agentId: 'CEO',
        agentName: 'CEO Agent',
        message: `Business Intent Identified: ${parsedIntent.action}`,
        timestamp: timeStr,
        status: 'DONE',
      },
      {
        id: `EVT-${Date.now()}-3`,
        type: 'agent_selected',
        agentId: targetAgentType,
        agentName: agentDef.name,
        message: `Routing request to ${agentDef.name}`,
        timestamp: timeStr,
        status: 'DONE',
      },
    ];

    if (executionResult.proposedAction) {
      events.push({
        id: `EVT-${Date.now()}-4`,
        type: 'action_prepared',
        agentId: targetAgentType,
        agentName: agentDef.name,
        message: `Action Card prepared: ${executionResult.proposedAction.title}`,
        timestamp: timeStr,
        status: 'DONE',
      });
      events.push({
        id: `EVT-${Date.now()}-5`,
        type: 'approval_required',
        agentId: targetAgentType,
        agentName: agentDef.name,
        message: 'Awaiting explicit user approval before execution',
        timestamp: timeStr,
        status: 'PENDING',
      });
    }

    // 7. Audit Log Entry
    auditLogger.logAuditEvent({
      userId: user.id,
      organizationId: user.organizationId,
      requestId,
      agentId: targetAgentType,
      actionType: parsedIntent.action,
      parameters: parsedIntent.parameters,
      approvalStatus: executionResult.proposedAction ? 'PENDING' : 'NOT_REQUIRED',
      executionStatus: executionResult.proposedAction ? 'PENDING' : 'EXECUTED',
    });

    return {
      targetAgent: targetAgentType,
      responseText: executionResult.responseText,
      thoughtStream: executionResult.thoughtSteps,
      actionCard: executionResult.proposedAction,
      events,
      securityBlocked: false,
      intentAction: parsedIntent.action,
    };
  }
}

export const agentOrchestrator = new MasterAgentOrchestrator();
