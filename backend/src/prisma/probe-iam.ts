import 'dotenv/config';
import { config } from 'dotenv';
config({ path: '.env.local', override: true });
import { createSeedPrismaClient } from './seed-client';

async function main() {
  const prisma = createSeedPrismaClient();
  try {
    const user = await prisma.iamUser.findFirst({ where: { username: 'bm.demo' }, select: { id: true, username: true, isAdmin: true } });
    console.log('bm.demo:', JSON.stringify(user));
    const assignments = await prisma.roleAssignment.findMany({
      where: { userId: user!.id, tenantId: { in: ['0cf0f403-cc60-5128-ad92-305c010ba199', '672202ea-22ad-579d-abc7-9c3c5998388a'] } },
      select: { tenantId: true, role: { select: { code: true, name: true } } },
    });
    console.log('bm.demo assignments:', JSON.stringify(assignments, null, 1));
    const all = await prisma.roleAssignment.findMany({
      select: { userId: true, tenantId: true, role: { select: { code: true } } },
    });
    console.log('all assignments:', JSON.stringify(all, null, 1));
  } catch (e: any) {
    console.error('ERR', e.message);
  }
  await prisma.$disconnect();
}

main();
