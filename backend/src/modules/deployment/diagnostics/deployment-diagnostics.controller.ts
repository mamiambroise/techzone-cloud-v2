import {
  Controller,
  Get,
  Param,
  Query,
} from '@nestjs/common';
import { RequirePermission } from '../../../iam/permission.decorator';
import { PERMISSIONS } from '../../../iam/iam.constants';
import { TenantResource } from '../../../iam/tenant-resource.decorator';
import {
  CurrentUser,
  type IamAuthContext,
} from '../../../iam/decorators/current-user.decorator';
import { DeploymentDiagnosticsService } from './deployment-diagnostics.service';
import { QueryHistoryDto } from './dto/query-history.dto';

@Controller('api/deployments')
@TenantResource({ table: 'deployment', idParam: 'deploymentId' })
export class DeploymentDiagnosticsController {
  constructor(
    private readonly diagnosticsService: DeploymentDiagnosticsService,
  ) {}

  @Get('history')
  @RequirePermission(PERMISSIONS.DEPLOYMENT_DIAGNOSTICS)
  getHistory(
    @Query() query: QueryHistoryDto,
    @CurrentUser() principal: IamAuthContext,
  ) {
    return this.diagnosticsService.getHistory(query, principal);
  }

  @Get('history/timeline/:deploymentId')
  @RequirePermission(PERMISSIONS.DEPLOYMENT_DIAGNOSTICS)
  getTimeline(
    @Param('deploymentId') deploymentId: string,
    @CurrentUser() principal: IamAuthContext,
  ) {
    return this.diagnosticsService.getTimeline(deploymentId, principal);
  }

  @Get('diagnostics')
  @RequirePermission(PERMISSIONS.DEPLOYMENT_DIAGNOSTICS)
  getDiagnostics(@CurrentUser() principal: IamAuthContext) {
    return this.diagnosticsService.getDiagnostics(principal);
  }

  @Get('diagnostics/:deploymentId')
  @RequirePermission(PERMISSIONS.DEPLOYMENT_DIAGNOSTICS)
  getDeploymentDiagnostic(
    @Param('deploymentId') deploymentId: string,
    @CurrentUser() principal: IamAuthContext,
  ) {
    return this.diagnosticsService.getDeploymentDiagnostic(deploymentId, principal);
  }
}
