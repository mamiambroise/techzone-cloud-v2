// WF-CDC-02 : Rules Engine
// Evalue des regles metier declaratives, securisees et deterministes.

import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { RuleDefinition, RuleEvaluationResult, RuleValidationResult } from '../interfaces/rule.contract';
import { ConditionNode, AutomationContext, EvaluationResult } from '../interfaces/automation.contract';
import { ConditionsEngine } from '../conditions/conditions.engine';

@Injectable()
export class RulesEngine {
  private readonly logger = new Logger(RulesEngine.name);
  private readonly rules: Map<string, RuleDefinition> = new Map();

  constructor(private readonly conditionsEngine: ConditionsEngine) {}

  registerRule(rule: RuleDefinition): void {
    const validation = this.validateRule(rule);
    if (!validation.valid) {
      throw new BadRequestException(`Regle invalide: ${validation.errors.join('; ')}`);
    }
    this.rules.set(rule.code, rule);
    this.logger.log(`Regle enregistree: ${rule.code} (v${rule.version}, priorite ${rule.priority})`);
  }

  getRule(code: string): RuleDefinition {
    const rule = this.rules.get(code);
    if (!rule) throw new NotFoundException(`Regle "${code}" non trouvee`);
    return rule;
  }

  getRules(): RuleDefinition[] {
    return Array.from(this.rules.values());
  }

  getActiveRules(): RuleDefinition[] {
    return this.getRules()
      .filter((r) => r.status === 'ACTIVE')
      .sort((a, b) => b.priority - a.priority || a.code.localeCompare(b.code));
  }

  validateRule(rule: RuleDefinition): RuleValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!rule.code || typeof rule.code !== 'string') errors.push('code requis');
    if (!rule.nom) errors.push('nom requis');
    if (!['ACTIVE', 'INACTIVE', 'DRAFT', 'ARCHIVED'].includes(rule.status)) {
      errors.push(`status invalide: ${rule.status}`);
    }
    if (typeof rule.priority !== 'number') errors.push('priority numerique requise');
    if (!rule.conditions) errors.push('conditions requises');
    else {
      const v = this.conditionsEngine.validate(rule.conditions);
      errors.push(...v.errors);
    }
    if (!Array.isArray(rule.effects)) {
      errors.push('effets (effects) requis');
    } else if (rule.effects.length === 0 && rule.status === 'ACTIVE') {
      errors.push('effets (effects) requis pour une regle ACTIVE');
    } else if (rule.effects.length === 0) {
      warnings.push('Aucun effet defini');
    }
    if (!rule.version) warnings.push('version absente');

    return { valid: errors.length === 0, errors, warnings };
  }

  /**
   * Evalue une règle avec un contexte contrôlé.
   */
  evaluateRule(code: string, ctx: AutomationContext): RuleEvaluationResult {
    const start = Date.now();
    const rule = this.getRule(code);
    const trace: string[] = [];

    if (rule.status !== 'ACTIVE') {
      trace.push(`Regle ${code} non active (${rule.status})`);
      return {
        code,
        result: 'SKIPPED',
        trace,
        duration: Date.now() - start,
        version: rule.version,
      };
    }

    try {
      const { result: matches, trace: condTrace } = this.conditionsEngine.evaluateWithTracePublic(
        rule.conditions,
        ctx.variables || {},
      );
      trace.push(...condTrace);
      trace.push(`Conditions: ${matches ? 'MATCH' : 'NO_MATCH'}`);

      return {
        code,
        result: matches ? 'MATCHED' : 'NOT_MATCHED',
        trace,
        duration: Date.now() - start,
        version: rule.version,
      };
    } catch (error) {
      trace.push(`Erreur: ${error.message}`);
      return {
        code,
        result: 'ERROR',
        trace,
        duration: Date.now() - start,
        version: rule.version,
      };
    }
  }

  /**
   * Evalue toutes les règles actives dans un ordre stable (priorité décroissante, code).
   */
  evaluateAll(ctx: AutomationContext): RuleEvaluationResult[] {
    const results: RuleEvaluationResult[] = [];
    for (const rule of this.getActiveRules()) {
      results.push(this.evaluateRule(rule.code, ctx));
    }
    return results;
  }

  /**
   * Simulation d'une règle avec contexte contrôlé, sans effet métier.
   */
  simulateRule(code: string, testContext: Record<string, any>): RuleEvaluationResult {
    const start = Date.now();
    const rule = this.getRule(code);
    const trace: string[] = [];

    if (!rule.conditions) {
      return { code, result: 'ERROR', trace: ['conditions absentes'], duration: Date.now() - start, version: rule.version };
    }

    const sim = this.conditionsEngine.simulate(rule.conditions, testContext);
    trace.push(...sim.trace);

    return {
      code,
      result: sim.result ? 'MATCHED' : 'NOT_MATCHED',
      trace,
      duration: Date.now() - start,
      version: rule.version,
    };
  }

  deactivateRule(code: string): void {
    const rule = this.getRule(code);
    rule.status = 'INACTIVE';
    this.rules.set(code, rule);
    this.logger.log(`Regle desactivee: ${code}`);
  }

  activateRule(code: string): void {
    const rule = this.getRule(code);
    rule.status = 'ACTIVE';
    this.rules.set(code, rule);
    this.logger.log(`Regle activee: ${code}`);
  }
}
