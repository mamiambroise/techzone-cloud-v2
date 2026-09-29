import 'dotenv/config';
import { PrismaClient } from '../generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const connectionString =
  process.env.DATABASE_URL ||
  'postgresql://techzone_local:ZT40lPEfW%2FA7Zq0Q5huY5S6Quoc5Z1QXTkO19TxNSR0%3D@127.0.0.1:55432/techzonecloud_local?schema=business_manager';

const schema = new URL(connectionString).searchParams.get('schema') || 'public';

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString }, { schema }),
});

const TENANT_ID = '8031055e-14af-4b43-979f-904e820306e9';

async function main() {
  console.log('=== ERP Registry Check ===');

  // 1. Check existing records for the tenant
  const existing = await prisma.eRPRegistry.findMany({
    where: { tenantId: TENANT_ID },
  });

  if (existing.length > 0) {
    console.log(`Found ${existing.length} ERP record(s) for tenant ${TENANT_ID}:`);
    existing.forEach((r) => {
      console.log(JSON.stringify(r, null, 2));
    });
  } else {
    console.log(`No ERP records found for tenant ${TENANT_ID}. Creating one...`);
  }

  // 2. Upsert the active Dolibarr instance
  const erp = await prisma.eRPRegistry.upsert({
    where: { tenantId_code: { tenantId: TENANT_ID, code: 'dolibarr_prod' } },
    update: {
      nom: 'Dolibarr Production',
      type: 'DOLIBARR',
      url: 'http://167.86.71.186:8082',
      status: 'ACTIVE',
      capabilities: {},
      healthStatus: 'unknown',
    },
    create: {
      tenantId: TENANT_ID,
      code: 'dolibarr_prod',
      nom: 'Dolibarr Production',
      type: 'DOLIBARR',
      url: 'http://167.86.71.186:8082',
      status: 'ACTIVE',
      capabilities: {},
      healthStatus: 'unknown',
    },
  });

  console.log('\n=== ERP Registry Record ===');
  console.log(JSON.stringify(erp, null, 2));

  // 3. Verify the active record is retrievable
  const active = await prisma.eRPRegistry.findFirst({
    where: { tenantId: TENANT_ID, status: 'ACTIVE' },
  });

  console.log('\n=== Active ERP for tenant ===');
  console.log(JSON.stringify(active, null, 2));

  if (active) {
    console.log('\nSUCCESS: Active ERP instance found for tenant.');
  } else {
    console.log('\nERROR: No active ERP instance found for tenant.');
  }
}

main()
  .catch((e) => {
    console.error('Script failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
