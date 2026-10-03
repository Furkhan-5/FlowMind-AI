import { NextResponse } from 'next/server';
import { getCurrentUserFromSession } from '@/lib/auth/session';
import { db } from '@/lib/auth/db';

export async function GET() {
  try {
    const session = await getCurrentUserFromSession();

    if (!session) {
      return NextResponse.json(
        { error: 'Unauthenticated.' },
        { status: 401 }
      );
    }

    const userRecord = db.findUserById(session.userId) || db.findUserByEmail(session.email);

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
      avatar: userRecord.avatar,
      organizationId: userRecord.organizationId,
      preferredLanguage: 'en' as const,
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
