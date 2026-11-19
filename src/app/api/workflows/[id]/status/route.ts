import { NextRequest, NextResponse } from 'next/server';
import { workflowOrchestrationService } from '@/lib/workflows/workflowOrchestrationService';
import { getCurrentUserFromSession } from '@/lib/auth/session';

export async function PATCH(
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

    const body = await request.json();
    const targetStatus = body.status;

    let updated;
    if (targetStatus === 'PAUSED') {
      updated = await workflowOrchestrationService.pauseWorkflow(params.id, user);
    } else if (targetStatus === 'ACTIVE') {
      updated = await workflowOrchestrationService.activateWorkflow(params.id, user);
    } else {
      updated = await workflowOrchestrationService.updateWorkflow(params.id, { status: targetStatus }, user);
    }

    return NextResponse.json({ success: true, workflow: updated });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to update workflow status' }, { status: 500 });
  }
}
