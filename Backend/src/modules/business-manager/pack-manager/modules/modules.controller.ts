import { Body, Controller, Get, Param, Patch, Post, Query, UnauthorizedException, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '../../../../common/guards/auth.guard';
import { PermissionGuard } from '../../../../common/guards/permission.guard';
import { Permissions } from '../../../../common/decorators/permissions.decorator';
import { User } from '../../../../common/decorators/user.decorator';
import type { UserContext } from '../../../../common/decorators/user.decorator';
import { Permission } from '../../../../common/enums';
import { CreateModuleDto, DuplicateModuleDto, ModuleQueryDto, ReorderModulesDto, UpdateModuleDto } from './dto/module.dto';
import { ModulesService } from './modules.service';

@ApiTags('Pack Manager Modules') @ApiBearerAuth() @Controller('api/v1/pack-manager') @UseGuards(AuthGuard, PermissionGuard)
export class ModulesController {
  constructor(private readonly service: ModulesService) {}
  @Get('versions/:versionId/modules') @Permissions(Permission.PACK_MODULE_READ) list(@Param('versionId') versionId: string, @Query() query: ModuleQueryDto, @User() user: UserContext) { return this.service.list(this.context(user), versionId, query); }
  @Post('versions/:versionId/modules') @Permissions(Permission.PACK_MODULE_CREATE) create(@Param('versionId') versionId: string, @Body() dto: CreateModuleDto, @User() user: UserContext) { const context = this.contextWithActor(user); return this.service.create(context.tenantId, versionId, context.actorId, dto); }
  @Post('versions/:versionId/modules/reorder') @Permissions(Permission.PACK_MODULE_REORDER) reorder(@Param('versionId') versionId: string, @Body() dto: ReorderModulesDto, @User() user: UserContext) { const context = this.contextWithActor(user); return this.service.reorder(context.tenantId, versionId, context.actorId, dto); }
  @Get('modules/:id') @Permissions(Permission.PACK_MODULE_READ) get(@Param('id') id: string, @User() user: UserContext) { return this.service.get(this.context(user), id); }
  @Patch('modules/:id') @Permissions(Permission.PACK_MODULE_UPDATE) update(@Param('id') id: string, @Body() dto: UpdateModuleDto, @User() user: UserContext) { const context = this.contextWithActor(user); return this.service.update(context.tenantId, id, context.actorId, dto); }
  @Post('modules/:id/duplicate') @Permissions(Permission.PACK_MODULE_DUPLICATE) duplicate(@Param('id') id: string, @Body() dto: DuplicateModuleDto, @User() user: UserContext) { const context = this.contextWithActor(user); return this.service.duplicate(context.tenantId, id, context.actorId, dto); }
  @Post('modules/:id/enable') @Permissions(Permission.PACK_MODULE_ENABLE) enable(@Param('id') id: string, @User() user: UserContext) { const context = this.contextWithActor(user); return this.service.setEnabled(context.tenantId, id, context.actorId, true); }
  @Post('modules/:id/disable') @Permissions(Permission.PACK_MODULE_DISABLE) disable(@Param('id') id: string, @User() user: UserContext) { const context = this.contextWithActor(user); return this.service.setEnabled(context.tenantId, id, context.actorId, false); }
  @Get('modules/:id/impact') @Permissions(Permission.PACK_MODULE_READ) impact(@Param('id') id: string, @User() user: UserContext) { return this.service.impact(this.context(user), id); }
  @Post('modules/:id/archive') @Permissions(Permission.PACK_MODULE_ARCHIVE) archive(@Param('id') id: string, @User() user: UserContext) { const context = this.contextWithActor(user); return this.service.archive(context.tenantId, id, context.actorId); }
  private context(user: UserContext): string { if (!user.tenantId) throw new UnauthorizedException('Invalid tenant context'); return user.tenantId; }
  private contextWithActor(user: UserContext): { tenantId: string; actorId: string } { if (!user.tenantId || !user.id) throw new UnauthorizedException('Invalid user context'); return { tenantId: user.tenantId, actorId: user.id }; }
}
