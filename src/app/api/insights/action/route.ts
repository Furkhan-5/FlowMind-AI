import { NextRequest, NextResponse } from 'next/server';
import { proactiveInsightsService } from '@/lib/services/proactiveInsightsService';
import { getCurrentUserFromSession } from '@/lib/auth/session';
import { User, UserRole } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const session = await getCurrentUserFromSession();
    const body = await request.json();
    const { insightId } = body;

    if (!insightId) {
      return NextResponse.json(
        { success: false, error: 'insightId is required' },
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
          name: 'Operations Manager',
          email: 'manager@flowmind.ai',
          role: 'MANAGER',
          avatar: '',
          preferredLanguage: 'en',
          organizationId: 'ORG-01',
        };

    const actionResult = await proactiveInsightsService.executeGovernedAction(insightId, user);

    return NextResponse.json({
      success: actionResult.success,
      requiresApproval: actionResult.requiresApproval,
      message: actionResult.message,
    });
  } catch (err: any) {
    console.error('[API Insights Action] Error executing governed action:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to trigger governed action' },
      { status: 500 }
    );
  }
}
