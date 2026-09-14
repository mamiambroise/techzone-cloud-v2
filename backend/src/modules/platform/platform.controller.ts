import { Controller, Get } from '@nestjs/common';

import { PlatformService } from './platform.service';

@Controller('api/platform')
export class PlatformController {
  constructor(private readonly platformService: PlatformService) {}

  @Get('dashboard')
  async getDashboard() {
    return this.platformService.getDashboard();
  }

  @Get('activity')
  async getActivity() {
    return this.platformService.getActivity();
  }
}
