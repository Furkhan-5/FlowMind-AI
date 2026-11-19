const { PrismaClient } = require('@prisma/client');
const crypto = require('crypto');
const fs = require('fs');
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

function decrypt(ciphertext, iv, authTag) {
  const masterKey = getMasterKey();
  const decipher = crypto.createDecipheriv('aes-256-gcm', masterKey, Buffer.from(iv, 'hex'), {
    authTagLength: 16,
  });
  decipher.setAuthTag(Buffer.from(authTag, 'hex'));
  let plaintext = decipher.update(ciphertext, 'hex', 'utf8');
  plaintext += decipher.final('utf8');
  return plaintext;
}

function mask(key) {
  if (!key || key.length < 8) return '••••';
  return key.substring(0, 4) + '••••' + key.substring(key.length - 4);
}

async function main() {
  // Load .env.local if exists
  let envKey = '';
  if (fs.existsSync('.env.local')) {
    const lines = fs.readFileSync('.env.local', 'utf8').split(/\r?\n/);
    const m = lines.find(l => l.startsWith('GEMINI_API_KEY='));
    if (m) envKey = m.substring('GEMINI_API_KEY='.length).trim();
  }

  const configs = await prisma.aiProviderConfig.findMany();
  for (const c of configs) {
    try {
      const dec = decrypt(c.encryptedApiKey, c.iv, c.authTag);
      console.log(`Org: ${c.organizationId}, Provider: ${c.provider}, Masked: ${mask(dec)}, Matches .env.local: ${dec === envKey}`);
    } catch (e) {
      console.log(`Failed decrypt: ${e.message}`);
    }
  }
}

main().finally(() => prisma.$disconnect());
