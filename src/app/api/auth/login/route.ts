import { NextResponse } from 'next/server';
import { db } from '@/lib/auth/db';
import { setSessionCookie } from '@/lib/auth/session';
import { auditLogger } from '@/lib/security/auditLogger';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password, role } = body;

    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return NextResponse.json(
        { error: 'Please enter a valid work email address.' },
        { status: 400 }
      );
    }

    if (!password || typeof password !== 'string') {
      return NextResponse.json(
        { error: 'Password is required.' },
        { status: 400 }
      );
    }

    const user = db.findUserByEmail(email);

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid email or password.' },
        { status: 401 }
      );
    }

    const isPasswordValid = db.verifyPassword(password, user.passwordHash);
    if (!isPasswordValid) {
      return NextResponse.json(
        { error: 'Invalid email or password.' },
        { status: 401 }
      );
    }

    // Optional role override for demo role switching if provided
    const activeRole = role || user.role;

    // Set HTTP-Only Session Cookie
    await setSessionCookie({
      userId: user.id,
      email: user.email,
      role: activeRole,
      name: user.name,
      organizationId: user.organizationId,
    });

    // Log security audit event
    auditLogger.logAuditEvent({
      userId: user.id,
      organizationId: user.organizationId,
      requestId: `REQ-LOGIN-${Date.now()}`,
      agentId: 'Security',
      actionType: 'USER_LOGIN_SUCCESS',
      parameters: { email: user.email, role: activeRole },
      approvalStatus: 'APPROVED',
      executionStatus: 'EXECUTED',
    });

    const responseUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: activeRole,
      avatar: user.avatar,
      organizationId: user.organizationId,
      preferredLanguage: 'en' as const,
    };

    const res = NextResponse.json({
      success: true,
      message: 'Authentication successful.',
      user: responseUser,
    });

    res.headers.set('Cache-Control', 'no-store, max-age=0');
    return res;
  } catch (err: any) {
    console.error('[API AUTH LOGIN ERROR]', err);
    return NextResponse.json(
      { error: 'Internal server authentication failure.' },
      { status: 500 }
    );
  }
}
