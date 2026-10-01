import { describe, expect, it } from '@jest/globals';
import { compatible, contractHash, dependencyIssues, matches, publicJson, validateExpression } from './pack-contract';

describe('Pack contracts: fail closed and deterministic', () => {
  it('hashes object key order identically and detects nested changes', () => {
    expect(contractHash({ b:2,a:{ c:1 } })).toBe(contractHash({ a:{ c:1 },b:2 }));
    expect(contractHash({ a:{ c:2 } })).not.toBe(contractHash({ a:{ c:1 } }));
  });
  it('rejects embedded secrets and executable object keys', () => {
    expect(() => publicJson({ config:{ apiToken:'private' } })).toThrow();
    expect(() => publicJson(JSON.parse('{"__proto__":{"admin":true}}'))).toThrow();
  });
  it('validates typed rule expressions and denies missing context', () => {
    expect(() => validateExpression({ field:'user.password',operator:'EQ',value:'x' })).toThrow();
    expect(() => validateExpression({ field:'locale',operator:'EXEC',value:'x' })).toThrow();
    expect(() => validateExpression({ all:[] })).toThrow();
    expect(matches({ field:'locale',operator:'NEQ',value:'fr' },{})).toBe(false);
    expect(matches({ all:[{ field:'environment.code',operator:'EQ',value:'DEV' },{ not:{ field:'permissions',operator:'CONTAINS',value:'admin' } }] },{ environment:{ code:'DEV' },permissions:[] })).toBe(true);
  });
  it('enforces SemVer ranges', () => {
    expect(compatible('1.2.3','^1.0.0')).toBe(true);
    expect(compatible('2.0.0','^1.0.0')).toBe(false);
    expect(() => compatible('1.0.0','garbage')).toThrow();
  });
  const definition = { pack:{ code:'test' },modules:[{ id:'a-id',code:'a',enabled:true },{ id:'b-id',code:'b',enabled:true }],features:[],dependencies:[] as any[] };
  it('distinguishes optional targets and conflicts', () => {
    expect(dependencyIssues({ ...definition,dependencies:[{ sourceId:'a',targetRef:'missing',targetType:'MODULE',type:'OPTIONAL' }] })).toEqual([]);
    expect(dependencyIssues({ ...definition,dependencies:[{ sourceId:'a',targetRef:'b',targetType:'MODULE',type:'CONFLICTS_WITH' }] })[0].code).toBe('DEPENDENCY_CONFLICT');
  });
  it('detects cycles across UUID and code references', () => {
    const dependencies = [{ sourceId:'a-id',targetRef:'b',targetType:'MODULE',type:'REQUIRED' },{ sourceId:'b',targetRef:'a-id',targetType:'MODULE',type:'REQUIRED' }];
    expect(dependencyIssues({ ...definition,dependencies }).some(i => i.code === 'DEPENDENCY_CYCLE')).toBe(true);
  });
  it('requires compatible published external dependencies', () => {
    const dependencies = [{ sourceId:'a',targetType:'PACK',targetRef:'inventory',targetVersionRange:'^2.0.0',type:'REQUIRED' }];
    expect(dependencyIssues({ ...definition,dependencies },[{ code:'inventory',versionNumber:'1.0.0' }])[0].code).toBe('DEPENDENCY_MISSING');
  });
});
