import { NextRequest, NextResponse } from 'next/server';
import { workflowOrchestrationService } from '@/lib/workflows/workflowOrchestrationService';
import { getCurrentUserFromSession } from '@/lib/auth/session';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getCurrentUserFromSession();
    const orgId = request.headers.get('x-organization-id') || session?.organizationId || 'ORG-01';

    const workflow = await workflowOrchestrationService.getWorkflow(params.id, orgId);
    if (!workflow) {
      return NextResponse.json({ error: 'Workflow not found or access denied' }, { status: 404 });
    }

    return NextResponse.json({ workflow });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to fetch workflow' }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getCurrentUserFromSession();
    const targetOrg = request.headers.get('x-organization-id') || session?.organizationId || 'ORG-01';
    const user = {
      id: session?.userId || 'USR-01',
      organizationId: targetOrg,
      role: session?.role || 'ADMIN',
    };

    const body = await request.json();
    const updated = await workflowOrchestrationService.updateWorkflow(params.id, body, user);

    return NextResponse.json({ success: true, workflow: updated });
  } catch (err: any) {
    const status = err.message?.includes('WORKFLOW_PERMISSION_DENIED') ? 403 : 500;
    return NextResponse.json({ error: err.message || 'Failed to update workflow' }, { status });
  }
}
