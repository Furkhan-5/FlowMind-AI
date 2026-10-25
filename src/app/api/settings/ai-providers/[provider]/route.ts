import { NextRequest, NextResponse } from 'next/server';
import { aiProviderConfigService, AiProviderType } from '@/lib/services/aiProviderConfigService';
import { getCurrentUserFromSession } from '@/lib/auth/session';

export const dynamic = 'force-dynamic';

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { provider: string } }
) {
  try {
    const session = await getCurrentUserFromSession();
    const role = session?.role || 'ADMIN';
    const userId = session?.userId || 'USER-ADMIN-01';
    const orgId = session?.organizationId || 'ORG-01';

    if (role !== 'ADMIN') {
      return NextResponse.json(
        {
          success: false,
          error: 'ACCESS_DENIED: Only administrators can revoke provider keys.',
        },
        { status: 403 }
      );
    }

    const providerUpper = params.provider?.toUpperCase() as AiProviderType;
    if (providerUpper !== 'GEMINI' && providerUpper !== 'OPENAI') {
      return NextResponse.json(
        { success: false, error: 'Invalid provider identifier' },
        { status: 400 }
      );
    }

    const deleted = await aiProviderConfigService.deleteProviderConfig(
      orgId,
      providerUpper,
      role,
      userId
    );

    return NextResponse.json({
      success: true,
      message: `Successfully revoked credentials for ${providerUpper}`,
      deleted,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to delete provider configuration' },
      { status: 500 }
    );
  }
}
