import { jest } from '@jest/globals';
import { HttpStatus } from '@nestjs/common';
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

  beforeEach(() => {
    prisma = createMockPrisma();
    service = new NavigationService(prisma as any);
  });

  describe('createMenu', () => {
    it('should create menu with tenantId', async () => {
      prisma.applicationVersion.findFirst.mockResolvedValue({ id: 'av-1' });
      prisma.bmMenu.findFirst.mockResolvedValue(null);
      prisma.applicationVersion.findUnique.mockResolvedValue({ applicationId: 'app-1' });
      prisma.bmMenu.create.mockResolvedValue({ id: 'm-1', code: 'main-menu', name: 'Main Menu' });

      const result = await service.createMenu(
        'av-1',
        { code: 'MAIN_MENU', name: 'Main Menu' } as any,
        'tenant-123',
      );

      expect(prisma.applicationVersion.findFirst).toHaveBeenCalledWith({
        where: { id: 'av-1', tenantId: 'tenant-123' },
      });
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
      prisma.applicationVersion.findFirst.mockResolvedValue({ id: 'av-1' });
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
  });
});
