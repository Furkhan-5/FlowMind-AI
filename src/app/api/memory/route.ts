import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken, COOKIE_NAME } from '@/lib/auth/session';

// GET: retrieve memories relevant to a query
export async function GET(request: NextRequest) {
  try {
    const sessionToken = request.cookies.get(COOKIE_NAME)?.value;
    const session = sessionToken ? await verifyToken(sessionToken) : null;
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || '';
    const scope = searchParams.get('scope') || 'ALL'; // PRIVATE, ORG_SHARED, ALL

    // Keyword-based memory search with tenant isolation
    const whereClause: any = {
      organizationId: session.organizationId,
    };

    if (scope === 'PRIVATE') {
      whereClause.userId = session.userId;
      whereClause.scope = 'PRIVATE';
    } else if (scope === 'ORG_SHARED') {
      whereClause.scope = 'ORG_SHARED';
    } else {
      // ALL: private memories for this user + org-shared memories
      whereClause.OR = [
        { userId: session.userId, scope: 'PRIVATE' },
        { scope: 'ORG_SHARED' },
      ];
    }

    if (query) {
      const keywordFilter = {
        content: { contains: query, mode: 'insensitive' as const },
      };
      if (whereClause.OR) {
        whereClause.OR = whereClause.OR.map((cond: any) => ({ ...cond, ...keywordFilter }));
      } else {
        Object.assign(whereClause, keywordFilter);
      }
    }

    const userMemories = await prisma.userMemory.findMany({
      where: whereClause,
      orderBy: [{ confidence: 'desc' }, { updatedAt: 'desc' }],
      take: 20,
    });

    return NextResponse.json({ memories: userMemories });
  } catch (err: any) {
    console.error('[MEMORY GET]', err);
    return NextResponse.json({ error: 'Failed to retrieve memories' }, { status: 500 });
  }
}

// POST: save a new memory
export async function POST(request: NextRequest) {
  try {
    const sessionToken = request.cookies.get(COOKIE_NAME)?.value;
    const session = sessionToken ? await verifyToken(sessionToken) : null;
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const { memoryKey, content, source, scope, confidence, tags } = body;

    if (!memoryKey || !content) {
      return NextResponse.json({ error: 'memoryKey and content are required' }, { status: 400 });
    }

    // Upsert to prevent duplicates — use a deterministic ID from userId + memoryKey
    const id = `${session.userId.substring(0, 8)}-${memoryKey}`.substring(0, 36);
    const memory = await prisma.userMemory.upsert({
      where: { id },
      update: {
        content,
        confidence: confidence ?? 0.8,
        updatedAt: new Date(),
        tags: tags || [],
      },
      create: {
        id,
        organizationId: session.organizationId,
        userId: session.userId,
        memoryKey,
        content,
        source: source || 'CONVERSATION',
        scope: scope || 'PRIVATE',
        confidence: confidence ?? 0.8,
        tags: tags || [],
      },
    });

    return NextResponse.json({ memory }, { status: 201 });
  } catch (err: any) {
    console.error('[MEMORY POST]', err);
    return NextResponse.json({ error: 'Failed to save memory' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const sessionToken = request.cookies.get(COOKIE_NAME)?.value;
    const session = sessionToken ? await verifyToken(sessionToken) : null;
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'Memory ID required' }, { status: 400 });

    // Only allow deleting own memories
    await prisma.userMemory.deleteMany({
      where: { id, organizationId: session.organizationId, userId: session.userId },
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('[MEMORY DELETE]', err);
    return NextResponse.json({ error: 'Failed to delete memory' }, { status: 500 });
  }
}
