import { Injectable, Logger } from '@nestjs/common';
import { IErpAdapter } from './interfaces/erp-adapter.interface';
import { MockAdapter } from './mock/mock.adapter';
import { DolibarrAdapter } from './dolibarr/dolibarr.adapter';
import { ErpError } from './erp-error';
import { ErpRegistryService } from '../erp-registry/erp-registry.service';
import { ERPRegistry } from '../generated/prisma/client';
import { DolibarrConfig, DEFAULT_DOLIBARR_CONFIG } from './dolibarr/dolibarr.config';

@Injectable()
export class ErpAdapterService {
  private readonly logger = new Logger(ErpAdapterService.name);
  private adapters: Map<string, IErpAdapter> = new Map();
  private tenantAdapters: Map<string, IErpAdapter> = new Map();

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
   * Creates and caches a new adapter instance per tenant so that
   * each tenant gets its own adapter + HTTP client + URL.
   */
  async resolveAdapterForTenant(tenantId: string): Promise<IErpAdapter> {
    const cached = this.tenantAdapters.get(tenantId);
    if (cached) {
      return cached;
    }

    const registry = await this.erpRegistryService.getActiveForTenant({ tenantId });
    const adapter = this.createAdapterFromRegistry(registry);
    this.tenantAdapters.set(tenantId, adapter);
    this.logger.log(`Adapter resolu pour tenant ${tenantId} - type: ${registry.type}`);
    return adapter;
  }

  private createAdapterFromRegistry(registry: ERPRegistry): IErpAdapter {
    const type = (registry.type || '').toUpperCase();

    if (type === 'DOLIBARR') {
      const adapter = new DolibarrAdapter();
      const capabilities = (registry.capabilities as Record<string, any>) || {};
      const dbApiKey = String(capabilities.apiKey || '').trim();
      const envApiKey = process.env.DOLIBARR_API_KEY || DEFAULT_DOLIBARR_CONFIG.apiKey || '';
      const config: Partial<DolibarrConfig> = {
        baseUrl: (registry.url || '').trim() || process.env.DOLIBARR_URL || DEFAULT_DOLIBARR_CONFIG.baseUrl,
        apiKey: dbApiKey || envApiKey,
        entity: Number(capabilities.entity || process.env.DOLIBARR_ENTITY || DEFAULT_DOLIBARR_CONFIG.entity || 1),
      };
      adapter.configure(config);
      return adapter;
    }

    if (type === 'MOCK') {
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
