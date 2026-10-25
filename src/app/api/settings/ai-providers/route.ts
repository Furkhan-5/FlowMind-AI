import { NextRequest, NextResponse } from 'next/server';
import { aiProviderConfigService } from '@/lib/services/aiProviderConfigService';
import { getCurrentUserFromSession } from '@/lib/auth/session';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await getCurrentUserFromSession();
    const orgId = session?.organizationId || 'ORG-01';
    const role = session?.role || 'ADMIN';

    // Allow viewing masked status, but mark permissions
    const configs = await aiProviderConfigService.getProviderConfigs(orgId, role);

    return NextResponse.json({
      success: true,
      configs,
      isAdmin: role === 'ADMIN',
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to retrieve AI provider configurations' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getCurrentUserFromSession();
    const role = session?.role || 'ADMIN';
    const userId = session?.userId || 'USER-ADMIN-01';
    const orgId = session?.organizationId || 'ORG-01';

    if (role !== 'ADMIN') {
      return NextResponse.json(
        {
          success: false,
          error: 'ACCESS_DENIED: Only organization administrators are permitted to configure Bring Your Own Key (BYOK) providers.',
        },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { provider, apiKey, preferredModel, skipLiveValidation } = body;

    if (!provider || !apiKey) {
      return NextResponse.json(
        { success: false, error: 'Provider (GEMINI or OPENAI) and API key are required' },
        { status: 400 }
      );
    }

    const savedConfig = await aiProviderConfigService.saveProviderConfig({
      organizationId: orgId,
      provider,
      rawApiKey: apiKey,
      preferredModel,
      userRole: role,
      userId,
      skipLiveValidation: !!skipLiveValidation,
    });

    return NextResponse.json({
      success: true,
      message: `Successfully configured and encrypted credentials for ${provider}`,
      config: savedConfig,
    });
  } catch (err: any) {
    const status = err.message?.startsWith('ACCESS_DENIED')
      ? 403
      : err.message?.startsWith('INVALID_KEY') || err.message?.startsWith('UNSUPPORTED_PROVIDER')
      ? 400
      : 500;

    return NextResponse.json(
      { success: false, error: err.message || 'Failed to save AI provider configuration' },
      { status }
    );
  }
}
