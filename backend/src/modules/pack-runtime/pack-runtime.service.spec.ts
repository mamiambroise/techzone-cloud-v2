import { describe, expect, it, jest } from '@jest/globals';
import { PackRuntimeService } from './pack-runtime.service';
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
  it('stores the active context transactionally and invalidates only its application cache', async () => {
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
    expect(tx.runtimeResolution.update).toHaveBeenCalledWith(expect.objectContaining({ where: { id: 'r1' }, data: { result: expect.objectContaining({ runtimeContext: expect.objectContaining({ resolutionId: 'r1', status: 'ACTIVE', readiness: 'READY' }) }) } }));
    expect(cache.invalidate).toHaveBeenCalledWith('tenant-a', 'APPLICATION', { applicationId: 'app-a' });
    // A retry reuses the same persisted context rather than generating another ID.
    resolution.result.runtimeContext = context;
    expect(await runtime.activate('r1', actor)).toEqual(context);
    expect(tx.runtimeResolution.update).toHaveBeenCalledTimes(1);
  });
});
