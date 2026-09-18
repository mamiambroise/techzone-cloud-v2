import { ConditionsEngine } from './conditions.engine';
import { ConditionNode } from '../interfaces/automation.contract';

describe('ConditionsEngine', () => {
  let engine: ConditionsEngine;

  beforeEach(() => {
    engine = new ConditionsEngine();
  });

  describe('evaluate', () => {
    const context = {
      invoice: { total: 150000, status: 'VALIDATED' },
      stock: { current: 3 },
      customer: { name: 'Jean' },
    };

    it('should evaluate simple EQ', () => {
      expect(engine.evaluate({ field: 'invoice.status', operator: 'EQ', value: 'VALIDATED' }, context)).toBe(true);
      expect(engine.evaluate({ field: 'invoice.status', operator: 'EQ', value: 'DRAFT' }, context)).toBe(false);
    });

    it('should evaluate GT', () => {
      expect(engine.evaluate({ field: 'invoice.total', operator: 'GT', value: 100000 }, context)).toBe(true);
      expect(engine.evaluate({ field: 'invoice.total', operator: 'GT', value: 200000 }, context)).toBe(false);
    });

    it('should evaluate LTE', () => {
      expect(engine.evaluate({ field: 'stock.current', operator: 'LTE', value: 5 }, context)).toBe(true);
    });

    it('should evaluate AND logic', () => {
      const condition: ConditionNode = {
        logic: 'AND',
        conditions: [
          { field: 'invoice.total', operator: 'GT', value: 100000 },
          { field: 'invoice.status', operator: 'EQ', value: 'VALIDATED' },
        ],
      };
      expect(engine.evaluate(condition, context)).toBe(true);
    });

    it('should evaluate OR logic', () => {
      const condition: ConditionNode = {
        logic: 'OR',
        conditions: [
          { field: 'invoice.total', operator: 'GT', value: 1000000 },
          { field: 'invoice.status', operator: 'EQ', value: 'VALIDATED' },
        ],
      };
      expect(engine.evaluate(condition, context)).toBe(true);
    });

    it('should evaluate NOT logic', () => {
      expect(engine.evaluate({ field: 'invoice.status', operator: 'EQ', value: 'DRAFT', not: true }, context)).toBe(true);
    });

    it('should handle IN operator', () => {
      expect(engine.evaluate({ field: 'invoice.status', operator: 'IN', value: ['DRAFT', 'VALIDATED'] }, context)).toBe(true);
      expect(engine.evaluate({ field: 'invoice.status', operator: 'IN', value: ['DRAFT'] }, context)).toBe(false);
    });

    it('should handle IS_NULL', () => {
      expect(engine.evaluate({ field: 'customer.email', operator: 'IS_NULL' }, context)).toBe(true);
    });

    it('should reject disallowed operator', () => {
      expect(() => engine.evaluate({ field: 'invoice.total', operator: 'LIKE', value: 'x' }, context)).toThrow('non autorise');
    });

    it('should reject missing operator', () => {
      expect(() => engine.evaluate({ field: 'invoice.total', value: 100 } as any, context)).toThrow('operator requis');
    });
  });

  describe('evaluateFormula', () => {
    it('should perform ADD', () => {
      const expr = { operator: 'ADD', left: { value: 2, type: 'NUMBER' }, right: { value: 3, type: 'NUMBER' } };
      expect(engine.evaluateFormula(expr, {})).toBe(5);
    });

    it('should perform MUL with field', () => {
      const expr = { operator: 'MUL', left: { field: 'price' }, right: { value: 2, type: 'NUMBER' } };
      expect(engine.evaluateFormula(expr, { price: 10 })).toBe(20);
    });

    it('should reject division by zero', () => {
      const expr = { operator: 'DIV', left: { value: 10, type: 'NUMBER' }, right: { value: 0, type: 'NUMBER' } };
      expect(() => engine.evaluateFormula(expr, {})).toThrow('Division par zero');
    });

    it('should reject unknown function', () => {
      const expr = { operator: 'EVAL_X', left: { value: 1, type: 'NUMBER' } };
      expect(() => engine.evaluateFormula(expr, {})).toThrow('non autorisee');
    });
  });

  describe('validate & simulate', () => {
    it('should validate a correct condition tree', () => {
      const result = engine.validate({
        logic: 'AND',
        conditions: [
          { field: 'invoice.total', operator: 'GT', value: 100000 },
          { field: 'invoice.status', operator: 'EQ', value: 'VALIDATED' },
        ],
      });
      expect(result.valid).toBe(true);
    });

    it('should report invalid operator', () => {
      const result = engine.validate({ field: 'x', operator: 'ILLEGAL' } as any);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes('non autorise'))).toBe(true);
    });

    it('should produce a trace during simulation', () => {
      const sim = engine.simulate(
        { field: 'invoice.total', operator: 'GT', value: 100000 },
        { invoice: { total: 150000 } },
      );
      expect(sim.result).toBe(true);
      expect(sim.trace.length).toBeGreaterThan(0);
    });
  });
});
