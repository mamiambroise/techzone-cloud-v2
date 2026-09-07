import {
  Controller,
  Get,
  Param,
  Query,
} from '@nestjs/common';
import { DeploymentDiagnosticsService } from './deployment-diagnostics.service';
import { QueryHistoryDto } from './dto/query-history.dto';

@Controller('api/deployments')
export class DeploymentDiagnosticsController {
  constructor(
    private readonly diagnosticsService: DeploymentDiagnosticsService,
  ) {}

  @Get('history')
  getHistory(@Query() query: QueryHistoryDto) {
    return this.diagnosticsService.getHistory(query);
  }

  @Get('history/timeline/:deploymentId')
  getTimeline(@Param('deploymentId') deploymentId: string) {
    return this.diagnosticsService.getTimeline(deploymentId);
  }

  @Get('diagnostics')
  getDiagnostics() {
    return this.diagnosticsService.getDiagnostics();
  }

  @Get('diagnostics/:deploymentId')
  getDeploymentDiagnostic(@Param('deploymentId') deploymentId: string) {
    return this.diagnosticsService.getDeploymentDiagnostic(deploymentId);
  }
}
