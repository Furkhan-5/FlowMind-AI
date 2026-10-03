import { NextResponse } from 'next/server';
import { clearSessionCookie, getCurrentUserFromSession } from '@/lib/auth/session';
import { auditLogger } from '@/lib/security/auditLogger';

export async function POST() {
  try {
    const user = await getCurrentUserFromSession();

    if (user) {
      auditLogger.logAuditEvent({
        userId: user.userId,
        organizationId: user.organizationId,
        requestId: `REQ-LOGOUT-${Date.now()}`,
        agentId: 'Security',
        actionType: 'USER_LOGOUT',
        parameters: { email: user.email },
        approvalStatus: 'APPROVED',
        executionStatus: 'EXECUTED',
      });
    }

    // Invalidate session cookie
    await clearSessionCookie();

    const response = NextResponse.json({
      success: true,
      message: 'Logged out successfully.',
    });

    // Enforce anti-caching headers
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');

    return response;
  } catch (err: any) {
    console.error('[API AUTH LOGOUT ERROR]', err);
    return NextResponse.json({ success: true, message: 'Logged out.' });
  }
}
