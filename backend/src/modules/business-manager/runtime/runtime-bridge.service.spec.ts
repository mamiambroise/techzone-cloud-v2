import { jest } from '@jest/globals';
import { RuntimeBridgeService } from './runtime-bridge.service';
import { BmNavigationStatus } from '../../../generated/prisma/enums';

function createMockPrisma() {
  return {
    applicationVersion: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
    },
    bmRuntimeManifest: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
    },
    bmRuntimeBinding: {
      findMany: jest.fn(),
      create: jest.fn(),
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
      prisma.applicationVersion.findFirst.mockResolvedValue({ id: 'av-1' });
      prisma.bmRuntimeManifest.findFirst.mockResolvedValue(null);
      prisma.applicationVersion.findUnique.mockResolvedValue({ applicationId: 'app-1' });
      prisma.bmRuntimeManifest.create.mockResolvedValue({ id: 'rm-1', code: 'manifest1', name: 'Manifest 1' });

      const result = await service.createManifest(
        'av-1',
        { code: 'MANIFEST1', name: 'Manifest 1' } as any,
        'tenant-123',
      );

      expect(prisma.applicationVersion.findFirst).toHaveBeenCalledWith({
        where: { id: 'av-1', tenantId: 'tenant-123' },
      });
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
      prisma.applicationVersion.findFirst.mockResolvedValue({ id: 'av-1' });
      prisma.bmRuntimeManifest.findFirst.mockResolvedValue(null);
      prisma.applicationVersion.findUnique.mockResolvedValue({ applicationId: 'app-1' });
      prisma.bmRuntimeManifest.create.mockResolvedValue({ id: 'rm-1', code: 'manifest1', name: 'Manifest 1' });

      await service.createManifest('av-1', { code: 'MANIFEST1', name: 'Manifest 1' } as any, null);

      expect(prisma.bmRuntimeManifest.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ tenantId: undefined }),
        }),
      );
    });
  });
});
