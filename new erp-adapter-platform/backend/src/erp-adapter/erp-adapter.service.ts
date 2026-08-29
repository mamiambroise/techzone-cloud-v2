import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { IErpAdapter } from './interfaces/erp-adapter.interface';
import { MockAdapter } from './mock/mock.adapter';
import { DolibarrAdapter } from './dolibarr/dolibarr.adapter';

@Injectable()
export class ErpAdapterService {
  private readonly logger = new Logger(ErpAdapterService.name);
  private adapters: Map<string, IErpAdapter> = new Map();

  constructor(
    private readonly mockAdapter: MockAdapter,
    private readonly dolibarrAdapter: DolibarrAdapter,
  ) {
    this.adapters.set('MOCK', mockAdapter);
    this.adapters.set('DOLIBARR', dolibarrAdapter);
    this.logger.log('Adaptateurs enregistres: MOCK, DOLIBARR');
  }

  getAdapter(erpCode: string): IErpAdapter {
    const adapter = this.adapters.get(erpCode.toUpperCase());
    if (!adapter) {
      throw new NotFoundException(
        `Adaptateur pour l'ERP "${erpCode}" non trouve. Adaptateurs disponibles: ${Array.from(this.adapters.keys()).join(', ')}`,
      );
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
   * Reconfigure l'adaptateur Dolibarr avec de nouvelles valeurs
   */
  configureDolibarr(config: { baseUrl?: string; apiKey?: string; entity?: number }): void {
    this.dolibarrAdapter.configure(config);
    this.logger.log('Adaptateur Dolibarr reconfigure');
  }
}
