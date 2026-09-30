import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import {
  CurrentPrincipal,
  type IamPrincipal,
} from '../../iam/principal.decorator';
import { BmTenantGuard } from '../business-manager/bm-tenant.guard';
import { DashboardService } from './dashboard.service';

@UseGuards(BmTenantGuard)
@Controller('api/platform')
export class DashboardController {
  constructor(private readonly service: DashboardService) {}
  @Get('dashboard')
  dashboard(
    @CurrentPrincipal() actor: IamPrincipal,
    @Query('widget') widget?: string,
  ) {
    return this.service.getDashboard(actor, widget);
  }
  @Get('search')
  search(@CurrentPrincipal() actor: IamPrincipal, @Query('q') q?: string) {
    return this.service.search(actor, q);
  }
}
