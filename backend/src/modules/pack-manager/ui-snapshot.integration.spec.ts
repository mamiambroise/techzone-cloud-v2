import { describe, expect, it, jest } from '@jest/globals';
import { PackManagerService } from './pack-manager.service';
import { UiBuilderService } from '../ui-builder/ui-builder.service';
import { contractHash } from './pack-contract';

const actor = { userId: 'user-a', tenantId: 'tenant-a', permissions: ['*'], roles: [], isSuperAdmin: false } as any;
const definition = () => ({ schemaVersion: '1.1', applicationId: 'app-a', applicationVersionId: 'version-a', businessContext: { applicationVersionId: 'version-a', entities: [] }, navigation: { items: [] }, pages: [], metadata: {} });
const version = (overrides: Record<string, unknown> = {}) => ({
  id: 'pack-version',
  status: 'DRAFT',
  applicationVersionId: 'version-a',
  versionNumber: '1.0.0',
  pack: { id: 'pack', applicationId: 'app-a', code: 'test', name: 'Test' },
  applicationVersion: {
    id: 'version-a',
    tenantId: 'tenant-a',
    applicationId: 'app-a',
    application: { id: 'app-a', tenantId: 'tenant-a' },
  },
  modules: [{ id: 'module', code: 'business', enabled: true, displayOrder: 0 }],
  features: [],
  dependencies: [],
  rules: [],
  ...overrides,
});

function setup(ui: any = definition(), validation: any = { status: 'VALID', applicationVersionId: 'version-a' }) {
  const builder = { validate: jest.fn<any>().mockResolvedValue(validation), getUiDefinition: jest.fn<any>().mockResolvedValue(ui) };
  let snapshot: any;
  const db: any = {
    packVersion: { findFirst: jest.fn<any>().mockResolvedValue(version()), findMany: jest.fn<any>().mockResolvedValue([]), update: jest.fn<any>().mockResolvedValue({}) },
    packValidation: { create: jest.fn<any>().mockImplementation(async ({ data }: any) => ({ id: 'validation', ...data })) },
    packSnapshot: { upsert: jest.fn<any>().mockImplementation(async ({ create }: any) => { snapshot = structuredClone(create); return snapshot; }) },
    auditEvent: { create: jest.fn<any>().mockResolvedValue({}) },
    $transaction: jest.fn<any>().mockImplementation(async (callback: any) => callback(db)),
  };
  return { service: new PackManagerService(db, builder as unknown as UiBuilderService), db, builder, snapshot: () => snapshot };
}

describe('UI Builder → Pack snapshot integration', () => {
  it('validates UI in the authenticated tenant and embeds a deterministic versioned snapshot', async () => {
    const { service, builder, db, snapshot } = setup();
    expect((await service.validate('pack-version', actor)).status).toBe('VALID');
    expect(builder.validate).toHaveBeenCalledWith('version-a', 'tenant-a', 'user-a');
    expect(builder.getUiDefinition).toHaveBeenCalledWith('version-a', 'tenant-a');
    expect(snapshot().tenantId).toBe('tenant-a');
    expect(snapshot().content.ui.applicationVersionId).toBe('version-a');
    expect(snapshot().content.ui.uiDefinitionHash).toBe(contractHash(definition()));
    expect(snapshot().snapshotHash).toBe(contractHash(snapshot().content));
    expect(db.packSnapshot.upsert).toHaveBeenCalledTimes(1);
  });
  it.each([
    { ...definition(), applicationVersionId: 'forged-version' },
    { ...definition(), businessContext: { applicationVersionId: 'forged-version', entities: [] } },
  ])('blocks an ApplicationVersion mismatch before creating a snapshot', async ui => {
    const { service, db } = setup(ui);
    const result = await service.validate('pack-version', actor);
    expect(result.status).toBe('INVALID');
    expect(result.issues).toContainEqual(expect.objectContaining({ code: 'UI_APPLICATION_VERSION_MISMATCH' }));
    expect(db.packSnapshot.upsert).not.toHaveBeenCalled();
  });
  it.each([
    undefined,
    { id: 'version-a', tenantId: 'tenant-b', applicationId: 'app-a', application: { id: 'app-a', tenantId: 'tenant-b' } },
  ])('rejects a missing or foreign ApplicationVersion before creating a snapshot', async applicationVersion => {
    const { service, db } = setup();
    db.packVersion.findFirst.mockResolvedValue(version({ applicationVersion }));
    await expect(service.validate('pack-version', actor)).rejects.toThrow('APPLICATION_VERSION_NOT_FOUND');
    expect(db.packSnapshot.upsert).not.toHaveBeenCalled();
  });
  it('marks an ApplicationVersion from another application invalid without creating a snapshot', async () => {
    const { service, db } = setup();
    db.packVersion.findFirst.mockResolvedValue(version({
      applicationVersion: {
        id: 'version-a', tenantId: 'tenant-a', applicationId: 'app-b', application: { id: 'app-b', tenantId: 'tenant-a' },
      },
    }));
    const result = await service.validate('pack-version', actor);
    expect(result.status).toBe('INVALID');
    expect(result.issues).toContainEqual(expect.objectContaining({ code: 'PACK_APPLICATION_MISMATCH' }));
    expect(db.packSnapshot.upsert).not.toHaveBeenCalled();
  });
  it('blocks invalid UI and cannot package a foreign or inaccessible definition', async () => {
    const invalid = setup(definition(), { status: 'INVALID', applicationVersionId: 'version-a' });
    expect((await invalid.service.validate('pack-version', actor)).status).toBe('INVALID');
    expect(invalid.builder.getUiDefinition).not.toHaveBeenCalled();
    expect(invalid.db.packSnapshot.upsert).not.toHaveBeenCalled();
    const foreign = setup();
    foreign.builder.getUiDefinition.mockRejectedValue(new Error('VERSION_NOT_FOUND'));
    expect((await foreign.service.validate('pack-version', actor)).status).toBe('INVALID');
    expect(foreign.db.packSnapshot.upsert).not.toHaveBeenCalled();
  });
  it('leaves published versions immutable', async () => {
    const { service, db } = setup();
    db.packVersion.findFirst.mockResolvedValue({ ...version(), status: 'PUBLISHED' });
    await expect(service.validate('pack-version', actor)).rejects.toThrow('PACK_VERSION_IMMUTABLE');
    expect(db.packSnapshot.upsert).not.toHaveBeenCalled();
  });
  it('runtime reads a hash-checked published snapshot without consulting working UI', async () => {
    const snapshotContent = { pack: { code: 'test' }, version: { id: 'pack-version' } };
    const snapshotHash = contractHash(snapshotContent);
    const content = {
      contract: 'techzone.pack-manifest',
      tenantId: 'tenant-a',
      snapshotHash,
      definition: { ui: { applicationVersionId: 'version-a', definition: definition() } },
    };
    const publishedPackVersion = {
      snapshotHash,
      snapshot: { snapshotHash, content: snapshotContent },
    };
    const { service, db, builder } = setup();
    db.packManifest = { findFirst: jest.fn<any>().mockResolvedValue({ id: 'manifest', packVersionId: 'pack-version', contractVersion: '1.0.0', manifestHash: contractHash(content), content, packVersion: publishedPackVersion }) };
    const before = await service.publishedManifest('test', '1.0.0', actor);
    builder.getUiDefinition.mockResolvedValue({ ...definition(), pages: [{ title: 'Changed draft' }] });
    expect(await service.publishedManifest('test', '1.0.0', actor)).toEqual(before);
    expect(builder.getUiDefinition).not.toHaveBeenCalled();
    expect(db.packManifest.findFirst).toHaveBeenCalledWith(expect.objectContaining({ where: expect.objectContaining({ tenantId: 'tenant-a', status: 'PUBLISHED' }) }));
    db.packManifest.findFirst.mockResolvedValue({ contractVersion: '1.0.0', manifestHash: 'tampered', content, packVersion: publishedPackVersion });
    await expect(service.publishedManifest('test', '1.0.0', actor)).rejects.toThrow('PACK_MANIFEST_HASH_INVALID');
  });
});
