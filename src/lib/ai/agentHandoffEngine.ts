import { AgentType } from '@/types';
import { AgentHandoff } from '@/types/universalAgent';
import { capabilityRegistry } from './capabilityRegistry';
import { taskMemory } from './taskMemory';

export class AgentHandoffEngineService {
  public evaluateHandoff(
    sourceAgent: AgentType,
    userQuery: string,
    extractedParams: Record<string, any>
  ): AgentHandoff | null {
    const queryLower = userQuery.toLowerCase();
    const capabilities = capabilityRegistry.getCapabilities(sourceAgent);

    // Handoff condition 1: Query requests billing/invoice from Sales or Analytics -> Handoff to Finance
    if ((sourceAgent === 'Sales' || sourceAgent === 'Analytics' || sourceAgent === 'CEO') &&
        (queryLower.includes('invoice') || queryLower.includes('bill') || queryLower.includes('gst'))) {
      if (capabilities.handOffTargets.includes('Finance')) {
        return {
          sourceAgent,
          targetAgent: 'Finance',
          reason: `${sourceAgent} Agent analyzed task and detected financial billing requirement. Transferring to Finance Agent.`,
          requiredTask: 'Draft GST Invoice & Calculate Tax',
          contextParams: {
            client: extractedParams.client || extractedParams.company || 'Acme Corp',
            amount: extractedParams.amount || extractedParams.value || '₹75,000',
            service: 'Consulting & Software Integration',
          },
          status: 'PENDING',
        };
      }
    }

    // Handoff condition 2: Query requests HR leave/onboarding from Sales or CEO -> Handoff to HR
    if ((sourceAgent === 'Sales' || sourceAgent === 'CEO') &&
        (queryLower.includes('leave') || queryLower.includes('onboard') || queryLower.includes('employee'))) {
      if (capabilities.handOffTargets.includes('HR')) {
        return {
          sourceAgent,
          targetAgent: 'HR',
          reason: `${sourceAgent} Agent identified HR policy operation. Transferring context to HR Agent.`,
          requiredTask: 'Process HR Request',
          contextParams: extractedParams,
          status: 'PENDING',
        };
      }
    }

    // Handoff condition 3: Query requests analytical trend report from Sales or Finance -> Handoff to Analytics
    if ((sourceAgent === 'Sales' || sourceAgent === 'Finance') &&
        (queryLower.includes('kpi') || queryLower.includes('churn') || queryLower.includes('trend') || queryLower.includes('forecast'))) {
      if (capabilities.handOffTargets.includes('Analytics')) {
        return {
          sourceAgent,
          targetAgent: 'Analytics',
          reason: `${sourceAgent} Agent detected data analytics request. Delegating to Analytics Agent.`,
          requiredTask: 'Calculate Performance Metrics',
          contextParams: extractedParams,
          status: 'PENDING',
        };
      }
    }

    return null;
  }

  public executeHandoff(userId: string, handoff: AgentHandoff): AgentHandoff {
    const executed: AgentHandoff = {
      ...handoff,
      status: 'EXECUTED',
    };
    taskMemory.addHandoff(userId, executed);
    return executed;
  }
}

export const agentHandoffEngine = new AgentHandoffEngineService();
