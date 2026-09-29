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

import { RuntimeBridgeService } from './runtime-bridge.service';
import { CurrentPrincipal } from '../../../iam/principal.decorator';
import type { IamPrincipal } from '../../../iam/principal.decorator';
import { TenantResource } from '../../../iam/tenant-resource.decorator';
import { TenantGuard } from '../../../iam/tenant.guard';

import {
  CreateRuntimeManifestDto,
  CreateRuntimeBindingDto,
  UpdateRuntimeBindingDto,
} from './dto/create-runtime.dto';

@UseGuards(BmTenantGuard, TenantGuard)
@Controller('api/business-manager/runtime')
export class RuntimeBridgeController {
  constructor(private readonly runtimeBridgeService: RuntimeBridgeService) {}

  @Get(':versionId/manifests')
  findAllManifests(
    @Param('versionId', new ParseUUIDPipe()) versionId: string,
    @CurrentPrincipal() principal: IamPrincipal,
  ) {
    return this.runtimeBridgeService.findAllManifests(versionId, principal.tenantId);
  }

  @Post(':versionId/manifests')
  createManifest(
    @Param('versionId', new ParseUUIDPipe()) versionId: string,
    @Body() dto: CreateRuntimeManifestDto,
    @CurrentPrincipal() principal: IamPrincipal,
  ) {
    return this.runtimeBridgeService.createManifest(versionId, dto, principal.tenantId);
  }

  @Get('manifests/:manifestId')
  findOneManifest(
    @Param('manifestId', new ParseUUIDPipe()) manifestId: string,
    @CurrentPrincipal() principal: IamPrincipal,
  ) {
    return this.runtimeBridgeService.findOneManifest(manifestId, principal.tenantId);
  }

  @Patch('manifests/:manifestId')
  updateManifest(
    @Param('manifestId', new ParseUUIDPipe()) manifestId: string,
    @Body() dto: CreateRuntimeManifestDto,
    @CurrentPrincipal() principal: IamPrincipal,
  ) {
    return this.runtimeBridgeService.updateManifest(manifestId, dto, principal.tenantId);
  }

  @Post('manifests/:manifestId/bindings')
  createBinding(
    @Param('manifestId', new ParseUUIDPipe()) manifestId: string,
    @Body() dto: CreateRuntimeBindingDto,
    @CurrentPrincipal() principal: IamPrincipal,
  ) {
    return this.runtimeBridgeService.createBinding(manifestId, dto, principal.tenantId);
  }

  @Get('manifests/:manifestId/bindings')
  findAllBindings(
    @Param('manifestId', new ParseUUIDPipe()) manifestId: string,
    @CurrentPrincipal() principal: IamPrincipal,
  ) {
    return this.runtimeBridgeService.findAllBindings(manifestId, principal.tenantId);
  }

  @Patch('bindings/:bindingId')
  updateBinding(
    @Param('bindingId', new ParseUUIDPipe()) bindingId: string,
    @Body() dto: UpdateRuntimeBindingDto,
    @CurrentPrincipal() principal: IamPrincipal,
  ) {
    return this.runtimeBridgeService.updateBinding(bindingId, dto, principal.tenantId);
  }

  @Get('manifests/:manifestId/resolve')
  resolveManifest(
    @Param('manifestId', new ParseUUIDPipe()) manifestId: string,
    @CurrentPrincipal() principal: IamPrincipal,
  ) {
    return this.runtimeBridgeService.resolveManifest(manifestId, principal.tenantId);
  }

  @Post('bindings/:bindingId/resolve')
  resolveBinding(
    @Param('bindingId', new ParseUUIDPipe()) bindingId: string,
    @Body() context: Record<string, unknown>,
    @CurrentPrincipal() principal: IamPrincipal,
  ) {
    return this.runtimeBridgeService.resolveBinding(bindingId, context, principal.tenantId);
  }
}
