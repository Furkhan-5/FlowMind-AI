import { NextRequest, NextResponse } from 'next/server';
import { ragService } from '@/lib/services/ragService';
import { getCurrentUserFromSession } from '@/lib/auth/session';
import { User, UserRole } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const session = await getCurrentUserFromSession();
    const body = await request.json();
    const query = body.query;

    if (!query || typeof query !== 'string' || !query.trim()) {
      return NextResponse.json(
        { success: false, error: 'Query parameter is required' },
        { status: 400 }
      );
    }

    const user: User = session
      ? {
          id: session.userId,
          name: session.name,
          email: session.email,
          role: (session.role as UserRole) || 'EMPLOYEE',
          avatar: '',
          preferredLanguage: 'en',
          organizationId: session.organizationId || 'ORG-01',
        }
      : {
          id: 'USR-DEV-01',
          name: 'Knowledge Researcher',
          email: 'research@flowmind.ai',
          role: 'ADMIN',
          avatar: '',
          preferredLanguage: 'en',
          organizationId: 'ORG-01',
        };

    const result = await ragService.queryKnowledgeBase(query.trim(), user);

    return NextResponse.json({
      success: true,
      result,
    });
  } catch (err: any) {
    console.error('[API Knowledge Query] Error querying knowledge base:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to process RAG knowledge query' },
      { status: 500 }
    );
  }
}
