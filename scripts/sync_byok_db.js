const { PrismaClient } = require('@prisma/client');
const crypto = require('crypto');
const fs = require('fs');

if (fs.existsSync('.env.local')) {
  try { process.loadEnvFile('.env.local'); } catch {}
}
if (fs.existsSync('.env')) {
  try { process.loadEnvFile('.env'); } catch {}
}

const prisma = new PrismaClient();

function getMasterKey() {
  const envKey = process.env.ENCRYPTION_MASTER_KEY;
  if (envKey) {
    if (envKey.length === 64) return Buffer.from(envKey, 'hex');
    if (Buffer.byteLength(envKey, 'utf8') === 32) return Buffer.from(envKey, 'utf8');
    return crypto.createHash('sha256').update(envKey).digest();
  }
  const devSeed = 'flowmind-ai-production-grade-aes-256-gcm-master-key-seed-2026';
  return crypto.createHash('sha256').update(devSeed).digest();
}

function encryptSecret(plaintext) {
  const masterKey = getMasterKey();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', masterKey, iv, { authTagLength: 16 });
  let ciphertext = cipher.update(plaintext, 'utf8', 'hex');
  ciphertext += cipher.final('hex');
  const authTag = cipher.getAuthTag().toString('hex');
  return { ciphertext, iv: iv.toString('hex'), authTag };
}

async function main() {
  const rawKey = process.env.GEMINI_API_KEY;
  if (!rawKey) {
    console.error('No GEMINI_API_KEY found');
    return;
  }

  const encrypted = encryptSecret(rawKey.trim());
  const updated = await prisma.aiProviderConfig.upsert({
    where: {
      organizationId_provider: {
        organizationId: 'ORG-01',
        provider: 'GEMINI'
      }
    },
    update: {
      encryptedApiKey: encrypted.ciphertext,
      iv: encrypted.iv,
      authTag: encrypted.authTag,
      preferredModel: 'gemini-flash-lite-latest',
      status: 'ACTIVE',
      lastValidatedAt: new Date()
    },
    create: {
      organizationId: 'ORG-01',
      provider: 'GEMINI',
      encryptedApiKey: encrypted.ciphertext,
      iv: encrypted.iv,
      authTag: encrypted.authTag,
      preferredModel: 'gemini-flash-lite-latest',
      status: 'ACTIVE',
      lastValidatedAt: new Date(),
      createdById: 'USER-ADMIN-01'
    }
  });

  console.log('Successfully synced encrypted Gemini BYOK record in PostgreSQL for ORG-01.');
  console.log('Status:', updated.status, 'Model:', updated.preferredModel);
}

main().finally(() => prisma.$disconnect());
