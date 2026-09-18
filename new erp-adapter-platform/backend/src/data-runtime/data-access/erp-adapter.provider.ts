// Provider Data Runtime → ERP Adapter
// Pont entre le Data Runtime et l'ERP Adapter existant

import { Injectable, Logger } from '@nestjs/common';
import { DataProvider, ListOptions } from './data-access-manager';
import { RuntimeContext, ResourceDescriptor } from '../interfaces';
import { ErpAdapterService } from '../../erp-adapter/erp-adapter.service';

@Injectable()
export class ERPAdapterDataProvider implements DataProvider {
  private readonly logger = new Logger(ERPAdapterDataProvider.name);

  constructor(private readonly erpAdapterService: ErpAdapterService) {}

  async get(resource: string, id: string, ctx: RuntimeContext): Promise<any> {
    const adapter = this.erpAdapterService.getAdapter('DOLIBARR');
    switch (resource) {
      case 'Product':
        return adapter.getProductById(id);
      case 'Client':
        return adapter.getClientById(id);
      case 'Order':
        return adapter.getOrderById(id);
      case 'Stock':
        return adapter.getStock(id);
      default:
        throw new Error(`Ressource "${resource}" non supportee`);
    }
  }

  async list(resource: string, ctx: RuntimeContext, options?: ListOptions): Promise<any> {
    const adapter = this.erpAdapterService.getAdapter('DOLIBARR');
    let items: any[];
    switch (resource) {
      case 'Product':
        items = await adapter.getProducts();
        break;
      case 'Client':
        items = await adapter.getClients();
        break;
      case 'Order':
        items = await adapter.getOrders();
        break;
      default:
        throw new Error(`Ressource "${resource}" non supportee`);
    }

    const page = options?.page || 1;
    const pageSize = options?.pageSize || 20;
    const total = items.length;
    const totalPages = Math.ceil(total / pageSize);
    const start = (page - 1) * pageSize;
    const paged = items.slice(start, start + pageSize);

    return {
      items: paged,
      page,
      pageSize,
      total,
      totalPages,
    };
  }

  async count(resource: string, ctx: RuntimeContext, filter?: any): Promise<number> {
    const result = await this.list(resource, ctx, { pageSize: 1 });
    return result.total;
  }

  async exists(resource: string, id: string, ctx: RuntimeContext): Promise<boolean> {
    try {
      await this.get(resource, id, ctx);
      return true;
    } catch {
      return false;
    }
  }

  async metadata(resource: string, ctx: RuntimeContext): Promise<ResourceDescriptor> {
    const metadataMap: Record<string, ResourceDescriptor> = {
      Product: {
        resourceCode: 'Product',
        displayName: 'Produit',
        provider: 'DOLIBARR',
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
      },
      Client: {
        resourceCode: 'Client',
        displayName: 'Client',
        provider: 'DOLIBARR',
        instance: 'main',
        operations: ['READ', 'LIST', 'CREATE', 'UPDATE', 'DELETE'],
        fields: [
          { code: 'id', displayName: 'ID', type: 'STRING', required: true, nullable: false },
          { code: 'nom', displayName: 'Nom', type: 'STRING', required: true, nullable: false },
          { code: 'email', displayName: 'Email', type: 'STRING', required: true, nullable: false },
          { code: 'telephone', displayName: 'Telephone', type: 'STRING', required: false, nullable: true },
        ],
        relations: [],
      },
      Order: {
        resourceCode: 'Order',
        displayName: 'Commande',
        provider: 'DOLIBARR',
        instance: 'main',
        operations: ['READ', 'LIST', 'CREATE', 'UPDATE', 'DELETE'],
        fields: [
          { code: 'id', displayName: 'ID', type: 'STRING', required: true, nullable: false },
          { code: 'ref', displayName: 'Reference', type: 'STRING', required: true, nullable: false },
          { code: 'clientId', displayName: 'Client', type: 'REFERENCE', required: true, nullable: false },
          { code: 'total', displayName: 'Total', type: 'DECIMAL', required: false, nullable: true },
          { code: 'status', displayName: 'Statut', type: 'ENUM', required: true, nullable: false },
          { code: 'createdAt', displayName: 'Date creation', type: 'DATETIME', required: false, nullable: true },
        ],
        relations: [
          { code: 'client', displayName: 'Client', targetResource: 'Client', type: 'MANY_TO_ONE' },
        ],
      },
    };
    const descriptor = metadataMap[resource];
    if (!descriptor) {
      throw new Error(`Metadata pour "${resource}" non disponible`);
    }
    return descriptor;
  }

  async create(resource: string, data: any, ctx: RuntimeContext): Promise<any> {
    const adapter = this.erpAdapterService.getAdapter('DOLIBARR');
    switch (resource) {
      case 'Product':
        return adapter.createProduct(data);
      case 'Client':
        return adapter.createClient(data);
      case 'Order':
        return adapter.createOrder(data);
      default:
        throw new Error(`Creation de "${resource}" non supportee`);
    }
  }

  async update(resource: string, id: string, data: any, ctx: RuntimeContext): Promise<any> {
    const adapter = this.erpAdapterService.getAdapter('DOLIBARR');
    switch (resource) {
      case 'Product':
        return adapter.updateProduct(id, data);
      case 'Client':
        return adapter.updateClient(id, data);
      case 'Order':
        return adapter.updateOrder(id, data);
      default:
        throw new Error(`Mise a jour de "${resource}" non supportee`);
    }
  }

  async remove(resource: string, id: string, ctx: RuntimeContext): Promise<void> {
    const adapter = this.erpAdapterService.getAdapter('DOLIBARR');
    switch (resource) {
      case 'Product':
        return adapter.deleteProduct(id);
      case 'Client':
        return adapter.deleteClient(id);
      case 'Order':
        return adapter.deleteOrder(id);
      default:
        throw new Error(`Suppression de "${resource}" non supportee`);
    }
  }
}
