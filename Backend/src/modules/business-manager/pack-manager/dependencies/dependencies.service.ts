import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { AuditService } from '../../audit/audit.service';
import { Pack } from '../../entities/pack.entity';
import { PackCapability } from '../../entities/pack-capability.entity';
import { PackDependency } from '../../entities/pack-dependency.entity';
import { PackFeature } from '../../entities/pack-feature.entity';
import { PackModule } from '../../entities/pack-module.entity';
import { PackOutboxEvent } from '../../entities/pack-outbox-event.entity';
import { PackVersion } from '../../entities/pack-version.entity';
import { DependencyResolutionStatus, DependencySourceType, DependencyStatus, DependencyTargetType, DependencyType, PackManifestStatus, PackValidationStatus, PackVersionStatus } from '../../../../common/enums';
import { CreateDependencyDto, DependencyQueryDto, UpdateDependencyDto } from './dependency.dto';
import { findDependencyCycles, isValidVersionRange, normalizeVersionRange, satisfiesVersion } from './dependency-resolver.utils';

interface ResolvedTarget { key: string; ref: string; version?: string; exists: boolean; compatible: boolean; }
export interface ResolutionIssue { code: string; severity: 'ERROR' | 'WARNING' | 'INFO'; dependencyId?: string; path: string; message: string; }

@Injectable()
export class DependenciesService {
  private readonly dependencies: Repository<PackDependency>;
  private readonly versions: Repository<PackVersion>;
  private readonly packs: Repository<Pack>;
  private readonly modules: Repository<PackModule>;
  private readonly features: Repository<PackFeature>;
  private readonly capabilities: Repository<PackCapability>;

  constructor(@InjectDataSource() private readonly dataSource: DataSource, private readonly audit: AuditService) {
    this.dependencies = dataSource.getRepository(PackDependency);
    this.versions = dataSource.getRepository(PackVersion);
    this.packs = dataSource.getRepository(Pack);
    this.modules = dataSource.getRepository(PackModule);
    this.features = dataSource.getRepository(PackFeature);
    this.capabilities = dataSource.getRepository(PackCapability);
  }

  async list(tenantId: string, versionId: string, query: DependencyQueryDto = new DependencyQueryDto()) {
    await this.getVersion(tenantId, versionId);
    const qb = this.dependencies.createQueryBuilder('dependency').where('dependency.tenantId = :tenantId AND dependency.packVersionId = :versionId AND dependency.status = :status', { tenantId, versionId, status: DependencyStatus.ACTIVE });
    if (query.dependencyType) qb.andWhere('dependency.dependencyType = :dependencyType', { dependencyType: query.dependencyType });
    if (query.sourceType) qb.andWhere('dependency.sourceType = :sourceType', { sourceType: query.sourceType });
    if (query.targetType) qb.andWhere('dependency.targetType = :targetType', { targetType: query.targetType });
    if (query.resolutionStatus) qb.andWhere('dependency.resolutionStatus = :resolutionStatus', { resolutionStatus: query.resolutionStatus });
    if (query.required !== undefined) qb.andWhere('dependency.required = :required', { required: query.required });
    if (query.search) qb.andWhere('(dependency.targetRef ILIKE :search OR dependency.reason ILIKE :search)', { search: `%${query.search}%` });
    return qb.orderBy('dependency.createdAt', 'ASC').getMany();
  }

  async get(tenantId: string, id: string) {
    const dependency = await this.dependencies.findOne({ where: { id, tenantId } });
    if (!dependency) throw new NotFoundException('PACK_DEPENDENCY_NOT_FOUND');
    return dependency;
  }

  async create(tenantId: string, versionId: string, actorId: string, dto: CreateDependencyDto) {
    const version = await this.mutableVersion(tenantId, versionId);
    await this.validateSource(tenantId, version, dto.sourceType, dto.sourceId);
    const range = this.normalizeRange(dto.targetVersionRange);
    await this.assertTargetShape(dto.targetType, dto.targetRef, range);
    const duplicate = await this.dependencies.findOne({ where: { tenantId, packVersionId: versionId, sourceType: dto.sourceType, sourceId: dto.sourceId, dependencyType: dto.dependencyType, targetType: dto.targetType, targetRef: dto.targetRef, status: DependencyStatus.ACTIVE } });
    if (duplicate) throw new ConflictException('PACK_DEPENDENCY_ALREADY_EXISTS');
    const dependency = await this.dependencies.save(this.dependencies.create({ ...dto, tenantId, packVersionId: versionId, targetVersionRange: range, required: dto.required ?? [DependencyType.REQUIRED, DependencyType.REQUIRES, DependencyType.IMPLIES].includes(dto.dependencyType), status: DependencyStatus.ACTIVE, resolutionStatus: DependencyResolutionStatus.NOT_RESOLVED, metadata: dto.metadata ?? {}, createdBy: actorId }));
    await this.invalidate(version, tenantId, actorId, 'pack.dependency.created', dependency.id);
    return dependency;
  }

  async update(tenantId: string, id: string, actorId: string, dto: UpdateDependencyDto) {
    const dependency = await this.get(tenantId, id);
    const version = await this.mutableVersion(tenantId, dependency.packVersionId);
    if (dto.rowVersion !== undefined && dto.rowVersion !== dependency.rowVersion) throw new ConflictException('PACK_DEPENDENCY_CONCURRENT_MODIFICATION');
    const targetType = dto.targetType ?? dependency.targetType;
    const targetRef = dto.targetRef ?? dependency.targetRef;
    const range = this.normalizeRange(dto.targetVersionRange ?? dependency.targetVersionRange);
    await this.assertTargetShape(targetType, targetRef, range);
    const { rowVersion: _rowVersion, ...content } = dto;
    Object.assign(dependency, content, { targetVersionRange: range, updatedBy: actorId, rowVersion: dependency.rowVersion + 1, resolutionStatus: DependencyResolutionStatus.OUTDATED });
    const saved = await this.dependencies.save(dependency);
    await this.invalidate(version, tenantId, actorId, 'pack.dependency.updated', id);
    return saved;
  }

  async archive(tenantId: string, id: string, actorId: string) {
    const dependency = await this.get(tenantId, id);
    const version = await this.mutableVersion(tenantId, dependency.packVersionId);
    dependency.status = DependencyStatus.ARCHIVED;
    dependency.archivedAt = new Date();
    dependency.updatedBy = actorId;
    dependency.rowVersion += 1;
    const saved = await this.dependencies.save(dependency);
    await this.invalidate(version, tenantId, actorId, 'pack.dependency.archived', id);
    return saved;
  }

  async resolve(tenantId: string, versionId: string, actorId?: string) {
    const version = await this.getVersion(tenantId, versionId);
    const dependencies = await this.list(tenantId, versionId);
    const issues: ResolutionIssue[] = [];
    const nodes = new Map<string, string>();
    const edges = new Map<string, string[]>();
    const targets = new Map<string, ResolvedTarget>();

    for (const dependency of dependencies) {
      const sourceKey = this.sourceKey(dependency.sourceType, dependency.sourceId);
      nodes.set(sourceKey, sourceKey);
      const target = await this.resolveTarget(tenantId, version, dependency);
      targets.set(dependency.id, target);
      if (!target.exists) {
        dependency.resolutionStatus = dependency.required ? DependencyResolutionStatus.MISSING : DependencyResolutionStatus.OUTDATED;
        issues.push({ code: 'PACK_DEPENDENCY_MISSING', severity: dependency.required ? 'ERROR' : 'WARNING', dependencyId: dependency.id, path: `${sourceKey} -> ${dependency.targetType.toLowerCase()}:${dependency.targetRef}`, message: `Target ${dependency.targetRef} was not found` });
        continue;
      }
      if (!target.compatible) {
        dependency.resolutionStatus = DependencyResolutionStatus.INCOMPATIBLE;
        issues.push({ code: 'PACK_DEPENDENCY_INCOMPATIBLE', severity: 'ERROR', dependencyId: dependency.id, path: `${sourceKey} -> ${target.key}`, message: `Target version does not satisfy ${dependency.targetVersionRange}` });
        continue;
      }
      nodes.set(target.key, target.key);
      if (dependency.dependencyType !== DependencyType.CONFLICTS_WITH) edges.set(sourceKey, [...(edges.get(sourceKey) ?? []), target.key]);
      if (dependency.dependencyType === DependencyType.CONFLICTS_WITH) {
        dependency.resolutionStatus = DependencyResolutionStatus.CONFLICT;
        issues.push({ code: 'PACK_DEPENDENCY_CONFLICT', severity: dependency.required ? 'ERROR' : 'WARNING', dependencyId: dependency.id, path: `${sourceKey} -> ${target.key}`, message: 'Conflicting target is available in the current context' });
      } else dependency.resolutionStatus = DependencyResolutionStatus.RESOLVED;
    }

    const cycles = findDependencyCycles(edges);
    for (const cycle of cycles) {
      const cycleText = cycle.join(' -> ');
      issues.push({ code: 'PACK_DEPENDENCY_CYCLE', severity: 'ERROR', path: cycleText, message: 'Dependency cycle detected' });
      for (const dependency of dependencies) if (cycle.includes(this.sourceKey(dependency.sourceType, dependency.sourceId)) && dependency.resolutionStatus === DependencyResolutionStatus.RESOLVED) dependency.resolutionStatus = DependencyResolutionStatus.CYCLE;
    }
    await this.dependencies.save(dependencies);
    const blocking = issues.filter((issue) => issue.severity === 'ERROR');
    const report = { status: blocking.length ? 'INVALID' : issues.length ? 'WARNING' : 'VALID', summary: { total: dependencies.length, resolved: dependencies.filter((item) => item.resolutionStatus === DependencyResolutionStatus.RESOLVED).length, missing: dependencies.filter((item) => item.resolutionStatus === DependencyResolutionStatus.MISSING).length, incompatible: dependencies.filter((item) => item.resolutionStatus === DependencyResolutionStatus.INCOMPATIBLE).length, conflicts: dependencies.filter((item) => item.resolutionStatus === DependencyResolutionStatus.CONFLICT).length, cycles: cycles.length, blocking: blocking.length }, issues };
    await this.versions.update({ id: version.id, tenantId }, { validationStatus: blocking.length ? PackValidationStatus.INVALID : PackValidationStatus.VALID, manifestStatus: blocking.length ? PackManifestStatus.INVALID : PackManifestStatus.OUTDATED, validationDetails: report, updatedBy: actorId });
    if (actorId) await this.event(tenantId, actorId, 'pack.dependency.resolved', versionId, report);
    return report;
  }

  async graph(tenantId: string, versionId: string) {
    const version = await this.getVersion(tenantId, versionId);
    const dependencies = await this.list(tenantId, versionId);
    const nodes = new Map<string, { id: string; type: string; ref: string }>();
    const edges: Array<{ source: string; target: string; type: DependencyType; status: DependencyResolutionStatus; direct: boolean }> = [];
    for (const dependency of dependencies) {
      const source = this.sourceKey(dependency.sourceType, dependency.sourceId);
      const target = await this.resolveTarget(tenantId, version, dependency);
      nodes.set(source, { id: source, type: dependency.sourceType, ref: dependency.sourceId });
      nodes.set(target.key, { id: target.key, type: dependency.targetType, ref: dependency.targetRef });
      edges.push({ source, target: target.key, type: dependency.dependencyType, status: dependency.resolutionStatus, direct: true });
    }
    return { nodes: [...nodes.values()], edges };
  }

  async impact(tenantId: string, id: string) {
    const dependency = await this.get(tenantId, id);
    const consumers = await this.dependencies.find({ where: { tenantId, targetType: dependency.targetType, targetRef: dependency.targetRef, status: DependencyStatus.ACTIVE } });
    return { dependencyId: id, blocking: consumers.filter((item) => item.required).map((item) => item.id), warnings: consumers.filter((item) => !item.required).map((item) => item.id), infos: [], consumers, summary: { consumers: consumers.length, required: consumers.filter((item) => item.required).length } };
  }

  private async resolveTarget(tenantId: string, version: PackVersion, dependency: PackDependency): Promise<ResolvedTarget> {
    const ref = dependency.targetRef;
    if (dependency.targetType === DependencyTargetType.MODULE) { const item = await this.modules.findOne({ where: [{ id: ref, tenantId, packVersionId: version.id }, { code: ref, tenantId, packVersionId: version.id }] }); return { key: `MODULE:${item?.id ?? ref}`, ref, exists: !!item?.enabled, compatible: !!item?.enabled }; }
    if (dependency.targetType === DependencyTargetType.FEATURE) { const item = await this.features.findOne({ where: [{ id: ref, tenantId, packVersionId: version.id }, { code: ref, tenantId, packVersionId: version.id }] }); return { key: `FEATURE:${item?.id ?? ref}`, ref, exists: !!item?.enabled, compatible: !!item?.enabled }; }
    if (dependency.targetType === DependencyTargetType.CAPABILITY) { const item = await this.capabilities.findOne({ where: [{ id: ref, tenantId }, { code: ref, tenantId }] }); return { key: `CAPABILITY:${item?.id ?? ref}`, ref, exists: item?.status !== 'ARCHIVED', compatible: item?.status !== 'ARCHIVED' }; }
    if (dependency.targetType === DependencyTargetType.PACK) { const pack = await this.packs.findOne({ where: [{ id: ref, tenantId }, { code: ref, tenantId }] }); const available = pack && pack.status !== 'ARCHIVED'; const packVersion = available ? await this.versions.findOne({ where: { tenantId, packId: pack.id, status: PackVersionStatus.PUBLISHED }, order: { createdAt: 'DESC' } }) : null; return { key: `PACK:${pack?.id ?? ref}`, ref, version: packVersion?.versionNumber, exists: !!available, compatible: !!available && this.satisfies(packVersion?.versionNumber, dependency.targetVersionRange) }; }
    return { key: `CONTRACT:${ref}`, ref, exists: false, compatible: false };
  }

  private async validateSource(tenantId: string, version: PackVersion, sourceType: DependencySourceType, sourceId: string) {
    if (sourceType === DependencySourceType.PACK && sourceId === version.packId) return;
    const repositories = { [DependencySourceType.MODULE]: this.modules, [DependencySourceType.FEATURE]: this.features, [DependencySourceType.CAPABILITY]: this.capabilities };
    if (sourceType === DependencySourceType.PACK) throw new NotFoundException('PACK_SOURCE_NOT_FOUND');
    const repository = repositories[sourceType];
    const where = sourceType === DependencySourceType.CAPABILITY ? { id: sourceId, tenantId } : { id: sourceId, tenantId, packVersionId: version.id };
    if (!(await repository.findOne({ where } as never))) throw new NotFoundException('PACK_DEPENDENCY_SOURCE_NOT_FOUND');
  }

  private async assertTargetShape(targetType: DependencyTargetType, targetRef: string, range?: string) { if (!targetRef.trim()) throw new ConflictException('PACK_DEPENDENCY_TARGET_NOT_FOUND'); if (range && !this.isValidRange(range)) throw new ConflictException('PACK_DEPENDENCY_VERSION_RANGE_INVALID'); if (targetType === DependencyTargetType.CONTRACT && !range && targetRef.includes('@')) throw new ConflictException('PACK_DEPENDENCY_VERSION_RANGE_INVALID'); }
  private normalizeRange(range?: string) { return normalizeVersionRange(range); }
  private isValidRange(range: string) { return isValidVersionRange(range); }
  private satisfies(version: string | undefined, range?: string) { return satisfiesVersion(version, range); }
  private sourceKey(type: DependencySourceType, id: string) { return `${type}:${id}`; }
  private async getVersion(tenantId: string, id: string) { const version = await this.versions.findOne({ where: { id, tenantId } }); if (!version) throw new NotFoundException('PACK_VERSION_NOT_FOUND'); return version; }
  private async mutableVersion(tenantId: string, id: string) { const version = await this.getVersion(tenantId, id); if ([PackVersionStatus.PUBLISHED, PackVersionStatus.SUPERSEDED, PackVersionStatus.DEPRECATED, PackVersionStatus.ARCHIVED].includes(version.status)) throw new ConflictException('PACK_VERSION_IMMUTABLE'); return version; }
  private async invalidate(version: PackVersion, tenantId: string, actorId: string, eventType: string, aggregateId: string) { const dependencies = await this.dependencies.find({ where: { tenantId, packVersionId: version.id, status: DependencyStatus.ACTIVE }, order: { createdAt: 'ASC' } }); await this.versions.update({ id: version.id, tenantId }, { dependencies: dependencies.map((item) => ({ id: item.id, sourceType: item.sourceType, sourceId: item.sourceId, dependencyType: item.dependencyType, targetType: item.targetType, targetRef: item.targetRef, targetVersionRange: item.targetVersionRange, required: item.required })), validationStatus: PackValidationStatus.OUTDATED, manifestStatus: PackManifestStatus.OUTDATED, snapshot: undefined, snapshotHash: undefined, manifest: undefined, manifestHash: undefined, updatedBy: actorId, version: version.version + 1 }); await this.event(tenantId, actorId, eventType, aggregateId, { packVersionId: version.id }); }
  private async event(tenantId: string, actorId: string, eventType: string, aggregateId: string, payload: unknown) { await this.audit.log({ actorId, eventType, action: eventType.split('.').pop()?.toUpperCase() ?? 'UPDATE', targetType: 'PackDependency', targetId: aggregateId, after: payload, metadata: { tenantId } }); await this.dataSource.getRepository(PackOutboxEvent).save({ tenantId, eventType, aggregateType: 'PackDependency', aggregateId, payload: payload as Record<string, unknown> }); }
}
