import { describe, expect, it, jest } from '@jest/globals';
import { PackManagerService } from './pack-manager.service';
import { contractHash } from './pack-contract';
const actor = { userId:'actor-a',tenantId:'tenant-a',permissions:[],roles:[],sessionId:'s',organizationId:null,authenticationLevel:null,isSuperAdmin:false };
describe('Pack Manager isolation', () => {
  it('scopes all pack reads to the authenticated tenant', async () => {
    const findFirst = jest.fn<any>().mockResolvedValue(null);
    const service = new PackManagerService({ pack:{ findFirst } } as any);
    await expect(service.getPack('foreign-id',actor)).rejects.toThrow('PACK_NOT_FOUND');
    expect(findFirst).toHaveBeenCalledWith(expect.objectContaining({ where:{ id:'foreign-id',tenantId:'tenant-a' } }));
  });
  it('scopes all PackVersion reads to the authenticated tenant', async () => {
    const findFirst = jest.fn<any>().mockResolvedValue(null);
    const service = new PackManagerService({ packVersion:{ findFirst } } as any);
    await expect(service.getVersion('foreign-version',actor)).rejects.toThrow('PACK_VERSION_NOT_FOUND');
    expect(findFirst).toHaveBeenCalledWith(expect.objectContaining({
      where:{ id:'foreign-version',tenantId:'tenant-a' },
    }));
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
  it('ignores client-controlled ownership and publication fields during pack updates', async () => {
    const update = jest.fn<any>().mockResolvedValue({ id:'pack-a' });
    const service = new PackManagerService({
      pack:{
        findFirst:jest.fn<any>().mockResolvedValue({ id:'pack-a',rowVersion:1,archivedAt:null,versions:[] }),
        update,
      },
    } as any);
    await service.updatePack('pack-a',{
      rowVersion:1,
      name:'Updated pack',
      tenantId:'tenant-b',
      status:'PUBLISHED',
      publishedAt:'2026-01-01T00:00:00.000Z',
      createdBy:'spoofed-user',
    },actor);
    expect(update).toHaveBeenCalledWith(expect.objectContaining({
      where:{ id:'pack-a',rowVersion:1 },
      data:expect.objectContaining({ name:'Updated pack',updatedBy:'actor-a' }),
    }));
    expect(update.mock.calls[0][0].data).not.toHaveProperty('tenantId');
    expect(update.mock.calls[0][0].data).not.toHaveProperty('status');
    expect(update.mock.calls[0][0].data).not.toHaveProperty('publishedAt');
    expect(update.mock.calls[0][0].data).not.toHaveProperty('createdBy');
  });

  it('rejects an ApplicationVersion from a different application than its pack', async () => {
    const packVersionCreate = jest.fn<any>();
    const service = new PackManagerService({
      pack: { findFirst: jest.fn<any>().mockResolvedValue({ id:'pack-a', archivedAt:null, applicationId:'app-a' }) },
      applicationVersion: { findFirst: jest.fn<any>().mockResolvedValue({ id:'app-version-b', applicationId:'app-b', status:'READY', application:{ tenantId:'tenant-a' } }) },
      packVersion: { create:packVersionCreate },
    } as any);

    await expect(service.createVersion('pack-a',{ versionNumber:'1.0.0',applicationVersionId:'app-version-b' },actor)).rejects.toThrow('PACK_APPLICATION_MISMATCH');
    expect(packVersionCreate).not.toHaveBeenCalled();
  });
  it('requires an explicit ApplicationVersion when creating a pack version', async () => {
    const packVersionCreate = jest.fn<any>();
    const service = new PackManagerService({
      pack:{ findFirst:jest.fn<any>().mockResolvedValue({ id:'pack-a',archivedAt:null,applicationId:'app-a',versions:[] }) },
      packVersion:{ create:packVersionCreate },
    } as any);
    await expect(service.createVersion('pack-a',{ versionNumber:'1.0.0' },actor))
      .rejects.toThrow('APPLICATIONVERSIONID_REQUIRED');
    expect(packVersionCreate).not.toHaveBeenCalled();
  });

  it('does not resolve an ApplicationVersion outside the authenticated tenant', async () => {
    const applicationVersionFindFirst = jest.fn<any>().mockResolvedValue(null);
    const service = new PackManagerService({
      pack: { findFirst: jest.fn<any>().mockResolvedValue({ id:'pack-a', archivedAt:null, applicationId:'app-a' }) },
      applicationVersion: { findFirst:applicationVersionFindFirst },
      packVersion: { create:jest.fn<any>() },
    } as any);

    await expect(service.createVersion('pack-a',{ versionNumber:'1.0.0',applicationVersionId:'foreign-version' },actor)).rejects.toThrow('APPLICATION_VERSION_NOT_FOUND');
    expect(applicationVersionFindFirst).toHaveBeenCalledWith(expect.objectContaining({
      where:{ id:'foreign-version',tenantId:'tenant-a' },
    }));
  });

  it('rejects archived ApplicationVersions when creating a pack version', async () => {
    const service = new PackManagerService({
      pack: { findFirst: jest.fn<any>().mockResolvedValue({ id:'pack-a', archivedAt:null, applicationId:'app-a' }) },
      applicationVersion: { findFirst: jest.fn<any>().mockResolvedValue({ id:'app-version-a', applicationId:'app-a', status:'ARCHIVED', application:{ tenantId:'tenant-a' } }) },
      packVersion: { create:jest.fn<any>() },
    } as any);

    await expect(service.createVersion('pack-a',{ versionNumber:'1.0.0',applicationVersionId:'app-version-a' },actor)).rejects.toThrow('APPLICATION_VERSION_STATUS_NOT_ALLOWED');
  });

  it('requires an explicit ApplicationVersion when cloning a pack version', async () => {
    const source = { id:'pack-version-a', packId:'pack-a', status:'DRAFT', modules:[], features:[], dependencies:[], rules:[] };
    const service = new PackManagerService({
      packVersion: { findFirst:jest.fn<any>().mockResolvedValue(source) },
      pack: { findFirst:jest.fn<any>().mockResolvedValue({ id:'pack-a', archivedAt:null, applicationId:'app-a' }) },
    } as any);

    await expect(service.cloneVersion(source.id,{ versionNumber:'1.1.0' },actor)).rejects.toThrow('APPLICATIONVERSIONID_REQUIRED');
  });

  it('binds an unscoped pack to the application of its first version', async () => {
    const packUpdate = jest.fn<any>();
    const service = new PackManagerService({
      pack: {
        findFirst:jest.fn<any>().mockResolvedValue({ id:'pack-a', archivedAt:null, applicationId:null }),
        update:packUpdate,
      },
      packVersion: {
        findMany:jest.fn<any>().mockResolvedValue([]),
        create:jest.fn<any>().mockResolvedValue({ id:'pack-version-a' }),
      },
      applicationVersion: {
        findFirst:jest.fn<any>().mockResolvedValue({ id:'app-version-a', applicationId:'app-a', status:'READY', application:{ tenantId:'tenant-a' } }),
      },
    } as any);

    await service.createVersion('pack-a',{ versionNumber:'1.0.0',applicationVersionId:'app-version-a' },actor);

    expect(packUpdate).toHaveBeenCalledWith(expect.objectContaining({
      where:{ id:'pack-a' },
      data:expect.objectContaining({ applicationId:'app-a' }),
    }));
  });

  it('refuses repeat publication when a published manifest has been tampered with', async () => {
    const snapshotContent = { definition:'original' };
    const snapshotHash = contractHash(snapshotContent);
    const originalManifest = {
      contract:'techzone.pack-manifest',
      contractVersion:'1.0.0',
      tenantId:'tenant-a',
      snapshotHash,
      definition:'original',
    };
    const manifestHash = contractHash(originalManifest);
    const version = {
      id:'pack-version-a',
      tenantId:'tenant-a',
      status:'PUBLISHED',
      snapshotHash,
      manifestHash,
      snapshot:{ snapshotHash,content:snapshotContent },
      manifest:{
        status:'PUBLISHED',
        manifestHash,
        content:{ ...originalManifest,definition:'tampered' },
      },
    };
    const tx = { packVersion:{ findFirst:jest.fn<any>().mockResolvedValue(version) } };
    const service = new PackManagerService({
      $transaction:jest.fn<any>().mockImplementation((operation: (client: typeof tx) => unknown) => operation(tx)),
    } as any);
    await expect(service.publish(version.id,actor)).rejects.toThrow('PACK_MANIFEST_HASH_INVALID');
  });
});
