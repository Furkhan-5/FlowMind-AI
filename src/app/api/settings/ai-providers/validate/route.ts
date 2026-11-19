import { NextRequest, NextResponse } from 'next/server';
import { aiProviderConfigService } from '@/lib/services/aiProviderConfigService';
import { getCurrentUserFromSession } from '@/lib/auth/session';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

export async function POST(request: NextRequest) {
  try {
    const session = await getCurrentUserFromSession();
    const role = session?.role || 'ADMIN';

    if (role !== 'ADMIN') {
      return NextResponse.json(
        {
          success: false,
          error: 'ACCESS_DENIED: Only administrators may test provider keys.',
        },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { provider, apiKey } = body;

    if (!provider || !apiKey) {
      return NextResponse.json(
        { success: false, error: 'Provider and API key are required for validation probe' },
        { status: 400 }
      );
    }

    const result = await aiProviderConfigService.validateProviderKey(provider, apiKey);

    return NextResponse.json({
      success: true,
      valid: result.valid,
      error: result.error,
      latencyMs: result.latencyMs,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Key validation probe failed' },
      { status: 500 }
    );
  }
}
