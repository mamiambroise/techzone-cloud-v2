import { Module } from '@nestjs/common';
import { DataRuntimeController } from './data-runtime.controller';
import { DataAccessManager } from './data-access/data-access-manager';
import { ERPAdapterDataProvider } from './data-access/erp-adapter.provider';
import { QueryEngine } from './query-engine/query-engine';
import { ExecutionEngine } from './execution-engine/execution-engine';
import { DataBindingService } from './binding/data-binding.service';
import { HistoryService } from './history/history.service';
import { ValidationService } from './validation/validation.service';
import { ErpAdapterModule } from '../erp-adapter/erp-adapter.module';

@Module({
  imports: [ErpAdapterModule],
  controllers: [DataRuntimeController],
  providers: [
    DataAccessManager,
    ERPAdapterDataProvider,
    QueryEngine,
    ExecutionEngine,
    DataBindingService,
    HistoryService,
    ValidationService,
  ],
  exports: [
    DataAccessManager,
    QueryEngine,
    ExecutionEngine,
    DataBindingService,
    HistoryService,
    ValidationService,
  ],
})
export class DataRuntimeModule {
  constructor(
    private readonly dataAccess: DataAccessManager,
    private readonly erpDataProvider: ERPAdapterDataProvider,
  ) {
    // Register the ERP Adapter provider
    this.dataAccess.registerProvider('ERP_ADAPTER', this.erpDataProvider);
    this.dataAccess.registerProvider('DOLIBARR', this.erpDataProvider);
    this.dataAccess.registerProvider('MOCK', this.erpDataProvider);

    // Register canonical resources
    this.dataAccess.registerResource({
      resourceCode: 'Product',
      displayName: 'Produit',
      provider: 'ERP_ADAPTER',
      instance: 'main',
      operations: ['READ', 'LIST', 'CREATE', 'UPDATE', 'DELETE'],
      fields: [
        { code: 'id', displayName: 'ID', type: 'STRING', required: true, nullable: false },
        { code: 'ref', displayName: 'Reference', type: 'STRING', required: true, nullable: false },
        { code: 'label', displayName: 'Nom', type: 'STRING', required: true, nullable: false },
        { code: 'price', displayName: 'Prix', type: 'DECIMAL', required: true, nullable: false },
        { code: 'stock', displayName: 'Stock', type: 'INTEGER', required: false, nullable: true },
      ],
      relations: [],
    });
    this.dataAccess.registerResource({
      resourceCode: 'Client',
      displayName: 'Client',
      provider: 'ERP_ADAPTER',
      instance: 'main',
      operations: ['READ', 'LIST', 'CREATE', 'UPDATE', 'DELETE'],
      fields: [
        { code: 'id', displayName: 'ID', type: 'STRING', required: true, nullable: false },
        { code: 'nom', displayName: 'Nom', type: 'STRING', required: true, nullable: false },
        { code: 'email', displayName: 'Email', type: 'STRING', required: true, nullable: false },
        { code: 'telephone', displayName: 'Telephone', type: 'STRING', required: false, nullable: true },
      ],
      relations: [],
    });
    this.dataAccess.registerResource({
      resourceCode: 'Order',
      displayName: 'Commande',
      provider: 'ERP_ADAPTER',
      instance: 'main',
      operations: ['READ', 'LIST', 'CREATE', 'UPDATE', 'DELETE'],
      fields: [
        { code: 'id', displayName: 'ID', type: 'STRING', required: true, nullable: false },
        { code: 'ref', displayName: 'Reference', type: 'STRING', required: true, nullable: false },
        { code: 'clientId', displayName: 'Client', type: 'REFERENCE', required: true, nullable: false },
        { code: 'total', displayName: 'Total', type: 'DECIMAL', required: false, nullable: true },
        { code: 'status', displayName: 'Statut', type: 'ENUM', required: true, nullable: false, enumValues: ['DRAFT','VALIDATED','PROCESSING','SHIPPED','DELIVERED','CANCELLED','PAID'] },
        { code: 'createdAt', displayName: 'Date creation', type: 'DATETIME', required: false, nullable: true },
      ],
      relations: [
        { code: 'client', displayName: 'Client', targetResource: 'Client', type: 'MANY_TO_ONE' },
      ],
    });
  }
}
