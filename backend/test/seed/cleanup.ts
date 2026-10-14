import type { PrismaService } from '../../src/prisma/prisma.service.js';
import { SEED_IDS } from './fixtures.js';

export async function cleanupGlobalSeed(prisma: PrismaService, dryRun: boolean) {
  const detail = 'Only deterministic techzone-global-seed-v1 IDs and TEST_SEED registry records are removed';
  if (dryRun) return detail;
  const db: any = prisma;
  await db.uiPage.deleteMany({ where: { id: SEED_IDS.pageA } });
  await db.bmEntity.deleteMany({ where: { id: SEED_IDS.entityProductA } });
  try { await db.registryEntry.deleteMany({ where: { sourceModule: 'TEST_SEED' } }); } catch (error: any) { if (error?.code !== 'P2021') throw error; }
  await db.environment.deleteMany({ where: { id: { in: [SEED_IDS.environmentADev, SEED_IDS.environmentAStaging, SEED_IDS.environmentBDev] } } });
  await db.applicationVersion.deleteMany({ where: { id: { in: [SEED_IDS.versionA, SEED_IDS.versionB] } } });
  await db.application.deleteMany({ where: { id: { in: [SEED_IDS.appA, SEED_IDS.appB] } } });
  await db.iamUser.deleteMany({ where: { id: { in: [SEED_IDS.userAdminA, SEED_IDS.userReaderA, SEED_IDS.userAdminB] } } });
  await db.tenant.deleteMany({ where: { id: { in: [SEED_IDS.tenantA, SEED_IDS.tenantB] } } });
  return detail;
}
