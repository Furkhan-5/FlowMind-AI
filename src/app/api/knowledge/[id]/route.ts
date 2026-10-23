import { NextRequest, NextResponse } from 'next/server';
import { ragService } from '@/lib/services/ragService';
import { getCurrentUserFromSession } from '@/lib/auth/session';
import { User, UserRole } from '@/types';

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getCurrentUserFromSession();
    const docId = params.id;

    if (!docId) {
      return NextResponse.json(
        { success: false, error: 'Document ID is required' },
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
          name: 'Knowledge Admin',
          email: 'admin@flowmind.ai',
          role: 'ADMIN',
          avatar: '',
          preferredLanguage: 'en',
          organizationId: 'ORG-01',
        };

    const deleted = await ragService.deleteDocument(docId, user);

    return NextResponse.json({
      success: deleted,
      message: deleted ? 'Document and chunks deleted successfully' : 'Document not found',
    });
  } catch (err: any) {
    console.error('[API Knowledge Delete] Error deleting document:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to delete knowledge document' },
      { status: 500 }
    );
  }
}
