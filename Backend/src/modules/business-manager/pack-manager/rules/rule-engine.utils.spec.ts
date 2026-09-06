import { RuleOperator, RuleValueType } from '../../../../common/enums';
import { evaluateExpression, ruleHash, validateExpression } from './rule-engine.utils';

describe('rule engine', () => {
  it('validates only registered fields and compatible operators', () => {
    expect(validateExpression({ field: 'subscription.plan', operator: RuleOperator.IN, value: ['PRO'], valueType: RuleValueType.ARRAY })).toEqual([]);
    expect(validateExpression({ field: 'database.password', operator: RuleOperator.EQ, value: 'x' })).toContain('PACK_RULE_FIELD_NOT_FOUND');
    expect(validateExpression({ field: 'tenant.country', operator: RuleOperator.GT, value: 'MG' })).toContain('PACK_RULE_OPERATOR_INVALID');
  });

  it('evaluates nested all, any, and not expressions with traces', () => {
    const result = evaluateExpression({
      all: [
        { field: 'subscription.plan', operator: RuleOperator.IN, value: ['PRO', 'PREMIUM'] },
        { not: { any: [{ field: 'tenant.country', operator: RuleOperator.EQ, value: 'FR' }, { field: 'context.flags.beta', operator: RuleOperator.EQ, value: false }] } },
      ],
    }, { subscription: { plan: 'PRO' }, tenant: { country: 'MG' }, context: { flags: { beta: true } } });
    expect(result.matched).toBe(true);
    expect(result.trace.children).toHaveLength(2);
  });

  it('produces the same hash regardless of object key order', () => {
    expect(ruleHash({ b: 2, a: { y: true, x: 1 } })).toBe(ruleHash({ a: { x: 1, y: true }, b: 2 }));
  });
});
