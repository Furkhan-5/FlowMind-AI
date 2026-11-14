import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken, COOKIE_NAME } from '@/lib/auth/session';

export async function GET(request: NextRequest) {
  try {
    const sessionToken = request.cookies.get(COOKIE_NAME)?.value;
    const session = sessionToken ? await verifyToken(sessionToken) : null;
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const stage = searchParams.get('stage');
    const search = searchParams.get('search');
    const limit = parseInt(searchParams.get('limit') || '100');

    const where: any = { organizationId: session.organizationId };
    if (stage) where.stage = stage;
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { company: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    const leads = await prisma.lead.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: { stageHistory: { orderBy: { timestamp: 'desc' }, take: 5 } },
    });

    return NextResponse.json({ leads });
  } catch (err: any) {
    console.error('[CRM GET]', err);
    return NextResponse.json({ error: 'Failed to fetch leads' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const sessionToken = request.cookies.get(COOKIE_NAME)?.value;
    const session = sessionToken ? await verifyToken(sessionToken) : null;
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    if (session.role === 'EMPLOYEE') {
      return NextResponse.json({ error: 'Insufficient permissions to create leads' }, { status: 403 });
    }

    const body = await request.json();
    const { name, email, phone, company, source, value, notes, tags } = body;

    if (!name || !email || !company) {
      return NextResponse.json({ error: 'name, email, and company are required' }, { status: 400 });
    }

    const lead = await prisma.lead.create({
      data: {
        organizationId: session.organizationId,
        name,
        email,
        phone,
        company,
        source: source || 'MANUAL',
        stage: 'NEW',
        status: 'ACTIVE',
        value: value || 0,
        notes,
        tags: tags || [],
        ownerId: session.userId,
      },
    });

    return NextResponse.json({ lead }, { status: 201 });
  } catch (err: any) {
    console.error('[CRM POST]', err);
    return NextResponse.json({ error: 'Failed to create lead' }, { status: 500 });
  }
}
