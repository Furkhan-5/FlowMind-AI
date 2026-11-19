process.env.DATABASE_URL = process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:5432/flowmind_db?schema=public";
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const wf = await prisma.workflow.findUnique({
    where: { id: 'WF-1794996706285' },
    include: {
      versions: { orderBy: { versionNumber: 'desc' } },
      executions: { orderBy: { startedAt: 'desc' } }
    }
  });

  console.log('--- WORKFLOW RECORD ---');
  console.log(JSON.stringify(wf, null, 2));
}

main().finally(() => prisma.$disconnect());
