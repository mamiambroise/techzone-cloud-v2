// Provider Data Runtime → ERP Adapter
// Pont entre le Data Runtime et l'ERP Adapter existant

import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { DataProvider, ListOptions } from './data-access-manager';
import { RuntimeContext, ResourceDescriptor } from '../interfaces';
import { ErpAdapterService } from '../../erp-adapter/erp-adapter.service';
import { IErpAdapter } from '../../erp-adapter/interfaces/erp-adapter.interface';
import { ErpError } from '../../erp-adapter/erp-error';

@Injectable()
export class ERPAdapterDataProvider implements DataProvider {
  private readonly logger = new Logger(ERPAdapterDataProvider.name);

  constructor(
    private readonly erpAdapterService: ErpAdapterService,
  ) {}

  /**
   * Resolve the ERP adapter for the given runtime context.
   * Uses tenant-aware resolution via ErpAdapterService, so each
   * tenant gets its own adapter + HTTP client configured from
   * the ERP registry (no global singleton leakage).
   */
  private async resolveAdapter(ctx: RuntimeContext): Promise<IErpAdapter> {
    if (!ctx.tenantId) {
      throw ErpError.tenantRequired();
    }
    return this.erpAdapterService.resolveAdapterForTenant(ctx.tenantId);
  }

  async get(resource: string, id: string, ctx: RuntimeContext): Promise<any> {
    const adapter = await this.resolveAdapter(ctx);
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
        throw new NotFoundException(`RESOURCE_NOT_SUPPORTED: "${resource}"`);
    }
  }

  async list(resource: string, ctx: RuntimeContext, options?: ListOptions): Promise<any> {
    const adapter = await this.resolveAdapter(ctx);
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
        throw new NotFoundException(`RESOURCE_NOT_SUPPORTED: "${resource}"`);
    }

    const page = options?.page || 1;
    const pageSize = options?.pageSize || 20;
    const itemsArray = Array.isArray(items) ? items : [items];
    const realTotal =
      items && typeof items === 'object' && (items as any).total !== undefined
        ? (items as any).total
        : null;
    const total = realTotal !== null ? realTotal : null;
    const totalPages = total !== null && pageSize > 0 ? Math.ceil(total / pageSize) : null;
    const start = (page - 1) * pageSize;
    const pagedItems = itemsArray.slice(start, start + pageSize);

    return {
      items: pagedItems,
      page,
      pageSize,
      total,
      totalPages,
    };
  }

  async count(resource: string, ctx: RuntimeContext, filter?: any): Promise<number> {
    const result = await this.list(resource, ctx, { pageSize: 1 });
    return result.total ?? 0;
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
      },
      Client: {
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
      },
      Order: {
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
      },
    };
    const descriptor = metadataMap[resource];
    if (!descriptor) {
      throw new NotFoundException(`RESOURCE_NOT_SUPPORTED: Metadata pour "${resource}" non disponible`);
    }
    return descriptor;
  }

  async create(resource: string, data: any, ctx: RuntimeContext): Promise<any> {
    const adapter = await this.resolveAdapter(ctx);
    switch (resource) {
      case 'Product':
        return adapter.createProduct(data);
      case 'Client':
        return adapter.createClient(data);
      case 'Order':
        return adapter.createOrder(data);
      default:
        throw new NotFoundException(`RESOURCE_NOT_SUPPORTED: Creation de "${resource}" non supportee`);
    }
  }

  async update(resource: string, id: string, data: any, ctx: RuntimeContext): Promise<any> {
    const adapter = await this.resolveAdapter(ctx);
    switch (resource) {
      case 'Product':
        return adapter.updateProduct(id, data);
      case 'Client':
        return adapter.updateClient(id, data);
      case 'Order':
        return adapter.updateOrder(id, data);
      default:
        throw new NotFoundException(`RESOURCE_NOT_SUPPORTED: Mise a jour de "${resource}" non supportee`);
    }
  }

  async remove(resource: string, id: string, ctx: RuntimeContext): Promise<void> {
    const adapter = await this.resolveAdapter(ctx);
    switch (resource) {
      case 'Product':
        return adapter.deleteProduct(id);
      case 'Client':
        return adapter.deleteClient(id);
      case 'Order':
        return adapter.deleteOrder(id);
      default:
        throw new NotFoundException(`RESOURCE_NOT_SUPPORTED: Suppression de "${resource}" non supportee`);
    }
  }
}
