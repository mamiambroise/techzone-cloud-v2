import * as bcrypt from 'bcrypt';
import type { PrismaService } from '../../src/prisma/prisma.service.js';
import { SEED_IDS, SEED_MARKER } from './fixtures.js';
import type { SeedModule } from './types.js';

type Result = { module: SeedModule; status: 'SEEDED' | 'SKIPPED'; detail: string };
type Handler = (prisma: PrismaService, dryRun: boolean) => Promise<Result>;
const password = 'SeedOnly!2026';

async function common(prisma: PrismaService, dryRun: boolean): Promise<Result> {
  if (dryRun) return { module: 'common', status: 'SEEDED', detail: 'Tenant A/B and TechBoutique applications would be upserted' };
  const db: any = prisma;
  await db.tenant.upsert({ where: { id: SEED_IDS.tenantA }, create: { id: SEED_IDS.tenantA, code: 'seed-tenant-a', name: 'Seed Tenant A', status: 'ACTIVE', metadata: SEED_MARKER }, update: { name: 'Seed Tenant A', status: 'ACTIVE', metadata: SEED_MARKER } });
  await db.tenant.upsert({ where: { id: SEED_IDS.tenantB }, create: { id: SEED_IDS.tenantB, code: 'seed-tenant-b', name: 'Seed Tenant B', status: 'ACTIVE', metadata: SEED_MARKER }, update: { name: 'Seed Tenant B', status: 'ACTIVE', metadata: SEED_MARKER } });
  for (const [id, tenantId, code, name, versionId] of [[SEED_IDS.appA, SEED_IDS.tenantA, 'techboutique-a', 'TechBoutique Demo A', SEED_IDS.versionA], [SEED_IDS.appB, SEED_IDS.tenantB, 'techboutique-b', 'TechBoutique Demo B', SEED_IDS.versionB]] as const) {
    await db.application.upsert({ where: { id }, create: { id, tenantId, code, name, tenantScope: 'TENANT' }, update: { name, tenantScope: 'TENANT' } });
    await db.applicationVersion.upsert({ where: { id: versionId }, create: { id: versionId, applicationId: id, tenantId, version: '1.0.0', status: 'DRAFT', releaseNotes: 'Synthetic global seed' }, update: { status: 'DRAFT', releaseNotes: 'Synthetic global seed' } });
  }
  return { module: 'common', status: 'SEEDED', detail: 'Tenant A/B, applications and draft versions' };
}

async function iam(prisma: PrismaService, dryRun: boolean): Promise<Result> {
  if (dryRun) return { module: 'iam', status: 'SEEDED', detail: 'Synthetic admin/reader identities, memberships and RBAC would be upserted' };
  const db: any = prisma;
  const users = [[SEED_IDS.userAdminA, 'seed-admin-a', 'seed-admin-a@tests.invalid', SEED_IDS.tenantA], [SEED_IDS.userReaderA, 'seed-reader-a', 'seed-reader-a@tests.invalid', SEED_IDS.tenantA], [SEED_IDS.userAdminB, 'seed-admin-b', 'seed-admin-b@tests.invalid', SEED_IDS.tenantB]] as const;
  const hash = await bcrypt.hash(password, 10);
  for (const [id, username, email, tenantId] of users) {
    await db.iamUser.upsert({ where: { id }, create: { id, username, primaryEmail: email, status: 'ACTIVE', defaultTenantId: tenantId, metadata: SEED_MARKER }, update: { status: 'ACTIVE', defaultTenantId: tenantId, metadata: SEED_MARKER } });
    await db.iamCredential.deleteMany({ where: { userId: id, type: 'PASSWORD' } });
    await db.iamCredential.create({ data: { userId: id, type: 'PASSWORD', status: 'ACTIVE', secretHash: hash, metadata: SEED_MARKER } });
    await db.membership.deleteMany({ where: { userId: id, tenantId } });
    await db.membership.create({ data: { userId: id, tenantId, status: 'ACTIVE', joinedAt: new Date(), metadata: SEED_MARKER } });
  }
  return { module: 'iam', status: 'SEEDED', detail: 'Synthetic users, password credentials and active memberships (no real sessions/secrets)' };
}

async function environment(prisma: PrismaService, dryRun: boolean): Promise<Result> {
  if (dryRun) return { module: 'environment', status: 'SEEDED', detail: 'A/DEV, A/STAGING and B/DEV environments would be upserted' };
  const db: any = prisma;
  const rows = [[SEED_IDS.environmentADev, SEED_IDS.tenantA, 'seed-a-dev', 'Seed A DEV', 'DEVELOPMENT'], [SEED_IDS.environmentAStaging, SEED_IDS.tenantA, 'seed-a-staging', 'Seed A STAGING', 'STAGING'], [SEED_IDS.environmentBDev, SEED_IDS.tenantB, 'seed-b-dev', 'Seed B DEV', 'DEVELOPMENT']] as const;
  for (const [id, tenantId, code, name, type] of rows) await db.environment.upsert({ where: { id }, create: { id, tenantId, code, name, type, status: 'ACTIVE', baseUrl: 'https://seed.invalid', configurationRef: 'TEST_SEED' }, update: { name, type, status: 'ACTIVE', configurationRef: 'TEST_SEED' } });
  return { module: 'environment', status: 'SEEDED', detail: 'Synthetic READY-equivalent active environments; no production environment' };
}

async function businessManager(prisma: PrismaService, dryRun: boolean): Promise<Result> {
  if (dryRun) return { module: 'business-manager', status: 'SEEDED', detail: 'TechBoutique Product entity and fields would be upserted' };
  const db: any = prisma;
  await db.bmEntity.upsert({ where: { id: SEED_IDS.entityProductA }, create: { id: SEED_IDS.entityProductA, applicationId: SEED_IDS.appA, applicationVersionId: SEED_IDS.versionA, tenantId: SEED_IDS.tenantA, code: 'product', name: 'Product', pluralName: 'Products', status: 'DRAFT', version: '1.0.0' }, update: { name: 'Product', status: 'DRAFT' } });
  return { module: 'business-manager', status: 'SEEDED', detail: 'Safe draft Product model; lifecycle/publish is not fabricated' };
}

async function uiBuilder(prisma: PrismaService, dryRun: boolean): Promise<Result> {
  if (dryRun) return { module: 'ui-builder', status: 'SEEDED', detail: 'Synthetic TechBoutique dashboard page would be upserted' };
  const db: any = prisma;
  await db.uiPage.upsert({ where: { id: SEED_IDS.pageA }, create: { id: SEED_IDS.pageA, tenantId: SEED_IDS.tenantA, applicationId: SEED_IDS.appA, applicationVersionId: SEED_IDS.versionA, key: 'seed-dashboard', route: '/seed-dashboard', title: 'TechBoutique Dashboard', metadata: SEED_MARKER, components: { root: 'root', nodes: { root: { id: 'root', type: 'Container', props: {}, children: [] } } } }, update: { title: 'TechBoutique Dashboard', metadata: SEED_MARKER } });
  return { module: 'ui-builder', status: 'SEEDED', detail: 'Synthetic dashboard UI definition' };
}

async function registry(prisma: PrismaService, dryRun: boolean): Promise<Result> {
  if (dryRun) return { module: 'registry', status: 'SEEDED', detail: 'Registry namespace and AVAILABLE seed entry would be upserted' };
  try {
    const db: any = prisma;
    const namespace = await db.registryNamespaceDef.upsert({ where: { namespace: 'BUSINESS' }, create: { namespace: 'BUSINESS', authority: 'BUSINESS_MANAGER', description: 'Business namespace', isGlobal: false }, update: {} });
    const existing = await db.registryEntry.findFirst({ where: { namespaceId: namespace.id, tenantId: SEED_IDS.tenantA, key: 'seed.product', version: '1.0.0' } });
    if (existing) await db.registryEntry.update({ where: { id: existing.id }, data: { status: 'AVAILABLE', metadata: SEED_MARKER } });
    else await db.registryEntry.create({ data: { namespaceId: namespace.id, subDomain: 'BUSINESS_CAPABILITY', key: 'seed.product', version: '1.0.0', type: 'CAPABILITY', owner: 'TEST_SEED', provider: 'BUSINESS_MANAGER', scope: 'TENANT', scopeId: SEED_IDS.tenantA, status: 'AVAILABLE', tenantId: SEED_IDS.tenantA, sourceModule: 'TEST_SEED', metadata: SEED_MARKER } });
    return { module: 'registry', status: 'SEEDED', detail: 'Synthetic AVAILABLE registry capability; no executable/provider state' };
  } catch (error: any) {
    if (error?.code === 'P2021') return { module: 'registry', status: 'SKIPPED', detail: 'Registry tables are not migrated in this target database' };
    throw error;
  }
}

const skipped = (module: SeedModule, detail: string): Handler => async (_prisma, dryRun) => ({ module, status: 'SKIPPED', detail: dryRun ? `dry-run: ${detail}` : detail });

export const MODULE_HANDLERS: Record<SeedModule, Handler> = {
  common, iam, tenant: async () => ({ module: 'tenant', status: 'SEEDED', detail: 'Provided by common tenant fixtures' }), environment, 'business-manager': businessManager, 'ui-builder': uiBuilder, registry,
  deployment: skipped('deployment', 'No deployment/release success state is synthesized'), 'pack-manager': skipped('pack-manager', 'Pack lifecycle is intentionally not synthesized until all invariants are available'), 'pack-runtime': skipped('pack-runtime', 'Runtime executable/resolution state is intentionally not synthesized'), data: skipped('data', 'Data-runtime providers/contracts require a published business schema'), automation: skipped('automation', 'Automation is not triggered by seed'), 'integration-hub': skipped('integration-hub', 'No external credentials or connector calls are seeded'), 'api-manager': skipped('api-manager', 'No API client credentials are seeded'), billing: skipped('billing', 'No payment/subscription lifecycle is fabricated'), administration: skipped('administration', 'No platform super-admin/delegation is fabricated'), observability: skipped('observability', 'Observability events are generated by real workflows only'),
};
