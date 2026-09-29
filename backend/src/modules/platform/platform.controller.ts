import { Controller, Get, UseGuards } from '@nestjs/common';

import { PlatformService } from './platform.service';
import { CurrentPrincipal } from '../../iam/principal.decorator';
import type { IamPrincipal } from '../../iam/principal.decorator';
import { TenantGuard } from '../../iam/tenant.guard';

@UseGuards(TenantGuard)
@Controller('api/business-manager')
export class PlatformController {
  constructor(private readonly platformService: PlatformService) {}

  @Get('dashboard')
  async getDashboard(@CurrentPrincipal() principal: IamPrincipal) {
    return this.platformService.getDashboard(principal.tenantId);
  }

  @Get('activity')
  async getActivity(@CurrentPrincipal() principal: IamPrincipal) {
    return this.platformService.getActivity(principal.tenantId);
  }
}
