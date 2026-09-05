import {
  Controller,
  Get,
  Query,
  Param,
} from '@nestjs/common';
import { DiagnosticsService } from './diagnostics.service';
import { SearchLogsDto } from './dto/search-logs.dto';

@Controller('api/integrations/diagnostics')
export class DiagnosticsController {
  constructor(private readonly diagnosticsService: DiagnosticsService) {}

  @Get('logs')
  async searchLogs(
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

    return this.diagnosticsService.searchLogs(dto);
  }

  @Get('metrics')
  async getMetrics() {
    return this.diagnosticsService.getMetrics();
  }

  @Get('timeline/:traceId')
  async getTimeline(@Param('traceId') traceId: string) {
    return this.diagnosticsService.getTimeline(traceId);
  }
}
