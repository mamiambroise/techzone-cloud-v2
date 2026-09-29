import { BmTenantGuard } from '../bm-tenant.guard';
import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';

import { NavigationService } from './navigation.service';
import { CurrentPrincipal } from '../../../iam/principal.decorator';
import type { IamPrincipal } from '../../../iam/principal.decorator';
import { TenantResource } from '../../../iam/tenant-resource.decorator';
import { TenantGuard } from '../../../iam/tenant.guard';

import {
  CreateMenuDto,
  CreateMenuItemDto,
  UpdateMenuItemDto,
  ResolveNavigationDto,
} from './dto/create-navigation.dto';

@TenantResource({ table: 'bm_menu', idParam: 'menuId' })
@UseGuards(BmTenantGuard, TenantGuard)
@Controller('api/business-manager/navigation')
export class NavigationController {
  constructor(private readonly navigationService: NavigationService) {}

  @Get(':versionId/menus')
  findAllMenus(
    @Param('versionId', new ParseUUIDPipe()) versionId: string,
    @CurrentPrincipal() principal: IamPrincipal,
  ) {
    return this.navigationService.findAllMenus(versionId, principal.tenantId);
  }

  @Post(':versionId/menus')
  createMenu(
    @Param('versionId', new ParseUUIDPipe()) versionId: string,
    @Body() dto: CreateMenuDto,
    @CurrentPrincipal() principal: IamPrincipal,
  ) {
    return this.navigationService.createMenu(versionId, dto, principal.tenantId);
  }

  @Get('menus/:menuId')
  findOneMenu(
    @Param('menuId', new ParseUUIDPipe()) menuId: string,
    @CurrentPrincipal() principal: IamPrincipal,
  ) {
    return this.navigationService.findOneMenu(menuId, principal.tenantId);
  }

  @Patch('menus/:menuId')
  updateMenu(
    @Param('menuId', new ParseUUIDPipe()) menuId: string,
    @Body() dto: CreateMenuDto,
    @CurrentPrincipal() principal: IamPrincipal,
  ) {
    return this.navigationService.updateMenu(menuId, dto, principal.tenantId);
  }

  @Get('menus/:menuId/template')
  getMenuTemplate(
    @Param('menuId', new ParseUUIDPipe()) menuId: string,
    @CurrentPrincipal() principal: IamPrincipal,
  ) {
    return this.navigationService.getMenuTemplate(menuId, principal.tenantId);
  }

  @Post('menus/:menuId/items')
  createMenuItem(
    @Param('menuId', new ParseUUIDPipe()) menuId: string,
    @Body() dto: CreateMenuItemDto,
    @CurrentPrincipal() principal: IamPrincipal,
  ) {
    return this.navigationService.createMenuItem(menuId, dto, principal.tenantId);
  }

  @Patch('items/:itemId')
  updateMenuItem(
    @Param('itemId', new ParseUUIDPipe()) itemId: string,
    @Body() dto: UpdateMenuItemDto,
    @CurrentPrincipal() principal: IamPrincipal,
  ) {
    return this.navigationService.updateMenuItem(itemId, dto, principal.tenantId);
  }

  @Get('items/:itemId')
  findMenuItem(
    @Param('itemId', new ParseUUIDPipe()) itemId: string,
    @CurrentPrincipal() principal: IamPrincipal,
  ) {
    return this.navigationService.findMenuItem(itemId, principal.tenantId);
  }

  @Post('menus/:menuId/resolve')
  resolveNavigation(
    @Param('menuId', new ParseUUIDPipe()) menuId: string,
    @Body() dto: ResolveNavigationDto,
    @CurrentPrincipal() principal: IamPrincipal,
  ) {
    return this.navigationService.resolveNavigation(menuId, dto, principal.tenantId);
  }
}
