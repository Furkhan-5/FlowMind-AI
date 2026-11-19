const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function inspect() {
  console.log('--- USERS ---');
  const users = await prisma.user.findMany({ select: { id: true, email: true, name: true, role: true } });
  console.log(JSON.stringify(users, null, 2));

  console.log('--- WORKFLOW WF-1794996706285 ---');
  const wf = await prisma.workflow.findUnique({
    where: { id: 'WF-1794996706285' },
    include: {
      versions: true,
      executions: { orderBy: { startedAt: 'desc' }, take: 5 },
    },
  });
  console.log(JSON.stringify(wf, null, 2));

  await prisma.$disconnect();
}

inspect().catch(err => {
  console.error(err);
  process.exit(1);
});
