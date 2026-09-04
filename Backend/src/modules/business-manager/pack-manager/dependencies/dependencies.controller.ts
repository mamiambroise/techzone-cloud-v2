import { Body, Controller, Get, Param, Patch, Post, Query, UnauthorizedException, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Permissions } from '../../../../common/decorators/permissions.decorator';
import { User } from '../../../../common/decorators/user.decorator';
import type { UserContext } from '../../../../common/decorators/user.decorator';
import { Permission } from '../../../../common/enums';
import { AuthGuard } from '../../../../common/guards/auth.guard';
import { PermissionGuard } from '../../../../common/guards/permission.guard';
import { CreateDependencyDto, DependencyQueryDto, UpdateDependencyDto } from './dependency.dto';
import { DependenciesService } from './dependencies.service';

@ApiTags('Pack Manager Dependencies') @ApiBearerAuth() @Controller('api/v1/pack-manager') @UseGuards(AuthGuard, PermissionGuard)
export class DependenciesController {
  constructor(private readonly service: DependenciesService) {}
  @Get('versions/:versionId/dependencies') @Permissions(Permission.PACK_DEPENDENCY_READ) list(@Param('versionId') versionId: string, @Query() query: DependencyQueryDto, @User() user: UserContext) { return this.service.list(this.context(user), versionId, query); }
  @Post('versions/:versionId/dependencies') @Permissions(Permission.PACK_DEPENDENCY_CREATE) create(@Param('versionId') versionId: string, @Body() dto: CreateDependencyDto, @User() user: UserContext) { const actor = this.actor(user); return this.service.create(actor.tenantId, versionId, actor.actorId, dto); }
  @Post('versions/:versionId/dependencies/resolve') @Permissions(Permission.PACK_DEPENDENCY_RESOLVE) resolve(@Param('versionId') versionId: string, @User() user: UserContext) { const actor = this.actor(user); return this.service.resolve(actor.tenantId, versionId, actor.actorId); }
  @Get('versions/:versionId/dependencies/graph') @Permissions(Permission.PACK_DEPENDENCY_VIEW_GRAPH) graph(@Param('versionId') versionId: string, @User() user: UserContext) { return this.service.graph(this.context(user), versionId); }
  @Get('dependencies/:id') @Permissions(Permission.PACK_DEPENDENCY_READ) get(@Param('id') id: string, @User() user: UserContext) { return this.service.get(this.context(user), id); }
  @Patch('dependencies/:id') @Permissions(Permission.PACK_DEPENDENCY_UPDATE) update(@Param('id') id: string, @Body() dto: UpdateDependencyDto, @User() user: UserContext) { const actor = this.actor(user); return this.service.update(actor.tenantId, id, actor.actorId, dto); }
  @Get('dependencies/:id/impact') @Permissions(Permission.PACK_DEPENDENCY_READ) impact(@Param('id') id: string, @User() user: UserContext) { return this.service.impact(this.context(user), id); }
  @Post('dependencies/:id/archive') @Permissions(Permission.PACK_DEPENDENCY_ARCHIVE) archive(@Param('id') id: string, @User() user: UserContext) { const actor = this.actor(user); return this.service.archive(actor.tenantId, id, actor.actorId); }
  private context(user: UserContext) { if (!user.tenantId) throw new UnauthorizedException('Invalid tenant context'); return user.tenantId; }
  private actor(user: UserContext) { if (!user.tenantId || !user.id) throw new UnauthorizedException('Invalid user context'); return { tenantId: user.tenantId, actorId: user.id }; }
}
