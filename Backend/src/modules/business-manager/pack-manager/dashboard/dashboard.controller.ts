import { Controller, Get, Query, UnauthorizedException, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '../../../../common/guards/auth.guard';
import { PermissionGuard } from '../../../../common/guards/permission.guard';
import { Permissions } from '../../../../common/decorators/permissions.decorator';
import { User } from '../../../../common/decorators/user.decorator';
import type { UserContext } from '../../../../common/decorators/user.decorator';
import { Permission } from '../../../../common/enums';
import { DashboardActivityQueryDto, DashboardAttentionQueryDto, DashboardQueryDto } from './dashboard.dto';
import { DashboardService } from './dashboard.service';

@ApiTags('Pack Manager Dashboard')
@ApiBearerAuth()
@Controller('api/v1/pack-manager/dashboard')
@UseGuards(AuthGuard, PermissionGuard)
export class DashboardController {
  constructor(private readonly service: DashboardService) {}
  @Get() @Permissions(Permission.PACK_DASHBOARD_READ) dashboard(@Query() query: DashboardQueryDto, @User() user: UserContext) { return this.service.getDashboard(this.context(user), query); }
  @Get('attention') @Permissions(Permission.PACK_DASHBOARD_READ) attention(@Query() query: DashboardAttentionQueryDto, @User() user: UserContext) { return this.service.getAttention(this.context(user), query); }
  @Get('activity') @Permissions(Permission.PACK_DASHBOARD_READ) activity(@Query() query: DashboardActivityQueryDto, @User() user: UserContext) { return this.service.getActivity(this.context(user), query); }
  private context(user: UserContext): string { if (!user.tenantId) throw new UnauthorizedException('Invalid tenant context'); return user.tenantId; }
}
