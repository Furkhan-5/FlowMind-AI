import { WorkflowDefinition, WorkflowExecution } from '@/types/workflowDSL';

export class WorkflowStorageService {
  private workflows: Map<string, WorkflowDefinition[]> = new Map(); // workflowId -> versions array
  private executions: Map<string, WorkflowExecution> = new Map();

  constructor() {
    this.seedDefaultTemplates();
  }

  private seedDefaultTemplates() {
    const timeStr = new Date().toISOString();
    const leadWf: WorkflowDefinition = {
      id: 'WF-TEMPLATE-01',
      organizationId: 'ORG-01',
      name: 'Lead Qualification & GST Invoicing DAG',
      description: 'Checks lead value. If > ₹100,000, notifies manager, runs Sales Agent, and generates GST invoice.',
      version: 1,
      status: 'ACTIVE',
      naturalTrigger: 'When a new lead is created, check if value > 100000',
      trigger: { type: 'event', config: { eventType: 'LEAD_CREATED' } },
      nodes: [
        { id: 'node_trig', type: 'TRIGGER', name: 'Lead Created Event', config: { eventType: 'LEAD_CREATED' } },
        { id: 'node_cond', type: 'CONDITION', name: 'Check Lead Value (> ₹100k)', config: { expression: '{{trigger.value}} > 100000' } },
        { id: 'node_sales', type: 'AGENT', name: 'Sales Agent Qualification', agentId: 'Sales', actionType: 'CREATE_LEAD', config: { client: '{{trigger.company}}', value: '{{trigger.value}}' } },
        { id: 'node_notify', type: 'NOTIFICATION', name: 'Notify Manager (High Value)', config: { message: 'High Value Lead: {{trigger.company}}' } },
        { id: 'node_invoice', type: 'ARTIFACT', name: 'Generate GST Tax Invoice', agentId: 'Finance', actionType: 'GENERATE_INVOICE', config: { client: '{{trigger.company}}', amount: '{{trigger.value}}' } },
        { id: 'node_normal', type: 'ACTION', name: 'Add to Standard Follow-up', config: { queue: 'NORMAL_LEADS' } },
        { id: 'node_end', type: 'END', name: 'End Execution', config: {} },
      ],
      edges: [
        { id: 'e1', source: 'node_trig', target: 'node_cond' },
        { id: 'e2', source: 'node_cond', target: 'node_sales', condition: { expression: 'TRUE', label: 'TRUE' } },
        { id: 'e3', source: 'node_sales', target: 'node_notify' },
        { id: 'e4', source: 'node_notify', target: 'node_invoice' },
        { id: 'e5', source: 'node_invoice', target: 'node_end' },
        { id: 'e6', source: 'node_cond', target: 'node_normal', condition: { expression: 'FALSE', label: 'FALSE' } },
        { id: 'e7', source: 'node_normal', target: 'node_end' },
      ],
      createdBy: 'Admin',
      createdAt: timeStr,
      updatedAt: timeStr,
    };

    this.saveWorkflow(leadWf);
  }

  public saveWorkflow(workflow: WorkflowDefinition): WorkflowDefinition {
    const versions = this.workflows.get(workflow.id) || [];
    const updatedVersions = [...versions, workflow];
    this.workflows.set(workflow.id, updatedVersions);
    return workflow;
  }

  public getLatestWorkflow(workflowId: string): WorkflowDefinition | undefined {
    const versions = this.workflows.get(workflowId);
    if (!versions || versions.length === 0) return undefined;
    return versions[versions.length - 1];
  }

  public getWorkflowVersion(workflowId: string, version: number): WorkflowDefinition | undefined {
    const versions = this.workflows.get(workflowId);
    if (!versions) return undefined;
    return versions.find((v) => v.version === version);
  }

  public getAllWorkflows(organizationId: string): WorkflowDefinition[] {
    const result: WorkflowDefinition[] = [];
    this.workflows.forEach((versions) => {
      const latest = versions[versions.length - 1];
      if (latest && (latest.organizationId === organizationId || latest.organizationId === 'ORG-01')) {
        result.push(latest);
      }
    });
    return result;
  }

  public createNewVersion(workflowId: string, updatedDefinition: Partial<WorkflowDefinition>): WorkflowDefinition {
    const latest = this.getLatestWorkflow(workflowId);
    if (!latest) throw new Error(`Workflow '${workflowId}' not found.`);

    const newVersionNum = latest.version + 1;
    const timestamp = new Date().toISOString();

    const newVersion: WorkflowDefinition = {
      ...latest,
      ...updatedDefinition,
      id: workflowId,
      version: newVersionNum,
      updatedAt: timestamp,
    };

    return this.saveWorkflow(newVersion);
  }

  public saveExecution(execution: WorkflowExecution): WorkflowExecution {
    this.executions.set(execution.id, execution);
    return execution;
  }

  public getExecution(executionId: string): WorkflowExecution | undefined {
    return this.executions.get(executionId);
  }

  public getExecutionsForWorkflow(workflowId: string): WorkflowExecution[] {
    return Array.from(this.executions.values()).filter((e) => e.workflowId === workflowId);
  }
}

export const workflowStorage = new WorkflowStorageService();
