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
