import { jest } from '@jest/globals';
import { RuntimeResolutionService } from './runtime-resolution.service';
import type { PackManifest } from './contracts/runtime.contracts';

const manifest: PackManifest = {
  contract: 'techzone.pack-manifest',
  contractVersion: '1.0',
  pack: { code: 'stock', version: '1.2.0' },
  modules: [{ code: 'inventory' }],
  features: [],
  capabilities: {},
  dependencies: [],
  rules: [],
  manifestHash: 'sha256:manifest',
};

describe('RuntimeResolutionService', () => {
  it('loads a published manifest and persists a resolved result', async () => {
    const savedResolution = { id: 'resolution-1' };
    const savedStep = { id: 'step-1' };
    const dataSource = {
      getRepository: (entity: any) => entity.name === 'RuntimeResolution'
        ? {
            create: jest.fn((value) => value),
            save: jest.fn(async () => savedResolution),
            update: jest.fn(),
            findOne: jest.fn(),
          }
        : {
            create: jest.fn((value) => value),
            save: jest.fn(async () => savedStep),
            update: jest.fn(),
            find: jest.fn(),
          },
    } as any;
    const manifests = { getPublishedManifest: jest.fn(async () => ({ manifest, publicationStatus: 'PUBLISHED', sourceRef: 'version-1' })) };
    const resolver = { resolve: jest.fn(async () => ({ resolution: { status: 'RESOLVED', issues: [] }, effectiveManifestHash: 'sha256:effective' })) };
    const service = new RuntimeResolutionService(dataSource, manifests as any, resolver as any);

    const result = await service.resolve({ tenantId: 'tenant-1', applicationId: 'app-1', packCode: 'stock', packVersion: '1.2.0', environment: 'TEST' });

    expect(result).toMatchObject({ resolutionId: 'resolution-1', status: 'RESOLVED' });
    expect(resolver.resolve).toHaveBeenCalledWith(manifest, expect.objectContaining({ tenantId: 'tenant-1', applicationId: 'app-1' }));
  });

  it('delegates preview authorization to the provider policy boundary', async () => {
    const manifests = { getPublishedManifest: jest.fn(async () => { throw new Error('RUNTIME_PREVIEW_FORBIDDEN'); }) };
    const repository = { create: jest.fn((value: any) => value), save: jest.fn(async (value: any) => ({ id: 'step-1', ...value })), update: jest.fn(), find: jest.fn() };
    const dataSource = { getRepository: () => repository } as any;
    const service = new RuntimeResolutionService(dataSource, manifests as any, {} as any);

    await expect(service.resolve({ tenantId: 'tenant-1', applicationId: 'app-1', packCode: 'stock', packVersion: '1.2.0', environment: 'PROD', preview: true })).rejects.toThrow('RUNTIME_PREVIEW_FORBIDDEN');
  });
});
