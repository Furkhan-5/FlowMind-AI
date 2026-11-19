import { NextRequest, NextResponse } from 'next/server';
import { workflowOrchestrationService } from '@/lib/workflows/workflowOrchestrationService';
import { getCurrentUserFromSession } from '@/lib/auth/session';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getCurrentUserFromSession();
    const user = {
      id: session?.userId || 'USR-01',
      organizationId: session?.organizationId || 'ORG-01',
      role: session?.role || 'ADMIN',
    };

    let body: any = {};
    try {
      body = await request.json();
    } catch {
      // Empty body is acceptable for manual triggers
    }

    const execution = await workflowOrchestrationService.executeWorkflow(
      params.id,
      body.version,
      body.payload || body.triggerPayload || {},
      user
    );

    return NextResponse.json({ success: true, execution });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Workflow execution failed' }, { status: 500 });
  }
}
