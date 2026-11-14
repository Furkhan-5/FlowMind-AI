import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken, COOKIE_NAME } from '@/lib/auth/session';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const sessionToken = request.cookies.get(COOKIE_NAME)?.value;
    const user = sessionToken ? await verifyToken(sessionToken) : null;
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');

    // ADMIN/MANAGER see org-wide activity; EMPLOYEE sees only their own
    const where: any = { organizationId: user.organizationId };
    if (user.role === 'EMPLOYEE') {
      where.userId = user.userId;
    }

    const activities = await prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
      select: {
        id: true,
        action: true,
        resourceType: true,
        resourceId: true,
        details: true,
        createdAt: true,
        userEmail: true,
      },
    });

    return NextResponse.json({ activities });
  } catch (err: any) {
    console.error('[ACTIVITY GET]', err);
    return NextResponse.json({ error: 'Failed to fetch activity' }, { status: 500 });
  }
}
