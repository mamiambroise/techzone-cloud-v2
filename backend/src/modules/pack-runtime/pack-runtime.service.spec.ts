import { describe, expect, it, jest } from '@jest/globals';
import { Reflector } from '@nestjs/core';
import { IamPermissionGuard } from '../../iam/iam-permission.guard';
import { PackRuntimeController } from './pack-runtime.controller';
import { PackRuntimeService } from './pack-runtime.service';
import { RuntimeCacheService } from './runtime-cache.service';
const actor = { userId:'actor-a',tenantId:'tenant-a',permissions:[],roles:[],sessionId:'s',organizationId:null,authenticationLevel:null,isSuperAdmin:false };
describe('Runtime context isolation', () => {
  const service = () => new PackRuntimeService({} as any,{} as any,{} as any,{} as any);
  it('rejects another tenant and browser-provided permissions', async () => {
    await expect(service().resolve({ tenantId:'tenant-b' },actor)).rejects.toThrow('TENANT_CONTEXT_MISMATCH');
    await expect(service().resolve({ context:{ permissions:['*'] } },actor)).rejects.toThrow('RUNTIME_CONTEXT_IS_SERVER_OWNED');
  });
  it('cannot read another tenant resolution', async () => {
    const findFirst = jest.fn<any>().mockResolvedValue(null);
    const runtime = new PackRuntimeService({ runtimeResolution:{ findFirst } } as any,{} as any,{} as any,{} as any);
    await expect(runtime.resolution('foreign',actor)).rejects.toThrow('RUNTIME_RESOLUTION_NOT_FOUND');
    expect(findFirst).toHaveBeenCalledWith(expect.objectContaining({ where:{ id:'foreign',tenantId:'tenant-a' } }));
  });
  it('rejects global cache invalidation', async () => {
    await expect(service().invalidateCache({ scope:'GLOBAL' },actor)).rejects.toThrow('CACHE_SCOPE_INVALID');
  });
});

describe('Persisted Runtime activation', () => {
  it('SEC-PR-150 serializes activation and retries reuse the persisted active context', async () => {
    const content = { scope: { businessVersionId: 'version-a' }, configuration: {}, businessConfiguration: { revision: 'rev-a' } };
    const resolution: any = { id: 'r1', applicationId: 'app-a', environment: 'dev', result: { expiresAt: '2099-01-01' }, effectiveManifest: { content } };
    const tx: any = { $executeRaw: jest.fn<any>().mockResolvedValue(1), $queryRaw: jest.fn<any>().mockResolvedValue([{ ok: 1 }]), runtimeResolution: { findMany: jest.fn<any>().mockResolvedValue([]), update: jest.fn<any>().mockResolvedValue({}) }, auditEvent: { create: jest.fn<any>().mockResolvedValue({}) } };
    const db: any = { runtimeResolution: { findFirst: jest.fn<any>().mockResolvedValue(resolution) }, $transaction: jest.fn<any>().mockImplementation(fn => fn(tx)) };
    const gate: any = { assertExecutable: jest.fn<any>().mockResolvedValue(resolution) };
    const cache: any = { invalidate: jest.fn() };
    const bridge: any = { applicationContext: jest.fn<any>().mockResolvedValue({ readiness: 'READY', revision: 'rev-a' }) };
    const runtime = new PackRuntimeService(db, {} as any, bridge, cache, gate);
    const context = await runtime.activate('r1', actor);
    expect(context.status).toBe('ACTIVE');
    expect(tx.$executeRaw).toHaveBeenCalled();
    expect(tx.runtimeResolution.update).toHaveBeenCalledWith(expect.objectContaining({ where: { id: 'r1' }, data: { result: expect.objectContaining({ runtimeContext: expect.objectContaining({ resolutionId: 'r1', status: 'ACTIVE', readiness: 'READY' }) }) } }));
    expect(cache.invalidate).toHaveBeenCalledWith('tenant-a', 'APPLICATION', { applicationId: 'app-a' });
    // A retry reuses the same persisted context rather than generating another ID.
    resolution.result.runtimeContext = context;
    expect(await runtime.activate('r1', actor)).toEqual(context);
    expect(tx.runtimeResolution.update).toHaveBeenCalledTimes(1);
  });
});

describe('Pack Runtime security test cases', () => {
  it('SEC-PR-070 requires runtime.activate at the controller boundary', async () => {
    const handler = PackRuntimeController.prototype.activate;
    const reflector = new Reflector();
    const context = {
      getHandler: () => handler,
      getClass: () => PackRuntimeController,
      switchToHttp: () => ({ getRequest: () => ({ iamPrincipal: { userId: 'reader', tenantId: 'tenant-a', permissions: [] }, method: 'POST', url: '/api/runtime/resolutions/id/activate' }) }),
    } as any;
    const guard = new IamPermissionGuard(reflector);
    await expect(guard.canActivate(context)).rejects.toThrow('Insufficient permission');
    context.switchToHttp = () => ({ getRequest: () => ({ iamPrincipal: { userId: 'operator', tenantId: 'tenant-a', permissions: ['runtime.activate'] }, method: 'POST', url: '/api/runtime/resolutions/id/activate' }) });
    await expect(guard.canActivate(context)).resolves.toBe(true);
  });

  it.each([
    ['automation', { workflows: [{ code: 'approve' }] }, 'RUNTIME_PROVIDER_UNSUPPORTED', []],
    ['integrations', { connectors: [{ code: 'erp', required: true }] }, 'RUNTIME_PROVIDER_UNSUPPORTED', []],
    ['capability', undefined, 'CAPABILITY_MISSING', [{ code: 'requires-data-write', enabled: true, capabilities: [{ code: 'data.write', relationType: 'REQUIRES', required: true }] }]],
  ])('SEC-PR-013/110/120 blocks an unverified required %s provider', async (provider, value, expectedCode, features) => {
    const definition: any = {
      pack: { id: 'pack-a' },
      modules: [],
      features,
      dependencies: [],
      rules: [],
      ui: { schemaVersion: '1.1', applicationVersionId: 'version-a', definition: { schemaVersion: '1.1', applicationVersionId: 'version-a', businessContext: { applicationVersionId: 'version-a', entities: [] }, pages: [] } },
      ...(value ? { [provider]: value } : {}),
    };
    const source: any = { id: 'manifest-a', hash: 'source-hash', packVersionId: 'pack-version-a', applicationVersionId: 'version-a', definition, registryReferences: [] };
    const created = jest.fn<any>().mockResolvedValue({ id: 'resolution-a' });
    const tx: any = {
      runtimeResolution: { create: created },
      runtimeResolutionStep: { createMany: jest.fn<any>().mockResolvedValue({ count: 1 }) },
      runtimeEffectiveManifest: { create: jest.fn<any>().mockResolvedValue({ id: 'effective-a' }) },
      runtimeDiagnostic: { createMany: jest.fn<any>().mockResolvedValue({ count: 1 }) },
      auditEvent: { create: jest.fn<any>().mockResolvedValue({}) },
    };
    const db: any = { $transaction: jest.fn<any>().mockImplementation(callback => callback(tx)) };
    const packs: any = {
      publishedManifest: jest.fn<any>().mockResolvedValue(source),
      publishedVersions: jest.fn<any>().mockResolvedValue([]),
      publicationDependencies: jest.fn<any>().mockResolvedValue([]),
    };
    const bridge: any = { applicationContext: jest.fn<any>().mockResolvedValue({
      application: { versionId: 'version-a' },
      environment: { code: 'dev' },
      features: [],
      revision: 'revision-a',
      readiness: 'READY',
      configuration: {},
    }) };
    const runtime = new PackRuntimeService(db, packs, bridge, new RuntimeCacheService());
    const resolution = await runtime.resolve({
      applicationId: 'app-a', businessVersionId: 'version-a', environment: 'dev', packCode: 'pack-a', packVersion: '1.0.0',
    }, actor);
    expect(resolution.status).toBe('BLOCKED');
    expect((resolution.effectiveManifest as any).ui).toBeDefined();
    expect(tx.runtimeDiagnostic.createMany).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.arrayContaining([expect.objectContaining({ code: expectedCode })]),
    }));
  });

  it('SEC-PR-130 rejects credentials in server-resolved business configuration before persistence', async () => {
    const packs: any = {
      publishedManifest: jest.fn<any>().mockResolvedValue({ id: 'manifest-a', hash: 'source-hash', packVersionId: 'pack-version-a', applicationVersionId: 'version-a', definition: {}, registryReferences: [] }),
      publishedVersions: jest.fn<any>().mockResolvedValue([]),
    };
    const bridge: any = { applicationContext: jest.fn<any>().mockResolvedValue({
      application: { versionId: 'version-a' }, environment: { code: 'dev' }, features: [],
      revision: 'revision-a', readiness: 'READY',
      configuration: { apiToken: 'sensitive-token-value' },
    }) };
    const create = jest.fn<any>();
    const db: any = { runtimeResolution: { create }, $transaction: jest.fn<any>() };
    const runtime = new PackRuntimeService(db, packs, bridge, new RuntimeCacheService());
    await expect(runtime.resolve({
      applicationId: 'app-a', businessVersionId: 'version-a', environment: 'dev', packCode: 'pack-a', packVersion: '1.0.0',
    }, actor)).rejects.toThrow('PRIVATE_CONFIGURATION_FORBIDDEN');
    expect(create).not.toHaveBeenCalled();
    expect(db.$transaction).not.toHaveBeenCalled();
  });

  it('SEC-PR-131 refuses credentials in published content before diagnostic persistence', async () => {
    const packs: any = {
      publishedManifest: jest.fn<any>().mockResolvedValue({
        id: 'manifest-a',
        hash: 'source-hash',
        packVersionId: 'pack-version-a',
        applicationVersionId: 'version-a',
        definition: { apiToken: 'sensitive-token-value' },
        registryReferences: [],
      }),
      publishedVersions: jest.fn<any>().mockResolvedValue([]),
    };
    const bridge: any = { applicationContext: jest.fn<any>().mockResolvedValue({
      application: { versionId: 'version-a' }, environment: { code: 'dev' }, features: [],
      revision: 'revision-a', readiness: 'READY', configuration: {},
    }) };
    const transaction = jest.fn<any>();
    const runtime = new PackRuntimeService({ $transaction: transaction } as any, packs, bridge, new RuntimeCacheService());
    await expect(runtime.resolve({
      applicationId: 'app-a', businessVersionId: 'version-a', environment: 'dev', packCode: 'pack-a', packVersion: '1.0.0',
    }, actor)).rejects.toThrow('PRIVATE_CONFIGURATION_FORBIDDEN');
    expect(transaction).not.toHaveBeenCalled();
  });
});
