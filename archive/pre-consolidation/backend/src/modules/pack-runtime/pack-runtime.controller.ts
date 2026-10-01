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
  }
}
