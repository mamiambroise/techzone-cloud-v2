import { jest } from '@jest/globals';

import { PackManagerService } from './pack-manager.service';
import { PmException } from './pm.exception';

/**
 * Tests Pack Manager (PM-CDC-00 §35) : lifecycle, immutabilité,
 * validation, publication, isolation tenant. Prisma mocké — aucun DB réel.
 */

const TENANT_A = '11111111-1111-1111-1111-111111111111';
const TENANT_B = '22222222-2222-2222-2222-222222222222';
const PACK_ID = '33333333-3333-3333-3333-333333333333';
const VERSION_ID = '44444444-4444-4444-4444-444444444444';
const MODULE_ID = '55555555-5555-5555-5555-555555555555';

function fullVersion(overrides: Record<string, unknown> = {}) {
  return {
    id: VERSION_ID,
    packId: PACK_ID,
    versionNumber: '1.0.0',
    status: 'DRAFT',
    validationStatus: 'NOT_RUN',
    manifestStatus: 'NOT_GENERATED',
    tenantId: TENANT_A,
    pack: { id: PACK_ID, code: 'stock', name: 'Gestion de stock', status: 'ACTIVE' },
    modules: [{ id: MODULE_ID, code: 'inventory', name: 'Inventaire', enabled: true, orderIndex: 0 }],
    features: [
      {
        id: '66666666-6666-6666-6666-666666666661',
        code: 'stock.inventory',
        enabled: true,
        capabilities: [{ capabilityId: '66666666-6666-6666-6666-666666666671' }],
      },
    ],
    capabilities: [{ id: '66666666-6666-6666-6666-666666666671', code: 'stock.product.read', required: true }],
    dependencies: [],
    rules: [],
    ...overrides,
  };
}

/** Retourne une copie fraîche pour chaque mock (les appels successifs mutent l'objet). */
const fullVersionOf = (overrides: Record<string, unknown> = {}) => () => fullVersion(overrides);

function makePrisma(overrides: Record<string, unknown> = {}) {
  const auditEvents: unknown[] = [];
  const outboxEvents: unknown[] = [];
  const base = {
    pmPack: {
      findFirst: jest.fn(),
      findMany: jest.fn().mockResolvedValue([]),
      create: jest.fn().mockResolvedValue({ id: PACK_ID, code: 'stock', rowVersion: 1 }),
      update: jest.fn().mockResolvedValue({ id: PACK_ID, rowVersion: 2 }),
    },
    pmPackVersion: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn().mockResolvedValue([]),
      create: jest.fn().mockResolvedValue({ id: VERSION_ID, packId: PACK_ID, versionNumber: '1.0.0' }),
      update: jest.fn().mockResolvedValue({ id: VERSION_ID }),
    },
    pmModule: {
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn().mockResolvedValue({ id: MODULE_ID }),
      delete: jest.fn(),
    },
    pmFeature: { findFirst: jest.fn(), create: jest.fn(), update: jest.fn(), delete: jest.fn() },
    pmCapability: { findFirst: jest.fn(), create: jest.fn() },
    pmModuleFeature: { findFirst: jest.fn(), create: jest.fn(), upsert: jest.fn(), delete: jest.fn() },
    pmFeatureCapability: { findFirst: jest.fn(), upsert: jest.fn(), delete: jest.fn() },
    pmDependency: { findFirst: jest.fn(), findMany: jest.fn().mockResolvedValue([]), create: jest.fn(), delete: jest.fn() },
    pmRule: { findFirst: jest.fn(), findMany: jest.fn().mockResolvedValue([]), create: jest.fn(), update: jest.fn(), delete: jest.fn() },
    pmValidation: { findFirst: jest.fn(), findMany: jest.fn().mockResolvedValue([]), create: jest.fn() },
    pmManifest: { findFirst: jest.fn(), findMany: jest.fn().mockResolvedValue([]), create: jest.fn() },
    pmSnapshot: { create: jest.fn() },
    pmAuditEvent: { create: jest.fn((input: unknown) => { auditEvents.push(input); return input; }), findMany: jest.fn().mockResolvedValue([]) },
    outboxEvent: { create: jest.fn((input: unknown) => { outboxEvents.push(input); return input; }) },
    $transaction: jest.fn((fn: (tx: unknown) => Promise<unknown>) => fn(base)),
  };
  const prisma = mergeDeep(base, overrides);
  // La transaction doit voir les mêmes overrides que le service.
  (prisma as { $transaction: unknown }).$transaction = jest.fn((fn: (tx: unknown) => Promise<unknown>) => fn(prisma));
  return { prisma, auditEvents, outboxEvents };
}

/** Fusionne les overrides avec les mocks de base (méthode par méthode). */
function mergeDeep(base: Record<string, unknown>, overrides: Record<string, unknown>) {
  const merged = { ...base };
  for (const [key, value] of Object.entries(overrides)) {
    merged[key] = typeof value === 'object' && value !== null && !Array.isArray(value) ? { ...(base[key] as object), ...(value as object) } : value;
  }
  return merged;
}

describe('PackManagerService — Packs (PM-CDC-02)', () => {
  it('refuse un code de pack invalide', async () => {
    const { prisma } = makePrisma();
    const service = new PackManagerService(prisma as never);
    await expect(service.createPack(TENANT_A, { code: 'Code Invalide!', name: 'x' })).rejects.toBeInstanceOf(PmException);
  });

  it('refuse un code déjà utilisé dans le même tenant', async () => {
    const { prisma } = makePrisma({
      pmPack: {
        findFirst: jest.fn().mockResolvedValue({ id: PACK_ID, code: 'stock' }),
        create: jest.fn(),
      },
    });
    const service = new PackManagerService(prisma as never);
    await expect(service.createPack(TENANT_A, { code: 'stock', name: 'Stock' })).rejects.toMatchObject({
      code: 'PACK_CODE_ALREADY_EXISTS',
    });
  });

  it('isole les tenants : le pack d\u2019un autre tenant est introuvable', async () => {
    const { prisma } = makePrisma({
      pmPack: {
        findFirst: jest.fn().mockResolvedValue(null),
      },
    });
    const service = new PackManagerService(prisma as never);
    await expect(service.getPack(TENANT_B, PACK_ID)).rejects.toMatchObject({ code: 'PACK_NOT_FOUND' });
    expect(prisma.pmPack.findFirst).toHaveBeenCalledWith(expect.objectContaining({ where: { id: PACK_ID, tenantId: TENANT_B } }));
  });
});

describe('PackManagerService — Versions (PM-CDC-03)', () => {
  it('refuse la modification d\u2019une version PUBLISHED (immutabilité)', async () => {
    const updateModule = jest.fn();
    const { prisma } = makePrisma({
      pmModule: { findFirst: jest.fn().mockResolvedValue({ id: MODULE_ID, versionId: VERSION_ID, tenantId: TENANT_A }), update: updateModule },
      pmPackVersion: {
        findFirst: jest.fn().mockResolvedValue(fullVersion({ status: 'PUBLISHED' })),
        update: jest.fn(),
      },
    });
    const service = new PackManagerService(prisma as never);
    await expect(service.updateModule(TENANT_A, MODULE_ID, { name: 'X' })).rejects.toMatchObject({
      code: 'PACK_VERSION_IMMUTABLE',
    });
    expect(updateModule).not.toHaveBeenCalled();
  });

  it('invalide la validation après modification d\u2019une version mutable (OUTDATED)', async () => {
    const { prisma } = makePrisma({
      pmModule: { findFirst: jest.fn().mockResolvedValue({ id: MODULE_ID, versionId: VERSION_ID, tenantId: TENANT_A }) },
      pmPackVersion: {
        findFirst: jest.fn().mockResolvedValue(fullVersion()),
        update: jest.fn().mockResolvedValue({ id: VERSION_ID }),
      },
    });
    const service = new PackManagerService(prisma as never);
    await service.updateModule(TENANT_A, MODULE_ID, { name: 'Inventaire II' });
    expect(prisma.pmPackVersion.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ validationStatus: 'OUTDATED', manifestStatus: 'OUTDATED' }) }),
    );
  });

  it('refuse une transition de statut non autorisée', async () => {
    const { prisma } = makePrisma({
      pmPackVersion: { findFirst: jest.fn().mockResolvedValue(fullVersion({ status: 'DRAFT' })), update: jest.fn() },
    });
    const service = new PackManagerService(prisma as never);
    await expect(service.transitionVersion(TENANT_A, VERSION_ID, 'PUBLISHED')).rejects.toMatchObject({
      code: 'PACK_VERSION_CONFLICT',
    });
  });

  it('refuse le passage à READY sans validation VALID', async () => {
    const { prisma } = makePrisma({
      pmPackVersion: { findFirst: jest.fn().mockResolvedValue(fullVersion({ status: 'VALIDATING', validationStatus: 'NOT_RUN' })), update: jest.fn() },
    });
    const service = new PackManagerService(prisma as never);
    await expect(service.transitionVersion(TENANT_A, VERSION_ID, 'READY')).rejects.toMatchObject({
      code: 'PACK_PUBLICATION_DENIED',
    });
  });
});

describe('PackManagerService — Validation & Manifest', () => {
  it('échoue en INVALID avec un problème bloquant et renvoie la version en CONFIGURING', async () => {
    const { prisma } = makePrisma({
      pmPackVersion: {
        findFirst: jest.fn().mockResolvedValue(
          fullVersion({
            capabilities: [{ id: '66666666-6666-6666-6666-666666666671', code: 'stock.product.read', required: true }],
            features: [
              { id: '66666666-6666-6666-6666-666666666661', code: 'stock.inventory', enabled: true, capabilities: [] },
            ],
          }),
        ),
        update: jest.fn().mockResolvedValue({ id: VERSION_ID }),
      },
      pmValidation: {
        findFirst: jest.fn().mockResolvedValue(null),
        create: jest.fn().mockResolvedValue({ id: '77777777-7777-7777-7777-777777777777', status: 'INVALID', durationMs: 5 }),
      },
    });
    const service = new PackManagerService(prisma as never);
    const result = await service.validateVersion(TENANT_A, VERSION_ID, 'user-1');
    expect(result.status).toBe('INVALID');
    expect(result.blockers).toBeGreaterThan(0);
    expect(prisma.pmPackVersion.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ status: 'CONFIGURING', validationStatus: 'INVALID' }) }),
    );
  });

  it('refuse la génération du manifest sans validation VALID', async () => {
    const { prisma } = makePrisma({
      pmPackVersion: { findFirst: jest.fn().mockResolvedValue(fullVersion()), update: jest.fn() },
      pmValidation: { findFirst: jest.fn().mockResolvedValue({ status: 'INVALID' }) },
    });
    const service = new PackManagerService(prisma as never);
    await expect(service.generateManifest(TENANT_A, VERSION_ID)).rejects.toMatchObject({
      code: 'PACK_PUBLICATION_DENIED',
    });
  });
});

describe('PackManagerService — Publication (transaction PM-CDC-03 §30)', () => {
  it('refuse la publication d\u2019une version DRAFT', async () => {
    const { prisma } = makePrisma({
      pmPackVersion: { findFirst: jest.fn().mockResolvedValue(fullVersion({ status: 'DRAFT' })) },
    });
    const service = new PackManagerService(prisma as never);
    await expect(service.publishVersion(TENANT_A, VERSION_ID)).rejects.toMatchObject({
      code: 'PACK_PUBLICATION_DENIED',
    });
  });

  it('publie une version READY + validation VALID + manifest : snapshot, audit et outbox produits', async () => {
    const manifest = {
      id: '88888888-8888-8888-8888-888888888888',
      versionId: VERSION_ID,
      hash: 'sha256:abc',
      revision: 1,
      status: 'VALID',
      content: { pack: { code: 'stock', version: '1.0.0' } },
    };
    const { prisma, auditEvents, outboxEvents } = makePrisma({
      pmPackVersion: {
        findFirst: jest.fn().mockImplementation(fullVersionOf({ status: 'READY', validationStatus: 'VALID' })),
        findUnique: jest.fn().mockImplementation(fullVersionOf({ status: 'READY', validationStatus: 'VALID' })),
        update: jest.fn().mockResolvedValue({ id: VERSION_ID, status: 'PUBLISHED', packId: PACK_ID }),
      },
      pmValidation: { findFirst: jest.fn().mockResolvedValue({ status: 'VALID' }) },
      pmManifest: { findFirst: jest.fn().mockResolvedValue(manifest) },
    });
    const service = new PackManagerService(prisma as never);
    const published = await service.publishVersion(TENANT_A, VERSION_ID, 'user-1', 'trace-1');
    expect(published.status).toBe('PUBLISHED');
    expect(prisma.pmSnapshot.create).toHaveBeenCalledTimes(1);
    expect(outboxEvents).toHaveLength(1);
    const outboxData = (outboxEvents[0] as { data: { eventType: string } }).data;
    expect(outboxData.eventType).toBe('pack.version.published');
    expect(auditEvents.some((event) => (event as { data?: { action?: string } }).data?.action === 'pack.version.published')).toBe(true);
  });
});

describe('PackManagerService — Règles (PM-CDC-07)', () => {
  it('refuse un opérateur hors allowlist (aucun code arbitraire)', async () => {
    const { prisma } = makePrisma({
      pmPackVersion: { findFirst: jest.fn().mockResolvedValue(fullVersion()) },
    });
    const service = new PackManagerService(prisma as never);
    await expect(
      service.createRule(TENANT_A, VERSION_ID, {
        code: 'rule-x',
        name: 'Règle X',
        conditions: { field: 'environment', operator: 'exec', value: 'PROD' },
      }),
    ).rejects.toMatchObject({ code: 'PACK_MANIFEST_INVALID' });
  });

  it('accepte un arbre de conditions déclaratif valide', async () => {
    const { prisma } = makePrisma({
      pmPackVersion: { findFirst: jest.fn().mockResolvedValue(fullVersion()) },
      pmRule: { create: jest.fn().mockResolvedValue({ id: '99999999-9999-9999-9999-999999999999' }) },
    });
    const service = new PackManagerService(prisma as never);
    const rule = await service.createRule(TENANT_A, VERSION_ID, {
      code: 'rule-prod',
      name: 'Activation PROD',
      conditions: { all: [{ field: 'environment', operator: 'equals', value: 'PROD' }] },
    });
    expect(rule).toBeDefined();
  });
});
