import { BadRequestException, Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { ConfigurationScope, ConfigurationStatus, ConfigurationType } from '../../generated/prisma/enums';
import { PrismaService } from '../../prisma/prisma.service';
import { ErpRegistryService, TenantContext } from '../../erp-registry/erp-registry.service';
import { ErpCapabilityStatus } from '../capabilities/erp-capability.service';
import { hasPermission } from '../../iam/decorators/current-user.decorator';
import { ERP_READ, ERP_WRITE } from '../../iam/iam.constants';
import { ERP_RESOURCE_CATALOG, ErpOperation, ErpResourceDefinition, getErpResourceDefinition } from './erp-resource-catalog';

const POLICY_KEY = 'erp.resource-policy';

type StoredPolicy = { version?: number; resources?: Record<string, boolean> };

export interface ErpOperationDecision {
  allowed: boolean;
  statusCode: number;
  code: string;
  message: string;
  providerStatus: ErpCapabilityStatus | null;
  requiredPermission: string | null;
}

export interface EffectiveErpResource {
  key: string;
  label: string;
  category: string;
  provider: 'dolibarr';
  routeKey?: string;
  adapterImplemented: boolean;
  platformAllowed: boolean;
  providerStatus: ErpCapabilityStatus;
  effectiveStatus: ErpCapabilityStatus;
  usable: boolean;
  operations: Array<{ key: string; adapterImplemented: boolean; capability: string | null; providerStatus: ErpCapabilityStatus; requiredPermission: string; iamAllowed: boolean; executable: boolean }>;
  capabilities: string[];
  probeSupported: boolean;
  contractOperations: readonly string[];
  mappingSupport: ErpResourceDefinition['mappingSupport'];
  lastCheckedAt: string | null;
  diagnostic: string | null;
}

@Injectable()
export class ErpResourceCatalogService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly registry: ErpRegistryService,
  ) {}

  async getCatalog(ctx: TenantContext) {
    const tenantId = this.requireTenant(ctx);
    const connector = await this.registry.getActiveForTenant({ tenantId, actorId: ctx.actorId });
    const stored = (connector.capabilities || {}) as Record<string, unknown>;
    const capabilities = this.statusMap(stored.capabilities);
    const evidence = this.stringMap(stored.capabilityEvidence);
    const policy = await this.readPolicy();
    const lastCheckedAt = typeof stored.lastCapabilityCheck === 'string' ? stored.lastCapabilityCheck : null;
    const resources = ERP_RESOURCE_CATALOG.map((definition) =>
      this.resolveResource(definition, policy.resources ?? {}, capabilities, evidence, lastCheckedAt, ctx),
    );

    return {
      connector: {
        code: connector.code,
        type: connector.type,
        status: connector.status,
        healthStatus: connector.healthStatus,
        credentialStatus: this.credentialConfigured(stored) ? 'CONFIGURED' : 'MISSING',
        providerVersion: typeof stored.providerVersion === 'string' ? stored.providerVersion : null,
        environment: typeof stored.environment === 'string' ? stored.environment : null,
        lastCheckedAt,
      },
      policy: { storage: 'Configuration/PLATFORM', defaultAllowed: true },
      summary: this.summarize(resources),
      resources,
    };
  }

  async getPolicy() {
    const policy = await this.readPolicy();
    return {
      storage: 'Configuration/PLATFORM',
      defaultAllowed: true,
      resources: ERP_RESOURCE_CATALOG.map((resource) => ({ key: resource.key, platformAllowed: policy.resources?.[resource.key] !== false })),
    };
  }

  /** Shared fail-closed decision for every ERP business operation. */
  async getOperationDecision(input: TenantContext & { resourceKey: string; operation: ErpOperation; mappingRequired?: boolean }): Promise<ErpOperationDecision> {
    const definition = getErpResourceDefinition(input.resourceKey);
    if (!definition) return this.denied(404, 'ERP_RESOURCE_DISABLED', 'Ressource ERP inconnue ou dÃ©sactivÃ©e.', null, null);
    const operation = definition.operations.find((item) => item.key === input.operation);
    const requiredPermission = input.operation === 'read' ? ERP_READ : ERP_WRITE;
    if (!operation) return this.denied(501, 'ERP_OPERATION_NOT_IMPLEMENTED', 'OpÃ©ration ERP non dÃ©clarÃ©e dans le catalogue.', null, requiredPermission);
    if (!this.iamAllowed(input, requiredPermission)) return this.denied(403, 'ERP_PERMISSION_DENIED', 'Permission IAM insuffisante pour cette opÃ©ration ERP.', null, requiredPermission);

    const tenantId = this.requireTenant(input);
    const connector = await this.registry.getActiveForTenant({ tenantId, actorId: input.actorId });
    const stored = (connector.capabilities || {}) as Record<string, unknown>;
    const policy = await this.readPolicy();
    if (policy.resources?.[definition.key] === false) return this.denied(409, 'ERP_PLATFORM_DISABLED', 'Cette ressource ERP est dÃ©sactivÃ©e par la politique plateforme.', null, requiredPermission);
    if (input.mappingRequired && definition.mappingSupport === 'NONE') return this.denied(409, 'ERP_RESOURCE_DISABLED', 'Cette ressource ne dispose pas du mapping requis.', null, requiredPermission);

    const capabilities = this.statusMap(stored.capabilities);
    const providerStatus: ErpCapabilityStatus = operation.capability
      ? capabilities[operation.capability] ?? 'UNKNOWN'
      : operation.adapterImplemented && definition.adapterImplemented ? 'UNKNOWN' : 'NOT_IMPLEMENTED';
    if (providerStatus !== 'AVAILABLE') return this.providerDenied(providerStatus, requiredPermission);
    if (!definition.adapterImplemented || !operation.adapterImplemented) {
      return this.denied(501, 'ERP_OPERATION_NOT_IMPLEMENTED', 'Lâ€™adaptateur Techzone ne prend pas encore en charge cette opÃ©ration.', providerStatus, requiredPermission);
    }
    return { allowed: true, statusCode: 200, code: 'ERP_OPERATION_AVAILABLE', message: 'OpÃ©ration ERP autorisÃ©e.', providerStatus, requiredPermission };
  }

  async setPlatformAllowed(resourceKey: string, platformAllowed: boolean, actorId?: string) {
    const definition = getErpResourceDefinition(resourceKey);
    if (!definition) throw new BadRequestException(`Ressource ERP inconnue : ${resourceKey}`);
    if (typeof platformAllowed !== 'boolean') throw new BadRequestException('platformAllowed doit être un booléen');

    const existing = await this.findPolicyConfiguration();
    const current = this.policyFromValue(existing?.value);
    const oldValue = current.resources?.[resourceKey] !== false;
    const resources = { ...(current.resources ?? {}), [resourceKey]: platformAllowed };
    const value = { version: 1, resources };

    const saved = await this.prisma.$transaction(async (tx) => {
      const configuration = existing
        ? await tx.configuration.update({ where: { id: existing.id }, data: { value: value as any } })
        : await tx.configuration.create({
            data: {
              key: POLICY_KEY,
              scope: ConfigurationScope.PLATFORM,
              scopeId: null,
              type: ConfigurationType.JSON,
              value: value as any,
              defaultValue: { version: 1, resources: {} } as any,
              status: ConfigurationStatus.ACTIVE,
              required: false,
              version: '1.0.0',
              tenantId: null,
            },
          });
      await tx.auditEvent.create({
        data: {
          traceId: randomUUID(),
          actorId,
          action: 'ERP_RESOURCE_POLICY_CHANGED',
          targetType: 'ERP_RESOURCE',
          targetId: resourceKey,
          result: 'SUCCESS',
          before: { platformAllowed: oldValue },
          after: { platformAllowed },
          metadata: { configurationId: configuration.id, storage: 'Configuration/PLATFORM' },
        },
      });
      return configuration;
    });

    return { key: definition.key, platformAllowed, updatedAt: saved.updatedAt.toISOString() };
  }

  private resolveResource(
    definition: ErpResourceDefinition,
    policy: Record<string, boolean>,
    capabilities: Record<string, ErpCapabilityStatus>,
    evidence: Record<string, string>,
    lastCheckedAt: string | null,
    ctx: TenantContext,
  ): EffectiveErpResource {
    const platformAllowed = policy[definition.key] !== false;
    const resourceCapabilities = definition.operations.flatMap((operation) => operation.capability ? [operation.capability] : []);
    const operationStatuses = definition.operations.map((operation) => {
      const requiredPermission = operation.key === 'read' ? ERP_READ : ERP_WRITE;
      const providerStatus: ErpCapabilityStatus = operation.capability
        ? capabilities[operation.capability] ?? 'UNKNOWN'
        : operation.adapterImplemented
          ? 'UNKNOWN'
          : 'NOT_IMPLEMENTED';
      const iamAllowed = this.iamAllowed(ctx, requiredPermission);
      return {
        key: operation.key,
        adapterImplemented: operation.adapterImplemented,
        capability: operation.capability ?? null,
        providerStatus,
        requiredPermission,
        iamAllowed,
        executable: definition.adapterImplemented && operation.adapterImplemented && platformAllowed && iamAllowed && providerStatus === 'AVAILABLE',
      };
    });
    const providerStatus = this.providerStatus(definition.adapterImplemented, operationStatuses.map((operation) => operation.providerStatus));
    const effectiveStatus: ErpCapabilityStatus = !definition.adapterImplemented
      ? 'NOT_IMPLEMENTED'
      : !platformAllowed
        ? 'UNAVAILABLE'
        : providerStatus;
    const diagnosticCapability = resourceCapabilities.find((capability) => evidence[capability]);
    return {
      key: definition.key,
      label: definition.label,
      category: definition.category,
      provider: definition.provider,
      ...(definition.routeKey ? { routeKey: definition.routeKey } : {}),
      adapterImplemented: definition.adapterImplemented,
      platformAllowed,
      providerStatus,
      effectiveStatus,
      usable: platformAllowed && providerStatus === 'AVAILABLE',
      operations: operationStatuses,
      capabilities: resourceCapabilities,
      probeSupported: definition.probeSupported,
      contractOperations: definition.contractOperations,
      mappingSupport: definition.mappingSupport,
      lastCheckedAt,
      diagnostic: diagnosticCapability ? evidence[diagnosticCapability] : null,
    };
  }

  private providerStatus(implemented: boolean, statuses: ErpCapabilityStatus[]): ErpCapabilityStatus {
    if (!implemented) return 'NOT_IMPLEMENTED';
    if (statuses.includes('MODULE_DISABLED')) return 'MODULE_DISABLED';
    if (statuses.includes('PERMISSION_DENIED')) return 'PERMISSION_DENIED';
    if (statuses.includes('AUTH_FAILED')) return 'AUTH_FAILED';
    if (statuses.includes('UNAVAILABLE')) return 'UNAVAILABLE';
    if (statuses.includes('AVAILABLE')) return 'AVAILABLE';
    if (statuses.includes('NOT_SUPPORTED')) return 'NOT_SUPPORTED';
    if (statuses.includes('ERROR')) return 'ERROR';
    if (statuses.includes('NOT_IMPLEMENTED')) return 'NOT_IMPLEMENTED';
    return 'UNKNOWN';
  }

  private summarize(resources: EffectiveErpResource[]) {
    const count = (status: ErpCapabilityStatus) => resources.filter((resource) => resource.effectiveStatus === status).length;
    return {
      total: resources.length,
      implemented: resources.filter((resource) => resource.adapterImplemented).length,
      available: count('AVAILABLE'),
      permissionDenied: count('PERMISSION_DENIED'),
      moduleDisabled: count('MODULE_DISABLED'),
      notSupported: count('NOT_SUPPORTED'),
      notImplemented: count('NOT_IMPLEMENTED'),
      unknown: count('UNKNOWN'),
      unavailable: count('UNAVAILABLE'),
      error: count('ERROR'),
    };
  }

  private async readPolicy(): Promise<StoredPolicy> {
    return this.policyFromValue((await this.findPolicyConfiguration())?.value);
  }

  private async findPolicyConfiguration() {
    return this.prisma.configuration.findFirst({
      where: { key: POLICY_KEY, scope: ConfigurationScope.PLATFORM, scopeId: null, tenantId: null, status: ConfigurationStatus.ACTIVE },
      orderBy: { updatedAt: 'desc' },
    });
  }

  private policyFromValue(value: unknown): StoredPolicy {
    if (!value || typeof value !== 'object' || Array.isArray(value)) return { version: 1, resources: {} };
    const raw = value as Record<string, unknown>;
    const resources = raw.resources && typeof raw.resources === 'object' && !Array.isArray(raw.resources)
      ? Object.fromEntries(Object.entries(raw.resources as Record<string, unknown>).filter(([, allowed]) => typeof allowed === 'boolean')) as Record<string, boolean>
      : {};
    return { version: typeof raw.version === 'number' ? raw.version : 1, resources };
  }

  private statusMap(value: unknown): Record<string, ErpCapabilityStatus> {
    if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
    const statuses = new Set<ErpCapabilityStatus>(['AVAILABLE', 'PERMISSION_DENIED', 'MODULE_DISABLED', 'NOT_SUPPORTED', 'NOT_IMPLEMENTED', 'UNKNOWN', 'UNAVAILABLE', 'AUTH_FAILED', 'ERROR']);
    return Object.fromEntries(Object.entries(value as Record<string, unknown>).filter(([, status]) => typeof status === 'string' && statuses.has(status as ErpCapabilityStatus))) as Record<string, ErpCapabilityStatus>;
  }

  private stringMap(value: unknown): Record<string, string> {
    if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
    return Object.fromEntries(Object.entries(value as Record<string, unknown>).filter(([, evidence]) => typeof evidence === 'string')) as Record<string, string>;
  }

  private credentialConfigured(stored: Record<string, unknown>) {
    return Boolean(stored.encryptedApiKey || stored.apiKey);
  }

  private iamAllowed(input: TenantContext, permission: string) {
    return hasPermission({ userId: input.actorId || '', sessionId: '', roles: [], permissions: input.permissions || [], isSuperAdmin: input.isSuperAdmin } as any, permission);
  }

  private providerDenied(providerStatus: ErpCapabilityStatus, requiredPermission: string): ErpOperationDecision {
    const normalized: Record<ErpCapabilityStatus, [number, string, string]> = {
      AVAILABLE: [200, 'ERP_OPERATION_AVAILABLE', 'OpÃ©ration ERP autorisÃ©e.'],
      PERMISSION_DENIED: [409, 'ERP_PERMISSION_DENIED', 'Dolibarr refuse cette opÃ©ration : permission fournisseur requise.'],
      MODULE_DISABLED: [409, 'ERP_PROVIDER_MODULE_DISABLED', 'Le module Dolibarr requis est dÃ©sactivÃ© ou inaccessible.'],
      NOT_SUPPORTED: [501, 'ERP_OPERATION_NOT_SUPPORTED', 'Cette opÃ©ration nâ€™est pas supportÃ©e par lâ€™API fournisseur.'],
      NOT_IMPLEMENTED: [501, 'ERP_OPERATION_NOT_IMPLEMENTED', 'Cette opÃ©ration nâ€™est pas implÃ©mentÃ©e dans Techzone.'],
      UNKNOWN: [409, 'ERP_CAPABILITY_UNKNOWN', 'La capability fournisseur doit Ãªtre vÃ©rifiÃ©e avant exÃ©cution.'],
      UNAVAILABLE: [503, 'ERP_PROVIDER_UNAVAILABLE', 'Le fournisseur ERP est indisponible.'],
      AUTH_FAILED: [502, 'ERP_PERMISSION_DENIED', 'Lâ€™authentification fournisseur doit Ãªtre corrigÃ©e.'],
      ERROR: [502, 'ERP_PROVIDER_UNAVAILABLE', 'La capability fournisseur est en erreur.'],
    };
    const [statusCode, code, message] = normalized[providerStatus];
    return this.denied(statusCode, code, message, providerStatus, requiredPermission);
  }

  private denied(statusCode: number, code: string, message: string, providerStatus: ErpCapabilityStatus | null, requiredPermission: string | null): ErpOperationDecision {
    return { allowed: false, statusCode, code, message, providerStatus, requiredPermission };
  }

  private requireTenant(ctx?: TenantContext) {
    if (!ctx?.tenantId) throw new BadRequestException('TENANT_REQUIRED: tenantId manquant dans le contexte');
    return ctx.tenantId;
  }
}
