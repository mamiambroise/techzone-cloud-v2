import { BadRequestException } from '@nestjs/common';
import { createHash } from 'node:crypto';
import { satisfies, validRange } from 'semver';

export type RecordValue = Record<string, any>;
export const canonical = (value: any): string => Array.isArray(value)
  ? `[${value.map(canonical).join(',')}]`
  : value && typeof value === 'object'
    ? `{${Object.keys(value).filter(k => value[k] !== undefined).sort().map(k => JSON.stringify(k) + ':' + canonical(value[k])).join(',')}}`
    : JSON.stringify(value);
export const contractHash = (value: unknown) => 'sha256:' + createHash('sha256').update(canonical(value)).digest('hex');
const fields = /^(tenant\.id|application\.(id|version)|environment\.code|permissions|capabilities|locale|timezone|featureFlags\.[a-zA-Z0-9_.-]+)$/;
const operators = ['EQ', 'NEQ', 'IN', 'NOT_IN', 'CONTAINS', 'EXISTS', 'GT', 'GTE', 'LT', 'LTE'];

/** Reject executable content and secrets instead of silently publishing a redacted definition. */
export function publicJson(value: unknown, depth = 0): void {
  if (depth > 20) throw new BadRequestException('JSON_DEPTH_EXCEEDED');
  if (value && typeof value === 'object') for (const [key, child] of Object.entries(value)) {
    if (/password|secret|token|credential|private.?key|__proto__|constructor|prototype/i.test(key))
      throw new BadRequestException('PRIVATE_CONFIGURATION_FORBIDDEN');
    publicJson(child, depth + 1);
  }
}

export function validateExpression(node: any, depth = 0): void {
  if (!node || typeof node !== 'object' || Array.isArray(node) || depth > 12)
    throw new BadRequestException('RULE_EXPRESSION_INVALID');
  const groups = ['all', 'any', 'not'].filter(k => k in node);
  if (groups.length) {
    if (groups.length !== 1 || Object.keys(node).length !== 1) throw new BadRequestException('RULE_GROUP_INVALID');
    const key = groups[0];
    if (key === 'not') return validateExpression(node.not, depth + 1);
    if (!Array.isArray(node[key]) || !node[key].length || node[key].length > 50) throw new BadRequestException('RULE_GROUP_INVALID');
    node[key].forEach((child: any) => validateExpression(child, depth + 1));
    return;
  }
  if (typeof node.field !== 'string' || !fields.test(node.field) || !operators.includes(node.operator))
    throw new BadRequestException('RULE_FIELD_OR_OPERATOR_INVALID');
  if (['IN', 'NOT_IN'].includes(node.operator) && !Array.isArray(node.value)) throw new BadRequestException('RULE_VALUE_INVALID');
  if (['GT', 'GTE', 'LT', 'LTE'].includes(node.operator) && typeof node.value !== 'number') throw new BadRequestException('RULE_VALUE_INVALID');
  publicJson(node);
}

export function matches(node: any, context: RecordValue): boolean {
  validateExpression(node);
  if (node.all) return node.all.every((n: any) => matches(n, context));
  if (node.any) return node.any.some((n: any) => matches(n, context));
  if (node.not) return !matches(node.not, context);
  const actual = node.field.split('.').reduce((a: any, k: string) => a?.[k], context);
  if (actual === undefined || actual === null) return false; // absent context never grants a rule
  switch (node.operator) {
    case 'EXISTS': return true;
    case 'EQ': return actual === node.value;
    case 'NEQ': return actual !== node.value;
    case 'IN': return node.value.includes(actual);
    case 'NOT_IN': return !node.value.includes(actual);
    case 'CONTAINS': return Array.isArray(actual) && actual.includes(node.value);
    case 'GT': return typeof actual === 'number' && actual > node.value;
    case 'GTE': return typeof actual === 'number' && actual >= node.value;
    case 'LT': return typeof actual === 'number' && actual < node.value;
    case 'LTE': return typeof actual === 'number' && actual <= node.value;
    default: return false;
  }
}

export function compatible(version: string, range?: string | null) {
  if (range && !validRange(range)) throw new BadRequestException('DEPENDENCY_VERSION_RANGE_INVALID');
  return !range || satisfies(version, range);
}

export function dependencyIssues(definition: RecordValue, availablePacks: RecordValue[] = []) {
  const issues: RecordValue[] = [];
  const resources = [...definition.modules, ...definition.features];
  const refs = new Set(resources.flatMap((r: any) => [r.id, r.code]));
  const provided = new Set(definition.features.flatMap((f: any) => (f.capabilities ?? []).filter((c: any) => c.relationType === 'PROVIDES').map((c: any) => c.code)));
  const graph = new Map<string, string[]>();
  for (const d of definition.dependencies) {
    const type = d.type ?? d.dependencyType;
    const available = d.targetType === 'PACK'
      ? availablePacks.some(p => p.code === d.targetRef && compatible(p.versionNumber, d.targetVersionRange))
      : d.targetType === 'CAPABILITY' ? provided.has(d.targetRef) : resources.some((r: any) => (r.id === d.targetRef || r.code === d.targetRef) && r.enabled !== false);
    if (!refs.has(d.sourceId) && d.sourceId !== definition.pack?.code && d.sourceId !== definition.pack?.id)
      issues.push({ code: 'DEPENDENCY_SOURCE_MISSING', path: d.id, severity: 'ERROR', message: d.sourceId });
    const conflict = ['CONFLICTS', 'CONFLICTS_WITH'].includes(type);
    const required = ['REQUIRED', 'REQUIRES', 'IMPLIES'].includes(type) && d.required !== false;
    if ((conflict && available) || (required && !available)) issues.push({ code: conflict ? 'DEPENDENCY_CONFLICT' : 'DEPENDENCY_MISSING', path: d.id, severity: 'ERROR', message: d.targetRef });
    if (required && d.targetType !== 'PACK') {
      const source = resources.find((r: any) => r.id === d.sourceId || r.code === d.sourceId)?.code ?? d.sourceId;
      const target = resources.find((r: any) => r.id === d.targetRef || r.code === d.targetRef)?.code ?? d.targetRef;
      graph.set(source, [...(graph.get(source) ?? []), target]);
    }
  }
  const visited = new Set<string>(), visiting = new Set<string>();
  const cycle = (node: string): boolean => {
    if (visiting.has(node)) return true;
    if (visited.has(node)) return false;
    visiting.add(node);
    if ((graph.get(node) ?? []).some(cycle)) return true;
    visiting.delete(node); visited.add(node); return false;
  };
  if ([...graph.keys()].some(cycle)) issues.push({ code: 'DEPENDENCY_CYCLE', severity: 'ERROR', path: 'dependencies', message: 'Cycle de dépendances obligatoires' });
  return issues;
}
