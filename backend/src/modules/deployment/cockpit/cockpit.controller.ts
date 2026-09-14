import { Controller, Get, Query } from '@nestjs/common';
import { CockpitService } from './cockpit.service';

@Controller()
export class CockpitController {
  constructor(private readonly cockpitService: CockpitService) {}

  @Get('api/deployment/dashboard')
  getDashboard() {
    return this.cockpitService.getDashboard();
  }

  @Get('api/deployment/cockpit')
  getCockpit() {
    return this.cockpitService.getDashboard();
  }

  @Get('api/releases/recent')
  getRecentReleases(@Query('limit') limit?: string) {
    return this.cockpitService.getRecentReleases(
      limit ? parseInt(limit, 10) : 10,
    );
  }

  @Get('api/deployments/running')
  getRunningDeployments() {
    return this.cockpitService.getRunningDeployments();
  }

  @Get('api/deployments/activity')
  getActivity(@Query('limit') limit?: string) {
    return this.cockpitService.getActivity(limit ? parseInt(limit, 10) : 20);
  }

  @Get('api/deployment/health')
  getHealth() {
    return this.cockpitService.getHealth();
  }
}
