import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken, COOKIE_NAME } from '@/lib/auth/session';

export async function GET(request: NextRequest) {
  try {
    const sessionToken = request.cookies.get(COOKIE_NAME)?.value;
    const session = sessionToken ? await verifyToken(sessionToken) : null;
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const conversations = await prisma.conversation.findMany({
      where: { userId: session.userId, organizationId: session.organizationId },
      orderBy: { updatedAt: 'desc' },
      take: 50,
      include: { messages: { orderBy: { timestamp: 'asc' }, take: 1 } },
    });

    return NextResponse.json({ conversations });
  } catch (err: any) {
    console.error('[CONVERSATIONS GET]', err);
    return NextResponse.json({ error: 'Failed to fetch conversations' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const sessionToken = request.cookies.get(COOKIE_NAME)?.value;
    const session = sessionToken ? await verifyToken(sessionToken) : null;
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const { title, agentId } = body;

    const conversation = await prisma.conversation.create({
      data: {
        organizationId: session.organizationId,
        userId: session.userId,
        title: title || 'New Conversation',
        agentId: agentId || undefined,
      },
    });

    return NextResponse.json({ conversation }, { status: 201 });
  } catch (err: any) {
    console.error('[CONVERSATIONS POST]', err);
    return NextResponse.json({ error: 'Failed to create conversation' }, { status: 500 });
  }
}
