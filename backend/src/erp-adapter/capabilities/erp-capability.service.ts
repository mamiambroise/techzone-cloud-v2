import { Injectable, Logger } from '@nestjs/common';
import axios, { AxiosInstance, AxiosError } from 'axios';
import { randomUUID } from 'node:crypto';
import { PrismaService } from '../../prisma/prisma.service';
import { ErpRegistryService, TenantContext } from '../../erp-registry/erp-registry.service';
import { ErpError } from '../erp-error';
import { resolveErpKey } from '../../erp-registry/erp-credentials';
import { validateDolibarrUrl, dolibarrAgents } from '../dolibarr/dolibarr-destination';
import { ERPRegistry } from '../../generated/prisma/client';

export type ErpCapabilityStatus = 'AVAILABLE' | 'UNAVAILABLE' | 'NOT_IMPLEMENTED' | 'AUTH_FAILED' | 'ERROR';

export type ConnectorAvailability = 'UNCONFIGURED' | 'AVAILABLE' | 'DEGRADED' | 'UNAVAILABLE' | 'ERROR';

export interface ErpCapabilityReport {
  connectorId: string;
  tenantId: string;
  code: string;
  nom: string;
  type: string;
  url: string;
  status: ConnectorAvailability;
  credentialStatus: 'CONFIGURED' | 'MISSING';
  failure: string | null;
  providerVersion: string | null;
  environment: string | null;
  checkedAt: string;
  capabilities: Record<string, ErpCapabilityStatus>;
  evidence: Record<string, string>;
  summary: {
    total: number;
    available: number;
    unavailable: number;
    notImplemented: number;
    authFailed: number;
    errors: number;
  };
}

interface CapabilityProbe {
  readonly capability: string;
  readonly method: 'GET' | 'POST' | 'PUT';
  readonly path: string;
  readonly kind: 'read' | 'write';
}

const CAPABILITY_PROBES: readonly CapabilityProbe[] = [
  { capability: 'customer.read', method: 'GET', path: '/thirdparties', kind: 'read' },
  { capability: 'customer.create', method: 'POST', path: '/thirdparties', kind: 'write' },
  { capability: 'customer.update', method: 'PUT', path: '/thirdparties/0', kind: 'write' },
  { capability: 'product.read', method: 'GET', path: '/products', kind: 'read' },
  { capability: 'product.create', method: 'POST', path: '/products', kind: 'write' },
  { capability: 'product.update', method: 'PUT', path: '/products/0', kind: 'write' },
  { capability: 'order.read', method: 'GET', path: '/orders', kind: 'read' },
  { capability: 'order.create', method: 'POST', path: '/orders', kind: 'write' },
  { capability: 'order.update', method: 'PUT', path: '/orders/0', kind: 'write' },
  { capability: 'invoice.read', method: 'GET', path: '/invoices', kind: 'read' },
  { capability: 'invoice.create', method: 'POST', path: '/invoices', kind: 'write' },
  { capability: 'payment.create', method: 'POST', path: '/payments', kind: 'write' },
  { capability: 'supplierorder.read', method: 'GET', path: '/supplierorders', kind: 'read' },
  { capability: 'warehouse.read', method: 'GET', path: '/warehouses', kind: 'read' },
  { capability: 'stockmovement.read', method: 'GET', path: '/stockmovements', kind: 'read' },
  { capability: 'project.read', method: 'GET', path: '/projects', kind: 'read' },
  { capability: 'agenda.read', method: 'GET', path: '/agenda', kind: 'read' },
  { capability: 'agenda.create', method: 'POST', path: '/agenda', kind: 'write' },
];

const CORE_CAPABILITIES = ['customer.read', 'product.read', 'order.read'];

const PROBE_TIMEOUT_MS = 8000;
const PROBE_ENTITY = Number(process.env.DOLIBARR_ENTITY) || 1;

function classifyProbe(kind: 'read' | 'write', status: number): { status: ErpCapabilityStatus; evidence: string } {
  if (status === 401) return { status: 'AUTH_FAILED', evidence: 'HTTP 401 — cle API refusee' };
  if (status === 403) return { status: 'UNAVAILABLE', evidence: 'HTTP 403 — permission Dolibarr refusee' };
  if (status === 501) return { status: 'NOT_IMPLEMENTED', evidence: 'HTTP 501 — API non implementee' };
  if (kind === 'read') {
    if (status >= 200 && status < 300) return { status: 'AVAILABLE', evidence: `HTTP ${status}` };
    if (status === 404) return { status: 'AVAILABLE', evidence: 'HTTP 404 — collection vide, route exposee' };
    return { status: 'ERROR', evidence: `HTTP ${status}` };
  }
  if (status >= 200 && status < 300) return { status: 'AVAILABLE', evidence: `HTTP ${status} — attention: creation possible` };
  if (status === 400 || status === 422) return { status: 'AVAILABLE', evidence: `HTTP ${status} — route exposee, validation refusee (aucune creation)` };
  if (status === 404) return { status: 'AVAILABLE', evidence: 'HTTP 404 — route exposee, ressource introuvable' };
  if (status === 409) return { status: 'AVAILABLE', evidence: 'HTTP 409 — route exposee, conflit detecte' };
  return { status: 'ERROR', evidence: `HTTP ${status}` };
}

function summarize(capabilities: Record<string, ErpCapabilityStatus>): ErpCapabilityReport['summary'] {
  const values = Object.values(capabilities);
  return {
    total: values.length,
    available: values.filter(v => v === 'AVAILABLE').length,
    unavailable: values.filter(v => v === 'UNAVAILABLE').length,
    notImplemented: values.filter(v => v === 'NOT_IMPLEMENTED').length,
    authFailed: values.filter(v => v === 'AUTH_FAILED').length,
    errors: values.filter(v => v === 'ERROR').length,
  };
}

function computeStatus(capabilities: Record<string, ErpCapabilityStatus>): ConnectorAvailability {
  const values = Object.values(capabilities);
  if (values.length > 0 && values.every(v => v === 'AUTH_FAILED')) return 'UNAVAILABLE';
  const coreAvailable = CORE_CAPABILITIES.every(c => capabilities[c] === 'AVAILABLE');
  if (coreAvailable) return 'AVAILABLE';
  if (values.some(v => v === 'AVAILABLE')) return 'DEGRADED';
  return 'UNAVAILABLE';
}

@Injectable()
export class ErpCapabilityService {
  private readonly logger = new Logger(ErpCapabilityService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly erpRegistry: ErpRegistryService,
  ) {}

  async testConnection(id: string | undefined, ctx: TenantContext): Promise<ErpCapabilityReport> {
    const tenantId = this.requireTenant(ctx);
    const registry = id ? await this.erpRegistry.getOne(id, ctx) : await this.erpRegistry.getActiveForTenant(ctx);
    const stored = (registry.capabilities || {}) as Record<string, unknown>;

    let apiKey = '';
    let credentialStatus: 'CONFIGURED' | 'MISSING' = 'CONFIGURED';
    try {
      apiKey = resolveErpKey(stored as Record<string, any>, registry.tenantId);
    } catch {
      credentialStatus = 'MISSING';
    }

    if (!registry.url?.trim()) {
      return this.finalize(registry, ctx, {
        status: 'UNCONFIGURED',
        credentialStatus,
        failure: 'ERP_URL_MISSING',
        providerVersion: null,
        environment: null,
        capabilities: {},
        evidence: {},
        probed: false,
      });
    }
    if (credentialStatus === 'MISSING' || !apiKey) {
      return this.finalize(registry, ctx, {
        status: 'UNAVAILABLE',
        credentialStatus: 'MISSING',
        failure: 'ERP_CREDENTIAL_MISSING',
        providerVersion: null,
        environment: null,
        capabilities: {},
        evidence: {},
        probed: false,
      });
    }

    let destination: URL;
    try {
      destination = validateDolibarrUrl(registry.url.trim());
    } catch (error) {
      return this.finalize(registry, ctx, {
        status: 'ERROR',
        credentialStatus,
        failure: 'ERP_URL_INVALID',
        providerVersion: null,
        environment: null,
        capabilities: {},
        evidence: {},
        probed: false,
      });
    }

    const client = this.createProbeClient(destination, apiKey);
    const provider = await this.probeProvider(client);
    if (provider.authFailed) {
      const capabilities: Record<string, ErpCapabilityStatus> = {};
      const evidence: Record<string, string> = {};
      for (const probe of CAPABILITY_PROBES) {
        capabilities[probe.capability] = 'AUTH_FAILED';
        evidence[probe.capability] = 'HTTP 401 — cle API refusee';
      }
      return this.finalize(registry, ctx, {
        status: 'UNAVAILABLE',
        credentialStatus,
        failure: 'ERP_AUTH_FAILED',
        providerVersion: null,
        environment: null,
        capabilities,
        evidence,
        probed: true,
      });
    }
    if (provider.unreachable) {
      return this.finalize(registry, ctx, {
        status: 'ERROR',
        credentialStatus,
        failure: 'ERP_PROVIDER_UNREACHABLE',
        providerVersion: null,
        environment: null,
        capabilities: {},
        evidence: {},
        probed: false,
      });
    }

    const capabilities: Record<string, ErpCapabilityStatus> = {};
    const evidence: Record<string, string> = {};
    for (const probe of CAPABILITY_PROBES) {
      const outcome = await this.probeCapability(client, probe);
      capabilities[probe.capability] = outcome.status;
      evidence[probe.capability] = outcome.evidence;
    }

    return this.finalize(registry, ctx, {
      status: computeStatus(capabilities),
      credentialStatus,
      failure: null,
      providerVersion: provider.version,
      environment: provider.environment,
      capabilities,
      evidence,
      probed: true,
    });
  }

  async getHealth(id: string | undefined, ctx: TenantContext) {
    const tenantId = this.requireTenant(ctx);
    const registry = id ? await this.erpRegistry.getOne(id, ctx) : await this.erpRegistry.getActiveForTenant(ctx);
    const stored = (registry.capabilities || {}) as Record<string, unknown>;
    return {
      connectorId: registry.id,
      tenantId,
      code: registry.code,
      nom: registry.nom,
      type: registry.type,
      url: registry.url,
      status: (registry.status || 'inactive').toUpperCase(),
      healthStatus: registry.healthStatus || 'unknown',
      credentialStatus: this.credentialStatus(stored, registry.tenantId),
      capabilities: (stored.capabilities as Record<string, ErpCapabilityStatus>) || null,
      providerVersion: (stored.providerVersion as string) || null,
      environment: (stored.environment as string) || null,
      lastCapabilityCheck: (stored.lastCapabilityCheck as string) || null,
      lastConnection: registry.lastConnection ? registry.lastConnection.toISOString() : null,
      updatedAt: registry.updatedAt.toISOString(),
    };
  }

  async getCapabilities(id: string | undefined, ctx: TenantContext) {
    const health = await this.getHealth(id, ctx);
    return {
      connectorId: health.connectorId,
      tenantId: health.tenantId,
      code: health.code,
      type: health.type,
      healthStatus: health.healthStatus,
      providerVersion: health.providerVersion,
      environment: health.environment,
      lastCapabilityCheck: health.lastCapabilityCheck,
      capabilities: health.capabilities,
    };
  }

  private credentialStatus(stored: Record<string, unknown>, tenantId: string): 'CONFIGURED' | 'MISSING' {
    if (stored.encryptedApiKey || stored.apiKey) return 'CONFIGURED';
    const tenantKey = 'DOLIBARR_API_KEY_' + tenantId.replace(/-/g, '_').toUpperCase();
    if (process.env[tenantKey]) return 'CONFIGURED';
    if (process.env.DOLIBARR_TENANT_ID === tenantId && process.env.DOLIBARR_API_KEY) return 'CONFIGURED';
    return 'MISSING';
  }

  private createProbeClient(destination: URL, apiKey: string): AxiosInstance {
    const base = destination.toString().replace(/\/+$/, '').replace(/\/api\/index\.php$/, '');
    return axios.create({
      maxRedirects: 0,
      maxContentLength: 64 * 1024,
      maxBodyLength: 64 * 1024,
      proxy: false,
      ...dolibarrAgents(destination),
      baseURL: `${base}/api/index.php`,
      timeout: PROBE_TIMEOUT_MS,
      headers: { DOLAPIKEY: apiKey, 'Content-Type': 'application/json', Accept: 'application/json' },
      validateStatus: () => true,
    });
  }

  private async probeProvider(client: AxiosInstance): Promise<{ version: string | null; environment: string | null; authFailed: boolean; unreachable: boolean }> {
    try {
      const response = await client.get('/status');
      if (response.status === 401) return { version: null, environment: null, authFailed: true, unreachable: false };
      if (response.status === 200 && response.data && typeof response.data === 'object') {
        const data = response.data as Record<string, unknown>;
        return {
          version: typeof data.dolibarr_version === 'string' ? data.dolibarr_version : null,
          environment: typeof data.environment === 'string' ? data.environment : null,
          authFailed: false,
          unreachable: false,
        };
      }
      return { version: null, environment: null, authFailed: false, unreachable: false };
    } catch (error) {
      const code = (error as AxiosError).code;
      this.logger.warn(`Provider probe transport error: ${code || 'unknown'}`);
      return { version: null, environment: null, authFailed: false, unreachable: true };
    }
  }

  private async probeCapability(client: AxiosInstance, probe: CapabilityProbe): Promise<{ status: ErpCapabilityStatus; evidence: string; httpStatus: number | null }> {
    try {
      const response = await client.request({
        method: probe.method,
        url: probe.path,
        params: probe.kind === 'read' ? { entity: PROBE_ENTITY, limit: 1 } : undefined,
        data: probe.kind === 'write' ? { capabilityProbe: true } : undefined,
      });
      const { status, evidence } = classifyProbe(probe.kind, response.status);
      return { status, evidence, httpStatus: response.status };
    } catch (error) {
      const code = (error as AxiosError).code;
      const evidence = code === 'ECONNABORTED' || code === 'ETIMEDOUT' ? 'delai de reponse depasse' : `erreur reseau (${code || 'inconnue'})`;
      return { status: 'ERROR', evidence, httpStatus: null };
    }
  }

  private async finalize(
    registry: ERPRegistry,
    ctx: TenantContext,
    outcome: {
      status: ConnectorAvailability;
      credentialStatus: 'CONFIGURED' | 'MISSING';
      failure: string | null;
      providerVersion: string | null;
      environment: string | null;
      capabilities: Record<string, ErpCapabilityStatus>;
      evidence: Record<string, string>;
      probed: boolean;
    },
  ): Promise<ErpCapabilityReport> {
    const checkedAt = new Date().toISOString();
    const stored = { ...((registry.capabilities || {}) as Record<string, unknown>) };
    if (outcome.probed) {
      stored.capabilities = outcome.capabilities;
      stored.capabilityEvidence = outcome.evidence;
      stored.providerVersion = outcome.providerVersion ?? null;
      stored.environment = outcome.environment ?? null;
      stored.lastCapabilityCheck = checkedAt;
    }
    await this.prisma.eRPRegistry.update({
      where: { id: registry.id, tenantId: registry.tenantId },
      data: {
        healthStatus: outcome.status,
        ...(outcome.probed ? { lastConnection: new Date() } : {}),
        capabilities: stored as any,
      },
    });
    await this.prisma.auditEvent.create({
      data: {
        tenantId: registry.tenantId,
        actorId: ctx?.actorId,
        traceId: randomUUID(),
        action: 'ERP_CONNECTOR_TESTED',
        targetType: 'ERP_CONNECTOR',
        targetId: registry.id,
        result: outcome.status,
        ...(outcome.failure ? { reason: outcome.failure } : {}),
        metadata: outcome.probed
          ? { available: summarize(outcome.capabilities).available, total: summarize(outcome.capabilities).total, providerVersion: outcome.providerVersion }
          : { failure: outcome.failure },
      },
    });
    this.logger.log(`ERP connector test [tenant=${registry.tenantId}] [code=${registry.code}] -> ${outcome.status}${outcome.failure ? ` (${outcome.failure})` : ''}`);
    return {
      connectorId: registry.id,
      tenantId: registry.tenantId,
      code: registry.code,
      nom: registry.nom,
      type: registry.type,
      url: registry.url,
      status: outcome.status,
      credentialStatus: outcome.credentialStatus,
      failure: outcome.failure,
      providerVersion: outcome.providerVersion,
      environment: outcome.environment,
      checkedAt,
      capabilities: outcome.capabilities,
      evidence: outcome.evidence,
      summary: summarize(outcome.capabilities),
    };
  }

  private requireTenant(ctx?: TenantContext): string {
    const tenantId = ctx?.tenantId;
    if (!tenantId) {
      throw new ErpError('TENANT_REQUIRED: tenantId manquant dans le contexte', 400, 'TENANT_REQUIRED');
    }
    return tenantId;
  }
}
