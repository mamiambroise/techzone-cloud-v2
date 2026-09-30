import { jest } from '@jest/globals';
import { createHash } from 'node:crypto';

import { RuntimeResolverService } from './runtime-resolver.service';

const sha256 = (value: string) => `sha256:${createHash('sha256').update(value).digest('hex')}`;

/**
 * Tests Pack Runtime (PR-CDC-00 §29) : résolution déterministe,
 * blocage dépendance requise, cache tenant-scopé, diagnostics, isolation tenant.
 */

const TENANT_A = '11111111-1111-1111-1111-111111111111';
const TENANT_B = '22222222-2222-2222-2222-222222222222';
const PACK_ID = '33333333-3333-3333-3333-333333333333';
const VERSION_ID = '44444444-4444-4444-4444-444444444444';

function manifestContent(overrides: Record<string, unknown> = {}) {
  return {
    contract: 'techzone.pack-manifest',
    contractVersion: '1.0',
    pack: { id: PACK_ID, code: 'stock', name: 'Gestion de stock', version: '1.0.0' },
    modules: [{ code: 'stock', name: 'Gestion de stock', enabled: true, orderIndex: 0 }],
    features: [{ code: 'stock.inventory', enabled: true }],
    capabilities: [{ code: 'stock.product.read', required: true }],
    dependencies: [],
    activationRules: [],
    revision: 1,
    ...overrides,
  };
}

function makePrisma(contentInput?: Record<string, unknown>, overrides: Record<string, unknown> = {}) {
  const content = contentInput ?? manifestContent();
  const resolutions: Array<Record<string, unknown>> = [];
  const cacheEntries: Array<Record<string, unknown>> = [];
  const diagnostics: Array<Record<string, unknown>> = [];
  const prisma = {
    pmPack: { findFirst: jest.fn().mockResolvedValue({ id: PACK_ID, code: 'stock' }) },
    pmPackVersion: {
      findFirst: jest.fn().mockResolvedValue({
        id: VERSION_ID,
        versionNumber: '1.0.0',
        status: 'PUBLISHED',
        pack: { id: PACK_ID, code: 'stock', name: 'Gestion de stock' },
        manifests: [{ hash: sha256(JSON.stringify(content)), revision: 1, content }],
      }),
      findMany: jest.fn().mockResolvedValue([]),
    },
    prRuntimeResolution: {
      create: jest.fn((input: { data: Record<string, unknown> }) => {
        const row = { id: '55555555-5555-5555-5555-555555555555', ...input.data };
        resolutions.push(row);
        return Promise.resolve(row);
      }),
      findMany: jest.fn().mockResolvedValue([]),
      findFirst: jest.fn(),
      count: jest.fn().mockResolvedValue(0),
    },
    prRuntimeCacheEntry: {
      findUnique: jest.fn().mockResolvedValue(null),
      findMany: jest.fn().mockResolvedValue([]),
      create: jest.fn((input: { data: Record<string, unknown> }) => { cacheEntries.push(input.data); return Promise.resolve(input.data); }),
      update: jest.fn(),
      updateMany: jest.fn().mockResolvedValue({ count: 0 }),
    },
    prRuntimeDiagnostic: {
      createMany: jest.fn((input: { data: unknown[] }) => { diagnostics.push(...input.data); return Promise.resolve({ count: input.data.length }); }),
      create: jest.fn((input: { data: Record<string, unknown> }) => { diagnostics.push(input.data); return Promise.resolve(input.data); }),
      findMany: jest.fn().mockResolvedValue([]),
    },
    prRuntimeContext: { findMany: jest.fn().mockResolvedValue([]), create: jest.fn() },
    ...overrides,
  };
  return { prisma, resolutions, cacheEntries, diagnostics };
}

describe('RuntimeResolverService — Résolution (PR-CDC-02 → PR-CDC-06)', () => {
  it('résout un manifest conforme : status RESOLVED + effective manifest hashé + étapes tracées', async () => {
    const { prisma, resolutions } = makePrisma();
    const service = new RuntimeResolverService(prisma as never);
    const resolution = await service.resolve(TENANT_A, { packCode: 'stock', environment: 'PROD' }, 'user-1', 'trace-1');
    expect(resolution.status).toBe('RESOLVED');
    expect(resolution.effectiveManifestHash).toMatch(/^sha256:/);
    expect(resolution.durationMs).toBeGreaterThanOrEqual(0);
    const steps = resolution.steps as Array<{ key: string }>;
    expect(steps.map((step) => step.key)).toEqual(
      expect.arrayContaining(['manifest.validate', 'dependency.resolve', 'rules.evaluate', 'modules.resolve', 'features.resolve', 'capabilities.resolve']),
    );
    expect(resolutions).toHaveLength(1);
  });

  it('applique les feature flags sur les features du manifest', async () => {
    const { prisma } = makePrisma();
    const service = new RuntimeResolverService(prisma as never);
    const resolution = await service.resolve(TENANT_A, { packCode: 'stock', featureFlags: { 'stock.inventory': false } });
    const effective = resolution.effectiveManifest as { features: Array<{ code: string; active: boolean; reason: string }> };
    const feature = effective.features.find((f) => f.code === 'stock.inventory');
    expect(feature?.active).toBe(false);
    expect(feature?.reason).toBe('FEATURE_FLAG');
  });

  it('évalue une règle déclarative : environment PROD matché → RULE_MATCHED', async () => {
    const content = manifestContent({
      activationRules: [
        { code: 'feature.stock.analytics', type: 'ACTIVATION', effect: 'ENABLE', priority: 10, conditions: { field: 'environment', operator: 'equals', value: 'PROD' } },
      ],
      features: [{ code: 'stock.inventory', enabled: true }],
    });
    const { prisma } = makePrisma(content);
    const service = new RuntimeResolverService(prisma as never);
    const resolution = await service.resolve(TENANT_A, { packCode: 'stock', environment: 'PROD' });
    const effective = resolution.effectiveManifest as { rules: Array<{ code: string; matched: boolean }> };
    expect(effective.rules[0]?.matched).toBe(true);
  });

  it('bloque la résolution quand une dépendance requise est absente (pas d\u2019exécution silencieuse)', async () => {
    const content = manifestContent({
      dependencies: [{ target: 'catalog', type: 'REQUIRED' }],
    });
    const { prisma } = makePrisma(content, {
      pmPack: { findFirst: jest.fn().mockImplementation((args: { where: { code?: string } }) => (args.where.code === 'catalog' ? Promise.resolve(null) : Promise.resolve({ id: PACK_ID, code: 'stock' }))) },
    });
    const service = new RuntimeResolverService(prisma as never);
    const resolution = await service.resolve(TENANT_A, { packCode: 'stock' });
    expect(resolution.status).toBe('BLOCKED');
    const issues = resolution.issues as Array<{ code: string }>;
    expect(issues.some((issue) => issue.code === 'RUNTIME_DEPENDENCY_MISSING')).toBe(true);
  });
});

describe('RuntimeResolverService — Manifest invalide (PR-CDC-02)', () => {
  it('rejette une version de contrat non supportée', async () => {
    const { prisma } = makePrisma(manifestContent({ contractVersion: '9.9' }));
    const service = new RuntimeResolverService(prisma as never);
    await expect(service.resolve(TENANT_A, { packCode: 'stock' })).rejects.toMatchObject({
      code: 'RUNTIME_CONTRACT_UNSUPPORTED',
    });
  });

  it('rejette un manifest dont le pack ne correspond pas (mismatch)', async () => {
    const { prisma } = makePrisma(manifestContent({ pack: { code: 'catalog', version: '1.0.0' } }));
    const service = new RuntimeResolverService(prisma as never);
    await expect(service.resolve(TENANT_A, { packCode: 'stock' })).rejects.toMatchObject({
      code: 'RUNTIME_TENANT_MISMATCH',
    });
  });

  it('404 quand aucun manifest publié n\u2019existe pour ce pack', async () => {
    const { prisma } = makePrisma(undefined, {
      pmPackVersion: { findFirst: jest.fn().mockResolvedValue(null), findMany: jest.fn().mockResolvedValue([]) },
    });
    const service = new RuntimeResolverService(prisma as never);
    await expect(service.resolve(TENANT_A, { packCode: 'unknown' })).rejects.toMatchObject({
      code: 'RUNTIME_MANIFEST_NOT_FOUND',
    });
  });
});

describe('RuntimeResolverService — Cache & isolation tenant (PR-CDC-07)', () => {
  it('écrit une entrée de cache avec une clé tenant-scopée', async () => {
    const { prisma, cacheEntries } = makePrisma();
    const service = new RuntimeResolverService(prisma as never);
    await service.resolve(TENANT_A, { packCode: 'stock' });
    const key = String(cacheEntries[0]?.cacheKey ?? '');
    expect(key).toContain(`|${TENANT_A}|`);
    expect(key).toContain('stock');
  });

  it('l\u2019invalidation du cache est filtrée par tenant', async () => {
    const { prisma } = makePrisma();
    const service = new RuntimeResolverService(prisma as never);
    await service.invalidateCache(TENANT_A);
    expect(prisma.prRuntimeCacheEntry.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ tenantId: TENANT_A }) }),
    );
  });

  it('les requêtes de résolution filtrent toujours par tenantId', async () => {
    const { prisma } = makePrisma();
    const service = new RuntimeResolverService(prisma as never);
    await service.listResolutions(TENANT_B, { packCode: 'stock' });
    expect(prisma.prRuntimeResolution.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ tenantId: TENANT_B }) }),
    );
  });
});
