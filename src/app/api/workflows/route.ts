import { NextRequest, NextResponse } from 'next/server';
import { workflowOrchestrationService } from '@/lib/workflows/workflowOrchestrationService';
import { getCurrentUserFromSession } from '@/lib/auth/session';
import { hasPermission } from '@/lib/services/rbacService';
import { UserRole } from '@prisma/client';

export async function GET(request: NextRequest) {
  try {
    const session = await getCurrentUserFromSession();
    const orgId = request.headers.get('x-organization-id') || session?.organizationId || 'ORG-01';

    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status') || undefined;
    const search = searchParams.get('search') || undefined;
    const triggerType = searchParams.get('triggerType') || undefined;
    const category = searchParams.get('category') || undefined;

    const workflows = await workflowOrchestrationService.listWorkflows(orgId, {
      status,
      search,
      triggerType,
      category,
    });

    return NextResponse.json({ workflows });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to fetch workflows' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getCurrentUserFromSession();
    const userRole = (session?.role as UserRole) || 'ADMIN';
    const user = {
      id: session?.userId || 'USR-01',
      organizationId: session?.organizationId || 'ORG-01',
      role: userRole,
    };

    if (session && !hasPermission(userRole, 'WORKFLOW_CREATE')) {
      return NextResponse.json({ error: 'Permission denied' }, { status: 403 });
    }

    const body = await request.json();
    const saved = await workflowOrchestrationService.createWorkflow(
      {
        ...body,
      },
      user
    );

    return NextResponse.json({ success: true, workflow: saved });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to save workflow' }, { status: 500 });
  }
}
