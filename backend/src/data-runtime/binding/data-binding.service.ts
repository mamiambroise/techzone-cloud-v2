// DATA-CDC-04 : Data Binding & State Bridge

import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import {
  BindingDefinition,
  BindingResult,
  BindingParameter,
} from '../interfaces/binding.contract';
import { RuntimeContext, BindingState } from '../interfaces';
import { DataAccessManager } from '../data-access/data-access-manager';
import { QueryEngine } from '../query-engine/query-engine';
import { ExecutionEngine } from '../execution-engine/execution-engine';

@Injectable()
export class DataBindingService {
  private readonly logger = new Logger(DataBindingService.name);
  private readonly bindings: Map<string, BindingDefinition> = new Map();
  private readonly bindingResults: Map<string, BindingResult> = new Map();

  constructor(
    private readonly queryEngine: QueryEngine,
    private readonly executionEngine: ExecutionEngine,
    private readonly dataAccess: DataAccessManager,
  ) {}

  registerBinding(definition: BindingDefinition): void {
    this.bindings.set(definition.bindingId, definition);
    this.logger.log(`Binding enregistre: ${definition.bindingId} (${definition.type})`);
  }

  getBinding(bindingId: string): BindingDefinition {
    const binding = this.bindings.get(bindingId);
    if (!binding) {
      throw new NotFoundException(`Binding "${bindingId}" non trouve`);
    }
    return binding;
  }

  getBindings(): BindingDefinition[] {
    return Array.from(this.bindings.values());
  }

  async resolve<T = any>(bindingId: string, ctx: RuntimeContext, params?: Record<string, any>): Promise<BindingResult<T>> {
    const start = Date.now();
    const binding = this.getBinding(bindingId);

    if (this.bindingResults.has(bindingId) && binding.bindingId === bindingId) {
      // Return cached state if no params changed - simple heuristic
    }

    try {
      this.logger.debug(`Resolve binding ${bindingId} [tenant=${ctx.tenantId}]`);

      let data: any;

      switch (binding.type) {
        case 'SINGLE':
          data = await this.dataAccess.get(binding.resource, binding.operation || 'default', ctx);
          break;
        case 'LIST':
          data = await this.queryEngine.execute(binding.query || { resource: binding.resource }, ctx);
          break;
        case 'COUNT':
          data = { count: await this.dataAccess.count(binding.resource, ctx) };
          break;
        case 'METADATA':
          data = await this.dataAccess.metadata(binding.resource, ctx);
          break;
        case 'QUERY':
          data = await this.queryEngine.execute(binding.query || { resource: binding.resource }, ctx);
          break;
        case 'EXECUTION':
          data = await this.executionEngine.execute(
            binding.execution || { resource: binding.resource, operation: 'CREATE', input: params },
            ctx,
          );
          break;
        default:
          throw new Error(`Type de binding "${binding.type}" non supporte`);
      }

      const result: BindingResult<T> = {
        bindingId,
        state: this.isEmpty(data) ? 'EMPTY' : 'SUCCESS',
        data,
        timestamp: new Date().toISOString(),
        duration: Date.now() - start,
      };

      this.bindingResults.set(bindingId, result);
      return result;
    } catch (error) {
      const err = error as Error & { code?: string }
      const result: BindingResult<T> = {
        bindingId,
        state: 'ERROR',
        error: {
          code: err.code || 'DATA_PROVIDER_UNAVAILABLE',
          message: err.message,
        },
        timestamp: new Date().toISOString(),
        duration: Date.now() - start,
      };
      this.bindingResults.set(bindingId, result);
      return result;
    }
  }

  getBindingState(bindingId: string): BindingState {
    const result = this.bindingResults.get(bindingId);
    return result?.state || 'IDLE';
  }

  private isEmpty(data: any): boolean {
    if (data == null) return true;
    if (Array.isArray(data)) return data.length === 0;
    if (data.items && Array.isArray(data.items)) return data.items.length === 0;
    if (typeof data === 'object') return Object.keys(data).length === 0;
    return false;
  }
}

