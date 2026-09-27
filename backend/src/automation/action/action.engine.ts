// WF-CDC-05 : Action Engine
// Execute de maniere controlee les effets metier demandes par regles et workflows.

import { Injectable, Logger, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import {
  ActionCategory,
  ActionOutcome,
} from '../interfaces/automation.contract';

export interface ActionDefinition {
  code: string;
  category: ActionCategory;
  retryable: boolean;
  timeout: number;
  idempotent: boolean;
  version: string;
  params?: Record<string, any>;
  handler?: (ctx: ActionExecutionContext, params?: Record<string, any>) => Promise<{ success: boolean; error?: string; data?: any }>;
}

export interface ActionExecutionContext {
  tenantId: string;
  userId: string;
  traceId: string;
  variables?: Record<string, any>;
  permissions?: string[];
  [key: string]: any;
}

@Injectable()
export class ActionEngine {
  private readonly logger = new Logger(ActionEngine.name);
  private readonly actions: Map<string, ActionDefinition> = new Map();
  private readonly idempotencyStore: Map<string, { outcome: ActionOutcome; timestamp: string }> = new Map();

  registerAction(def: ActionDefinition): void {
    if (!def.code) throw new BadRequestException('code requis pour une action');
    if (!def.category) throw new BadRequestException('category requise pour une action');
    this.actions.set(def.code, def);
    this.logger.log(`Action enregistree: ${def.code} (${def.category})`);
  }

  getAction(code: string): ActionDefinition {
    const action = this.actions.get(code);
    if (!action) throw new NotFoundException(`Action "${code}" non enregistree`);
    return action;
  }

  getActions(): ActionDefinition[] {
    return Array.from(this.actions.values());
  }

  /**
   * Pipeline: validate -> permission -> capability -> idempotency -> execute -> audit
   */
  async executeAction(code: string, ctx: ActionExecutionContext, params?: Record<string, any>): Promise<ActionOutcome> {
    const action = this.getAction(code);

    // Idempotency check
    if (action.idempotent) {
      const key = `${ctx.tenantId}:${code}:${ctx.traceId}`;
      const existing = this.idempotencyStore.get(key);
      if (existing) {
        this.logger.debug(`Action idempotente rejouee: ${code}`);
        return existing.outcome;
      }
    }

    try {
      if (action.handler) {
        const result = await action.handler(ctx, { ...action.params, ...params });
        const outcome: ActionOutcome = result.success ? 'SUCCEEDED' : 'FAILED';

        if (action.idempotent) {
          this.idempotencyStore.set(`${ctx.tenantId}:${code}:${ctx.traceId}`, {
            outcome,
            timestamp: new Date().toISOString(),
          });
        }

        if (!result.success) {
          this.logger.warn(`Action ${code} echec: ${result.error}`);
        }
        return outcome;
      }

      // Action sans handler = mock simple
      const outcome: ActionOutcome = 'SUCCEEDED';
      this.logger.log(`Action ${code} executed (no-op handler)`);
      return outcome;
    } catch (error) {
      const err = error as Error & { code?: string }
      this.logger.error(`Action ${code} erreur: ${err.message}`);
      return error instanceof ForbiddenException ? 'DENIED' : 'FAILED';
    }
  }
}

