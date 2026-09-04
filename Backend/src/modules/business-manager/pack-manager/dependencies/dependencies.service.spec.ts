import { findDependencyCycles, normalizeVersionRange, satisfiesVersion } from './dependency-resolver.utils';

describe('DependenciesService', () => {
  it('normalizes valid version ranges and rejects invalid ranges', () => {
    expect(normalizeVersionRange('  >=1.2.0   <2.0.0 ')).toBe('>=1.2.0 <2.0.0');
    expect(() => normalizeVersionRange('latest')).toThrow('PACK_DEPENDENCY_VERSION_RANGE_INVALID');
  });

  it('evaluates exact, caret, tilde, and bounded ranges', () => {
    expect(satisfiesVersion('1.4.3', '^1.2.0')).toBe(true);
    expect(satisfiesVersion('2.0.0', '^1.2.0')).toBe(false);
    expect(satisfiesVersion('1.4.3', '~1.4.0')).toBe(true);
    expect(satisfiesVersion('1.5.0', '~1.4.0')).toBe(false);
    expect(satisfiesVersion('1.8.0', '>=1.2.0 <2.0.0')).toBe(true);
  });

  it('detects directed dependency cycles and returns the path', () => {
    const cycles = findDependencyCycles(new Map([
      ['A', ['B']],
      ['B', ['C']],
      ['C', ['A']],
    ]));
    expect(cycles).toEqual([['A', 'B', 'C', 'A']]);
  });
});
