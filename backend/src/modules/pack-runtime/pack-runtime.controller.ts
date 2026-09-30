<<<<<<< HEAD
import { ParseUUIDPipe } from '@nestjs/common';
import { BmTenantGuard } from '../business-manager/bm-tenant.guard';
import { CurrentPrincipal } from '../../iam/principal.decorator';
import type { IamPrincipal } from '../../iam/principal.decorator';
import { RequirePermission } from '../../iam/permission.decorator';
import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { PackRuntimeService } from './pack-runtime.service';

type Input = Record<string, unknown>;

@Controller('api/runtime')
@UseGuards(BmTenantGuard)
export class PackRuntimeController {
  constructor(private readonly service: PackRuntimeService) {}

  @Get('manifests/:packCode/:packVersion')
  @RequirePermission('runtime.effective.manifest.read')
  publishedManifest(@Param('packCode') code: string,@Param('packVersion') version: string,@CurrentPrincipal() user: IamPrincipal) { return this.service.publishedManifest(code,version,user); }

  @Post('resolve')
  @RequirePermission('runtime.resolve')
  resolve(@Body() input: Input, @CurrentPrincipal() user: IamPrincipal) {
    return this.service.resolve(input, user);
  }

  @Post('resolutions')
  @RequirePermission('runtime.resolve')
  createResolution(@Body() input: Input, @CurrentPrincipal() user: IamPrincipal) {
    return this.service.resolve(input, user);
  }

  @Get('cache/status')
  @RequirePermission('runtime.cache.read')
  cacheStatus(@CurrentPrincipal() user: IamPrincipal) {
    return this.service.cacheStatus(user);
  }

  @Get('cache/entries')
  @RequirePermission('runtime.cache.read')
  cacheEntries(@CurrentPrincipal() user: IamPrincipal) {
    return this.service.cacheEntries(user);
  }

  @Post('cache/invalidate')
  @RequirePermission('runtime.cache.invalidate')
  invalidateCache(@Body() input: Input, @CurrentPrincipal() user: IamPrincipal) {
    return this.service.invalidateCache(input, user);
  }

  @Get('providers/health')
  @RequirePermission('runtime.provider.read')
  providersHealth(@CurrentPrincipal() user: IamPrincipal) {
    return this.service.providersHealth(user);
  }

  @Post('providers/:provider/probe')
  @RequirePermission('runtime.provider.probe')
  probeProvider(
    @Param('provider') provider: string,
    @CurrentPrincipal() user: IamPrincipal,
  ) {
    return this.service.probeProvider(provider, user);
  }

  @Get('resilience/status')
  @RequirePermission('runtime.resilience.read')
  resilienceStatus(@CurrentPrincipal() user: IamPrincipal) {
    return this.service.resilienceStatus(user);
  }

  @Get('diagnostics/:diagnosticId')
  @RequirePermission('runtime.diagnostic.read')
  diagnostic(
    @Param('diagnosticId', new ParseUUIDPipe()) diagnosticId: string,
    @CurrentPrincipal() user: IamPrincipal,
  ) {
    return this.service.diagnostic(diagnosticId, user);
  }

  @Post('resolutions/:id/diagnostics/export')
  @RequirePermission('runtime.diagnostic.export')
  exportDiagnostics(@Param('id', new ParseUUIDPipe()) id: string, @CurrentPrincipal() user: IamPrincipal) {
    return this.service.exportDiagnostics(id, user);
  }

  @Post('resolutions/:id/reresolve')
  @RequirePermission('runtime.resolution.reresolve')
  reresolve(@Param('id', new ParseUUIDPipe()) id: string, @CurrentPrincipal() user: IamPrincipal) {
    return this.service.reresolve(id, user);
  }

  @Get('dashboard')
  @RequirePermission('runtime.resolution.read')
  dashboard(@CurrentPrincipal() user: IamPrincipal) {
    return this.service.dashboard(user);
  }

  @Get('resolutions')
  @RequirePermission('runtime.resolution.read')
  resolutions(@CurrentPrincipal() user: IamPrincipal) {
    return this.service.resolutions(user);
  }

  @Get('resolutions/:id')
  @RequirePermission('runtime.resolution.read')
  resolution(@Param('id', new ParseUUIDPipe()) id: string, @CurrentPrincipal() user: IamPrincipal) {
    return this.service.resolution(id, user);
  }

  @Get('resolutions/:id/steps')
  @RequirePermission('runtime.resolution.read')
  async steps(@Param('id', new ParseUUIDPipe()) id: string, @CurrentPrincipal() user: IamPrincipal) {
    return (await this.service.resolution(id, user)).steps;
  }

  @Get('resolutions/:id/timeline')
  @RequirePermission('runtime.resolution.read')
  async timeline(@Param('id', new ParseUUIDPipe()) id: string, @CurrentPrincipal() user: IamPrincipal) {
    return (await this.service.resolution(id, user)).steps;
  }

  @Get('resolutions/:id/diagnostics')
  @RequirePermission('runtime.resolution.read')
  diagnostics(@Param('id', new ParseUUIDPipe()) id: string, @CurrentPrincipal() user: IamPrincipal) {
    return this.service.diagnostics(id, user);
  }

  @Get('resolutions/:id/modules')
  @RequirePermission('runtime.resolution.read')
  async modules(@Param('id', new ParseUUIDPipe()) id: string, @CurrentPrincipal() user: IamPrincipal) {
    const item = await this.service.effective(id, user);
    return (item.content as Input).modules;
  }

  @Get('resolutions/:id/features')
  @RequirePermission('runtime.resolution.read')
  async features(@Param('id', new ParseUUIDPipe()) id: string, @CurrentPrincipal() user: IamPrincipal) {
    const item = await this.service.effective(id, user);
    return (item.content as Input).features;
  }

  @Get('resolutions/:id/capabilities')
  @RequirePermission('runtime.resolution.read')
  async capabilities(@Param('id', new ParseUUIDPipe()) id: string, @CurrentPrincipal() user: IamPrincipal) {
    const item = await this.service.effective(id, user);
    return (item.content as Input).capabilities;
  }

  @Get('resolutions/:id/dependencies')
  @RequirePermission('runtime.resolution.read')
  async dependencies(@Param('id', new ParseUUIDPipe()) id: string, @CurrentPrincipal() user: IamPrincipal) {
    const item = await this.service.effective(id, user);
    return (item.content as Input).dependencies;
  }

  @Get('resolutions/:id/rules')
  @RequirePermission('runtime.resolution.read')
  async rules(@Param('id', new ParseUUIDPipe()) id: string, @CurrentPrincipal() user: IamPrincipal) {
    const item = await this.service.effective(id, user);
    return (item.content as Input).ruleDecisions;
  }

  @Get('resolutions/:id/context')
  @RequirePermission('runtime.resolution.read')
  async context(@Param('id', new ParseUUIDPipe()) id: string, @CurrentPrincipal() user: IamPrincipal) {
    return (await this.service.resolution(id, user)).context;
  }

  @Get('resolutions/:id/effective-manifest')
  @RequirePermission('runtime.effective.manifest.read')
  effective(@Param('id', new ParseUUIDPipe()) id: string, @CurrentPrincipal() user: IamPrincipal) {
    return this.service.effective(id, user);
  }

  @Get('effective-manifests/:id')
  @RequirePermission('runtime.effective.manifest.read')
  async effectiveById(@Param('id', new ParseUUIDPipe()) id: string, @CurrentPrincipal() user: IamPrincipal) {
    return this.service.effectiveById(id, user);
  }

  @Get('applications/:applicationId/packs/:packCode/effective-manifest')
  @RequirePermission('runtime.effective.manifest.read')
  current(
    @Param('applicationId', new ParseUUIDPipe()) applicationId: string,
    @Param('packCode') packCode: string,
    @CurrentPrincipal() user: IamPrincipal,
  ) {
    return this.service.current(applicationId, packCode, user);
=======
/**
 * Pack Runtime — contrôleur REST (PR-CDC-00 §28).
 *
 * Routes :
 *   GET  /api/runtime/cockpit
 *   GET  /api/runtime/manifests            (packs publiés disponibles)
 *   POST /api/runtime/resolve
 *   GET  /api/runtime/resolutions
 *   GET  /api/runtime/resolutions/:id
 *   GET  /api/runtime/contextes
 *   POST /api/runtime/contextes
 *   GET  /api/runtime/cache
 *   POST /api/runtime/cache/invalidate    (permission runtime.invalidate_cache)
 *   GET  /api/runtime/diagnostics
 *
 * Sécurité : même socle IAM que le Pack Manager (JWT + TenantGuard + permissions).
 */
import { Body, Controller, Get, Param, ParseUUIDPipe, Post, Query, UseGuards } from '@nestjs/common';

import { RuntimeResolverService, ResolveInput } from './runtime-resolver.service';
import { CurrentPrincipal } from '../../iam/principal.decorator';
import type { IamPrincipal } from '../../iam/principal.decorator';
import { TenantGuard } from '../../iam/tenant.guard';
import { RequirePermission } from '../../iam/permission.guard';

const UUID = new ParseUUIDPipe({ version: '4' });

@UseGuards(TenantGuard)
@Controller('api/runtime')
export class PackRuntimeController {
  constructor(private readonly runtimeResolverService: RuntimeResolverService) {}

  @Get('cockpit')
  async getCockpit(@CurrentPrincipal() principal: IamPrincipal) {
    return this.runtimeResolverService.getCockpit(principal.tenantId);
  }

  @Get('manifests')
  async listPublishedManifests(@CurrentPrincipal() principal: IamPrincipal) {
    return this.runtimeResolverService.listPublishedManifests(principal.tenantId);
  }

  @Post('resolve')
  @UseGuards(RequirePermission('runtime.resolve'))
  async resolve(
    @Body() dto: { packCode: string; versionNumber?: string; environment?: string; featureFlags?: Record<string, unknown>; contextId?: string },
    @CurrentPrincipal() principal: IamPrincipal,
  ) {
    return this.runtimeResolverService.resolve(principal.tenantId, dto as ResolveInput, principal.userId, null);
  }

  @Get('resolutions')
  async listResolutions(
    @CurrentPrincipal() principal: IamPrincipal,
    @Query('packCode') packCode?: string,
    @Query('status') status?: string,
    @Query('take') take?: string,
  ) {
    return this.runtimeResolverService.listResolutions(principal.tenantId, {
      packCode: packCode || undefined,
      status: status || undefined,
      take: take ? Number(take) : undefined,
    });
  }

  @Get('resolutions/:resolutionId')
  async getResolution(@Param('resolutionId', UUID) resolutionId: string, @CurrentPrincipal() principal: IamPrincipal) {
    return this.runtimeResolverService.getResolution(principal.tenantId, resolutionId);
  }

  @Get('contextes')
  async listContexts(@CurrentPrincipal() principal: IamPrincipal) {
    return this.runtimeResolverService.listContexts(principal.tenantId);
  }

  @Post('contextes')
  @UseGuards(RequirePermission('runtime.resolve'))
  async createContext(
    @Body() dto: { label: string; environment?: string; applicationId?: string; featureFlags?: Record<string, unknown> },
    @CurrentPrincipal() principal: IamPrincipal,
  ) {
    return this.runtimeResolverService.createContext(principal.tenantId, dto);
  }

  @Get('cache')
  async getCacheStatus(@CurrentPrincipal() principal: IamPrincipal) {
    return this.runtimeResolverService.getCacheStatus(principal.tenantId);
  }

  @Post('cache/invalidate')
  @UseGuards(RequirePermission('runtime.invalidate_cache'))
  async invalidateCache(@Body() dto: { cacheKey?: string }, @CurrentPrincipal() principal: IamPrincipal) {
    return this.runtimeResolverService.invalidateCache(principal.tenantId, dto?.cacheKey);
  }

  @Get('diagnostics')
  async listDiagnostics(
    @CurrentPrincipal() principal: IamPrincipal,
    @Query('severity') severity?: string,
    @Query('component') component?: string,
    @Query('take') take?: string,
  ) {
    return this.runtimeResolverService.listDiagnostics(principal.tenantId, {
      severity: severity || undefined,
      component: component || undefined,
      take: take ? Number(take) : undefined,
    });
  }

  @Get('diagnostics/summary')
  async getDiagnosticsSummary(@CurrentPrincipal() principal: IamPrincipal) {
    return this.runtimeResolverService.getDiagnosticsSummary(principal.tenantId);
>>>>>>> dc5feb88fd597836d806457a7b2a50727b017d02
  }
}
