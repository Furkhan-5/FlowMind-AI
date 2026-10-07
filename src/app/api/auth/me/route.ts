import { NextResponse } from 'next/server';
import { getCurrentUserFromSession } from '@/lib/auth/session';
import { userService } from '@/lib/services/userService';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await getCurrentUserFromSession();

    if (!session) {
      return NextResponse.json(
        { error: 'Unauthenticated.' },
        { status: 401 }
      );
    }

    let userRecord: any = null;
    try {
      userRecord = await userService.findUserById(session.userId);
      if (!userRecord && session.email) {
        userRecord = await userService.findUserByEmail(session.email);
      }
    } catch (dbErr) {
      console.warn('[API AUTH ME] DB lookup warning, falling back to session payload:', dbErr);
    }

    const sanitizedUser = {
      id: userRecord?.id || session.userId,
      name: userRecord?.name || session.name || 'FlowMind User',
      email: userRecord?.email || session.email || 'user@flowmind.ai',
      role: session.role || userRecord?.role || 'ADMIN',
      avatar: userRecord?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(session.email || 'user')}`,
      organizationId: userRecord?.organizationId || session.organizationId || 'ORG-01',
      preferredLanguage: (userRecord?.preferredLanguage as any) || 'en',
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
