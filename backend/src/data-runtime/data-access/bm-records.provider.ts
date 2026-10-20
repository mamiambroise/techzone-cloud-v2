import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { DataProvider, ListOptions } from './data-access-manager';
import { RuntimeContext, ResourceDescriptor, RelationType } from '../interfaces';
import { Prisma } from '../../generated/prisma/client';
import { DATA_RUNTIME_EXECUTE } from '../../iam/iam.constants';

/** PostgreSQL provider for `bm:<applicationVersionId>:<entityCode>` resources. */
@Injectable()
export class BmRecordsProvider implements DataProvider {
  constructor(private readonly prisma: PrismaService) {}

  async authorize(resource: string, operation: string, ctx: RuntimeContext) {
    await this.check(resource, operation.toLowerCase(), ctx);
  }

  private async definition(resource: string, ctx: RuntimeContext) {
    if (!ctx.tenantId || !ctx.userId) throw new ForbiddenException('TENANT_REQUIRED');
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
    const declared = await this.prisma.bmFeatureCapability.count({ where: { tenantId: ctx.tenantId, code: capability, status: 'ACTIVE', feature: { applicationVersionId: d.version.id } } });
    // BM capabilities are authored per application (for example
    // `customer.read`), so they cannot be pre-registered as static IAM
    // permissions. `data-runtime:execute` is the explicit tenant-scoped grant
    // held by application managers for operating those published resources.
    // Members who only have query/read access still need the named capability.
    const canManageBusinessData = ctx.permissions?.includes(DATA_RUNTIME_EXECUTE);
    if (declared && !ctx.permissions?.includes('*') && !canManageBusinessData && !ctx.permissions?.includes(capability)) throw new ForbiddenException(`FORBIDDEN: Permission "${capability}" manquante`);
    return d;
  }

  private async validate(d: any, data: Record<string, unknown>, ctx: RuntimeContext, id?: string, db: any = this.prisma) {
    if (!data || typeof data !== 'object' || Array.isArray(data)) throw new BadRequestException('VALIDATION_FAILED: object required');
    const fields = new Map(d.entity.fields.map((f: any) => [f.code, f]));
    for (const key of Object.keys(data)) if (!fields.has(key)) throw new BadRequestException(`FIELD_NOT_FOUND: ${key}`);
    for (const field of fields.values() as any) {
      const value = data[field.code];
      if (field.required && (value === undefined || value === null || value === '')) throw new BadRequestException(`VALIDATION_FAILED: ${field.code} requis`);
      if (value === undefined || value === null) continue;
      const valid = (['TEXT','LONG_TEXT','EMAIL','ENUM','RELATION'].includes(field.type) && typeof value === 'string') || (field.type === 'INTEGER' && Number.isInteger(value)) || (field.type === 'DECIMAL' && typeof value === 'number') || (field.type === 'BOOLEAN' && typeof value === 'boolean') || (['DATE','DATETIME'].includes(field.type) && typeof value === 'string' && !Number.isNaN(Date.parse(value)));
      if (!valid) throw new BadRequestException(`VALIDATION_FAILED: type invalide pour ${field.code}`);
      if (field.type === 'EMAIL' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value))) throw new BadRequestException('VALIDATION_FAILED: email');
      if (typeof value === 'number' && !Number.isFinite(value)) throw new BadRequestException('VALIDATION_FAILED: finite number required');
      const allowed = field.validations.find((v: any) => v.validationType === 'ALLOWED_VALUES')?.value;
      if (allowed && !allowed.split(',').map((x: string) => x.trim()).includes(String(value))) throw new BadRequestException(`VALIDATION_FAILED: valeur ENUM invalide pour ${field.code}`);
      if (field.type === 'RELATION') {
        if (!/^[0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(String(value))) throw new BadRequestException('RELATION_NOT_FOUND');
        const relation = await db.bmRelation.findFirst({ where: { tenantId: ctx.tenantId, applicationVersionId: d.version.id, sourceEntityId: d.entity.id, code: field.code } });
        if (!relation) throw new BadRequestException('RELATION_DEFINITION_NOT_FOUND');
        const target = await db.bmEntity.findFirst({ where: { id: relation.targetEntityId, tenantId: ctx.tenantId, applicationVersionId: d.version.id, status: 'ACTIVE' } });
        if (!target) throw new BadRequestException('RELATION_DEFINITION_NOT_FOUND');
        const exists = await db.businessRecord.findFirst({ where: { id: String(value), tenantId: ctx.tenantId, applicationId: d.version.applicationId, entityCode: target.code, archivedAt: null } });
        if (!exists) throw new BadRequestException('RELATION_NOT_FOUND');
      }
      if (field.unique) {
        const duplicate = await db.businessRecord.findFirst({ where: { tenantId: ctx.tenantId, applicationId: d.version.applicationId, entityCode: d.entity.code, archivedAt: null, data: { path: [field.code], equals: value as any }, ...(id ? { NOT: { id } } : {}) } });
        if (duplicate) throw new BadRequestException(`UNIQUE_CONSTRAINT_VIOLATION: ${field.code}`);
      }
    }
  }

  private async authorizeFieldChanges(d: any, before: any, data: any, ctx: RuntimeContext, db: any) {
    if (!data || typeof data !== 'object' || Array.isArray(data)) throw new BadRequestException('VALIDATION_FAILED: object required');
    if (ctx.permissions?.includes('*')) return;
    const capabilities = await db.bmFeatureCapability.findMany({ where: {
      tenantId: ctx.tenantId, status: 'ACTIVE', feature: { applicationVersionId: d.version.id },
    } });
    for (const capability of capabilities) {
      const transition = capability.configuration?.transition;
      if (transition?.entity !== d.entity.code || typeof transition.field !== 'string') continue;
      if (Object.hasOwn(data, transition.field) && data[transition.field] !== before[transition.field] && data[transition.field] === transition.value && !ctx.permissions?.includes(capability.code)) {
        throw new ForbiddenException(`FORBIDDEN: Permission "${capability.code}" manquante`);
      }
    }
  }

  private scope(d: any, ctx: RuntimeContext) {
    return { tenantId: ctx.tenantId!, applicationId: d.version.applicationId, entityCode: d.entity.code, archivedAt: null };
  }

  private async write<T>(d: any, ctx: RuntimeContext, fn: (tx: any) => Promise<T>): Promise<T> {
    return this.prisma.$transaction(async tx => {
      // Application-wide transaction lock also serializes relation/archive races.
      // Values are bound parameters, never interpolated identifiers.
      const key = ctx.tenantId + ':' + d.version.applicationId;
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtextextended(${key}, 0))`;
      return fn(tx);
    }, { timeout: 15000 });
  }

  async create(resource: string, data: any, ctx: RuntimeContext) {
    const d = await this.check(resource, 'create', ctx);
    return this.write(d, ctx, async tx => {
      await this.authorizeFieldChanges(d, {}, data, ctx, tx);
      await this.validate(d, data, ctx, undefined, tx);
      return tx.businessRecord.create({ data: { ...this.scope(d, ctx), entityId: d.entity.id, schemaVersion: d.version.version, data, createdBy: ctx.userId, updatedBy: ctx.userId } });
    });
  }

  async get(resource: string, id: string, ctx: RuntimeContext) {
    const d = await this.check(resource, 'read', ctx);
    const record = await this.prisma.businessRecord.findFirst({ where: { ...this.scope(d, ctx), id } });
    if (!record) throw new NotFoundException('RECORD_NOT_FOUND');
    return record;
  }

  async update(resource: string, id: string, data: any, ctx: RuntimeContext) {
    const d = await this.check(resource, 'update', ctx);
    if (!data || typeof data !== 'object' || Array.isArray(data)) throw new BadRequestException('VALIDATION_FAILED: object required');
    return this.write(d, ctx, async tx => {
      const before = await tx.businessRecord.findFirst({ where: { ...this.scope(d, ctx), id } });
      if (!before) throw new NotFoundException('RECORD_NOT_FOUND');
      await this.authorizeFieldChanges(d, before.data, data, ctx, tx);
      for (const f of d.entity.fields) if (f.readonly && Object.hasOwn(data, f.code)) throw new BadRequestException('READONLY_FIELD: ' + f.code);
      const merged = { ...before.data, ...data };
      await this.validate(d, merged, ctx, id, tx);
      return tx.businessRecord.update({ where: { id }, data: { data: merged, schemaVersion: d.version.version, updatedBy: ctx.userId } });
    });
  }

  async remove(resource: string, id: string, ctx: RuntimeContext) {
    const d = await this.check(resource, 'delete', ctx);
    await this.write(d, ctx, async tx => {
      const record = await tx.businessRecord.findFirst({ where: { ...this.scope(d, ctx), id } });
      if (!record) throw new NotFoundException('RECORD_NOT_FOUND');
      await tx.businessRecord.update({ where: { id }, data: { archivedAt: new Date(), updatedBy: ctx.userId } });
    });
  }

  private fieldExpression(d: any, code: string) {
    const field = d.entity.fields.find((f: any) => f.code === code);
    if (!field) throw new BadRequestException('FIELD_NOT_FOUND: ' + code);
    // JSONB preserves numeric/boolean ordering and types; field names are parameters.
    return Prisma.sql`data -> ${code}::text`;
  }

  private filterSql(d: any, filter: any, depth = 0): Prisma.Sql {
    if (!filter) return Prisma.sql`TRUE`;
    if (depth > 3 || !['AND', 'OR'].includes(filter.logic) || !Array.isArray(filter.conditions) || !filter.conditions.length || filter.conditions.length > 100) throw new BadRequestException('INVALID_FILTER');
    const parts = filter.conditions.map((c: any): Prisma.Sql => {
      if (c && 'logic' in c) return this.filterSql(d, c, depth + 1);
      if (!c || typeof c.field !== 'string') throw new BadRequestException('INVALID_FILTER');
      const field = this.fieldExpression(d, c.field);
      if (c.operator === 'IS_NULL') return Prisma.sql`(${field} IS NULL OR ${field} = 'null'::jsonb)`;
      if (c.value === undefined) throw new BadRequestException('INVALID_FILTER: value required');
      const value = Prisma.sql`${JSON.stringify(c.value)}::jsonb`;
      const operators: Record<string, string> = { EQ: '=', NE: '<>', GT: '>', GTE: '>=', LT: '<', LTE: '<=' };
      if (operators[c.operator]) return Prisma.sql`${field} ${Prisma.raw(operators[c.operator])} ${value}`;
      if (['IN', 'NOT_IN'].includes(c.operator)) {
        if (!Array.isArray(c.value) || c.value.length > 100) throw new BadRequestException('INVALID_FILTER');
        if (!c.value.length) return c.operator === 'IN' ? Prisma.sql`FALSE` : Prisma.sql`TRUE`;
        return Prisma.sql`${field} ${Prisma.raw(c.operator === 'IN' ? 'IN' : 'NOT IN')} (${Prisma.join(c.value.map((v: any) => Prisma.sql`${JSON.stringify(v)}::jsonb`))})`;
      }
      if (['CONTAINS', 'STARTS_WITH', 'ENDS_WITH'].includes(c.operator) && typeof c.value === 'string') {
        const text = Prisma.sql`data ->> ${c.field}::text`;
        if (c.operator === 'CONTAINS') return Prisma.sql`strpos(${text}, ${c.value}) > 0`;
        if (c.operator === 'STARTS_WITH') return Prisma.sql`left(${text}, length(${c.value}::text)) = ${c.value}`;
        return Prisma.sql`right(${text}, length(${c.value}::text)) = ${c.value}`;
      }
      throw new BadRequestException('INVALID_FILTER: operator');
    });
    return Prisma.sql`(${Prisma.join(parts, filter.logic === 'AND' ? ' AND ' : ' OR ')})`;
  }

  private async expandRelations(items: any[], d: any, requested: string[], ctx: RuntimeContext): Promise<any[]> {
    if (requested.length > 10 || requested.some((code) => typeof code !== 'string' || !code.trim())) {
      throw new BadRequestException('INVALID_RELATIONS');
    }
    if (!this.prisma.bmRelation?.findMany) throw new BadRequestException('RELATION_EXPANSION_UNAVAILABLE');
    const relationRows = await this.prisma.bmRelation.findMany({
      where: {
        applicationVersionId: d.version.id,
        sourceEntityId: d.entity.id,
        code: { in: requested },
        OR: [{ tenantId: ctx.tenantId }, { tenantId: null }],
      },
    });
    if (relationRows.length !== requested.length) throw new BadRequestException('RELATION_NOT_ALLOWED');
    if (!this.prisma.bmEntity?.findUnique || !this.prisma.businessRecord?.findMany) {
      throw new BadRequestException('RELATION_EXPANSION_UNAVAILABLE');
    }
    const relationData = await Promise.all(relationRows.map(async (relation: any) => {
      const targetEntity = await this.prisma.bmEntity.findUnique({ where: { id: relation.targetEntityId }, select: { code: true } });
      if (!targetEntity) throw new BadRequestException('RELATION_DEFINITION_NOT_FOUND');
      const ids = items.flatMap((item) => {
        const value = item.data?.[relation.code];
        return Array.isArray(value) ? value : [value];
      }).filter((value: any) => typeof value === 'string' && /^[0-9a-f-]{36}$/i.test(value));
      const records = ids.length
        ? await this.prisma.businessRecord.findMany({
          where: { id: { in: [...new Set(ids)] }, tenantId: ctx.tenantId, applicationId: d.version.applicationId, entityCode: targetEntity.code, archivedAt: null },
        })
        : [];
      return { relation, recordsById: new Map(records.map((record: any) => [record.id, record])) };
    }));
    const expanded = items.map((item) => {
      const data = item.data && typeof item.data === 'object' ? item.data : {};
      const relations: Record<string, any> = {};
      for (const { relation, recordsById } of relationData) {
        const rawValue = data[relation.code];
        const values = Array.isArray(rawValue) ? rawValue : [rawValue];
        const related = values.map((value: any) => recordsById.get(value)).filter(Boolean);
        relations[relation.code] = Array.isArray(rawValue) ? related : (related[0] || null);
      }
      return { ...item, relations };
    });
    return expanded;
  }

  async list(resource: string, ctx: RuntimeContext, options: ListOptions = {}) {
    const d = await this.check(resource, 'read', ctx);
    const page = options.page ?? 1, pageSize = options.pageSize ?? 20;
    if (!Number.isSafeInteger(page) || page < 1 || !Number.isSafeInteger(pageSize) || pageSize < 1 || pageSize > 100) throw new BadRequestException('INVALID_PAGINATION');
    for (const field of options.select || []) this.fieldExpression(d, field);
    const order = (options.sort || []).map(sort => {
      if (!['ASC', 'DESC'].includes(sort.direction)) throw new BadRequestException('INVALID_SORT');
      return Prisma.sql`${this.fieldExpression(d, sort.field)} ${Prisma.raw(sort.direction)} NULLS LAST`;
    });
    order.push(Prisma.sql`id ASC`);
    const where = Prisma.sql`"tenantId" = ${ctx.tenantId}::uuid AND "applicationId" = ${d.version.applicationId}::uuid AND "entityCode" = ${d.entity.code} AND "archivedAt" IS NULL AND ${this.filterSql(d, options.filter)}`;
    const [items, counts] = await this.prisma.$transaction([
      this.prisma.$queryRaw<any[]>(Prisma.sql`SELECT * FROM business_manager.business_records WHERE ${where} ORDER BY ${Prisma.join(order)} LIMIT ${pageSize} OFFSET ${(page - 1) * pageSize}`),
      this.prisma.$queryRaw<{ total: bigint }[]>(Prisma.sql`SELECT count(*) AS total FROM business_manager.business_records WHERE ${where}`),
    ], { isolationLevel: 'RepeatableRead' });
    const total = Number(counts[0].total);
    const expanded = options.relations?.length ? await this.expandRelations(items, d, options.relations, ctx) : items;
    return { items: options.select?.length ? expanded.map(r => ({ ...r, data: Object.fromEntries(options.select!.map(k => [k, r.data[k]])) })) : expanded, page, pageSize, total, totalPages: Math.ceil(total / pageSize) };
  }
  async count(resource: string, ctx: RuntimeContext, filter?: any) { return (await this.list(resource, ctx, { pageSize: 1, filter })).total; }
  async exists(resource: string, id: string, ctx: RuntimeContext) {
    try { await this.get(resource, id, ctx); return true; } catch (error) { if (error instanceof NotFoundException) return false; throw error; }
  }
  async metadata(resource: string, ctx: RuntimeContext): Promise<ResourceDescriptor> {
    const d = await this.definition(resource, ctx);
    const relationRows = this.prisma.bmRelation?.findMany
      ? await this.prisma.bmRelation.findMany({
        where: {
          applicationVersionId: d.version.id,
          sourceEntityId: d.entity.id,
          OR: [{ tenantId: ctx.tenantId }, { tenantId: null }],
        },
        orderBy: { code: 'asc' },
      })
      : [];
    const targetIds = relationRows.map((relation: any) => relation.targetEntityId).filter(Boolean);
    const targetEntities = targetIds.length && this.prisma.bmEntity?.findMany
      ? await this.prisma.bmEntity.findMany({
        where: {
          id: { in: targetIds },
          applicationVersionId: d.version.id,
          OR: [{ tenantId: ctx.tenantId }, { tenantId: null }],
          status: 'ACTIVE',
        },
        select: { id: true, code: true },
      })
      : [];
    const targetById = new Map(targetEntities.map((entity: any) => [entity.id, entity.code]));
    const relationType = (value: string): RelationType => {
      const normalized = String(value || 'ONE_TO_MANY').toUpperCase();
      const allowed: RelationType[] = ['ONE_TO_ONE', 'ONE_TO_MANY', 'MANY_TO_ONE', 'MANY_TO_MANY'];
      return allowed.includes(normalized as RelationType)
        ? (normalized as RelationType)
        : 'ONE_TO_MANY';
    };
    return {
      resourceCode: resource,
      displayName: d.entity.name,
      provider: 'BM_RECORDS',
      instance: 'postgresql',
      operations: ['READ', 'LIST', 'CREATE', 'UPDATE', 'DELETE'],
      fields: d.entity.fields.map((f: any) => ({ code: f.code, displayName: f.label || f.code, type: f.type, required: f.required, nullable: !f.required })),
      relations: relationRows.map((relation: any) => ({
        code: relation.code,
        displayName: relation.sourceLabel || relation.code,
        targetResource: targetById.get(relation.targetEntityId) || relation.targetEntityId,
        type: relationType(relation.relationType),
        foreignKey: relation.configuration?.foreignKey || relation.code,
      })),
    };
  }
}
