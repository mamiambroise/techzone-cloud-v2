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

import { ApplicationsService } from './applications.service';
import { CreateApplicationDto } from './dto/create-application.dto';
import { UpdateApplicationDto } from './dto/update-application.dto';
import { CurrentPrincipal } from '../../../iam/principal.decorator';
import type { IamPrincipal } from '../../../iam/principal.decorator';
import { TenantResource } from '../../../iam/tenant-resource.decorator';
import { TenantGuard } from '../../../iam/tenant.guard';

@TenantResource({ table: 'application', idParam: 'id' })
@UseGuards(BmTenantGuard, TenantGuard)
@Controller('api/business-manager/applications')
export class ApplicationsController {
  constructor(private readonly applicationsService: ApplicationsService) {}

  @Get()
  findAll(@CurrentPrincipal() principal: IamPrincipal) {
    return this.applicationsService.findAll(principal.tenantId);
  }

  @Post()
  create(
    @Body() dto: CreateApplicationDto,
    @CurrentPrincipal() principal: IamPrincipal,
  ) {
    return this.applicationsService.create(dto, principal.tenantId);
  }

  @Get(':id')
  findOne(
    @Param('id', new ParseUUIDPipe()) id: string,
    @CurrentPrincipal() principal: IamPrincipal,
  ) {
    return this.applicationsService.findOne(id, principal.tenantId);
  }

  @Patch(':id')
  update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateApplicationDto,
    @CurrentPrincipal() principal: IamPrincipal,
  ) {
    return this.applicationsService.update(id, dto, principal.tenantId);
  }

  @Post(':id/archive')
  archive(
    @Param('id', new ParseUUIDPipe()) id: string,
    @CurrentPrincipal() principal: IamPrincipal,
  ) {
    return this.applicationsService.archive(id, principal.tenantId);
  }
}
