import { describe, expect, it, jest } from '@jest/globals';
import { PackManagerService } from './pack-manager.service';
const actor = { userId:'actor-a',tenantId:'tenant-a',permissions:[],roles:[],sessionId:'s',organizationId:null,authenticationLevel:null,isSuperAdmin:false };
describe('Pack Manager isolation', () => {
  it('scopes all pack reads to the authenticated tenant', async () => {
    const findFirst = jest.fn<any>().mockResolvedValue(null);
    const service = new PackManagerService({ pack:{ findFirst } } as any);
    await expect(service.getPack('foreign-id',actor)).rejects.toThrow('PACK_NOT_FOUND');
    expect(findFirst).toHaveBeenCalledWith(expect.objectContaining({ where:{ id:'foreign-id',tenantId:'tenant-a' } }));
  });
  it('refuses missing tenant before database access', async () => {
    await expect(new PackManagerService({} as any).getPack('id',{ ...actor,tenantId:null })).rejects.toThrow('TENANT_CONTEXT_REQUIRED');
  });
  it('rejects stale optimistic versions', async () => {
    const service = new PackManagerService({ pack:{ findFirst:jest.fn<any>().mockResolvedValue({ id:'id',rowVersion:3 }) } } as any);
    await expect(service.updatePack('id',{ rowVersion:2,name:'Changed' },actor)).rejects.toThrow('PACK_VERSION_CONFLICT');
  });
  it('refuses edits on published versions', async () => {
    const service = new PackManagerService({ packVersion:{ findFirst:jest.fn<any>().mockResolvedValue({ id:'v',status:'PUBLISHED' }) } } as any);
    await expect(service.addModule('v',{ code:'m',name:'Module' },actor)).rejects.toThrow('PACK_VERSION_IMMUTABLE');
  });
  it('does not bypass public configuration validation with a spoofed userId', async () => {
    await expect(new PackManagerService({} as any).atomic('createPack',[{ userId:'spoof',metadata:{ secret:'value' } },actor])).rejects.toThrow('PRIVATE_CONFIGURATION_FORBIDDEN');
  });
});
