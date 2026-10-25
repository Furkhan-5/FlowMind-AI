import crypto from 'crypto';

export interface EncryptedPayload {
  ciphertext: string; // Hex-encoded ciphertext
  iv: string;         // 12-byte Hex-encoded Initialization Vector / Nonce
  authTag: string;    // 16-byte Hex-encoded GCM Authentication Tag
}

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH_BYTES = 12; // 96-bit nonce standard for AES-GCM
const AUTH_TAG_LENGTH_BYTES = 16; // 128-bit authentication tag

/**
 * Resolves the 256-bit (32 bytes) master encryption key.
 * In production, fails closed if ENCRYPTION_MASTER_KEY is missing or invalid.
 */
function getMasterKey(): Buffer {
  const envKey = process.env.ENCRYPTION_MASTER_KEY;

  if (envKey) {
    if (envKey.length === 64) {
      // 64-char hex string
      return Buffer.from(envKey, 'hex');
    }
    if (Buffer.byteLength(envKey, 'utf8') === 32) {
      return Buffer.from(envKey, 'utf8');
    }
    // If arbitrary string, derive 32-byte key using SHA-256
    return crypto.createHash('sha256').update(envKey).digest();
  }

  if (process.env.NODE_ENV === 'production') {
    throw new Error(
      '[CRITICAL_SECURITY_ERROR] ENCRYPTION_MASTER_KEY is not defined in production environment. Refusing to operate with fallback.'
    );
  }

  // Development & Test deterministic fallback key
  const devSeed = 'flowmind-ai-production-grade-aes-256-gcm-master-key-seed-2026';
  return crypto.createHash('sha256').update(devSeed).digest();
}

export const encryptionService = {
  /**
   * Encrypts plaintext secret using AES-256-GCM with a cryptographically secure unique IV per encryption.
   */
  encryptSecret(plaintext: string): EncryptedPayload {
    if (!plaintext || typeof plaintext !== 'string') {
      throw new Error('Invalid secret input: plaintext must be a non-empty string');
    }

    const masterKey = getMasterKey();
    const iv = crypto.randomBytes(IV_LENGTH_BYTES);
    const cipher = crypto.createCipheriv(ALGORITHM, masterKey, iv, {
      authTagLength: AUTH_TAG_LENGTH_BYTES,
    });

    let ciphertext = cipher.update(plaintext, 'utf8', 'hex');
    ciphertext += cipher.final('hex');
    const authTag = cipher.getAuthTag().toString('hex');

    return {
      ciphertext,
      iv: iv.toString('hex'),
      authTag,
    };
  },

  /**
   * Decrypts AES-256-GCM ciphertext and validates the 16-byte authentication tag.
   * Throws an error if ciphertext or auth tag has been tampered with.
   */
  decryptSecret(ciphertext: string, ivHex: string, authTagHex: string): string {
    if (!ciphertext || !ivHex || !authTagHex) {
      throw new Error('Invalid decryption input: ciphertext, iv, and authTag are required');
    }

    const masterKey = getMasterKey();
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');

    if (iv.length !== IV_LENGTH_BYTES) {
      throw new Error(`Invalid IV length: expected ${IV_LENGTH_BYTES} bytes`);
    }
    if (authTag.length !== AUTH_TAG_LENGTH_BYTES) {
      throw new Error(`Invalid AuthTag length: expected ${AUTH_TAG_LENGTH_BYTES} bytes`);
    }

    const decipher = crypto.createDecipheriv(ALGORITHM, masterKey, iv, {
      authTagLength: AUTH_TAG_LENGTH_BYTES,
    });

    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(ciphertext, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  },

  /**
   * Safely masks an API key for UI rendering or audit logs.
   * Never exposes more than the prefix and suffix (e.g., "sk-...c4a2" or "AIza...9d7e").
   */
  maskApiKey(apiKey: string): string {
    if (!apiKey || typeof apiKey !== 'string') return '••••••••';
    const trimmed = apiKey.trim();
    if (trimmed.length <= 8) return '••••••••';

    if (trimmed.startsWith('sk-')) {
      const suffix = trimmed.slice(-4);
      return `sk-••••••••${suffix}`;
    }
    if (trimmed.startsWith('AIza')) {
      const suffix = trimmed.slice(-4);
      return `AIza••••••••${suffix}`;
    }

    const prefix = trimmed.slice(0, 3);
    const suffix = trimmed.slice(-4);
    return `${prefix}••••••••${suffix}`;
  },

  /**
   * Returns a sanitized copy of an object by stripping or masking sensitive keys.
   */
  sanitizeRecord<T extends Record<string, any>>(record: T): Partial<T> {
    if (!record || typeof record !== 'object') return record;
    const sanitized: any = Array.isArray(record) ? [] : {};
    const SENSITIVE_KEYS = new Set([
      'apikey',
      'encryptedapikey',
      'rawkey',
      'secret',
      'password',
      'passwordhash',
      'authtag',
      'iv',
      'ciphertext',
    ]);

    for (const [key, value] of Object.entries(record)) {
      const lower = key.toLowerCase();
      if (SENSITIVE_KEYS.has(lower)) {
        sanitized[key] = '[REDACTED_CONFIDENTIAL]';
      } else if (value && typeof value === 'object') {
        sanitized[key] = this.sanitizeRecord(value);
      } else {
        sanitized[key] = value;
      }
    }
    return sanitized;
  },
};
