import { RulesEngine } from './rules.engine';
import { ConditionsEngine } from '../conditions/conditions.engine';
import { AutomationContext } from '../interfaces/automation.contract';

describe('RulesEngine', () => {
  let rulesEngine: RulesEngine;
  let ctx: AutomationContext;

  beforeEach(() => {
    const conditionsEngine = new ConditionsEngine();
    rulesEngine = new RulesEngine(conditionsEngine);

    rulesEngine.registerRule({
      code: 'rule.high.total',
      nom: 'Montant eleve',
      status: 'ACTIVE',
      priority: 100,
      version: '1.0',
      conditions: { logic: 'AND', conditions: [{ field: 'invoice.total', operator: 'GT', value: 100000 }, { field: 'invoice.status', operator: 'EQ', value: 'VALIDATED' }] },
      effects: ['send.notification'],
    });
    rulesEngine.registerRule({
      code: 'rule.low.stock',
      nom: 'Stock bas',
      status: 'ACTIVE',
      priority: 50,
      version: '1.0',
      conditions: { field: 'stock.current', operator: 'LTE', value: 5 },
      effects: ['send.notification'],
    });
    rulesEngine.registerRule({
      code: 'rule.inactive',
      nom: 'Inactive',
      status: 'INACTIVE',
      priority: 200,
      version: '1.0',
      conditions: { field: 'x', operator: 'EQ', value: 1 },
      effects: ['send.notification'],
    });

    ctx = {
      tenantId: 'tenant-1',
      userId: 'user-1',
      traceId: 'trace-1',
      permissions: ['*'],
      variables: { invoice: { total: 150000, status: 'VALIDATED' }, stock: { current: 3 } },
    };
  });

  describe('registration & validation', () => {
    it('should register and retrieve a rule', () => {
      const rule = rulesEngine.getRule('rule.high.total');
      expect(rule.code).toBe('rule.high.total');
      expect(rule.priority).toBe(100);
    });

    it('should reject an invalid rule', () => {
      expect(() =>
        rulesEngine.registerRule({ code: '', nom: '', status: 'BAD' as any, priority: 1, version: '1', conditions: undefined as any, effects: [] }),
      ).toThrow('Regle invalide');
    });

    it('should return active rules sorted by priority', () => {
      const active = rulesEngine.getActiveRules();
      expect(active).toHaveLength(2);
      expect(active[0].code).toBe('rule.high.total');
    });
  });

  describe('evaluateRule', () => {
    it('should MATCH a matching rule', () => {
      const result = rulesEngine.evaluateRule('rule.high.total', ctx);
      expect(result.result).toBe('MATCHED');
    });

    it('should NOT_MATCH a non-matching rule', () => {
      const noMatchCtx = { ...ctx, variables: { invoice: { total: 50000, status: 'DRAFT' } } };
      const result = rulesEngine.evaluateRule('rule.high.total', noMatchCtx);
      expect(result.result).toBe('NOT_MATCHED');
    });

    it('should SKIP an inactive rule', () => {
      const result = rulesEngine.evaluateRule('rule.inactive', ctx);
      expect(result.result).toBe('SKIPPED');
    });

    it('should produce trace on evaluation', () => {
      const result = rulesEngine.evaluateRule('rule.low.stock', { ...ctx, variables: { stock: { current: 2 } } });
      expect(result.trace.length).toBeGreaterThan(0);
    });
  });

  describe('evaluateAll', () => {
    it('should evaluate all active rules in order', () => {
      const results = rulesEngine.evaluateAll(ctx);
      expect(results).toHaveLength(2);
      expect(results[0].code).toBe('rule.high.total');
      expect(results[0].result).toBe('MATCHED');
      expect(results[1].code).toBe('rule.low.stock');
      expect(results[1].result).toBe('MATCHED');
    });
  });

  describe('simulateRule', () => {
    it('should simulate a rule match', () => {
      const result = rulesEngine.simulateRule('rule.high.total', { invoice: { total: 150000, status: 'VALIDATED' } });
      expect(result.result).toBe('MATCHED');
      expect(result.trace.length).toBeGreaterThan(0);
    });
  });

  describe('lifecycle', () => {
    it('should deactivate and reactivate a rule', () => {
      rulesEngine.deactivateRule('rule.high.total');
      expect(rulesEngine.getRule('rule.high.total').status).toBe('INACTIVE');
      rulesEngine.activateRule('rule.high.total');
      expect(rulesEngine.getRule('rule.high.total').status).toBe('ACTIVE');
    });
  });
});
