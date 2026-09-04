import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { Pack, PackVersion } from '../../entities';
import { PackDependencyType, PackStatus, PackValidationStatus, PackVersionStatus } from '../../../../common/enums';
import { AttentionSeverity, DashboardHealth, DashboardQuery } from './dashboard.types';

@Injectable()
export class DashboardService {
  constructor(@InjectDataSource() private readonly dataSource: DataSource) {}

  async getDashboard(tenantId: string, query: DashboardQuery = {}) {
    const { packs, versions } = await this.loadData(tenantId, query);
    const validation = this.countBy(versions, (version) => version.validationStatus);
    const dependencies = this.dependencySummary(versions);
    const attention = this.buildAttention(packs, versions);
    return {
      summary: { totalPacks: packs.length, draft: this.countPacks(packs, PackStatus.DRAFT), configuring: this.countVersions(versions, PackVersionStatus.CONFIGURING), validating: this.countVersions(versions, PackVersionStatus.VALIDATING), ready: this.countVersions(versions, PackVersionStatus.READY), published: this.countVersions(versions, PackVersionStatus.PUBLISHED), invalid: this.countVersions(versions, PackVersionStatus.INVALID), archived: this.countPacks(packs, PackStatus.ARCHIVED) },
      health: { status: this.health(versions, attention) as DashboardHealth },
      validation: { total: versions.length, ...validation },
      dependencies,
      manifests: { generated: versions.filter((version) => !!version.snapshotHash).length, valid: versions.filter((version) => !!version.snapshotHash && version.validationStatus === PackValidationStatus.VALID).length, missing: versions.filter((version) => !version.snapshotHash).length, invalid: versions.filter((version) => version.validationStatus === PackValidationStatus.INVALID).length },
      publication: { ready: this.countVersions(versions, PackVersionStatus.READY), published: this.countVersions(versions, PackVersionStatus.PUBLISHED), blocked: attention.filter((item) => item.severity === 'CRITICAL' || item.severity === 'ERROR').length },
      attention: attention.slice(0, 20),
      recentActivity: this.activity(versions, 10),
    };
  }

  async getAttention(tenantId: string, query: { severity?: string; limit?: string }) {
    const { packs, versions } = await this.loadData(tenantId);
    let attention = this.buildAttention(packs, versions);
    if (query.severity) attention = attention.filter((item) => item.severity === query.severity);
    return attention.slice(0, this.limit(query.limit));
  }

  async getActivity(tenantId: string, query: { eventType?: string; packId?: string; limit?: string }) {
    const { versions } = await this.loadData(tenantId);
    let activity = this.activity(versions, this.limit(query.limit));
    if (query.packId) activity = activity.filter((item) => item.packId === query.packId);
    if (query.eventType) activity = activity.filter((item) => item.eventType === query.eventType);
    return activity;
  }

  private async loadData(tenantId: string, query: DashboardQuery = {}) {
    const packRepository = this.dataSource.getRepository(Pack);
    const versionRepository = this.dataSource.getRepository(PackVersion);
    const packQuery = packRepository.createQueryBuilder('pack').where('pack.tenantId = :tenantId', { tenantId });
    if (query.status) packQuery.andWhere('pack.status = :status', { status: query.status });
    if (query.category) packQuery.andWhere('pack.category = :category', { category: query.category });
    if (query.search) packQuery.andWhere('(pack.code ILIKE :search OR pack.name ILIKE :search)', { search: `%${query.search}%` });
    const packs = await packQuery.orderBy('pack.updatedAt', 'DESC').getMany();
    const packIds = packs.map((pack) => pack.id);
    if (!packIds.length) return { packs, versions: [] as PackVersion[] };
    const versionQuery = versionRepository.createQueryBuilder('version').leftJoinAndSelect('version.pack', 'pack').where('version.tenantId = :tenantId', { tenantId }).andWhere('version.packId IN (:...packIds)', { packIds });
    if (query.validationStatus) versionQuery.andWhere('version.validationStatus = :validationStatus', { validationStatus: query.validationStatus });
    return { packs, versions: await versionQuery.orderBy('version.updatedAt', 'DESC').getMany() };
  }

  private buildAttention(packs: Pack[], versions: PackVersion[]) {
    const names = new Map(packs.map((pack) => [pack.id, pack.name]));
    return versions.flatMap((version) => {
      const dependencies = this.dependencySummary([version]);
      const items: Array<{ severity: AttentionSeverity; packId: string; pack: string; versionId: string; version: string; problem: string; origin: string; date: Date }> = [];
      if (dependencies.blockingConflicts || dependencies.requiredMissing) items.push({ severity: 'CRITICAL', packId: version.packId, pack: names.get(version.packId) ?? version.packId, versionId: version.id, version: version.versionNumber, problem: dependencies.blockingConflicts ? 'Blocking dependency conflict' : 'Required dependency missing', origin: 'dependency', date: version.updatedAt });
      else if (version.validationStatus === PackValidationStatus.ERROR) items.push({ severity: 'ERROR', packId: version.packId, pack: names.get(version.packId) ?? version.packId, versionId: version.id, version: version.versionNumber, problem: 'Validation error', origin: 'validation', date: version.updatedAt });
      else if (version.validationStatus === PackValidationStatus.OUTDATED) items.push({ severity: 'WARNING', packId: version.packId, pack: names.get(version.packId) ?? version.packId, versionId: version.id, version: version.versionNumber, problem: 'Validation outdated', origin: 'validation', date: version.updatedAt });
      else if (version.status === PackVersionStatus.READY && !version.snapshotHash) items.push({ severity: 'INFO', packId: version.packId, pack: names.get(version.packId) ?? version.packId, versionId: version.id, version: version.versionNumber, problem: 'Manifest not generated', origin: 'manifest', date: version.updatedAt });
      return items;
    }).sort((left, right) => thisseverity(left.severity) - thisseverity(right.severity) || right.date.getTime() - left.date.getTime());
  }

  private dependencySummary(versions: PackVersion[]) {
    const dependencies = versions.flatMap((version) => version.dependencies ?? []);
    const required = dependencies.filter((dependency) => dependency.type === PackDependencyType.REQUIRED);
    const missing = dependencies.filter((dependency) => dependency.resolved === false);
    const conflicts = dependencies.filter((dependency) => dependency.conflict === true || dependency.type === PackDependencyType.CONFLICTS_WITH);
    return { total: dependencies.length, required: required.length, optional: dependencies.filter((dependency) => dependency.type === PackDependencyType.OPTIONAL).length, resolved: dependencies.length - missing.length, missing: missing.length, requiredMissing: required.some((dependency) => dependency.resolved === false), conflicts: conflicts.length, blockingConflicts: conflicts.some((dependency) => dependency.type === PackDependencyType.CONFLICTS_WITH || dependency.blocking === true) };
  }

  private activity(versions: PackVersion[], limit: number) { return versions.slice(0, limit).map((version) => ({ date: version.updatedAt, actorId: version.publishedBy ?? version.createdBy, eventType: version.status === PackVersionStatus.PUBLISHED ? 'pack.version.published' : `pack.version.${version.status.toLowerCase()}`, targetId: version.id, packId: version.packId, result: 'SUCCESS' })); }
  private health(versions: PackVersion[], attention: Array<{ severity: AttentionSeverity }>): DashboardHealth { if (!versions.length) return 'UNKNOWN'; if (attention.some((item) => item.severity === 'CRITICAL')) return 'CRITICAL'; if (attention.length) return 'WARNING'; return 'HEALTHY'; }
  private countBy(items: PackVersion[], selector: (item: PackVersion) => string) { return Object.fromEntries([...new Set(items.map(selector))].map((key) => [key.toLowerCase(), items.filter((item) => selector(item) === key).length])); }
  private countPacks(packs: Pack[], status: PackStatus) { return packs.filter((pack) => pack.status === status).length; }
  private countVersions(versions: PackVersion[], status: PackVersionStatus) { return versions.filter((version) => version.status === status).length; }
  private limit(value?: string) { const parsed = Number(value ?? 20); return Number.isFinite(parsed) ? Math.min(Math.max(parsed, 1), 100) : 20; }
}

function thisseverity(severity: AttentionSeverity): number { return { CRITICAL: 0, ERROR: 1, WARNING: 2, INFO: 3 }[severity]; }
