import {
  WorkflowDefinition,
  WorkflowNodeDSL,
  WorkflowEdgeDSL,
} from '@/types/workflowDSL';
import { dagValidator } from './dagValidator';
import { User } from '@/types';

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

    if (textLower.includes('lead') || textLower.includes('prospect')) {
      triggerName = 'New Lead Event Trigger';
      triggerType = 'event';
    } else if (textLower.includes('invoice') || textLower.includes('bill')) {
      triggerName = 'Invoice Created Trigger';
      triggerType = 'event';
    } else if (textLower.includes('every day') || textLower.includes('daily') || textLower.includes('schedule') || textLower.includes('cron')) {
      triggerName = 'Daily Scheduled Trigger';
      triggerType = 'schedule';
    } else if (textLower.includes('webhook') || textLower.includes('api call')) {
      triggerName = 'Inbound Webhook Trigger';
      triggerType = 'webhook';
    }

    const triggerNode: WorkflowNodeDSL = {
      id: 'node_trigger',
      type: 'TRIGGER',
      name: triggerName,
      config: {
        eventType: triggerType === 'event' ? 'LEAD_CREATED' : 'MANUAL_RUN',
        cronExpression: triggerType === 'schedule' ? '0 9 * * *' : undefined,
        webhookUrl: triggerType === 'webhook' ? `/api/workflows/webhook/${workflowId}` : undefined,
      },
    };
    nodes.push(triggerNode);

    let lastNodeId = triggerNode.id;

    // 3. Conditional Logic Detection
    const hasCondition = textLower.includes('if') || textLower.includes('greater than') || textLower.includes('above') || textLower.includes('>') || textLower.includes('value');

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
      // Simple Linear Sequence
      const actionNode1: WorkflowNodeDSL = {
        id: 'node_act_1',
        type: 'AGENT',
        name: 'Sales Agent Lead Processing',
        agentId: 'Sales',
        actionType: 'CREATE_LEAD',
        config: { client: '{{trigger.company}}' },
      };

      const actionNode2: WorkflowNodeDSL = {
        id: 'node_act_2',
        type: 'NOTIFICATION',
        name: 'Dispatch Toast Notification',
        config: { message: 'Workflow task executed successfully' },
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

    // Assemble Workflow Definition
    const workflow: WorkflowDefinition = {
      id: workflowId,
      organizationId: user.organizationId || 'ORG-01',
      name: textLower.includes('lead') ? 'Automated Lead Qualification & Invoicing DAG' : 'Custom Enterprise Automation Workflow',
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
