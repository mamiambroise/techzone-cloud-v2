// DATA-CDC-03 : Execution Engine
// Execution controlee des operations create/update/delete/execute

import { Injectable, Logger, BadRequestException, ForbiddenException } from '@nestjs/common';
import {
  ExecutionRequest,
  ExecutionResult,
  BatchExecutionRequest,
  BatchExecutionResult,
} from '../interfaces/execution.contract';
import { RuntimeContext, OperationType } from '../interfaces';
import { DataAccessManager } from '../data-access/data-access-manager';

@Injectable()
export class ExecutionEngine {
  private readonly logger = new Logger(ExecutionEngine.name);
  private readonly idempotencyStore: Map<string, ExecutionResult> = new Map();

  constructor(private readonly dataAccess: DataAccessManager) {}

  async execute(request: ExecutionRequest, ctx: RuntimeContext): Promise<ExecutionResult> {
    const start = Date.now();
    const traceId = ctx.traceId;

    try {
      if (!ctx.tenantId) {
        return {
          success: false,
          operation: request.operation,
          resource: request.resource,
          targetId: request.targetId,
          errorCode: 'TENANT_REQUIRED',
          errorMessage: 'tenantId requis dans le contexte',
          traceId,
          duration: Date.now() - start,
          timestamp: new Date().toISOString(),
        };
      }

      this.logger.debug(`EXECUTE ${request.operation} ${request.resource} [tenant=${ctx.tenantId}]`);

      this.validateRequest(request);
      this.checkPermission(request, ctx);
      if (request.resource.startsWith('bm:')) await this.dataAccess.authorize(request.resource, request.operation, ctx);
      const idempotencyScope = JSON.stringify([ctx.tenantId, ctx.userId, request.resource, request.operation, request.targetId, request.input, request.idempotencyKey]);

      if (request.idempotencyKey) {
        const existing = this.idempotencyStore.get(
          idempotencyScope,
        );
        if (existing) {
          this.logger.debug(`Idempotence hit pour ${request.idempotencyKey}`);
          return existing;
        }
      }

      this.checkPermission(request, ctx);

      let data: any;

      switch (request.operation) {
        case 'CREATE':
          data = await this.dataAccess.create(request.resource, request.input || {}, ctx);
          break;
        case 'UPDATE':
          if (!request.targetId) {
            throw new BadRequestException('targetId requis pour UPDATE');
          }
          data = await this.dataAccess.update(request.resource, request.targetId, request.input || {}, ctx);
          break;
        case 'DELETE':
          if (!request.targetId) {
            throw new BadRequestException('targetId requis pour DELETE');
          }
          await this.dataAccess.remove(request.resource, request.targetId, ctx);
          data = { id: request.targetId, deleted: true };
          break;
        case 'EXECUTE':
          data = await this.executeAction(request, ctx);
          break;
        case 'BATCH':
          data = await this.executeBatch(request as any, ctx);
          break;
        default:
          throw new BadRequestException(`Operation "${request.operation}" non supportee`);
      }

      const result: ExecutionResult = {
        success: true,
        operation: request.operation,
        resource: request.resource,
        targetId: request.targetId,
        data,
        traceId,
        duration: Date.now() - start,
        timestamp: new Date().toISOString(),
      };

      if (request.idempotencyKey) {
        if (this.idempotencyStore.size >= 1000) this.idempotencyStore.delete(this.idempotencyStore.keys().next().value!);
        this.idempotencyStore.set(idempotencyScope, result);
      }

      return result;
    } catch (error) {
      const err = error as Error & { code?: string };
      this.logger.error(`EXECUTE echoue: ${err.message}`);
      return {
        success: false,
        operation: request.operation,
        resource: request.resource,
        targetId: request.targetId,
        errorCode: err.code || 'DATA_OPERATION_NOT_ALLOWED',
        errorMessage: err.message,
        traceId,
        duration: Date.now() - start,
        timestamp: new Date().toISOString(),
      };
    }
  }

  async executeBatch(request: BatchExecutionRequest, ctx: RuntimeContext): Promise<BatchExecutionResult> {
    const start = Date.now();
    const results: ExecutionResult[] = [];
    let succeeded = 0;
    let failed = 0;
    let skipped = 0;

    this.basicValidateBatch(request);
    if (request.resource.startsWith('bm:') && request.strategy === 'ALL_OR_NOTHING') throw new BadRequestException('ATOMIC_BATCH_NOT_SUPPORTED');

    for (const item of request.items) {
      const result = await this.execute(
        {
          resource: request.resource,
          operation: request.operation,
          targetId: item.targetId,
          input: item.input,
          idempotencyKey: item.idempotencyKey,
        },
        ctx,
      );
      results.push(result);
      if (result.success) succeeded++;
      else failed++;

      if (request.strategy === 'ALL_OR_NOTHING' && !result.success) {
        this.logger.warn('ALL_OR_NOTHING batch failed, stopping');
        break;
      }
    }

    return {
      totalItems: request.items.length,
      succeeded,
      failed,
      skipped,
      results,
      traceId: ctx.traceId,
      duration: Date.now() - start,
    };
  }

  private async executeAction(request: ExecutionRequest, ctx: RuntimeContext): Promise<any> {
    const adapterName = request.metadata?.provider;
    if (!adapterName) {
      throw new BadRequestException('metadata.provider requis pour EXECUTE');
    }
    throw new BadRequestException(`Action "${request.input?.action || 'unknown'}" non enregistree`);
  }

  private validateRequest(request: ExecutionRequest): void {
    if (!request.resource || typeof request.resource !== 'string') {
      throw new BadRequestException('resource est requis');
    }
    if (!request.operation) {
      throw new BadRequestException('operation est requis');
    }
  }

  private basicValidateBatch(request: BatchExecutionRequest): void {
    if (!request.items || !Array.isArray(request.items) || request.items.length === 0) {
      throw new BadRequestException('items est requis pour un batch');
    }
    if (typeof request.resource !== 'string') {
      throw new BadRequestException('resource est requis');
    }
    if (!request.operation) {
      throw new BadRequestException('operation est requis');
    }
  }

  private checkPermission(request: ExecutionRequest, ctx: RuntimeContext): void {
    if (!ctx.tenantId) {
      throw new ForbiddenException('TENANT_REQUIRED: tenantId manquant');
    }
    const requiredPermission = 'data-runtime:execute';
    if (ctx.permissions && !ctx.permissions.includes('*') && !ctx.permissions.includes(requiredPermission)) {
      throw new ForbiddenException(`FORBIDDEN: Permission "${requiredPermission}" manquante`);
    }
  }
}
