import { NextResponse } from 'next/server';
import { getCurrentUserFromSession } from '@/lib/auth/session';
import { userService } from '@/lib/services/userService';

export async function GET() {
  try {
    const session = await getCurrentUserFromSession();

    if (!session) {
      return NextResponse.json(
        { error: 'Unauthenticated.' },
        { status: 401 }
      );
    }

    let userRecord = await userService.findUserById(session.userId);
    if (!userRecord && session.email) {
      userRecord = await userService.findUserByEmail(session.email);
    }

    if (!userRecord) {
      return NextResponse.json(
        { error: 'User account no longer exists.' },
        { status: 401 }
      );
    }

    const sanitizedUser = {
      id: userRecord.id,
      name: userRecord.name,
      email: userRecord.email,
      role: session.role || userRecord.role,
      avatar: userRecord.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(userRecord.email)}`,
      organizationId: userRecord.organizationId,
      preferredLanguage: (userRecord.preferredLanguage as any) || 'en',
    };

    const res = NextResponse.json({
      authenticated: true,
      user: sanitizedUser,
    });

    res.headers.set('Cache-Control', 'no-store, max-age=0');
    return res;
  } catch (err: any) {
    console.error('[API AUTH ME ERROR]', err);
    return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });
  }
}
