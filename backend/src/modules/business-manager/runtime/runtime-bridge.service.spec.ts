import { jest } from '@jest/globals';
import { RuntimeBridgeService } from './runtime-bridge.service';
import { BmNavigationStatus } from '../../../generated/prisma/enums';

function createMockPrisma() {
  return {
    applicationVersion: {
      findFirst: jest.fn(),
    },
    bmRuntimeManifest: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    bmRuntimeBinding: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
  };
}

describe('RuntimeBridgeService (TENANT-ISOLATION)', () => {
  let service: RuntimeBridgeService;
  let prisma: ReturnType<typeof createMockPrisma>;

  beforeEach(() => {
    prisma = createMockPrisma();
    service = new RuntimeBridgeService(prisma as any);
  });

  describe('createManifest', () => {
    it('should create runtime manifest with tenantId', async () => {
      prisma.applicationVersion.findFirst.mockResolvedValue({
        id: 'av-1',
        applicationId: 'app-1',
        status: 'DRAFT',
        version: '1.0.0',
      });
      prisma.bmRuntimeManifest.findFirst.mockResolvedValue(null);
      prisma.bmRuntimeManifest.create.mockResolvedValue({ id: 'rm-1', code: 'manifest1', name: 'Manifest 1' });

      const result = await service.createManifest(
        'av-1',
        { code: 'MANIFEST1', name: 'Manifest 1' } as any,
        'tenant-123',
      );

      expect(prisma.applicationVersion.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'av-1', tenantId: 'tenant-123' },
        }),
      );
      expect(prisma.bmRuntimeManifest.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          applicationId: 'app-1',
          applicationVersionId: 'av-1',
          code: 'manifest1',
          tenantId: 'tenant-123',
          status: BmNavigationStatus.DRAFT,
        }),
      });
      expect(result.id).toBe('rm-1');
    });

    it('should create runtime manifest with undefined tenantId when null', async () => {
      prisma.applicationVersion.findFirst.mockResolvedValue({
        id: 'av-1',
        applicationId: 'app-1',
        status: 'DRAFT',
        version: '1.0.0',
      });
      prisma.bmRuntimeManifest.findFirst.mockResolvedValue(null);
      prisma.bmRuntimeManifest.create.mockResolvedValue({ id: 'rm-1', code: 'manifest1', name: 'Manifest 1' });

      await service.createManifest('av-1', { code: 'MANIFEST1', name: 'Manifest 1' } as any, null);

      expect(prisma.bmRuntimeManifest.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ tenantId: undefined }),
        }),
      );
    });

    it('refuses to update a manifest when its application version is published', async () => {
      prisma.bmRuntimeManifest.findFirst.mockResolvedValue({
        id: 'manifest-1',
        applicationVersionId: 'av-1',
        tenantId: 'tenant-123',
        status: BmNavigationStatus.DRAFT,
      });
      prisma.applicationVersion.findFirst.mockResolvedValue({
        id: 'av-1',
        applicationId: 'app-1',
        status: 'ACTIVE',
        version: '1.0.0',
      });

      await expect(
        service.updateManifest(
          'manifest-1',
          { name: 'Updated' } as any,
          'tenant-123',
        ),
      ).rejects.toThrow();
      expect(prisma.bmRuntimeManifest.update).not.toHaveBeenCalled();
    });
  });
});
