import { NextRequest, NextResponse } from 'next/server';
import { analyticsService } from '@/lib/services/analyticsService';
import { proactiveInsightsService } from '@/lib/services/proactiveInsightsService';
import { getCurrentUserFromSession } from '@/lib/auth/session';
import { User, UserRole } from '@/types';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const session = await getCurrentUserFromSession();
    const searchParams = request.nextUrl.searchParams;
    const timeRange = searchParams.get('timeRange') || '30d';

    const orgId = session?.organizationId || 'ORG-01';
    const role: UserRole = (session?.role as UserRole) || 'ADMIN';

    const [kpis, timeSeries, pipelineFunnel, supportDistributions, proactiveInsights] =
      await Promise.all([
        analyticsService.getExecutiveKpis(orgId, role),
        analyticsService.getTimeSeriesTrends(orgId, timeRange),
        analyticsService.getPipelineFunnel(orgId),
        analyticsService.getSupportDistributions(orgId),
        proactiveInsightsService.getInsights(orgId),
      ]);

    return NextResponse.json({
      success: true,
      timeRange,
      kpis,
      timeSeries,
      pipelineFunnel,
      supportDistributions,
      proactiveInsights,
    });
  } catch (err: any) {
    console.error('[API Analytics] Error fetching analytics data:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to fetch analytics metrics' },
      { status: 500 }
    );
  }
}
