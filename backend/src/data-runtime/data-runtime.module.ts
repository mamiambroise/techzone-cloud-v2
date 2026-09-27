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
import { ErpRegistryModule } from '../erp-registry/erp-registry.module';
import { ResourceDescriptor } from './interfaces';

@Module({
  imports: [ErpAdapterModule, ErpRegistryModule],
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
    private readonly validationService: ValidationService,
  ) {
    // Register the ERP Adapter provider
    this.dataAccess.registerProvider('ERP_ADAPTER', this.erpDataProvider);

    // Register canonical resources
    const productResource: ResourceDescriptor = {
      resourceCode: 'Product',
      displayName: 'Produit',
      provider: 'ERP_ADAPTER',
      instance: 'main',
      operations: ['READ', 'LIST', 'CREATE', 'UPDATE', 'DELETE'],
      fields: [
        { code: 'id', displayName: 'ID', type: 'STRING', required: false, nullable: true },
        { code: 'ref', displayName: 'Reference', type: 'STRING', required: true, nullable: false },
        { code: 'label', displayName: 'Nom', type: 'STRING', required: true, nullable: false },
        { code: 'price', displayName: 'Prix', type: 'DECIMAL', required: true, nullable: false },
        { code: 'stock', displayName: 'Stock', type: 'INTEGER', required: false, nullable: true },
      ],
      relations: [],
    };
    this.dataAccess.registerResource(productResource);
    this.validationService.registerSchema('product', productResource.fields);
    const clientResource: ResourceDescriptor = {
      resourceCode: 'Client',
      displayName: 'Client',
      provider: 'ERP_ADAPTER',
      instance: 'main',
      operations: ['READ', 'LIST', 'CREATE', 'UPDATE', 'DELETE'],
      fields: [
        { code: 'id', displayName: 'ID', type: 'STRING', required: false, nullable: true },
        { code: 'nom', displayName: 'Nom', type: 'STRING', required: true, nullable: false },
        { code: 'email', displayName: 'Email', type: 'STRING', required: true, nullable: false },
        { code: 'telephone', displayName: 'Telephone', type: 'STRING', required: false, nullable: true },
      ],
      relations: [],
    };
    this.dataAccess.registerResource(clientResource);
    this.validationService.registerSchema('client', clientResource.fields);
    const orderResource: ResourceDescriptor = {
      resourceCode: 'Order',
      displayName: 'Commande',
      provider: 'ERP_ADAPTER',
      instance: 'main',
      operations: ['READ', 'LIST', 'CREATE', 'UPDATE', 'DELETE'],
      fields: [
        { code: 'id', displayName: 'ID', type: 'STRING', required: false, nullable: true },
        { code: 'ref', displayName: 'Reference', type: 'STRING', required: true, nullable: false },
        { code: 'clientId', displayName: 'Client', type: 'REFERENCE', required: true, nullable: false },
        { code: 'total', displayName: 'Total', type: 'DECIMAL', required: false, nullable: true },
        { code: 'status', displayName: 'Statut', type: 'ENUM', required: true, nullable: false, enumValues: ['DRAFT','VALIDATED','PROCESSING','SHIPPED','DELIVERED','CANCELLED','PAID'] },
        { code: 'createdAt', displayName: 'Date creation', type: 'DATETIME', required: false, nullable: true },
      ],
      relations: [
        { code: 'client', displayName: 'Client', targetResource: 'Client', type: 'MANY_TO_ONE' },
      ],
    };
    this.dataAccess.registerResource(orderResource);
    this.validationService.registerSchema('order', orderResource.fields);
  }
}
