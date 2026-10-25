import { aiProviderConfigService } from '@/lib/services/aiProviderConfigService';
import { prisma } from '@/lib/prisma';

describe('BYOK Config Service — Integration & Access Control', () => {
  const orgId = 'TEST-ORG-BYOK-01';
  const adminUserId = 'USER-ADMIN-01';
  const employeeUserId = 'USER-EMPLOYEE-01';

  beforeAll(async () => {
    // Ensure test org exists in db
    await prisma.organization.upsert({
      where: { slug: 'test-org-byok' },
      update: {},
      create: {
        id: orgId,
        name: 'Test BYOK Organization',
        slug: 'test-org-byok',
      },
    });
  });

  afterAll(async () => {
    // Clean up test configs and org
    await prisma.aiProviderConfig.deleteMany({ where: { organizationId: orgId } }).catch(() => {});
    await prisma.organization.delete({ where: { id: orgId } }).catch(() => {});
  });

  test('ADMIN can successfully save encrypted BYOK configuration for Gemini', async () => {
    const rawKey = 'AIzaSyTestGeminiValidMockKey1234567890';
    const config = await aiProviderConfigService.saveProviderConfig({
      organizationId: orgId,
      provider: 'GEMINI',
      rawApiKey: rawKey,
      preferredModel: 'gemini-1.5-flash',
      userRole: 'ADMIN',
      userId: adminUserId,
      skipLiveValidation: true, // test in unit environment
    });

    expect(config).toBeDefined();
    expect(config.provider).toBe('GEMINI');
    expect(config.status).toBe('ACTIVE');
    expect(config.preferredModel).toBe('gemini-1.5-flash');
    expect(config.keySuffix).toContain('AIza');
    expect(config.keySuffix).toContain('7890');
    expect(config.keySuffix).not.toContain('ValidMockKey');
  });

  test('ADMIN can save encrypted BYOK configuration for OpenAI', async () => {
    const rawKey = 'sk-proj-testOpenAiSecretKeyProduction998877';
    const config = await aiProviderConfigService.saveProviderConfig({
      organizationId: orgId,
      provider: 'OPENAI',
      rawApiKey: rawKey,
      preferredModel: 'gpt-4o-mini',
      userRole: 'ADMIN',
      userId: adminUserId,
      skipLiveValidation: true,
    });

    expect(config).toBeDefined();
    expect(config.provider).toBe('OPENAI');
    expect(config.keySuffix).toContain('sk-');
    expect(config.keySuffix).toContain('877');
    expect(config.keySuffix).not.toContain('SecretKeyProduction');
  });

  test('EMPLOYEE role cannot save BYOK keys and is blocked with ACCESS_DENIED', async () => {
    await expect(
      aiProviderConfigService.saveProviderConfig({
        organizationId: orgId,
        provider: 'GEMINI',
        rawApiKey: 'AIzaSyUnauthorizedEmployeeKey999',
        userRole: 'EMPLOYEE',
        userId: employeeUserId,
        skipLiveValidation: true,
      })
    ).rejects.toThrow(/ACCESS_DENIED/);
  });

  test('getProviderConfigs never leaks raw ciphertexts, IVs, or auth tags to clients', async () => {
    const configs = await aiProviderConfigService.getProviderConfigs(orgId, 'ADMIN');

    expect(configs.length).toBeGreaterThanOrEqual(2);
    configs.forEach((cfg) => {
      expect((cfg as any).encryptedApiKey).toBeUndefined();
      expect((cfg as any).iv).toBeUndefined();
      expect((cfg as any).authTag).toBeUndefined();
      expect(cfg.keySuffix).toBeDefined();
      expect(cfg.keySuffix).toContain('••••••••');
    });
  });

  test('ADMIN can safely revoke/delete a BYOK configuration', async () => {
    const deleted = await aiProviderConfigService.deleteProviderConfig(
      orgId,
      'OPENAI',
      'ADMIN',
      adminUserId
    );

    expect(deleted).toBe(true);

    const runtimeKey = await aiProviderConfigService.getDecryptedKeyForRuntime(orgId, 'OPENAI');
    expect(runtimeKey).toBeNull();
  });

  test('EMPLOYEE role cannot delete BYOK provider configuration', async () => {
    await expect(
      aiProviderConfigService.deleteProviderConfig(
        orgId,
        'GEMINI',
        'EMPLOYEE',
        employeeUserId
      )
    ).rejects.toThrow(/ACCESS_DENIED/);
  });
});
