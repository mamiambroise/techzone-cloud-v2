import { Body, Controller, Get, Param, Post, Query, UnauthorizedException, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '../../../../common/guards/auth.guard';
import { PermissionGuard } from '../../../../common/guards/permission.guard';
import { Permissions } from '../../../../common/decorators/permissions.decorator';
import { User } from '../../../../common/decorators/user.decorator';
import type { UserContext } from '../../../../common/decorators/user.decorator';
import { Permission } from '../../../../common/enums';
import { RuntimeCacheInvalidateDto, RuntimeCockpitQueryDto, RuntimeAttentionQueryDto } from './cockpit.dto';
import { RuntimeCockpitService } from './cockpit.service';

@ApiTags('Runtime Cockpit') @ApiBearerAuth() @Controller('api/runtime') @UseGuards(AuthGuard, PermissionGuard)
export class RuntimeCockpitController {
  constructor(private readonly service: RuntimeCockpitService) {}
  @Get('dashboard') @Permissions(Permission.RUNTIME_DASHBOARD_READ) dashboard(@Query() query: RuntimeCockpitQueryDto, @User() user: UserContext) { return this.service.dashboard(this.tenant(user), query); }
  @Get('resolutions') @Permissions(Permission.RUNTIME_RESOLUTION_READ) resolutions(@Query() query: RuntimeCockpitQueryDto, @User() user: UserContext) { return this.service.listResolutions(this.tenant(user), query); }
  @Get('resolutions/:id/timeline') @Permissions(Permission.RUNTIME_RESOLUTION_READ) timeline(@Param('id') id: string, @User() user: UserContext) { return this.service.timeline(this.tenant(user), id); }
  @Get('resolutions/:id/diagnostics') @Permissions(Permission.RUNTIME_DIAGNOSTIC_READ) diagnostics(@Param('id') id: string, @User() user: UserContext) { return this.service.diagnostics(this.tenant(user), id); }
  @Get('dashboard/attention') @Permissions(Permission.RUNTIME_DASHBOARD_READ) attention(@Query() query: RuntimeAttentionQueryDto, @User() user: UserContext) { return this.service.attention(this.tenant(user), query); }
  @Get('dashboard/activity') @Permissions(Permission.RUNTIME_DASHBOARD_READ) activity(@User() user: UserContext) { return this.service.activity(this.tenant(user)); }
  @Get('providers/health') @Permissions(Permission.RUNTIME_PROVIDER_READ) providers() { return this.service.providers(); }
  @Get('metrics/performance') @Permissions(Permission.RUNTIME_PERFORMANCE_READ) performance(@User() user: UserContext) { return this.service.performance(this.tenant(user)); }
  @Get('effective-manifests/compare') @Permissions(Permission.RUNTIME_MANIFEST_COMPARE) compare(@Query('left') left: string, @Query('right') right: string, @User() user: UserContext) { return this.service.compare(this.tenant(user), left, right); }
  @Post('resolutions/:id/retry') @Permissions(Permission.RUNTIME_RESOLUTION_RETRY) retry(@Param('id') id: string, @User() user: UserContext) { return this.service.retry(this.tenant(user), id, user.id); }
  @Post('cache/invalidate') @Permissions(Permission.RUNTIME_CACHE_INVALIDATE) invalidate(@Body() body: RuntimeCacheInvalidateDto, @User() user: UserContext) { return this.service.invalidateCache(this.tenant(user), user.id, body.reason); }
  private tenant(user: UserContext) { if (!user.tenantId || !user.id) throw new UnauthorizedException('Invalid runtime tenant context'); return user.tenantId; }
}
