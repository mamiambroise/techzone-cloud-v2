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

import { FeatureCapabilityService } from './features.service';
import { CurrentPrincipal } from '../../../iam/principal.decorator';
import type { IamPrincipal } from '../../../iam/principal.decorator';
import { TenantResource } from '../../../iam/tenant-resource.decorator';
import { TenantGuard } from '../../../iam/tenant.guard';
import { RequirePermission } from '../../../iam/permission.decorator';
import { BM_READ, BM_WRITE } from '../../../iam/iam.constants';

import {
  CreateFeatureDto,
  CreateCapabilityDto,
  CreateCapabilityDependencyDto,
  CreateVersionFeatureDto,
  CreateVersionCapabilityDto,
  UpdateFeatureDto,
  UpdateCapabilityDto,
} from './dto/create-feature.dto';

@TenantResource({ table: 'bm_feature', idParam: 'featureId' })
@UseGuards(BmTenantGuard, TenantGuard)
@Controller('api/business-manager/features')
export class FeaturesController {
  constructor(private readonly featuresService: FeatureCapabilityService) {}

  @RequirePermission(BM_READ)
  @Get(':versionId/catalog')
  getFeatureCatalog(
    @Param('versionId', new ParseUUIDPipe()) versionId: string,
    @CurrentPrincipal() principal: IamPrincipal,
  ) {
    return this.featuresService.getFeatureCatalog(versionId, principal.tenantId);
  }

  @RequirePermission(BM_READ)
  @Get(':versionId')
  findAllFeatures(
    @Param('versionId', new ParseUUIDPipe()) versionId: string,
    @CurrentPrincipal() principal: IamPrincipal,
  ) {
    return this.featuresService.findAllFeatures(versionId, principal.tenantId);
  }

  @RequirePermission(BM_WRITE)
  @Post(':versionId')
  createFeature(
    @Param('versionId', new ParseUUIDPipe()) versionId: string,
    @Body() dto: CreateFeatureDto,
    @CurrentPrincipal() principal: IamPrincipal,
  ) {
    return this.featuresService.createFeature(versionId, dto, principal.tenantId);
  }

  @RequirePermission(BM_READ)
  @Get('feature/:featureId')
  findOneFeature(
    @Param('featureId', new ParseUUIDPipe()) featureId: string,
    @CurrentPrincipal() principal: IamPrincipal,
  ) {
    return this.featuresService.findOneFeature(featureId, principal.tenantId);
  }

  @RequirePermission(BM_WRITE)
  @Patch('feature/:featureId')
  updateFeature(
    @Param('featureId', new ParseUUIDPipe()) featureId: string,
    @Body() dto: UpdateFeatureDto,
    @CurrentPrincipal() principal: IamPrincipal,
  ) {
    return this.featuresService.updateFeature(featureId, dto, principal.tenantId);
  }

  @RequirePermission(BM_WRITE)
  @Post('feature/:featureId/archive')
  archiveFeature(
    @Param('featureId', new ParseUUIDPipe()) featureId: string,
    @CurrentPrincipal() principal: IamPrincipal,
  ) {
    return this.featuresService.archiveFeature(featureId, principal.tenantId);
  }

  @RequirePermission(BM_WRITE)
  @Post('feature/:featureId/capabilities')
  createCapability(
    @Param('featureId', new ParseUUIDPipe()) featureId: string,
    @Body() dto: CreateCapabilityDto,
    @CurrentPrincipal() principal: IamPrincipal,
  ) {
    return this.featuresService.createCapability(featureId, dto, principal.tenantId);
  }

  @RequirePermission(BM_WRITE)
  @Patch('capabilities/:capabilityId')
  updateCapability(@Param('capabilityId', new ParseUUIDPipe()) id: string, @Body() dto: UpdateCapabilityDto, @CurrentPrincipal() principal: IamPrincipal) {
    return this.featuresService.updateCapability(id, dto, principal.tenantId);
  }

  @RequirePermission(BM_WRITE)
  @Post('capabilities/:capabilityId/archive')
  archiveCapability(@Param('capabilityId', new ParseUUIDPipe()) id: string, @CurrentPrincipal() principal: IamPrincipal) {
    return this.featuresService.updateCapability(id, {}, principal.tenantId, true);
  }

  @RequirePermission(BM_WRITE)
  @Post(':applicationId/versions/:versionId/activate-feature')
  activateFeature(
    @Param('applicationId', new ParseUUIDPipe()) applicationId: string,
    @Param('versionId', new ParseUUIDPipe()) versionId: string,
    @Body() dto: CreateVersionFeatureDto,
    @CurrentPrincipal() principal: IamPrincipal,
  ) {
    return this.featuresService.activateFeature(applicationId, versionId, dto, principal.tenantId);
  }

  @RequirePermission(BM_WRITE)
  @Post(':applicationId/versions/:versionId/activate-capability')
  activateCapability(
    @Param('applicationId', new ParseUUIDPipe()) applicationId: string,
    @Param('versionId', new ParseUUIDPipe()) versionId: string,
    @Body() dto: CreateVersionCapabilityDto,
    @CurrentPrincipal() principal: IamPrincipal,
  ) {
    return this.featuresService.activateCapability(applicationId, versionId, dto, principal.tenantId);
  }

  @RequirePermission(BM_READ)
  @Get(':applicationId/versions/:versionId/capabilities')
  getActiveCapabilities(
    @Param('versionId', new ParseUUIDPipe()) versionId: string,
    @CurrentPrincipal() principal: IamPrincipal,
  ) {
    return this.featuresService.getActiveCapabilities(versionId, principal.tenantId);
  }

  @RequirePermission(BM_READ)
  @Get(':versionId/dependencies')
  getFeatureDependencies(
    @Param('versionId', new ParseUUIDPipe()) versionId: string,
    @CurrentPrincipal() principal: IamPrincipal,
  ) {
    return this.featuresService.getFeatureDependencies(versionId, principal.tenantId);
  }
}
