// DATA-CDC-01 : Data Access Manager
// Interface uniforme d'accès aux ressources canoniques

import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import {
  RuntimeContext,
  ResourceDescriptor,
  CanonicalField,
  CanonicalRelation,
  OperationType,
  Capability,
  CapabilityAvailability,
  DataRuntimeContract,
  HealthState,
  DATA_RUNTIME_CONTRACT_VERSION,
} from '../interfaces';
import { MAX_PAGE_SIZE } from '../interfaces/query.contract';

export interface DataProvider {
  get(resource: string, id: string, ctx: RuntimeContext): Promise<any>;
  list(resource: string, ctx: RuntimeContext, options?: ListOptions): Promise<any>;
  count(resource: string, ctx: RuntimeContext, filter?: any): Promise<number>;
  exists(resource: string, id: string, ctx: RuntimeContext): Promise<boolean>;
  metadata(resource: string, ctx: RuntimeContext): Promise<ResourceDescriptor>;
  create(resource: string, data: any, ctx: RuntimeContext): Promise<any>;
  update(resource: string, id: string, data: any, ctx: RuntimeContext): Promise<any>;
  remove(resource: string, id: string, ctx: RuntimeContext): Promise<void>;
}

export interface ListOptions {
  select?: string[];
  filter?: any;
  sort?: Array<{ field: string; direction: 'ASC' | 'DESC' }>;
  page?: number;
  pageSize?: number;
  relations?: string[];
}

@Injectable()
export class DataAccessManager {
  private readonly logger = new Logger(DataAccessManager.name);
  private readonly providers: Map<string, DataProvider> = new Map();
  private readonly resources: Map<string, ResourceDescriptor> = new Map();

  registerProvider(name: string, provider: DataProvider): void {
    this.providers.set(name, provider);
    this.logger.log(`Provider enregistre: ${name}`);
  }

  registerResource(descriptor: ResourceDescriptor): void {
    this.resources.set(descriptor.resourceCode, descriptor);
    this.logger.log(`Ressource enregistree: ${descriptor.resourceCode}`);
  }

  getProvider(name: string): DataProvider {
    const provider = this.providers.get(name);
    if (!provider) {
      throw new NotFoundException(`Provider "${name}" non trouve`);
    }
    return provider;
  }

  async get(resource: string, id: string, ctx: RuntimeContext, providerName?: string): Promise<any> {
    this.logger.debug(`GET ${resource}/${id} [tenant=${ctx.tenantId}]`);
    this.validateContext(ctx);
    const provider = this.resolveProvider(resource, providerName);
    return provider.get(resource, id, ctx);
  }

  async list(resource: string, ctx: RuntimeContext, options?: ListOptions, providerName?: string): Promise<any> {
    this.logger.debug(`LIST ${resource} [tenant=${ctx.tenantId}]`);
    this.validateContext(ctx);
    const provider = this.resolveProvider(resource, providerName);
    return provider.list(resource, ctx, options);
  }

  async count(resource: string, ctx: RuntimeContext, filter?: any, providerName?: string): Promise<number> {
    this.logger.debug(`COUNT ${resource} [tenant=${ctx.tenantId}]`);
    this.validateContext(ctx);
    const provider = this.resolveProvider(resource, providerName);
    return provider.count(resource, ctx, filter);
  }

  async exists(resource: string, id: string, ctx: RuntimeContext, providerName?: string): Promise<boolean> {
    this.validateContext(ctx);
    const provider = this.resolveProvider(resource, providerName);
    return provider.exists(resource, id, ctx);
  }

  async metadata(resource: string, ctx: RuntimeContext): Promise<ResourceDescriptor> {
    const descriptor = this.resources.get(resource);
    if (!descriptor) {
      throw new NotFoundException(`Ressource "${resource}" non trouvee dans le registre`);
    }
    return descriptor;
  }

  async create(resource: string, data: any, ctx: RuntimeContext, providerName?: string): Promise<any> {
    this.logger.debug(`CREATE ${resource} [tenant=${ctx.tenantId}]`);
    this.validateContext(ctx);
    const provider = this.resolveProvider(resource, providerName);
    return provider.create(resource, data, ctx);
  }

  async update(resource: string, id: string, data: any, ctx: RuntimeContext, providerName?: string): Promise<any> {
    this.logger.debug(`UPDATE ${resource}/${id} [tenant=${ctx.tenantId}]`);
    this.validateContext(ctx);
    const provider = this.resolveProvider(resource, providerName);
    return provider.update(resource, id, data, ctx);
  }

  async remove(resource: string, id: string, ctx: RuntimeContext, providerName?: string): Promise<void> {
    this.logger.debug(`DELETE ${resource}/${id} [tenant=${ctx.tenantId}]`);
    this.validateContext(ctx);
    const provider = this.resolveProvider(resource, providerName);
    return provider.remove(resource, id, ctx);
  }

  async getCapabilities(ctx: RuntimeContext): Promise<Capability[]> {
    const capabilities: Capability[] = [];
    for (const resource of this.resources.values()) {
      const provider = this.providers.get(resource.provider);
      if (provider) {
        const availability: CapabilityAvailability = 'AVAILABLE';
        capabilities.push({
          code: `${resource.resourceCode}.read`,
          provider: resource.provider,
          resource: resource.resourceCode,
          operation: 'READ',
          availability,
          contractVersion: DATA_RUNTIME_CONTRACT_VERSION,
          constraints: {
            pagination: true,
            sorting: true,
            filtering: true,
            maxPageSize: MAX_PAGE_SIZE,
            batch: false,
            transactions: false,
            readOnly: false,
          },
        });
        if (resource.operations.includes('LIST')) {
          capabilities.push({
            code: `${resource.resourceCode}.list`,
            provider: resource.provider,
            resource: resource.resourceCode,
            operation: 'LIST',
            availability,
            contractVersion: DATA_RUNTIME_CONTRACT_VERSION,
            constraints: {
              pagination: true,
              sorting: true,
              filtering: true,
              maxPageSize: MAX_PAGE_SIZE,
              batch: false,
              transactions: false,
              readOnly: true,
            },
          });
        }
        if (resource.operations.includes('CREATE')) {
          capabilities.push({
            code: `${resource.resourceCode}.create`,
            provider: resource.provider,
            resource: resource.resourceCode,
            operation: 'CREATE',
            availability,
            contractVersion: DATA_RUNTIME_CONTRACT_VERSION,
            constraints: {
              pagination: false,
              sorting: false,
              filtering: false,
              maxPageSize: 1,
              batch: true,
              transactions: true,
              readOnly: false,
            },
          });
        }
      }
    }
    return capabilities;
  }

  async getContract(): Promise<DataRuntimeContract> {
    return {
      contract: 'techzone.data-runtime',
      contractVersion: DATA_RUNTIME_CONTRACT_VERSION,
      provider: 'data-runtime',
      instance: 'main',
      resources: Array.from(this.resources.values()),
      capabilities: await this.getCapabilities({} as RuntimeContext),
      health: { status: 'UP' as any },
    };
  }

  getResources(): ResourceDescriptor[] {
    return Array.from(this.resources.values());
  }

  private validateContext(ctx: RuntimeContext): void {
    if (!ctx.tenantId) {
      throw new Error('tenantId requis dans le RuntimeContext');
    }
    if (!ctx.userId) {
      throw new Error('userId requis dans le RuntimeContext');
    }
    if (!ctx.traceId) {
      throw new Error('traceId requis dans le RuntimeContext');
    }
  }

  private resolveProvider(resource: string, providerName?: string): DataProvider {
    if (providerName) {
      return this.getProvider(providerName);
    }
    const descriptor = this.resources.get(resource);
    if (descriptor) {
      return this.getProvider(descriptor.provider);
    }
    throw new NotFoundException(`RESOURCE_NOT_SUPPORTED: Aucun provider disponible pour la ressource "${resource}"`);
  }
}
