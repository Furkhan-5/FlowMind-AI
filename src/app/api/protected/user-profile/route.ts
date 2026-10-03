import { NextResponse } from 'next/server';
import { getCurrentUserFromSession } from '@/lib/auth/session';
import { db } from '@/lib/auth/db';

export async function GET() {
  const session = await getCurrentUserFromSession();

  if (!session) {
    return NextResponse.json(
      { error: 'Unauthorized. Authentication session is missing or expired.' },
      { status: 401 }
    );
  }

  const user = db.findUserById(session.userId) || db.findUserByEmail(session.email);

  if (!user) {
    return NextResponse.json(
      { error: 'Forbidden. User account not found.' },
      { status: 403 }
    );
  }

  return NextResponse.json({
    protectedData: {
      userId: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      organizationId: user.organizationId,
      confidentialMetrics: {
        activeWorkflows: 12,
        securityClearanceLevel: user.role === 'ADMIN' ? 'TOP_SECRET' : 'RESTRICTED',
      },
    },
  });
}
