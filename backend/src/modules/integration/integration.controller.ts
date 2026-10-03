import { Controller, Get } from '@nestjs/common';
import { IntegrationService } from './integration.service';
import { RequirePermission } from '../../iam/permission.decorator';
import { INTEGRATION_READ } from '../../iam/iam.constants';

@Controller('api/integrations')
export class IntegrationController {
  constructor(private readonly integrationService: IntegrationService) {}

  @Get('dashboard')
  @RequirePermission(INTEGRATION_READ)
  async getDashboard() {
    return this.integrationService.getDashboard();
  }

  @Get('activity')
  @RequirePermission(INTEGRATION_READ)
  async getActivity() {
    return this.integrationService.getActivity();
  }

  @Get('health')
  @RequirePermission(INTEGRATION_READ)
  async getHealth() {
    return this.integrationService.getHealth();
  }

  @Get('attention')
  @RequirePermission(INTEGRATION_READ)
  async getAttention() {
    return this.integrationService.getAttention();
  }
}