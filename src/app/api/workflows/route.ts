import { NextRequest, NextResponse } from 'next/server';
import { workflowService } from '@/lib/services/workflowService';
import { getCurrentUserFromSession } from '@/lib/auth/session';
import { hasPermission } from '@/lib/services/rbacService';
import { UserRole } from '@prisma/client';

export async function GET(request: NextRequest) {
  try {
    const session = await getCurrentUserFromSession();
    const orgId = session?.organizationId || 'ORG-01';

    const workflows = await workflowService.getAllWorkflows(orgId);
    return NextResponse.json({ workflows });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to fetch workflows' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getCurrentUserFromSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!hasPermission((session.role as UserRole) || 'EMPLOYEE', 'WORKFLOW_CREATE')) {
      return NextResponse.json({ error: 'Permission denied' }, { status: 403 });
    }

    const body = await request.json();
    const saved = await workflowService.saveWorkflow({
      ...body,
      organizationId: session.organizationId || 'ORG-01',
      createdBy: session.userId,
    });

    return NextResponse.json({ success: true, workflow: saved });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to save workflow' }, { status: 500 });
  }
}
