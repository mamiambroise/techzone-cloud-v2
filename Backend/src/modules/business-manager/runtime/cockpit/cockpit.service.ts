import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { AuditService } from '../../audit/audit.service';
import { RuntimeResolverService, ResolutionRecord } from '../runtime-resolver.service';
import { RuntimeCockpitQueryDto } from './cockpit.dto';

@Injectable()
export class RuntimeCockpitService {
  constructor(private readonly resolver: RuntimeResolverService, private readonly audit: AuditService) {}

  dashboard(tenantId: string, query: RuntimeCockpitQueryDto) {
    const records = this.filtered(tenantId, query);
    const attention = this.buildAttention(records);
    const resolved = records.filter((record) => record.manifest.resolution.status === 'RESOLVED').length;
    const blocked = records.filter((record) => record.manifest.resolution.status === 'BLOCKED').length;
    const degraded = records.filter((record) => record.manifest.resolution.status === 'DEGRADED' || record.manifest.resolution.status === 'PARTIALLY_RESOLVED').length;
    const errors = records.filter((record) => record.manifest.resolution.status === 'ERROR').length;
    return { context: { tenantId, applicationId: query.applicationId, environment: query.environment }, health: { status: this.health(records, attention) }, kpis: { totalResolutions: records.length, resolved, blocked, degraded, errors, partiallyResolved: records.filter((record) => record.manifest.resolution.status === 'PARTIALLY_RESOLVED').length, averageResolutionTimeMs: null, cacheHitRate: null, providerAvailability: 'UP' }, attention: attention.slice(0, 20), providerHealth: this.providers(), performance: { p50: null, p95: null, p99: null, average: null, slowest: [] }, cache: this.resolver.cacheStats(), recentResolutions: records.slice(0, 10).map((record) => this.summary(record)), recentActivity: records.slice(0, 10).map((record) => this.activityEntry(record)), dashboardStatus: 'READY' };
  }

  listResolutions(tenantId: string, query: RuntimeCockpitQueryDto) { const records = this.filtered(tenantId, query); const start = (query.page - 1) * query.limit; const items = records.slice(start, start + query.limit).map((record) => this.summary(record)); return { items, pagination: { page: query.page, limit: query.limit, total: records.length, pages: Math.ceil(records.length / query.limit) } }; }
  getResolution(tenantId: string, id: string) { const record = this.scoped(tenantId, id); return { ...record, sourceManifest: undefined, context: { tenantId: record.context.tenantId, applicationId: record.context.applicationId, environment: record.context.environment } }; }
  diagnostics(tenantId: string, id: string) { const record = this.scoped(tenantId, id); return record.diagnostics.map((issue) => ({ ...issue, explanation: this.explain(issue) })); }
  timeline(tenantId: string, id: string) { const record = this.scoped(tenantId, id); return [{ event: 'resolution.completed', status: record.manifest.resolution.status, at: record.createdAt, traceId: record.traceId }]; }
  attention(tenantId: string, query: { severity?: string; limit?: number }) { let items = this.buildAttention(this.resolver.listResolutions().filter((record) => record.context.tenantId === tenantId)); if (query.severity) items = items.filter((item) => item.severity === query.severity); return items.slice(0, query.limit ?? 20); }
  activity(tenantId: string) { return this.resolver.listResolutions().filter((record) => record.context.tenantId === tenantId).slice(0, 50).map((record) => this.activityEntry(record)); }
  providers() { return [{ name: 'Application Context Provider', status: 'UP', latencyMs: null, circuitBreakerState: 'CLOSED' }, { name: 'IAM Context Provider', status: 'UP', latencyMs: null, circuitBreakerState: 'CLOSED' }, { name: 'Entitlement Provider', status: 'UP', latencyMs: null, circuitBreakerState: 'CLOSED' }, { name: 'Capability Provider', status: 'UP', latencyMs: null, circuitBreakerState: 'CLOSED' }]; }
  performance(tenantId: string) { return { tenantId, p50: null, p95: null, p99: null, average: null, slowest: this.listResolutions(tenantId, { page: 1, limit: 10 }) }; }
  compare(tenantId: string, left: string, right: string) { const result = this.resolver.compareResolutions(left, right); const leftRecord = this.scoped(tenantId, left); this.scoped(tenantId, right); if (leftRecord.context.tenantId !== tenantId) throw new ForbiddenException('RUNTIME_COMPARE_NOT_ALLOWED'); return result; }
  async retry(tenantId: string, id: string, actorId: string) { this.scoped(tenantId, id); const result = await this.resolver.retryResolution(id); await this.audit.log({ actorId, eventType: 'runtime.retry.requested', action: 'RETRY', targetType: 'RuntimeResolution', targetId: id, metadata: { tenantId, retryResolutionId: result.resolutionId } }); return result; }
  async invalidateCache(tenantId: string, actorId: string, reason?: string) { const result = this.resolver.invalidateCache(); await this.audit.log({ actorId, eventType: 'runtime.cache.invalidated', action: 'INVALIDATE', targetType: 'RuntimeCache', targetId: tenantId, metadata: { tenantId, reason, ...result } }); return { ...result, tenantId }; }

  private filtered(tenantId: string, query: RuntimeCockpitQueryDto) { return this.resolver.listResolutions().filter((record) => record.context.tenantId === tenantId && (!query.applicationId || record.context.applicationId === query.applicationId) && (!query.environment || record.context.environment === query.environment) && (!query.packCode || record.manifest.sourceManifest.packCode === query.packCode) && (!query.packVersion || record.manifest.sourceManifest.packVersion === query.packVersion) && (!query.status || record.manifest.resolution.status === query.status)); }
  private scoped(tenantId: string, id: string): ResolutionRecord { const record = this.resolver.getResolution(id); if (record.context.tenantId !== tenantId) throw new NotFoundException('RUNTIME_RESOLUTION_NOT_FOUND'); return record; }
  private summary(record: ResolutionRecord) { return { resolutionId: record.id, traceId: record.traceId, tenantId: record.context.tenantId, applicationId: record.context.applicationId, environment: record.context.environment, packCode: record.manifest.sourceManifest.packCode, packVersion: record.manifest.sourceManifest.packVersion, status: record.manifest.resolution.status, durationMs: null, manifestHash: record.manifest.sourceManifest.manifestHash, effectiveManifestHash: record.manifest.effectiveManifestHash, createdAt: record.createdAt }; }
  private activityEntry(record: ResolutionRecord) { return { eventType: `runtime.resolution.${record.manifest.resolution.status.toLowerCase()}`, targetId: record.id, traceId: record.traceId, createdAt: record.createdAt, result: record.manifest.resolution.status }; }
  private buildAttention(records: ResolutionRecord[]) { return records.flatMap((record) => record.diagnostics.map((issue) => ({ severity: issue.code.includes('MISSING') || issue.code.includes('BLOCKED') ? 'CRITICAL' : 'ERROR', code: issue.code, message: issue.message, resolutionId: record.id, traceId: record.traceId, packCode: record.manifest.sourceManifest.packCode, packVersion: record.manifest.sourceManifest.packVersion }))).sort((left, right) => this.severity(right.severity) - this.severity(left.severity)); }
  private health(records: ResolutionRecord[], attention: unknown[]) { if (!records.length) return 'UNKNOWN'; if (records.some((record) => record.manifest.resolution.status === 'ERROR' || record.manifest.resolution.status === 'BLOCKED')) return 'CRITICAL'; if (attention.length) return 'WARNING'; return 'HEALTHY'; }
  private severity(value: string) { return ({ INFO: 1, WARNING: 2, ERROR: 3, CRITICAL: 4 } as Record<string, number>)[value] ?? 0; }
  private explain(issue: { code: string; message?: string }) { return issue.message ?? issue.code; }
}
