import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Permissions } from '../../../common/decorators/permissions.decorator';
import { User } from '../../../common/decorators/user.decorator';
import type { UserContext } from '../../../common/decorators/user.decorator';
import { Permission } from '../../../common/enums';
import { AuthGuard } from '../../../common/guards/auth.guard';
import { PermissionGuard } from '../../../common/guards/permission.guard';
import { FeatureCapabilityService } from './feature-capability.service';

@ApiTags('Feature & Capability Manager')
@ApiBearerAuth()
@Controller('api/v1/business-manager')
@UseGuards(AuthGuard, PermissionGuard)
export class FeatureCapabilityController {
  constructor(private readonly service: FeatureCapabilityService) {}

  @Get('features') @Permissions(Permission.FEATURE_READ)
  listFeatures(@Query() query: any) { return this.service.listFeatures(query); }
  @Post('features') @Permissions(Permission.FEATURE_CREATE)
  createFeature(@Body() body: any, @User() user: UserContext) { return this.service.createFeature({ ...body, createdBy: user.id }); }
  @Get('features/:featureId') @Permissions(Permission.FEATURE_READ)
  getFeature(@Param('featureId') id: string) { return this.service.getFeature(id); }
  @Patch('features/:featureId') @Permissions(Permission.FEATURE_UPDATE)
  updateFeature(@Param('featureId') id: string, @Body() body: any) { return this.service.updateFeature(id, body); }
  @Post('features/:featureId/deprecate') @Permissions(Permission.FEATURE_UPDATE)
  deprecateFeature(@Param('featureId') id: string, @Body() body: any) { return this.service.deprecateFeature(id, body?.expectedVersion); }
  @Post('features/:featureId/archive') @Permissions(Permission.FEATURE_ARCHIVE)
  archiveFeature(@Param('featureId') id: string, @Body() body: any) { return this.service.archiveFeature(id, body?.expectedVersion); }
  @Get('features/:featureId/capabilities') @Permissions(Permission.FEATURE_READ)
  getFeatureCapabilities(@Param('featureId') id: string) { return this.service.getFeatureCapabilities(id); }
  @Post('features/:featureId/capabilities') @Permissions(Permission.FEATURE_MAPPING_MANAGE)
  attachCapability(@Param('featureId') featureId: string, @Body() body: any) { return this.service.attachCapability(featureId, body.capabilityId, body.required === true, body.sortOrder); }
  @Delete('features/:featureId/capabilities/:capabilityId') @Permissions(Permission.FEATURE_MAPPING_MANAGE)
  detachCapability(@Param('featureId') featureId: string, @Param('capabilityId') capabilityId: string) { return this.service.detachCapability(featureId, capabilityId); }

  @Get('capabilities') @Permissions(Permission.CAPABILITY_READ)
  listCapabilities(@Query() query: any) { return this.service.listCapabilities(query); }
  @Post('capabilities') @Permissions(Permission.CAPABILITY_CREATE)
  createCapability(@Body() body: any, @User() user: UserContext) { return this.service.createCapability({ ...body, createdBy: user.id }); }
  @Get('capabilities/:capabilityId') @Permissions(Permission.CAPABILITY_READ)
  getCapability(@Param('capabilityId') id: string) { return this.service.getCapability(id); }
  @Patch('capabilities/:capabilityId') @Permissions(Permission.CAPABILITY_UPDATE)
  updateCapability(@Param('capabilityId') id: string, @Body() body: any) { return this.service.updateCapability(id, body); }
  @Post('capabilities/:capabilityId/deprecate') @Permissions(Permission.CAPABILITY_UPDATE)
  deprecateCapability(@Param('capabilityId') id: string, @Body() body: any) { return this.service.deprecateCapability(id, body?.expectedVersion); }
  @Post('capabilities/:capabilityId/archive') @Permissions(Permission.CAPABILITY_ARCHIVE)
  archiveCapability(@Param('capabilityId') id: string, @Body() body: any) { return this.service.archiveCapability(id, body?.expectedVersion); }
  @Get('capabilities/:capabilityId/dependencies') @Permissions(Permission.CAPABILITY_READ)
  getDependencies(@Param('capabilityId') id: string) { return this.service.getDependencies(id); }
  @Post('capabilities/:capabilityId/dependencies') @Permissions(Permission.CAPABILITY_DEPENDENCY_MANAGE)
  addDependency(@Param('capabilityId') id: string, @Body() body: any, @User() user: UserContext) { return this.service.addDependency(id, body.dependencyCapabilityId, body.dependencyType, user.id); }
  @Delete('capabilities/:capabilityId/dependencies/:dependencyId') @Permissions(Permission.CAPABILITY_DEPENDENCY_MANAGE)
  removeDependency(@Param('capabilityId') capabilityId: string, @Param('dependencyId') dependencyId: string) { return this.service.removeDependency(capabilityId, dependencyId); }
  @Get('capabilities/:capabilityId/requirements') @Permissions(Permission.CAPABILITY_READ)
  getRequirements(@Param('capabilityId') id: string) { return this.service.getEntityRequirements(id); }
  @Post('capabilities/:capabilityId/requirements') @Permissions(Permission.CAPABILITY_REQUIREMENT_MANAGE)
  addRequirement(@Param('capabilityId') id: string, @Body() body: any) { return this.service.addEntityRequirement(id, body.dataEntityId, body.requirementType); }
  @Delete('capabilities/:capabilityId/requirements/:requirementId') @Permissions(Permission.CAPABILITY_REQUIREMENT_MANAGE)
  removeRequirement(@Param('capabilityId') capabilityId: string, @Param('requirementId') requirementId: string) { return this.service.removeEntityRequirement(capabilityId, requirementId); }

  @Get('application-versions/:versionId/features') @Permissions(Permission.FEATURE_READ)
  getVersionFeatures(@Param('versionId') id: string) { return this.service.getVersionFeatures(id); }
  @Post('application-versions/:versionId/features/:featureId/enable') @Permissions(Permission.VERSION_FEATURE_MANAGE)
  enableFeature(@Param('versionId') versionId: string, @Param('featureId') featureId: string, @Body() body: any, @User() user: UserContext) { return this.service.enableFeature(versionId, featureId, user.id, body?.expectedVersion); }
  @Post('application-versions/:versionId/features/:featureId/disable') @Permissions(Permission.VERSION_FEATURE_MANAGE)
  disableFeature(@Param('versionId') versionId: string, @Param('featureId') featureId: string, @Body() body: any, @User() user: UserContext) { return this.service.disableFeature(versionId, featureId, user.id, body?.expectedVersion); }
  @Post('application-versions/:versionId/features/:featureId/experimental') @Permissions(Permission.VERSION_FEATURE_MANAGE)
  experimentalFeature(@Param('versionId') versionId: string, @Param('featureId') featureId: string, @Body() body: any, @User() user: UserContext) { return this.service.setFeatureExperimental(versionId, featureId, user.id, body?.expectedVersion); }
  @Get('application-versions/:versionId/capabilities') @Permissions(Permission.CAPABILITY_READ)
  getVersionCapabilities(@Param('versionId') id: string) { return this.service.getVersionCapabilities(id); }
  @Post('application-versions/:versionId/capabilities/:capabilityId/enable') @Permissions(Permission.VERSION_CAPABILITY_MANAGE)
  enableCapability(@Param('versionId') versionId: string, @Param('capabilityId') capabilityId: string, @Body() body: any, @User() user: UserContext) { return this.service.enableCapability(versionId, capabilityId, user.id, body?.expectedVersion); }
  @Post('application-versions/:versionId/capabilities/:capabilityId/disable') @Permissions(Permission.VERSION_CAPABILITY_MANAGE)
  disableCapability(@Param('versionId') versionId: string, @Param('capabilityId') capabilityId: string, @Body() body: any, @User() user: UserContext) { return this.service.disableCapability(versionId, capabilityId, user.id, body?.expectedVersion); }
  @Post('application-versions/:versionId/features/clone') @Permissions(Permission.VERSION_FEATURE_MANAGE)
  cloneConfiguration(@Param('versionId') targetVersionId: string, @Body() body: any, @User() user: UserContext) { return this.service.cloneConfiguration(body.sourceVersionId, targetVersionId, user.id); }
  @Post('application-versions/:versionId/features/validate') @Permissions(Permission.FEATURE_VALIDATION_RUN)
  validate(@Param('versionId') id: string) { return this.service.validateVersion(id); }
  @Get('application-versions/:versionId/features/snapshot') @Permissions(Permission.FEATURE_SNAPSHOT_READ)
  getSnapshot(@Param('versionId') id: string) { return this.service.getSnapshot(id); }
  @Post('application-versions/:versionId/features/snapshot') @Permissions(Permission.VERSION_FEATURE_MANAGE)
  createSnapshot(@Param('versionId') id: string) { return this.service.createSnapshot(id); }
  @Get('application-versions/:versionId/capabilities/:capabilityId/disable-impact') @Permissions(Permission.FEATURE_IMPACT_READ)
  @ApiOperation({ summary: 'Analyse des conséquences avant désactivation' })
  disableImpact(@Param('versionId') versionId: string, @Param('capabilityId') capabilityId: string) { return this.service.getDisableImpact(versionId, capabilityId); }
}
