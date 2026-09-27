// WF-CDC-04 : Trigger Engine
// Declenche une regle ou un workflow a partir d'un evenement ou d'une condition autorisee.

import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { TriggerType, AutomationContext } from '../interfaces/automation.contract';
import { WorkflowEngine } from '../workflow/workflow.engine';
import { RulesEngine } from '../rules/rules.engine';

export interface TriggerDefinition {
  code: string;
  type: TriggerType;
  source?: string;
  event?: string;
  targetWorkflow?: string;
  targetRule?: string;
  filters?: Record<string, any>;
  enabled: boolean;
  version: string;
  idempotencyPolicy?: 'EXACTLY_ONCE' | 'AT_LEAST_ONCE';
  schedule?: {
    timezone: string;
    cron?: string;
    frequencyMinutes?: number;
  };
}

export interface EventPayload {
  eventType: string;
  source: string;
  data?: Record<string, any>;
  timestamp?: string;
}

@Injectable()
export class TriggerEngine {
  private readonly logger = new Logger(TriggerEngine.name);
  private readonly triggers: Map<string, TriggerDefinition> = new Map();
  private readonly processedEvents: Set<string> = new Set();

  constructor(
    private readonly workflowEngine: WorkflowEngine,
    private readonly rulesEngine: RulesEngine,
  ) {}

  registerTrigger(trigger: TriggerDefinition): void {
    if (!trigger.code) throw new BadRequestException('code requis pour un trigger');
    if (!['EVENT','SCHEDULE','MANUAL','API','DATA_CHANGE','WEBHOOK'].includes(trigger.type)) {
      throw new BadRequestException(`type invalide: ${trigger.type}`);
    }
    this.triggers.set(trigger.code, trigger);
    this.logger.log(`Trigger enregistre: ${trigger.code} (${trigger.type})`);
  }

  getTrigger(code: string): TriggerDefinition {
    const t = this.triggers.get(code);
    if (!t) throw new NotFoundException(`Trigger "${code}" non trouve`);
    return t;
  }

  getTriggers(): TriggerDefinition[] {
    return Array.from(this.triggers.values());
  }

  getEnabledTriggers(): TriggerDefinition[] {
    return this.getTriggers().filter((t) => t.enabled);
  }

  /**
   * Compare un event entrant aux triggers (deduplication + filtres + target).
   */
  async processEvent(payload: EventPayload, ctx: AutomationContext): Promise<Array<{ triggerCode: string; target: string; status: string }>> {
    const results: Array<{ triggerCode: string; target: string; status: string }> = [];

    // Deduplication: exactly-once semantics
    const dedupKey = `${ctx.tenantId}:${payload.source}:${payload.eventType}:${payload.timestamp || ''}`;
    for (const trigger of this.getEnabledTriggers()) {
      if (trigger.type !== 'EVENT' && trigger.type !== 'DATA_CHANGE' && trigger.type !== 'WEBHOOK') continue;
      if (trigger.event && trigger.event !== payload.eventType) continue;
      if (trigger.source && trigger.source !== payload.source) continue;

      // Apply filters if any
      if (trigger.filters && payload.data) {
        const matches = Object.entries(trigger.filters).every(
          ([k, v]) => payload.data![k] === v,
        );
        if (!matches) continue;
      }

      if (trigger.idempotencyPolicy === 'EXACTLY_ONCE') {
        if (this.processedEvents.has(`${dedupKey}:${trigger.code}`)) {
          results.push({ triggerCode: trigger.code, target: trigger.targetWorkflow || trigger.targetRule || '', status: 'SKIPPED_DUPLICATE' });
          continue;
        }
        this.processedEvents.add(`${dedupKey}:${trigger.code}`);
        if (this.processedEvents.size > 10000) {
          const first = this.processedEvents.values().next().value;
          if (first) this.processedEvents.delete(first);
        }
      }

      const target = trigger.targetWorkflow || trigger.targetRule || '';
      try {
        if (trigger.targetWorkflow) {
          const rec = await this.workflowEngine.startWorkflow(trigger.targetWorkflow, ctx);
          results.push({ triggerCode: trigger.code, target, status: rec.status });
        } else if (trigger.targetRule) {
          const result = this.rulesEngine.evaluateRule(trigger.targetRule, ctx);
          results.push({ triggerCode: trigger.code, target, status: result.result });
        } else {
          results.push({ triggerCode: trigger.code, target, status: 'NO_TARGET' });
        }
      } catch (error) {
      const err = error as Error & { code?: string }
        results.push({ triggerCode: trigger.code, target, status: `ERROR: ${err.message}` });
      }
    }

    return results;
  }

  /**
   * Execution manuelle d'un trigger.
   */
  async fireManual(triggerCode: string, ctx: AutomationContext): Promise<{ triggerCode: string; status: string }> {
    const trigger = this.getTrigger(triggerCode);
    if (trigger.type !== 'MANUAL' && trigger.type !== 'API') {
      throw new BadRequestException('Trigger non declenchable manuellement');
    }
    if (!trigger.enabled) {
      return { triggerCode, status: 'DISABLED' };
    }
    try {
      if (trigger.targetWorkflow) {
        const rec = await this.workflowEngine.startWorkflow(trigger.targetWorkflow, ctx);
        return { triggerCode, status: rec.status };
      }
      if (trigger.targetRule) {
        const result = this.rulesEngine.evaluateRule(trigger.targetRule, ctx);
        return { triggerCode, status: result.result };
      }
      return { triggerCode, status: 'NO_TARGET' };
    } catch (error) {
      const err = error as Error;
      return { triggerCode, status: `ERROR: ${err.message}` };
    }
  }

  setEnabled(code: string, enabled: boolean): void {
    const t = this.getTrigger(code);
    t.enabled = enabled;
    this.triggers.set(code, t);
    this.logger.log(`Trigger ${code} -> ${enabled ? 'active' : 'inactive'}`);
  }
}

