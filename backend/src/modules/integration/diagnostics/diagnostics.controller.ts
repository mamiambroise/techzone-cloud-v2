import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import { DiagnosticsService } from './diagnostics.service';
import { CreateIntegrationLogDto } from './dto/create-log.dto';
import { QueryIntegrationLogsDto } from './dto/query-log.dto';

@Controller('api/integrations')
export class DiagnosticsController {
  constructor(private readonly diagnosticsService: DiagnosticsService) {}

  @Post('logs')
  async createLog(@Body() dto: CreateIntegrationLogDto) {
    return this.diagnosticsService.createLog(dto);
  }

  @Get('logs')
  async findLogs(@Query() query: QueryIntegrationLogsDto) {
    return this.diagnosticsService.findLogs(query);
  }

  @Get('logs/trace/:traceId')
  async getTimeline(@Param('traceId') traceId: string) {
    return this.diagnosticsService.getTimeline(traceId);
  }

  @Get('diagnostics')
  async getDiagnostics() {
    return this.diagnosticsService.getDiagnostics();
  }

  @Get('diagnostics/metrics')
  async getMetrics() {
    return this.diagnosticsService.getMetrics();
  }
}
