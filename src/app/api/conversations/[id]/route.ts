import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken, COOKIE_NAME } from '@/lib/auth/session';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const sessionToken = request.cookies.get(COOKIE_NAME)?.value;
    const session = sessionToken ? await verifyToken(sessionToken) : null;
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const conversation = await prisma.conversation.findFirst({
      where: { id: params.id, userId: session.userId, organizationId: session.organizationId },
      include: { messages: { orderBy: { timestamp: 'asc' } } },
    });

    if (!conversation) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    return NextResponse.json({ conversation });
  } catch (err: any) {
    console.error('[CONVERSATION GET]', err);
    return NextResponse.json({ error: 'Failed to fetch conversation' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const sessionToken = request.cookies.get(COOKIE_NAME)?.value;
    const session = sessionToken ? await verifyToken(sessionToken) : null;
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const { title, summary } = body;

    const updateData: any = { updatedAt: new Date() };
    if (title !== undefined) updateData.title = title;
    if (summary !== undefined) updateData.summary = summary;

    await prisma.conversation.updateMany({
      where: { id: params.id, userId: session.userId, organizationId: session.organizationId },
      data: updateData,
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('[CONVERSATION PATCH]', err);
    return NextResponse.json({ error: 'Failed to update conversation' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const sessionToken = request.cookies.get(COOKIE_NAME)?.value;
    const session = sessionToken ? await verifyToken(sessionToken) : null;
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await prisma.conversation.deleteMany({
      where: { id: params.id, userId: session.userId, organizationId: session.organizationId },
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('[CONVERSATION DELETE]', err);
    return NextResponse.json({ error: 'Failed to delete conversation' }, { status: 500 });
  }
}
