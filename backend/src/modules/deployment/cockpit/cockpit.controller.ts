import { Controller, Get, Query } from '@nestjs/common';
import { RequirePermission } from '../../../iam/permission.decorator';
import { PERMISSIONS } from '../../../iam/iam.constants';
import {
  CurrentUser,
  type IamAuthContext,
} from '../../../iam/decorators/current-user.decorator';
import { CockpitService } from './cockpit.service';

@Controller()
export class CockpitController {
  constructor(private readonly cockpitService: CockpitService) {}

  @Get('api/deployment/dashboard')
  @RequirePermission(PERMISSIONS.DEPLOYMENT_READ)
  getDashboard(@CurrentUser() principal: IamAuthContext) {
    return this.cockpitService.getDashboard(principal);
  }

  @Get('api/deployment/cockpit')
  @RequirePermission(PERMISSIONS.DEPLOYMENT_READ)
  getCockpit(@CurrentUser() principal: IamAuthContext) {
    return this.cockpitService.getDashboard(principal);
  }

  @Get('api/releases/recent')
  @RequirePermission(PERMISSIONS.DEPLOYMENT_READ)
  getRecentReleases(
    @Query('limit') limit: string | undefined,
    @CurrentUser() principal: IamAuthContext,
  ) {
    return this.cockpitService.getRecentReleases(
      principal,
      limit ? parseInt(limit, 10) : 10,
    );
  }

  @Get('api/deployments/running')
  @RequirePermission(PERMISSIONS.DEPLOYMENT_READ)
  getRunningDeployments(@CurrentUser() principal: IamAuthContext) {
    return this.cockpitService.getRunningDeployments(principal);
  }

  @Get('api/deployments/activity')
  @RequirePermission(PERMISSIONS.DEPLOYMENT_READ)
  getActivity(
    @Query('limit') limit: string | undefined,
    @CurrentUser() principal: IamAuthContext,
  ) {
    return this.cockpitService.getActivity(principal, limit ? parseInt(limit, 10) : 20);
  }

  @Get('api/deployment/health')
  @RequirePermission(PERMISSIONS.DEPLOYMENT_DIAGNOSTICS)
  getHealth(@CurrentUser() principal: IamAuthContext) {
    return this.cockpitService.getHealth(principal);
  }
}
