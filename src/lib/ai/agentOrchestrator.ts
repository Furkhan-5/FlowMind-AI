import { AgentType, LanguageCode, User, ChatMessage, ActionCardData, ThoughtStep, AgentExecutionEvent } from '@/types';
import { UniversalAgentResponse, SuggestedAction, ArtifactRef, AgentHandoff } from '@/types/universalAgent';
import { universalAgentRuntime } from './universalAgentRuntime';
import { conversationMemory } from './conversationMemory';

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
  suggestedActions?: SuggestedAction[];
  artifacts?: ArtifactRef[];
  handoff?: AgentHandoff | null;
  universalResponse?: UniversalAgentResponse;
}

export class MasterAgentOrchestrator {
  public async processRequest(
    userQuery: string,
    options: OrchestrationOptions
  ): Promise<OrchestratorResult> {
    const { user, language, selectedAgentOverride, messageHistory = [] } = options;
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    // 1. Optimize conversation history context window
    conversationMemory.getOptimizedContext(messageHistory, { maxTurns: 8 });

    // 2. Execute request through Universal Agent Runtime Engine
    const univRes = await universalAgentRuntime.executeUserRequest(userQuery, {
      user,
      language,
      selectedAgentOverride,
      messageHistory,
    });

    const isBlocked = univRes.intent.name === 'SECURITY_BLOCKED';
    const thoughtStream: ThoughtStep[] = (univRes.metadata?.thoughtSteps as ThoughtStep[]) || [
      { agent: 'CEO', action: 'Request received & scanned by Security Layer', timestamp: timeStr, status: 'DONE' },
      { agent: univRes.agent.id, action: `Routed request to ${univRes.agent.name}`, timestamp: timeStr, status: 'DONE' },
    ];

    if (univRes.action?.required && univRes.metadata?.actionCard) {
      thoughtStream.push({
        agent: univRes.agent.id,
        action: `Action Card generated (${univRes.risk.level} Risk). Waiting for user approval.`,
        timestamp: timeStr,
        status: 'PENDING',
      });
    }

    const events: AgentExecutionEvent[] = [
      {
        id: `EVT-${Date.now()}-1`,
        type: 'request_received',
        agentId: 'CEO',
        agentName: 'CEO Agent',
        message: 'Request received and context validated',
        timestamp: timeStr,
        status: 'DONE',
      },
      {
        id: `EVT-${Date.now()}-2`,
        type: isBlocked ? 'security_blocked' : 'intent_detected',
        agentId: univRes.agent.id,
        agentName: univRes.agent.name,
        message: isBlocked ? 'Security Policy Blocked Request' : `Intent Identified: ${univRes.intent.name}`,
        timestamp: timeStr,
        status: isBlocked ? 'SECURITY_BLOCKED' : 'DONE',
      },
    ];

    if (univRes.handoff) {
      events.push({
        id: `EVT-${Date.now()}-3`,
        type: 'agent_selected',
        agentId: univRes.handoff.targetAgent,
        agentName: `${univRes.handoff.targetAgent} Agent`,
        message: `Handoff executed: ${univRes.handoff.sourceAgent} -> ${univRes.handoff.targetAgent}`,
        timestamp: timeStr,
        status: 'DONE',
      });
    }

    return {
      targetAgent: univRes.agent.id,
      responseText: univRes.response.text,
      thoughtStream,
      actionCard: univRes.metadata?.actionCard,
      events,
      securityBlocked: isBlocked,
      intentAction: univRes.intent.name,
      suggestedActions: univRes.suggestedActions,
      artifacts: univRes.artifacts,
      handoff: univRes.handoff,
      universalResponse: univRes,
    };
  }
}

export const agentOrchestrator = new MasterAgentOrchestrator();
