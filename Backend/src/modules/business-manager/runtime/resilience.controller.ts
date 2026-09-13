import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../../../common/guards/auth.guard';
import { PermissionGuard } from '../../../common/guards/permission.guard';
import { Permissions } from '../../../common/decorators/permissions.decorator';
import { Permission } from '../../../common/enums';
import { RuntimeCacheService, RuntimeCacheScope } from './cache.runtime-cache.service';
import { ProviderHealthService } from './provider-health.service';
import { RuntimeDiagnosticService } from './diagnostic.service';
import { RuntimeResilienceService } from './resilience.service';

@Controller('api/runtime')
@UseGuards(AuthGuard, PermissionGuard)
export class RuntimeResilienceController {
  constructor(
    private readonly cache: RuntimeCacheService,
    private readonly providers: ProviderHealthService,
    private readonly diagnostic: RuntimeDiagnosticService,
    private readonly resilience: RuntimeResilienceService,
  ) {}

  @Get('cache/status')
  @Permissions(Permission.RUNTIME_CACHE_READ)
  cacheStatus() {
    return this.cache.status();
  }

  @Get('cache/entries')
  @Permissions(Permission.RUNTIME_CACHE_READ)
  cacheEntries() {
    return this.cache.entriesList();
  }

  @Post('cache/invalidate')
  @Permissions(Permission.RUNTIME_CACHE_INVALIDATE)
  invalidateCache(@Body() body: { scope?: RuntimeCacheScope; applicationId?: string; tenantId?: string; packCode?: string; provider?: string; reason?: string }) {
    return this.cache.invalidate(body);
  }

  @Get('providers/health')
  @Permissions(Permission.RUNTIME_PROVIDER_READ)
  providerHealth() {
    return this.providers.health();
  }

  @Post('providers/:provider/probe')
  @Permissions(Permission.RUNTIME_PROVIDER_PROBE)
  probeProvider(@Param('provider') provider: string) {
    return this.providers.probe(provider);
  }

  @Get('resolutions/:id/diagnostics')
  @Permissions(Permission.RUNTIME_DIAGNOSE)
  listDiagnostics(@Param('id') id: string, @Query('tenantId') tenantId?: string) {
    return this.diagnostic.list(id, tenantId);
  }

  @Get('diagnostics/:diagnosticId')
  @Permissions(Permission.RUNTIME_DIAGNOSE)
  diagnosticDetail(@Param('diagnosticId') diagnosticId: string) {
    return this.diagnostic.explain(diagnosticId);
  }

  @Post('resolutions/:id/diagnostics/export')
  @Permissions(Permission.RUNTIME_DIAGNOSTIC_EXPORT)
  exportDiagnostic(@Param('id') id: string) {
    return this.diagnostic.exportSafe(id);
  }

  @Get('resilience/status')
  @Permissions(Permission.RUNTIME_RESILIENCE_READ)
  resilienceStatus() {
    return this.resilience.summary();
  }
}
