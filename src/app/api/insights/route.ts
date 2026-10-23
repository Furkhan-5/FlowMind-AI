import { NextRequest, NextResponse } from 'next/server';
import { proactiveInsightsService } from '@/lib/services/proactiveInsightsService';
import { getCurrentUserFromSession } from '@/lib/auth/session';
import { User, UserRole, InsightStatus } from '@/types';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const session = await getCurrentUserFromSession();
    const orgId = session?.organizationId || 'ORG-01';

    const insights = await proactiveInsightsService.scanAndDetectInsights(orgId);

    return NextResponse.json({
      success: true,
      insights,
      count: insights.length,
    });
  } catch (err: any) {
    console.error('[API Insights] Error fetching proactive insights:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to fetch proactive insights' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getCurrentUserFromSession();
    const body = await request.json();
    const { insightId, status } = body;

    if (!insightId || !status) {
      return NextResponse.json(
        { success: false, error: 'insightId and status are required' },
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

    const updated = await proactiveInsightsService.updateInsightStatus(
      insightId,
      status as InsightStatus,
      user
    );

    if (!updated) {
      return NextResponse.json(
        { success: false, error: 'Insight not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      insight: updated,
    });
  } catch (err: any) {
    console.error('[API Insights Patch] Error updating insight status:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to update insight status' },
      { status: 500 }
    );
  }
}
