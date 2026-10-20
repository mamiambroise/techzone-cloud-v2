import 'dotenv/config';
import { createSeedPrismaClient } from './seed-client';

const prisma = createSeedPrismaClient();
const SEED_BY = 'techzone-demo-seed';
const PRICE_START = new Date('2026-01-01T00:00:00.000Z');

async function main() {
  const adminUsername = process.env.SEED_AUTH_USERNAME || 'techzone.admin';
  const admin = await prisma.iamUser.findUnique({
    where: { username: adminUsername },
    select: { id: true },
  });
  if (!admin) throw new Error(`Compte de seed ${adminUsername} absent.`);

  // Make this demo user selectable in the demo tenants without changing any
  // other user's membership.
  for (const tenantCode of ['techzone-wifi-services', 'techzone-informatique']) {
    const tenant = await prisma.tenant.findUnique({ where: { code: tenantCode } });
    if (!tenant) throw new Error(`Tenant de démo ${tenantCode} absent.`);
    const membership = await prisma.membership.findFirst({
      where: { userId: admin.id, tenantId: tenant.id, revokedAt: null },
      select: { id: true },
    });
    if (membership) {
      await prisma.membership.update({
        where: { id: membership.id },
        data: { status: 'ACTIVE', validFrom: null, validUntil: null, joinedAt: new Date() },
      });
    } else {
      await prisma.membership.create({
        data: {
          userId: admin.id,
          tenantId: tenant.id,
          status: 'ACTIVE',
          joinedAt: new Date(),
          createdBy: SEED_BY,
        },
      });
    }
  }

  const product = await prisma.billingProduct.upsert({
    where: { key: 'techzone-demo-cloud' },
    update: { name: 'Techzone Cloud — Démo', status: 'ACTIVE' },
    create: {
      key: 'techzone-demo-cloud',
      name: 'Techzone Cloud — Démo',
      description: 'Catalogue fictif pour les parcours Billing de développement.',
      status: 'ACTIVE',
      features: ['demo.applications', 'demo.users', 'demo.storage'],
      createdBy: SEED_BY,
    },
  });

  const plan = await prisma.plan.upsert({
    where: { code: 'TECHZONE-DEMO-PRO' },
    update: { name: 'Techzone Démo Pro', status: 'ACTIVE', productId: product.id },
    create: {
      code: 'TECHZONE-DEMO-PRO',
      name: 'Techzone Démo Pro',
      description: 'Plan fictif pour tester le catalogue et les droits commerciaux.',
      status: 'ACTIVE',
      billingModel: 'FLAT',
      billingInterval: 'MONTHLY',
      intervalCount: 1,
      trialDays: 14,
      productId: product.id,
      createdBy: SEED_BY,
    },
  });

  const features = [
    { code: 'demo.applications', name: 'Applications de démonstration', kind: 'LIMIT' as const, valueType: 'INTEGER' as const, integerValue: 10, unit: 'applications' },
    { code: 'demo.users', name: 'Utilisateurs de démonstration', kind: 'LIMIT' as const, valueType: 'INTEGER' as const, integerValue: 25, unit: 'utilisateurs' },
    { code: 'demo.storage', name: 'Stockage de démonstration', kind: 'QUOTA' as const, valueType: 'INTEGER' as const, integerValue: 100, unit: 'Go' },
  ];

  for (const feature of features) {
    await prisma.feature.upsert({
      where: { code: feature.code },
      update: { name: feature.name, kind: feature.kind, unit: feature.unit, status: 'ACTIVE' },
      create: { code: feature.code, name: feature.name, kind: feature.kind, unit: feature.unit, status: 'ACTIVE' },
    });
    await prisma.planEntitlement.upsert({
      where: { planId_featureCode: { planId: plan.id, featureCode: feature.code } },
      update: {
        kind: feature.kind,
        valueType: feature.valueType,
        enabled: true,
        integerValue: feature.integerValue,
        unit: feature.unit,
        enforcement: 'SOFT_LIMIT',
      },
      create: {
        planId: plan.id,
        featureCode: feature.code,
        kind: feature.kind,
        valueType: feature.valueType,
        enabled: true,
        integerValue: feature.integerValue,
        unit: feature.unit,
        enforcement: 'SOFT_LIMIT',
      },
    });
  }

  await prisma.price.upsert({
    where: {
      planId_currency_interval_intervalCount_effectiveFrom: {
        planId: plan.id,
        currency: 'MGA',
        interval: 'MONTHLY',
        intervalCount: 1,
        effectiveFrom: PRICE_START,
      },
    },
    update: { amount: '99000.00', status: 'ACTIVE' },
    create: {
      planId: plan.id,
      currency: 'MGA',
      amount: '99000.00',
      interval: 'MONTHLY',
      intervalCount: 1,
      pricingModel: 'FLAT',
      effectiveFrom: PRICE_START,
      status: 'ACTIVE',
      createdBy: SEED_BY,
    },
  });

  const wifiTenant = await prisma.tenant.findUniqueOrThrow({
    where: { code: 'techzone-wifi-services' },
    select: { id: true },
  });
  await prisma.adapterRegistry.upsert({
    where: { adapterId: 'demo-dolibarr-adapter' },
    update: { nom: 'Dolibarr — Simulation locale', status: 'active' },
    create: {
      adapterId: 'demo-dolibarr-adapter',
      nom: 'Dolibarr — Simulation locale',
      version: '1.0.0',
      erpFamily: 'DOLIBARR',
      capabilities: { mode: 'SIMULATION', liveCalls: false },
      status: 'active',
    },
  });
  const erp = await prisma.eRPRegistry.upsert({
    where: { tenantId_code: { tenantId: wifiTenant.id, code: 'demo-dolibarr' } },
    update: {
      nom: 'Dolibarr — Simulation locale',
      type: 'DOLIBARR',
      url: 'https://dolibarr.demo.invalid',
      status: 'INACTIVE',
      capabilities: { mode: 'SIMULATION', liveCalls: false },
    },
    create: {
      tenantId: wifiTenant.id,
      code: 'demo-dolibarr',
      nom: 'Dolibarr — Simulation locale',
      type: 'DOLIBARR',
      url: 'https://dolibarr.demo.invalid',
      status: 'INACTIVE',
      capabilities: { mode: 'SIMULATION', liveCalls: false },
    },
    select: { id: true },
  });

  await prisma.entityMapping.upsert({
    where: { tenantId_erpId_entity: { tenantId: wifiTenant.id, erpId: erp.id, entity: 'customer' } },
    update: {
      erpEntity: 'thirdparties',
      fieldMappings: { code: 'ref', name: 'name', email: 'email', phone: 'phone' },
      status: 'active',
    },
    create: {
      tenantId: wifiTenant.id,
      erpId: erp.id,
      entity: 'customer',
      erpEntity: 'thirdparties',
      fieldMappings: { code: 'ref', name: 'name', email: 'email', phone: 'phone' },
      status: 'active',
      version: '1.0',
    },
  });

  const customer = await prisma.businessRecord.findFirst({
    where: {
      tenantId: wifiTenant.id,
      entityCode: 'customer',
      archivedAt: null,
    },
    select: { id: true },
  });
  if (customer) {
    await prisma.externalResourceLink.upsert({
      where: {
        tenantId_connectorId_resourceType_localId: {
          tenantId: wifiTenant.id,
          connectorId: erp.id,
          resourceType: 'customer',
          localId: customer.id,
        },
      },
      update: {
        externalId: `DEMO-${customer.id}`,
        externalRef: `CLI-DEMO-${customer.id.slice(0, 8)}`,
        metadata: { mode: 'SIMULATION', liveCalls: false },
      },
      create: {
        tenantId: wifiTenant.id,
        connectorId: erp.id,
        resourceType: 'customer',
        localId: customer.id,
        externalId: `DEMO-${customer.id}`,
        externalRef: `CLI-DEMO-${customer.id.slice(0, 8)}`,
        metadata: { mode: 'SIMULATION', liveCalls: false },
      },
    });
  }

  console.log('Données supplémentaires prêtes : Billing catalogue, memberships démo, mapping ERP et ressource externe simulés (inactifs).');
}

main()
  .catch((error) => {
    console.error('Échec des données supplémentaires de démo :', error);
    process.exitCode = 1;
  })
  .finally(async () => prisma.$disconnect());
