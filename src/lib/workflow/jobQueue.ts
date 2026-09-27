export type JobState = 'QUEUED' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'FAILED_PERMANENTLY' | 'CANCELLED';

export interface BackgroundJob {
  id: string;
  workflowId: string;
  workflowVersion: number;
  organizationId: string;
  state: JobState;
  triggerType: string;
  payload: Record<string, any>;
  attempts: number;
  maxAttempts: number;
  error?: string;
  createdAt: string;
  updatedAt: string;
}

export class BackgroundJobQueueService {
  private queue: Map<string, BackgroundJob> = new Map();
  private deadLetterQueue: Map<string, BackgroundJob> = new Map();

  public enqueueJob(
    workflowId: string,
    workflowVersion: number,
    organizationId: string,
    triggerType: string,
    payload: Record<string, any> = {}
  ): BackgroundJob {
    const id = `JOB-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const timeStr = new Date().toISOString();

    const job: BackgroundJob = {
      id,
      workflowId,
      workflowVersion,
      organizationId,
      state: 'QUEUED',
      triggerType,
      payload,
      attempts: 0,
      maxAttempts: 3,
      createdAt: timeStr,
      updatedAt: timeStr,
    };

    this.queue.set(id, job);
    return job;
  }

  public getJob(id: string): BackgroundJob | undefined {
    return this.queue.get(id) || this.deadLetterQueue.get(id);
  }

  public updateJobState(id: string, state: JobState, error?: string): BackgroundJob | undefined {
    const job = this.queue.get(id);
    if (!job) return undefined;

    job.state = state;
    job.updatedAt = new Date().toISOString();
    if (error) job.error = error;

    if (state === 'FAILED_PERMANENTLY') {
      this.deadLetterQueue.set(id, job);
    }
    return job;
  }

  public getQueueJobs(organizationId?: string): BackgroundJob[] {
    const all = Array.from(this.queue.values());
    if (organizationId) {
      return all.filter((j) => j.organizationId === organizationId);
    }
    return all;
  }

  public getDeadLetterJobs(organizationId?: string): BackgroundJob[] {
    const all = Array.from(this.deadLetterQueue.values());
    if (organizationId) {
      return all.filter((j) => j.organizationId === organizationId);
    }
    return all;
  }
}

export const jobQueue = new BackgroundJobQueueService();
