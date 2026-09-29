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

@TenantResource({ table: 'applicationVersion', idParam: 'id' })
@UseGuards(BmTenantGuard, TenantGuard)
@Controller('api/business-manager')
export class ApplicationVersionsController {
  constructor(private readonly versionsService: ApplicationVersionsService) {}

  @Get('applications/:applicationId/versions')
  findByApplication(
    @Param('applicationId', new ParseUUIDPipe()) applicationId: string,
    @CurrentPrincipal() principal: IamPrincipal,
  ) {
    return this.versionsService.findByApplication(applicationId, principal.tenantId);
  }

  @Get('versions')
  findAll(@CurrentPrincipal() principal: IamPrincipal) {
    return this.versionsService.findAll(principal.tenantId);
  }

  @Post('applications/:applicationId/versions')
  create(
    @Param('applicationId', new ParseUUIDPipe()) applicationId: string,
    @Body() dto: CreateApplicationVersionDto,
    @CurrentPrincipal() principal: IamPrincipal,
  ) {
    return this.versionsService.create(applicationId, dto, principal.tenantId);
  }

  @Get('versions/:id')
  findOne(
    @Param('id', new ParseUUIDPipe()) id: string,
    @CurrentPrincipal() principal: IamPrincipal,
  ) {
    return this.versionsService.findOne(id, principal.tenantId);
  }

  @Patch('versions/:id')
  update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateApplicationVersionDto,
    @CurrentPrincipal() principal: IamPrincipal,
  ) {
    return this.versionsService.update(id, dto, principal.tenantId);
  }

  @Post('versions/:id/clone')
  clone(
    @Param('id', new ParseUUIDPipe()) id: string,
    @CurrentPrincipal() principal: IamPrincipal,
  ) {
    return this.versionsService.clone(id, principal.tenantId);
  }

  @Post('versions/:id/status/:status')
  changeStatus(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Param('status') status: string,
    @CurrentPrincipal() principal: IamPrincipal,
  ) {
    return this.versionsService.changeStatus(id, status.toUpperCase(), principal.tenantId);
  }
}
