import { BmTenantGuard } from '../../business-manager/bm-tenant.guard';
import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Patch,
  UseGuards,
} from '@nestjs/common';

import { ApplicationVersionsService } from './application-versions.service';
import { CreateApplicationVersionDto } from './dto/create-app-version.dto';
import { UpdateApplicationVersionDto } from './dto/update-app-version.dto';
import { CurrentPrincipal } from '../../../iam/principal.decorator';
import type { IamPrincipal } from '../../../iam/principal.decorator';
import { TenantResource } from '../../../iam/tenant-resource.decorator';
import { TenantGuard } from '../../../iam/tenant.guard';
import { RequirePermission } from '../../../iam/permission.decorator';
import { BM_READ, BM_VALIDATE, BM_WRITE } from '../../../iam/iam.constants';

@TenantResource({ table: 'applicationVersion', idParam: 'id' })
@UseGuards(BmTenantGuard, TenantGuard)
@Controller('api/business-manager')
export class ApplicationVersionsController {
  constructor(private readonly versionsService: ApplicationVersionsService) {}

  @RequirePermission(BM_READ)
  @Get('applications/:applicationId/versions')
  findByApplication(
    @Param('applicationId', new ParseUUIDPipe()) applicationId: string,
    @CurrentPrincipal() principal: IamPrincipal,
  ) {
    return this.versionsService.findByApplication(applicationId, principal.tenantId);
  }

  @RequirePermission(BM_READ)
  @Get('versions')
  findAll(@CurrentPrincipal() principal: IamPrincipal) {
    return this.versionsService.findAll(principal.tenantId);
  }

  @RequirePermission(BM_WRITE)
  @Post('applications/:applicationId/versions')
  create(
    @Param('applicationId', new ParseUUIDPipe()) applicationId: string,
    @Body() dto: CreateApplicationVersionDto,
    @CurrentPrincipal() principal: IamPrincipal,
  ) {
    return this.versionsService.create(applicationId, dto, principal.tenantId);
  }

  @RequirePermission(BM_READ)
  @Get('versions/:id')
  findOne(
    @Param('id', new ParseUUIDPipe()) id: string,
    @CurrentPrincipal() principal: IamPrincipal,
  ) {
    return this.versionsService.findOne(id, principal.tenantId);
  }

  @RequirePermission(BM_WRITE)
  @Patch('versions/:id')
  update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateApplicationVersionDto,
    @CurrentPrincipal() principal: IamPrincipal,
  ) {
    return this.versionsService.update(id, dto, principal.tenantId);
  }

  @RequirePermission(BM_WRITE)
  @Post('versions/:id/clone')
  clone(
    @Param('id', new ParseUUIDPipe()) id: string,
    @CurrentPrincipal() principal: IamPrincipal,
  ) {
    return this.versionsService.clone(id, principal.tenantId);
  }

  @RequirePermission(BM_VALIDATE)
  @Post('versions/:id/status/:status')
  changeStatus(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Param('status') status: string,
    @CurrentPrincipal() principal: IamPrincipal,
  ) {
    return this.versionsService.changeStatus(id, status.toUpperCase(), principal.tenantId);
  }
}
