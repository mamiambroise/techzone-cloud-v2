import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { PackModule, PackOutboxEvent, PackVersion } from '../../entities';
import { PackManifestStatus, PackModuleStatus, PackValidationStatus, PackVersionStatus } from '../../../../common/enums';
import { AuditService } from '../../audit/audit.service';
import { CreateModuleDto, DuplicateModuleDto, ModuleQueryDto, ReorderModulesDto, UpdateModuleDto } from './dto/module.dto';

@Injectable()
export class ModulesService {
  private readonly modules: Repository<PackModule>;
  private readonly versions: Repository<PackVersion>;
  constructor(@InjectDataSource() private readonly dataSource: DataSource, private readonly audit: AuditService) { this.modules = dataSource.getRepository(PackModule); this.versions = dataSource.getRepository(PackVersion); }

  async list(tenantId: string, versionId: string, query: ModuleQueryDto = new ModuleQueryDto()): Promise<PackModule[]> {
    await this.version(tenantId, versionId);
    const qb = this.modules.createQueryBuilder('module').where('module.tenantId = :tenantId AND module.packVersionId = :versionId', { tenantId, versionId });
    if (query.search) qb.andWhere('(module.code ILIKE :search OR module.name ILIKE :search OR module.shortName ILIKE :search OR module.description ILIKE :search)', { search: `%${query.search}%` });
    if (query.moduleType) qb.andWhere('module.moduleType = :moduleType', { moduleType: query.moduleType });
    if (query.status) qb.andWhere('module.status = :status', { status: query.status });
    if (query.enabled !== undefined) qb.andWhere('module.enabled = :enabled', { enabled: query.enabled });
    return qb.orderBy('module.displayOrder', 'ASC').addOrderBy('module.createdAt', 'ASC').getMany();
  }

  async get(tenantId: string, id: string): Promise<PackModule> { const module = await this.modules.findOne({ where: { id, tenantId } }); if (!module) throw new NotFoundException('PACK_MODULE_NOT_FOUND'); return module; }

  async create(tenantId: string, versionId: string, actorId: string, dto: CreateModuleDto): Promise<PackModule> {
    const version = await this.mutableVersion(tenantId, versionId);
    const existing = await this.modules.findOne({ where: { tenantId, packVersionId: versionId, code: dto.code } });
    if (existing) throw new ConflictException('PACK_MODULE_CODE_ALREADY_EXISTS');
    const last = await this.modules.createQueryBuilder('module').where({ tenantId, packVersionId: versionId }).orderBy('module.displayOrder', 'DESC').getOne();
    const module = await this.modules.save(this.modules.create({ ...dto, tenantId, packVersionId: versionId, createdBy: actorId, displayOrder: dto.displayOrder ?? (last?.displayOrder ?? 0) + 10, configuration: dto.configuration ?? {}, metadata: dto.metadata ?? {}, status: PackModuleStatus.DRAFT }));
    await this.invalidate(version, tenantId, actorId, 'pack.module.created', module.id);
    return module;
  }

  async update(tenantId: string, id: string, actorId: string, dto: UpdateModuleDto): Promise<PackModule> {
    const module = await this.get(tenantId, id); const version = await this.mutableVersion(tenantId, module.packVersionId);
    if (dto.expectedVersion !== undefined && Number(dto.expectedVersion) !== module.version) throw new ConflictException('PACK_MODULE_CONFLICT');
    this.assertSafeConfig(dto.configuration);
    const { expectedVersion: _expectedVersion, ...content } = dto;
    Object.assign(module, content, { updatedBy: actorId, version: module.version + 1 });
    const saved = await this.modules.save(module); await this.invalidate(version, tenantId, actorId, 'pack.module.updated', id); return saved;
  }

  async reorder(tenantId: string, versionId: string, actorId: string, dto: ReorderModulesDto): Promise<PackModule[]> {
    const version = await this.mutableVersion(tenantId, versionId);
    const ids = dto.items.map((item) => item.moduleId);
    const modules = await this.modules.find({ where: { tenantId, packVersionId: versionId } });
    if (ids.length !== modules.length || modules.some((module) => !ids.includes(module.id)) || new Set(ids).size !== ids.length) throw new ConflictException('PACK_MODULE_INVALID_STATE');
    await this.dataSource.transaction(async (manager) => { for (const item of dto.items) await manager.getRepository(PackModule).update({ id: item.moduleId, tenantId, packVersionId: versionId }, { displayOrder: item.displayOrder, version: modules.find((module) => module.id === item.moduleId)!.version + 1, updatedBy: actorId }); });
    await this.invalidate(version, tenantId, actorId, 'pack.module.reordered', versionId); return this.list(tenantId, versionId);
  }

  async duplicate(tenantId: string, id: string, actorId: string, dto: DuplicateModuleDto): Promise<PackModule> { const source = await this.get(tenantId, id); const version = await this.mutableVersion(tenantId, source.packVersionId); const exists = await this.modules.findOne({ where: { tenantId, packVersionId: source.packVersionId, code: dto.code } }); if (exists) throw new ConflictException('PACK_MODULE_CODE_ALREADY_EXISTS'); const clone = await this.modules.save(this.modules.create({ tenantId, packVersionId: source.packVersionId, code: dto.code, name: dto.name, shortName: source.shortName, description: source.description, moduleType: source.moduleType, status: PackModuleStatus.DRAFT, enabled: source.enabled, displayOrder: source.displayOrder + 1, iconKey: source.iconKey, configuration: source.configuration, metadata: source.metadata, createdBy: actorId })); await this.invalidate(version, tenantId, actorId, 'pack.module.duplicated', clone.id); return clone; }
  async setEnabled(tenantId: string, id: string, actorId: string, enabled: boolean): Promise<PackModule> { const module = await this.get(tenantId, id); const version = await this.mutableVersion(tenantId, module.packVersionId); module.enabled = enabled; module.status = enabled ? PackModuleStatus.ACTIVE : PackModuleStatus.DISABLED; module.updatedBy = actorId; module.version += 1; const saved = await this.modules.save(module); await this.invalidate(version, tenantId, actorId, enabled ? 'pack.module.enabled' : 'pack.module.disabled', id); return saved; }
  async archive(tenantId: string, id: string, actorId: string): Promise<PackModule> { const module = await this.get(tenantId, id); const version = await this.mutableVersion(tenantId, module.packVersionId); module.status = PackModuleStatus.ARCHIVED; module.enabled = false; module.archivedAt = new Date(); module.updatedBy = actorId; module.version += 1; const saved = await this.modules.save(module); await this.invalidate(version, tenantId, actorId, 'pack.module.archived', id); return saved; }
  async impact(tenantId: string, id: string) { const module = await this.get(tenantId, id); return { moduleId: module.id, blocking: [], warnings: [], infos: [], summary: { features: 0, capabilities: 0, dependencies: 0, rules: 0 } }; }

  private async version(tenantId: string, id: string): Promise<PackVersion> { const version = await this.versions.findOne({ where: { id, tenantId } }); if (!version) throw new NotFoundException('PACK_VERSION_NOT_FOUND'); return version; }
  private async mutableVersion(tenantId: string, id: string): Promise<PackVersion> { const version = await this.version(tenantId, id); if ([PackVersionStatus.PUBLISHED, PackVersionStatus.SUPERSEDED, PackVersionStatus.DEPRECATED, PackVersionStatus.ARCHIVED].includes(version.status)) throw new ConflictException('PACK_VERSION_IMMUTABLE'); return version; }
  private async invalidate(version: PackVersion, tenantId: string, actorId: string, eventType: string, aggregateId: string) { const modules = await this.modules.find({ where: { tenantId, packVersionId: version.id }, order: { displayOrder: 'ASC' } }); await this.versions.update({ id: version.id, tenantId, version: version.version }, { modules: modules.map((module) => ({ id: module.id, code: module.code, name: module.name, moduleType: module.moduleType, status: module.status, enabled: module.enabled, displayOrder: module.displayOrder })), validationStatus: PackValidationStatus.OUTDATED, manifestStatus: PackManifestStatus.OUTDATED, snapshot: undefined, snapshotHash: undefined, manifest: undefined, manifestHash: undefined, version: version.version + 1, updatedBy: actorId }); await this.audit.log({ actorId, eventType, action: eventType.split('.').pop()?.toUpperCase() ?? 'UPDATE', targetType: 'PackModule', targetId: aggregateId, metadata: { tenantId, packVersionId: version.id } }); await this.dataSource.getRepository(PackOutboxEvent).save({ tenantId, eventType, aggregateType: 'PackModule', aggregateId, payload: { packVersionId: version.id } }); }
  private assertSafeConfig(configuration?: Record<string, unknown>) { if (configuration && /password|secret|token|credential|apiKey/i.test(JSON.stringify(configuration))) throw new ConflictException('PACK_MODULE_CONFIG_INVALID'); }
}
