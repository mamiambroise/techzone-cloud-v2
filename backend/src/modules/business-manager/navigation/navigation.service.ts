import { Injectable, HttpStatus } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { PlatformErrorCode } from '../../../common/errors/platform-error-code.enum';
import { PlatformException } from '../../../common/errors/platform.exception';
import { BmNavigationStatus, BmMenuItemType, BmNavigationVisibility, BmMenuLocation } from '../../../generated/prisma/enums';
import {
  CreateMenuDto,
  CreateMenuItemDto,
  UpdateMenuItemDto,
  ResolveNavigationDto,
} from './dto/create-navigation.dto';

@Injectable()
export class NavigationService {
  constructor(private readonly prisma: PrismaService) {}

  private async ensureApplicationVersionExists(applicationVersionId: string, tenantId: string | null) {
    const version = await this.prisma.applicationVersion.findFirst({
      where: {
        id: applicationVersionId,
        tenantId: tenantId ?? undefined,
      },
    });

    if (!version) {
      throw new PlatformException(
        PlatformErrorCode.VERSION_NOT_FOUND,
        `Application version "${applicationVersionId}" not found`,
        HttpStatus.NOT_FOUND,
      );
    }

    return version;
  }

  // =====================================================================
  // MENU MANAGEMENT
  // =====================================================================

  async createMenu(applicationVersionId: string, dto: CreateMenuDto, tenantId: string | null) {
    await this.ensureApplicationVersionExists(applicationVersionId, tenantId);

    const code = dto.code.trim().toLowerCase();

    const existing = await this.prisma.bmMenu.findFirst({
      where: {
        applicationVersionId,
        code,
        tenantId: tenantId ?? undefined,
      },
    });

    if (existing) {
      throw new PlatformException(
        PlatformErrorCode.APPLICATION_CODE_EXISTS,
        `Menu with code "${code}" already exists in this version`,
        HttpStatus.CONFLICT,
      );
    }

    const appVersion = await this.prisma.applicationVersion.findUnique({
      where: { id: applicationVersionId },
      include: { application: true },
    });

    return this.prisma.bmMenu.create({
      data: {
        applicationVersionId,
        applicationId: appVersion?.applicationId ?? '',
        code,
        name: dto.name,
        description: dto.description,
        location: dto.location || 'SIDEBAR',
        version: dto.version || '1.0.0',
        status: BmNavigationStatus.DRAFT,
        tenantId: tenantId ?? undefined,
      },
    });
  }

  async findAllMenus(applicationVersionId: string, tenantId: string | null) {
    await this.ensureApplicationVersionExists(applicationVersionId, tenantId);

    return this.prisma.bmMenu.findMany({
      where: {
        applicationVersionId,
        tenantId: tenantId ?? undefined,
      },
      orderBy: { createdAt: 'desc' },
      include: {
        items: { orderBy: { orderIndex: 'asc' } },
      },
    });
  }

  async findOneMenu(id: string, tenantId: string | null) {
    const menu = await this.prisma.bmMenu.findFirst({
      where: {
        id,
        tenantId: tenantId ?? undefined,
      },
      include: {
        items: { orderBy: { orderIndex: 'asc' } },
      },
    });

    if (!menu) {
      throw new PlatformException(
        PlatformErrorCode.APPLICATION_NOT_FOUND,
        `Menu "${id}" not found`,
        HttpStatus.NOT_FOUND,
      );
    }

    return menu;
  }

  async updateMenu(id: string, dto: CreateMenuDto, tenantId: string | null) {
    const menu = await this.findOneMenu(id, tenantId);

    if (menu.status === BmNavigationStatus.ACTIVE) {
      throw new PlatformException(
        PlatformErrorCode.APPLICATION_ARCHIVED,
        'Active menu cannot be modified',
        HttpStatus.CONFLICT,
      );
    }

    return this.prisma.bmMenu.update({
      where: { id },
      data: {
        code: dto.code?.trim().toLowerCase(),
        name: dto.name,
        description: dto.description,
        location: dto.location,
        version: dto.version,
      },
    });
  }

  // =====================================================================
  // MENU ITEM MANAGEMENT
  // =====================================================================

  async createMenuItem(menuId: string, dto: CreateMenuItemDto, tenantId: string | null) {
    const menu = await this.findOneMenu(menuId, tenantId);

    if (dto.parentItemId) {
      const parent = await this.prisma.bmNavigationItem.findFirst({
        where: { id: dto.parentItemId, menuId },
      });
      if (!parent) {
        throw new PlatformException(
          PlatformErrorCode.APPLICATION_NOT_FOUND,
          `Parent menu item "${dto.parentItemId}" not found in this menu`,
          HttpStatus.NOT_FOUND,
        );
      }
    }

    return this.prisma.bmNavigationItem.create({
      data: {
        menuId,
        parentItemId: dto.parentItemId || undefined,
        code: dto.code.trim().toLowerCase(),
        label: dto.label,
        itemType: dto.itemType,
        routePath: dto.routePath,
        icon: dto.icon,
        requiredCapabilities: dto.requiredCapabilities || [],
        capabilityOperator: dto.capabilityOperator || 'ANY',
        visibility: dto.visibility || BmNavigationVisibility.VISIBLE,
        orderIndex: dto.orderIndex ?? 0,
        configuration: (dto.configuration || undefined) as any,
        version: dto.version || '1.0.0',
        tenantId: tenantId ?? undefined,
      },
    });
  }

  async updateMenuItem(id: string, dto: UpdateMenuItemDto, tenantId: string | null) {
    const item = await this.prisma.bmNavigationItem.findFirst({
      where: { id, tenantId: tenantId ?? undefined },
    });

    if (!item) {
      throw new PlatformException(
        PlatformErrorCode.APPLICATION_NOT_FOUND,
        `Navigation item "${id}" not found`,
        HttpStatus.NOT_FOUND,
      );
    }

    return this.prisma.bmNavigationItem.update({
      where: { id },
      data: {
        label: dto.label,
        routePath: dto.routePath,
        icon: dto.icon,
        requiredCapabilities: dto.requiredCapabilities,
        capabilityOperator: dto.capabilityOperator,
        visibility: dto.visibility,
        orderIndex: dto.orderIndex,
        configuration: dto.configuration as any,
      },
    });
  }

  async findMenuItem(id: string, tenantId: string | null) {
    const item = await this.prisma.bmNavigationItem.findFirst({
      where: { id, tenantId: tenantId ?? undefined },
    });

    if (!item) {
      throw new PlatformException(
        PlatformErrorCode.APPLICATION_NOT_FOUND,
        `Navigation item "${id}" not found`,
        HttpStatus.NOT_FOUND,
      );
    }

    return item;
  }

  // =====================================================================
  // NAVIGATION RESOLVER
  // =====================================================================

  async resolveNavigation(menuId: string, dto: ResolveNavigationDto, tenantId: string | null) {
    const menu = await this.findOneMenu(menuId, tenantId);
    const userCapabilities = dto.capabilities || [];

    const hasCapability = (required: string[]): boolean => {
      if (!required || required.length === 0) return true;
      if (menu.items.length > 0) {
        for (const cap of required) {
          if (userCapabilities.includes(cap)) return true;
        }
        return false;
      }
      return true;
    };

    const buildTree = (parentId: string | null, items: any[]): any[] => {
      const children = items
        .filter(item => (parentId === null ? item.parentItemId === null : item.parentItemId === parentId))
        .sort((a, b) => a.orderIndex - b.orderIndex)
        .map(item => {
          const resolved: any = {
            code: item.code,
            label: item.label,
            routePath: item.routePath,
            icon: item.icon,
            itemType: item.itemType,
            visibility: item.visibility,
            orderIndex: item.orderIndex,
          };

          if (item.itemType === BmMenuItemType.GROUP) {
            const groupChildren = buildTree(item.id, items);
            if (groupChildren.length > 0) {
              resolved.children = groupChildren;
            }
          }

          return resolved;
        });

      return children;
    };

    const resolvedItems = buildTree(null, menu.items);

    return {
      menu: {
        code: menu.code,
        name: menu.name,
        location: menu.location,
      },
      resolvedNavigation: resolvedItems,
      userCapabilities,
    };
  }

  async getMenuTemplate(applicationVersionId: string, tenantId: string | null) {
    await this.ensureApplicationVersionExists(applicationVersionId, tenantId);

    const features = await this.prisma.bmFeature.findMany({
      where: {
        applicationVersionId,
        tenantId: tenantId ?? undefined,
      },
      include: {
        capabilities: true,
      },
    });

    return {
      features: features.map(f => ({
        code: f.code,
        name: f.name,
        capabilities: f.capabilities.map(c => ({
          code: c.code,
          name: c.name,
        })),
      })),
      locations: Object.values(BmMenuLocation),
    };
  }
}


