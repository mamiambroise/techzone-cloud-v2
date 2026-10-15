import { Controller, Get, Query } from '@nestjs/common';
import { RequirePermission } from '../../../iam/permission.decorator';
import { PERMISSIONS } from '../../../iam/iam.constants';
import { CockpitService } from './cockpit.service';

@Controller()
export class CockpitController {
  constructor(private readonly cockpitService: CockpitService) {}

  @Get('api/deployment/dashboard')
  @RequirePermission(PERMISSIONS.DEPLOYMENT_READ)
  getDashboard() {
    return this.cockpitService.getDashboard();
  }

  @Get('api/deployment/cockpit')
  @RequirePermission(PERMISSIONS.DEPLOYMENT_READ)
  getCockpit() {
    return this.cockpitService.getDashboard();
  }

  @Get('api/releases/recent')
  @RequirePermission(PERMISSIONS.DEPLOYMENT_READ)
  getRecentReleases(@Query('limit') limit?: string) {
    return this.cockpitService.getRecentReleases(
      limit ? parseInt(limit, 10) : 10,
    );
  }

  @Get('api/deployments/running')
  @RequirePermission(PERMISSIONS.DEPLOYMENT_READ)
  getRunningDeployments() {
    return this.cockpitService.getRunningDeployments();
  }

  @Get('api/deployments/activity')
  @RequirePermission(PERMISSIONS.DEPLOYMENT_READ)
  getActivity(@Query('limit') limit?: string) {
    return this.cockpitService.getActivity(limit ? parseInt(limit, 10) : 20);
  }

  @Get('api/deployment/health')
  @RequirePermission(PERMISSIONS.DEPLOYMENT_DIAGNOSTICS)
  getHealth() {
    return this.cockpitService.getHealth();
  }
}
