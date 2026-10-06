import { BmTenantGuard } from '../bm-tenant.guard';
import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';

import { QualityEngineService } from './quality-engine.service';
import { CurrentPrincipal } from '../../../iam/principal.decorator';
import type { IamPrincipal } from '../../../iam/principal.decorator';
import { TenantGuard } from '../../../iam/tenant.guard';
import { RequirePermission } from '../../../iam/permission.decorator';
import { BM_READ, BM_VALIDATE } from '../../../iam/iam.constants';

import { RunQualityValidationDto, CreateQualityGateDto } from './dto/create-quality.dto';

@UseGuards(BmTenantGuard, TenantGuard)
@Controller('api/business-manager/validation')
export class QualityController {
  constructor(private readonly qualityEngineService: QualityEngineService) {}

  @RequirePermission(BM_VALIDATE)
  @Post(':versionId/run')
  runValidation(
    @Param('versionId') versionId: string,
    @Body() dto: RunQualityValidationDto,
    @CurrentPrincipal() principal: IamPrincipal,
  ) {
    return this.qualityEngineService.runValidation(versionId, dto, principal.tenantId);
  }

  @RequirePermission(BM_READ)
  @Get(':versionId/reports')
  findAllReports(
    @Param('versionId') versionId: string,
    @CurrentPrincipal() principal: IamPrincipal,
  ) {
    return this.qualityEngineService.findAllReports(versionId, principal.tenantId);
  }

  @RequirePermission(BM_READ)
  @Get('reports/:reportId')
  findOneReport(
    @Param('reportId') reportId: string,
    @CurrentPrincipal() principal: IamPrincipal,
  ) {
    return this.qualityEngineService.findOneReport(reportId, principal.tenantId);
  }

  @RequirePermission(BM_VALIDATE)
  @Post(':versionId/gates')
  createOrUpdateGate(
    @Param('versionId') versionId: string,
    @Body() dto: CreateQualityGateDto,
    @CurrentPrincipal() principal: IamPrincipal,
  ) {
    return this.qualityEngineService.createOrUpdateGate(versionId, dto, principal.tenantId);
  }

  @RequirePermission(BM_READ)
  @Get(':versionId/gate-status')
  checkGate(
    @Param('versionId') versionId: string,
    @CurrentPrincipal() principal: IamPrincipal,
  ) {
    return this.qualityEngineService.checkGate(versionId, principal.tenantId);
  }

  @RequirePermission(BM_READ)
  @Get(':versionId/metrics')
  getMetrics(
    @Param('versionId') versionId: string,
    @CurrentPrincipal() principal: IamPrincipal,
  ) {
    return this.qualityEngineService.getMetrics(versionId, principal.tenantId);
  }
}
