import { Controller, Post, Get, Param, Body, Delete, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { AuthGuard } from '../../../common/guards/auth.guard';
import { PermissionGuard } from '../../../common/guards/permission.guard';
import { Permissions } from '../../../common/decorators/permissions.decorator';
import { Permission } from '../../../common/enums';
import { FeatureCapabilityService } from './feature-capability.service';

@ApiTags('Feature & Capability Manager')
@ApiBearerAuth()
@Controller('api/v1/business-manager')
@UseGuards(AuthGuard, PermissionGuard)
export class FeatureCapabilityController {
  constructor(private readonly service: FeatureCapabilityService) { }

  @Post('features')
  @Permissions(Permission.FEATURE_CREATE)
  @ApiOperation({ summary: 'Create a feature' })
  async createFeature(@Body() payload: any) {
    return this.service.createFeature(payload);
  }

  @Post('capabilities')
  @Permissions(Permission.CAPABILITY_CREATE)
  @ApiOperation({ summary: 'Create a capability' })
  async createCapability(@Body() payload: any) {
    return this.service.createCapability(payload);
  }

  @Post('features/:featureId/capabilities/:capabilityId')
  @Permissions(Permission.FEATURE_MAPPING_MANAGE)
  @ApiOperation({ summary: 'Attach capability to feature' })
  async attach(@Param('featureId') featureId: string, @Param('capabilityId') capabilityId: string, @Query('required') required: string) {
    return this.service.attachCapability(featureId, capabilityId, required === 'true');
  }

  @Post('applications/:applicationId/versions/:versionId/features/:featureId/enable')
  @Permissions(Permission.VERSION_FEATURE_MANAGE)
  @ApiOperation({ summary: 'Enable a feature in a version' })
  async enableFeature(@Param('applicationId') applicationId: string, @Param('versionId') versionId: string, @Param('featureId') featureId: string) {
    return this.service.enableFeature(versionId, featureId, applicationId);
  }

  @Post('applications/:applicationId/versions/:versionId/capabilities/:capabilityId/enable')
  @Permissions(Permission.VERSION_CAPABILITY_MANAGE)
  @ApiOperation({ summary: 'Enable a capability in a version' })
  async enableCapability(@Param('applicationId') applicationId: string, @Param('versionId') versionId: string, @Param('capabilityId') capabilityId: string) {
    return this.service.enableCapability(versionId, capabilityId, applicationId);
  }

  @Get('applications/:applicationId/versions/:versionId/features/validate')
  @Permissions(Permission.FEATURE_VALIDATION_RUN)
  @ApiOperation({ summary: 'Validate version feature configuration' })
  async validate(@Param('versionId') versionId: string) {
    return this.service.validateVersion(versionId);
  }

  @Post('capabilities/:capabilityId/dependencies')
  @Permissions(Permission.CAPABILITY_DEPENDENCY_MANAGE)
  @ApiOperation({ summary: 'Create dependency between capabilities' })
  async addDependency(@Param('capabilityId') capabilityId: string, @Body() body: any) {
    return this.service.addDependency(capabilityId, body.dependencyCapabilityId, body.dependencyType || 'REQUIRES', body.createdBy);
  }

  @Post('capabilities/:capabilityId/requirements')
  @Permissions(Permission.CAPABILITY_REQUIREMENT_MANAGE)
  @ApiOperation({ summary: 'Add entity requirement to a capability' })
  async addRequirement(@Param('capabilityId') capabilityId: string, @Body() body: any) {
    return this.service.addEntityRequirement(capabilityId, body.dataEntityId, body.requirementType);
  }

  @Delete('features/:featureId/capabilities/:capabilityId')
  @Permissions(Permission.FEATURE_MAPPING_MANAGE)
  @ApiOperation({ summary: 'Detach capability from feature' })
  async detach(@Param('featureId') featureId: string, @Param('capabilityId') capabilityId: string) {
    await this.service.detachCapability(featureId, capabilityId);
    return { success: true };
  }

  @Get('applications/:applicationId/versions/:versionId/validate')
  @Permissions(Permission.FEATURE_VALIDATION_RUN)
  @ApiOperation({ summary: 'Comprehensive feature/capability validation' })
  async validateFeatureSet(@Param('applicationId') applicationId: string, @Param('versionId') versionId: string) {
    return this.service.validateFeatureSet(versionId, applicationId);
  }

  @Get('applications/:applicationId/versions/:versionId/completeness')
  @Permissions(Permission.FEATURE_VALIDATION_RUN)
  @ApiOperation({ summary: 'Check data entity coverage completeness' })
  async checkCompleteness(@Param('versionId') versionId: string) {
    return this.service.checkCompleteness(versionId);
  }

  @Get('features/:featureId/impact')
  @Permissions(Permission.FEATURE_VALIDATION_RUN)
  @ApiOperation({ summary: 'Get impact analysis for a feature' })
  async getImpactAnalysis(@Param('featureId') featureId: string) {
    return this.service.getImpactAnalysis(featureId);
  }

  @Post('applications/:applicationId/versions/:versionId/snapshot')
  @Permissions(Permission.VERSION_FEATURE_MANAGE)
  @ApiOperation({ summary: 'Create feature/capability snapshot for version' })
  async createSnapshot(@Param('versionId') versionId: string, @Body() body?: { createdBy?: string }) {
    return this.service.createSnapshot(versionId, body?.createdBy);
  }

  @Get('applications/:applicationId/versions/:versionId/features')
  @Permissions(Permission.FEATURE_READ)
  @ApiOperation({ summary: 'List features with validation state in version' })
  async listFeaturesInVersion(@Param('versionId') versionId: string) {
    const versionFeatures = await this.service['versionFeatureRepository'].find({
      where: { applicationVersionId: versionId },
      relations: ['feature'],
    });
    return versionFeatures.map(vf => ({
      ...vf.feature,
      state: vf.state,
      applicationVersionId: versionId,
    }));
  }

  @Get('applications/:applicationId/versions/:versionId/capabilities')
  @Permissions(Permission.CAPABILITY_READ)
  @ApiOperation({ summary: 'List capabilities with validation state in version' })
  async listCapabilitiesInVersion(@Param('versionId') versionId: string) {
    const versionCapabilities = await this.service['versionCapabilityRepository'].find({
      where: { applicationVersionId: versionId },
      relations: ['capability'],
    });
    return versionCapabilities.map(vc => ({
      ...vc.capability,
      enabled: vc.enabled,
      applicationVersionId: versionId,
    }));
  }
}
