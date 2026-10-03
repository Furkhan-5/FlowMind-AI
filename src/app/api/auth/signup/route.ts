import { NextResponse } from 'next/server';
import { db } from '@/lib/auth/db';
import { setSessionCookie } from '@/lib/auth/session';
import { auditLogger } from '@/lib/security/auditLogger';
import { UserRole } from '@/types';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email, password, confirmPassword, role } = body;

    // Validation checks
    if (!name || typeof name !== 'string' || name.trim().length < 2) {
      return NextResponse.json(
        { error: 'Name must be at least 2 characters long.' },
        { status: 400 }
      );
    }

    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return NextResponse.json(
        { error: 'Please provide a valid email address.' },
        { status: 400 }
      );
    }

    if (!password || typeof password !== 'string' || password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters long.' },
        { status: 400 }
      );
    }

    if (password !== confirmPassword) {
      return NextResponse.json(
        { error: 'Passwords do not match.' },
        { status: 400 }
      );
    }

    const assignedRole: UserRole = ['ADMIN', 'MANAGER', 'EMPLOYEE'].includes(role)
      ? role
      : 'EMPLOYEE';

    // Create user in database
    const { user, error } = db.createUser({
      name,
      email,
      password,
      role: assignedRole,
    });

    if (error) {
      return NextResponse.json({ error }, { status: 409 });
    }

    // Auto sign-in upon registration via HTTP-Only session cookie
    await setSessionCookie({
      userId: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
      organizationId: user.organizationId,
    });

    auditLogger.logAuditEvent({
      userId: user.id,
      organizationId: user.organizationId,
      requestId: `REQ-SIGNUP-${Date.now()}`,
      agentId: 'Security',
      actionType: 'USER_REGISTERED',
      parameters: { email: user.email, role: user.role },
      approvalStatus: 'APPROVED',
      executionStatus: 'EXECUTED',
    });

    const responseUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatar: user.avatar,
      organizationId: user.organizationId,
      preferredLanguage: 'en' as const,
    };

    const res = NextResponse.json({
      success: true,
      message: 'Account created successfully.',
      user: responseUser,
    });

    res.headers.set('Cache-Control', 'no-store, max-age=0');
    return res;
  } catch (err: any) {
    console.error('[API AUTH SIGNUP ERROR]', err);
    return NextResponse.json(
      { error: 'Failed to process account registration.' },
      { status: 500 }
    );
  }
}
