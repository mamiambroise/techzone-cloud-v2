import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../../common/guards/auth.guard';
import { PermissionGuard } from '../../common/guards/permission.guard';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { User } from '../../common/decorators/user.decorator';
import type { UserContext } from '../../common/decorators/user.decorator';
import { Permission } from '../../common/enums';
import { PackRuntimeService } from './pack-runtime.service';

type Input = Record<string, unknown>;

@Controller('api/runtime')
@UseGuards(AuthGuard, PermissionGuard)
export class PackRuntimeController {
  constructor(private readonly service: PackRuntimeService) {}

  @Post('resolve')
  @Permissions(Permission.RUNTIME_RESOLVE)
  resolve(@Body() input: Input, @User() user: UserContext) {
    return this.service.resolve(input, user);
  }

  @Post('resolutions')
  @Permissions(Permission.RUNTIME_RESOLVE)
  createResolution(@Body() input: Input, @User() user: UserContext) {
    return this.service.resolve(input, user);
  }

  @Get('cache/status')
  @Permissions(Permission.RUNTIME_CACHE_READ)
  cacheStatus(@User() user: UserContext) {
    return this.service.cacheStatus(user);
  }

  @Get('cache/entries')
  @Permissions(Permission.RUNTIME_CACHE_READ)
  cacheEntries(@User() user: UserContext) {
    return this.service.cacheEntries(user);
  }

  @Post('cache/invalidate')
  @Permissions(Permission.RUNTIME_CACHE_INVALIDATE)
  invalidateCache(@Body() input: Input, @User() user: UserContext) {
    return this.service.invalidateCache(input, user);
  }

  @Get('providers/health')
  @Permissions(Permission.RUNTIME_PROVIDER_READ)
  providersHealth(@User() user: UserContext) {
    return this.service.providersHealth(user);
  }

  @Post('providers/:provider/probe')
  @Permissions(Permission.RUNTIME_PROVIDER_PROBE)
  probeProvider(
    @Param('provider') provider: string,
    @User() user: UserContext,
  ) {
    return this.service.probeProvider(provider, user);
  }

  @Get('resilience/status')
  @Permissions(Permission.RUNTIME_RESILIENCE_READ)
  resilienceStatus(@User() user: UserContext) {
    return this.service.resilienceStatus(user);
  }

  @Get('diagnostics/:diagnosticId')
  @Permissions(Permission.RUNTIME_DIAGNOSTIC_READ)
  diagnostic(
    @Param('diagnosticId') diagnosticId: string,
    @User() user: UserContext,
  ) {
    return this.service.diagnostic(diagnosticId, user);
  }

  @Post('resolutions/:id/diagnostics/export')
  @Permissions(Permission.RUNTIME_DIAGNOSTIC_EXPORT)
  exportDiagnostics(@Param('id') id: string, @User() user: UserContext) {
    return this.service.exportDiagnostics(id, user);
  }

  @Post('resolutions/:id/reresolve')
  @Permissions(Permission.RUNTIME_RESOLUTION_RERESOLVE)
  reresolve(@Param('id') id: string, @User() user: UserContext) {
    return this.service.reresolve(id, user);
  }

  @Get('dashboard')
  @Permissions(Permission.RUNTIME_RESOLUTION_READ)
  dashboard(@User() user: UserContext) {
    return this.service.dashboard(user);
  }

  @Get('resolutions')
  @Permissions(Permission.RUNTIME_RESOLUTION_READ)
  resolutions(@User() user: UserContext) {
    return this.service.resolutions(user);
  }

  @Get('resolutions/:id')
  @Permissions(Permission.RUNTIME_RESOLUTION_READ)
  resolution(@Param('id') id: string, @User() user: UserContext) {
    return this.service.resolution(id, user);
  }

  @Get('resolutions/:id/steps')
  @Permissions(Permission.RUNTIME_RESOLUTION_READ)
  async steps(@Param('id') id: string, @User() user: UserContext) {
    return (await this.service.resolution(id, user)).steps;
  }

  @Get('resolutions/:id/timeline')
  @Permissions(Permission.RUNTIME_RESOLUTION_READ)
  async timeline(@Param('id') id: string, @User() user: UserContext) {
    return (await this.service.resolution(id, user)).steps;
  }

  @Get('resolutions/:id/diagnostics')
  @Permissions(Permission.RUNTIME_RESOLUTION_READ)
  diagnostics(@Param('id') id: string, @User() user: UserContext) {
    return this.service.diagnostics(id, user);
  }

  @Get('resolutions/:id/modules')
  @Permissions(Permission.RUNTIME_RESOLUTION_READ)
  async modules(@Param('id') id: string, @User() user: UserContext) {
    const item = await this.service.effective(id, user);
    return (item.content as Input).modules;
  }

  @Get('resolutions/:id/features')
  @Permissions(Permission.RUNTIME_RESOLUTION_READ)
  async features(@Param('id') id: string, @User() user: UserContext) {
    const item = await this.service.effective(id, user);
    return (item.content as Input).features;
  }

  @Get('resolutions/:id/capabilities')
  @Permissions(Permission.RUNTIME_RESOLUTION_READ)
  async capabilities(@Param('id') id: string, @User() user: UserContext) {
    const item = await this.service.effective(id, user);
    return (item.content as Input).capabilities;
  }

  @Get('resolutions/:id/dependencies')
  @Permissions(Permission.RUNTIME_RESOLUTION_READ)
  async dependencies(@Param('id') id: string, @User() user: UserContext) {
    const item = await this.service.effective(id, user);
    return (item.content as Input).dependencies;
  }

  @Get('resolutions/:id/rules')
  @Permissions(Permission.RUNTIME_RESOLUTION_READ)
  async rules(@Param('id') id: string, @User() user: UserContext) {
    const item = await this.service.effective(id, user);
    return (item.content as Input).ruleDecisions;
  }

  @Get('resolutions/:id/context')
  @Permissions(Permission.RUNTIME_RESOLUTION_READ)
  async context(@Param('id') id: string, @User() user: UserContext) {
    return (await this.service.resolution(id, user)).context;
  }

  @Get('resolutions/:id/effective-manifest')
  @Permissions(Permission.RUNTIME_EFFECTIVE_MANIFEST_READ)
  effective(@Param('id') id: string, @User() user: UserContext) {
    return this.service.effective(id, user);
  }

  @Get('effective-manifests/:id')
  @Permissions(Permission.RUNTIME_EFFECTIVE_MANIFEST_READ)
  async effectiveById(@Param('id') id: string, @User() user: UserContext) {
    return this.service.effectiveById(id, user);
  }

  @Get('applications/:applicationId/packs/:packCode/effective-manifest')
  @Permissions(Permission.RUNTIME_EFFECTIVE_MANIFEST_READ)
  current(
    @Param('applicationId') applicationId: string,
    @Param('packCode') packCode: string,
    @User() user: UserContext,
  ) {
    return this.service.current(applicationId, packCode, user);
  }
}
