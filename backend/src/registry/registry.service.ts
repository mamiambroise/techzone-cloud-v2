import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import semver from 'semver';
import {
  RegistryAvailabilityStatus,
  RegistryCompatibilityResult,
  RegistryEntryStatus,
  RegistryEntryType,
  RegistryNamespace,
  RegistrySubDomain,
  Prisma,
} from '../generated/prisma/client';
import { hasPermission, IamPrincipal } from '../iam/principal.decorator';
import { PrismaService } from '../prisma/prisma.service';
import {
  evaluateRegistryCandidates,
  RegistryCandidate,
  RegistryRequirement,
} from './registry-resolver';

const NAMESPACE_PERMISSION: Record<RegistryNamespace, string> = {
  BUSINESS: 'registry.namespace.business.write',
  UI: 'registry.namespace.ui.write',
  AUTOMATION: 'registry.namespace.automation.write',
  DATA: 'registry.namespace.data.write',
  INTEGRATION: 'registry.namespace.integration.write',
  RUNTIME: 'registry.namespace.runtime.write',
  API: 'registry.namespace.api.write',
  PLATFORM: 'registry.namespace.platform.write',
};

const NAMESPACE_SUBDOMAINS: Record<RegistryNamespace, RegistrySubDomain[]> = {
  BUSINESS: [
    RegistrySubDomain.BUSINESS_FEATURE,
    RegistrySubDomain.BUSINESS_CAPABILITY,
    RegistrySubDomain.BUSINESS_EVENT,
  ],
  UI: [
    RegistrySubDomain.UI_COMPONENT,
    RegistrySubDomain.UI_ACTION,
    RegistrySubDomain.UI_TEMPLATE,
  ],
  AUTOMATION: [
    RegistrySubDomain.AUTOMATION_NODE,
    RegistrySubDomain.AUTOMATION_TRIGGER,
    RegistrySubDomain.AUTOMATION_ACTION,
  ],
  DATA: [
    RegistrySubDomain.DATA_PROVIDER,
    RegistrySubDomain.DATA_REPOSITORY,
    RegistrySubDomain.DATA_CONTRACT,
    RegistrySubDomain.DATA_CAPABILITY,
  ],
  INTEGRATION: [
    RegistrySubDomain.INTEGRATION_CONNECTOR,
    RegistrySubDomain.INTEGRATION_CONTRACT,
    RegistrySubDomain.INTEGRATION_CAPABILITY,
  ],
  RUNTIME: [
    RegistrySubDomain.RUNTIME_CAPABILITY,
    RegistrySubDomain.RUNTIME_SCHEMA,
  ],
  API: [
    RegistrySubDomain.API_CONTRACT,
    RegistrySubDomain.API_VERSION,
    RegistrySubDomain.API_SCOPE,
  ],
  PLATFORM: [
    RegistrySubDomain.PLATFORM_CAPABILITY,
    RegistrySubDomain.PLATFORM_SCHEMA,
    RegistrySubDomain.PLATFORM_SERVICE,
  ],
};

const ENTRY_TYPES = new Set<string>(Object.values(RegistryEntryType));
const SAFE_KEY = /^[a-z0-9][a-z0-9._-]{0,149}$/;
const BLOCKED_METADATA_KEY =
  /(?:secret|password|token|credential|private.?key|script|executable|command|source.?code)/i;
const DANGEROUS_METADATA_VALUE =
  /<\s*script\b|javascript\s*:|data\s*:\s*text\/html|#!\s*\/|<\?php|\beval\s*\(|\bFunction\s*\(|\bprocess\.env\b|\brequire\s*\(/i;
const SECRET_METADATA_VALUE =
  /-----BEGIN [A-Z0-9 ]*PRIVATE KEY-----|\beyJ[\w-]{10,}\.eyJ[\w-]{10,}\.[\w-]{10,}\b|\bAKIA[0-9A-Z]{16}\b|\bgh[pousr]_[A-Za-z0-9]{20,}\b|\bxox[baprs]-[A-Za-z0-9-]{10,}\b|\bBearer\s+[A-Za-z0-9._~+/-]{12,}|\b(?:password|passwd|secret|token|api[_-]?key)\s*[:=]\s*["']?[^\s"'&,;]{8,}/i;
const ENTRY_INCLUDE = {
  namespace: true,
  capabilities: { orderBy: { code: 'asc' } },
  versions: { orderBy: [{ createdAt: 'desc' }, { version: 'desc' }] },
  availabilities: { orderBy: [{ environmentCode: 'asc' }, { createdAt: 'asc' }] },
} satisfies Prisma.RegistryEntryInclude;

type RegisterEntryInput = {
  namespace: RegistryNamespace;
  subDomain: RegistrySubDomain;
  key: string;
  version: string;
  type: RegistryEntryType;
  displayName?: string;
  description?: string;
  schemaRef?: string;
  capabilities?: string[];
  metadata?: unknown;
};

type ResolveInput = RegistryRequirement & {
  sourceEntryId?: string;
};

function namespaceKey(namespace: string, subDomain: string, key: string): string {
  const prefix = `${namespace}_`;
  const category = subDomain.startsWith(prefix)
    ? subDomain.slice(prefix.length)
    : subDomain;
  return `${namespace.toLowerCase()}.${category.toLowerCase().replaceAll('_', '.')}.${key}`;
}

function referencesRegistryEntry(
  value: unknown,
  entryId: string,
  keys: ReadonlySet<string>,
): boolean {
  if (Array.isArray(value)) {
    return value.some((item) => referencesRegistryEntry(item, entryId, keys));
  }
  if (typeof value !== 'object' || value === null) return false;

  const record = value as Record<string, unknown>;
  const registryTarget = [
    record.targetType,
    record.type,
  ].some(
    (targetType) =>
      typeof targetType === 'string' &&
      ['REGISTRY', 'REGISTRY_ENTRY', 'REGISTRY_REF'].includes(
        targetType.toUpperCase(),
      ),
  );
  if (
    ['entryId', 'registryEntryId', 'targetEntryId'].some(
      (field) => record[field] === entryId,
    ) ||
    ['registryKey', 'stableKey'].some(
      (field) => typeof record[field] === 'string' && keys.has(record[field] as string),
    ) ||
    (registryTarget &&
      typeof record.targetRef === 'string' &&
      keys.has(record.targetRef))
  ) {
    return true;
  }
  return Object.values(record).some((item) =>
    referencesRegistryEntry(item, entryId, keys),
  );
}

function metadataJson(value: unknown, depth = 0): Prisma.InputJsonValue {
  if (depth > 5) throw new BadRequestException('REGISTRY_METADATA_TOO_DEEP');
  if (value === null) throw new BadRequestException('REGISTRY_METADATA_NULL_VALUE');
  if (typeof value === 'boolean' || typeof value === 'number') {
    return value;
  }
  if (typeof value === 'string') {
    if (DANGEROUS_METADATA_VALUE.test(value)) {
      throw new BadRequestException('REGISTRY_METADATA_EXECUTABLE_CONTENT');
    }
    if (SECRET_METADATA_VALUE.test(value)) {
      throw new BadRequestException('REGISTRY_METADATA_SENSITIVE_VALUE');
    }
    return value;
  }
  if (Array.isArray(value)) {
    if (value.length > 100) throw new BadRequestException('REGISTRY_METADATA_TOO_LARGE');
    return value.map((item) => metadataJson(item, depth + 1));
  }
  if (typeof value !== 'object' || value === null) {
    throw new BadRequestException('REGISTRY_METADATA_INVALID');
  }

  const entries = Object.entries(value);
  if (entries.length > 100) throw new BadRequestException('REGISTRY_METADATA_TOO_LARGE');
  const result: Record<string, Prisma.InputJsonValue> = {};
  for (const [key, item] of entries) {
    if (BLOCKED_METADATA_KEY.test(key)) {
      throw new BadRequestException('REGISTRY_METADATA_SENSITIVE_FIELD');
    }
    result[key] = metadataJson(item, depth + 1);
  }
  return result;
}

function safeEntry<T extends { metadata?: unknown }>(entry: T) {
  const { metadata: _metadata, ...publicEntry } = entry;
  return publicEntry;
}

@Injectable()
export class RegistryService {
  constructor(private readonly prisma: PrismaService) {}

  async overview(principal: IamPrincipal) {
    const where = this.visibleEntries(principal);
    const [total, byStatus, providers, schemas, unresolvedDiagnostics] =
      await Promise.all([
        this.prisma.registryEntry.count({ where }),
        this.prisma.registryEntry.groupBy({
          by: ['status'],
          where,
          _count: { _all: true },
        }),
        this.prisma.registryProviderDef.count(),
        this.prisma.registrySchema.count({
          where: this.visibleTenant(principal),
        }),
        this.prisma.registryDiagnostic.count({
          where: {
            tenantId: principal.tenantId ?? '__no_tenant__',
            resolvedAt: null,
          },
        }),
      ]);
    const counts = Object.fromEntries(
      byStatus.map(({ status, _count }) => [status, _count._all]),
    );
    return {
      total,
      available: counts[RegistryEntryStatus.AVAILABLE] ?? 0,
      deprecated: counts[RegistryEntryStatus.DEPRECATED] ?? 0,
      unavailable: counts[RegistryEntryStatus.UNAVAILABLE] ?? 0,
      disabled: counts[RegistryEntryStatus.DISABLED] ?? 0,
      conflicts: await this.prisma.registryCompatibility.count({
        where: {
          tenantId: principal.tenantId ?? '__no_tenant__',
          result: RegistryCompatibilityResult.INCOMPATIBLE,
        },
      }),
      providers,
      schemas,
      unresolvedDiagnostics,
      byStatus: counts,
    };
  }

  listNamespaces(principal: IamPrincipal) {
    return this.prisma.registryNamespaceDef.findMany({
      include: {
        _count: { select: { entries: { where: this.visibleEntries(principal) } } },
      },
      orderBy: { namespace: 'asc' },
    });
  }

  listSources(principal: IamPrincipal) {
    return this.listNamespaces(principal);
  }

  async listEntries(
    principal: IamPrincipal,
    filters: { namespace?: string; status?: string; query?: string },
  ) {
    const where: Prisma.RegistryEntryWhereInput = {
      ...this.visibleEntries(principal),
    };
    if (filters.namespace) {
      this.enumValue(filters.namespace, Object.values(RegistryNamespace), 'namespace');
      where.namespace = { namespace: filters.namespace as RegistryNamespace };
    }
    if (filters.status) {
      this.enumValue(filters.status, Object.values(RegistryEntryStatus), 'status');
      where.status = filters.status as RegistryEntryStatus;
    }
    if (filters.query?.trim()) {
      const query = filters.query.trim().slice(0, 150);
      where.OR = [
        { key: { contains: query, mode: 'insensitive' } },
        { displayName: { contains: query, mode: 'insensitive' } },
        { owner: { contains: query, mode: 'insensitive' } },
      ];
    }
    const entries = await this.prisma.registryEntry.findMany({
      where,
      include: ENTRY_INCLUDE,
      orderBy: [{ namespace: { namespace: 'asc' } }, { key: 'asc' }, { version: 'desc' }],
      take: 500,
    });
    return entries.map(safeEntry);
  }

  async getEntry(principal: IamPrincipal, id: string) {
    const entry = await this.prisma.registryEntry.findFirst({
      where: { id, ...this.visibleEntries(principal) },
      include: {
        ...ENTRY_INCLUDE,
        compatibilities: {
          select: {
            id: true,
            requiredVersion: true,
            requiredCapabilities: true,
            result: true,
            checkedAt: true,
            targetEntry: { select: { id: true, key: true, version: true } },
            targetSchema: { select: { id: true, code: true, version: true } },
          },
          orderBy: { checkedAt: 'desc' },
        },
        diagnostics: {
          where: { tenantId: principal.tenantId ?? '__no_tenant__' },
          select: {
            id: true,
            severity: true,
            category: true,
            component: true,
            message: true,
            createdAt: true,
            resolvedAt: true,
          },
          orderBy: { createdAt: 'desc' },
          take: 100,
        },
      },
    });
    if (!entry) throw new NotFoundException('REGISTRY_ENTRY_NOT_FOUND');
    const referenceKeys = new Set([
      entry.id,
      entry.key,
      namespaceKey(entry.namespace.namespace, entry.subDomain, entry.key),
    ]);
    const tenantScope = principal.tenantId
      ? { tenantId: principal.tenantId }
      : { tenantId: '__no_tenant__' };
    const [packManifests, runtimeManifests] = await Promise.all([
      this.prisma.packManifest.findMany({
        where: { status: 'PUBLISHED', ...tenantScope },
        select: {
          packVersionId: true,
          publishedAt: true,
          content: true,
          packVersion: {
            select: {
              versionNumber: true,
              pack: { select: { code: true, name: true } },
            },
          },
        },
      }),
      this.prisma.runtimeEffectiveManifest.findMany({
        where: { ...tenantScope, executable: true },
        select: {
          id: true,
          applicationId: true,
          environment: true,
          createdAt: true,
          content: true,
        },
      }),
    ]);
    return {
      ...safeEntry(entry),
      references: {
        publishedPacks: packManifests
          .filter(({ content }) =>
            referencesRegistryEntry(content, entry.id, referenceKeys),
          )
          .map(({ content: _content, ...manifest }) => manifest),
        runtimeContexts: runtimeManifests
          .filter(({ content }) =>
            referencesRegistryEntry(content, entry.id, referenceKeys),
          )
          .map(({ content: _content, ...manifest }) => manifest),
      },
    };
  }

  async listCapabilities(principal: IamPrincipal, query?: string) {
    return this.prisma.registryCapability.findMany({
      where: {
        entry: {
          ...this.visibleEntries(principal),
          ...(query?.trim()
            ? {
                OR: [
                  { key: { contains: query.trim().slice(0, 100), mode: 'insensitive' } },
                  {
                    capabilities: {
                      some: {
                        OR: [
                          { code: { contains: query.trim().slice(0, 100), mode: 'insensitive' } },
                          { name: { contains: query.trim().slice(0, 100), mode: 'insensitive' } },
                        ],
                      },
                    },
                  },
                ],
              }
            : {}),
        },
      },
      include: {
        entry: {
          select: {
            id: true,
            key: true,
            version: true,
            provider: true,
            namespace: { select: { namespace: true } },
          },
        },
      },
      orderBy: [{ code: 'asc' }, { entryId: 'asc' }],
      take: 500,
    });
  }

  async listProviders(principal: IamPrincipal) {
    const providers = await this.prisma.registryProviderDef.findMany({
      select: {
        id: true,
        provider: true,
        name: true,
        description: true,
        isCore: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { provider: 'asc' },
    });
    return Promise.all(
      providers.map(async (provider) => ({
        ...provider,
        entries: await this.prisma.registryEntry.count({
          where: { ...this.visibleEntries(principal), provider: provider.provider },
        }),
      })),
    );
  }

  listSchemas(principal: IamPrincipal) {
    return this.prisma.registrySchema.findMany({
      where: this.visibleTenant(principal),
      select: {
        id: true,
        code: true,
        name: true,
        version: true,
        description: true,
        supportedBy: true,
        status: true,
        tenantId: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: [{ code: 'asc' }, { version: 'desc' }],
    });
  }

  listCompatibilities(principal: IamPrincipal) {
    return this.prisma.registryCompatibility.findMany({
      where: { tenantId: principal.tenantId ?? '__no_tenant__' },
      include: {
        sourceEntry: { select: { id: true, key: true, version: true } },
        targetEntry: { select: { id: true, key: true, version: true } },
        targetSchema: { select: { id: true, code: true, version: true } },
      },
      omit: { details: true },
      orderBy: { checkedAt: 'desc' },
      take: 500,
    });
  }

  listAvailability(principal: IamPrincipal) {
    return this.prisma.registryAvailability.findMany({
      where: { entry: this.visibleEntries(principal) },
      include: {
        entry: {
          select: {
            id: true,
            namespace: { select: { namespace: true } },
            subDomain: true,
            key: true,
            version: true,
            owner: true,
          },
        },
        omit: { metadata: true, lastProbeResult: true },
      },
      orderBy: [{ environmentCode: 'asc' }, { updatedAt: 'desc' }],
      take: 1000,
    });
  }

  listDiagnostics(principal: IamPrincipal) {
    return this.prisma.registryDiagnostic.findMany({
      where: { tenantId: principal.tenantId ?? '__no_tenant__' },
      select: {
        id: true,
        entryId: true,
        severity: true,
        category: true,
        component: true,
        message: true,
        resolutionId: true,
        traceId: true,
        tenantId: true,
        createdAt: true,
        resolvedAt: true,
        resolvedBy: true,
        entry: {
          select: {
            id: true,
            key: true,
            version: true,
            namespace: { select: { namespace: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 500,
    });
  }

  listAudit(principal: IamPrincipal) {
    return this.prisma.registryAuditEvent.findMany({
      where: { tenantId: principal.tenantId ?? '__no_tenant__' },
      select: {
        id: true,
        traceId: true,
        actorId: true,
        tenantId: true,
        action: true,
        targetType: true,
        targetId: true,
        result: true,
        reason: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 500,
    });
  }

  async register(principal: IamPrincipal, input: RegisterEntryInput) {
    this.assertNamespaceWrite(principal, input.namespace);
    if (!principal.tenantId) throw new ForbiddenException('REGISTRY_TENANT_REQUIRED');
    if (!NAMESPACE_SUBDOMAINS[input.namespace]?.includes(input.subDomain)) {
      throw new BadRequestException('REGISTRY_SUBDOMAIN_NAMESPACE_MISMATCH');
    }
    if (!SAFE_KEY.test(input.key)) throw new BadRequestException('REGISTRY_KEY_INVALID');
    if (!semver.valid(input.version)) throw new BadRequestException('REGISTRY_VERSION_INVALID');
    if (!ENTRY_TYPES.has(input.type)) throw new BadRequestException('REGISTRY_ENTRY_TYPE_INVALID');

    const namespace = await this.prisma.registryNamespaceDef.findUnique({
      where: { namespace: input.namespace },
    });
    if (!namespace) throw new NotFoundException('REGISTRY_NAMESPACE_NOT_CONFIGURED');
    const metadata = input.metadata === undefined ? undefined : metadataJson(input.metadata);
    const capabilityCodes = [...new Set(input.capabilities ?? [])];
    if (
      capabilityCodes.length > 100 ||
      capabilityCodes.some((code) => !SAFE_KEY.test(code))
    ) {
      throw new BadRequestException('REGISTRY_CAPABILITIES_INVALID');
    }
    if (input.schemaRef) {
      const schema = await this.prisma.registrySchema.findFirst({
        where: {
          code: input.schemaRef,
          status: 'ACTIVE',
          ...this.visibleTenant(principal),
        },
      });
      if (!schema) throw new BadRequestException('REGISTRY_SCHEMA_UNSUPPORTED');
    }

    const existing = await this.prisma.registryEntry.findFirst({
      where: {
        namespaceId: namespace.id,
        subDomain: input.subDomain,
        key: input.key,
        version: input.version,
      },
      select: { id: true },
    });
    if (existing) throw new ConflictException('REGISTRY_DUPLICATE_ENTRY');

    try {
      return await this.prisma.$transaction(async (tx) => {
        const entry = await tx.registryEntry.create({
          data: {
            namespaceId: namespace.id,
            subDomain: input.subDomain,
            key: input.key,
            version: input.version,
            type: input.type,
            owner: namespace.authority,
            provider: namespace.authority,
            scope: 'TENANT',
            scopeId: principal.tenantId as string,
            tenantId: principal.tenantId,
            status: RegistryEntryStatus.REGISTERED,
            displayName: input.displayName?.trim().slice(0, 255),
            description: input.description?.trim().slice(0, 4000),
            schemaRef: input.schemaRef,
            metadata,
            sourceModule: `registry:${input.namespace.toLowerCase()}`,
            sourceRef: `tenant:${principal.tenantId}`,
            createdBy: principal.userId,
            updatedBy: principal.userId,
            capabilities: capabilityCodes.length
              ? {
                  create: capabilityCodes.map((code) => ({
                    code,
                    name: code,
                    tenantId: principal.tenantId,
                  })),
                }
              : undefined,
            availabilities: {
              create: {
                tenantId: principal.tenantId,
                registered: true,
                configured: false,
                reachable: false,
                effectiveStatus: RegistryAvailabilityStatus.REGISTERED,
              },
            },
          },
          include: ENTRY_INCLUDE,
        });
        await tx.registryAuditEvent.create({
          data: {
            traceId: randomUUID(),
            actorId: principal.userId,
            tenantId: principal.tenantId,
            action: 'REGISTER',
            targetType: 'ENTRY',
            targetId: entry.id,
            result: 'SUCCESS',
            after: {
              key: entry.key,
              version: entry.version,
              namespace: input.namespace,
              owner: namespace.authority,
            },
          },
        });
        return safeEntry(entry);
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException('REGISTRY_DUPLICATE_ENTRY');
      }
      throw error;
    }
  }

  async resolve(principal: IamPrincipal, input: ResolveInput) {
    const { sourceEntryId, ...requirement } = input;
    if (!requirement.key || requirement.key.length > 200) {
      throw new BadRequestException('REGISTRY_REQUIREMENT_KEY_INVALID');
    }
    if (requirement.published && !requirement.version) {
      throw new BadRequestException('REGISTRY_VERSION_LOCK_REQUIRED');
    }
    if (sourceEntryId) {
      const source = await this.prisma.registryEntry.findFirst({
        where: { id: sourceEntryId, ...this.visibleEntries(principal) },
        select: { id: true },
      });
      if (!source) throw new NotFoundException('REGISTRY_ENTRY_NOT_FOUND');
    }

    const rows = await this.prisma.registryEntry.findMany({
      where: this.visibleEntries(principal),
      include: {
        namespace: true,
        capabilities: true,
        availabilities: true,
      },
      take: 2000,
    });
    const candidates: RegistryCandidate[] = rows.map((entry) => ({
      id: entry.id,
      namespace: entry.namespace.namespace,
      subDomain: entry.subDomain,
      key: entry.key,
      stableKey: namespaceKey(
        entry.namespace.namespace,
        entry.subDomain,
        entry.key,
      ),
      version: entry.version,
      owner: entry.owner,
      provider: entry.provider,
      scope: entry.scope,
      status: entry.status,
      capabilities: entry.capabilities.map(({ code }) => code),
      schemaRef: entry.schemaRef,
      availability: entry.availabilities.map((availability) => ({
        environmentCode: availability.environmentCode,
        status: availability.effectiveStatus,
        configured: availability.configured,
        reachable: availability.reachable,
      })),
    }));

    let result;
    try {
      result = evaluateRegistryCandidates(requirement, candidates);
    } catch (error) {
      if (error instanceof RangeError) {
        throw new BadRequestException(error.message);
      }
      throw error;
    }

    if (sourceEntryId) {
      await this.prisma.$transaction(async (tx) => {
        const source = rows.find(({ id }) => id === sourceEntryId);
        if (!source) throw new NotFoundException('REGISTRY_ENTRY_NOT_FOUND');
        await tx.registryCompatibility.create({
          data: {
            sourceEntryId,
            targetEntryId: result.selectedCandidate?.id,
            requiredVersion: requirement.version ?? requirement.versionRange,
            requiredCapabilities: requirement.requiredCapabilities ?? [],
            result:
              result.status === 'COMPATIBLE'
                ? RegistryCompatibilityResult.COMPATIBLE
                : result.status === 'DEPRECATED'
                  ? RegistryCompatibilityResult.DEGRADED
                  : result.status === 'INCOMPATIBLE' ||
                      result.status === 'MISSING'
                    ? RegistryCompatibilityResult.INCOMPATIBLE
                    : RegistryCompatibilityResult.UNKNOWN,
            details: {
              requirement,
              status: result.status,
              rejectedCandidates: result.rejectedCandidates.map(
                ({ candidate, reasons }) => ({ entryId: candidate.id, reasons }),
              ),
              warnings: result.warnings,
            },
            checkedBy: principal.userId,
            tenantId: principal.tenantId,
          },
        });
        await this.audit(tx, principal, 'RESOLVE', 'ENTRY', sourceEntryId, {
          key: requirement.key,
          result: result.status,
        });
      });
    }
    return result;
  }

  async deprecate(
    principal: IamPrincipal,
    id: string,
    input: { replacementKey?: string; removalTarget?: string; message: string },
  ) {
    const entry = await this.requireEntry(principal, id);
    this.assertNamespaceWrite(principal, entry.namespace.namespace);
    if (!input.message?.trim()) throw new BadRequestException('REGISTRY_DEPRECATION_MESSAGE_REQUIRED');
    if (input.removalTarget && !Number.isFinite(Date.parse(input.removalTarget))) {
      throw new BadRequestException('REGISTRY_REMOVAL_TARGET_INVALID');
    }
    if (input.replacementKey && !SAFE_KEY.test(input.replacementKey)) {
      throw new BadRequestException('REGISTRY_REPLACEMENT_KEY_INVALID');
    }
    return this.changeEntryStatus(
      principal,
      entry,
      RegistryEntryStatus.DEPRECATED,
      'DEPRECATE',
      {
        replacementKey: input.replacementKey,
        removalTarget: input.removalTarget ? new Date(input.removalTarget) : null,
        deprecatedSince: new Date(),
        deprecationMessage: input.message.trim().slice(0, 1000),
      },
    );
  }

  async disable(principal: IamPrincipal, id: string, reason: string) {
    if (!hasPermission(principal, 'registry.disable')) {
      throw new ForbiddenException('REGISTRY_DISABLE_FORBIDDEN');
    }
    if (!reason?.trim()) throw new BadRequestException('REGISTRY_REASON_REQUIRED');
    const entry = await this.requireEntry(principal, id);
    return this.changeEntryStatus(
      principal,
      entry,
      RegistryEntryStatus.DISABLED,
      'DISABLE',
      { deprecationMessage: reason.trim().slice(0, 1000) },
    );
  }

  async remove(principal: IamPrincipal, id: string, reason: string) {
    if (!hasPermission(principal, 'registry.remove')) {
      throw new ForbiddenException('REGISTRY_REMOVE_FORBIDDEN');
    }
    if (!reason?.trim()) throw new BadRequestException('REGISTRY_REASON_REQUIRED');
    const entry = await this.requireEntry(principal, id);
    const stableKey = namespaceKey(
      entry.namespace.namespace,
      entry.subDomain,
      entry.key,
    );
    const referenceKeys = new Set([entry.id, entry.key, stableKey]);
    const referenceTenant = entry.tenantId
      ? { tenantId: entry.tenantId }
      : {};
    const [
      compatibilities,
      publishedPackReference,
      publishedPackManifests,
      runtimeManifests,
    ] =
      await Promise.all([
      this.prisma.registryCompatibility.count({
        where: {
          OR: [{ sourceEntryId: id }, { targetEntryId: id }],
          result: { in: ['COMPATIBLE', 'DEGRADED'] },
          ...referenceTenant,
        },
      }),
      this.prisma.packDependency.findFirst({
        where: {
          targetRef: { in: [entry.id, stableKey] },
          targetType: { in: ['REGISTRY', 'REGISTRY_ENTRY', 'REGISTRY_REF'] },
          archivedAt: null,
          status: 'ACTIVE',
          packVersion: {
            is: {
              status: 'PUBLISHED',
              ...referenceTenant,
              manifest: { is: { status: 'PUBLISHED' } },
            },
          },
        },
        select: { id: true },
      }),
      this.prisma.packManifest.findMany({
        where: { status: 'PUBLISHED', ...referenceTenant },
        select: { content: true },
      }),
      this.prisma.runtimeEffectiveManifest.findMany({
        where: {
          ...referenceTenant,
          executable: true,
        },
        select: { content: true },
      }),
    ]);
    const publishedManifestReference = publishedPackManifests.some(({ content }) =>
      referencesRegistryEntry(content, entry.id, referenceKeys),
    );
    const runtimeReference = runtimeManifests.some(({ content }) =>
      referencesRegistryEntry(content, entry.id, referenceKeys),
    );
    if (
      compatibilities > 0 ||
      publishedPackReference ||
      publishedManifestReference ||
      runtimeReference
    ) {
      throw new ConflictException('REGISTRY_ENTRY_IN_USE');
    }
    return this.changeEntryStatus(
      principal,
      entry,
      RegistryEntryStatus.REMOVED,
      'REMOVE',
      { deprecationMessage: reason.trim().slice(0, 1000) },
    );
  }

  private async changeEntryStatus(
    principal: IamPrincipal,
    entry: {
      id: string;
      status: RegistryEntryStatus;
      namespace: { namespace: RegistryNamespace };
      tenantId: string | null;
    },
    status: RegistryEntryStatus,
    action: string,
    extra: Prisma.RegistryEntryUpdateInput,
  ) {
    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.registryEntry.update({
        where: { id: entry.id },
        data: {
          ...extra,
          status,
          updatedBy: principal.userId,
        },
        include: ENTRY_INCLUDE,
      });
      await this.audit(tx, principal, action, 'ENTRY', entry.id, {
        before: { status: entry.status },
        after: { status },
      });
      return safeEntry(updated);
    });
  }

  private async requireEntry(principal: IamPrincipal, id: string) {
    const entry = await this.prisma.registryEntry.findFirst({
      where: { id, ...this.visibleEntries(principal) },
      include: { namespace: true },
    });
    if (!entry) throw new NotFoundException('REGISTRY_ENTRY_NOT_FOUND');
    return entry;
  }

  private async audit(
    tx: Prisma.TransactionClient,
    principal: IamPrincipal,
    action: string,
    targetType: string,
    targetId: string,
    after: Prisma.InputJsonObject,
  ) {
    await tx.registryAuditEvent.create({
      data: {
        traceId: randomUUID(),
        actorId: principal.userId,
        tenantId: principal.tenantId,
        action,
        targetType,
        targetId,
        result: 'SUCCESS',
        after,
      },
    });
  }

  private visibleEntries(principal: IamPrincipal): Prisma.RegistryEntryWhereInput {
    return {
      OR: [
        { tenantId: null },
        ...(principal.tenantId ? [{ tenantId: principal.tenantId }] : []),
      ],
    };
  }

  private visibleTenant(principal: IamPrincipal): Prisma.RegistrySchemaWhereInput {
    return {
      OR: [
        { tenantId: null },
        ...(principal.tenantId ? [{ tenantId: principal.tenantId }] : []),
      ],
    };
  }

  private assertNamespaceWrite(
    principal: IamPrincipal,
    namespace: RegistryNamespace,
  ) {
    if (
      !hasPermission(principal, 'registry.manage') &&
      !hasPermission(principal, NAMESPACE_PERMISSION[namespace])
    ) {
      throw new ForbiddenException('REGISTRY_NAMESPACE_WRITE_FORBIDDEN');
    }
  }

  private enumValue(value: string, allowed: readonly string[], field: string) {
    if (!allowed.includes(value)) {
      throw new BadRequestException(`REGISTRY_${field.toUpperCase()}_INVALID`);
    }
  }
}
