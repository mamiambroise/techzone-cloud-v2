import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { createHash, randomUUID } from 'node:crypto';
import { PrismaService } from '../../prisma/prisma.service';
import { RuntimeBridgeService } from '../business-manager/runtime/runtime-bridge.service';
import { RuntimeCacheService } from './runtime-cache.service';

type Actor = { id: string; tenantId?: string; permissions?: string[] };
type Input = Record<string, unknown>;

const FORBIDDEN_CONTEXT =
  /password|token|secret|private.?key|credential|cookie/i;
const ALLOWED_FIELDS =
  /^(tenant\.id|application\.(id|version)|environment\.code|subscription\.(plan|status)|entitlements|permissions|capabilities|featureFlags\.[\w.-]+|locale|timezone)$/;

function canonical(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonical).join(',')}]`;
  if (value && typeof value === 'object')
    return `{${Object.entries(value as Input)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, item]) => `${JSON.stringify(key)}:${canonical(item)}`)
      .join(',')}}`;
  return JSON.stringify(value);
}

function hash(value: unknown): string {
  return `sha256:${createHash('sha256').update(canonical(value)).digest('hex')}`;
}
function atPath(value: unknown, path: string): unknown {
  return path
    .split('.')
    .reduce<unknown>(
      (current, key) =>
        current && typeof current === 'object'
          ? (current as Input)[key]
          : undefined,
      value,
    );
}

@Injectable()
export class PackRuntimeService {
  constructor(
    private readonly db: PrismaService,
    private readonly businessRuntime: RuntimeBridgeService,
    private readonly cache: RuntimeCacheService,
  ) {}

  private tenant(actor: Actor): string {
    if (!actor.tenantId)
      throw new BadRequestException('TENANT_CONTEXT_REQUIRED');
    return actor.tenantId;
  }
  private required(input: Input, key: string): string {
    const value = input[key];
    if (typeof value !== 'string' || !value.trim())
      throw new BadRequestException(`${key.toUpperCase()}_REQUIRED`);
    return value.trim();
  }

  private sanitize(input: unknown): unknown {
    if (Array.isArray(input)) return input.map((item) => this.sanitize(item));
    if (input && typeof input === 'object')
      return Object.fromEntries(
        Object.entries(input as Input)
          .filter(([key]) => !FORBIDDEN_CONTEXT.test(key))
          .map(([key, value]) => [key, this.sanitize(value)]),
      );
    return input;
  }

  private matches(expression: unknown, context: Input): boolean {
    if (!expression || typeof expression !== 'object') return false;
    const node = expression as Input;
    if (Array.isArray(node.all))
      return node.all.every((item) => this.matches(item, context));
    if (Array.isArray(node.any))
      return node.any.some((item) => this.matches(item, context));
    if (node.not) return !this.matches(node.not, context);
    if (typeof node.field !== 'string' || !ALLOWED_FIELDS.test(node.field))
      return false;
    const actual = atPath(context, node.field);
    switch (String(node.operator ?? 'EQ').toUpperCase()) {
      case 'EQ':
        return actual === node.value;
      case 'NEQ':
        return actual !== node.value;
      case 'IN':
        return Array.isArray(node.value) && node.value.includes(actual);
      case 'CONTAINS':
        return Array.isArray(actual)
          ? actual.includes(node.value)
          : typeof actual === 'string' && actual.includes(String(node.value));
      case 'EXISTS':
        return actual !== undefined && actual !== null;
      default:
        return false;
    }
  }

  async resolve(input: Input, actor: Actor) {
    const tenantId = this.tenant(actor);
    if (input.tenantId && input.tenantId !== tenantId)
      throw new BadRequestException('TENANT_CONTEXT_MISMATCH');
    const identity = this.sanitize({ ...input, tenantId }) as Input;
    const key = this.cache.key(tenantId, 'resolution', identity);
    const cached = this.cache.get<Record<string, unknown>>(key);
    if (cached) return { ...cached, cache: 'HIT' };
    return this.cache.singleFlight(key, async () => {
      const result = await this.resolveUncached(input, actor);
      this.cache.set(
        key,
        result,
        {
          tenantId,
          applicationId:
            typeof input.applicationId === 'string'
              ? input.applicationId
              : undefined,
          packCode:
            typeof input.packCode === 'string'
              ? input.packCode.toLowerCase()
              : undefined,
          provider: 'PACK_MANIFEST_STORE',
        },
        String(input.packVersion ?? 'unknown'),
      );
      return { ...result, cache: 'MISS' };
    });
  }

  private async resolveUncached(input: Input, actor: Actor) {
    const tenantId = this.tenant(actor);
    if (input.tenantId && input.tenantId !== tenantId)
      throw new BadRequestException('TENANT_CONTEXT_MISMATCH');
    const applicationId = this.required(input, 'applicationId');
    const packCode = this.required(input, 'packCode').toLowerCase();
    const packVersion = this.required(input, 'packVersion');
    const environment = this.required(input, 'environment').toUpperCase();
    const rawContext =
      input.context && typeof input.context === 'object'
        ? (input.context as Input)
        : {};
    const context = this.sanitize({
      ...rawContext,
      tenant: { ...(rawContext.tenant as Input), id: tenantId },
      application: {
        ...(rawContext.application as Input),
        id: applicationId,
      },
      environment: {
        ...(rawContext.environment as Input),
        code: environment,
      },
    }) as Input;
    const requestHash = hash({
      tenantId,
      applicationId,
      packCode,
      packVersion,
      environment,
      context,
      forceRevision: input.forceRevision,
    });
    const previous = await this.db.runtimeResolution.findUnique({
      where: { tenantId_requestHash: { tenantId, requestHash } },
      include: { effectiveManifest: true },
    });
    if (previous?.status === 'RESOLVED') return this.resultSummary(previous);

    const manifest = await this.db.packManifest.findFirst({
      where: {
        tenantId,
        status: 'PUBLISHED',
        packVersion: {
          versionNumber: packVersion,
          status: 'PUBLISHED',
          pack: { code: packCode },
        },
      },
      include: { packVersion: { include: { pack: true } } },
    });
    if (!manifest)
      throw new NotFoundException('PUBLISHED_PACK_MANIFEST_NOT_FOUND');
    if (hash(manifest.content) !== manifest.manifestHash)
      throw new ConflictException('PACK_MANIFEST_HASH_INVALID');

    const resolution =
      previous ??
      (await this.db.runtimeResolution.create({
        data: {
          tenantId,
          applicationId,
          environment,
          packId: manifest.packVersion.packId,
          packVersionId: manifest.packVersionId,
          requestHash,
          status: 'RESOLVING',
          context: context as Prisma.InputJsonValue,
          createdBy: actor.id,
        },
      }));
    const traceId = randomUUID();
    const steps: Array<{ code: string; details: unknown }> = [];
    steps.push({
      code: 'manifest.load',
      details: { manifestId: manifest.id, manifestHash: manifest.manifestHash },
    });
    steps.push({
      code: 'manifest.validate',
      details: { contract: 'techzone.pack-manifest', status: 'VALID' },
    });

    const content = manifest.content as Input;
    const definition = content.definition as Input;
    const declaredModules = (definition.modules ?? []) as Input[];
    const declaredFeatures = (definition.features ?? []) as Input[];
    const dependencies = (definition.dependencies ?? []) as Input[];
    const rules = [...((definition.rules ?? []) as Input[])].sort(
      (a, b) =>
        Number(b.priority) - Number(a.priority) ||
        String(a.code).localeCompare(String(b.code)),
    );
    const modules = declaredModules.map((item) => ({
      id: item.id,
      code: item.code,
      state: item.enabled === false ? 'INACTIVE' : 'ACTIVE',
      reasonCode:
        item.enabled === false ? 'DECLARED_DISABLED' : 'DECLARED_ENABLED',
      configuration: item.configuration ?? {},
    }));
    const features = declaredFeatures.map((item) => {
      const parent = modules.find((module) => module.id === item.moduleId);
      const active =
        item.enabled !== false &&
        item.defaultEnabled !== false &&
        (!parent || parent.state === 'ACTIVE');
      return {
        id: item.id,
        moduleId: item.moduleId,
        code: item.code,
        state: active ? 'ACTIVE' : 'INACTIVE',
        reasonCode:
          parent?.state === 'INACTIVE'
            ? 'MODULE_INACTIVE'
            : active
              ? 'DECLARED_ENABLED'
              : 'DECLARED_DISABLED',
        capabilities: item.capabilities ?? [],
      };
    });
    steps.push({
      code: 'module_feature.resolve',
      details: { moduleCount: modules.length, featureCount: features.length },
    });

    const known = new Set([
      ...modules.map((item) => String(item.code)),
      ...features.map((item) => String(item.code)),
      ...features.flatMap((item) =>
        (item.capabilities as Input[]).map((capability) =>
          String(capability.code),
        ),
      ),
    ]);
    const dependencyStates: Input[] = await Promise.all(
      dependencies.map(async (item) => {
        const externalPackAvailable =
          item.targetType === 'PACK' &&
          Boolean(
            await this.db.pack.findFirst({
              where: {
                tenantId,
                code: String(item.targetRef),
                versions: { some: { status: 'PUBLISHED' } },
              },
            }),
          );
        const available =
          known.has(String(item.targetRef)) || externalPackAvailable;
        return {
          ...item,
          state: available
            ? 'SATISFIED'
            : item.required === false
              ? 'OPTIONAL_MISSING'
              : 'MISSING',
          reasonCode: available ? 'TARGET_AVAILABLE' : 'DEPENDENCY_MISSING',
        };
      }),
    );
    for (const item of dependencyStates.filter(
      (dependency) => dependency.state === 'MISSING',
    )) {
      const target = [...modules, ...features].find(
        (candidate) =>
          candidate.id === item.sourceId || candidate.code === item.sourceId,
      );
      if (target)
        Object.assign(target, {
          state: 'BLOCKED',
          reasonCode: 'DEPENDENCY_MISSING',
        });
    }
    steps.push({
      code: 'capability_dependency.resolve',
      details: { capabilityCount: known.size, dependencies: dependencyStates },
    });

    const decisions = rules.map((rule) => {
      const matched = this.matches(rule.expression, context);
      const target = [...modules, ...features].find(
        (candidate) =>
          candidate.id === rule.targetId || candidate.code === rule.targetId,
      );
      if (matched && target) {
        if (rule.effect === 'ENABLE')
          Object.assign(target, {
            state: 'ACTIVE',
            reasonCode: 'RULE_MATCHED',
          });
        if (['DISABLE', 'DENY'].includes(String(rule.effect)))
          Object.assign(target, {
            state: 'INACTIVE',
            reasonCode: 'RULE_MATCHED',
          });
        if (rule.effect === 'REQUIRE' && target.state !== 'ACTIVE')
          Object.assign(target, {
            state: 'BLOCKED',
            reasonCode: 'RULE_MATCHED',
          });
      }
      return {
        ruleCode: rule.code,
        targetId: rule.targetId,
        effect: rule.effect,
        matched,
        reasonCode: matched ? 'RULE_MATCHED' : 'RULE_NOT_MATCHED',
      };
    });
    steps.push({ code: 'rules_context.resolve', details: { decisions } });

    let businessConfiguration: unknown = null;
    if (
      typeof input.businessVersionId === 'string' &&
      input.businessVersionId
    ) {
      businessConfiguration = await this.businessRuntime.manifest(
        input.businessVersionId,
        environment,
        'WEB',
      );
      if ((businessConfiguration as Input).applicationId !== applicationId)
        throw new ConflictException('BUSINESS_APPLICATION_CONTEXT_MISMATCH');
    }
    const executable = ![...modules, ...features].some(
      (item) => item.state === 'BLOCKED',
    );
    const effective = {
      contract: 'techzone.effective-runtime-manifest',
      contractVersion: '1.0.0',
      source: {
        packManifestId: manifest.id,
        manifestHash: manifest.manifestHash,
        packCode,
        packVersion,
      },
      scope: { tenantId, applicationId, environment },
      resolution: {
        id: resolution.id,
        status: executable ? 'RESOLVED' : 'BLOCKED',
        deterministic: true,
      },
      businessConfiguration,
      modules,
      features,
      capabilities: [...known].sort(),
      dependencies: dependencyStates,
      ruleDecisions: decisions,
    };
    const functionalHash = hash({
      modules,
      features,
      capabilities: effective.capabilities,
      dependencies: dependencyStates,
      decisions,
      businessConfiguration,
    });
    const effectiveHash = hash(effective);
    steps.push({
      code: 'effective_manifest.build',
      details: { effectiveHash, functionalHash, executable },
    });

    const saved = await this.db.$transaction(async (tx) => {
      await tx.runtimeResolutionStep.deleteMany({
        where: { resolutionId: resolution.id },
      });
      for (const [index, step] of steps.entries())
        await tx.runtimeResolutionStep.create({
          data: {
            resolutionId: resolution.id,
            code: step.code,
            status: 'COMPLETED',
            displayOrder: index + 1,
            details: step.details as Prisma.InputJsonValue,
            outputHash: hash(step.details),
            completedAt: new Date(),
          },
        });
      const effectiveManifest = await tx.runtimeEffectiveManifest.upsert({
        where: { resolutionId: resolution.id },
        create: {
          tenantId,
          resolutionId: resolution.id,
          applicationId,
          environment,
          manifestHash: effectiveHash,
          functionalHash,
          status: executable ? 'VALID' : 'BLOCKED',
          executable,
          content: effective as Prisma.InputJsonValue,
        },
        update: {
          manifestHash: effectiveHash,
          functionalHash,
          status: executable ? 'VALID' : 'BLOCKED',
          executable,
          content: effective as Prisma.InputJsonValue,
        },
      });
      const updated = await tx.runtimeResolution.update({
        where: { id: resolution.id },
        data: {
          status: executable ? 'RESOLVED' : 'BLOCKED',
          result: {
            effectiveManifestId: effectiveManifest.id,
            effectiveHash,
            functionalHash,
          } as Prisma.InputJsonValue,
          diagnostics: dependencyStates.filter(
            (item) => item.state === 'MISSING',
          ) as Prisma.InputJsonValue,
          completedAt: new Date(),
        },
        include: { effectiveManifest: true },
      });
      if (!executable)
        await tx.runtimeDiagnostic.create({
          data: {
            tenantId,
            resolutionId: resolution.id,
            severity: 'ERROR',
            category: 'DEPENDENCY',
            code: 'DEPENDENCY_MISSING',
            message: 'Required dependency resolution failed',
            details: updated.diagnostics as Prisma.InputJsonValue,
            traceId,
          },
        });
      return updated;
    });
    return this.resultSummary(saved, traceId);
  }

  private resultSummary(
    item: {
      id: string;
      status: string;
      effectiveManifest?: { id: string } | null;
    },
    traceId?: string,
  ) {
    return {
      resolutionId: item.id,
      status: item.status,
      traceId,
      effectiveManifestId: item.effectiveManifest?.id,
    };
  }

  async resolution(id: string, actor: Actor) {
    const item = await this.db.runtimeResolution.findFirst({
      where: { id, tenantId: this.tenant(actor) },
      include: {
        steps: { orderBy: { displayOrder: 'asc' } },
        effectiveManifest: true,
      },
    });
    if (!item) throw new NotFoundException('RUNTIME_RESOLUTION_NOT_FOUND');
    return item;
  }
  async resolutions(actor: Actor) {
    return this.db.runtimeResolution.findMany({
      where: { tenantId: this.tenant(actor) },
      orderBy: { startedAt: 'desc' },
      take: 100,
      include: { effectiveManifest: true },
    });
  }
  async effective(id: string, actor: Actor) {
    const item = await this.db.runtimeEffectiveManifest.findFirst({
      where: { resolutionId: id, tenantId: this.tenant(actor) },
    });
    if (!item) throw new NotFoundException('EFFECTIVE_MANIFEST_NOT_FOUND');
    return item;
  }
  async effectiveById(id: string, actor: Actor) {
    const item = await this.db.runtimeEffectiveManifest.findFirst({
      where: { id, tenantId: this.tenant(actor) },
    });
    if (!item) throw new NotFoundException('EFFECTIVE_MANIFEST_NOT_FOUND');
    return item;
  }
  async current(applicationId: string, packCode: string, actor: Actor) {
    const item = await this.db.runtimeEffectiveManifest.findFirst({
      where: {
        tenantId: this.tenant(actor),
        applicationId,
        status: 'VALID',
        resolution: {
          packId: {
            in: (
              await this.db.pack.findMany({
                where: { tenantId: this.tenant(actor), code: packCode },
                select: { id: true },
              })
            ).map((pack) => pack.id),
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    if (!item) throw new NotFoundException('EFFECTIVE_MANIFEST_NOT_FOUND');
    return item;
  }
  async diagnostics(id: string, actor: Actor) {
    await this.resolution(id, actor);
    return this.db.runtimeDiagnostic.findMany({
      where: { tenantId: this.tenant(actor), resolutionId: id },
      orderBy: { createdAt: 'asc' },
    });
  }
  async diagnostic(id: string, actor: Actor) {
    const item = await this.db.runtimeDiagnostic.findFirst({
      where: { id, tenantId: this.tenant(actor) },
    });
    if (!item) throw new NotFoundException('RUNTIME_DIAGNOSTIC_NOT_FOUND');
    return { ...item, details: this.sanitize(item.details) };
  }
  async exportDiagnostics(id: string, actor: Actor) {
    const resolution = await this.resolution(id, actor);
    const diagnostics = await this.diagnostics(id, actor);
    return {
      contractVersion: '1.0.0',
      exportedAt: new Date().toISOString(),
      resolutionId: resolution.id,
      tenantId: this.tenant(actor),
      diagnostics: diagnostics.map((item) => ({
        ...item,
        details: this.sanitize(item.details),
      })),
    };
  }
  cacheStatus(actor: Actor) {
    return this.cache.status(this.tenant(actor));
  }
  cacheEntries(actor: Actor) {
    return this.cache.list(this.tenant(actor));
  }
  invalidateCache(input: Input, actor: Actor) {
    const tenantId = this.tenant(actor);
    const scope = String(input.scope ?? '').toUpperCase();
    const accepted = [
      'ENTRY',
      'TENANT',
      'APPLICATION',
      'PACK',
      'PROVIDER',
      'GLOBAL',
    ];
    if (!accepted.includes(scope))
      throw new BadRequestException('RUNTIME_CACHE_SCOPE_INVALID');
    const global = scope === 'GLOBAL';
    if (
      global &&
      !actor.permissions?.includes('runtime.cache.invalidate_global')
    )
      throw new ForbiddenException('RUNTIME_CACHE_GLOBAL_PERMISSION_REQUIRED');
    return {
      scope,
      invalidated: this.cache.invalidate(tenantId, scope, input, global),
    };
  }
  async providersHealth(actor: Actor) {
    this.tenant(actor);
    const startedAt = Date.now();
    try {
      await this.db.$queryRaw`SELECT 1`;
      const latencyMs = Date.now() - startedAt;
      return {
        providers: [
          {
            code: 'PACK_MANIFEST_STORE',
            state: 'UP',
            latencyMs,
            critical: true,
          },
          {
            code: 'BUSINESS_RUNTIME_BRIDGE',
            state: 'UP',
            latencyMs: 0,
            critical: true,
          },
        ],
      };
    } catch {
      return {
        providers: [
          {
            code: 'PACK_MANIFEST_STORE',
            state: 'DOWN',
            critical: true,
          },
        ],
      };
    }
  }
  async probeProvider(provider: string, actor: Actor) {
    const health = await this.providersHealth(actor);
    const item = health.providers.find((entry) => entry.code === provider);
    if (!item) throw new NotFoundException('RUNTIME_PROVIDER_NOT_FOUND');
    return { ...item, probedAt: new Date().toISOString() };
  }
  resilienceStatus(actor: Actor) {
    return {
      tenantId: this.tenant(actor),
      mode: 'LOCAL_PROCESS',
      singleFlight: true,
      staleWhileRevalidate: false,
      staleIfError: false,
      retries: { enabled: false, reason: 'NO_REMOTE_RETRYABLE_PROVIDER' },
      circuitBreaker: { enabled: false, reason: 'NO_REMOTE_PROVIDER' },
      bulkhead: { enabled: false, reason: 'NO_REMOTE_PROVIDER' },
    };
  }
  async reresolve(id: string, actor: Actor) {
    const previous = await this.resolution(id, actor);
    const version = await this.db.packVersion.findFirst({
      where: { id: previous.packVersionId, tenantId: this.tenant(actor) },
      include: { pack: true },
    });
    if (!version) throw new NotFoundException('PACK_VERSION_NOT_FOUND');
    return this.resolve(
      {
        applicationId: previous.applicationId,
        packCode: version.pack.code,
        packVersion: version.versionNumber,
        environment: previous.environment,
        context: previous.context as Input,
        forceRevision: randomUUID(),
      },
      actor,
    );
  }
  async dashboard(actor: Actor) {
    const tenantId = this.tenant(actor);
    const [total, resolved, blocked, recent] = await Promise.all([
      this.db.runtimeResolution.count({ where: { tenantId } }),
      this.db.runtimeResolution.count({
        where: { tenantId, status: 'RESOLVED' },
      }),
      this.db.runtimeResolution.count({
        where: { tenantId, status: 'BLOCKED' },
      }),
      this.resolutions(actor),
    ]);
    return {
      counters: { total, resolved, blocked },
      recent: recent.slice(0, 20),
    };
  }
}
