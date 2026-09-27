import { workflowStorage } from './workflowStorage';
import { jobQueue, BackgroundJob } from './jobQueue';
import { workflowEngine } from './workflowEngine';

export class TriggerEngineService {
  public async handleWebhookTrigger(
    workflowId: string,
    payload: Record<string, any>,
    headers: Record<string, any> = {}
  ): Promise<{ success: boolean; jobId?: string; message: string }> {
    const workflow = workflowStorage.getLatestWorkflow(workflowId);
    if (!workflow) {
      return { success: false, message: `Workflow '${workflowId}' not found.` };
    }

    if (workflow.status !== 'ACTIVE' && workflow.status !== 'VALIDATED') {
      return { success: false, message: `Workflow '${workflowId}' is currently ${workflow.status} and cannot be triggered.` };
    }

    // Authenticate Webhook Secret if configured
    const expectedSecret = workflow.trigger.config?.webhookSecret;
    const providedSecret = headers['x-webhook-secret'] || headers['authorization'];

    if (expectedSecret && providedSecret !== expectedSecret) {
      return { success: false, message: 'Invalid or missing webhook signature/secret.' };
    }

    // Enqueue Background Job
    const job = jobQueue.enqueueJob(workflow.id, workflow.version, workflow.organizationId, 'webhook', payload);

    // Asynchronously execute workflow job
    setTimeout(() => {
      jobQueue.updateJobState(job.id, 'RUNNING');
      workflowEngine
        .executeWorkflow(workflow.id, workflow.version, payload)
        .then(() => jobQueue.updateJobState(job.id, 'COMPLETED'))
        .catch((err) => jobQueue.updateJobState(job.id, 'FAILED_PERMANENTLY', err.message));
    }, 100);

    return {
      success: true,
      jobId: job.id,
      message: `Webhook trigger accepted. Enqueued background execution job ${job.id}.`,
    };
  }

  public async handleCronScheduleTrigger(workflowId: string): Promise<BackgroundJob | null> {
    const workflow = workflowStorage.getLatestWorkflow(workflowId);
    if (!workflow || workflow.status !== 'ACTIVE') return null;

    const job = jobQueue.enqueueJob(workflow.id, workflow.version, workflow.organizationId, 'schedule', {
      cron: workflow.trigger.config?.cronExpression || '0 9 * * *',
    });

    jobQueue.updateJobState(job.id, 'RUNNING');
    await workflowEngine.executeWorkflow(workflow.id, workflow.version, { schedule: 'CRON_TRIGGER' });
    jobQueue.updateJobState(job.id, 'COMPLETED');
    return job;
  }
}

export const triggerEngine = new TriggerEngineService();
