import { NextResponse } from 'next/server';
import { userService } from '@/lib/services/userService';
import { auditService } from '@/lib/services/auditService';
import { setSessionCookie } from '@/lib/auth/session';

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

    const user = await userService.findUserByEmail(email);

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid email or password.' },
        { status: 401 }
      );
    }

    const isPasswordValid = userService.verifyPassword(password, user.passwordHash);
    if (!isPasswordValid) {
      return NextResponse.json(
        { error: 'Invalid email or password.' },
        { status: 401 }
      );
    }

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
    await auditService.logAuditEvent({
      userId: user.id,
      userEmail: user.email,
      organizationId: user.organizationId,
      action: 'USER_LOGIN_SUCCESS',
      resourceType: 'Security',
      details: { email: user.email, role: activeRole },
    });

    const responseUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: activeRole,
      avatar: user.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(user.email)}`,
      organizationId: user.organizationId,
      preferredLanguage: (user.preferredLanguage as any) || 'en',
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
