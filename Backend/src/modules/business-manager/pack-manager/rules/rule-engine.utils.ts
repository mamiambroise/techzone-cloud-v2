import { createHash } from 'node:crypto';
import { ConflictException } from '@nestjs/common';
import { RuleOperator, RuleValueType } from '../../../../common/enums';

export interface RulePredicate { field: string; operator: RuleOperator; value?: unknown; valueType?: RuleValueType; }
export interface RuleExpression { all?: RuleNode[]; any?: RuleNode[]; not?: RuleNode; field?: string; operator?: RuleOperator; value?: unknown; valueType?: RuleValueType; }
export type RuleNode = RuleExpression;
export interface EvaluationTrace { field?: string; operator?: RuleOperator; expected?: unknown; actual?: unknown; result: boolean; children?: EvaluationTrace[]; }

export const FIELD_REGISTRY: Record<string, { dataType: RuleValueType; operators: RuleOperator[] }> = {
  'tenant.id': { dataType: RuleValueType.STRING, operators: Object.values(RuleOperator) },
  'tenant.country': { dataType: RuleValueType.STRING, operators: [RuleOperator.EQ, RuleOperator.NEQ, RuleOperator.IN, RuleOperator.NOT_IN] },
  'tenant.type': { dataType: RuleValueType.STRING, operators: [RuleOperator.EQ, RuleOperator.NEQ, RuleOperator.IN, RuleOperator.NOT_IN] },
  'subscription.plan': { dataType: RuleValueType.STRING, operators: [RuleOperator.EQ, RuleOperator.NEQ, RuleOperator.IN, RuleOperator.NOT_IN] },
  'subscription.status': { dataType: RuleValueType.STRING, operators: [RuleOperator.EQ, RuleOperator.NEQ, RuleOperator.IN, RuleOperator.NOT_IN] },
  'environment.name': { dataType: RuleValueType.STRING, operators: [RuleOperator.EQ, RuleOperator.NEQ, RuleOperator.IN, RuleOperator.NOT_IN] },
  'context.flags.beta': { dataType: RuleValueType.BOOLEAN, operators: [RuleOperator.EQ, RuleOperator.NEQ] },
};

export function getContextValue(context: Record<string, unknown>, field: string) {
  if (Object.prototype.hasOwnProperty.call(context, field)) return context[field];
  return field.split('.').reduce<unknown>((value, key) => value && typeof value === 'object' ? (value as Record<string, unknown>)[key] : undefined, context);
}

export function validateExpression(expression: RuleExpression, depth = 0, count = { value: 0 }): string[] {
  if (depth > 12) return ['PACK_RULE_TOO_COMPLEX'];
  count.value += 1;
  if (count.value > 100) return ['PACK_RULE_TOO_COMPLEX'];
  const errors: string[] = [];
  if (expression.all || expression.any) {
    const group = expression.all ?? expression.any;
    if (!group?.length) errors.push('PACK_RULE_EMPTY_GROUP');
    for (const child of group ?? []) errors.push(...validateExpression(child, depth + 1, count));
    return errors;
  }
  if (expression.not) return validateExpression(expression.not, depth + 1, count);
  if (!expression.field || !expression.operator || !Object.values(RuleOperator).includes(expression.operator)) return ['PACK_RULE_OPERATOR_INVALID'];
  const field = FIELD_REGISTRY[expression.field];
  if (!field) return ['PACK_RULE_FIELD_NOT_FOUND'];
  if (!field.operators.includes(expression.operator)) return ['PACK_RULE_OPERATOR_INVALID'];
  if (![RuleOperator.EXISTS, RuleOperator.NOT_EXISTS].includes(expression.operator) && expression.value === undefined) return ['PACK_RULE_VALUE_INVALID'];
  if ([RuleOperator.IN, RuleOperator.NOT_IN].includes(expression.operator) && !Array.isArray(expression.value)) return ['PACK_RULE_VALUE_INVALID'];
  return errors;
}

export function evaluateExpression(expression: RuleExpression, context: Record<string, unknown>): { matched: boolean; trace: EvaluationTrace } {
  if (expression.all) { const children = expression.all.map((child) => evaluateExpression(child, context)); return { matched: children.every((item) => item.matched), trace: { result: children.every((item) => item.matched), children: children.map((item) => item.trace) } }; }
  if (expression.any) { const children = expression.any.map((child) => evaluateExpression(child, context)); return { matched: children.some((item) => item.matched), trace: { result: children.some((item) => item.matched), children: children.map((item) => item.trace) } }; }
  if (expression.not) { const child = evaluateExpression(expression.not, context); return { matched: !child.matched, trace: { result: !child.matched, children: [child.trace] } }; }
  const actual = expression.field ? getContextValue(context, expression.field) : undefined;
  const result = compare(actual, expression.operator!, expression.value);
  return { matched: result, trace: { field: expression.field, operator: expression.operator, expected: expression.value, actual, result } };
}

export function canonicalRule(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonicalRule);
  if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).sort(([left], [right]) => left.localeCompare(right)).map(([key, item]) => [key, canonicalRule(item)]));
  return value;
}

export function ruleHash(value: unknown) { return createHash('sha256').update(JSON.stringify(canonicalRule(value))).digest('hex'); }

function compare(actual: unknown, operator: RuleOperator, expected: unknown) {
  if (operator === RuleOperator.EXISTS) return actual !== undefined && actual !== null;
  if (operator === RuleOperator.NOT_EXISTS) return actual === undefined || actual === null;
  if (operator === RuleOperator.EQ || operator === RuleOperator.VERSION_EQ) return actual === expected;
  if (operator === RuleOperator.NEQ) return actual !== expected;
  if (operator === RuleOperator.IN) return Array.isArray(expected) && expected.includes(actual);
  if (operator === RuleOperator.NOT_IN) return Array.isArray(expected) && !expected.includes(actual);
  if (operator === RuleOperator.CONTAINS) return typeof actual === 'string' && actual.includes(String(expected));
  if (operator === RuleOperator.NOT_CONTAINS) return typeof actual === 'string' && !actual.includes(String(expected));
  if (operator === RuleOperator.STARTS_WITH) return typeof actual === 'string' && actual.startsWith(String(expected));
  if (operator === RuleOperator.ENDS_WITH) return typeof actual === 'string' && actual.endsWith(String(expected));
  if (operator === RuleOperator.MATCHES) return typeof actual === 'string' && new RegExp(String(expected)).test(actual);
  if (operator === RuleOperator.BETWEEN) return Array.isArray(expected) && Number(actual) >= Number(expected[0]) && Number(actual) <= Number(expected[1]);
  if (operator === RuleOperator.GT || operator === RuleOperator.VERSION_GT) return Number(actual) > Number(expected);
  if (operator === RuleOperator.GTE || operator === RuleOperator.VERSION_GTE) return Number(actual) >= Number(expected);
  if (operator === RuleOperator.LT || operator === RuleOperator.VERSION_LT) return Number(actual) < Number(expected);
  if (operator === RuleOperator.LTE || operator === RuleOperator.VERSION_LTE) return Number(actual) <= Number(expected);
  if (operator === RuleOperator.VERSION_SATISFIES) return typeof actual === 'string' && typeof expected === 'string' && actual.startsWith(expected.replace(/^[^0-9]*/, ''));
  throw new ConflictException('PACK_RULE_OPERATOR_INVALID');
}