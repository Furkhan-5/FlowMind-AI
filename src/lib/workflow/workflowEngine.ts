import {
  WorkflowDefinition,
  WorkflowExecution,
  WorkflowNodeDSL,
  ExecutionStatus,
  NodeExecutionStatus,
  WorkflowLogEntry,
} from '@/types/workflowDSL';
import { dagValidator } from './dagValidator';
import { conditionEvaluator } from './conditionEvaluator';
import { variableResolver } from './variableResolver';
import { workflowStorage } from './workflowStorage';
import { agentOrchestrator } from '@/lib/ai/agentOrchestrator';
import { artifactManager } from '@/lib/ai/artifactManager';
import { auditLogger } from '@/lib/security/auditLogger';

export class WorkflowEngineRunnerService {
  private activeExecutions: Map<string, WorkflowExecution> = new Map();

  public async executeWorkflow(
    workflowId: string,
    version?: number,
    triggerPayload: Record<string, any> = {},
    user: any = { id: 'USR-01', name: 'Admin', organizationId: 'ORG-01', role: 'ADMIN' }
  ): Promise<WorkflowExecution> {
    const workflow = version
      ? workflowStorage.getWorkflowVersion(workflowId, version)
      : workflowStorage.getLatestWorkflow(workflowId);

    if (!workflow) {
      throw new Error(`Workflow '${workflowId}' (version: ${version || 'latest'}) not found.`);
    }

    // 1. DAG Graph Validation
    const valRes = dagValidator.validateDAG(workflow);
    if (!valRes.valid) {
      throw new Error(`Cannot execute invalid workflow DAG: ${valRes.errors.map((e) => e.message).join('; ')}`);
    }

    const executionId = `EXEC-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const startTime = new Date().toISOString();

    const execution: WorkflowExecution = {
      id: executionId,
      workflowId: workflow.id,
      workflowVersion: workflow.version,
      organizationId: workflow.organizationId,
      status: 'RUNNING',
      triggerPayload,
      nodeRecords: {},
      nodeOutputs: { trigger: triggerPayload },
      logs: [],
      startedAt: startTime,
    };

    this.activeExecutions.set(executionId, execution);

    this.addLog(execution, `🚀 Workflow execution started for '${workflow.name}' (v${workflow.version}). Trigger payload loaded.`, 'RUNNING');

    // 2. Execute Graph Nodes in Topological Order
    const topoOrder = valRes.topologicalOrder || workflow.nodes.map((n) => n.id);
    const nodeMap = new Map(workflow.nodes.map((n) => [n.id, n]));

    let skippedBranchNodes = new Set<string>();

    for (const nodeId of topoOrder) {
      // Check for Execution Control (PAUSED / CANCELLED)
      if (execution.status === 'CANCELLED') {
        this.addLog(execution, `🚫 Workflow execution cancelled by user. Halting remaining nodes.`, 'CANCELLED');
        break;
      }
      if (execution.status === 'PAUSED') {
        this.addLog(execution, `⏸️ Workflow execution paused. Waiting for resume signal.`, 'PAUSED');
        break;
      }

      if (skippedBranchNodes.has(nodeId)) {
        execution.nodeRecords[nodeId] = {
          nodeId,
          status: 'SKIPPED',
          attempts: 0,
        };
        continue;
      }

      const node = nodeMap.get(nodeId);
      if (!node) continue;

      execution.currentNodeId = nodeId;
      const nodeStartTime = Date.now();

      // Node Execution Record Setup
      execution.nodeRecords[nodeId] = {
        nodeId,
        status: 'RUNNING',
        startedAt: new Date().toISOString(),
        attempts: 1,
        input: variableResolver.resolveConfig(node.config, execution.nodeOutputs),
      };

      this.addLog(execution, `● Node '${node.name}' (${node.type}) started execution.`, 'RUNNING', nodeId, node.name, node.type);

      try {
        // Node Type Specific Execution Engine Logic
        const output = await this.executeNodeLogic(node, execution, workflow, user);

        const durationMs = Date.now() - nodeStartTime;
        execution.nodeRecords[nodeId].status = 'SUCCESS';
        execution.nodeRecords[nodeId].completedAt = new Date().toISOString();
        execution.nodeRecords[nodeId].durationMs = durationMs;
        execution.nodeRecords[nodeId].output = output;
        execution.nodeOutputs[nodeId] = output;
        if (node.name) execution.nodeOutputs[node.name] = output;

        this.addLog(
          execution,
          `✓ Node '${node.name}' succeeded in ${durationMs}ms.`,
          'SUCCESS',
          nodeId,
          node.name,
          node.type,
          durationMs,
          JSON.stringify(output || {})
        );

        // Handle Condition Node Branch Traversal
        if (node.type === 'CONDITION') {
          const conditionExpr = node.config.expression || 'TRUE';
          const evalResult = conditionEvaluator.evaluateCondition(conditionExpr, execution.nodeOutputs);

          this.addLog(
            execution,
            `🔀 Condition '${node.name}' evaluated expression '${conditionExpr}' → ${evalResult ? 'TRUE' : 'FALSE'}.`,
            'SUCCESS',
            nodeId
          );

          // Mark unchosen branch nodes as skipped
          const outgoingEdges = workflow.edges.filter((e) => e.source === nodeId);
          for (const edge of outgoingEdges) {
            const edgeLabel = edge.condition?.label || (edge.condition?.expression?.toLowerCase().includes('true') ? 'TRUE' : 'FALSE');
            const matchBranch = evalResult ? edgeLabel === 'TRUE' : edgeLabel === 'FALSE';

            if (!matchBranch) {
              skippedBranchNodes.add(edge.target);
            }
          }
        }
      } catch (err: any) {
        const durationMs = Date.now() - nodeStartTime;
        const errorMsg = err?.message || 'Node execution failed';

        execution.nodeRecords[nodeId].status = 'FAILED';
        execution.nodeRecords[nodeId].error = errorMsg;

        this.addLog(
          execution,
          `❌ Node '${node.name}' failed: ${errorMsg}`,
          'FAILED',
          nodeId,
          node.name,
          node.type,
          durationMs,
          undefined,
          errorMsg
        );

        // Retry Engine Handling
        const maxAttempts = node.retryPolicy?.maxAttempts || 1;
        if (execution.nodeRecords[nodeId].attempts < maxAttempts) {
          this.addLog(execution, `↻ Retrying Node '${node.name}' (Attempt ${execution.nodeRecords[nodeId].attempts + 1}/${maxAttempts})...`, 'RETRYING');
        } else {
          execution.status = 'FAILED';
          execution.error = `Node '${node.name}' reached terminal failure: ${errorMsg}`;
          break;
        }
      }
    }

    if (execution.status === 'RUNNING') {
      execution.status = 'COMPLETED';
      execution.completedAt = new Date().toISOString();
      this.addLog(execution, `🎉 Workflow '${workflow.name}' completed execution successfully.`, 'COMPLETED');
    }

    workflowStorage.saveExecution(execution);

    // Audit Log Entry
    auditLogger.logAuditEvent({
      userId: user.id,
      organizationId: workflow.organizationId,
      requestId: execution.id,
      agentId: 'Workflow',
      actionType: `WORKFLOW_EXECUTION_${execution.status}`,
      parameters: { workflowId, version: workflow.version, status: execution.status },
      approvalStatus: 'NOT_REQUIRED',
      executionStatus: execution.status === 'COMPLETED' ? 'EXECUTED' : 'FAILED',
    });

    return execution;
  }

  private async executeNodeLogic(
    node: WorkflowNodeDSL,
    execution: WorkflowExecution,
    workflow: WorkflowDefinition,
    user: any
  ): Promise<Record<string, any>> {
    const resolvedConfig = variableResolver.resolveConfig(node.config, execution.nodeOutputs);

    switch (node.type) {
      case 'TRIGGER':
        return { triggerType: workflow.trigger.type, payload: execution.triggerPayload };

      case 'AGENT':
      case 'ACTION': {
        const targetAgent = node.agentId || 'Sales';
        const orchestratorRes = await agentOrchestrator.processRequest(
          node.name || `Execute ${node.actionType || 'Action'}`,
          {
            user,
            language: 'en',
            selectedAgentOverride: targetAgent,
          }
        );
        return {
          agent: targetAgent,
          response: orchestratorRes.responseText,
          actionCard: orchestratorRes.actionCard,
          executed: true,
        };
      }

      case 'CONDITION':
        return { evaluated: true, expression: resolvedConfig.expression };

      case 'NOTIFICATION':
        return {
          sent: true,
          recipient: resolvedConfig.recipient || 'sales-manager@flowmind.ai',
          message: resolvedConfig.message || 'Notification dispatched',
        };

      case 'ARTIFACT': {
        const artRef = artifactManager.createArtifact(
          'INVOICE',
          `GST Invoice for ${resolvedConfig.client || 'Acme Corp'}`,
          'Finance',
          {
            clientName: resolvedConfig.client || 'Acme Corp',
            amount: resolvedConfig.amount || '₹1,00,000',
            status: 'APPROVED',
          }
        );
        return { artifactId: artRef.id, downloadPath: artRef.downloadFilename };
      }

      case 'DELAY': {
        const delayMs = resolvedConfig.delayMs || 1000;
        await new Promise((res) => setTimeout(res, Math.min(delayMs, 2000)));
        return { delayedMs: delayMs };
      }

      case 'END':
        return { completed: true };

      default:
        return { executed: true, config: resolvedConfig };
    }
  }

  public pauseExecution(executionId: string): boolean {
    const exec = this.activeExecutions.get(executionId) || workflowStorage.getExecution(executionId);
    if (!exec || exec.status !== 'RUNNING') return false;
    exec.status = 'PAUSED';
    workflowStorage.saveExecution(exec);
    return true;
  }

  public resumeExecution(executionId: string): boolean {
    const exec = this.activeExecutions.get(executionId) || workflowStorage.getExecution(executionId);
    if (!exec || exec.status !== 'PAUSED') return false;
    exec.status = 'RUNNING';
    workflowStorage.saveExecution(exec);
    return true;
  }

  public cancelExecution(executionId: string): boolean {
    const exec = this.activeExecutions.get(executionId) || workflowStorage.getExecution(executionId);
    if (!exec || (exec.status !== 'RUNNING' && exec.status !== 'PAUSED')) return false;
    exec.status = 'CANCELLED';
    workflowStorage.saveExecution(exec);
    return true;
  }

  private addLog(
    execution: WorkflowExecution,
    message: string,
    status: ExecutionStatus | NodeExecutionStatus,
    nodeId?: string,
    nodeName?: string,
    nodeType?: any,
    durationMs?: number,
    outputSummary?: string,
    error?: string
  ) {
    const log: WorkflowLogEntry = {
      id: `LOG-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      nodeId,
      nodeName,
      nodeType,
      status,
      message,
      durationMs,
      outputSummary,
      error,
    };
    execution.logs.push(log);
  }
}

export const workflowEngine = new WorkflowEngineRunnerService();
