import { Controller, Get } from '@nestjs/common';
import { IntegrationService } from './integration.service';

@Controller('api/integrations')
export class IntegrationController {
  constructor(private readonly integrationService: IntegrationService) {}

  @Get('dashboard')
  async getDashboard() {
    return this.integrationService.getDashboard();
  }

  @Get('activity')
  async getActivity() {
    return this.integrationService.getActivity();
  }

  @Get('health')
  async getHealth() {
    return this.integrationService.getHealth();
  }

  @Get('attention')
  async getAttention() {
    return this.integrationService.getAttention();
  }
}
