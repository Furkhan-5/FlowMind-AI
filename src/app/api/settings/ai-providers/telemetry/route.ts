import { NextResponse } from 'next/server';
import { aiProviderService } from '@/lib/ai/aiProviderService';
import { PROVIDER_ALLOWLISTS } from '@/lib/services/aiProviderConfigService';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    let telemetry = aiProviderService.getTelemetry();

    if (telemetry.totalRequests === 0) {
      try {
        const logs = await prisma.auditLog.findMany({
          where: { action: 'AI_PROVIDER_DISPATCH' },
          orderBy: { createdAt: 'desc' },
          take: 100,
        });

        if (logs.length > 0) {
          const successful = logs.filter((l: any) => l.details && (l.details as any).success).length;
          const totalLatency = logs.reduce((acc: number, l: any) => acc + (Number((l.details as any)?.latencyMs) || 0), 0);
          const distribution: Record<string, number> = { GEMINI: 0, OPENAI: 0, DETERMINISTIC_FALLBACK: 0 };
          logs.forEach((l: any) => {
            const prov = (l.details as any)?.provider || 'GEMINI';
            distribution[prov] = (distribution[prov] || 0) + 1;
          });

          telemetry = {
            ...telemetry,
            totalRequests: logs.length,
            successfulRequests: successful,
            failedRequests: logs.length - successful,
            averageLatencyMs: Math.round(totalLatency / logs.length),
            lastCallAt: logs[0].createdAt.toISOString(),
            providerDistribution: distribution,
          };
        }
      } catch {
        // Fallback to in-memory stats
      }
    }

    return NextResponse.json({
      success: true,
      telemetry,
      allowlists: PROVIDER_ALLOWLISTS,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to fetch telemetry' },
      { status: 500 }
    );
  }
}
