const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const configs = await prisma.aiProviderConfig.findMany();
  console.log('Configs count:', configs.length);
  for (const c of configs) {
    console.log(`Org: ${c.organizationId}, Provider: ${c.provider}, Status: ${c.status}, Model: ${c.preferredModel}`);
  }
}

main().finally(() => prisma.$disconnect());
