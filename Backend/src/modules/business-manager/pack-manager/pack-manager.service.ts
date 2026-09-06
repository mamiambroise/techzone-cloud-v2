import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { createHash } from 'node:crypto';
import { DataSource, Repository } from 'typeorm';
import { Pack, PackOutboxEvent, PackVersion } from '../entities';
import { PackChangeType, PackManifestStatus, PackSourceType, PackStatus, PackValidationStatus, PackVersionStatus } from '../../../common/enums';
import { CreatePackDto, CreatePackVersionDto, UpdatePackDto, UpdatePackVersionDto } from './dto/pack.dto';
import { CloneVersionDto, DuplicatePackDto, PackQueryDto, VersionQueryDto } from './dto/pack-query.dto';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class PackManagerService {
  private readonly packs: Repository<Pack>;
  private readonly versions: Repository<PackVersion>;

  constructor(@InjectDataSource() private readonly dataSource: DataSource, private readonly auditService: AuditService) {
    this.packs = dataSource.getRepository(Pack);
    this.versions = dataSource.getRepository(PackVersion);
  }

  async createPack(tenantId: string, actorId: string, dto: CreatePackDto): Promise<Pack> {
    const existing = await this.packs.findOne({ where: { tenantId, code: dto.code } });
    if (existing) throw new ConflictException('PACK_CODE_ALREADY_EXISTS');
    const pack = await this.packs.save(this.packs.create({ ...dto, tenantId, createdBy: actorId, sourceType: dto.sourceType ?? PackSourceType.CUSTOM, metadata: dto.metadata ?? {} }));
    await this.recordEvent(tenantId, actorId, 'pack.created', pack.id, pack);
    return pack;
  }

  async listPacks(tenantId: string, query: PackQueryDto = new PackQueryDto()) {
    const qb = this.packs.createQueryBuilder('pack').where('pack.tenantId = :tenantId', { tenantId });
    if (query.search) qb.andWhere('(pack.code ILIKE :search OR pack.name ILIKE :search OR pack.shortName ILIKE :search OR pack.description ILIKE :search OR pack.category ILIKE :search)', { search: `%${query.search}%` });
    if (query.status) qb.andWhere('pack.status = :status', { status: query.status });
    if (query.category) qb.andWhere('pack.category = :category', { category: query.category });
    if (query.sourceType) qb.andWhere('pack.sourceType = :sourceType', { sourceType: query.sourceType });
    if (query.archived === true) qb.andWhere('pack.archivedAt IS NOT NULL');
    if (query.archived === false) qb.andWhere('pack.archivedAt IS NULL');
    if (query.createdBy) qb.andWhere('pack.createdBy = :createdBy', { createdBy: query.createdBy });
    if (query.updatedFrom) qb.andWhere('pack.updatedAt >= :updatedFrom', { updatedFrom: new Date(query.updatedFrom) });
    if (query.updatedTo) qb.andWhere('pack.updatedAt <= :updatedTo', { updatedTo: new Date(query.updatedTo) });
    const allowedSort = `pack.${query.sort ?? 'updatedAt'}`;
    const [items, total] = await qb.orderBy(allowedSort, query.order ?? 'DESC').skip((query.page - 1) * query.limit).take(query.limit).getManyAndCount();
    return { items, pagination: { page: query.page, limit: query.limit, total, pages: Math.ceil(total / query.limit) } };
  }

  async getPack(tenantId: string, id: string): Promise<Pack> {
    const pack = await this.packs.findOne({ where: { id, tenantId }, relations: ['versions'] });
    if (!pack) throw new NotFoundException('PACK_NOT_FOUND');
    return pack;
  }

  async updatePack(tenantId: string, id: string, dto: UpdatePackDto, actorId: string): Promise<Pack> {
    const pack = await this.getPack(tenantId, id);
    this.assertVersion(pack.version, dto.expectedVersion);
    if (pack.status === PackStatus.ARCHIVED) throw new ConflictException('PACK_VERSION_IMMUTABLE');
    const before = { ...pack };
    Object.assign(pack, { ...dto, updatedBy: actorId, version: pack.version + 1 });
    delete (pack as Partial<Pack> & { expectedVersion?: string }).expectedVersion;
    const updated = await this.packs.save(pack);
    await this.recordEvent(tenantId, actorId, 'pack.updated', pack.id, updated, before);
    return updated;
  }

  async archivePack(tenantId: string, id: string, actorId: string): Promise<void> {
    const pack = await this.getPack(tenantId, id);
    if (pack.status === PackStatus.ARCHIVED) return;
    await this.packs.update({ id, tenantId, version: pack.version }, { status: PackStatus.ARCHIVED, archivedAt: new Date(), archivedBy: actorId, version: pack.version + 1 });
    await this.recordEvent(tenantId, actorId, 'pack.archived', id, { status: PackStatus.ARCHIVED });
  }

  async restorePack(tenantId: string, id: string, actorId: string): Promise<Pack> {
    const pack = await this.getPack(tenantId, id);
    if (pack.status !== PackStatus.ARCHIVED) throw new ConflictException('PACK_RESTORE_BLOCKED');
    await this.packs.update({ id, tenantId, version: pack.version }, { status: PackStatus.DRAFT, archivedAt: null as unknown as Date, archivedBy: null as unknown as string, updatedBy: actorId, version: pack.version + 1 });
    await this.recordEvent(tenantId, actorId, 'pack.restored', id, { status: PackStatus.DRAFT });
    return this.getPack(tenantId, id);
  }

  async duplicatePack(tenantId: string, id: string, actorId: string, dto: DuplicatePackDto): Promise<Pack> {
    const source = await this.getPack(tenantId, id);
    const existing = await this.packs.findOne({ where: { tenantId, code: dto.code } });
    if (existing) throw new ConflictException('PACK_CODE_ALREADY_EXISTS');
    const duplicate = await this.packs.save(this.packs.create({ tenantId, code: dto.code, name: dto.name, shortName: dto.shortName, description: source.description, category: source.category, iconKey: source.iconKey, logoRef: source.logoRef, sourceType: PackSourceType.CLONED, metadata: source.metadata, createdBy: actorId }));
    if (dto.cloneLatestVersion) {
      const latest = [...(source.versions ?? [])].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())[0];
      if (latest) {
        const clonedVersion = this.versions.create({ packId: duplicate.id, tenantId, versionNumber: latest.versionNumber, label: latest.label, description: latest.description, status: PackVersionStatus.DRAFT, validationStatus: PackValidationStatus.NOT_RUN, sourceVersionId: latest.id, modules: latest.modules, features: latest.features, capabilities: latest.capabilities, dependencies: latest.dependencies, activationRules: latest.activationRules, configuration: latest.configuration, createdBy: actorId, version: 1 });
        await this.versions.save(clonedVersion);
      }
    }
    await this.recordEvent(tenantId, actorId, 'pack.duplicated', duplicate.id, { sourcePackId: id, cloneLatestVersion: dto.cloneLatestVersion });
    return this.getPack(tenantId, duplicate.id);
  }

  async createVersion(tenantId: string, packId: string, actorId: string, dto: CreatePackVersionDto): Promise<PackVersion> {
    await this.getPack(tenantId, packId);
    const existing = await this.versions.findOne({ where: { tenantId, packId, versionNumber: dto.versionNumber } });
    if (existing) throw new ConflictException('PACK_VERSION_CONFLICT');
    return this.versions.save(this.versions.create({ ...dto, tenantId, packId, createdBy: actorId, status: PackVersionStatus.DRAFT, validationStatus: PackValidationStatus.NOT_RUN, manifestStatus: PackManifestStatus.NOT_GENERATED, modules: [], features: [], capabilities: [], dependencies: [], activationRules: [], configuration: {} }));
  }

  async listVersions(tenantId: string, packId: string, query?: VersionQueryDto): Promise<PackVersion[] | { items: PackVersion[]; pagination: { page: number; limit: number; total: number; pages: number } }> {
    await this.getPack(tenantId, packId);
    if (query) {
      const qb = this.versions.createQueryBuilder('version').where('version.tenantId = :tenantId AND version.packId = :packId', { tenantId, packId });
      if (query.status) qb.andWhere('version.status = :status', { status: query.status });
      if (query.validationStatus) qb.andWhere('version.validationStatus = :validationStatus', { validationStatus: query.validationStatus });
      if (query.manifestStatus) qb.andWhere('version.manifestStatus = :manifestStatus', { manifestStatus: query.manifestStatus });
      if (query.changeType) qb.andWhere('version.changeType = :changeType', { changeType: query.changeType });
      if (query.search) qb.andWhere('(version.versionNumber ILIKE :search OR version.label ILIKE :search)', { search: `%${query.search}%` });
      const [items, total] = await qb.orderBy('version.createdAt', 'DESC').skip((query.page - 1) * query.limit).take(query.limit).getManyAndCount();
      return { items, pagination: { page: query.page, limit: query.limit, total, pages: Math.ceil(total / query.limit) } };
    }
    return this.versions.find({ where: { tenantId, packId }, order: { createdAt: 'DESC' } });
  }

  async suggestVersion(tenantId: string, packId: string, changeType: PackChangeType): Promise<{ versionNumber: string; changeType: PackChangeType }> {
    const versions = await this.versions.find({ where: { tenantId, packId } });
    const latest = versions.map((version) => version.versionNumber.split('.').map(Number)).sort((left, right) => right[0] - left[0] || right[1] - left[1] || right[2] - left[2])[0] ?? [0, 0, 0];
    if (changeType === PackChangeType.MAJOR) { latest[0] += 1; latest[1] = 0; latest[2] = 0; }
    if (changeType === PackChangeType.MINOR) { latest[1] += 1; latest[2] = 0; }
    if (changeType === PackChangeType.PATCH) latest[2] += 1;
    return { versionNumber: latest.join('.'), changeType };
  }

  async cloneVersion(tenantId: string, id: string, actorId: string, dto: CloneVersionDto): Promise<PackVersion> {
    const source = await this.getVersion(tenantId, id);
    const exists = await this.versions.findOne({ where: { tenantId, packId: source.packId, versionNumber: dto.versionNumber } });
    if (exists) throw new ConflictException('PACK_VERSION_ALREADY_EXISTS');
    const clone = this.versions.create({ tenantId, packId: source.packId, versionNumber: dto.versionNumber, label: dto.label ?? source.label, description: source.description, changeType: dto.changeType as PackChangeType, releaseNotes: dto.releaseNotes ?? source.releaseNotes, status: PackVersionStatus.DRAFT, validationStatus: PackValidationStatus.NOT_RUN, manifestStatus: PackManifestStatus.NOT_GENERATED, sourceVersionId: source.id, modules: source.modules, features: source.features, capabilities: source.capabilities, dependencies: source.dependencies, activationRules: source.activationRules, configuration: source.configuration, createdBy: actorId, version: 1 });
    const saved = await this.versions.save(clone);
    await this.recordVersionEvent(tenantId, actorId, 'pack.version.cloned', saved.id, { sourceVersionId: id });
    return this.getVersion(tenantId, saved.id);
  }

  async compareVersions(tenantId: string, leftId: string, rightId: string) {
    const [left, right] = await Promise.all([this.getVersion(tenantId, leftId), this.getVersion(tenantId, rightId)]);
    if (left.packId !== right.packId) throw new ConflictException('PACK_VERSION_INVALID_STATE');
    const sections = ['modules', 'features', 'capabilities', 'dependencies', 'activationRules', 'configuration'] as const;
    return { left: { id: left.id, version: left.versionNumber }, right: { id: right.id, version: right.versionNumber }, changes: Object.fromEntries(sections.map((section) => { const leftValue = JSON.stringify(left[section]); const rightValue = JSON.stringify(right[section]); return [section, { status: leftValue === rightValue ? 'UNCHANGED' : 'CHANGED', left: left[section], right: right[section] }]; })), breakingChange: sections.some((section) => Array.isArray(left[section]) && Array.isArray(right[section]) && left[section].length > right[section].length) ? 'POTENTIAL' : 'NONE' };
  }

  async getVersion(tenantId: string, id: string): Promise<PackVersion> {
    const version = await this.versions.findOne({ where: { id, tenantId }, relations: ['pack'] });
    if (!version) throw new NotFoundException('PACK_VERSION_NOT_FOUND');
    return version;
  }

  async getVersionByPackCode(tenantId: string, packCode: string, versionNumber: string): Promise<PackVersion> {
    const version = await this.versions.findOne({ where: { tenantId, versionNumber, pack: { code: packCode, tenantId } }, relations: ['pack'] });
    if (!version) throw new NotFoundException('PACK_VERSION_NOT_FOUND');
    return version;
  }

  async getVersionByManifestHash(tenantId: string, manifestHash: string): Promise<PackVersion> {
    const version = await this.versions.findOne({ where: { tenantId, manifestHash }, relations: ['pack'] });
    if (!version) throw new NotFoundException('PACK_VERSION_NOT_FOUND');
    return version;
  }

  async updateVersion(tenantId: string, id: string, dto: UpdatePackVersionDto): Promise<PackVersion> {
    const version = await this.getVersion(tenantId, id);
    this.assertVersion(version.version, dto.expectedVersion);
    this.assertDraft(version);
    const { expectedVersion: _expectedVersion, ...content } = dto;
    Object.assign(version, content, { validationStatus: PackValidationStatus.OUTDATED, version: version.version + 1 });
    version.manifestStatus = PackManifestStatus.OUTDATED;
    version.snapshot = undefined;
    version.snapshotHash = undefined;
    version.manifest = undefined;
    version.manifestHash = undefined;
    return this.versions.save(version);
  }

  async validateVersion(tenantId: string, id: string): Promise<PackVersion> {
    const version = await this.getVersion(tenantId, id);
    this.assertDraft(version);
    const errors: string[] = [];
    if (!/^\d+\.\d+\.\d+$/.test(version.versionNumber)) errors.push('VERSION_NUMBER_INVALID');
    if (!version.modules.length) errors.push('PACK_MODULE_MISSING');
    const ruleText = JSON.stringify(version.activationRules);
    if (/[;]|\beval\b|Function\s*\(/i.test(ruleText)) errors.push('PACK_RULE_UNSAFE');
    version.validationDetails = { errors, checkedAt: new Date().toISOString() };
    version.validationStatus = errors.length ? PackValidationStatus.INVALID : PackValidationStatus.VALID;
    version.status = errors.length ? PackVersionStatus.INVALID : PackVersionStatus.READY;
    version.manifestStatus = PackManifestStatus.NOT_GENERATED;
    version.validatedAt = new Date();
    return this.versions.save(version);
  }

  async manifest(tenantId: string, id: string): Promise<Record<string, unknown>> {
    const version = await this.getVersion(tenantId, id);
    if (!version.manifest || version.manifestStatus !== PackManifestStatus.VALID) throw new ConflictException('PACK_VERSION_MANIFEST_INVALID');
    return version.manifest;
  }

  async generateManifest(tenantId: string, id: string, actorId: string): Promise<Record<string, unknown>> {
    const version = await this.getVersion(tenantId, id);
    if (version.validationStatus !== PackValidationStatus.VALID) throw new ConflictException('PACK_VERSION_VALIDATION_OUTDATED');
    const snapshot = { packId: version.packId, versionNumber: version.versionNumber, modules: version.modules, features: version.features, capabilities: version.capabilities, dependencies: version.dependencies, activationRules: version.activationRules, configuration: version.configuration };
    const snapshotHash = this.hash(snapshot);
    const manifest = this.buildManifest(version);
    version.snapshot = snapshot;
    version.snapshotHash = snapshotHash;
    version.manifest = manifest;
    version.manifestHash = String(manifest.hash);
    version.manifestStatus = PackManifestStatus.VALID;
    const saved = await this.versions.save(version);
    await this.recordVersionEvent(tenantId, actorId, 'pack.version.manifest_generated', saved.id, { snapshotHash, manifestHash: saved.manifestHash });
    return saved.manifest as Record<string, unknown>;
  }

  async deprecateVersion(tenantId: string, id: string, actorId: string): Promise<PackVersion> { const version = await this.getVersion(tenantId, id); if (version.status !== PackVersionStatus.PUBLISHED && version.status !== PackVersionStatus.SUPERSEDED) throw new ConflictException('PACK_VERSION_INVALID_STATE'); version.status = PackVersionStatus.DEPRECATED; version.deprecatedAt = new Date(); const saved = await this.versions.save(version); await this.recordVersionEvent(tenantId, actorId, 'pack.version.deprecated', id, { status: saved.status }); return saved; }
  async archiveVersion(tenantId: string, id: string, actorId: string): Promise<PackVersion> { const version = await this.getVersion(tenantId, id); if (![PackVersionStatus.SUPERSEDED, PackVersionStatus.DEPRECATED].includes(version.status)) throw new ConflictException('PACK_VERSION_ARCHIVE_BLOCKED'); version.status = PackVersionStatus.ARCHIVED; version.archivedAt = new Date(); const saved = await this.versions.save(version); await this.recordVersionEvent(tenantId, actorId, 'pack.version.archived', id, { status: saved.status }); return saved; }

  async publish(tenantId: string, id: string, actorId: string): Promise<PackVersion> {
    return this.dataSource.transaction(async (manager) => {
      const repository = manager.getRepository(PackVersion);
      const version = await repository.findOne({ where: { id, tenantId }, relations: ['pack'] });
      if (!version) throw new NotFoundException('PACK_VERSION_NOT_FOUND');
      if (version.status === PackVersionStatus.PUBLISHED) return version;
      if (version.validationStatus !== PackValidationStatus.VALID || version.manifestStatus !== PackManifestStatus.VALID || !version.snapshotHash || !version.manifestHash) throw new ConflictException('PACK_VERSION_PUBLICATION_BLOCKED');
      version.status = PackVersionStatus.PUBLISHED;
      version.publishedAt = new Date();
      version.publishedBy = actorId;
      const result = await repository.createQueryBuilder().update(PackVersion).set({ snapshotHash: version.snapshotHash, status: version.status, publishedAt: version.publishedAt, publishedBy: actorId, version: version.version + 1 }).where('id = :id AND tenantId = :tenantId AND version = :version', { id, tenantId, version: version.version }).execute();
      if (!result.affected) throw new ConflictException('PACK_VERSION_CONFLICT');
      await manager.getRepository(Pack).update({ id: version.packId, tenantId }, { status: PackStatus.ACTIVE });
      return repository.findOneOrFail({ where: { id, tenantId } });
    });
  }

  private buildManifest(version: PackVersion): Record<string, unknown> {
    const manifest = { contract: 'techzone.pack-manifest', contractVersion: '1.0', pack: { id: version.pack.code, code: version.pack.code, name: version.pack.name, version: version.versionNumber }, modules: version.modules, features: version.features, capabilities: version.capabilities, dependencies: version.dependencies, activationRules: version.activationRules, configuration: version.configuration, revision: version.version };
    return { ...manifest, hash: `sha256:${this.hash(manifest)}` };
  }

  private hash(value: unknown): string { return createHash('sha256').update(JSON.stringify(this.canonicalize(value))).digest('hex'); }
  private canonicalize(value: unknown): unknown {
    if (Array.isArray(value)) return value.map((item) => this.canonicalize(item));
    if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).sort(([left], [right]) => left.localeCompare(right)).map(([key, item]) => [key, this.canonicalize(item)]));
    return value;
  }
  private assertDraft(version: PackVersion): void { if (version.status === PackVersionStatus.PUBLISHED) throw new ConflictException('PACK_VERSION_IMMUTABLE'); }
  private assertVersion(actual: number, expected?: string): void { if (expected !== undefined && Number(expected) !== actual) throw new ConflictException('PACK_VERSION_CONFLICT'); }
  private async recordEvent(tenantId: string, actorId: string, eventType: string, packId: string, after: unknown, before?: unknown): Promise<void> {
    await this.auditService.log({ actorId, eventType, action: eventType.split('.').pop()?.toUpperCase() ?? 'UPDATE', targetType: 'Pack', targetId: packId, before, after, metadata: { tenantId } });
    await this.dataSource.getRepository(PackOutboxEvent).save({ tenantId, eventType, aggregateType: 'Pack', aggregateId: packId, payload: { packId } });
  }
  private async recordVersionEvent(tenantId: string, actorId: string, eventType: string, versionId: string, after: unknown): Promise<void> { await this.auditService.log({ actorId, eventType, action: eventType.split('.').pop()?.toUpperCase() ?? 'UPDATE', targetType: 'PackVersion', targetId: versionId, after, metadata: { tenantId } }); await this.dataSource.getRepository(PackOutboxEvent).save({ tenantId, eventType, aggregateType: 'PackVersion', aggregateId: versionId, payload: { versionId } }); }
}
