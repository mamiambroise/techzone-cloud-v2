import { Body, Controller, Get, HttpCode, Param, Patch, Post, Query, UnauthorizedException, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '../../../common/guards/auth.guard';
import { PermissionGuard } from '../../../common/guards/permission.guard';
import { Permissions } from '../../../common/decorators/permissions.decorator';
import { User } from '../../../common/decorators/user.decorator';
import type { UserContext } from '../../../common/decorators/user.decorator';
import { PackChangeType, Permission } from '../../../common/enums';
import { CreatePackDto, CreatePackVersionDto, UpdatePackDto, UpdatePackVersionDto } from './dto/pack.dto';
import { CloneVersionDto, DuplicatePackDto, PackQueryDto, VersionQueryDto } from './dto/pack-query.dto';
import { PackManagerService } from './pack-manager.service';

@ApiTags('Pack Manager')
@ApiBearerAuth()
@Controller('api/v1/pack-manager')
@UseGuards(AuthGuard, PermissionGuard)
export class PackManagerController {
  constructor(private readonly service: PackManagerService) {}
  private context(user: UserContext): { tenantId: string; actorId: string } { if (!user.tenantId || !user.id) throw new UnauthorizedException('Invalid user context'); return { tenantId: user.tenantId, actorId: user.id }; }
  @Post('packs') @Permissions(Permission.PACK_CREATE) create(@Body() dto: CreatePackDto, @User() user: UserContext) { const context = this.context(user); return this.service.createPack(context.tenantId, context.actorId, dto); }
  @Get('packs') @Permissions(Permission.PACK_READ) list(@Query() query: PackQueryDto, @User() user: UserContext) { return this.service.listPacks(this.context(user).tenantId, query); }
  @Get('packs/:id') @Permissions(Permission.PACK_READ) get(@Param('id') id: string, @User() user: UserContext) { return this.service.getPack(this.context(user).tenantId, id); }
  @Patch('packs/:id') @Permissions(Permission.PACK_UPDATE) update(@Param('id') id: string, @Body() dto: UpdatePackDto, @User() user: UserContext) { const context = this.context(user); return this.service.updatePack(context.tenantId, id, dto, context.actorId); }
  @Post('packs/:id/archive') @HttpCode(204) @Permissions(Permission.PACK_ARCHIVE) archive(@Param('id') id: string, @User() user: UserContext) { const context = this.context(user); return this.service.archivePack(context.tenantId, id, context.actorId); }
  @Post('packs/:id/restore') @Permissions(Permission.PACK_RESTORE) restore(@Param('id') id: string, @User() user: UserContext) { const context = this.context(user); return this.service.restorePack(context.tenantId, id, context.actorId); }
  @Post('packs/:id/duplicate') @Permissions(Permission.PACK_DUPLICATE) duplicate(@Param('id') id: string, @Body() dto: DuplicatePackDto, @User() user: UserContext) { const context = this.context(user); return this.service.duplicatePack(context.tenantId, id, context.actorId, dto); }
  @Post('packs/:packId/versions') @Permissions(Permission.PACK_VERSION_CREATE) createVersion(@Param('packId') packId: string, @Body() dto: CreatePackVersionDto, @User() user: UserContext) { const context = this.context(user); return this.service.createVersion(context.tenantId, packId, context.actorId, dto); }
  @Get('packs/:packId/versions/suggest') @Permissions(Permission.PACK_VERSION_CREATE) suggestVersion(@Param('packId') packId: string, @Query('changeType') changeType: PackChangeType, @User() user: UserContext) { return this.service.suggestVersion(this.context(user).tenantId, packId, changeType); }
  @Get('packs/:packId/versions') @Permissions(Permission.PACK_VERSION_READ) versions(@Param('packId') packId: string, @Query() query: VersionQueryDto, @User() user: UserContext) { return this.service.listVersions(this.context(user).tenantId, packId, query); }
  @Get('versions/compare') @Permissions(Permission.PACK_VERSION_READ) compare(@Query('left') left: string, @Query('right') right: string, @User() user: UserContext) { return this.service.compareVersions(this.context(user).tenantId, left, right); }
  @Get('versions/:id') @Permissions(Permission.PACK_VERSION_READ) version(@Param('id') id: string, @User() user: UserContext) { return this.service.getVersion(this.context(user).tenantId, id); }
  @Post('versions/:id/clone') @Permissions(Permission.PACK_VERSION_CREATE) clone(@Param('id') id: string, @Body() dto: CloneVersionDto, @User() user: UserContext) { const context = this.context(user); return this.service.cloneVersion(context.tenantId, id, context.actorId, dto); }
  @Patch('versions/:id') @Permissions(Permission.PACK_UPDATE) updateVersion(@Param('id') id: string, @Body() dto: UpdatePackVersionDto, @User() user: UserContext) { return this.service.updateVersion(this.context(user).tenantId, id, dto); }
  @Post('versions/:id/validate') @Permissions(Permission.PACK_UPDATE) validate(@Param('id') id: string, @User() user: UserContext) { return this.service.validateVersion(this.context(user).tenantId, id); }
  @Get('versions/:id/validation') @Permissions(Permission.PACK_VERSION_READ) validation(@Param('id') id: string, @User() user: UserContext) { return this.service.getVersion(this.context(user).tenantId, id).then((version) => version.validationDetails ?? { status: version.validationStatus }); }
  @Post('versions/:id/manifest') @Permissions(Permission.PACK_UPDATE) manifestPost(@Param('id') id: string, @User() user: UserContext) { const context = this.context(user); return this.service.generateManifest(context.tenantId, id, context.actorId); }
  @Get('versions/:id/manifest') @Permissions(Permission.PACK_VERSION_READ) manifest(@Param('id') id: string, @User() user: UserContext) { return this.service.manifest(this.context(user).tenantId, id); }
  @Post('versions/:id/publish') @Permissions(Permission.PACK_VERSION_PUBLISH) publish(@Param('id') id: string, @User() user: UserContext) { const context = this.context(user); return this.service.publish(context.tenantId, id, context.actorId); }
  @Post('versions/:id/deprecate') @Permissions(Permission.PACK_VERSION_PUBLISH) deprecate(@Param('id') id: string, @User() user: UserContext) { const context = this.context(user); return this.service.deprecateVersion(context.tenantId, id, context.actorId); }
  @Post('versions/:id/archive') @Permissions(Permission.PACK_VERSION_PUBLISH) archiveVersion(@Param('id') id: string, @User() user: UserContext) { const context = this.context(user); return this.service.archiveVersion(context.tenantId, id, context.actorId); }
}
