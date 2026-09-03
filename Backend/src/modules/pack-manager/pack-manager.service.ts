import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, PackVersion } from '@prisma/client';
import { createHash, randomUUID } from 'node:crypto';
import { PrismaService } from '../../prisma/prisma.service';

type Actor = { id: string; tenantId?: string };
type Input = Record<string, unknown>;

function canonical(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonical).join(',')}]`;
  if (value && typeof value === 'object') {
    return `{${Object.entries(value as Input)
      .filter(([, item]) => item !== undefined)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, item]) => `${JSON.stringify(key)}:${canonical(item)}`)
      .join(',')}}`;
  }
  return JSON.stringify(value);
}

function hash(value: unknown): string {
  return `sha256:${createHash('sha256').update(canonical(value)).digest('hex')}`;
}

const SEMVER =
  /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?$/;
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

  private tenant(actor: Actor): string {
    if (!actor.tenantId)
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
        : undefined,
    });
    if (!version) throw new NotFoundException('PACK_VERSION_NOT_FOUND');
    return version;
  }

  private mutable(version: Pick<PackVersion, 'status'>): void {
    if (['PUBLISHED', 'DEPRECATED', 'ARCHIVED'].includes(version.status)) {
      throw new ConflictException('PACK_VERSION_IMMUTABLE');
    }
  }

  private async invalidate(versionId: string, actor: Actor): Promise<void> {
    await this.db.packVersion.update({
      where: { id: versionId },
      data: {
        validationStatus: 'OUTDATED',
        manifestStatus: 'OUTDATED',
        manifestHash: null,
        updatedBy: actor.id,
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
    await tx.packAuditEvent.create({
      data: {
        tenantId,
        aggregateType: type,
        aggregateId: id,
        action,
        actorId: actor.id,
        traceId: randomUUID(),
        details: (details ?? {}) as Prisma.InputJsonValue,
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
      this.db.packAuditEvent.findMany({
        where: { tenantId },
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
      take: Math.min(Number(query.limit) || 50, 100),
    });
  }

  async getPack(id: string, actor: Actor) {
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
      return await this.db.$transaction(async (tx) => {
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
            createdBy: actor.id,
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
    return this.db.pack.update({
      where: { id },
      data: {
        name: this.text(input, 'name'),
        shortName: this.text(input, 'shortName'),
        description: this.text(input, 'description'),
        categoryId: this.text(input, 'categoryId'),
        iconKey: this.text(input, 'iconKey'),
        metadata: input.metadata as Prisma.InputJsonValue | undefined,
        updatedBy: actor.id,
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
        updatedBy: actor.id,
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
        updatedBy: actor.id,
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
    const versionNumber = this.text(input, 'versionNumber', true)!;
    if (!SEMVER.test(versionNumber))
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
        createdBy: actor.id,
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
        updatedBy: actor.id,
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
        createdBy: actor.id,
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
        createdBy: actor.id,
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
    const capabilityId = this.text(input, 'capabilityId', true)!;
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
        createdBy: actor.id,
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
        createdBy: actor.id,
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
    if (version.modules.length === 0)
      issues.push({
        code: 'MODULE_REQUIRED',
        path: 'modules',
        severity: 'ERROR',
        message: 'At least one module is required',
      });
    const refs = new Set([
      ...version.modules.map((item: any) => item.code),
      ...version.features.map((item: any) => item.code),
      ...version.features.flatMap((item: any) =>
        item.capabilities.map((link: any) => link.capability.code),
      ),
    ]);
    for (const dependency of version.dependencies) {
      const externalPackAvailable =
        dependency.targetType === 'PACK' &&
        Boolean(
          await this.db.pack.findFirst({
            where: {
              tenantId: this.tenant(actor),
              code: dependency.targetRef,
              versions: { some: { status: 'PUBLISHED' } },
            },
          }),
        );
      if (
        dependency.required &&
        !refs.has(dependency.targetRef) &&
        !externalPackAvailable
      )
        issues.push({
          code: 'DEPENDENCY_UNSATISFIED',
          path: `dependencies.${dependency.id}`,
          severity: 'ERROR',
          message: `Missing target ${dependency.targetRef}`,
        });
    }
    const graph = new Map<string, string[]>();
    for (const dependency of version.dependencies.filter(
      (item: any) => item.required,
    ))
      graph.set(dependency.sourceId, [
        ...(graph.get(dependency.sourceId) ?? []),
        dependency.targetRef,
      ]);
    const visiting = new Set<string>();
    const visited = new Set<string>();
    const cyclic = (node: string): boolean => {
      if (visiting.has(node)) return true;
      if (visited.has(node)) return false;
      visiting.add(node);
      for (const next of graph.get(node) ?? []) if (cyclic(next)) return true;
      visiting.delete(node);
      visited.add(node);
      return false;
    };
    if ([...graph.keys()].some(cyclic))
      issues.push({
        code: 'DEPENDENCY_CYCLE',
        path: 'dependencies',
        severity: 'ERROR',
        message: 'Required dependency cycle detected',
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
    const status = issues.some((item) => item.severity === 'ERROR')
      ? 'INVALID'
      : 'VALID';
    const snapshotContent = this.definition(version);
    const snapshotHash = hash(snapshotContent);
    return this.db.$transaction(async (tx) => {
      const validation = await tx.packValidation.create({
        data: {
          tenantId: this.tenant(actor),
          packVersionId: id,
          status,
          issues,
          summary: { errorCount: issues.length },
          createdBy: actor.id,
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
          validatedBy: actor.id,
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
        .sort((a: any, b: any) => a.displayOrder - b.displayOrder)
        .map((item: any) => ({
          id: item.id,
          code: item.code,
          name: item.name,
          enabled: item.enabled,
          configuration: item.configuration,
        })),
      features: version.features
        .filter((item: any) => !item.archivedAt)
        .map((item: any) => ({
          id: item.id,
          moduleId: item.moduleId,
          code: item.code,
          name: item.name,
          enabled: item.enabled,
          defaultEnabled: item.defaultEnabled,
          capabilities: item.capabilities.map((link: any) => ({
            code: link.capability.code,
            relationType: link.relationType,
            required: link.required,
          })),
        })),
      dependencies: version.dependencies
        .filter((item: any) => !item.archivedAt)
        .map((item: any) => ({
          id: item.id,
          sourceType: item.sourceType,
          sourceId: item.sourceId,
          type: item.dependencyType,
          targetType: item.targetType,
          targetRef: item.targetRef,
          required: item.required,
        })),
      rules: version.rules
        .filter((item: any) => item.enabled && !item.archivedAt)
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
    return this.db.$transaction(
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
        if (hash(version.manifest.content) !== version.manifestHash)
          throw new ConflictException('PACK_MANIFEST_HASH_INVALID');
        const now = new Date();
        const published = await tx.packVersion.update({
          where: { id },
          data: {
            status: 'PUBLISHED',
            publishedAt: now,
            publishedBy: actor.id,
            rowVersion: { increment: 1 },
          },
        });
        await tx.packManifest.update({
          where: { packVersionId: id },
          data: { status: 'PUBLISHED', publishedAt: now },
        });
        await tx.packOutboxEvent.create({
          data: {
            tenantId: this.tenant(actor),
            eventType: 'pack.version.published',
            aggregateType: 'PACK_VERSION',
            aggregateId: id,
            payload: { packVersionId: id, manifestHash: version.manifestHash },
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
