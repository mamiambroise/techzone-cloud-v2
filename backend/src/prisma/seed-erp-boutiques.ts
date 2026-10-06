import 'dotenv/config';
import { config } from 'dotenv';
config({ path: '.env.local', override: true });
import { createSeedPrismaClient } from './seed-client';
import { encryptErpKey } from '../erp-registry/erp-credentials';

const BOUTIQUES = [
  {
    tenantId: '0cf0f403-cc60-5128-ad92-305c010ba199',
    code: 'dolibarr_wifi_services',
    nom: 'Dolibarr — Techzone WiFi Services',
  },
  {
    tenantId: '672202ea-22ad-579d-abc7-9c3c5998388a',
    code: 'dolibarr_informatique',
    nom: 'Dolibarr — Techzone Informatique',
  },
];

async function main() {
  const prisma = createSeedPrismaClient();
  const url = (process.env.DOLIBARR_URL || '').trim();
  const apiKey = (process.env.DOLIBARR_API_KEY || '').trim();
  const entity = Number(process.env.DOLIBARR_ENTITY) || 1;

  if (!url || !apiKey) {
    console.error('MISSING_EXTERNAL_CREDENTIAL: DOLIBARR_URL / DOLIBARR_API_KEY absents de .env.local');
    process.exit(1);
  }

  console.log('=== Provisioning ERP connectors (Phase 10) ===');
  for (const boutique of BOUTIQUES) {
    const existing = await prisma.eRPRegistry.findUnique({
      where: { tenantId_code: { tenantId: boutique.tenantId, code: boutique.code } },
    });
    const capabilities = {
      ...((existing?.capabilities || {}) as Record<string, unknown>),
      environment: 'production',
      entity,
      encryptedApiKey: encryptErpKey(apiKey, boutique.tenantId),
    };
    const erp = await prisma.eRPRegistry.upsert({
      where: { tenantId_code: { tenantId: boutique.tenantId, code: boutique.code } },
      update: { nom: boutique.nom, type: 'DOLIBARR', url, status: 'ACTIVE', capabilities },
      create: {
        tenantId: boutique.tenantId,
        code: boutique.code,
        nom: boutique.nom,
        type: 'DOLIBARR',
        url,
        status: 'ACTIVE',
        capabilities,
        healthStatus: 'unknown',
      },
    });
    console.log(`PROVISIONED code=${boutique.code} tenant=${boutique.tenantId} id=${erp.id} url=${url}`);
  }

  const all = await prisma.eRPRegistry.findMany({
    select: { tenantId: true, code: true, nom: true, type: true, url: true, status: true, healthStatus: true },
    orderBy: { createdAt: 'asc' },
  });
  console.log('\n=== erp_registry rows ===');
  for (const row of all) console.log(JSON.stringify(row));

  await prisma.$disconnect();
}

main()
  .catch((e) => {
    console.error('Script failed:', e);
    process.exit(1);
  });
