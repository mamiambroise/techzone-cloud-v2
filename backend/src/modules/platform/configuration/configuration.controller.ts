import { BmTenantGuard } from '../../business-manager/bm-tenant.guard';
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

import { ConfigurationService } from './configuration.service';
import { CurrentPrincipal } from '../../../iam/principal.decorator';
import type { IamPrincipal } from '../../../iam/principal.decorator';
import { TenantResource } from '../../../iam/tenant-resource.decorator';
import { TenantGuard } from '../../../iam/tenant.guard';

import { CreateConfigurationDto } from './dto/create-config.dto';
import { UpdateConfigurationDto } from './dto/update-config.dto';

@TenantResource({ table: 'configuration', idParam: 'id' })
@UseGuards(BmTenantGuard, TenantGuard)
@Controller('api/business-manager/configurations')
export class ConfigurationController {
  constructor(private readonly configurationService: ConfigurationService) {}

  @Get()
  findAll(@CurrentPrincipal() principal: IamPrincipal) {
    return this.configurationService.findAll(principal.tenantId);
  }

  @Get('effective/:applicationId/:applicationVersionId/:environmentId')
  resolveEffectiveConfigurations(
    @Param('applicationId', new ParseUUIDPipe()) applicationId: string,
    @Param('applicationVersionId', new ParseUUIDPipe())
      applicationVersionId: string,
    @Param('environmentId', new ParseUUIDPipe()) environmentId: string,
    @CurrentPrincipal() principal: IamPrincipal,
  ) {
    return this.configurationService.resolveEffectiveConfigurations(
      {
        applicationId,
        applicationVersionId,
        environmentId,
      },
      principal.tenantId,
    );
  }

  @Get(':id/history')
  getHistory(
    @Param('id', new ParseUUIDPipe()) id: string,
    @CurrentPrincipal() principal: IamPrincipal,
  ) {
    return this.configurationService.getHistory(id, principal.tenantId);
  }

  @Get(':scope/:scopeId')
  findByScope(
    @Param('scope') scope: string,
    @Param('scopeId') scopeId: string,
    @CurrentPrincipal() principal: IamPrincipal,
  ) {
    return this.configurationService.findByScope(scope, scopeId, principal.tenantId);
  }

  @Post()
  create(
    @Body() dto: CreateConfigurationDto,
    @CurrentPrincipal() principal: IamPrincipal,
  ) {
    return this.configurationService.create(dto, principal.tenantId);
  }

  @Patch(':id')
  update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateConfigurationDto,
    @CurrentPrincipal() principal: IamPrincipal,
  ) {
    return this.configurationService.update(id, dto, principal.tenantId);
  }

  @Post(':id/activate')
  activate(
    @Param('id', new ParseUUIDPipe()) id: string,
    @CurrentPrincipal() principal: IamPrincipal,
  ) {
    return this.configurationService.activate(id, principal.tenantId);
  }

  @Post(':id/validate')
  validate(
    @Param('id', new ParseUUIDPipe()) id: string,
    @CurrentPrincipal() principal: IamPrincipal,
  ) {
    return this.configurationService.validate(id, principal.tenantId);
  }
}
