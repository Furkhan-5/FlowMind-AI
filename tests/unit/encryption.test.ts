import { encryptionService } from '@/lib/security/encryptionService';

describe('EncryptionService — AES-256-GCM BYOK Security', () => {
  const sampleKeyOpenAI = 'sk-proj-abc123xyz789FlowMindAIProductionSecretKey9988';
  const sampleKeyGemini = 'AIzaSyFlowMindEnterpriseDynamicGeminiKey7744';

  test('should successfully encrypt and decrypt an OpenAI API key without data corruption', () => {
    const encrypted = encryptionService.encryptSecret(sampleKeyOpenAI);

    expect(encrypted.ciphertext).toBeDefined();
    expect(encrypted.iv).toHaveLength(24); // 12 bytes = 24 hex characters
    expect(encrypted.authTag).toHaveLength(32); // 16 bytes = 32 hex characters

    const decrypted = encryptionService.decryptSecret(
      encrypted.ciphertext,
      encrypted.iv,
      encrypted.authTag
    );

    expect(decrypted).toBe(sampleKeyOpenAI);
  });

  test('should successfully encrypt and decrypt a Google Gemini API key', () => {
    const encrypted = encryptionService.encryptSecret(sampleKeyGemini);
    const decrypted = encryptionService.decryptSecret(
      encrypted.ciphertext,
      encrypted.iv,
      encrypted.authTag
    );

    expect(decrypted).toBe(sampleKeyGemini);
  });

  test('should generate a unique IV on every encryption call (indistinguishability under chosen-plaintext attack)', () => {
    const enc1 = encryptionService.encryptSecret(sampleKeyOpenAI);
    const enc2 = encryptionService.encryptSecret(sampleKeyOpenAI);

    expect(enc1.iv).not.toBe(enc2.iv);
    expect(enc1.ciphertext).not.toBe(enc2.ciphertext);
  });

  test('should detect tampering with ciphertext and throw authentication verification error', () => {
    const encrypted = encryptionService.encryptSecret(sampleKeyOpenAI);

    // Flip a bit in the ciphertext hex string
    const tamperedCipher =
      encrypted.ciphertext.slice(0, -2) +
      (encrypted.ciphertext.slice(-2) === 'aa' ? 'bb' : 'aa');

    expect(() => {
      encryptionService.decryptSecret(
        tamperedCipher,
        encrypted.iv,
        encrypted.authTag
      );
    }).toThrow();
  });

  test('should detect tampering with authentication tag and fail closed', () => {
    const encrypted = encryptionService.encryptSecret(sampleKeyOpenAI);

    const tamperedTag =
      'ff' + encrypted.authTag.slice(2);

    expect(() => {
      encryptionService.decryptSecret(
        encrypted.ciphertext,
        encrypted.iv,
        tamperedTag
      );
    }).toThrow();
  });

  test('maskApiKey should properly obfuscate keys without leaking sensitive middle payload', () => {
    const maskedOpenAI = encryptionService.maskApiKey(sampleKeyOpenAI);
    expect(maskedOpenAI).toContain('sk-');
    expect(maskedOpenAI).toContain('••••••••');
    expect(maskedOpenAI).toContain('9988');
    expect(maskedOpenAI).not.toContain('FlowMindAIProductionSecretKey');

    const maskedGemini = encryptionService.maskApiKey(sampleKeyGemini);
    expect(maskedGemini).toContain('AIza');
    expect(maskedGemini).toContain('••••••••');
    expect(maskedGemini).toContain('7744');
    expect(maskedGemini).not.toContain('EnterpriseDynamic');
  });

  test('sanitizeRecord should recursively scrub sensitive fields from objects', () => {
    const dirtyPayload = {
      id: 'cfg-1',
      provider: 'OPENAI',
      apiKey: 'sk-secret-1234',
      encryptedApiKey: 'abcdef',
      authTag: '123456',
      iv: '789012',
      nested: {
        password: 'admin-password',
        safeProperty: 'allowed-public-data',
      },
    };

    const sanitized = encryptionService.sanitizeRecord(dirtyPayload) as any;

    expect(sanitized.id).toBe('cfg-1');
    expect(sanitized.provider).toBe('OPENAI');
    expect(sanitized.apiKey).toBe('[REDACTED_CONFIDENTIAL]');
    expect(sanitized.encryptedApiKey).toBe('[REDACTED_CONFIDENTIAL]');
    expect(sanitized.nested.password).toBe('[REDACTED_CONFIDENTIAL]');
    expect(sanitized.nested.safeProperty).toBe('allowed-public-data');
  });
});
