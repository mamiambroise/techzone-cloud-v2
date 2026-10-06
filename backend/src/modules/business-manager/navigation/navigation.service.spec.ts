import { jest } from '@jest/globals';
import { NavigationService } from './navigation.service';
import { PlatformException } from '../../../common/errors/platform.exception';
import { BmNavigationStatus } from '../../../generated/prisma/enums';

function createMockPrisma() {
  return {
    applicationVersion: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
    },
    bmMenu: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
    },
    bmMenuItem: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    bmMenuLocation: {
      findMany: jest.fn(),
    },
  };
}

describe('NavigationService (TENANT-ISOLATION)', () => {
  let service: NavigationService;
  let prisma: ReturnType<typeof createMockPrisma>;

  /** Version ouverte à l'écriture : DRAFT et VALIDATING restent mutables. */
  const writableVersion = { id: 'av-1', applicationId: 'app-1', status: 'DRAFT', version: '1.0.0' };

  beforeEach(() => {
    prisma = createMockPrisma();
    service = new NavigationService(prisma as any);
  });

  describe('createMenu', () => {
    it('should create menu with tenantId', async () => {
      prisma.applicationVersion.findFirst.mockResolvedValue(writableVersion);
      prisma.bmMenu.findFirst.mockResolvedValue(null);
      prisma.applicationVersion.findUnique.mockResolvedValue({ applicationId: 'app-1' });
      prisma.bmMenu.create.mockResolvedValue({ id: 'm-1', code: 'main-menu', name: 'Main Menu' });

      const result = await service.createMenu(
        'av-1',
        { code: 'MAIN_MENU', name: 'Main Menu' } as any,
        'tenant-123',
      );

      expect(prisma.applicationVersion.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 'av-1', tenantId: 'tenant-123' } }),
      );
      expect(prisma.bmMenu.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          applicationId: 'app-1',
          applicationVersionId: 'av-1',
          code: 'main_menu',
          tenantId: 'tenant-123',
          status: BmNavigationStatus.DRAFT,
        }),
      });
      expect(result.id).toBe('m-1');
    });

    it('should create menu with undefined tenantId when null', async () => {
      prisma.applicationVersion.findFirst.mockResolvedValue(writableVersion);
      prisma.bmMenu.findFirst.mockResolvedValue(null);
      prisma.applicationVersion.findUnique.mockResolvedValue({ applicationId: 'app-1' });
      prisma.bmMenu.create.mockResolvedValue({ id: 'm-1', code: 'main_menu', name: 'Main Menu' });

      await service.createMenu('av-1', { code: 'MAIN_MENU', name: 'Main Menu' } as any, null);

      expect(prisma.bmMenu.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ tenantId: undefined }),
        }),
      );
    });

    it('should reject a menu written on a published version', async () => {
      prisma.applicationVersion.findFirst.mockResolvedValue({
        ...writableVersion,
        status: 'ACTIVE',
      });

      await expect(
        service.createMenu('av-1', { code: 'MAIN_MENU', name: 'Main Menu' } as any, 'tenant-123'),
      ).rejects.toThrow(PlatformException);

      expect(prisma.bmMenu.create).not.toHaveBeenCalled();
    });
  });

  describe('resolveNavigation', () => {
    it('should hide entries whose business permission is not granted', async () => {
      prisma.bmMenu.findFirst.mockResolvedValue({
        id: 'm-1',
        applicationVersionId: 'av-1',
        code: 'main',
        name: 'Main',
        location: 'SIDEBAR',
        items: [
          { id: 'i-1', parentItemId: null, code: 'dashboard', label: 'Dashboard', itemType: 'LINK', orderIndex: 0, requiredCapabilities: [], capabilityOperator: 'ANY' },
          { id: 'i-2', parentItemId: null, code: 'orders', label: 'Commandes', itemType: 'LINK', orderIndex: 1, requiredCapabilities: ['order.read'], capabilityOperator: 'ANY' },
        ],
      });

      const result = await service.resolveNavigation('m-1', { capabilities: [] } as any, 'tenant-123');

      expect(result.resolvedNavigation.map((item) => item.code)).toEqual(['dashboard']);
    });

    it('should keep entries whose business permission is granted', async () => {
      prisma.bmMenu.findFirst.mockResolvedValue({
        id: 'm-1',
        applicationVersionId: 'av-1',
        code: 'main',
        name: 'Main',
        location: 'SIDEBAR',
        items: [
          { id: 'i-1', parentItemId: null, code: 'orders', label: 'Commandes', itemType: 'LINK', orderIndex: 0, requiredCapabilities: ['order.read'], capabilityOperator: 'ANY' },
        ],
      });

      const result = await service.resolveNavigation(
        'm-1',
        { capabilities: ['order.read'] } as any,
        'tenant-123',
      );

      expect(result.resolvedNavigation.map((item) => item.code)).toEqual(['orders']);
    });

    it('should drop a group left without any visible child', async () => {
      prisma.bmMenu.findFirst.mockResolvedValue({
        id: 'm-1',
        applicationVersionId: 'av-1',
        code: 'main',
        name: 'Main',
        location: 'SIDEBAR',
        items: [
          {
            id: 'g-1',
            parentItemId: null,
            code: 'sales',
            label: 'Ventes',
            itemType: 'GROUP',
            orderIndex: 0,
            requiredCapabilities: ['sales.read'],
            capabilityOperator: 'ANY',
          },
          {
            id: 'i-1',
            parentItemId: 'g-1',
            code: 'orders',
            label: 'Commandes',
            itemType: 'LINK',
            orderIndex: 0,
            requiredCapabilities: ['order.read'],
            capabilityOperator: 'ANY',
          },
        ],
      });

      const result = await service.resolveNavigation('m-1', { capabilities: [] } as any, 'tenant-123');

      expect(result.resolvedNavigation).toEqual([]);
    });
  });
});
