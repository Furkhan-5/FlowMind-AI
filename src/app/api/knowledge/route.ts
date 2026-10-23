import { NextRequest, NextResponse } from 'next/server';
import { ragService } from '@/lib/services/ragService';
import { getCurrentUserFromSession } from '@/lib/auth/session';
import { User, UserRole, DocumentFileType, DocumentAccessScope } from '@/types';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const session = await getCurrentUserFromSession();
    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get('search')?.toLowerCase() || '';
    const department = searchParams.get('department') || '';

    const orgId = session?.organizationId || 'ORG-01';
    const role: UserRole = (session?.role as UserRole) || 'ADMIN';

    let documents = await ragService.getDocuments(orgId, role);

    if (department && department !== 'ALL') {
      documents = documents.filter((d) => d.department?.toLowerCase() === department.toLowerCase());
    }

    if (search) {
      documents = documents.filter(
        (d) =>
          d.title.toLowerCase().includes(search) ||
          d.fileName.toLowerCase().includes(search) ||
          d.department?.toLowerCase().includes(search)
      );
    }

    return NextResponse.json({
      success: true,
      documents,
      count: documents.length,
    });
  } catch (err: any) {
    console.error('[API Knowledge] Error fetching knowledge documents:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to list knowledge documents' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getCurrentUserFromSession();
    const body = await request.json();

    const { title, fileName, fileType, content, accessScope, department, allowedRoles } = body;

    if (!title || !content) {
      return NextResponse.json(
        { success: false, error: 'Document title and text content are required' },
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

    const result = await ragService.ingestDocument(
      {
        title: title.trim(),
        fileName: fileName || `${title.toLowerCase().replace(/\s+/g, '_')}.txt`,
        fileType: (fileType as DocumentFileType) || 'TXT',
        content,
        accessScope: (accessScope as DocumentAccessScope) || 'ORGANIZATION',
        department: department || 'General',
        allowedRoles: allowedRoles || ['ADMIN', 'MANAGER', 'EMPLOYEE'],
      },
      user
    );

    return NextResponse.json({
      success: true,
      document: result.document,
      chunkCount: result.chunks.length,
    });
  } catch (err: any) {
    console.error('[API Knowledge] Error ingesting document:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to ingest knowledge document' },
      { status: 500 }
    );
  }
}
