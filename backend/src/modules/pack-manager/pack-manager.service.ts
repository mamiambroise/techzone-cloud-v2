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
  }
}
