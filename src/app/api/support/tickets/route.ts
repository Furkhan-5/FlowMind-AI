import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken, COOKIE_NAME } from '@/lib/auth/session';

export async function GET(request: NextRequest) {
  try {
    const sessionToken = request.cookies.get(COOKIE_NAME)?.value;
    const session = sessionToken ? await verifyToken(sessionToken) : null;
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const priority = searchParams.get('priority');

    const where: any = { organizationId: session.organizationId };
    if (status) where.status = status;
    if (priority) where.priority = priority;

    const tickets = await prisma.supportTicket.findMany({
      where,
      orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
      take: 100,
      include: { notes: { orderBy: { createdAt: 'desc' }, take: 3 } },
    });

    return NextResponse.json({ tickets });
  } catch (err: any) {
    console.error('[SUPPORT GET]', err);
    return NextResponse.json({ error: 'Failed to fetch tickets' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const sessionToken = request.cookies.get(COOKIE_NAME)?.value;
    const session = sessionToken ? await verifyToken(sessionToken) : null;
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const { customerName, title, description, priority, category } = body;

    if (!customerName || !title || !description) {
      return NextResponse.json({ error: 'customerName, title, and description are required' }, { status: 400 });
    }

    const ticketNumber = `TKT-${Date.now()}`;
    const ticket = await prisma.supportTicket.create({
      data: {
        organizationId: session.organizationId,
        ticketNumber,
        customerName,
        title,
        description,
        priority: priority || 'MEDIUM',
        status: 'OPEN',
        category: category || 'GENERAL',
        createdById: session.userId,
      },
    });

    return NextResponse.json({ ticket }, { status: 201 });
  } catch (err: any) {
    console.error('[SUPPORT POST]', err);
    return NextResponse.json({ error: 'Failed to create ticket' }, { status: 500 });
  }
}
