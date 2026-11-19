const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  const leads = await prisma.lead.findMany({
    where: { organizationId: 'ORG-01' },
    orderBy: { createdAt: 'desc' },
  });
  console.log('Total leads:', leads.length);
  const first5 = leads.slice(0, 5);
  console.log('First 5:', first5.map(l => ({ id: l.id, company: l.company, value: l.value, stage: l.stage })));
  console.log('Sum of first 5 values:', first5.reduce((s, l) => s + Number(l.value), 0));
  await prisma.$disconnect();
}
check();
