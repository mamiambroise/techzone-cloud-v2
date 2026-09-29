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

import { EnvironmentsService } from '../environments/environment.service';
import { CreateEnvironmentDto } from './dto/create-environment.dto';
import { UpdateEnvironmentDto } from './dto/update-environment.dto';
import { CurrentPrincipal } from '../../../iam/principal.decorator';
import type { IamPrincipal } from '../../../iam/principal.decorator';
import { TenantResource } from '../../../iam/tenant-resource.decorator';
import { TenantGuard } from '../../../iam/tenant.guard';

@TenantResource({ table: 'environment', idParam: 'id' })
@UseGuards(BmTenantGuard, TenantGuard)
@Controller('api/business-manager/environments')
export class EnvironmentsController {
  constructor(private readonly environmentsService: EnvironmentsService) {}

  @Get()
  findAll(@CurrentPrincipal() principal: IamPrincipal) {
    return this.environmentsService.findAll(principal.tenantId);
  }

  @Post()
  create(
    @Body() dto: CreateEnvironmentDto,
    @CurrentPrincipal() principal: IamPrincipal,
  ) {
    return this.environmentsService.create(dto, principal.tenantId);
  }

  @Get(':id')
  findOne(
    @Param('id', new ParseUUIDPipe()) id: string,
    @CurrentPrincipal() principal: IamPrincipal,
  ) {
    return this.environmentsService.findOne(id, principal.tenantId);
  }

  @Patch(':id')
  update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateEnvironmentDto,
    @CurrentPrincipal() principal: IamPrincipal,
  ) {
    return this.environmentsService.update(id, dto, principal.tenantId);
  }

  @Get(':id/history')
  getHistory(
    @Param('id', new ParseUUIDPipe()) id: string,
    @CurrentPrincipal() principal: IamPrincipal,
  ) {
    return this.environmentsService.getHistory(id, principal.tenantId);
  }
}
