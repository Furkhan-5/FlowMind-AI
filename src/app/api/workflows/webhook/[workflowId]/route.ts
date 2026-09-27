import { NextRequest, NextResponse } from 'next/server';
import { triggerEngine } from '@/lib/workflow/triggerEngine';

export async function POST(
  request: NextRequest,
  { params }: { params: { workflowId: string } }
) {
  try {
    const workflowId = params.workflowId;
    const body = await request.json().catch(() => ({}));

    const headers: Record<string, any> = {};
    request.headers.forEach((val, key) => {
      headers[key] = val;
    });

    const result = await triggerEngine.handleWebhookTrigger(workflowId, body, headers);

    if (!result.success) {
      return NextResponse.json({ error: result.message }, { status: 400 });
    }

    return NextResponse.json(
      {
        message: result.message,
        jobId: result.jobId,
        workflowId,
        status: 'QUEUED',
      },
      { status: 202 }
    );
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || 'Internal webhook execution failure' },
      { status: 500 }
    );
  }
}
