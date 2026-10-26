// Provider Data Runtime → ERP Adapter
// Pont entre le Data Runtime et l'ERP Adapter existant

import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { DataProvider, ListOptions } from './data-access-manager';
import { RuntimeContext, ResourceDescriptor } from '../interfaces';
import { ErpAdapterService } from '../../erp-adapter/erp-adapter.service';
import { IErpAdapter } from '../../erp-adapter/interfaces/erp-adapter.interface';
import { ErpError } from '../../erp-adapter/erp-error';
import { MAX_PAGE_SIZE } from '../interfaces/query.contract';
import type { FilterCondition, FilterGroup } from '../interfaces/query.contract';

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

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
    let items: unknown[] | { items?: unknown[]; total?: number };
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

    const page = options?.page ?? 1;
    const pageSize = options?.pageSize ?? 20;
    if (!Number.isSafeInteger(page) || page < 1 || !Number.isSafeInteger(pageSize) || pageSize < 1 || pageSize > MAX_PAGE_SIZE) {
      throw new BadRequestException('INVALID_PAGINATION');
    }
    const descriptor = await this.metadata(resource, ctx);
    const allowedFields = new Set(descriptor.fields.map(field => field.code));
    const rawItems: unknown = items;
    const listedItems = Array.isArray(rawItems)
      ? rawItems
      : isRecord(rawItems) && Array.isArray(rawItems.items) ? rawItems.items : [];
    const sourceItems = listedItems.filter(isRecord);
    let filteredItems: Record<string, unknown>[] = sourceItems;
    if (options?.filter) {
      this.validateFilter(options.filter, allowedFields);
      filteredItems = filteredItems.filter(item => this.matchesFilter(item, options.filter!));
    }
    for (const field of options?.select ?? []) {
      this.assertAllowedField(field, allowedFields);
    }
    if ((options?.sort?.length ?? 0) > 5) throw new BadRequestException('INVALID_SORT');
    const sorts = options?.sort ?? [];
    for (const sort of sorts) {
      this.assertAllowedField(sort.field, allowedFields);
      if (!['ASC', 'DESC'].includes(sort.direction)) throw new BadRequestException('INVALID_SORT');
    }
    if (sorts.length) {
      filteredItems = [...filteredItems].sort((left, right) => {
        for (const sort of sorts) {
          const a = left?.[sort.field], b = right?.[sort.field];
          if (a === b) continue;
          if (a == null) return 1;
          if (b == null) return -1;
          const comparison = a < b ? -1 : a > b ? 1 : 0;
          if (comparison) return sort.direction === 'ASC' ? comparison : -comparison;
        }
        return 0;
      });
    }
    const total = filteredItems.length;
    const totalPages = Math.ceil(total / pageSize);
    const start = (page - 1) * pageSize;
    let pagedItems = filteredItems.slice(start, start + pageSize);
    if (options?.select?.length) {
      pagedItems = pagedItems.map(item => Object.fromEntries(options.select!.map(field => [field, item?.[field]])));
    }

    return {
      items: pagedItems,
      page,
      pageSize,
      total,
      totalPages,
    };
  }

  private assertAllowedField(field: string, allowedFields: Set<string>): void {
    if (!allowedFields.has(field)) throw new BadRequestException('FIELD_NOT_ALLOWED');
  }

  private validateFilter(filter: unknown, allowedFields: Set<string>, depth = 0): asserts filter is FilterGroup {
    if (!filter || typeof filter !== 'object' || Array.isArray(filter) || depth > 3) {
      throw new BadRequestException('INVALID_FILTER');
    }
    const candidate = filter as Partial<FilterGroup>;
    if (!['AND', 'OR'].includes(candidate.logic ?? '') ||
      !Array.isArray(candidate.conditions) || candidate.conditions.length === 0 || candidate.conditions.length > 100) {
      throw new BadRequestException('INVALID_FILTER');
    }
    for (const condition of candidate.conditions) {
      if ('logic' in condition) {
        this.validateFilter(condition, allowedFields, depth + 1);
        continue;
      }
      if (typeof condition.field !== 'string') throw new BadRequestException('INVALID_FILTER');
      this.assertAllowedField(condition.field, allowedFields);
      if (!['EQ', 'NE', 'GT', 'GTE', 'LT', 'LTE', 'IN', 'NOT_IN', 'CONTAINS', 'STARTS_WITH', 'ENDS_WITH', 'IS_NULL'].includes(condition.operator)) {
        throw new BadRequestException('INVALID_FILTER');
      }
      if (['IN', 'NOT_IN'].includes(condition.operator) && (!Array.isArray(condition.value) || condition.value.length > 100)) {
        throw new BadRequestException('INVALID_FILTER');
      }
      if (condition.operator !== 'IS_NULL' && condition.value === undefined) throw new BadRequestException('INVALID_FILTER');
      if (['CONTAINS', 'STARTS_WITH', 'ENDS_WITH'].includes(condition.operator) && typeof condition.value !== 'string') {
        throw new BadRequestException('INVALID_FILTER');
      }
    }
  }

  private matchesFilter(item: Record<string, unknown>, filter: FilterGroup): boolean {
    const results = filter.conditions.map((condition) =>
      'logic' in condition
        ? this.matchesFilter(item, condition)
        : this.matchesCondition(item?.[condition.field], condition),
    );
    return filter.logic === 'AND' ? results.every(Boolean) : results.some(Boolean);
  }

  private matchesCondition(actual: unknown, condition: FilterCondition): boolean {
    const expected = condition.value;
    const comparable = (['string', 'number'].includes(typeof actual) && typeof actual === typeof expected)
      ? actual as string | number
      : undefined;
    switch (condition.operator) {
      case 'EQ': return actual === expected;
      case 'NE': return actual !== expected;
      case 'GT': return comparable !== undefined && comparable > expected;
      case 'GTE': return comparable !== undefined && comparable >= expected;
      case 'LT': return comparable !== undefined && comparable < expected;
      case 'LTE': return comparable !== undefined && comparable <= expected;
      case 'IN': return condition.value.includes(actual);
      case 'NOT_IN': return !condition.value.includes(actual);
      case 'CONTAINS': return typeof actual === 'string' && actual.includes(expected);
      case 'STARTS_WITH': return typeof actual === 'string' && actual.startsWith(expected);
      case 'ENDS_WITH': return typeof actual === 'string' && actual.endsWith(expected);
      case 'IS_NULL': return actual == null;
      default: return false;
    }
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
