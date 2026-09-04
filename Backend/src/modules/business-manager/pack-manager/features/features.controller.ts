import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UnauthorizedException, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '../../../../common/guards/auth.guard';
import { PermissionGuard } from '../../../../common/guards/permission.guard';
import { Permissions } from '../../../../common/decorators/permissions.decorator';
import { User } from '../../../../common/decorators/user.decorator';
import type { UserContext } from '../../../../common/decorators/user.decorator';
import { Permission } from '../../../../common/enums';
import { AttachCapabilityDto, CapabilityQueryDto, CreateCapabilityDto, CreateFeatureDto, FeatureQueryDto, UpdateFeatureDto } from './dto/feature-capability.dto';
import { FeaturesService } from './features.service';

@ApiTags('Pack Manager Features and Capabilities') @ApiBearerAuth() @Controller('api/v1/pack-manager') @UseGuards(AuthGuard, PermissionGuard)
export class FeaturesController {
  constructor(private readonly service: FeaturesService) {}
  @Get('versions/:versionId/features') @Permissions(Permission.PACK_FEATURE_READ) features(@Param('versionId') versionId: string, @Query() query: FeatureQueryDto, @User() user: UserContext) { return this.service.listFeatures(this.context(user), versionId, query); }
  @Post('versions/:versionId/features') @Permissions(Permission.PACK_FEATURE_CREATE) createFeature(@Param('versionId') versionId: string, @Body() dto: CreateFeatureDto, @User() user: UserContext) { const context = this.actor(user); return this.service.createFeature(context.tenantId, versionId, context.actorId, dto); }
  @Get('features/:id') @Permissions(Permission.PACK_FEATURE_READ) feature(@Param('id') id: string, @User() user: UserContext) { return this.service.getFeature(this.context(user), id); }
  @Patch('features/:id') @Permissions(Permission.PACK_FEATURE_UPDATE) updateFeature(@Param('id') id: string, @Body() dto: UpdateFeatureDto, @User() user: UserContext) { const context = this.actor(user); return this.service.updateFeature(context.tenantId, id, context.actorId, dto); }
  @Post('features/:id/enable') @Permissions(Permission.PACK_FEATURE_ENABLE) enable(@Param('id') id: string, @User() user: UserContext) { const context = this.actor(user); return this.service.setEnabled(context.tenantId, id, context.actorId, true); }
  @Post('features/:id/disable') @Permissions(Permission.PACK_FEATURE_DISABLE) disable(@Param('id') id: string, @User() user: UserContext) { const context = this.actor(user); return this.service.setEnabled(context.tenantId, id, context.actorId, false); }
  @Get('features/:id/impact') @Permissions(Permission.PACK_FEATURE_READ) impact(@Param('id') id: string, @User() user: UserContext) { return this.service.impact(this.context(user), id); }
  @Post('features/:id/archive') @Permissions(Permission.PACK_FEATURE_ARCHIVE) archive(@Param('id') id: string, @User() user: UserContext) { const context = this.actor(user); return this.service.archiveFeature(context.tenantId, id, context.actorId); }
  @Get('capabilities') @Permissions(Permission.PACK_CAPABILITY_READ) capabilities(@Query() query: CapabilityQueryDto, @User() user: UserContext) { return this.service.listCapabilities(this.context(user), query); }
  @Post('capabilities') @Permissions(Permission.PACK_CAPABILITY_CREATE) createCapability(@Body() dto: CreateCapabilityDto, @User() user: UserContext) { const context = this.actor(user); return this.service.createCapability(context.tenantId, context.actorId, dto); }
  @Get('capabilities/:id') @Permissions(Permission.PACK_CAPABILITY_READ) capability(@Param('id') id: string, @User() user: UserContext) { return this.service.getCapability(this.context(user), id); }
  @Post('features/:featureId/capabilities') @Permissions(Permission.PACK_CAPABILITY_ATTACH) attach(@Param('featureId') featureId: string, @Body() dto: AttachCapabilityDto, @User() user: UserContext) { const context = this.actor(user); return this.service.attach(context.tenantId, featureId, context.actorId, dto); }
  @Delete('features/:featureId/capabilities/:capabilityId') @Permissions(Permission.PACK_CAPABILITY_DETACH) detach(@Param('featureId') featureId: string, @Param('capabilityId') capabilityId: string, @User() user: UserContext) { const context = this.actor(user); return this.service.detach(context.tenantId, featureId, capabilityId, context.actorId); }
  private context(user: UserContext) { if (!user.tenantId) throw new UnauthorizedException('Invalid tenant context'); return user.tenantId; }
  private actor(user: UserContext) { if (!user.tenantId || !user.id) throw new UnauthorizedException('Invalid user context'); return { tenantId: user.tenantId, actorId: user.id }; }
}
