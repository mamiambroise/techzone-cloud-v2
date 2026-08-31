import { Injectable, BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Feature } from '../entities/feature.entity';
import { Capability } from '../entities/capability.entity';
import { FeatureCapability } from '../entities/feature-capability.entity';
import { VersionFeature } from '../entities/version-feature.entity';
import { VersionCapability } from '../entities/version-capability.entity';
import { CapabilityDependency } from '../entities/capability-dependency.entity';
import { CapabilityEntityRequirement } from '../entities/capability-entity-requirement.entity';
import { CapabilityStatus, FeatureStatus, VersionFeatureState, DependencyType } from '../../../common/enums';

export interface ValidationIssue {
  severity: 'ERROR' | 'WARNING' | 'INFO';
  code: string;
  message: string;
  target?: string;
  dependency?: string;
}

@Injectable()
export class FeatureCapabilityService {
  private readonly featureRepository: Repository<Feature>;
  private readonly capabilityRepository: Repository<Capability>;
  private readonly featureCapabilityRepository: Repository<FeatureCapability>;
  private readonly versionFeatureRepository: Repository<VersionFeature>;
  private readonly versionCapabilityRepository: Repository<VersionCapability>;
  private readonly capabilityDependencyRepository: Repository<CapabilityDependency>;
  private readonly capabilityRequirementRepository: Repository<CapabilityEntityRequirement>;

  constructor(
    @InjectDataSource() private readonly dataSource: DataSource,
  ) {
    this.featureRepository = this.dataSource?.getRepository(Feature);
    this.capabilityRepository = this.dataSource?.getRepository(Capability);
    this.featureCapabilityRepository = this.dataSource?.getRepository(FeatureCapability);
    this.versionFeatureRepository = this.dataSource?.getRepository(VersionFeature);
    this.versionCapabilityRepository = this.dataSource?.getRepository(VersionCapability);
    this.capabilityDependencyRepository = this.dataSource?.getRepository(CapabilityDependency);
    this.capabilityRequirementRepository = this.dataSource?.getRepository(CapabilityEntityRequirement);
  }

  async createFeature(data: Partial<Feature>): Promise<Feature> {
    if (!data.code || !String(data.code).trim()) {
      throw new BadRequestException('Feature code is required');
    }

    const existing = await this.featureRepository.findOne({ where: { code: data.code } });
    if (existing) {
      throw new ConflictException(`Feature code already exists: ${data.code}`);
    }

    const feature = this.featureRepository.create({
      ...data,
      status: data.status ?? FeatureStatus.DRAFT,
      version: 1,
    });

    return this.featureRepository.save(feature);
  }

  async createCapability(data: Partial<Capability>): Promise<Capability> {
    if (!data.code || !String(data.code).trim()) {
      throw new BadRequestException('Capability code is required');
    }

    const existing = await this.capabilityRepository.findOne({ where: { code: data.code } });
    if (existing) {
      throw new ConflictException(`Capability code already exists: ${data.code}`);
    }

    const capability = this.capabilityRepository.create({
      ...data,
      status: data.status ?? CapabilityStatus.DRAFT,
      version: 1,
    });

    return this.capabilityRepository.save(capability);
  }

  async attachCapability(featureId: string, capabilityId: string, required = false): Promise<FeatureCapability> {
    const feature = await this.featureRepository.findOne({ where: { id: featureId } });
    const capability = await this.capabilityRepository.findOne({ where: { id: capabilityId } });

    if (!feature) throw new NotFoundException(`Feature not found: ${featureId}`);
    if (!capability) throw new NotFoundException(`Capability not found: ${capabilityId}`);

    const existing = await this.featureCapabilityRepository.findOne({ where: { featureId, capabilityId } });
    if (existing) {
      throw new ConflictException('FEATURE_CAPABILITY_EXISTS');
    }

    const relation = this.featureCapabilityRepository.create({ featureId, capabilityId, required });
    return this.featureCapabilityRepository.save(relation);
  }

  async detachCapability(featureId: string, capabilityId: string): Promise<void> {
    await this.featureCapabilityRepository.delete({ featureId, capabilityId });
  }

  async enableFeature(applicationVersionId: string, featureId: string, createdBy?: string): Promise<VersionFeature> {
    const existing = await this.versionFeatureRepository.findOne({ where: { applicationVersionId, featureId } });
    if (existing) {
      existing.state = VersionFeatureState.ENABLED;
      existing.createdBy = createdBy ?? existing.createdBy;
      return this.versionFeatureRepository.save(existing);
    }

    const item = this.versionFeatureRepository.create({
      applicationVersionId,
      featureId,
      state: VersionFeatureState.ENABLED,
      createdBy,
    });

    return this.versionFeatureRepository.save(item);
  }

  async enableCapability(applicationVersionId: string, capabilityId: string, createdBy?: string): Promise<VersionCapability> {
    const existing = await this.versionCapabilityRepository.findOne({ where: { applicationVersionId, capabilityId } });
    if (existing) {
      existing.enabled = true;
      existing.createdBy = createdBy ?? existing.createdBy;
      return this.versionCapabilityRepository.save(existing);
    }

    const item = this.versionCapabilityRepository.create({
      applicationVersionId,
      capabilityId,
      enabled: true,
      createdBy,
    });

    return this.versionCapabilityRepository.save(item);
  }

  async addDependency(capabilityId: string, dependencyCapabilityId: string, dependencyType: DependencyType = DependencyType.REQUIRES, createdBy?: string): Promise<CapabilityDependency> {
    if (capabilityId === dependencyCapabilityId) {
      throw new BadRequestException('DEPENDENCY_SELF_REFERENCE');
    }

    const capability = await this.capabilityRepository.findOne({ where: { id: capabilityId } });
    const dependency = await this.capabilityRepository.findOne({ where: { id: dependencyCapabilityId } });

    if (!capability) throw new NotFoundException(`Capability not found: ${capabilityId}`);
    if (!dependency) throw new NotFoundException(`Dependency capability not found: ${dependencyCapabilityId}`);

    const existing = await this.capabilityDependencyRepository.findOne({
      where: { capabilityId, dependencyCapabilityId, dependencyType },
    });
    if (existing) {
      throw new ConflictException('DEPENDENCY_EXISTS');
    }

    const record = this.capabilityDependencyRepository.create({
      capabilityId,
      dependencyCapabilityId,
      dependencyType,
      createdBy,
    });

    return this.capabilityDependencyRepository.save(record);
  }

  detectDependencyCycle(edges: Array<{ capabilityId: string; dependencyCapabilityId: string }>): void {
    const graph = new Map<string, string[]>();
    for (const edge of edges) {
      const from = edge.capabilityId;
      const to = edge.dependencyCapabilityId;
      graph.set(from, [...(graph.get(from) ?? []), to]);
    }

    const visited = new Set<string>();
    const stack = new Set<string>();

    const dfs = (node: string): boolean => {
      if (stack.has(node)) return true;
      if (visited.has(node)) return false;
      visited.add(node);
      stack.add(node);

      for (const next of graph.get(node) ?? []) {
        if (dfs(next)) return true;
      }

      stack.delete(node);
      return false;
    };

    if (dfs(edges[0]?.capabilityId ?? '')) {
      throw new BadRequestException('DEPENDENCY_CYCLE');
    }
  }

  validateRequiredCapabilities(list: Array<{ capabilityId: string; enabled: boolean; required: boolean }>): { valid: boolean; issues: ValidationIssue[] } {
    const issues: ValidationIssue[] = [];

    for (const item of list) {
      if (item.required && !item.enabled) {
        issues.push({
          severity: 'ERROR',
          code: 'REQUIRED_CAPABILITY_DISABLED',
          message: 'Required capability is disabled',
          target: item.capabilityId,
        });
      }
    }

    return { valid: issues.length === 0, issues };
  }

  async validateVersion(applicationVersionId: string): Promise<{ valid: boolean; completeness: number; issues: ValidationIssue[] }> {
    const versionCapabilities = await this.versionCapabilityRepository.find({ where: { applicationVersionId } });
    const requiredList = versionCapabilities.map((item) => ({
      capabilityId: item.capabilityId,
      enabled: item.enabled,
      required: item.enabled && item.version > 0,
    }));

    const check = this.validateRequiredCapabilities(requiredList);
    const issues = check.issues;

    return {
      valid: issues.length === 0,
      completeness: issues.length === 0 ? 100 : 90,
      issues,
    };
  }

  async addEntityRequirement(capabilityId: string, dataEntityId: string, requirementType?: string): Promise<CapabilityEntityRequirement> {
    const capability = await this.capabilityRepository.findOne({ where: { id: capabilityId } });
    if (!capability) {
      throw new NotFoundException(`Capability not found: ${capabilityId}`);
    }

    const existing = await this.capabilityRequirementRepository.findOne({ where: { capabilityId, dataEntityId } });
    if (existing) {
      throw new ConflictException('REQUIRED_ENTITY_MISSING');
    }

    const record = this.capabilityRequirementRepository.create({ capabilityId, dataEntityId, requirementType });
    return this.capabilityRequirementRepository.save(record);
  }

  /**
   * Detect conflicting capabilities in the same version
   * Capabilities with conflicting metadata or breaking change flags conflict
   */
  async detectConflicts(applicationVersionId: string): Promise<ValidationIssue[]> {
    const versionCapabilities = await this.versionCapabilityRepository.find({
      where: { applicationVersionId },
      relations: ['capability'],
    });

    const issues: ValidationIssue[] = [];
    const enabledCaps = versionCapabilities.filter(vc => vc.enabled).map(vc => vc.capability);

    for (let i = 0; i < enabledCaps.length; i++) {
      for (let j = i + 1; j < enabledCaps.length; j++) {
        const cap1 = enabledCaps[i];
        const cap2 = enabledCaps[j];

        // Check if capabilities have conflicting metadata
        const metadata1 = cap1.metadata || {};
        const metadata2 = cap2.metadata || {};

        if (metadata1.conflictsWith && metadata1.conflictsWith.includes(cap2.code)) {
          issues.push({
            severity: 'ERROR',
            code: 'CAPABILITY_CONFLICT',
            message: `Capability ${cap1.code} conflicts with ${cap2.code}`,
            target: cap1.code,
            dependency: cap2.code,
          });
        }
      }
    }

    return issues;
  }

  /**
   * Validate breaking change compatibility
   * Check if breaking changes are allowed in this version lifecycle
   */
  async validateBreakingChanges(applicationVersionId: string, applicationId: string): Promise<ValidationIssue[]> {
    const versionCapabilities = await this.versionCapabilityRepository.find({
      where: { applicationVersionId },
      relations: ['capability'],
    });

    const issues: ValidationIssue[] = [];

    // Get previous version to compare
    const currentVersion = await this.dataSource
      .createQueryBuilder()
      .select('av')
      .from('ApplicationVersion', 'av')
      .where('av.id = :versionId', { versionId: applicationVersionId })
      .getOne();

    if (!currentVersion) {
      return issues;
    }

    for (const vc of versionCapabilities) {
      const cap = vc.capability;
      if (!cap || !vc.enabled) continue;

      // Check if capability has breaking change flag
      const hasBreakingChange = cap.metadata?.breakingChange === true;
      if (hasBreakingChange) {
        // Breaking changes are only allowed in MAJOR version increments
        const isMinorOrPatch = !currentVersion.versionNumber?.includes('MAJOR');
        if (isMinorOrPatch) {
          issues.push({
            severity: 'ERROR',
            code: 'BREAKING_CHANGE_DISALLOWED',
            message: `Capability ${cap.code} has breaking changes not allowed in minor/patch release`,
            target: cap.code,
          });
        }
      }
    }

    return issues;
  }

  /**
   * Check if all required data entities are covered by at least one enabled capability
   */
  async checkCompleteness(applicationVersionId: string): Promise<{ complete: boolean; coverage: number; uncovered: string[]; issues: ValidationIssue[] }> {
    // Get all required data entity IDs
    const allRequirements = await this.capabilityRequirementRepository.find();
    const requiredEntityIds = new Set(allRequirements.map(r => r.dataEntityId));

    if (requiredEntityIds.size === 0) {
      return { complete: true, coverage: 100, uncovered: [], issues: [] };
    }

    // Get entities covered by enabled capabilities
    const versionCapabilities = await this.versionCapabilityRepository.find({
      where: { applicationVersionId, enabled: true },
    });

    const coveredEntityIds = new Set<string>();
    for (const vc of versionCapabilities) {
      const requirements = await this.capabilityRequirementRepository.find({
        where: { capabilityId: vc.capabilityId },
      });
      requirements.forEach(r => coveredEntityIds.add(r.dataEntityId));
    }

    const uncovered = Array.from(requiredEntityIds).filter(id => !coveredEntityIds.has(id));
    const coverage = Math.round((coveredEntityIds.size / requiredEntityIds.size) * 100);
    const complete = uncovered.length === 0;

    const issues: ValidationIssue[] = uncovered.map(entityId => ({
      severity: 'ERROR',
      code: 'ENTITY_NOT_COVERED',
      message: `Required data entity not covered by enabled capabilities: ${entityId}`,
      target: entityId,
    }));

    return { complete, coverage, uncovered, issues };
  }

  /**
   * Comprehensive validation: cycle + required + conflicts + breaking changes + completeness
   */
  async validateFeatureSet(applicationVersionId: string, applicationId: string): Promise<{
    valid: boolean;
    completeness: number;
    issues: ValidationIssue[];
  }> {
    const allIssues: ValidationIssue[] = [];

    // 1. Cycle detection
    const dependencies = await this.capabilityDependencyRepository.find();
    try {
      this.detectDependencyCycle(dependencies.map(d => ({ capabilityId: d.capabilityId, dependencyCapabilityId: d.dependencyCapabilityId })));
    } catch (e) {
      allIssues.push({
        severity: 'ERROR',
        code: 'DEPENDENCY_CYCLE',
        message: 'Dependency cycle detected',
      });
    }

    // 2. Required capabilities validation
    const versionCapabilities = await this.versionCapabilityRepository.find({
      where: { applicationVersionId },
      relations: ['capability'],
    });

    const requiredList = versionCapabilities.map(vc => ({
      capabilityId: vc.capabilityId,
      enabled: vc.enabled,
      required: vc.capability?.metadata?.required === true,
    }));

    const requiredCheck = this.validateRequiredCapabilities(requiredList);
    allIssues.push(...requiredCheck.issues);

    // 3. Conflict detection
    const conflictIssues = await this.detectConflicts(applicationVersionId);
    allIssues.push(...conflictIssues);

    // 4. Breaking change validation
    const breakingChangeIssues = await this.validateBreakingChanges(applicationVersionId, applicationId);
    allIssues.push(...breakingChangeIssues);

    // 5. Completeness check
    const completenessResult = await this.checkCompleteness(applicationVersionId);
    allIssues.push(...completenessResult.issues);

    return {
      valid: allIssues.filter(i => i.severity === 'ERROR').length === 0,
      completeness: completenessResult.coverage,
      issues: allIssues,
    };
  }

  /**
   * Get impact analysis: affected downstream versions and dependencies
   */
  async getImpactAnalysis(featureId: string): Promise<{
    directDependents: string[];
    transitiveDependents: string[];
    affectedVersions: string[];
    riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  }> {
    // Get capabilities attached to this feature
    const featureCapabilities = await this.featureCapabilityRepository.find({ where: { featureId } });
    const capabilityIds = featureCapabilities.map(fc => fc.capabilityId);

    // Find capabilities that depend on these
    const dependents = await this.capabilityDependencyRepository.find({
      where: capabilityIds.map(cid => ({ dependencyCapabilityId: cid })),
    });

    const directDependents = dependents.map(d => d.capabilityId);

    // Transitive closure
    const transitiveDependents = new Set(directDependents);
    const queue = [...directDependents];

    while (queue.length > 0) {
      const current = queue.shift();
      const nextLevel = await this.capabilityDependencyRepository.find({
        where: { dependencyCapabilityId: current },
      });

      for (const dep of nextLevel) {
        if (!transitiveDependents.has(dep.capabilityId)) {
          transitiveDependents.add(dep.capabilityId);
          queue.push(dep.capabilityId);
        }
      }
    }

    // Find affected versions
    const affectedVersions = await this.versionCapabilityRepository.find({
      where: capabilityIds.map(cid => ({ capabilityId: cid, enabled: true })),
    });

    const affectedVersionIds = [...new Set(affectedVersions.map(av => av.applicationVersionId))];

    // Risk level based on transitive impact
    let riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' = 'LOW';
    if (transitiveDependents.size > 5) riskLevel = 'HIGH';
    else if (transitiveDependents.size > 2) riskLevel = 'MEDIUM';

    return {
      directDependents,
      transitiveDependents: Array.from(transitiveDependents),
      affectedVersions: affectedVersionIds,
      riskLevel,
    };
  }

  /**
   * Create a feature/capability snapshot for a version
   */
  async createSnapshot(applicationVersionId: string, createdBy?: string): Promise<{
    snapshotId: string;
    timestamp: Date;
    featureCount: number;
    capabilityCount: number;
    validationState: { valid: boolean; completeness: number };
  }> {
    const versionFeatures = await this.versionFeatureRepository.find({ where: { applicationVersionId } });
    const versionCapabilities = await this.versionCapabilityRepository.find({ where: { applicationVersionId } });

    // Store snapshot metadata in version
    const snapshot = {
      snapshotId: `SNAPSHOT-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      featureCount: versionFeatures.length,
      capabilityCount: versionCapabilities.length,
      createdBy,
    };

    // In a full implementation, this would be persisted to a snapshot table
    // For now, we return the snapshot metadata
    const validationState = await this.validateFeatureSet(applicationVersionId, '');

    return {
      ...snapshot,
      validationState: {
        valid: validationState.valid,
        completeness: validationState.completeness,
      },
    };
  }
}
