import { NextResponse } from 'next/server';
import { aiProviderService } from '@/lib/ai/aiProviderService';
import { PROVIDER_ALLOWLISTS } from '@/lib/services/aiProviderConfigService';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const telemetry = aiProviderService.getTelemetry();
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
