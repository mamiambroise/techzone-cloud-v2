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
import { DuplicateApplicationDto } from './dto/duplicate-application.dto';
import { CurrentPrincipal } from '../../../iam/principal.decorator';
import type { IamPrincipal } from '../../../iam/principal.decorator';
import { TenantResource } from '../../../iam/tenant-resource.decorator';
import { TenantGuard } from '../../../iam/tenant.guard';
import { RequirePermission } from '../../../iam/permission.decorator';
import { BM_READ, BM_WRITE } from '../../../iam/iam.constants';

@TenantResource({ table: 'application', idParam: 'id' })
@UseGuards(BmTenantGuard, TenantGuard)
@Controller('api/business-manager/applications')
export class ApplicationsController {
  constructor(private readonly applicationsService: ApplicationsService) {}

  @Get()
  @RequirePermission(BM_READ)
  findAll(@CurrentPrincipal() principal: IamPrincipal) {
    return this.applicationsService.findAll(principal.tenantId);
  }

  @Post()
  @RequirePermission(BM_WRITE)
  create(
    @Body() dto: CreateApplicationDto,
    @CurrentPrincipal() principal: IamPrincipal,
  ) {
    return this.applicationsService.create(dto, principal.tenantId);
  }

  @Get(':id')
  @RequirePermission(BM_READ)
  findOne(
    @Param('id', new ParseUUIDPipe()) id: string,
    @CurrentPrincipal() principal: IamPrincipal,
  ) {
    return this.applicationsService.findOne(id, principal.tenantId);
  }

  @Patch(':id')
  @RequirePermission(BM_WRITE)
  update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateApplicationDto,
    @CurrentPrincipal() principal: IamPrincipal,
  ) {
    return this.applicationsService.update(id, dto, principal.tenantId);
  }

  @Post(':id/archive')
  @RequirePermission(BM_WRITE)
  archive(
    @Param('id', new ParseUUIDPipe()) id: string,
    @CurrentPrincipal() principal: IamPrincipal,
  ) {
    return this.applicationsService.archive(id, principal.tenantId);
  }

  @Post(':id/restore')
  @RequirePermission(BM_WRITE)
  restore(
    @Param('id', new ParseUUIDPipe()) id: string,
    @CurrentPrincipal() principal: IamPrincipal,
  ) {
    return this.applicationsService.restore(id, principal.tenantId);
  }

  @Post(':id/duplicate')
  @RequirePermission(BM_WRITE)
  duplicate(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: DuplicateApplicationDto,
    @CurrentPrincipal() principal: IamPrincipal,
  ) {
    return this.applicationsService.duplicate(id, dto, principal.tenantId);
  }
}
