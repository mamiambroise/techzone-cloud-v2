import {
  Controller,
  Get,
  Query,
  Param,
} from '@nestjs/common';
import { DiagnosticsService } from './diagnostics.service';
import { SearchLogsDto } from './dto/search-logs.dto';
import { RequirePermission } from '../../../iam/permission.decorator';
import { CurrentPrincipal } from '../../../iam/principal.decorator';
import type { IamPrincipal } from '../../../iam/principal.decorator';
import { INTEGRATION_DIAGNOSTIC_READ } from '../../../iam/iam.constants';

@Controller('api/integrations/diagnostics')
export class DiagnosticsController {
  constructor(private readonly diagnosticsService: DiagnosticsService) {}

  private scopeOf(principal: IamPrincipal) {
    return { tenantId: principal?.tenantId, isSuperAdmin: principal?.isSuperAdmin === true };
  }

  @Get('logs')
  @RequirePermission(INTEGRATION_DIAGNOSTIC_READ)
  async searchLogs(
    @CurrentPrincipal() principal: IamPrincipal,
    @Query('traceId') traceId?: string,
    @Query('tenantId') tenantId?: string,
    @Query('connectorId') connectorId?: string,
    @Query('direction') direction?: string,
    @Query('status') status?: string,
    @Query('errorCode') errorCode?: string,
    @Query('operation') operation?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    const dto: SearchLogsDto = {
      traceId,
      // `tenantId` reste accepté pour la compatibilité de contrat, mais il n'est
      // jamais utilisé comme autorité : le service le compare au principal.
      tenantId,
      connectorId,
      direction: direction as SearchLogsDto['direction'],
      status: status as SearchLogsDto['status'],
      errorCode,
      operation,
      startDate,
      endDate,
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
    };

    return this.diagnosticsService.searchLogs(dto, this.scopeOf(principal));
  }

  @Get('metrics')
  @RequirePermission(INTEGRATION_DIAGNOSTIC_READ)
  async getMetrics(@CurrentPrincipal() principal: IamPrincipal) {
    return this.diagnosticsService.getMetrics(this.scopeOf(principal));
  }

  @Get('timeline/:traceId')
  @RequirePermission(INTEGRATION_DIAGNOSTIC_READ)
  async getTimeline(
    @CurrentPrincipal() principal: IamPrincipal,
    @Param('traceId') traceId: string,
  ) {
    return this.diagnosticsService.getTimeline(traceId, this.scopeOf(principal));
  }
}