import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../../../common/guards/auth.guard';
import { PermissionGuard } from '../../../common/guards/permission.guard';
import { MenuService } from './menu.service';
@Controller('api/v1/business-manager') @UseGuards(AuthGuard, PermissionGuard)
export class MenuController {
  constructor(private readonly service: MenuService) {}
  @Get('menus') list(@Query() query: any) { return this.service.listMenus(query); }
  @Post('menus') create(@Body() body: any) { return this.service.createMenu(body); }
  @Get('menus/:id') get(@Param('id') id: string) { return this.service.getMenu(id); }
  @Patch('menus/:id') update(@Param('id') id: string, @Body() body: any) { return this.service.updateMenu(id, body); }
  @Post('menus/:id/archive') archive(@Param('id') id: string, @Body() body: any) { return this.service.archiveMenu(id, body.expectedVersion); }
  @Get('menus/:menuId/items') items(@Param('menuId') id: string) { return this.service.listItems(id); }
  @Post('menus/:menuId/items') createItem(@Param('menuId') id: string, @Body() body: any) { return this.service.createItem(id, body); }
  @Patch('menu-items/:id') updateItem(@Param('id') id: string, @Body() body: any) { return this.service.updateItem(id, body); }
  @Post('menu-items/:id/move') move(@Param('id') id: string, @Body() body: any) { return this.service.moveItem(id, body.parentId, body.sortOrder, body.expectedVersion); }
  @Post('menus/:menuId/items/reorder') reorder(@Param('menuId') id: string, @Body() body: any) { return this.service.reorder(id, body.items ?? []); }
  @Get('menu-items/:id/requirements') requirements(@Param('id') id: string) { return this.service.requirements(id); }
  @Post('menu-items/:id/features') feature(@Param('id') id: string, @Body() body: any) { return this.service.addFeatureRequirement(id, body.featureId); }
  @Post('menu-items/:id/capabilities') capability(@Param('id') id: string, @Body() body: any) { return this.service.addCapabilityRequirement(id, body.capabilityId); }
  @Post('application-versions/:versionId/menus/:menuId/enable') enable(@Param('versionId') versionId: string, @Param('menuId') menuId: string) { return this.service.enableMenu(versionId, menuId, true); }
  @Post('application-versions/:versionId/menus/:menuId/disable') disable(@Param('versionId') versionId: string, @Param('menuId') menuId: string) { return this.service.enableMenu(versionId, menuId, false); }
  @Get('application-versions/:versionId/navigation/preview') preview(@Param('versionId') id: string, @Query('location') location?: string) { return this.service.resolve(id, location); }
  @Post('application-versions/:versionId/navigation/validate') validate(@Param('versionId') id: string) { return this.service.validate(id); }
  @Get('application-versions/:versionId/navigation/snapshot') snapshot(@Param('versionId') id: string) { return this.service.snapshot(id); }
}
