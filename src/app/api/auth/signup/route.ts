import { NextResponse } from 'next/server';
import { userService } from '@/lib/services/userService';
import { auditService } from '@/lib/services/auditService';
import { setSessionCookie } from '@/lib/auth/session';
import { UserRole } from '@prisma/client';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email, password, confirmPassword, role } = body;

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
      ? (role as UserRole)
      : 'EMPLOYEE';

    const { user, error } = await userService.createUser({
      name,
      email,
      password,
      role: assignedRole,
    });

    if (error || !user) {
      return NextResponse.json({ error: error || 'Failed to create user account.' }, { status: 409 });
    }

    await setSessionCookie({
      userId: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
      organizationId: user.organizationId,
    });

    await auditService.logAuditEvent({
      userId: user.id,
      userEmail: user.email,
      organizationId: user.organizationId,
      action: 'USER_REGISTERED',
      resourceType: 'Security',
      details: { email: user.email, role: user.role },
    });

    const responseUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatar: user.avatar,
      organizationId: user.organizationId,
      preferredLanguage: ((user as any).preferredLanguage as any) || 'en',
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
