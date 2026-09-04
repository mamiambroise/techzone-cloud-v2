import { ConflictException } from '@nestjs/common';

export function normalizeVersionRange(range?: string) {
  if (!range) return undefined;
  const normalized = range.replace(/\s+/g, ' ').trim();
  if (!isValidVersionRange(normalized)) throw new ConflictException('PACK_DEPENDENCY_VERSION_RANGE_INVALID');
  return normalized;
}

export function isValidVersionRange(range: string) {
  return /^(\^|~|>=|<=|>|<)?\d+\.\d+\.\d+(\s+(<|<=|>|>=)\d+\.\d+\.\d+)?$/.test(range);
}

export function satisfiesVersion(version: string | undefined, range?: string) {
  if (!range) return !!version;
  if (!version || !/^\d+\.\d+\.\d+$/.test(version)) return false;
  const current = parts(version);
  return range.split(' ').every((clause) => {
    const op = clause.match(/^(\^|~|>=|<=|>|<)?/)?.[1] ?? '=';
    const expected = parts(clause.replace(/^(\^|~|>=|<=|>|<)/, ''));
    const comparison = compare(current, expected);
    if (op === '^') return comparison >= 0 && current[0] === expected[0];
    if (op === '~') return comparison >= 0 && current[0] === expected[0] && current[1] === expected[1];
    if (op === '>=') return comparison >= 0;
    if (op === '<=') return comparison <= 0;
    if (op === '>') return comparison > 0;
    if (op === '<') return comparison < 0;
    return comparison === 0;
  });
}

export function findDependencyCycles(edges: Map<string, string[]>) {
  const cycles: string[][] = [];
  const visiting = new Set<string>();
  const visited = new Set<string>();
  const path: string[] = [];
  const visit = (node: string) => {
    if (visiting.has(node)) { const start = path.indexOf(node); if (start >= 0) cycles.push([...path.slice(start), node]); return; }
    if (visited.has(node)) return;
    visiting.add(node); path.push(node);
    for (const next of edges.get(node) ?? []) visit(next);
    path.pop(); visiting.delete(node); visited.add(node);
  };
  for (const node of edges.keys()) visit(node);
  return cycles;
}

function parts(version: string) { return version.split('.').map(Number); }
function compare(left: number[], right: number[]) { for (let index = 0; index < 3; index++) if (left[index] !== right[index]) return left[index] > right[index] ? 1 : -1; return 0; }
