import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { DataProvider, ListOptions } from './data-access-manager';
import { RuntimeContext, ResourceDescriptor } from '../interfaces';

/** PostgreSQL provider for `bm:<applicationVersionId>:<entityCode>` resources. */
@Injectable()
export class BmRecordsProvider implements DataProvider {
  constructor(private readonly prisma: PrismaService) {}

  private async definition(resource: string, ctx: RuntimeContext) {
    const match = /^bm:([0-9a-f-]{36}):([A-Za-z][A-Za-z0-9_-]*)$/i.exec(resource);
    if (!match) throw new NotFoundException('ENTITY_NOT_FOUND: ressource BM invalide');
    const version = await this.prisma.applicationVersion.findFirst({ where: { id: match[1], tenantId: ctx.tenantId }, select: { id: true, applicationId: true, version: true } });
    if (!version) throw new NotFoundException('APPLICATION_VERSION_NOT_FOUND');
    const entity = await this.prisma.bmEntity.findFirst({ where: { applicationVersionId: version.id, tenantId: ctx.tenantId, code: match[2], status: 'ACTIVE' }, include: { fields: { include: { validations: true } } } });
    if (!entity) throw new NotFoundException('ENTITY_NOT_FOUND');
    return { version, entity };
  }

  private async check(resource: string, op: string, ctx: RuntimeContext) {
    const d = await this.definition(resource, ctx);
    const capability = `${d.entity.code}.${op}`;
    const declared = await this.prisma.bmFeatureCapability.count({ where: { tenantId: ctx.tenantId, code: capability, status: 'ACTIVE' } });
    if (declared && !ctx.permissions?.includes('*') && !ctx.permissions?.includes(capability)) throw new ForbiddenException(`FORBIDDEN: Permission "${capability}" manquante`);
    return d;
  }

  private async validate(d: any, data: Record<string, unknown>, ctx: RuntimeContext, id?: string) {
    const fields = new Map(d.entity.fields.map((f: any) => [f.code, f]));
    for (const key of Object.keys(data)) if (!fields.has(key)) throw new BadRequestException(`FIELD_NOT_FOUND: ${key}`);
    for (const field of fields.values() as any) {
      const value = data[field.code];
      if (field.required && (value === undefined || value === null || value === '')) throw new BadRequestException(`VALIDATION_FAILED: ${field.code} requis`);
      if (value === undefined || value === null) continue;
      const valid = (['TEXT','LONG_TEXT','EMAIL','ENUM','RELATION'].includes(field.type) && typeof value === 'string') || (field.type === 'INTEGER' && Number.isInteger(value)) || (field.type === 'DECIMAL' && typeof value === 'number') || (field.type === 'BOOLEAN' && typeof value === 'boolean') || (['DATE','DATETIME'].includes(field.type) && typeof value === 'string' && !Number.isNaN(Date.parse(value)));
      if (!valid) throw new BadRequestException(`VALIDATION_FAILED: type invalide pour ${field.code}`);
      const allowed = field.validations.find((v: any) => v.validationType === 'ALLOWED_VALUES')?.value;
      if (allowed && !allowed.split(',').map((x: string) => x.trim()).includes(String(value))) throw new BadRequestException(`VALIDATION_FAILED: valeur ENUM invalide pour ${field.code}`);
      if (field.type === 'RELATION') {
        const exists = await this.prisma.businessRecord.findFirst({ where: { id: String(value), tenantId: ctx.tenantId, applicationId: d.version.applicationId, archivedAt: null } });
        if (!exists) throw new BadRequestException('RELATION_NOT_FOUND');
      }
      if (field.unique) {
        const duplicate = await this.prisma.businessRecord.findFirst({ where: { tenantId: ctx.tenantId, applicationId: d.version.applicationId, entityCode: d.entity.code, archivedAt: null, data: { path: [field.code], equals: value as any }, ...(id ? { NOT: { id } } : {}) } });
        if (duplicate) throw new BadRequestException(`UNIQUE_CONSTRAINT_VIOLATION: ${field.code}`);
      }
    }
  }

  async create(resource: string, data: any, ctx: RuntimeContext) { const d = await this.check(resource, 'create', ctx); await this.validate(d, data, ctx); return this.prisma.businessRecord.create({ data: { tenantId: ctx.tenantId!, applicationId: d.version.applicationId, entityId: d.entity.id, entityCode: d.entity.code, schemaVersion: d.version.version, data, createdBy: ctx.userId, updatedBy: ctx.userId } }); }
  async get(resource: string, id: string, ctx: RuntimeContext) { const d = await this.check(resource, 'read', ctx); const r = await this.prisma.businessRecord.findFirst({ where: { id, tenantId: ctx.tenantId, applicationId: d.version.applicationId, entityCode: d.entity.code, archivedAt: null } }); if (!r) throw new NotFoundException('RECORD_NOT_FOUND'); return r; }
  async update(resource: string, id: string, data: any, ctx: RuntimeContext) { const d = await this.check(resource, 'update', ctx); const before = await this.get(resource, id, ctx); const merged = { ...(before.data as object), ...data }; await this.validate(d, merged, ctx, id); return this.prisma.businessRecord.update({ where: { id }, data: { data: merged, schemaVersion: d.version.version, updatedBy: ctx.userId } }); }
  async remove(resource: string, id: string, ctx: RuntimeContext) { await this.check(resource, 'delete', ctx); await this.get(resource, id, ctx); await this.prisma.businessRecord.update({ where: { id }, data: { archivedAt: new Date(), updatedBy: ctx.userId } }); }
  async list(resource: string, ctx: RuntimeContext, options?: ListOptions) { const d = await this.check(resource, 'read', ctx); const page = options?.page || 1, pageSize = options?.pageSize || 20; const [items,total] = await this.prisma.$transaction([this.prisma.businessRecord.findMany({ where: { tenantId: ctx.tenantId, applicationId: d.version.applicationId, entityCode: d.entity.code, archivedAt: null }, orderBy: { createdAt: 'desc' }, skip: (page - 1) * pageSize, take: pageSize }), this.prisma.businessRecord.count({ where: { tenantId: ctx.tenantId, applicationId: d.version.applicationId, entityCode: d.entity.code, archivedAt: null } })]); return { items, page, pageSize, total, totalPages: Math.ceil(total / pageSize) }; }
  async count(resource: string, ctx: RuntimeContext) { return (await this.list(resource, ctx, { pageSize: 1 })).total; }
  async exists(resource: string, id: string, ctx: RuntimeContext) { try { await this.get(resource,id,ctx); return true; } catch { return false; } }
  async metadata(resource: string, ctx: RuntimeContext): Promise<ResourceDescriptor> { const d = await this.definition(resource, ctx); return { resourceCode: resource, displayName: d.entity.name, provider: 'BM_RECORDS', instance: 'postgresql', operations: ['READ','LIST','CREATE','UPDATE','DELETE'], fields: d.entity.fields.map((f:any) => ({ code:f.code, displayName:f.label || f.code, type:f.type, required:f.required, nullable:!f.required })), relations: [] }; }
}
