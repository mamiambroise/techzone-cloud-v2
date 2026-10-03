import { Injectable, Logger } from '@nestjs/common';
import { IErpAdapter } from './interfaces/erp-adapter.interface';
import { MockAdapter } from './mock/mock.adapter';
import { DolibarrAdapter } from './dolibarr/dolibarr.adapter';
import { ErpError } from './erp-error';
import { ErpRegistryService } from '../erp-registry/erp-registry.service';
import { ERPRegistry } from '../generated/prisma/client';
import { DolibarrConfig, DEFAULT_DOLIBARR_CONFIG } from './dolibarr/dolibarr.config';
import { resolveErpKey } from '../erp-registry/erp-credentials';

@Injectable()
export class ErpAdapterService {
  private readonly logger = new Logger(ErpAdapterService.name);
  private adapters: Map<string, IErpAdapter> = new Map();

  constructor(
    private readonly mockAdapter: MockAdapter,
    private readonly dolibarrAdapter: DolibarrAdapter,
    private readonly erpRegistryService: ErpRegistryService,
  ) {
    this.adapters.set('MOCK', mockAdapter);
    this.adapters.set('DOLIBARR', dolibarrAdapter);
    this.logger.log('Adaptateurs enregistres: MOCK, DOLIBARR');
  }

  getAdapter(erpCode: string): IErpAdapter {
    const adapter = this.adapters.get(erpCode.toUpperCase());
    if (!adapter) {
      throw ErpError.providerUnsupported(erpCode);
    }
    return adapter;
  }

  getAvailableAdapters(): string[] {
    return Array.from(this.adapters.keys());
  }

  registerAdapter(code: string, adapter: IErpAdapter): void {
    this.adapters.set(code.toUpperCase(), adapter);
    this.logger.log(`Adaptateur enregistre: ${code}`);
  }

  /**
   * Resolve a tenant-isolated adapter from the ERP registry.
   * Revalidates the registry on every resolution so disabled/changed credentials take effect.
   * Creates a new adapter instance per tenant so that
   * each tenant gets its own adapter + HTTP client + URL.
   */
  async resolveAdapterForTenant(tenantId: string, connectorId?: string): Promise<IErpAdapter> {
    if (!tenantId) throw ErpError.tenantRequired();
    const registry = connectorId ? await this.erpRegistryService.getOne(connectorId, { tenantId }) : await this.erpRegistryService.getActiveForTenant({ tenantId });
    if (registry.tenantId !== tenantId) throw ErpError.notConfigured();
    if (registry.status?.toUpperCase() !== 'ACTIVE') throw new ErpError('La connexion ERP est désactivée.', 409, 'CONNECTOR_DISABLED');
    const adapter = this.createAdapterFromRegistry(registry);
    this.logger.log(`Adapter resolu pour tenant ${tenantId} - type: ${registry.type}`);
    return adapter;
  }

  private createAdapterFromRegistry(registry: ERPRegistry): IErpAdapter {
    const type = (registry.type || '').toUpperCase();

    if (type === 'DOLIBARR') {
      const adapter = new DolibarrAdapter();
      const capabilities = (registry.capabilities as Record<string, any>) || {};
      const apiKey = resolveErpKey(capabilities, registry.tenantId);
      if (!registry.url?.trim() || !apiKey) throw ErpError.notConfigured('URL ou clé API Dolibarr manquante.');
      const config: Partial<DolibarrConfig> = {
        baseUrl: registry.url.trim(),
        apiKey,
        entity: Number(capabilities.entity || process.env.DOLIBARR_ENTITY || DEFAULT_DOLIBARR_CONFIG.entity || 1),
      };
      adapter.configure(config);
      return adapter;
    }

    if (type === 'MOCK') {
      if (process.env.NODE_ENV !== 'test' && !(process.env.NODE_ENV !== 'production' && process.env.ERP_DEMO_MODE === 'true')) {
        throw ErpError.notConfigured('Le mode démonstration ERP n’est pas activé.');
      }
      return this.mockAdapter;
    }

    throw ErpError.providerUnsupported(type);
  }

  /**
   * Reconfigure l'adaptateur Dolibarr avec de nouvelles valeurs
   * @deprecated Use resolveAdapterForTenant for per-tenant isolation
   */
  configureDolibarr(config: { baseUrl?: string; apiKey?: string; entity?: number }): void {
    this.dolibarrAdapter.configure(config);
    this.logger.log('Adaptateur Dolibarr reconfigure');
  }
}
