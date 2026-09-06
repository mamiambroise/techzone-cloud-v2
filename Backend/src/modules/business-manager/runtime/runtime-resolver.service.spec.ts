import { RuntimeResolverService } from './runtime-resolver.service';
import type { PackManifest, RuntimeContext } from './contracts/runtime.contracts';

const context: RuntimeContext = {
  tenantId: 'tenant-1',
  applicationId: 'app-1',
  environment: 'PROD',
  capabilities: ['stock.product.read'],
  entitlements: ['stock.pro'],
};

function manifest(): PackManifest {
  const value = {
    contract: 'techzone.pack-manifest' as const,
    contractVersion: '1.0',
    pack: { code: 'stock', version: '1.2.0' },
    modules: [{ code: 'inventory' }],
    features: [{ code: 'stock.analytics', moduleCode: 'inventory', entitlement: 'stock.pro' }],
    capabilities: { inventory: ['stock.product.read'] },
    dependencies: [],
    rules: [],
    manifestHash: '',
  };
  const service = new RuntimeResolverService({ resolve: async () => ({}) }, { resolve: async () => ({}) }, { resolve: async () => ({ entitlements: [] }) }, { resolve: async () => ({ capabilities: [] }) });
  value.manifestHash = (service as any).hash({ ...value, manifestHash: undefined });
  return value;
}

describe('RuntimeResolverService', () => {
  it('resolves a valid manifest deterministically', async () => {
    const service = new RuntimeResolverService(
      { resolve: async () => ({}) },
      { resolve: async () => ({}) },
      { resolve: async () => ({ entitlements: context.entitlements }) },
      { resolve: async () => ({ capabilities: context.capabilities }) },
    );
    const result = await service.resolve(manifest(), context);
    expect(result.resolution.status).toBe('RESOLVED');
    expect(result.features[0]).toMatchObject({ code: 'stock.analytics', active: true });
    expect(result.effectiveManifestHash).toMatch(/^sha256:/);
  });

  it('blocks when a required capability is unavailable', async () => {
    const service = new RuntimeResolverService(
      { resolve: async () => ({}) },
      { resolve: async () => ({}) },
      { resolve: async () => ({ entitlements: [] }) },
      { resolve: async () => ({ capabilities: [] }) },
    );
    const result = await service.resolve(manifest(), context);
    expect(result.resolution.status).toBe('BLOCKED');
    expect(result.resolution.issues.map((issue) => issue.code)).toContain('RUNTIME_CAPABILITY_MISSING');
  });
});