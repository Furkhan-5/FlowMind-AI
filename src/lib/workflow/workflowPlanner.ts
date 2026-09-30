import {
  WorkflowDefinition,
  WorkflowNodeDSL,
  WorkflowEdgeDSL,
} from '@/types/workflowDSL';
import { dagValidator } from './dagValidator';
import { User, AgentType } from '@/types';

export interface PlannerResult {
  success: boolean;
  workflow?: WorkflowDefinition;
  naturalLanguageSummary: string;
  validationErrors?: string[];
  clarificationRequired?: string;
}

export class WorkflowPlannerAgentService {
  public generateDAGFromNaturalLanguage(
    userInstruction: string,
    user: User
  ): PlannerResult {
    const textLower = userInstruction.toLowerCase();
    const timestamp = new Date().toISOString();
    const workflowId = `WF-${Date.now()}`;

    // 1. Clarification Check (If prompt is empty or too vague)
    if (textLower.trim().length < 5) {
      return {
        success: false,
        naturalLanguageSummary: 'The workflow instruction is too short. Please describe the trigger and action steps.',
        clarificationRequired: 'What trigger event should start this workflow, and what actions should execute?',
      };
    }

    const nodes: WorkflowNodeDSL[] = [];
    const edges: WorkflowEdgeDSL[] = [];

    // 2. Identify Trigger Node
    let triggerName = 'Manual Trigger';
    let triggerType: 'manual' | 'webhook' | 'schedule' | 'event' = 'manual';

    if (textLower.includes('every day') || textLower.includes('daily') || textLower.includes('schedule') || textLower.includes('cron') || textLower.includes('at 9 am')) {
      triggerName = 'Daily Scheduled Trigger (9:00 AM)';
      triggerType = 'schedule';
    } else if (textLower.includes('webhook') || textLower.includes('api call')) {
      triggerName = 'Inbound Webhook Trigger';
      triggerType = 'webhook';
    } else if (textLower.includes('lead') || textLower.includes('prospect')) {
      triggerName = 'New Lead Event Trigger';
      triggerType = 'event';
    } else if (textLower.includes('invoice') || textLower.includes('bill')) {
      triggerName = 'Invoice Created Trigger';
      triggerType = 'event';
    }

    const triggerNode: WorkflowNodeDSL = {
      id: 'node_trigger',
      type: 'TRIGGER',
      name: triggerName,
      config: {
        eventType: triggerType === 'event' ? (textLower.includes('invoice') ? 'INVOICE_CREATED' : 'LEAD_CREATED') : 'MANUAL_RUN',
        cronExpression: triggerType === 'schedule' ? '0 9 * * *' : undefined,
        webhookUrl: triggerType === 'webhook' ? `/api/workflows/webhook/${workflowId}` : undefined,
      },
    };
    nodes.push(triggerNode);

    let lastNodeId = triggerNode.id;

    // 3. Conditional Logic Detection (Using regex \bif\b to prevent matching 'notify')
    const hasCondition =
      /\bif\b/i.test(userInstruction) ||
      textLower.includes('greater than') ||
      textLower.includes('above') ||
      textLower.includes('>') ||
      (textLower.includes('value') && textLower.includes('100'));

    if (hasCondition) {
      // Create Condition Node
      const conditionNode: WorkflowNodeDSL = {
        id: 'node_cond_1',
        type: 'CONDITION',
        name: 'Check Lead Value (> ₹100,000)',
        config: {
          expression: '{{trigger.value}} > 100000',
        },
      };
      nodes.push(conditionNode);

      edges.push({
        id: `edge_${lastNodeId}_to_${conditionNode.id}`,
        source: lastNodeId,
        target: conditionNode.id,
      });

      // TRUE Branch Nodes
      const trueActionNode: WorkflowNodeDSL = {
        id: 'node_true_sales',
        type: 'AGENT',
        name: 'Sales Agent Lead Qualification',
        agentId: 'Sales',
        actionType: 'CREATE_LEAD',
        config: {
          client: '{{trigger.company}}',
          value: '{{trigger.value}}',
          priority: 'HIGH_VALUE',
        },
        retryPolicy: { maxAttempts: 3, strategy: 'exponential', initialDelayMs: 1000 },
        timeoutMs: 30000,
        riskLevel: 'MEDIUM',
      };

      const trueNotifyNode: WorkflowNodeDSL = {
        id: 'node_true_notify',
        type: 'NOTIFICATION',
        name: 'Notify Sales Manager (High Value)',
        config: {
          recipient: 'sales-manager@flowmind.ai',
          message: 'High Value Lead Detected: {{trigger.company}} (Value: {{trigger.value}})',
        },
      };

      const trueInvoiceNode: WorkflowNodeDSL = {
        id: 'node_true_invoice',
        type: 'ARTIFACT',
        name: 'Generate GST Tax Invoice',
        agentId: 'Finance',
        actionType: 'GENERATE_INVOICE',
        config: {
          client: '{{trigger.company}}',
          amount: '{{trigger.value}}',
        },
        riskLevel: 'HIGH',
      };

      nodes.push(trueActionNode, trueNotifyNode, trueInvoiceNode);

      // Edges for TRUE branch
      edges.push({
        id: `edge_${conditionNode.id}_to_${trueActionNode.id}`,
        source: conditionNode.id,
        target: trueActionNode.id,
        condition: { expression: 'TRUE', label: 'TRUE' },
      });
      edges.push({
        id: `edge_${trueActionNode.id}_to_${trueNotifyNode.id}`,
        source: trueActionNode.id,
        target: trueNotifyNode.id,
      });
      edges.push({
        id: `edge_${trueNotifyNode.id}_to_${trueInvoiceNode.id}`,
        source: trueNotifyNode.id,
        target: trueInvoiceNode.id,
      });

      // FALSE Branch Nodes
      const falseActionNode: WorkflowNodeDSL = {
        id: 'node_false_normal',
        type: 'ACTION',
        name: 'Add to Standard Follow-up Queue',
        config: {
          queue: 'STANDARD_LEAD_QUEUE',
          client: '{{trigger.company}}',
        },
      };
      nodes.push(falseActionNode);

      edges.push({
        id: `edge_${conditionNode.id}_to_${falseActionNode.id}`,
        source: conditionNode.id,
        target: falseActionNode.id,
        condition: { expression: 'FALSE', label: 'FALSE' },
      });

      // Terminal END Node
      const endNode: WorkflowNodeDSL = {
        id: 'node_end',
        type: 'END',
        name: 'Workflow Completion',
        config: {},
      };
      nodes.push(endNode);

      edges.push({ id: `edge_${trueInvoiceNode.id}_to_${endNode.id}`, source: trueInvoiceNode.id, target: endNode.id });
      edges.push({ id: `edge_${falseActionNode.id}_to_${endNode.id}`, source: falseActionNode.id, target: endNode.id });
    } else {
      // Linear Sequence customized based on prompt intent
      let action1Name = 'Finance Agent Invoice Summaries';
      let agentId: AgentType = 'Finance';
      let action1Type = 'GENERATE_SUMMARY';

      if (textLower.includes('lead') || textLower.includes('sales')) {
        action1Name = 'Sales Agent Lead Processing';
        agentId = 'Sales';
        action1Type = 'CREATE_LEAD';
      } else if (textLower.includes('hr') || textLower.includes('employee')) {
        action1Name = 'HR Agent Record Synchronization';
        agentId = 'HR';
        action1Type = 'SYNC_EMPLOYEES';
      }

      const actionNode1: WorkflowNodeDSL = {
        id: 'node_act_1',
        type: 'AGENT',
        name: action1Name,
        agentId: agentId,
        actionType: action1Type,
        config: { scope: 'DAILY_SUMMARY', timestamp: '{{trigger.timestamp}}' },
      };

      const recipientText = textLower.includes('hr') && textLower.includes('finance')
        ? 'HR & Finance Teams'
        : textLower.includes('hr')
        ? 'HR Team'
        : textLower.includes('finance')
        ? 'Finance Team'
        : 'Operations Team';

      const actionNode2: WorkflowNodeDSL = {
        id: 'node_act_2',
        type: 'NOTIFICATION',
        name: `Notify ${recipientText}`,
        config: { message: `Daily invoice summary generated and dispatched to ${recipientText}` },
      };

      const endNode: WorkflowNodeDSL = {
        id: 'node_end',
        type: 'END',
        name: 'Workflow Completion',
        config: {},
      };

      nodes.push(actionNode1, actionNode2, endNode);

      edges.push({ id: `edge_trig_to_act1`, source: triggerNode.id, target: actionNode1.id });
      edges.push({ id: `edge_act1_to_act2`, source: actionNode1.id, target: actionNode2.id });
      edges.push({ id: `edge_act2_to_end`, source: actionNode2.id, target: endNode.id });
    }

    // Name generation based on prompt intent
    let workflowName = 'Custom Enterprise Automation Workflow';
    if (textLower.includes('hr') || textLower.includes('employee') || textLower.includes('onboarding')) {
      workflowName = 'HR Onboarding & Synchronization Workflow';
    } else if (textLower.includes('lead') || textLower.includes('sales')) {
      workflowName = 'Automated Lead Qualification & Invoicing DAG';
    } else if (textLower.includes('invoice') || textLower.includes('finance') || textLower.includes('billing')) {
      workflowName = 'Finance Billing & Invoice Summary Workflow';
    } else if (textLower.includes('webhook') || textLower.includes('api')) {
      workflowName = 'Inbound Webhook API Automation';
    }

    // Assemble Workflow Definition
    const workflow: WorkflowDefinition = {
      id: workflowId,
      organizationId: user.organizationId || 'ORG-01',
      name: workflowName,
      description: `Generated from natural language prompt: "${userInstruction}"`,
      version: 1,
      status: 'VALIDATED',
      naturalTrigger: userInstruction,
      trigger: {
        type: triggerType,
        config: {
          cronExpression: triggerType === 'schedule' ? '0 9 * * *' : undefined,
          webhookUrl: triggerType === 'webhook' ? `/api/workflows/webhook/${workflowId}` : undefined,
        },
      },
      nodes,
      edges,
      createdBy: user.name || 'Admin',
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    // Validate DAG using DAGValidatorEngine
    const valRes = dagValidator.validateDAG(workflow);
    if (!valRes.valid) {
      return {
        success: false,
        workflow,
        naturalLanguageSummary: `Failed to construct valid DAG. ${valRes.errors.length} validation errors found.`,
        validationErrors: valRes.errors.map((e) => e.message),
      };
    }

    return {
      success: true,
      workflow,
      naturalLanguageSummary: `Successfully parsed prompt into a ${nodes.length}-node DAG containing ${edges.length} execution paths (${hasCondition ? 'Conditional Branching Active' : 'Linear Sequence'}).`,
    };
  }
}

export const workflowPlanner = new WorkflowPlannerAgentService();
