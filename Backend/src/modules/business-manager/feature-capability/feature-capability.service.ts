import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { createHash } from 'crypto';
import { DataSource, Repository } from 'typeorm';
import { ApplicationVersion } from '../entities/application-version.entity';
import { Capability } from '../entities/capability.entity';
import { CapabilityDependency } from '../entities/capability-dependency.entity';
import { CapabilityEntityRequirement } from '../entities/capability-entity-requirement.entity';
import { DataModelDefinition } from '../entities/data-model.entity';
import { Feature } from '../entities/feature.entity';
import { FeatureCapability } from '../entities/feature-capability.entity';
import { VersionCapability } from '../entities/version-capability.entity';
import { VersionFeature } from '../entities/version-feature.entity';
import { ApplicationVersionStatus, CapabilityStatus, DependencyType, FeatureStatus, VersionFeatureState } from '../../../common/enums';

export interface ValidationIssue {
  severity: 'ERROR' | 'WARNING' | 'INFO';
  code: string;
  message: string;
  target?: string;
  dependency?: string;
}

type CatalogQuery = { search?: string; status?: string; category?: string; type?: string; riskLevel?: string; sourceType?: string; group?: string; page?: number; limit?: number };

@Injectable()
export class FeatureCapabilityService {
  private readonly featureRepository: Repository<Feature>;
  private readonly capabilityRepository: Repository<Capability>;
  private readonly featureCapabilityRepository: Repository<FeatureCapability>;
  private readonly versionFeatureRepository: Repository<VersionFeature>;
  private readonly versionCapabilityRepository: Repository<VersionCapability>;
  private readonly dependencyRepository: Repository<CapabilityDependency>;
  private readonly requirementRepository: Repository<CapabilityEntityRequirement>;
  private readonly versionRepository: Repository<ApplicationVersion>;
  private readonly dataModelRepository: Repository<DataModelDefinition>;

  constructor(@InjectDataSource() private readonly dataSource: DataSource) {
    this.featureRepository = dataSource.getRepository(Feature);
    this.capabilityRepository = dataSource.getRepository(Capability);
    this.featureCapabilityRepository = dataSource.getRepository(FeatureCapability);
    this.versionFeatureRepository = dataSource.getRepository(VersionFeature);
    this.versionCapabilityRepository = dataSource.getRepository(VersionCapability);
    this.dependencyRepository = dataSource.getRepository(CapabilityDependency);
    this.requirementRepository = dataSource.getRepository(CapabilityEntityRequirement);
    this.versionRepository = dataSource.getRepository(ApplicationVersion);
    this.dataModelRepository = dataSource.getRepository(DataModelDefinition);
  }

  async createFeature(data: Partial<Feature>): Promise<Feature> {
    const code = String(data.code ?? '').trim().toUpperCase();
    if (!code || !String(data.name ?? '').trim()) throw new BadRequestException('FEATURE_CODE_AND_NAME_REQUIRED');
    if (await this.featureRepository.findOne({ where: { code } })) throw new ConflictException('FEATURE_CODE_EXISTS');
    return this.featureRepository.save(this.featureRepository.create({ ...data, code, status: data.status ?? FeatureStatus.DRAFT, version: 1 }));
  }

  async listFeatures(query: CatalogQuery = {}) {
    const qb = this.featureRepository.createQueryBuilder('feature');
    if (query.search) qb.andWhere('(LOWER(feature.code) LIKE LOWER(:search) OR LOWER(feature.name) LIKE LOWER(:search))', { search: `%${query.search}%` });
    for (const key of ['status', 'category', 'sourceType'] as const) if (query[key]) qb.andWhere(`feature.${key} = :${key}`, { [key]: query[key] });
    const limit = Math.min(Number(query.limit) || 25, 100);
    const [items, total] = await qb.orderBy('feature.sortOrder', 'ASC').addOrderBy('feature.code', 'ASC').skip(((Number(query.page) || 1) - 1) * limit).take(limit).getManyAndCount();
    return { items, pagination: this.pagination(query, total) };
  }
  async getFeature(id: string): Promise<Feature> { return this.requireFeature(id); }
  async updateFeature(id: string, data: Partial<Feature> & { expectedVersion?: number }): Promise<Feature> {
    const feature = await this.requireFeature(id); this.assertOptimisticLock(feature.version, data.expectedVersion);
    const { expectedVersion: _expectedVersion, id: _id, code: _code, createdBy: _createdBy, ...changes } = data;
    return this.featureRepository.save({ ...feature, ...changes, version: feature.version + 1 });
  }
  deprecateFeature(id: string, expectedVersion?: number) { return this.updateFeature(id, { status: FeatureStatus.DEPRECATED, expectedVersion }); }
  archiveFeature(id: string, expectedVersion?: number) { return this.updateFeature(id, { status: FeatureStatus.ARCHIVED, archivedAt: new Date(), expectedVersion }); }

  async createCapability(data: Partial<Capability>): Promise<Capability> {
    const code = String(data.code ?? '').trim().toLowerCase();
    if (!/^[a-z][a-z0-9-]*(\.[a-z][a-z0-9-]*)+$/.test(code)) throw new BadRequestException('CAPABILITY_CODE_INVALID');
    if (!String(data.name ?? '').trim()) throw new BadRequestException('CAPABILITY_NAME_REQUIRED');
    if (await this.capabilityRepository.findOne({ where: { code } })) throw new ConflictException('CAPABILITY_CODE_EXISTS');
    return this.capabilityRepository.save(this.capabilityRepository.create({ ...data, code, status: data.status ?? CapabilityStatus.DRAFT, version: 1 }));
  }
  async listCapabilities(query: CatalogQuery = {}) {
    const qb = this.capabilityRepository.createQueryBuilder('capability');
    if (query.search) qb.andWhere('(LOWER(capability.code) LIKE LOWER(:search) OR LOWER(capability.name) LIKE LOWER(:search))', { search: `%${query.search}%` });
    for (const key of ['status', 'category', 'type', 'riskLevel', 'sourceType'] as const) if (query[key]) qb.andWhere(`capability.${key} = :${key}`, { [key]: query[key] });
    if (query.group) qb.andWhere('capability.groupName = :group', { group: query.group });
    const limit = Math.min(Number(query.limit) || 25, 100);
    const [items, total] = await qb.orderBy('capability.code', 'ASC').skip(((Number(query.page) || 1) - 1) * limit).take(limit).getManyAndCount();
    return { items, pagination: this.pagination(query, total) };
  }
  async getCapability(id: string): Promise<Capability> { return this.requireCapability(id); }
  async updateCapability(id: string, data: Partial<Capability> & { expectedVersion?: number }): Promise<Capability> {
    const capability = await this.requireCapability(id); this.assertOptimisticLock(capability.version, data.expectedVersion);
    const { expectedVersion: _expectedVersion, id: _id, code: _code, createdBy: _createdBy, ...changes } = data;
    return this.capabilityRepository.save({ ...capability, ...changes, version: capability.version + 1 });
  }
  deprecateCapability(id: string, expectedVersion?: number) { return this.updateCapability(id, { status: CapabilityStatus.DEPRECATED, expectedVersion }); }
  archiveCapability(id: string, expectedVersion?: number) { return this.updateCapability(id, { status: CapabilityStatus.ARCHIVED, archivedAt: new Date(), expectedVersion }); }

  async attachCapability(featureId: string, capabilityId: string, required = false, sortOrder = 0): Promise<FeatureCapability> {
    await this.requireFeature(featureId); await this.requireCapability(capabilityId);
    if (await this.featureCapabilityRepository.findOne({ where: { featureId, capabilityId } })) throw new ConflictException('FEATURE_CAPABILITY_EXISTS');
    return this.featureCapabilityRepository.save(this.featureCapabilityRepository.create({ featureId, capabilityId, required, sortOrder }));
  }
  async detachCapability(featureId: string, capabilityId: string): Promise<void> {
    const mapping = await this.featureCapabilityRepository.findOne({ where: { featureId, capabilityId } });
    if (!mapping) throw new NotFoundException('FEATURE_CAPABILITY_NOT_FOUND');
    await this.featureCapabilityRepository.remove(mapping);
  }
  async getFeatureCapabilities(featureId: string) { await this.requireFeature(featureId); return this.featureCapabilityRepository.find({ where: { featureId }, relations: ['capability'], order: { sortOrder: 'ASC' } }); }

  async addDependency(capabilityId: string, dependencyCapabilityId: string, dependencyType: DependencyType = DependencyType.REQUIRES, createdBy?: string): Promise<CapabilityDependency> {
    if (capabilityId === dependencyCapabilityId) throw new BadRequestException('DEPENDENCY_SELF_REFERENCE');
    await this.requireCapability(capabilityId); await this.requireCapability(dependencyCapabilityId);
    if (await this.dependencyRepository.findOne({ where: { capabilityId, dependencyCapabilityId, dependencyType } })) throw new ConflictException('DEPENDENCY_EXISTS');
    if (dependencyType === DependencyType.REQUIRES) {
      const edges = await this.dependencyRepository.find({ where: { dependencyType: DependencyType.REQUIRES } });
      this.assertNoCycle([...edges, { capabilityId, dependencyCapabilityId }]);
    }
    return this.dependencyRepository.save(this.dependencyRepository.create({ capabilityId, dependencyCapabilityId, dependencyType, createdBy }));
  }
  async removeDependency(capabilityId: string, dependencyId: string): Promise<void> {
    const dependency = await this.dependencyRepository.findOne({ where: { id: dependencyId, capabilityId } });
    if (!dependency) throw new NotFoundException('DEPENDENCY_NOT_FOUND');
    await this.dependencyRepository.remove(dependency);
  }
  async getDependencies(capabilityId: string) { await this.requireCapability(capabilityId); return this.dependencyRepository.find({ where: { capabilityId }, relations: ['dependencyCapability'] }); }
  async addEntityRequirement(capabilityId: string, dataEntityId: string, requirementType?: string): Promise<CapabilityEntityRequirement> {
    await this.requireCapability(capabilityId);
    if (await this.requirementRepository.findOne({ where: { capabilityId, dataEntityId } })) throw new ConflictException('ENTITY_REQUIREMENT_EXISTS');
    return this.requirementRepository.save(this.requirementRepository.create({ capabilityId, dataEntityId, requirementType }));
  }
  async removeEntityRequirement(capabilityId: string, requirementId: string): Promise<void> {
    const requirement = await this.requirementRepository.findOne({ where: { id: requirementId, capabilityId } });
    if (!requirement) throw new NotFoundException('ENTITY_REQUIREMENT_NOT_FOUND');
    await this.requirementRepository.remove(requirement);
  }
  async getEntityRequirements(capabilityId: string) { await this.requireCapability(capabilityId); return this.requirementRepository.find({ where: { capabilityId } }); }

  async setFeatureState(versionId: string, featureId: string, state: VersionFeatureState, createdBy?: string, expectedVersion?: number): Promise<VersionFeature> {
    await this.assertEditableVersion(versionId); await this.requireFeature(featureId);
    const existing = await this.versionFeatureRepository.findOne({ where: { applicationVersionId: versionId, featureId } });
    if (existing) { this.assertOptimisticLock(existing.version, expectedVersion); return this.versionFeatureRepository.save({ ...existing, state, createdBy: createdBy ?? existing.createdBy, version: existing.version + 1 }); }
    return this.versionFeatureRepository.save(this.versionFeatureRepository.create({ applicationVersionId: versionId, featureId, state, createdBy }));
  }
  enableFeature(versionId: string, featureId: string, createdBy?: string, expectedVersion?: number) { return this.setFeatureState(versionId, featureId, VersionFeatureState.ENABLED, createdBy, expectedVersion); }
  disableFeature(versionId: string, featureId: string, createdBy?: string, expectedVersion?: number) { return this.setFeatureState(versionId, featureId, VersionFeatureState.DISABLED, createdBy, expectedVersion); }
  setFeatureExperimental(versionId: string, featureId: string, createdBy?: string, expectedVersion?: number) { return this.setFeatureState(versionId, featureId, VersionFeatureState.EXPERIMENTAL, createdBy, expectedVersion); }
  async setCapabilityEnabled(versionId: string, capabilityId: string, enabled: boolean, createdBy?: string, expectedVersion?: number): Promise<VersionCapability> {
    await this.assertEditableVersion(versionId); await this.requireCapability(capabilityId);
    const existing = await this.versionCapabilityRepository.findOne({ where: { applicationVersionId: versionId, capabilityId } });
    if (existing) { this.assertOptimisticLock(existing.version, expectedVersion); return this.versionCapabilityRepository.save({ ...existing, enabled, createdBy: createdBy ?? existing.createdBy, version: existing.version + 1 }); }
    return this.versionCapabilityRepository.save(this.versionCapabilityRepository.create({ applicationVersionId: versionId, capabilityId, enabled, createdBy }));
  }
  enableCapability(versionId: string, capabilityId: string, createdBy?: string, expectedVersion?: number) { return this.setCapabilityEnabled(versionId, capabilityId, true, createdBy, expectedVersion); }
  disableCapability(versionId: string, capabilityId: string, createdBy?: string, expectedVersion?: number) { return this.setCapabilityEnabled(versionId, capabilityId, false, createdBy, expectedVersion); }
  async getVersionFeatures(versionId: string) { await this.requireVersion(versionId); return this.versionFeatureRepository.find({ where: { applicationVersionId: versionId }, relations: ['feature'], order: { createdAt: 'ASC' } }); }
  async getVersionCapabilities(versionId: string) { await this.requireVersion(versionId); return this.versionCapabilityRepository.find({ where: { applicationVersionId: versionId }, relations: ['capability'], order: { createdAt: 'ASC' } }); }

  async cloneConfiguration(sourceVersionId: string, targetVersionId: string, createdBy?: string) {
    await this.assertEditableVersion(targetVersionId); await this.requireVersion(sourceVersionId);
    const [features, capabilities] = await Promise.all([this.versionFeatureRepository.find({ where: { applicationVersionId: sourceVersionId } }), this.versionCapabilityRepository.find({ where: { applicationVersionId: sourceVersionId } })]);
    await this.dataSource.transaction(async manager => {
      await manager.getRepository(VersionFeature).delete({ applicationVersionId: targetVersionId });
      await manager.getRepository(VersionCapability).delete({ applicationVersionId: targetVersionId });
      if (features.length) await manager.getRepository(VersionFeature).save(features.map(({ id: _id, createdAt: _createdAt, updatedAt: _updatedAt, ...item }) => ({ ...item, applicationVersionId: targetVersionId, createdBy: createdBy ?? item.createdBy, version: 1 })));
      if (capabilities.length) await manager.getRepository(VersionCapability).save(capabilities.map(({ id: _id, createdAt: _createdAt, updatedAt: _updatedAt, ...item }) => ({ ...item, applicationVersionId: targetVersionId, createdBy: createdBy ?? item.createdBy, version: 1 })));
    });
    return { features: features.length, capabilities: capabilities.length };
  }

  async validateVersion(versionId: string) {
    const [versionFeatures, versionCapabilities, dependencies] = await Promise.all([this.getVersionFeatures(versionId), this.getVersionCapabilities(versionId), this.dependencyRepository.find({ relations: ['capability', 'dependencyCapability'] })]);
    const issues: ValidationIssue[] = [];
    const enabled = new Map(versionCapabilities.filter(item => item.enabled).map(item => [item.capabilityId, item.capability]));
    for (const feature of versionFeatures.filter(item => item.state !== VersionFeatureState.DISABLED)) {
      const mappings = await this.featureCapabilityRepository.find({ where: { featureId: feature.featureId }, relations: ['capability'] });
      for (const mapping of mappings.filter(item => item.required)) if (!enabled.has(mapping.capabilityId)) issues.push({ severity: 'ERROR', code: 'REQUIRED_CAPABILITY_DISABLED', message: `Required capability ${mapping.capability.code} is disabled.`, target: mapping.capability.code });
    }
    for (const dependency of dependencies) {
      if (!enabled.has(dependency.capabilityId)) continue;
      const target = dependency.dependencyCapability?.code ?? dependency.dependencyCapabilityId;
      if (dependency.dependencyType === DependencyType.REQUIRES && !enabled.has(dependency.dependencyCapabilityId)) issues.push({ severity: 'ERROR', code: 'DEPENDENCY_MISSING', message: `Required dependency ${target} is disabled.`, target: dependency.capability?.code, dependency: target });
      if (dependency.dependencyType === DependencyType.CONFLICTS_WITH && enabled.has(dependency.dependencyCapabilityId)) issues.push({ severity: 'ERROR', code: 'DEPENDENCY_CONFLICT', message: `Capability conflicts with ${target}.`, target: dependency.capability?.code, dependency: target });
    }
    const [requirements, models] = await Promise.all([this.requirementRepository.find(), this.dataModelRepository.find({ where: { versionId } })]);
    const modelIds = new Set(models.map(model => model.id));
    for (const requirement of requirements.filter(item => enabled.has(item.capabilityId))) if (!modelIds.has(requirement.dataEntityId)) issues.push({ severity: 'ERROR', code: 'REQUIRED_ENTITY_MISSING', message: `Required data entity ${requirement.dataEntityId} is missing.`, target: enabled.get(requirement.capabilityId)?.code, dependency: requirement.dataEntityId });
    for (const capability of enabled.values()) if (capability.status === CapabilityStatus.DEPRECATED || capability.status === CapabilityStatus.ARCHIVED) issues.push({ severity: 'WARNING', code: 'CAPABILITY_DEPRECATED', message: `Capability ${capability.code} is ${capability.status}.`, target: capability.code });
    const completeness = this.calculateCompleteness(issues, versionFeatures.length, enabled.size);
    return { valid: !issues.some(issue => issue.severity === 'ERROR'), completeness, errors: issues.filter(issue => issue.severity === 'ERROR').length, warnings: issues.filter(issue => issue.severity === 'WARNING').length, issues };
  }

  async getDisableImpact(versionId: string, capabilityId: string) {
    const enabled = await this.getVersionCapabilities(versionId);
    const enabledIds = new Set(enabled.filter(item => item.enabled).map(item => item.capabilityId));
    const dependencies = await this.dependencyRepository.find({ relations: ['capability'] });
    const queue = [capabilityId]; const impacted = new Set<string>();
    while (queue.length) { const current = queue.shift(); for (const dependent of dependencies.filter(item => item.dependencyType === DependencyType.REQUIRES && item.dependencyCapabilityId === current && enabledIds.has(item.capabilityId))) if (!impacted.has(dependent.capabilityId)) { impacted.add(dependent.capabilityId); queue.push(dependent.capabilityId); } }
    const featureMappings = await this.featureCapabilityRepository.find({ relations: ['feature'] });
    return { capabilityId, affectedCapabilities: enabled.filter(item => impacted.has(item.capabilityId)).map(item => item.capability.code), affectedFeatures: [...new Set(featureMappings.filter(item => impacted.has(item.capabilityId) || item.capabilityId === capabilityId).map(item => item.feature.code))], blocking: impacted.size > 0 };
  }

  async createSnapshot(versionId: string) {
    const version = await this.requireVersion(versionId);
    const [features, capabilities, dependencies, validation] = await Promise.all([this.getVersionFeatures(versionId), this.getVersionCapabilities(versionId), this.dependencyRepository.find({ relations: ['capability', 'dependencyCapability'] }), this.validateVersion(versionId)]);
    const payload = { schemaVersion: 1, applicationId: version.applicationId, applicationVersionId: versionId, features: features.map(item => ({ code: item.feature.code, state: item.state })).sort((a, b) => a.code.localeCompare(b.code)), capabilities: capabilities.filter(item => item.enabled).map(item => item.capability.code).sort(), dependencies: dependencies.map(item => ({ capability: item.capability?.code, dependency: item.dependencyCapability?.code, type: item.dependencyType })).sort((a, b) => JSON.stringify(a).localeCompare(JSON.stringify(b))), validationStatus: validation.valid ? 'VALID' : 'INVALID', completeness: validation.completeness };
    const snapshotHash = createHash('sha256').update(JSON.stringify(payload)).digest('hex');
    const snapshot = { ...payload, generatedAt: new Date().toISOString(), snapshotHash };
    await this.versionRepository.save({ ...version, snapshot });
    return snapshot;
  }
  async getSnapshot(versionId: string) { return (await this.requireVersion(versionId)).snapshot; }

  private async requireFeature(id: string) { const item = await this.featureRepository.findOne({ where: { id } }); if (!item) throw new NotFoundException('FEATURE_NOT_FOUND'); return item; }
  private async requireCapability(id: string) { const item = await this.capabilityRepository.findOne({ where: { id } }); if (!item) throw new NotFoundException('CAPABILITY_NOT_FOUND'); return item; }
  private async requireVersion(id: string) { const item = await this.versionRepository.findOne({ where: { id } }); if (!item) throw new NotFoundException('VERSION_NOT_FOUND'); return item; }
  private async assertEditableVersion(id: string) { const version = await this.requireVersion(id); if ([ApplicationVersionStatus.PUBLISHED, ApplicationVersionStatus.SUPERSEDED, ApplicationVersionStatus.ARCHIVED].includes(version.status)) throw new ConflictException('VERSION_NOT_EDITABLE'); return version; }
  private assertOptimisticLock(stored: number, expected?: number) { if (expected !== undefined && stored !== expected) throw new ConflictException('VERSION_CONFLICT'); }
  private assertNoCycle(edges: Array<{ capabilityId: string; dependencyCapabilityId: string }>) {
    const graph = new Map<string, string[]>(); edges.forEach(edge => graph.set(edge.capabilityId, [...(graph.get(edge.capabilityId) ?? []), edge.dependencyCapabilityId]));
    const visiting = new Set<string>(); const visited = new Set<string>();
    const visit = (node: string): boolean => { if (visiting.has(node)) return true; if (visited.has(node)) return false; visiting.add(node); const cyclic = (graph.get(node) ?? []).some(visit); visiting.delete(node); visited.add(node); return cyclic; };
    if ([...graph.keys()].some(visit)) throw new BadRequestException('DEPENDENCY_CYCLE');
  }
  private calculateCompleteness(issues: ValidationIssue[], enabledFeatures: number, enabledCapabilities: number) { if (!enabledFeatures && !enabledCapabilities) return 0; const penalties = issues.filter(i => i.severity === 'ERROR').length * 15 + issues.filter(i => i.severity === 'WARNING').length * 5; return Math.max(0, Math.min(100, 100 - penalties)); }
  private pagination(query: CatalogQuery, total: number) { const page = Number(query.page) || 1; const limit = Math.min(Number(query.limit) || 25, 100); return { page, limit, total, pages: Math.ceil(total / limit) }; }
}
