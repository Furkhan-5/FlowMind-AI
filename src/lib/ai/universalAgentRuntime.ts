import { AgentType, LanguageCode, User, ThoughtStep, ActionCardData, ChatMessage } from '@/types';
import {
  UniversalAgentResponse,
  ConfidenceLevel,
  RiskLevel,
  SuggestedAction,
  ArtifactRef,
  AgentHandoff,
} from '@/types/universalAgent';
import { promptInjectionShield } from '@/lib/security/promptInjectionShield';
import { auditLogger } from '@/lib/security/auditLogger';
import { parseCanonicalBusinessIntent } from './intentParser';
import { agentRegistry } from './agentRegistry';
import { actionGovernance } from './actionGovernance';
import { taskMemory } from './taskMemory';
import { artifactManager } from './artifactManager';
import { agentHandoffEngine } from './agentHandoffEngine';
import { capabilityRegistry } from './capabilityRegistry';
import { errorRecovery } from './errorRecovery';

export interface UniversalRuntimeOptions {
  user: User;
  language: LanguageCode;
  selectedAgentOverride?: AgentType | null;
  messageHistory?: ChatMessage[];
}

export class UniversalAgentRuntimeService {
  public async executeUserRequest(
    userQuery: string,
    options: UniversalRuntimeOptions
  ): Promise<UniversalAgentResponse> {
    const { user, language, selectedAgentOverride } = options;
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    // 1. Security Scan (Prompt Injection Shield)
    const securityCheck = promptInjectionShield.analyze(userQuery, language);
    if (securityCheck.isThreat) {
      auditLogger.logAuditEvent({
        userId: user.id,
        organizationId: user.organizationId,
        requestId: `REQ-SEC-${Date.now()}`,
        agentId: 'Security',
        actionType: 'PROMPT_INJECTION_BLOCKED',
        parameters: { rawInput: userQuery.substring(0, 50), threatType: securityCheck.threatType },
        approvalStatus: 'NOT_REQUIRED',
        executionStatus: 'BLOCKED',
        securityEvents: [securityCheck.reason || 'Prompt injection attempt blocked'],
        errorMessage: securityCheck.safeResponse,
      });

      return {
        agent: { id: 'Security', name: 'Security Agent' },
        intent: { name: 'SECURITY_BLOCKED', confidenceLevel: 'HIGH', missingFields: [] },
        response: { text: securityCheck.safeResponse },
        validation: { status: 'INVALID', missingFields: [], errorMessages: [securityCheck.reason || 'Security threat detected'] },
        approval: { required: false, status: 'NOT_REQUIRED' },
        risk: { level: 'CRITICAL', reason: 'Adversarial prompt injection attempt' },
      };
    }

    // 2. Retrieve Task Memory Context
    const existingTaskMem = taskMemory.getTaskMemory(user.id);
    const intentResult = parseCanonicalBusinessIntent(userQuery, language);

    // Merge parameters with previous turn memory
    const mergedParams = {
      ...existingTaskMem.parameters,
      ...intentResult.parameters,
    };

    // Determine target agent (user override > memory agent > parsed agent)
    let targetAgentId: AgentType = selectedAgentOverride || intentResult.targetAgent || 'CEO';

    // 3. Confidence & Uncertainty Handling
    let confidenceLevel: ConfidenceLevel = 'HIGH';
    if (!intentResult.action || intentResult.action === 'GENERAL_QUERY') {
      confidenceLevel = userQuery.trim().split(' ').length < 3 ? 'LOW' : 'MEDIUM';
    }

    // Check for missing parameters (e.g. create invoice without amount)
    const governanceEval = actionGovernance.evaluateAction(
      targetAgentId,
      intentResult.action,
      mergedParams,
      user.role
    );

    // If missing required fields (e.g. amount is missing for invoice creation)
    if (governanceEval.validationStatus === 'NEEDS_INPUT') {
      const missingFieldNames = governanceEval.missingFields.join(', ');
      taskMemory.updateTaskMemory(user.id, {
        currentAgent: targetAgentId,
        intentAction: intentResult.action,
        parameters: mergedParams,
        missingFields: governanceEval.missingFields,
      });

      const clarificationText = `I understand you want to ${intentResult.action.toLowerCase().replace(/_/g, ' ')}, but I need one more detail: What is the **${missingFieldNames}** for this request? Please provide it so I can prepare the action.`;

      return {
        agent: { id: targetAgentId, name: `${targetAgentId} Agent` },
        intent: {
          name: intentResult.action,
          confidenceLevel: 'HIGH',
          missingFields: governanceEval.missingFields,
          clarificationPrompt: clarificationText,
        },
        response: { text: clarificationText },
        validation: {
          status: 'NEEDS_INPUT',
          missingFields: governanceEval.missingFields,
          errorMessages: governanceEval.validationErrors,
        },
        approval: { required: false, status: 'NOT_REQUIRED' },
        risk: { level: 'LOW', reason: 'Awaiting user input for missing parameters' },
        suggestedActions: [
          {
            id: 'sug-cancel',
            label: 'Cancel Request',
            actionQuery: 'Cancel current request',
            targetAgent: targetAgentId,
          },
        ],
      };
    }

    // Update Task Memory with complete parameters
    taskMemory.updateTaskMemory(user.id, {
      currentAgent: targetAgentId,
      intentAction: intentResult.action,
      parameters: mergedParams,
      missingFields: [],
    });

    // 4. Inter-Agent Handoff Check
    const handoff = agentHandoffEngine.evaluateHandoff(targetAgentId, userQuery, mergedParams);
    if (handoff) {
      agentHandoffEngine.executeHandoff(user.id, handoff);
      targetAgentId = handoff.targetAgent;
    }

    // 5. Execute Agent Domain Logic with Error Recovery
    const agentDef = agentRegistry.getAgent(targetAgentId) || agentRegistry.getAgent('CEO')!;

    const recoveryRes = await errorRecovery.executeWithRecovery(
      targetAgentId,
      intentResult.action,
      async () => {
        return agentDef.execute({
          userQuery: securityCheck.sanitizedInput,
          language,
          userRole: user.role,
          contextParams: mergedParams,
          intentAction: intentResult.action,
        });
      },
      2
    );

    if (!recoveryRes.success) {
      return {
        agent: { id: targetAgentId, name: agentDef.name },
        intent: { name: intentResult.action, confidenceLevel: 'LOW', missingFields: [] },
        response: { text: recoveryRes.userFacingMessage || 'Agent execution failed safely.' },
        validation: { status: 'INVALID', missingFields: [], errorMessages: ['Operational execution exception'] },
        approval: { required: false, status: 'NOT_REQUIRED' },
        risk: { level: 'HIGH', reason: 'Execution exception caught safely' },
      };
    }

    const execResult = recoveryRes.result!;

    // 6. Action Card & Governance Assembly
    let actionCard: ActionCardData | undefined = undefined;
    if (execResult.proposedAction) {
      actionCard = {
        ...execResult.proposedAction,
        details: mergedParams,
        riskLevel: governanceEval.riskLevel,
        approvalReason: governanceEval.approvalReason,
        validationStatus: governanceEval.validationStatus,
        beforeAfter: governanceEval.simulation?.expectedChanges,
        simulation: governanceEval.simulation,
      };
    }

    // 7. Universal Artifact Generation
    const artifacts: ArtifactRef[] = [];
    if (targetAgentId === 'Finance' || intentResult.action.includes('INVOICE')) {
      artifacts.push(
        artifactManager.createArtifact(
          'INVOICE',
          `GST Tax Invoice for ${mergedParams.client || mergedParams.clientName || 'Acme Corp'}`,
          'Finance',
          {
            invoiceNumber: mergedParams.invoiceNumber || `INV-2026-${Math.floor(1000 + Math.random() * 9000)}`,
            clientName: mergedParams.client || mergedParams.clientName || 'Acme Corp',
            amount: mergedParams.amount || '₹50,000',
            tax: '₹9,000 (18% GST)',
            service: 'Enterprise Consulting & AI Integration Services',
            status: actionCard?.status || 'PENDING',
          }
        )
      );
    } else if (targetAgentId === 'Sales') {
      artifacts.push(
        artifactManager.createArtifact('CSV', 'Q3 Sales Pipeline & Lead Export', 'Sales', {
          TotalLeads: 42,
          QualifiedLeads: 28,
          PipelineValue: '₹45,00,000',
          TopProspect: mergedParams.client || 'Acme Tech Solutions',
        })
      );
    } else if (targetAgentId === 'HR') {
      artifacts.push(
        artifactManager.createArtifact('REPORT', 'Employee Leave & Policy Summary', 'HR', {
          Employee: mergedParams.employee || 'Rajesh Kumar',
          LeaveType: mergedParams.leaveType || 'Casual Leave',
          DaysRequested: mergedParams.leaveDays || 2,
          ApprovalStatus: 'Verified by HR Agent',
        })
      );
    } else if (targetAgentId === 'Analytics') {
      artifacts.push(
        artifactManager.createArtifact('JSON', 'Real-Time KPI & Revenue Metrics Export', 'Analytics', {
          MRR: '₹14,50,000',
          ARR: '₹1.74 Cr',
          ChurnRate: '1.2%',
          Uptime: '99.99%',
        })
      );
    }

    // 8. Contextual Suggested Next Actions for ALL Agents
    const suggestedActions = this.generateSuggestedActions(targetAgentId, intentResult.action, mergedParams);

    return {
      agent: { id: targetAgentId, name: agentDef.name },
      intent: { name: intentResult.action, confidenceLevel, missingFields: [] },
      response: { text: execResult.responseText },
      action: actionCard
        ? { required: true, type: actionCard.title, parameters: actionCard.details }
        : undefined,
      validation: { status: governanceEval.validationStatus, missingFields: [] },
      approval: {
        required: governanceEval.approvalRequired,
        reason: governanceEval.approvalReason,
        status: actionCard ? actionCard.status : 'NOT_REQUIRED',
      },
      risk: { level: governanceEval.riskLevel, reason: governanceEval.riskReason },
      simulation: governanceEval.simulation,
      suggestedActions,
      artifacts: artifacts.length > 0 ? artifacts : undefined,
      handoff,
      metadata: {
        thoughtSteps: recoveryRes.thoughtSteps,
        agentResponseObj: execResult,
        actionCard,
      },
    };
  }

  private generateSuggestedActions(
    agentId: AgentType,
    action: string,
    params: Record<string, any>
  ): SuggestedAction[] {
    const clientName = params.client || params.clientName || 'Acme Corp';

    switch (agentId) {
      case 'Sales':
        return [
          { id: 's1', label: '📊 Analyze Sales Pipeline', actionQuery: 'Show sales pipeline and lead conversion analytics', targetAgent: 'Analytics' },
          { id: 's2', label: '💳 Draft Invoice for Client', actionQuery: `Generate a GST invoice of ₹75,000 for client ${clientName}`, targetAgent: 'Finance' },
          { id: 's3', label: '📅 Schedule Follow-up Demo', actionQuery: `Schedule sales demo with ${clientName} for next Monday`, targetAgent: 'Scheduler' },
        ];

      case 'Finance':
        return [
          { id: 'f1', label: '📥 Download Tax Invoice', actionQuery: `Download invoice for ${clientName}`, targetAgent: 'Finance', primary: true },
          { id: 'f2', label: '📧 Send Invoice via Email', actionQuery: `Send invoice copy to ${clientName} finance department`, targetAgent: 'Email' },
          { id: 'f3', label: '📈 View Revenue Metrics', actionQuery: 'Show Q3 revenue analytics and GST metrics', targetAgent: 'Analytics' },
        ];

      case 'HR':
        return [
          { id: 'h1', label: '📄 Export Employee HR Summary', actionQuery: 'Generate employee leave and policy report', targetAgent: 'HR' },
          { id: 'h2', label: '💼 Process Payroll Adjustment', actionQuery: 'Calculate monthly payroll adjustment for active staff', targetAgent: 'Finance' },
          { id: 'h3', label: '🔒 Audit HR Security Roles', actionQuery: 'Inspect HR access control roles and security logs', targetAgent: 'Security' },
        ];

      case 'Analytics':
        return [
          { id: 'a1', label: '📊 Export KPI Report (CSV)', actionQuery: 'Export real-time KPI data as CSV', targetAgent: 'Analytics', primary: true },
          { id: 'a2', label: '🎯 Target High-Value Leads', actionQuery: 'Identify top 5 high-value pipeline leads', targetAgent: 'Sales' },
          { id: 'a3', label: '📑 Generate Executive PDF Report', actionQuery: 'Generate executive summary PDF report', targetAgent: 'Reporting' },
        ];

      default:
        return [
          { id: 'd1', label: '💡 Explore 15 Agent Capabilities', actionQuery: 'List capabilities of all 15 agents', targetAgent: 'CEO' },
          { id: 'd2', label: '📊 Check Business Health KPI', actionQuery: 'Show real-time business health KPI analytics', targetAgent: 'Analytics' },
        ];
    }
  }
}

export const universalAgentRuntime = new UniversalAgentRuntimeService();
