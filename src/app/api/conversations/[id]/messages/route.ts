import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken, COOKIE_NAME } from '@/lib/auth/session';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const sessionToken = request.cookies.get(COOKIE_NAME)?.value;
    const session = sessionToken ? await verifyToken(sessionToken) : null;
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // Verify user owns this conversation
    const conversation = await prisma.conversation.findFirst({
      where: { id: params.id, userId: session.userId, organizationId: session.organizationId },
    });
    if (!conversation) return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });

    const messages = await prisma.message.findMany({
      where: { conversationId: params.id },
      orderBy: { timestamp: 'asc' },
    });

    return NextResponse.json({ messages });
  } catch (err: any) {
    console.error('[MESSAGES GET]', err);
    return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 });
  }
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const sessionToken = request.cookies.get(COOKIE_NAME)?.value;
    const session = sessionToken ? await verifyToken(sessionToken) : null;
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // Verify user owns this conversation
    const conversation = await prisma.conversation.findFirst({
      where: { id: params.id, userId: session.userId, organizationId: session.organizationId },
    });
    if (!conversation) return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });

    const body = await request.json();
    const { sender, content, activeAgent, language, thoughtStream, actionCard, confidenceLevel, riskLevel, metadata } = body;

    const message = await prisma.message.create({
      data: {
        conversationId: params.id,
        sender: sender || 'USER',
        userId: sender === 'USER' ? session.userId : null,
        activeAgent,
        content,
        language: language || 'en',
        thoughtStream: thoughtStream || undefined,
        actionCard: actionCard || undefined,
        confidenceLevel,
        riskLevel,
        metadata: metadata || undefined,
      },
    });

    // Update conversation timestamp
    await prisma.conversation.update({
      where: { id: params.id },
      data: { updatedAt: new Date() },
    });

    return NextResponse.json({ message }, { status: 201 });
  } catch (err: any) {
    console.error('[MESSAGE POST]', err);
    return NextResponse.json({ error: 'Failed to save message' }, { status: 500 });
  }
}
