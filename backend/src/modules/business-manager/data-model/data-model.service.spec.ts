import { jest } from '@jest/globals';
import { HttpStatus } from '@nestjs/common';
import { DataModelService } from './data-model.service';
import { PlatformException } from '../../../common/errors/platform.exception';
import { BmEntityStatus } from '../../../generated/prisma/enums';

function createMockPrisma() {
  return {
    applicationVersion: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
    },
    bmEntity: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    bmRelation: {
      findMany: jest.fn(),
    },
    bmFeature: {
      findMany: jest.fn(),
    },
  };
}

describe('DataModelService (TENANT-ISOLATION)', () => {
  let service: DataModelService;
  let prisma: ReturnType<typeof createMockPrisma>;

  beforeEach(() => {
    prisma = createMockPrisma();
    service = new DataModelService(prisma as any);
  });

  describe('createEntity', () => {
    it('should create entity with tenantId filter', async () => {
      prisma.applicationVersion.findFirst.mockResolvedValue({ id: 'av-1', applicationId: 'app-1' });
      prisma.bmEntity.findFirst.mockResolvedValue(null);
      prisma.applicationVersion.findUnique.mockResolvedValue({ applicationId: 'app-1' });
      prisma.bmEntity.create.mockResolvedValue({ id: 'e-1', code: 'user', name: 'User' });

      const result = await service.createEntity(
        'av-1',
        { code: 'USER', name: 'User', pluralName: 'Users' } as any,
        'tenant-123',
      );

      expect(prisma.applicationVersion.findFirst).toHaveBeenCalledWith({
        where: { id: 'av-1', tenantId: 'tenant-123' },
      });
      expect(prisma.bmEntity.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          applicationId: 'app-1',
          applicationVersionId: 'av-1',
          code: 'user',
          tenantId: 'tenant-123',
          status: BmEntityStatus.DRAFT,
        }),
        include: {
          fields: { take: 50, orderBy: { position: 'asc' } },
          constraints: true,
          indexes: { include: { fields: { take: 20 } } },
          computedFields: true,
        },
      });
      expect(result.id).toBe('e-1');
    });

    it('should create entity with undefined tenantId when tenantId is null', async () => {
      prisma.applicationVersion.findFirst.mockResolvedValue({ id: 'av-1', applicationId: 'app-1' });
      prisma.bmEntity.findFirst.mockResolvedValue(null);
      prisma.applicationVersion.findUnique.mockResolvedValue({ applicationId: 'app-1' });
      prisma.bmEntity.create.mockResolvedValue({ id: 'e-1', code: 'user', name: 'User' });

      await service.createEntity(
        'av-1',
        { code: 'USER', name: 'User' } as any,
        null,
      );

      expect(prisma.bmEntity.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ tenantId: undefined }),
        }),
      );
    });

    it('should throw PlatformException when entity code already exists', async () => {
      prisma.applicationVersion.findFirst.mockResolvedValue({ id: 'av-1', applicationId: 'app-1' });
      prisma.bmEntity.findFirst.mockResolvedValue({ id: 'existing', code: 'user' });

      await expect(
        service.createEntity('av-1', { code: 'USER', name: 'User' } as any, 'tenant-123'),
      ).rejects.toThrow(PlatformException);
    });

    it('should throw NotFound when application version does not exist', async () => {
      prisma.applicationVersion.findFirst.mockResolvedValue(null);

      await expect(
        service.createEntity('av-1', { code: 'USER', name: 'User' } as any, 'tenant-123'),
      ).rejects.toThrow(PlatformException);
    });
  });

  describe('findAllEntities', () => {
    it('should find all entities filtered by tenantId', async () => {
      prisma.applicationVersion.findFirst.mockResolvedValue({ id: 'av-1' });
      prisma.bmEntity.findMany.mockResolvedValue([]);

      await service.findAllEntities('av-1', 'tenant-123');

      expect(prisma.bmEntity.findMany).toHaveBeenCalledWith({
        where: {
          applicationVersionId: 'av-1',
          tenantId: 'tenant-123',
        },
        orderBy: { createdAt: 'desc' },
        include: {
          fields: { take: 100, orderBy: { position: 'asc' } },
          constraints: true,
          indexes: true,
        },
      });
    });

    it('should find all entities with undefined tenantId when null', async () => {
      prisma.applicationVersion.findFirst.mockResolvedValue({ id: 'av-1' });
      prisma.bmEntity.findMany.mockResolvedValue([]);

      await service.findAllEntities('av-1', null);

      expect(prisma.bmEntity.findMany).toHaveBeenCalledWith({
        where: {
          applicationVersionId: 'av-1',
          tenantId: undefined,
        },
        orderBy: { createdAt: 'desc' },
        include: {
          fields: { take: 100, orderBy: { position: 'asc' } },
          constraints: true,
          indexes: true,
        },
      });
    });
  });

  describe('getDependencyGraph', () => {
    it('should return dependency graph with entities, relations, and features', async () => {
      prisma.applicationVersion.findFirst.mockResolvedValue({ id: 'av-1' });
      prisma.bmEntity.findMany.mockResolvedValue([]);
      prisma.bmRelation.findMany.mockResolvedValue([]);
      prisma.bmFeature.findMany.mockResolvedValue([]);

      const result = await service.getDependencyGraph('av-1', 'tenant-123');

      expect(result).toEqual({
        entities: [],
        relations: [],
        features: [],
      });
    });
  });
});
