import { describe, expect, it, jest } from '@jest/globals';
import { PackManagerService } from './pack-manager.service';

describe('Pack Manager isolation', () => {
  it('scopes all pack reads to the authenticated tenant', async () => {
    const findFirst = jest.fn<any>().mockResolvedValue(null);
    const service = new PackManagerService({ pmPack: { findFirst } } as any);
    await expect(service.getPack('tenant-a', 'foreign-id')).rejects.toMatchObject({
      code: 'PACK_NOT_FOUND',
    });
    expect(findFirst).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'foreign-id', tenantId: 'tenant-a' } }),
    );
  });
  it('never queries a pack outside the provided tenant', async () => {
    const findFirst = jest.fn<any>().mockResolvedValue({ id: 'id', code: 'x', name: 'X' });
    const service = new PackManagerService({ pmPack: { findFirst } } as any);
    await expect(service.getPack('tenant-b', 'id')).resolves.toMatchObject({ id: 'id' });
    expect(findFirst).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'id', tenantId: 'tenant-b' } }),
    );
  });
  it('rejects stale optimistic versions', async () => {
    const service = new PackManagerService({
      pmPack: { findFirst: jest.fn<any>().mockResolvedValue({ id: 'id', rowVersion: 3 }) },
    } as any);
    await expect(
      service.updatePack('tenant-a', 'id', { rowVersion: 2, name: 'Changed' }),
    ).rejects.toMatchObject({ code: 'PACK_VERSION_CONFLICT' });
  });
  it('refuses edits on published versions', async () => {
    const service = new PackManagerService({
      pmPackVersion: {
        findFirst: jest.fn<any>().mockResolvedValue({ id: 'v', status: 'PUBLISHED' }),
      },
    } as any);
    await expect(
      service.createModule('tenant-a', 'v', { code: 'm', name: 'Module' }),
    ).rejects.toMatchObject({ code: 'PACK_VERSION_IMMUTABLE' });
  });
});
