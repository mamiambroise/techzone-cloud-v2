import { jest } from '@jest/globals';
import { HttpStatus } from '@nestjs/common';
import { FeatureCapabilityService } from './features.service';
import { PlatformException } from '../../../common/errors/platform.exception';
import { BmFeatureStatus, BmCapabilityStatus } from '../../../generated/prisma/enums';

function createMockPrisma() {
  return {
    applicationVersion: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
    },
    bmFeature: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    bmVersionFeature: {
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    bmVersionCapability: {
      findFirst: jest.fn(),
      create: jest.fn(),
      findMany: jest.fn(),
    },
    bmFeatureCapability: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    bmCapabilityDependency: {
      findMany: jest.fn(),
      create: jest.fn(),
    },
  };
}

describe('FeatureCapabilityService (TENANT-ISOLATION)', () => {
  let service: FeatureCapabilityService;
  let prisma: ReturnType<typeof createMockPrisma>;

  beforeEach(() => {
    prisma = createMockPrisma();
    service = new FeatureCapabilityService(prisma as any);
  });

  describe('createFeature', () => {
    it('should create feature with tenantId', async () => {
      prisma.applicationVersion.findFirst.mockResolvedValue({ id: 'av-1' });
      prisma.bmFeature.findFirst.mockResolvedValue(null);
      prisma.applicationVersion.findUnique.mockResolvedValue({ applicationId: 'app-1' });
      prisma.bmFeature.create.mockResolvedValue({ id: 'f-1', code: 'feature1', name: 'Feature 1' });

      const result = await service.createFeature(
        'av-1',
        { code: 'FEATURE1', name: 'Feature 1' } as any,
        'tenant-123',
      );

      expect(prisma.applicationVersion.findFirst).toHaveBeenCalledWith({
        where: { id: 'av-1', tenantId: 'tenant-123' },
      });
      expect(prisma.bmFeature.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          applicationId: 'app-1',
          applicationVersionId: 'av-1',
          code: 'feature1',
          tenantId: 'tenant-123',
          status: BmFeatureStatus.DRAFT,
        }),
        include: {
          capabilities: {
            include: { dependencies: true },
          },
        },
      });
      expect(result.id).toBe('f-1');
    });

    it('should create feature with undefined tenantId when null', async () => {
      prisma.applicationVersion.findFirst.mockResolvedValue({ id: 'av-1' });
      prisma.bmFeature.findFirst.mockResolvedValue(null);
      prisma.applicationVersion.findUnique.mockResolvedValue({ applicationId: 'app-1' });
      prisma.bmFeature.create.mockResolvedValue({ id: 'f-1', code: 'feature1', name: 'Feature 1' });

      await service.createFeature('av-1', { code: 'FEATURE1', name: 'Feature 1' } as any, null);

      expect(prisma.bmFeature.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ tenantId: undefined }),
        }),
      );
    });

    it('should throw when feature code already exists', async () => {
      prisma.applicationVersion.findFirst.mockResolvedValue({ id: 'av-1' });
      prisma.bmFeature.findFirst.mockResolvedValue({ id: 'existing', code: 'feature1' });

      await expect(
        service.createFeature('av-1', { code: 'FEATURE1', name: 'Feature 1' } as any, 'tenant-123'),
      ).rejects.toThrow(PlatformException);
    });
  });

  describe('createCapability', () => {
    it('should create capability with tenantId', async () => {
      prisma.bmFeature.findFirst.mockResolvedValue({ id: 'feat-1', tenantId: 'tenant-123' });
      prisma.bmFeatureCapability.create.mockResolvedValue({ id: 'cap-1', code: 'cap1', name: 'Capability 1' });

      const result = await service.createCapability('feat-1', { code: 'CAP1', name: 'Capability 1' } as any, 'tenant-123');

      expect(prisma.bmFeature.findFirst).toHaveBeenCalledWith({
        where: { id: 'feat-1', tenantId: 'tenant-123' },
      });
      expect(prisma.bmFeatureCapability.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          featureId: 'feat-1',
          code: 'cap1',
          tenantId: 'tenant-123',
          status: BmCapabilityStatus.DRAFT,
        }),
      });
      expect(result.id).toBe('cap-1');
    });

    it('should create capability with undefined tenantId when null', async () => {
      prisma.bmFeature.findFirst.mockResolvedValue({ id: 'feat-1', tenantId: undefined });
      prisma.bmFeatureCapability.create.mockResolvedValue({ id: 'cap-1', code: 'cap1', name: 'Capability 1' });

      await service.createCapability('feat-1', { code: 'CAP1', name: 'Capability 1' } as any, null);

      expect(prisma.bmFeatureCapability.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ tenantId: undefined }),
        }),
      );
    });
  });
});
