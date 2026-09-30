<<<<<<< HEAD
import { contractHash, publicJson, validateExpression, dependencyIssues, compatible } from './pack-contract';
import { rcompare, valid } from 'semver';
import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, PackVersion } from '../../generated/prisma/client';
import { randomUUID } from 'node:crypto';
import { PrismaService } from '../../prisma/prisma.service';

import type { IamPrincipal as Actor } from '../../iam/principal.decorator';
type Input = Record<string, unknown>;

const hash = contractHash;

const RUNTIME_RULE_FIELD =
  /^(tenant\.id|application\.(id|version)|environment\.code|subscription\.(plan|status)|entitlements|permissions|capabilities|featureFlags\.[\w.-]+|locale|timezone)$/;

function invalidRuleField(expression: unknown): boolean {
  if (Array.isArray(expression)) return expression.some(invalidRuleField);
  if (!expression || typeof expression !== 'object') return false;
  const node = expression as Input;
  if (typeof node.field === 'string' && !RUNTIME_RULE_FIELD.test(node.field))
    return true;
  return Object.values(node).some(invalidRuleField);
}

@Injectable()
export class PackManagerService {
  constructor(private readonly db: PrismaService) {}

  private inTransaction = false;
  private transaction<T>(operation: (tx: Prisma.TransactionClient) => Promise<T>, _options?: unknown): Promise<T> {
    return this.inTransaction ? operation(this.db as unknown as Prisma.TransactionClient) : this.db.$transaction(operation, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
  }
  async atomic(method: string, args: unknown[]) {
    const actor = args[args.length - 1] as Actor;
    this.tenant(actor);
    for (const value of args.slice(0,-1)) if (value && typeof value === 'object') {
      if (Array.isArray(value) || JSON.stringify(value).length > 100000) throw new BadRequestException('INPUT_INVALID_OR_TOO_LARGE');
      publicJson(value);
      const input = value as Input;
      for (const key of ['enabled','required','defaultEnabled','archived']) if (input[key] !== undefined && typeof input[key] !== 'boolean') throw new BadRequestException('BOOLEAN_REQUIRED');
      if (input.code !== undefined && (typeof input.code !== 'string' || !/^[a-zA-Z][a-zA-Z0-9._-]{1,99}$/.test(input.code))) throw new BadRequestException('CODE_INVALID');
      if (input.sourceType && method === 'createPack' && !['CUSTOM','TEMPLATE','IMPORTED'].includes(String(input.sourceType))) throw new BadRequestException('SOURCE_TYPE_INVALID');
      if (input.categoryId) throw new BadRequestException('CATEGORY_REGISTRY_NOT_CONFIGURED');
    }
    try {
      return await this.db.$transaction(async tx => {
        const service = new PackManagerService(tx as unknown as PrismaService);
        service.inTransaction = true;
        const result = await (service as any)[method](...args);
        await service.audit(tx,actor,'PACK_MANAGER',result?.id ?? String(args[0]),'pack.'+method);
        return result;
      }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable, timeout: 15000 });
    } catch (error) {
      if ((error as any).code === 'P2034') throw new ConflictException('CONCURRENT_MODIFICATION_RETRY');
      if ((error as any).code === 'P2002') throw new ConflictException('RESOURCE_ALREADY_EXISTS');
      throw error;
    }
  }

  private tenant(actor: Actor): string {
    if (!actor.tenantId || actor.tenantId === 'legacy')
      throw new BadRequestException('TENANT_CONTEXT_REQUIRED');
    return actor.tenantId;
  }

  private text(
    input: Input,
    key: string,
    required = false,
  ): string | undefined {
    const value = input[key];
    if (value === undefined || value === null || value === '') {
      if (required)
        throw new BadRequestException(`${key.toUpperCase()}_REQUIRED`);
      return undefined;
    }
    if (typeof value !== 'string')
      throw new BadRequestException(`${key.toUpperCase()}_INVALID`);
    if (required && !value.trim()) throw new BadRequestException(key.toUpperCase() + '_REQUIRED');
    if (value.length > 4000) throw new BadRequestException('TEXT_TOO_LONG');
    return value.trim();
  }

  private async version(id: string, actor: Actor, include = false) {
    const version = await this.db.packVersion.findFirst({
      where: { id, tenantId: this.tenant(actor) },
      include: include
        ? {
            pack: true,
            modules: true,
            features: {
              include: { capabilities: { include: { capability: true } } },
            },
            dependencies: true,
            rules: true,
            snapshot: true,
            manifest: true,
          }
        : { pack: true },
    });
    if (!version) throw new NotFoundException('PACK_VERSION_NOT_FOUND');
    return version;
  }

  private mutable(version: Pick<PackVersion, 'status'>): void {
    if ((version as any).pack?.archivedAt) throw new ConflictException('PACK_ARCHIVED');
    if (['PUBLISHED', 'SUPERSEDED', 'DEPRECATED', 'ARCHIVED'].includes(version.status)) {
      throw new ConflictException('PACK_VERSION_IMMUTABLE');
    }
  }

  private async invalidate(versionId: string, actor: Actor): Promise<void> {
    await this.db.packVersion.update({
      where: { id: versionId },
      data: {
        status: 'CONFIGURING',
        validationStatus: 'OUTDATED',
        manifestStatus: 'OUTDATED',
        manifestHash: null,
        updatedBy: actor.userId,
        rowVersion: { increment: 1 },
      },
    });
  }

  private async audit(
    tx: Prisma.TransactionClient,
    actor: Actor,
    type: string,
    id: string,
    action: string,
    details?: unknown,
  ) {
    const tenantId = this.tenant(actor);
    await tx.auditEvent.create({
      data: {
        tenantId,
        targetType: type,
        targetId: id,
        action,
        actorId: actor.userId,
        traceId: randomUUID(),
        result: 'SUCCESS',
        metadata: (details ?? {}) as Prisma.InputJsonValue,
      },
    });
  }

  async dashboard(actor: Actor) {
    const tenantId = this.tenant(actor);
    const [packs, drafts, published, attention, activity] = await Promise.all([
      this.db.pack.count({ where: { tenantId, archivedAt: null } }),
      this.db.packVersion.count({
        where: { tenantId, status: { in: ['DRAFT', 'READY'] } },
      }),
      this.db.packVersion.count({ where: { tenantId, status: 'PUBLISHED' } }),
      this.db.packVersion.count({
        where: { tenantId, validationStatus: { in: ['INVALID', 'ERROR'] } },
      }),
      this.db.auditEvent.findMany({
        where: { tenantId, action: { startsWith: 'pack.' } },
        orderBy: { createdAt: 'desc' },
        take: 20,
      }),
    ]);
    return { counters: { packs, drafts, published, attention }, activity };
  }

  listPacks(actor: Actor, query: Input) {
    const tenantId = this.tenant(actor);
    const search = this.text(query, 'search');
    return this.db.pack.findMany({
      where: {
        tenantId,
        status: this.text(query, 'status'),
        archivedAt:
          query.archived === 'true'
            ? { not: null }
            : query.archived === 'false'
              ? null
              : undefined,
        OR: search
          ? [
              { code: { contains: search, mode: 'insensitive' } },
              { name: { contains: search, mode: 'insensitive' } },
            ]
          : undefined,
      },
      include: { _count: { select: { versions: true } } },
      orderBy: { updatedAt: 'desc' },
      take: Math.max(1, Math.min(Math.floor(Number(query.limit)) || 50, 100)),
    });
  }

  async getPack(id: string, actor: Actor) {
    this.tenant(actor);
    const pack = await this.db.pack.findFirst({
      where: { id, tenantId: this.tenant(actor) },
      include: { versions: { orderBy: { createdAt: 'desc' } } },
    });
    if (!pack) throw new NotFoundException('PACK_NOT_FOUND');
    return pack;
  }

  async createPack(input: Input, actor: Actor) {
    const tenantId = this.tenant(actor);
    try {
      return await this.transaction(async (tx) => {
        const pack = await tx.pack.create({
          data: {
            tenantId,
            code: this.text(input, 'code', true)!.toLowerCase(),
            name: this.text(input, 'name', true)!,
            shortName: this.text(input, 'shortName'),
            description: this.text(input, 'description'),
            categoryId: this.text(input, 'categoryId'),
            iconKey: this.text(input, 'iconKey'),
            sourceType: this.text(input, 'sourceType') ?? 'CUSTOM',
            metadata: (input.metadata ?? undefined) as
              Prisma.InputJsonValue | undefined,
            createdBy: actor.userId,
          },
        });
        await this.audit(tx, actor, 'PACK', pack.id, 'pack.created', {
          code: pack.code,
        });
        return pack;
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      )
        throw new ConflictException('PACK_CODE_CONFLICT');
      throw error;
    }
  }

  async updatePack(id: string, input: Input, actor: Actor) {
    const current = await this.getPack(id, actor);
    if (Number(input.rowVersion) !== current.rowVersion)
      throw new ConflictException('PACK_VERSION_CONFLICT');
    if (current.archivedAt) throw new ConflictException('PACK_ARCHIVED');
    return this.db.pack.update({
      where: { id, rowVersion: current.rowVersion },
      data: {
        name: this.text(input, 'name'),
        shortName: this.text(input, 'shortName'),
        description: this.text(input, 'description'),
        categoryId: this.text(input, 'categoryId'),
        iconKey: this.text(input, 'iconKey'),
        metadata: input.metadata as Prisma.InputJsonValue | undefined,
        updatedBy: actor.userId,
        rowVersion: { increment: 1 },
      },
    });
  }

  async archivePack(id: string, actor: Actor) {
    await this.getPack(id, actor);
    return this.db.pack.update({
      where: { id },
      data: {
        status: 'ARCHIVED',
        archivedAt: new Date(),
        updatedBy: actor.userId,
        rowVersion: { increment: 1 },
      },
    });
  }

  async restorePack(id: string, actor: Actor) {
    await this.getPack(id, actor);
    return this.db.pack.update({
      where: { id },
      data: {
        status: 'DRAFT',
        archivedAt: null,
        updatedBy: actor.userId,
        rowVersion: { increment: 1 },
      },
    });
  }

  listVersions(packId: string, actor: Actor) {
    return this.db.packVersion.findMany({
      where: { tenantId: this.tenant(actor), packId },
      orderBy: { createdAt: 'desc' },
    });
  }

  getVersion(id: string, actor: Actor) {
    return this.version(id, actor, true);
  }

  async createVersion(packId: string, input: Input, actor: Actor) {
    const pack = await this.getPack(packId, actor);
    if (pack.archivedAt) throw new ConflictException('PACK_ARCHIVED');
    if (input.sourceVersionId) { const source = await this.version(String(input.sourceVersionId), actor); if (source.packId !== packId) throw new BadRequestException('SOURCE_VERSION_PACK_MISMATCH'); }
    const versionNumber = this.text(input, 'versionNumber', true)!;
    if (!valid(versionNumber))
      throw new BadRequestException('PACK_VERSION_SEMVER_INVALID');
    return this.db.packVersion.create({
      data: {
        tenantId: this.tenant(actor),
        packId,
        versionNumber,
        label: this.text(input, 'label'),
        description: this.text(input, 'description'),
        changeType: this.text(input, 'changeType') ?? 'INITIAL',
        sourceVersionId: this.text(input, 'sourceVersionId'),
        releaseNotes: this.text(input, 'releaseNotes'),
        createdBy: actor.userId,
      },
    });
  }

  async updateVersion(id: string, input: Input, actor: Actor) {
    const current = await this.version(id, actor);
    this.mutable(current);
    if (Number(input.rowVersion) !== current.rowVersion)
      throw new ConflictException('PACK_VERSION_CONFLICT');
    return this.db.packVersion.update({
      where: { id },
      data: {
        label: this.text(input, 'label'),
        description: this.text(input, 'description'),
        releaseNotes: this.text(input, 'releaseNotes'),
        updatedBy: actor.userId,
        validationStatus: 'OUTDATED',
        manifestStatus: 'OUTDATED',
        rowVersion: { increment: 1 },
      },
    });
  }

  async addModule(versionId: string, input: Input, actor: Actor) {
    const version = await this.version(versionId, actor);
    this.mutable(version);
    const created = await this.db.packModule.create({
      data: {
        tenantId: this.tenant(actor),
        packVersionId: versionId,
        code: this.text(input, 'code', true)!.toLowerCase(),
        name: this.text(input, 'name', true)!,
        description: this.text(input, 'description'),
        moduleType: this.text(input, 'moduleType') ?? 'BUSINESS',
        enabled: input.enabled !== false,
        displayOrder: Number(input.displayOrder) || 0,
        configuration: input.configuration as Prisma.InputJsonValue | undefined,
        createdBy: actor.userId,
      },
    });
    await this.invalidate(versionId, actor);
    return created;
  }

  listModules(versionId: string, actor: Actor) {
    return this.version(versionId, actor).then(() =>
      this.db.packModule.findMany({
        where: {
          tenantId: this.tenant(actor),
          packVersionId: versionId,
          archivedAt: null,
        },
        orderBy: { displayOrder: 'asc' },
      }),
    );
  }

  async addFeature(versionId: string, input: Input, actor: Actor) {
    const version = await this.version(versionId, actor);
    this.mutable(version);
    const moduleId = this.text(input, 'moduleId');
    if (
      moduleId &&
      !(await this.db.packModule.findFirst({
        where: {
          id: moduleId,
          packVersionId: versionId,
          tenantId: this.tenant(actor),
        },
      }))
    )
      throw new BadRequestException('MODULE_NOT_IN_VERSION');
    const created = await this.db.packFeature.create({
      data: {
        tenantId: this.tenant(actor),
        packVersionId: versionId,
        moduleId,
        code: this.text(input, 'code', true)!.toLowerCase(),
        name: this.text(input, 'name', true)!,
        description: this.text(input, 'description'),
        featureType: this.text(input, 'featureType') ?? 'BUSINESS',
        enabled: input.enabled !== false,
        defaultEnabled: input.defaultEnabled !== false,
        configuration: input.configuration as Prisma.InputJsonValue | undefined,
        createdBy: actor.userId,
      },
    });
    await this.invalidate(versionId, actor);
    return created;
  }

  listFeatures(versionId: string, actor: Actor) {
    return this.version(versionId, actor).then(() =>
      this.db.packFeature.findMany({
        where: {
          tenantId: this.tenant(actor),
          packVersionId: versionId,
          archivedAt: null,
        },
        include: { capabilities: { include: { capability: true } } },
      }),
    );
  }

  createCapability(input: Input, actor: Actor) {
    return this.db.packCapability.create({
      data: {
        tenantId: this.tenant(actor),
        code: this.text(input, 'code', true)!.toLowerCase(),
        name: this.text(input, 'name', true)!,
        description: this.text(input, 'description'),
        capabilityType: this.text(input, 'capabilityType') ?? 'BUSINESS',
        scope: this.text(input, 'scope') ?? 'TENANT',
        contractRef: this.text(input, 'contractRef'),
        contractVersion: this.text(input, 'contractVersion'),
        metadata: input.metadata as Prisma.InputJsonValue | undefined,
      },
    });
  }

  listCapabilities(actor: Actor) {
    return this.db.packCapability.findMany({
      where: {
        OR: [{ tenantId: this.tenant(actor) }, { tenantId: null }],
        status: 'ACTIVE',
      },
      orderBy: { code: 'asc' },
    });
  }

  async attachCapability(featureId: string, input: Input, actor: Actor) {
    const feature = await this.db.packFeature.findFirst({
      where: { id: featureId, tenantId: this.tenant(actor) },
      include: { packVersion: true },
    });
    if (!feature) throw new NotFoundException('FEATURE_NOT_FOUND');
    this.mutable(feature.packVersion);
    if (!['REQUIRES','PROVIDES','USES'].includes(String(input.relationType ?? 'REQUIRES'))) throw new BadRequestException('CAPABILITY_RELATION_INVALID');
    const capabilityId = this.text(input, 'capabilityId', true)!
    if (
      !(await this.db.packCapability.findFirst({
        where: {
          id: capabilityId,
          OR: [{ tenantId: this.tenant(actor) }, { tenantId: null }],
        },
      }))
    )
      throw new NotFoundException('CAPABILITY_NOT_FOUND');
    const created = await this.db.packFeatureCapability.create({
      data: {
        tenantId: this.tenant(actor),
        featureId,
        capabilityId,
        relationType: this.text(input, 'relationType') ?? 'REQUIRES',
        required: input.required !== false,
        configuration: input.configuration as Prisma.InputJsonValue | undefined,
      },
    });
    await this.invalidate(feature.packVersionId, actor);
    return created;
  }

  async addDependency(versionId: string, input: Input, actor: Actor) {
    compatible('1.0.0', this.text(input, 'targetVersionRange'));
    if (!['REQUIRES','REQUIRED','OPTIONAL','CONFLICTS','CONFLICTS_WITH','RECOMMENDS','IMPLIES'].includes(String(input.dependencyType ?? 'REQUIRED'))) throw new BadRequestException('DEPENDENCY_TYPE_INVALID');
    const version = await this.version(versionId, actor);
    this.mutable(version);
    const created = await this.db.packDependency.create({
      data: {
        tenantId: this.tenant(actor),
        packVersionId: versionId,
        sourceType: this.text(input, 'sourceType', true)!,
        sourceId: this.text(input, 'sourceId', true)!,
        dependencyType: this.text(input, 'dependencyType') ?? 'REQUIRES',
        targetType: this.text(input, 'targetType', true)!,
        targetRef: this.text(input, 'targetRef', true)!,
        targetVersionRange: this.text(input, 'targetVersionRange'),
        required: input.required !== false,
        reason: this.text(input, 'reason'),
        metadata: input.metadata as Prisma.InputJsonValue | undefined,
        createdBy: actor.userId,
      },
    });
    await this.invalidate(versionId, actor);
    return created;
  }

  listDependencies(versionId: string, actor: Actor) {
    return this.version(versionId, actor).then(() =>
      this.db.packDependency.findMany({
        where: {
          tenantId: this.tenant(actor),
          packVersionId: versionId,
          archivedAt: null,
        },
      }),
    );
  }

  async addRule(versionId: string, input: Input, actor: Actor) {
    const version = await this.version(versionId, actor);
    this.mutable(version);
    validateExpression(input.expression);
    if (!['ENABLE','DISABLE','DENY','REQUIRE'].includes(String(input.effect))) throw new BadRequestException('RULE_EFFECT_INVALID');
    if (!input.expression || typeof input.expression !== 'object')
      throw new BadRequestException('RULE_EXPRESSION_INVALID');
    if (invalidRuleField(input.expression))
      throw new BadRequestException('RULE_CONTEXT_FIELD_NOT_ALLOWED');
    const created = await this.db.packRule.create({
      data: {
        tenantId: this.tenant(actor),
        packVersionId: versionId,
        code: this.text(input, 'code', true)!.toLowerCase(),
        name: this.text(input, 'name', true)!,
        ruleType: this.text(input, 'ruleType') ?? 'ACTIVATION',
        targetType: this.text(input, 'targetType', true)!,
        targetId: this.text(input, 'targetId', true)!,
        effect: this.text(input, 'effect', true)!,
        priority: Number(input.priority) || 0,
        enabled: input.enabled !== false,
        expression: input.expression as Prisma.InputJsonValue,
        ruleHash: hash(input.expression),
        createdBy: actor.userId,
      },
    });
    await this.invalidate(versionId, actor);
    return created;
  }

  listRules(versionId: string, actor: Actor) {
    return this.version(versionId, actor).then(() =>
      this.db.packRule.findMany({
        where: {
          tenantId: this.tenant(actor),
          packVersionId: versionId,
          archivedAt: null,
        },
        orderBy: { priority: 'desc' },
      }),
    );
  }

  async validate(id: string, actor: Actor) {
    const version: any = await this.version(id, actor, true);
    this.mutable(version);
    const issues: Array<{
      code: string;
      path: string;
      severity: string;
      message: string;
    }> = [];
    if (!version.modules.some((m: any) => !m.archivedAt && m.enabled))
      issues.push({
        code: 'MODULE_REQUIRED',
        path: 'modules',
        severity: 'ERROR',
        message: 'At least one module is required',
      });
    for (const rule of version.rules)
      if (
        !rule.expression ||
        invalidRuleField(rule.expression) ||
        !['ENABLE', 'DISABLE', 'REQUIRE', 'DENY'].includes(rule.effect)
      )
        issues.push({
          code: 'RULE_INVALID',
          path: `rules.${rule.id}`,
          severity: 'ERROR',
          message: 'Rule expression or effect is invalid',
        });
    issues.push(...await this.publicationDependencies(this.definition(version), actor));
    for (const rule of version.rules.filter((r: any) => !r.archivedAt && r.enabled)) {
      try { validateExpression(rule.expression); } catch { issues.push({ code: 'RULE_INVALID', path: rule.id, severity: 'ERROR', message: 'Expression invalide' }); }
      const resources = rule.targetType === 'MODULE' ? version.modules : version.features;
      if (!resources.some((r: any) => r.id === rule.targetId || r.code === rule.targetId)) issues.push({ code: 'RULE_TARGET_MISSING', path: rule.id, severity: 'ERROR', message: rule.targetId });
    }
    const activeRules = version.rules.filter((r: any) => r.enabled && !r.archivedAt);
    for (const rule of activeRules) if (activeRules.some((other: any) => other.id !== rule.id && other.targetId === rule.targetId && other.priority === rule.priority && other.effect !== rule.effect && hash(other.expression) === hash(rule.expression))) issues.push({ code: 'RULE_CONFLICT', path: rule.id, severity: 'ERROR', message: 'Contradictory effects at the same priority' });
    const status = issues.some((item) => item.severity === 'ERROR')
      ? 'INVALID'
      : 'VALID';
    const snapshotContent = this.definition(version);
    const snapshotHash = hash(snapshotContent);
    return this.transaction(async (tx) => {
      const validation = await tx.packValidation.create({
        data: {
          tenantId: this.tenant(actor),
          packVersionId: id,
          status,
          issues,
          summary: { errorCount: issues.length },
          createdBy: actor.userId,
        },
      });
      if (status === 'VALID')
        await tx.packSnapshot.upsert({
          where: { packVersionId: id },
          create: {
            tenantId: this.tenant(actor),
            packVersionId: id,
            snapshotHash,
            content: snapshotContent as Prisma.InputJsonValue,
          },
          update: {
            snapshotHash,
            content: snapshotContent as Prisma.InputJsonValue,
            createdAt: new Date(),
          },
        });
      await tx.packVersion.update({
        where: { id },
        data: {
          status: status === 'VALID' ? 'READY' : 'DRAFT',
          validationStatus: status,
          validatedAt: new Date(),
          validatedBy: actor.userId,
          snapshotHash: status === 'VALID' ? snapshotHash : null,
          manifestStatus: status === 'VALID' ? 'NOT_GENERATED' : 'INVALID',
          manifestHash: null,
          rowVersion: { increment: 1 },
        },
      });
      await this.audit(
        tx,
        actor,
        'PACK_VERSION',
        id,
        'pack.version.validated',
        { status, issues },
      );
      return validation;
    });
  }

  private definition(version: any) {
    return {
      pack: {
        id: version.pack.id,
        code: version.pack.code,
        name: version.pack.name,
      },
      version: { id: version.id, number: version.versionNumber },
      modules: version.modules
        .filter((item: any) => !item.archivedAt)
        .sort((a: any, b: any) => a.displayOrder - b.displayOrder || a.code.localeCompare(b.code))
        .map((item: any) => ({
          id: item.id,
          code: item.code,
          name: item.name,
          enabled: item.enabled,
          configuration: item.configuration,
        })),
      features: version.features
        .filter((item: any) => !item.archivedAt)
        .sort((a: any,b: any) => String(a.code ?? a.id).localeCompare(String(b.code ?? b.id)))
        .map((item: any) => ({
          id: item.id,
          moduleId: item.moduleId,
          code: item.code,
          name: item.name,
          enabled: item.enabled,
          defaultEnabled: item.defaultEnabled,
          capabilities: [...item.capabilities].sort((a: any,b: any) => a.capability.code.localeCompare(b.capability.code) || a.relationType.localeCompare(b.relationType)).map((link: any) => ({
            code: link.capability.code,
            relationType: link.relationType,
            required: link.required,
          })),
        })),
      dependencies: version.dependencies
        .filter((item: any) => !item.archivedAt)
        .sort((a: any,b: any) => String(a.code ?? a.id).localeCompare(String(b.code ?? b.id)))
        .map((item: any) => ({
          id: item.id,
          sourceType: item.sourceType,
          sourceId: item.sourceId,
          type: item.dependencyType,
          targetVersionRange: item.targetVersionRange,
          targetType: item.targetType,
          targetRef: item.targetRef,
          required: item.required,
        })),
      rules: version.rules
        .filter((item: any) => item.enabled && !item.archivedAt)
        .sort((a: any,b: any) => b.priority-a.priority || a.code.localeCompare(b.code))
        .map((item: any) => ({
          code: item.code,
          targetType: item.targetType,
          targetId: item.targetId,
          effect: item.effect,
          priority: item.priority,
          expression: item.expression,
        })),
    };
  }

  async generateManifest(id: string, actor: Actor) {
    const version: any = await this.version(id, actor, true);
    if (
      version.status !== 'READY' ||
      version.validationStatus !== 'VALID' ||
      !version.snapshot
    )
      throw new ConflictException('PACK_VERSION_NOT_READY');
    const content = {
      contract: 'techzone.pack-manifest',
      contractVersion: '1.0.0',
      tenantId: this.tenant(actor),
      snapshotHash: version.snapshot.snapshotHash,
      generatedAt: version.validatedAt!.toISOString(),
      definition: version.snapshot.content,
    };
    const manifestHash = hash(content);
    const manifest = await this.db.packManifest.upsert({
      where: { packVersionId: id },
      create: {
        tenantId: this.tenant(actor),
        packVersionId: id,
        manifestHash,
        status: 'VALID',
        content,
      },
      update: { manifestHash, status: 'VALID', content, createdAt: new Date() },
    });
    await this.db.packVersion.update({
      where: { id },
      data: { manifestHash, manifestStatus: 'VALID' },
    });
    return manifest;
  }

  async publish(id: string, actor: Actor) {
    return this.transaction(
      async (tx) => {
        const version = await tx.packVersion.findFirst({
          where: { id, tenantId: this.tenant(actor) },
          include: { snapshot: true, manifest: true },
        });
        if (!version) throw new NotFoundException('PACK_VERSION_NOT_FOUND');
        if (version.status === 'PUBLISHED') return version;
        if (
          version.status !== 'READY' ||
          version.validationStatus !== 'VALID' ||
          version.manifestStatus !== 'VALID' ||
          !version.snapshot ||
          !version.manifest ||
          !version.snapshotHash ||
          !version.manifestHash
        )
          throw new ConflictException('PACK_VERSION_PUBLICATION_BLOCKED');
        if (hash(version.snapshot.content) !== version.snapshotHash || version.manifest.manifestHash !== version.manifestHash || hash(version.manifest.content) !== version.manifestHash)
          throw new ConflictException('PACK_MANIFEST_HASH_INVALID');
        const currentDefinition = this.definition(await this.version(id, actor, true));
        if (hash(currentDefinition) !== version.snapshotHash) throw new ConflictException('PACK_VALIDATION_OUTDATED');
        const dependencies = await this.publicationDependencies(currentDefinition,actor);
        if (dependencies.length) throw new ConflictException('PACK_DEPENDENCIES_CHANGED');
        const parent = await tx.pack.findFirst({ where: { id: version.packId, tenantId: this.tenant(actor), archivedAt: null } });
        if (!parent) throw new ConflictException('PACK_ARCHIVED');
        const now = new Date();
        await tx.pack.update({ where: { id: version.packId }, data: { status: 'ACTIVE' } });
        const published = await tx.packVersion.update({
          where: { id },
          data: {
            status: 'PUBLISHED',
            publishedAt: now,
            publishedBy: actor.userId,
            rowVersion: { increment: 1 },
          },
        });
        await tx.packManifest.update({
          where: { packVersionId: id },
          data: { status: 'PUBLISHED', publishedAt: now },
        });
        await tx.outboxEvent.create({
          data: {
            eventType: 'pack.version.published',
            aggregateType: 'PACK_VERSION',
            aggregateId: id,
            payload: { tenantId: this.tenant(actor), packVersionId: id, manifestHash: version.manifestHash },
          },
        });
        await this.audit(
          tx,
          actor,
          'PACK_VERSION',
          id,
          'pack.version.published',
          { manifestHash: version.manifestHash },
        );
        return published;
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
  }

  async publishedVersions(actor: Actor) {
    const versions = await this.db.packVersion.findMany({ where: { tenantId: this.tenant(actor), status: 'PUBLISHED', pack: { archivedAt: null } }, include: { pack: true }, orderBy: { publishedAt: 'desc' } });
    return versions.map(v => ({ id: v.id, packId: v.packId, code: v.pack.code, name: v.pack.name, versionNumber: v.versionNumber, manifestHash: v.manifestHash }));
  }

  async publicationDependencies(definition: any, actor: Actor) {
    const publications = await this.publishedVersions(actor);
    const issues: any[] = [];
    const completed = new Set<string>();
    const visiting = new Set<string>();
    const visit = async (current: any, depth: number) => {
      const key = current.pack.code + '@' + current.version.number;
      if (depth > 16 || visiting.has(key)) { issues.push({ code:'PACK_DEPENDENCY_CYCLE_OR_DEPTH',path:key,severity:'ERROR',message:key }); return; }
      if (completed.has(key)) return;
      visiting.add(key);
      issues.push(...dependencyIssues(current,publications));
      for (const dependency of current.dependencies) {
        if (dependency.targetType !== 'PACK' || !['REQUIRED','REQUIRES','IMPLIES'].includes(dependency.type) || dependency.required === false) continue;
        const candidate = publications.filter(p => p.code === dependency.targetRef && compatible(p.versionNumber,dependency.targetVersionRange)).sort((a,b) => rcompare(a.versionNumber,b.versionNumber))[0];
        if (candidate) { const manifest = await this.publishedManifest(candidate.code,candidate.versionNumber,actor); await visit(manifest.definition,depth+1); }
      }
      visiting.delete(key); completed.add(key);
    };
    await visit(definition,0);
    return issues;
  }

  async updateCapability(id: string, input: Input, actor: Actor) {
    const capability = await this.db.packCapability.findFirst({ where: { id,tenantId:this.tenant(actor) },include:{ features:{ include:{ feature:{ include:{ packVersion:true } } } } } });
    if (!capability) throw new NotFoundException('CAPABILITY_NOT_FOUND');
    if (input.updatedAt !== capability.updatedAt.toISOString()) throw new ConflictException('CAPABILITY_VERSION_CONFLICT');
    for (const link of capability.features) this.mutable(link.feature.packVersion);
    const updated = await this.db.packCapability.update({ where:{ id,updatedAt:capability.updatedAt },data:{ name:this.text(input,'name'),description:this.text(input,'description'),contractRef:this.text(input,'contractRef'),contractVersion:this.text(input,'contractVersion'),status:input.archived === true ? 'ARCHIVED' : undefined } });
    for (const versionId of new Set(capability.features.map(link => link.feature.packVersionId))) await this.invalidate(versionId,actor);
    return updated;
  }

  async duplicatePack(id: string, input: Input, actor: Actor) {
    const source = await this.getPack(id,actor);
    return this.createPack({ code:input.code,name:input.name,description:input.description ?? source.description,metadata:source.metadata,sourceType:'CUSTOM' },actor);
  }

  /** Contract boundary: Runtime consumes this publication, never PM authoring tables. */
  async publishedManifest(code: string, versionNumber: string, actor: Actor) {
    const item = await this.db.packManifest.findFirst({ where: { tenantId: this.tenant(actor), status: 'PUBLISHED', packVersion: { versionNumber, status: 'PUBLISHED', pack: { code, archivedAt: null } } } });
    if (!item) throw new NotFoundException('PUBLISHED_PACK_MANIFEST_NOT_FOUND');
    const content = item.content as any;
    if (item.contractVersion !== '1.0.0' || content.contract !== 'techzone.pack-manifest' || content.tenantId !== actor.tenantId) throw new ConflictException('PACK_CONTRACT_INCOMPATIBLE');
    if (hash(content) !== item.manifestHash) throw new ConflictException('PACK_MANIFEST_HASH_INVALID');
    publicJson(content);
    return { id: item.id, packVersionId: item.packVersionId, hash: item.manifestHash, definition: content.definition };
  }

  async updateResource(kind: string, id: string, input: Input, actor: Actor) {
    const delegates = { modules: this.db.packModule, features: this.db.packFeature, dependencies: this.db.packDependency, rules: this.db.packRule };
    const delegate = Object.hasOwn(delegates,kind) ? delegates[kind as keyof typeof delegates] as any : null;
    if (!delegate) throw new BadRequestException('RESOURCE_TYPE_INVALID');
    const current = await delegate.findFirst({ where: { id, tenantId: this.tenant(actor) } });
    if (!current) throw new NotFoundException('RESOURCE_NOT_FOUND');
    this.mutable(await this.version(current.packVersionId, actor));
    if (Number(input.rowVersion) !== current.rowVersion) throw new ConflictException('RESOURCE_VERSION_CONFLICT');
    const fields = {
      modules: ['name', 'description', 'enabled', 'displayOrder', 'configuration'],
      features: ['name', 'description', 'enabled', 'defaultEnabled', 'configuration'],
      dependencies: ['dependencyType', 'targetVersionRange', 'required', 'reason'],
      rules: ['name', 'effect', 'priority', 'enabled', 'expression'],
    }[kind]!;
    const data: any = {};
    for (const key of fields) if (input[key] !== undefined) {
      if (['enabled','defaultEnabled','required'].includes(key) && typeof input[key] !== 'boolean') throw new BadRequestException('BOOLEAN_REQUIRED');
      if (['priority','displayOrder'].includes(key) && !Number.isSafeInteger(input[key])) throw new BadRequestException('INTEGER_REQUIRED');
      data[key] = input[key];
    }
    if (kind === 'rules' && data.expression) { validateExpression(data.expression); data.ruleHash = hash(data.expression); }
    if (kind === 'dependencies') compatible('1.0.0', (data.targetVersionRange ?? current.targetVersionRange) as string);
    if (input.archived === true) data.archivedAt = new Date();
    if (input.archived === false) data.archivedAt = null;
    const result = await delegate.update({ where: { id, rowVersion: current.rowVersion }, data: { ...data, updatedBy: actor.userId, rowVersion: { increment: 1 } } });
    await this.invalidate(current.packVersionId, actor);
    await this.audit(this.db as any, actor, kind, id, 'pack.resource.updated', { fields: Object.keys(data) });
    return result;
  }

  async cloneVersion(id: string, input: Input, actor: Actor) {
    const source: any = await this.version(id, actor, true);
    const target = await this.createVersion(source.packId, { ...input, sourceVersionId: id }, actor);
    const ids = new Map<string, string>();
    for (const m of source.modules.filter((m: any) => !m.archivedAt)) {
      const copy = await this.addModule(target.id, m, actor); ids.set(m.id, copy.id);
    }
    for (const f of source.features.filter((f: any) => !f.archivedAt)) {
      const copy = await this.addFeature(target.id, { ...f, moduleId: ids.get(f.moduleId) }, actor); ids.set(f.id, copy.id);
      for (const c of f.capabilities) await this.attachCapability(copy.id, c, actor);
    }
    for (const d of source.dependencies.filter((d: any) => !d.archivedAt)) await this.addDependency(target.id, { ...d, sourceId: ids.get(d.sourceId) ?? d.sourceId, targetRef: ids.get(d.targetRef) ?? d.targetRef }, actor);
    for (const r of source.rules.filter((r: any) => !r.archivedAt)) await this.addRule(target.id, { ...r, targetId: ids.get(r.targetId) ?? r.targetId }, actor);
    await this.audit(this.db as any, actor, 'PACK_VERSION', target.id, 'pack.version.cloned', { sourceVersionId: id });
    return this.getVersion(target.id, actor);
  }

  async compareVersions(id: string, otherId: string, actor: Actor) {
    const a = this.definition(await this.version(id, actor, true));
    const b = this.definition(await this.version(otherId, actor, true));
    return { sourceHash: hash(a), targetHash: hash(b), changes: (['modules','features','dependencies','rules'] as const).map(section => ({ section, changed: hash(a[section]) !== hash(b[section]), before: a[section], after: b[section] })) };
  }

  async getValidation(id: string, actor: Actor) {
    await this.version(id, actor);
    return this.db.packValidation.findFirst({
      where: { tenantId: this.tenant(actor), packVersionId: id },
      orderBy: { createdAt: 'desc' },
    });
  }
  async getManifest(id: string, actor: Actor) {
    await this.version(id, actor);
    const item = await this.db.packManifest.findFirst({
      where: { tenantId: this.tenant(actor), packVersionId: id },
    });
    if (!item) throw new NotFoundException('PACK_MANIFEST_NOT_FOUND');
    return item;
=======
/**
 * Pack Manager — service applicatif (PM-CDC-00 → PM-CDC-07).
 *
 * Domaines couverts :
 * - packs (CRUD, archivage, restauration, duplication)        — PM-CDC-02
 * - versions (création, clonage, lifecycle, immutabilité)     — PM-CDC-03
 * - modules / features / capabilities (+ relations réelles)   — PM-CDC-04/05
 * - dépendances (targets pack/module/feature/capability)      — PM-CDC-06
 * - règles déclaratives (JSON structuré, aucun eval)          — PM-CDC-07
 * - validation (checks réels) + snapshot + manifest + publish — PM-CDC-00 §18/20/14
 *
 * Isolation tenant : chaque requête reçoit `tenantId` du principal IAM
 * (jamais du navigateur) et l'injecte dans toutes les lectures/écritures.
 */
import { HttpStatus, Injectable } from '@nestjs/common';
import { createHash } from 'node:crypto';

import { PrismaService } from '../../prisma/prisma.service';
import { PmException, pmError } from './pm.exception';
import { PM, PM_IMMUTABLE_VERSION_STATUSES } from './pm.constants';

/** Forme complète d'une version avec ses relations (utilisée par validation/manifest/publish). */
type VersionFull = Awaited<ReturnType<PrismaService['pmPackVersion']['findFirst']>> & {
  pack?: { id: string; code: string; name: string; status: string } | null;
  modules: Array<{ id: string; code: string; name: string; enabled: boolean; orderIndex: number }>;
  features: Array<{ id: string; code: string; enabled: boolean; capabilities: Array<{ capabilityId: string }> }>;
  capabilities: Array<{ id: string; code: string; required: boolean }>;
  dependencies: Array<{ id: string; type: string; targetType: string; targetCode: string; versionRange: string | null; targetPackId: string | null }>;
  rules: Array<{ id: string; code: string; type: string; effect: string; priority: number; conditions: unknown; moduleId: string | null }>;
};

/** Forme du contenu d'un manifest tel que sérialisé (usage outbox). */
interface ManifestContent {
  pack?: { code?: string; version?: string };
}

const VERSION_WITH_RELATIONS = {
  modules: { include: { features: { include: { feature: true } } } },
  features: { include: { capabilities: { include: { capability: true } }, moduleLinks: true } },
  capabilities: true,
  dependencies: true,
  rules: { orderBy: [{ priority: 'asc' as const }, { code: 'asc' as const }] },
} satisfies Record<string, unknown>;

function sha256(value: string): string {
  return `sha256:${createHash('sha256').update(value).digest('hex')}`;
}

/** Version SemVer stricte MAJOR.MINOR.PATCH (PM-CDC-03 §6). */
const SEMVER = /^\d+\.\d+\.\d+$/;

interface ConditionNode {
  field?: string;
  operator?: string;
  value?: unknown;
  all?: ConditionNode[];
  any?: ConditionNode[];
}

const RULE_OPERATORS = new Set([
  'equals', 'not_equals', 'in', 'not_in', 'exists', 'gt', 'gte', 'lt', 'lte',
]);

@Injectable()
export class PackManagerService {
  constructor(private readonly prisma: PrismaService) {}

  // ------------------------------------------------------------------
  // PM-CDC-02 — Packs
  // ------------------------------------------------------------------

  async listPacks(tenantId: string | null, query: { search?: string; status?: string; category?: string; includeArchived?: boolean }) {
    const where: Record<string, unknown> = { tenantId };
    if (query.status) where.status = query.status;
    if (query.category) where.category = query.category;
    if (!query.includeArchived) where.archivedAt = null;
    if (query.search) {
      where.OR = [
        { code: { contains: query.search, mode: 'insensitive' } },
        { name: { contains: query.search, mode: 'insensitive' } },
        { description: { contains: query.search, mode: 'insensitive' } },
      ];
    }
    return this.prisma.pmPack.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
      include: {
        versions: { orderBy: { createdAt: 'desc' }, take: 1 },
        _count: { select: { versions: true } },
      },
    });
  }

  async getPack(tenantId: string | null, packId: string) {
    const pack = await this.prisma.pmPack.findFirst({
      where: { id: packId, tenantId },
      include: {
        versions: { orderBy: { createdAt: 'desc' } },
        dependenciesIn: true,
      },
    });
    if (!pack) throw pmError.packNotFound(packId);
    return pack;
  }

  async createPack(tenantId: string | null, dto: { code: string; name: string; shortName?: string; description?: string; category?: string; iconKey?: string; sourceType?: string }) {
    const code = dto.code?.trim();
    if (!code || !/^[a-z0-9][a-z0-9-_.]{1,98}$/.test(code)) {
      throw new PmException('PACK_NOT_FOUND', 'Code de pack invalide (minuscules, chiffres, tirets).', HttpStatus.UNPROCESSABLE_ENTITY, { field: 'code' });
    }
    const existing = await this.prisma.pmPack.findFirst({
      where: { tenantId, code },
    });
    if (existing) throw pmError.packCodeExists(code);
    const sourceType = (['INTERNAL', 'IMPORTED', 'TEMPLATE'] as const).includes(dto.sourceType as never)
      ? (dto.sourceType as 'INTERNAL' | 'IMPORTED' | 'TEMPLATE')
      : 'INTERNAL';
    const pack = await this.prisma.pmPack.create({
      data: {
        code,
        name: dto.name?.trim() || code,
        shortName: dto.shortName,
        description: dto.description,
        category: dto.category,
        iconKey: dto.iconKey,
        sourceType,
        tenantId,
      },
    });
    await this.audit({ tenantId, packId: pack.id, action: 'pack.created', actor: null });
    return pack;
  }

  async updatePack(tenantId: string | null, packId: string, dto: { name?: string; shortName?: string; description?: string; category?: string; iconKey?: string; rowVersion?: number; status?: string }) {
    const pack = await this.ownPack(tenantId, packId);
    if (dto.rowVersion !== undefined && dto.rowVersion !== pack.rowVersion) throw pmError.versionConflict(pack.id);
    const data: Record<string, unknown> = {};
    for (const key of ['name', 'shortName', 'description', 'category', 'iconKey'] as const) {
      if (dto[key] !== undefined) data[key] = dto[key];
    }
    if (dto.status && ['ACTIVE', 'SUSPENDED', 'DEPRECATED', 'ARCHIVED', 'DRAFT'].includes(dto.status)) data.status = dto.status;
    const updated = await this.prisma.pmPack.update({
      where: { id: pack.id },
      data: { ...data, rowVersion: { increment: 1 } },
    });
    await this.audit({ tenantId, packId: pack.id, action: 'pack.updated', actor: null, details: data });
    return updated;
  }

  async archivePack(tenantId: string | null, packId: string) {
    const pack = await this.ownPack(tenantId, packId);
    const archived = await this.prisma.pmPack.update({
      where: { id: pack.id },
      data: { status: 'ARCHIVED', archivedAt: new Date() },
    });
    await this.audit({ tenantId, packId: pack.id, action: 'pack.archived', actor: null });
    return archived;
  }

  async restorePack(tenantId: string | null, packId: string) {
    const pack = await this.ownPack(tenantId, packId);
    const restored = await this.prisma.pmPack.update({
      where: { id: pack.id },
      data: { status: 'ACTIVE', archivedAt: null },
    });
    await this.audit({ tenantId, packId: pack.id, action: 'pack.restored', actor: null });
    return restored;
  }

  async duplicatePack(tenantId: string | null, packId: string) {
    const pack = await this.getPack(tenantId, packId);
    const suffix = Date.now().toString(36);
    const created = await this.createPack(tenantId, {
      code: `${pack.code}-copy-${suffix}`.slice(0, 100),
      name: `${pack.name} (copie)`,
      description: pack.description ?? undefined,
      category: pack.category ?? undefined,
      iconKey: pack.iconKey ?? undefined,
    });
    return created;
  }

  // ------------------------------------------------------------------
  // PM-CDC-03 — Versions
  // ------------------------------------------------------------------

  async listVersions(tenantId: string | null, packId: string) {
    const pack = await this.ownPack(tenantId, packId);
    return this.prisma.pmPackVersion.findMany({
      where: { packId: pack.id, tenantId },
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { modules: true, features: true, capabilities: true, dependencies: true, rules: true } } },
    });
  }

  async getVersion(tenantId: string | null, versionId: string) {
    const version = (await this.prisma.pmPackVersion.findFirst({
      where: { id: versionId, tenantId },
      include: { pack: true, ...VERSION_WITH_RELATIONS } as never,
    })) as VersionFull | null;
    if (!version) throw pmError.versionNotFound(versionId);
    return version;
  }

  async createVersion(
    tenantId: string | null,
    packId: string,
    dto: { versionNumber: string; label?: string; description?: string; releaseNotes?: string; sourceVersionId?: string },
  ) {
    const pack = await this.ownPack(tenantId, packId);
    const versionNumber = dto.versionNumber?.trim();
    if (!SEMVER.test(versionNumber ?? '')) {
      throw new PmException('PACK_VERSION_CONFLICT', 'Numéro de version invalide : SemVer MAJOR.MINOR.PATCH requis.', HttpStatus.UNPROCESSABLE_ENTITY, { field: 'versionNumber' });
    }
    const exists = await this.prisma.pmPackVersion.findUnique({
      where: { packId_versionNumber: { packId: pack.id, versionNumber } },
    });
    if (exists) throw pmError.versionNumberTaken(versionNumber);

    const version = await this.prisma.pmPackVersion.create({
      data: {
        packId: pack.id,
        versionNumber,
        label: dto.label,
        description: dto.description,
        releaseNotes: dto.releaseNotes,
        sourceVersionId: dto.sourceVersionId,
        tenantId,
      },
    });

    // Clonage : copie des éléments d'une version source (PM-CDC-03 §12).
    if (dto.sourceVersionId) {
      const source = await this.getVersion(tenantId, dto.sourceVersionId);
      await this.cloneVersionContent(version.id, source.id, tenantId);
    }
    await this.audit({ tenantId, packId: pack.id, versionId: version.id, action: 'pack.version.created', actor: null });
    return this.getVersion(tenantId, version.id);
  }

  private async cloneVersionContent(targetVersionId: string, sourceVersionId: string, tenantId: string | null) {
    const source = await this.prisma.pmPackVersion.findFirst({
      where: { id: sourceVersionId, tenantId },
      include: {
        modules: { include: { features: { include: { feature: true } } } },
        features: { include: { capabilities: { include: { capability: true } } } },
        capabilities: true,
        dependencies: true,
        rules: true,
      },
    });
    if (!source) throw pmError.versionNotFound(sourceVersionId);

    const featureIdMap = new Map<string, string>();
    const capabilityIdMap = new Map<string, string>();
    const moduleIdMap = new Map<string, string>();

    for (const capability of source.capabilities) {
      const created = await this.prisma.pmCapability.create({
        data: {
          versionId: targetVersionId,
          code: capability.code,
          name: capability.name,
          description: capability.description,
          required: capability.required,
          metadata: capability.metadata ?? undefined,
          tenantId,
        },
      });
      capabilityIdMap.set(capability.id, created.id);
    }
    for (const feature of source.features) {
      const created = await this.prisma.pmFeature.create({
        data: {
          versionId: targetVersionId,
          code: feature.code,
          name: feature.name,
          description: feature.description,
          enabled: feature.enabled,
          metadata: feature.metadata ?? undefined,
          tenantId,
        },
      });
      featureIdMap.set(feature.id, created.id);
      for (const link of feature.capabilities) {
        const capabilityId = capabilityIdMap.get(link.capabilityId);
        if (capabilityId) {
          await this.prisma.pmFeatureCapability.create({
            data: { featureId: created.id, capabilityId, required: link.required, tenantId },
          });
        }
      }
    }
    for (const module of source.modules) {
      const created = await this.prisma.pmModule.create({
        data: {
          versionId: targetVersionId,
          code: module.code,
          name: module.name,
          description: module.description,
          enabled: module.enabled,
          orderIndex: module.orderIndex,
          config: module.config ?? undefined,
          tenantId,
        },
      });
      moduleIdMap.set(module.id, created.id);
      for (const link of module.features) {
        const featureId = featureIdMap.get(link.featureId);
        if (featureId) {
          await this.prisma.pmModuleFeature.create({ data: { moduleId: created.id, featureId, tenantId } });
        }
      }
    }
    for (const dependency of source.dependencies) {
      await this.prisma.pmDependency.create({
        data: {
          versionId: targetVersionId,
          targetType: dependency.targetType,
          targetPackId: dependency.targetPackId,
          targetCode: dependency.targetCode,
          versionRange: dependency.versionRange,
          type: dependency.type,
          metadata: dependency.metadata ?? undefined,
          tenantId,
        },
      });
    }
    for (const rule of source.rules) {
      await this.prisma.pmRule.create({
        data: {
          versionId: targetVersionId,
          code: rule.code,
          name: rule.name,
          type: rule.type,
          description: rule.description,
          conditions: rule.conditions as never,
          effect: rule.effect,
          priority: rule.priority,
          enabled: rule.enabled,
          moduleId: rule.moduleId ? moduleIdMap.get(rule.moduleId) ?? null : null,
          tenantId,
        },
      });
    }
  }

  /** Transition de statut contrôlée (PM-CDC-03 §8/9). */
  async transitionVersion(tenantId: string | null, versionId: string, target: string) {
    const version = await this.ownVersion(tenantId, versionId);
    if (PM_IMMUTABLE_VERSION_STATUSES.has(version.status)) throw pmError.versionImmutable(version.id);
    const allowed: Record<string, string[]> = {
      DRAFT: ['CONFIGURING', 'ARCHIVED'],
      CONFIGURING: ['VALIDATING', 'DRAFT', 'ARCHIVED'],
      VALIDATING: ['READY', 'CONFIGURING', 'INVALID', 'ERROR', 'ARCHIVED'],
      READY: ['PUBLISHED', 'VALIDATING', 'ARCHIVED'],
      INVALID: ['CONFIGURING', 'ARCHIVED'],
      ERROR: ['CONFIGURING', 'ARCHIVED'],
      PUBLISHED: [],
    };
    const targets = allowed[version.status] ?? [];
    if (!targets.includes(target)) {
      throw new PmException(
        'PACK_VERSION_CONFLICT',
        `Transition ${version.status} → ${target} non autorisée.`,
        HttpStatus.CONFLICT,
        { expected: targets.join(', ') || 'aucune' },
      );
    }
    if (target === 'PUBLISHED') return this.publishVersion(tenantId, versionId);
    if (target === 'READY') {
      // Passage à READY : validation fraîche et valide exigée (PM-CDC-03 §24).
      if (version.validationStatus !== 'VALID') {
        throw pmError.publicationDenied('La validation doit être VALID avant le passage à READY.');
      }
    }
    return this.prisma.pmPackVersion.update({ where: { id: version.id }, data: { status: target as never } });
  }

  // ------------------------------------------------------------------
  // PM-CDC-04/05 — Modules, Features, Capabilities
  // ------------------------------------------------------------------

  async listModules(tenantId: string | null, versionId: string) {
    await this.ownVersion(tenantId, versionId);
    return this.prisma.pmModule.findMany({
      where: { versionId, tenantId },
      orderBy: { orderIndex: 'asc' },
      include: { features: { include: { feature: true } } },
    });
  }

  async createModule(tenantId: string | null, versionId: string, dto: { code: string; name: string; description?: string; orderIndex?: number; config?: unknown }) {
    await this.assertMutable(tenantId, versionId);
    try {
      const created = await this.prisma.pmModule.create({
        data: {
          versionId,
          code: dto.code?.trim(),
          name: dto.name?.trim() || dto.code,
          description: dto.description,
          orderIndex: dto.orderIndex ?? 0,
          config: (dto.config ?? undefined) as never,
          tenantId,
        },
      });
      await this.touchVersion(versionId);
      return created;
    } catch {
      throw new PmException('PACK_VERSION_CONFLICT', 'Code module déjà utilisé dans cette version.', HttpStatus.CONFLICT, { field: 'code' });
    }
  }

  async updateModule(tenantId: string | null, moduleId: string, dto: { name?: string; description?: string; enabled?: boolean; orderIndex?: number; config?: unknown }) {
    const module = await this.ownModule(tenantId, moduleId);
    await this.assertMutable(tenantId, module.versionId);
    const updated = await this.prisma.pmModule.update({ where: { id: module.id }, data: dto as never });
    await this.touchVersion(module.versionId);
    return updated;
  }

  async deleteModule(tenantId: string | null, moduleId: string) {
    const module = await this.ownModule(tenantId, moduleId);
    await this.assertMutable(tenantId, module.versionId);
    await this.prisma.pmModule.delete({ where: { id: module.id } });
    await this.touchVersion(module.versionId);
    return { deleted: true };
  }

  async listFeatures(tenantId: string | null, versionId: string) {
    await this.ownVersion(tenantId, versionId);
    return this.prisma.pmFeature.findMany({
      where: { versionId, tenantId },
      orderBy: { code: 'asc' },
      include: {
        capabilities: { include: { capability: true } },
        moduleLinks: { include: { module: true } },
      },
    });
  }

  async createFeature(tenantId: string | null, versionId: string, dto: { code: string; name: string; description?: string; enabled?: boolean }) {
    await this.assertMutable(tenantId, versionId);
    try {
      const created = await this.prisma.pmFeature.create({
        data: {
          versionId,
          code: dto.code?.trim(),
          name: dto.name?.trim() || dto.code,
          description: dto.description,
          enabled: dto.enabled ?? true,
          tenantId,
        },
      });
      await this.touchVersion(versionId);
      return created;
    } catch {
      throw new PmException('PACK_VERSION_CONFLICT', 'Code feature déjà utilisé dans cette version.', HttpStatus.CONFLICT, { field: 'code' });
    }
  }

  async updateFeature(tenantId: string | null, featureId: string, dto: { name?: string; description?: string; enabled?: boolean }) {
    const feature = await this.ownFeature(tenantId, featureId);
    await this.assertMutable(tenantId, feature.versionId);
    const updated = await this.prisma.pmFeature.update({ where: { id: feature.id }, data: dto as never });
    await this.touchVersion(feature.versionId);
    return updated;
  }

  async deleteFeature(tenantId: string | null, featureId: string) {
    const feature = await this.ownFeature(tenantId, featureId);
    await this.assertMutable(tenantId, feature.versionId);
    await this.prisma.pmFeature.delete({ where: { id: feature.id } });
    await this.touchVersion(feature.versionId);
    return { deleted: true };
  }

  async listCapabilities(tenantId: string | null, versionId: string) {
    await this.ownVersion(tenantId, versionId);
    return this.prisma.pmCapability.findMany({
      where: { versionId, tenantId },
      orderBy: { code: 'asc' },
      include: { featureLinks: { include: { feature: true } } },
    });
  }

  async createCapability(tenantId: string | null, versionId: string, dto: { code: string; name: string; description?: string; required?: boolean }) {
    await this.assertMutable(tenantId, versionId);
    try {
      const created = await this.prisma.pmCapability.create({
        data: {
          versionId,
          code: dto.code?.trim(),
          name: dto.name?.trim() || dto.code,
          description: dto.description,
          required: dto.required ?? false,
          tenantId,
        },
      });
      await this.touchVersion(versionId);
      return created;
    } catch {
      throw new PmException('PACK_VERSION_CONFLICT', 'Code capability déjà utilisé dans cette version.', HttpStatus.CONFLICT, { field: 'code' });
    }
  }

  async linkFeatureToModule(tenantId: string | null, versionId: string, dto: { featureId: string; moduleId: string }) {
    await this.assertMutable(tenantId, versionId);
    const feature = await this.ownFeature(tenantId, dto.featureId);
    if (feature.versionId !== versionId) throw pmError.versionNotFound(dto.featureId);
    const module = await this.ownModule(tenantId, dto.moduleId);
    if (module.versionId !== versionId) throw pmError.versionNotFound(dto.moduleId);
    const link = await this.prisma.pmModuleFeature.upsert({
      where: { moduleId_featureId: { moduleId: module.id, featureId: feature.id } },
      create: { moduleId: module.id, featureId: feature.id, tenantId },
      update: {},
    });
    await this.touchVersion(versionId);
    return link;
  }

  async unlinkFeatureFromModule(tenantId: string | null, versionId: string, linkId: string) {
    await this.assertMutable(tenantId, versionId);
    const link = await this.prisma.pmModuleFeature.findFirst({ where: { id: linkId, tenantId } });
    if (!link) throw new PmException('PACK_NOT_FOUND', 'Liaison module/feature introuvable.', HttpStatus.NOT_FOUND, { id: linkId });
    await this.prisma.pmModuleFeature.delete({ where: { id: link.id } });
    await this.touchVersion(versionId);
    return { deleted: true };
  }

  async linkCapabilityToFeature(tenantId: string | null, versionId: string, dto: { featureId: string; capabilityId: string; required?: boolean }) {
    await this.assertMutable(tenantId, versionId);
    const feature = await this.ownFeature(tenantId, dto.featureId);
    if (feature.versionId !== versionId) throw pmError.versionNotFound(dto.featureId);
    const capability = await this.ownCapability(tenantId, dto.capabilityId);
    if (capability.versionId !== versionId) throw pmError.versionNotFound(dto.capabilityId);
    const link = await this.prisma.pmFeatureCapability.upsert({
      where: { featureId_capabilityId: { featureId: feature.id, capabilityId: capability.id } },
      create: { featureId: feature.id, capabilityId: capability.id, required: dto.required ?? true, tenantId },
      update: { required: dto.required ?? true },
    });
    await this.touchVersion(versionId);
    return link;
  }

  async unlinkCapabilityFromFeature(tenantId: string | null, versionId: string, linkId: string) {
    await this.assertMutable(tenantId, versionId);
    const link = await this.prisma.pmFeatureCapability.findFirst({ where: { id: linkId, tenantId } });
    if (!link) throw new PmException('PACK_NOT_FOUND', 'Liaison feature/capability introuvable.', HttpStatus.NOT_FOUND, { id: linkId });
    await this.prisma.pmFeatureCapability.delete({ where: { id: link.id } });
    await this.touchVersion(versionId);
    return { deleted: true };
  }

  // ------------------------------------------------------------------
  // PM-CDC-06 — Dépendances
  // ------------------------------------------------------------------

  async listDependencies(tenantId: string | null, versionId: string) {
    await this.ownVersion(tenantId, versionId);
    return this.prisma.pmDependency.findMany({
      where: { versionId, tenantId },
      orderBy: { createdAt: 'asc' },
      include: { targetPack: { select: { id: true, code: true, name: true, status: true } } },
    });
  }

  async createDependency(
    tenantId: string | null,
    versionId: string,
    dto: { targetType: string; targetCode: string; versionRange?: string; type?: string; targetPackId?: string },
  ) {
    await this.assertMutable(tenantId, versionId);
    const targetTypes = ['PACK', 'MODULE', 'FEATURE', 'CAPABILITY'];
    const depTypes = ['REQUIRED', 'OPTIONAL', 'CONFLICTS_WITH', 'RECOMMENDS', 'IMPLIES'];
    if (!targetTypes.includes(dto.targetType)) {
      throw new PmException('PACK_DEPENDENCY_MISSING', 'Type de cible invalide.', HttpStatus.UNPROCESSABLE_ENTITY, { field: 'targetType' });
    }
    if (!depTypes.includes(dto.type ?? 'REQUIRED')) {
      throw new PmException('PACK_DEPENDENCY_MISSING', 'Type de dépendance invalide.', HttpStatus.UNPROCESSABLE_ENTITY, { field: 'type' });
    }
    if (!dto.targetCode?.trim()) {
      throw new PmException('PACK_DEPENDENCY_MISSING', 'Code cible requis.', HttpStatus.UNPROCESSABLE_ENTITY, { field: 'targetCode' });
    }
    // Résolution du pack cible pour les dépendances de type PACK.
    let targetPackId: string | null = dto.targetPackId ?? null;
    if (dto.targetType === 'PACK' && !targetPackId) {
      const target = await this.prisma.pmPack.findFirst({ where: { code: dto.targetCode, tenantId } });
      targetPackId = target?.id ?? null;
    }
    // Cycle direct interdit : un pack ne peut pas dépendre de lui-même.
    const version = await this.ownVersion(tenantId, versionId);
    if (dto.targetType === 'PACK' && targetPackId === version.packId) {
      throw new PmException('PACK_DEPENDENCY_CYCLE', 'Un pack ne peut pas dépendre de lui-même.', HttpStatus.CONFLICT);
    }
    const created = await this.prisma.pmDependency.create({
      data: {
        versionId,
        targetType: dto.targetType as never,
        targetPackId,
        targetCode: dto.targetCode.trim(),
        versionRange: dto.versionRange,
        type: (dto.type ?? 'REQUIRED') as never,
        tenantId,
      },
    });
    await this.touchVersion(versionId);
    await this.audit({ tenantId, packId: version.packId, versionId, action: 'pack.dependency.created', actor: null, details: { code: dto.targetCode } });
    return created;
  }

  async deleteDependency(tenantId: string | null, versionId: string, dependencyId: string) {
    await this.assertMutable(tenantId, versionId);
    const dep = await this.prisma.pmDependency.findFirst({ where: { id: dependencyId, versionId, tenantId } });
    if (!dep) throw new PmException('PACK_DEPENDENCY_MISSING', 'Dépendance introuvable.', HttpStatus.NOT_FOUND, { id: dependencyId });
    await this.prisma.pmDependency.delete({ where: { id: dep.id } });
    await this.touchVersion(versionId);
    return { deleted: true };
  }

  // ------------------------------------------------------------------
  // PM-CDC-07 — Règles & Conditions
  // ------------------------------------------------------------------

  async listRules(tenantId: string | null, versionId: string) {
    await this.ownVersion(tenantId, versionId);
    return this.prisma.pmRule.findMany({
      where: { versionId, tenantId },
      orderBy: [{ priority: 'asc' }, { code: 'asc' }],
      include: { module: { select: { id: true, code: true, name: true } } },
    });
  }

  async createRule(
    tenantId: string | null,
    versionId: string,
    dto: { code: string; name: string; type?: string; description?: string; conditions: ConditionNode; effect?: string; priority?: number; moduleId?: string },
  ) {
    await this.assertMutable(tenantId, versionId);
    const error = this.validateConditionTree(dto.conditions);
    if (error) {
      throw new PmException('PACK_MANIFEST_INVALID', `Règle invalide : ${error}`, HttpStatus.UNPROCESSABLE_ENTITY, { field: 'conditions' });
    }
    const ruleTypes = ['ACTIVATION', 'AVAILABILITY', 'CONSTRAINT'];
    const ruleType = ruleTypes.includes(dto.type ?? 'ACTIVATION') ? (dto.type as never) : 'ACTIVATION';
    try {
      const created = await this.prisma.pmRule.create({
        data: {
          versionId,
          code: dto.code?.trim(),
          name: dto.name?.trim() || dto.code,
          type: ruleType,
          description: dto.description,
          conditions: dto.conditions as never,
          effect: dto.effect ?? 'ENABLE',
          priority: dto.priority ?? 100,
          moduleId: dto.moduleId,
          tenantId,
        },
      });
      await this.touchVersion(versionId);
      return created;
    } catch {
      throw new PmException('PACK_VERSION_CONFLICT', 'Code règle déjà utilisé dans cette version.', HttpStatus.CONFLICT, { field: 'code' });
    }
  }

  async updateRule(tenantId: string | null, versionId: string, ruleId: string, dto: { name?: string; description?: string; enabled?: boolean; priority?: number; effect?: string; conditions?: ConditionNode }) {
    await this.assertMutable(tenantId, versionId);
    if (dto.conditions) {
      const error = this.validateConditionTree(dto.conditions);
      if (error) throw new PmException('PACK_MANIFEST_INVALID', `Règle invalide : ${error}`, HttpStatus.UNPROCESSABLE_ENTITY, { field: 'conditions' });
    }
    const rule = await this.prisma.pmRule.findFirst({ where: { id: ruleId, versionId, tenantId } });
    if (!rule) throw new PmException('PACK_NOT_FOUND', 'Règle introuvable.', HttpStatus.NOT_FOUND, { id: ruleId });
    const updated = await this.prisma.pmRule.update({ where: { id: rule.id }, data: dto as never });
    await this.touchVersion(versionId);
    return updated;
  }

  async deleteRule(tenantId: string | null, versionId: string, ruleId: string) {
    await this.assertMutable(tenantId, versionId);
    const rule = await this.prisma.pmRule.findFirst({ where: { id: ruleId, versionId, tenantId } });
    if (!rule) throw new PmException('PACK_NOT_FOUND', 'Règle introuvable.', HttpStatus.NOT_FOUND, { id: ruleId });
    await this.prisma.pmRule.delete({ where: { id: rule.id } });
    await this.touchVersion(versionId);
    return { deleted: true };
  }

  /** Validation d'un arbre de conditions déclaratives (aucun eval, opérateurs en allowlist). */
  private validateConditionTree(node: unknown, depth = 0): string | null {
    if (depth > 8) return 'profondeur de conditions excessive.';
    if (!node || typeof node !== 'object') return 'condition requise.';
    const tree = node as ConditionNode;
    if (Array.isArray(tree.all)) {
      for (const child of tree.all) {
        const error = this.validateConditionTree(child, depth + 1);
        if (error) return error;
      }
      return null;
    }
    if (Array.isArray(tree.any)) {
      for (const child of tree.any) {
        const error = this.validateConditionTree(child, depth + 1);
        if (error) return error;
      }
      return null;
    }
    if (!tree.field || typeof tree.field !== 'string') return 'champ requis.';
    if (!tree.operator || !RULE_OPERATORS.has(tree.operator)) return `opérateur non autorisé : ${String(tree.operator)}`;
    return null;
  }

  // ------------------------------------------------------------------
  // Validation + Manifest + Publication (PM-CDC-00 §18/14/19)
  // ------------------------------------------------------------------

  /** Validation structurelle réelle de la version. Retourne checks + issues. */
  private async runValidationChecks(tenantId: string | null, versionId: string) {
    const version = await this.getVersion(tenantId, versionId);
    const checks: Array<{ key: string; label: string; severity: 'INFO' | 'WARNING' | 'ERROR' | 'CRITICAL'; ok: boolean; message?: string }> = [];
    const issues: Array<{ severity: 'INFO' | 'WARNING' | 'ERROR' | 'CRITICAL'; code: string; message: string }> = [];

    checks.push({
      key: 'pack',
      label: 'Pack et version valides',
      severity: 'ERROR',
      ok: Boolean(version.pack?.code && version.versionNumber),
    });
    checks.push({
      key: 'modules',
      label: 'Modules déclarés',
      severity: 'WARNING',
      ok: version.modules.length > 0,
      message: version.modules.length === 0 ? 'Aucun module déclaré : le pack publiera un manifest vide.' : undefined,
    });
    checks.push({
      key: 'features',
      label: 'Features déclarées',
      severity: 'WARNING',
      ok: version.features.length > 0,
      message: version.features.length === 0 ? 'Aucune feature déclarée.' : undefined,
    });

    // Codes dupliqués entre features et capabilities (structure).
    const featureCodes = new Set<string>();
    let duplicateFeatures = 0;
    for (const feature of version.features) {
      if (featureCodes.has(feature.code)) duplicateFeatures += 1;
      featureCodes.add(feature.code);
    }
    checks.push({
      key: 'features-unique',
      label: 'Codes features uniques',
      severity: 'CRITICAL',
      ok: duplicateFeatures === 0,
      message: duplicateFeatures ? `${duplicateFeatures} code(s) feature dupliqué(s).` : undefined,
    });

    // Capabilities requises sans feature liée (sémantique).
    const linkedCapabilityIds = new Set(version.features.flatMap((f) => f.capabilities.map((c) => c.capabilityId)));
    const orphanRequired = version.capabilities.filter((c) => c.required && !linkedCapabilityIds.has(c.id));
    checks.push({
      key: 'capabilities-linked',
      label: 'Capabilities requises reliées à une feature',
      severity: 'ERROR',
      ok: orphanRequired.length === 0,
      message: orphanRequired.length ? `${orphanRequired.length} capability(s) requise(s) non reliée(s).` : undefined,
    });
    for (const capability of orphanRequired) {
      issues.push({ severity: 'ERROR', code: 'CAPABILITY_ORPHAN', message: `La capability requise ${capability.code} n'est reliée à aucune feature.` });
    }

    // Dépendances : REQUIRED doit viser un pack existant du même tenant.
    for (const dependency of version.dependencies) {
      if (dependency.targetType === 'PACK' && dependency.type === 'REQUIRED') {
        const target = dependency.targetPackId
          ? await this.prisma.pmPack.findFirst({ where: { id: dependency.targetPackId, tenantId } })
          : await this.prisma.pmPack.findFirst({ where: { code: dependency.targetCode, tenantId } });
        if (!target) {
          issues.push({ severity: 'CRITICAL', code: 'DEPENDENCY_MISSING', message: `Dépendance requise introuvable : ${dependency.targetCode}.` });
        }
      }
      if (dependency.type === 'CONFLICTS_WITH') {
        const target = await this.prisma.pmPack.findFirst({ where: { code: dependency.targetCode, tenantId } });
        if (target) {
          issues.push({ severity: 'ERROR', code: 'DEPENDENCY_CONFLICT', message: `Conflit déclaré avec le pack présent ${dependency.targetCode}.` });
        }
      }
    }
    const blocking = issues.filter((i) => i.severity === 'CRITICAL' || i.severity === 'ERROR');
    checks.push({
      key: 'dependencies',
      label: 'Dépendances résolues',
      severity: 'CRITICAL',
      ok: blocking.length === 0,
      message: blocking.length ? `${blocking.length} problème(s) de dépendance.` : undefined,
    });

    // Règles : déjà validées à l'écriture ; vérifier références module.
    const moduleIds = new Set(version.modules.map((m) => m.id));
    const danglingRules = version.rules.filter((r) => r.moduleId && !moduleIds.has(r.moduleId));
    checks.push({
      key: 'rules',
      label: 'Règles référencent des modules existants',
      severity: 'ERROR',
      ok: danglingRules.length === 0,
      message: danglingRules.length ? `${danglingRules.length} règle(s) avec module inconnu.` : undefined,
    });

    return { checks, issues, version };
  }

  async validateVersion(tenantId: string | null, versionId: string, actor?: string | null, traceId?: string | null) {
    const version = await this.ownVersion(tenantId, versionId);
    if (PM_IMMUTABLE_VERSION_STATUSES.has(version.status)) throw pmError.versionImmutable(version.id);
    await this.prisma.pmPackVersion.update({ where: { id: version.id }, data: { validationStatus: 'RUNNING' } });
    const started = Date.now();
    const { checks, issues } = await this.runValidationChecks(tenantId, versionId);
    const blocking = issues.filter((i) => i.severity === 'CRITICAL' || i.severity === 'ERROR');
    const warnings = issues.filter((i) => i.severity === 'WARNING');
    const status = blocking.length > 0 ? 'INVALID' : warnings.length > 0 ? 'VALID' : 'VALID';
    const validation = await this.prisma.pmValidation.create({
      data: {
        versionId: version.id,
        status: status as never,
        checks: checks as never,
        issues: issues as never,
        durationMs: Date.now() - started,
        tenantId,
      },
    });
    // Un échec bloquant renvoie la version en CONFIGURING ; sinon la validation devient VALID.
    await this.prisma.pmPackVersion.update({
      where: { id: version.id },
      data: {
        validationStatus: status as never,
        ...(blocking.length > 0 ? { status: 'CONFIGURING' as const } : {}),
      },
    });
    await this.audit({ tenantId, packId: version.packId, versionId: version.id, action: 'pack.version.validated', actor, traceId, details: { status, blocking: blocking.length, warnings: warnings.length } });
    return {
      validationId: validation.id,
      status,
      checks,
      issues,
      durationMs: validation.durationMs,
      blockers: blocking.length,
      warnings: warnings.length,
    };
  }

  async latestValidation(tenantId: string | null, versionId: string) {
    await this.ownVersion(tenantId, versionId);
    return this.prisma.pmValidation.findFirst({ where: { versionId, tenantId }, orderBy: { createdAt: 'desc' } });
  }

  /** Génère le Pack Manifest Contract v1 (PM-CDC-00 §14) si la validation le permet. */
  async generateManifest(tenantId: string | null, versionId: string, actor?: string | null, traceId?: string | null) {
    const version = await this.ownVersion(tenantId, versionId);
    if (PM_IMMUTABLE_VERSION_STATUSES.has(version.status)) throw pmError.versionImmutable(version.id);
    const latest = await this.prisma.pmValidation.findFirst({ where: { versionId, tenantId }, orderBy: { createdAt: 'desc' } });
    if (!latest || latest.status !== 'VALID') {
      throw pmError.publicationDenied('Le manifest ne peut être généré qu\u2019après une validation VALID.');
    }
    const full = await this.getVersion(tenantId, versionId);
    if (!full.pack) throw pmError.packNotFound(versionId);
    const manifest = {
      contract: PM.MANIFEST_CONTRACT,
      contractVersion: PM.MANIFEST_CONTRACT_VERSION,
      pack: {
        id: full.pack.id,
        code: full.pack.code,
        name: full.pack.name,
        version: full.versionNumber,
      },
      modules: full.modules.map((m) => ({ code: m.code, name: m.name, enabled: m.enabled, orderIndex: m.orderIndex })),
      features: full.features.map((f) => ({ code: f.code, enabled: f.enabled })),
      capabilities: full.capabilities.map((c) => ({ code: c.code, required: c.required })),
      dependencies: full.dependencies.map((d) => ({
        target: d.targetCode,
        type: d.type,
        versionRange: d.versionRange ?? undefined,
      })),
      activationRules: full.rules.map((r) => ({ code: r.code, type: r.type, conditions: r.conditions, effect: r.effect, priority: r.priority })),
      revision: 1,
    };
    const hash = sha256(JSON.stringify(manifest));
    const lastRevision = await this.prisma.pmManifest.findFirst({
      where: { versionId, tenantId },
      orderBy: { revision: 'desc' },
    });
    const revision = (lastRevision?.revision ?? 0) + 1;
    const created = await this.prisma.pmManifest.create({
      data: {
        versionId,
        contract: PM.MANIFEST_CONTRACT,
        contractVersion: PM.MANIFEST_CONTRACT_VERSION,
        status: 'VALID',
        content: manifest as never,
        hash,
        revision,
        tenantId,
      },
    });
    await this.prisma.pmPackVersion.update({ where: { id: versionId }, data: { manifestStatus: 'VALID' } });
    await this.audit({ tenantId, packId: full.pack.id, versionId, action: 'pack.manifest.generated', actor, traceId, details: { hash, revision } });
    return created;
  }

  async latestManifest(tenantId: string | null, versionId: string) {
    await this.ownVersion(tenantId, versionId);
    return this.prisma.pmManifest.findFirst({ where: { versionId, tenantId }, orderBy: { revision: 'desc' } });
  }

  async listManifests(tenantId: string | null, versionId: string) {
    await this.ownVersion(tenantId, versionId);
    return this.prisma.pmManifest.findMany({ where: { versionId, tenantId }, orderBy: { revision: 'desc' } });
  }

  /** Publication transactionnelle (PM-CDC-03 §30) : snapshot → manifest → status → audit → outbox. */
  async publishVersion(tenantId: string | null, versionId: string, actor?: string | null, traceId?: string | null) {
    const version = await this.ownVersion(tenantId, versionId);
    if (version.status === 'PUBLISHED') throw pmError.versionImmutable(version.id);
    if (!['READY', 'VALIDATING'].includes(version.status)) {
      throw pmError.publicationDenied(`Statut ${version.status} : la publication exige une version READY.`);
    }
    const latest = await this.prisma.pmValidation.findFirst({ where: { versionId, tenantId }, orderBy: { createdAt: 'desc' } });
    if (!latest || latest.status !== 'VALID') {
      throw pmError.publicationDenied('La publication exige une validation VALID.');
    }
    const manifest = await this.prisma.pmManifest.findFirst({ where: { versionId, tenantId }, orderBy: { revision: 'desc' } });
    if (!manifest || manifest.status !== 'VALID') {
      throw pmError.publicationDenied('La publication exige un manifest valide.');
    }
    const published = await this.prisma.$transaction(async (tx) => {
      // 1. Snapshot déterministe du contenu publié.
      const full = (await tx.pmPackVersion.findUnique({
        where: { id: versionId },
        include: { modules: true, features: true, capabilities: true, dependencies: true, rules: true },
      })) as VersionFull | null;
      if (!full) throw pmError.versionNotFound(versionId);
      const snapshotContent = {
        packId: full.packId,
        versionNumber: full.versionNumber,
        modules: full.modules,
        features: full.features,
        capabilities: full.capabilities,
        dependencies: full.dependencies,
        rules: full.rules,
      };
      const snapshotHash = sha256(JSON.stringify(snapshotContent));
      await tx.pmSnapshot.create({
        data: { versionId, hash: snapshotHash, content: snapshotContent as never, tenantId },
      });
      // 2. Immuaibilisation de la version.
      const updated = await tx.pmPackVersion.update({
        where: { id: versionId },
        data: { status: 'PUBLISHED', publishedAt: new Date(), snapshotHash, manifestStatus: 'VALID' },
      });
      // 3. Audit + Outbox.
      await tx.pmAuditEvent.create({
        data: {
          tenantId,
          packId: version.packId,
          versionId,
          action: 'pack.version.published',
          actor: actor ?? null,
          traceId: traceId ?? null,
          details: { manifestHash: manifest.hash, revision: manifest.revision } as never,
        },
      });
      await tx.outboxEvent.create({
        data: {
          aggregateType: 'pm_pack_version',
          aggregateId: versionId,
          eventType: 'pack.version.published',
          payload: {
            packId: version.packId,
            versionId,
            packCode: (manifest.content as ManifestContent | undefined)?.pack?.code ?? null,
            version: (manifest.content as ManifestContent | undefined)?.pack?.version ?? null,
            manifestHash: manifest.hash,
          } as never,
          traceId: traceId ?? null,
        },
      });
      return updated;
    });
    return published;
  }

  // ------------------------------------------------------------------
  // Cockpit (PM-CDC-01)
  // ------------------------------------------------------------------

  async getCockpit(tenantId: string | null) {
    const [packs, versions, recentEvents] = await Promise.all([
      this.prisma.pmPack.findMany({ where: { tenantId }, select: { status: true } }),
      this.prisma.pmPackVersion.findMany({
        where: { tenantId },
        orderBy: { updatedAt: 'desc' },
        take: 100,
        include: {
          pack: { select: { id: true, code: true, name: true, status: true } },
          modules: { select: { id: true } },
          dependencies: { select: { id: true, type: true, targetCode: true, targetPackId: true } },
        },
      }),
      this.prisma.pmAuditEvent.findMany({
        where: { tenantId },
        orderBy: { createdAt: 'desc' },
        take: 12,
      }),
    ]);

    const packStatuses = { total: packs.length, DRAFT: 0, ACTIVE: 0, SUSPENDED: 0, DEPRECATED: 0, ARCHIVED: 0 };
    for (const pack of packs) packStatuses[pack.status] += 1;

    const versionStatuses = {
      DRAFT: 0, CONFIGURING: 0, VALIDATING: 0, READY: 0, PUBLISHED: 0,
      SUPERSEDED: 0, DEPRECATED: 0, ARCHIVED: 0, INVALID: 0, ERROR: 0,
    };
    let validationValid = 0;
    let validationInvalid = 0;
    let validationOutdated = 0;
    let validationNotRun = 0;
    let manifests = 0;
    const attention: Array<{ versionId: string; packCode: string; versionNumber: string; reason: string; severity: 'WARNING' | 'CRITICAL' }> = [];

    for (const version of versions) {
      versionStatuses[version.status] = (versionStatuses[version.status] ?? 0) + 1;
      if (version.validationStatus === 'VALID') validationValid += 1;
      else if (version.validationStatus === 'INVALID') validationInvalid += 1;
      else if (version.validationStatus === 'OUTDATED') validationOutdated += 1;
      else if (version.validationStatus === 'NOT_RUN') validationNotRun += 1;
      if (version.manifestStatus === 'VALID') manifests += 1;

      if (version.validationStatus === 'INVALID') {
        attention.push({ versionId: version.id, packCode: version.pack.code, versionNumber: version.versionNumber, reason: 'Validation en échec', severity: 'CRITICAL' });
      }
      if (version.status === 'READY' && version.manifestStatus !== 'VALID') {
        attention.push({ versionId: version.id, packCode: version.pack.code, versionNumber: version.versionNumber, reason: 'Prête sans manifest valide', severity: 'WARNING' });
      }
      const requiredMissing = version.dependencies.filter((d) => d.type === 'REQUIRED' && !d.targetPackId);
      if (requiredMissing.length > 0) {
        attention.push({
          versionId: version.id,
          packCode: version.pack.code,
          versionNumber: version.versionNumber,
          reason: `Dépendance(s) requise(s) non résolue(s) : ${requiredMissing.map((d) => d.targetCode).join(', ')}`,
          severity: 'CRITICAL',
        });
      }
    }

    return {
      packs: packStatuses,
      versions: {
        total: versions.length,
        ...versionStatuses,
        validation: { valid: validationValid, invalid: validationInvalid, outdated: validationOutdated, notRun: validationNotRun },
        manifests,
      },
      attention: attention.slice(0, 10),
      recentEvents,
    };
  }

  // ------------------------------------------------------------------
  // Helpers ownership (isolation tenant systématique)
  // ------------------------------------------------------------------

  private async ownPack(tenantId: string | null, packId: string) {
    const pack = await this.prisma.pmPack.findFirst({ where: { id: packId, tenantId } });
    if (!pack) throw pmError.packNotFound(packId);
    return pack;
  }

  private async ownVersion(tenantId: string | null, versionId: string) {
    const version = await this.prisma.pmPackVersion.findFirst({ where: { id: versionId, tenantId } });
    if (!version) throw pmError.versionNotFound(versionId);
    return version;
  }

  private async ownModule(tenantId: string | null, moduleId: string) {
    const module = await this.prisma.pmModule.findFirst({ where: { id: moduleId, tenantId } });
    if (!module) throw new PmException('PACK_NOT_FOUND', 'Module introuvable.', HttpStatus.NOT_FOUND, { id: moduleId });
    return module;
  }

  private async ownFeature(tenantId: string | null, featureId: string) {
    const feature = await this.prisma.pmFeature.findFirst({ where: { id: featureId, tenantId } });
    if (!feature) throw new PmException('PACK_NOT_FOUND', 'Feature introuvable.', HttpStatus.NOT_FOUND, { id: featureId });
    return feature;
  }

  private async ownCapability(tenantId: string | null, capabilityId: string) {
    const capability = await this.prisma.pmCapability.findFirst({ where: { id: capabilityId, tenantId } });
    if (!capability) throw new PmException('PACK_NOT_FOUND', 'Capability introuvable.', HttpStatus.NOT_FOUND, { id: capabilityId });
    return capability;
  }

  /** Toute écriture sur une version publiée est refusée (immutabilité PM-CDC-03 §10). */
  private async assertMutable(tenantId: string | null, versionId: string) {
    const version = await this.ownVersion(tenantId, versionId);
    if (PM_IMMUTABLE_VERSION_STATUSES.has(version.status)) throw pmError.versionImmutable(versionId);
    return version;
  }

  /** Toute modification de contenu invalide la validation précédente (PM-CDC-00 §29). */
  private async touchVersion(versionId: string) {
    await this.prisma.pmPackVersion.update({
      where: { id: versionId },
      data: { validationStatus: 'OUTDATED', manifestStatus: 'OUTDATED' },
    });
  }

  private async audit(input: { tenantId: string | null; packId?: string | null; versionId?: string | null; action: string; actor?: string | null; traceId?: string | null; details?: unknown }) {
    await this.prisma.pmAuditEvent.create({
      data: {
        tenantId: input.tenantId,
        packId: input.packId ?? null,
        versionId: input.versionId ?? null,
        action: input.action,
        actor: input.actor ?? null,
        traceId: input.traceId ?? null,
        details: (input.details ?? undefined) as never,
      },
    });
>>>>>>> dc5feb88fd597836d806457a7b2a50727b017d02
  }
}
