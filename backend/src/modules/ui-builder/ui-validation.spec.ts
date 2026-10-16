import { describe, expect, it } from '@jest/globals';
import { isUiRoute, isUiUrl, validateUiTree, validateUiTheme } from './ui-validation';

const node = (id: string, type = 'Container', children: string[] = []) => ({ id, type, props: {}, children });
const tree = () => ({ root: 'root', nodes: { root: node('root') } });

describe('UI validation — declarative runtime contract', () => {
  it.each(['/products', '/', '/products/:id', '/products/{id}'])('accepts internal route %s', route => expect(isUiRoute(route)).toBe(true));
  it.each(['//evil.test', '/api/users', '/auth/login', '/login', '/products/../admin', '/products?x=1', '/\\evil.test', 'https://evil.test', '/products\n'])('rejects unsafe/reserved route %s', route => expect(isUiRoute(route)).toBe(false));
  it.each(['javascript:alert(1)', '//evil.test', '/\\evil.test', 'data:text/html,test', 'https://user:pass@evil.test'])('rejects unsafe URL %s', url => expect(isUiUrl(url)).toBe(false));
  it('accepts https images and internal links', () => {
    expect(isUiUrl('https://example.test/logo.png', true)).toBe(true);
    expect(isUiUrl('/products')).toBe(true);
    expect(isUiUrl('/products', true)).toBe(false);
  });
  it('accepts a valid declarative tree and responsive visibility', () => {
    const value = tree();
    Object.assign(value.nodes.root, { responsive: { MOBILE: { visible: 'hidden' } } });
    expect(validateUiTree(value)).toEqual([]);
  });
  it.each([null, [], {}, { root: 'root', nodes: null }, { root: 'root', nodes: { root: null } }])('rejects malformed persisted trees without throwing', value => expect(validateUiTree(value).length).toBeGreaterThan(0));
  it('rejects unknown components including inherited object property names', () => {
    for (const type of ['ArbitraryReact', 'constructor', '__proto__']) {
      expect(validateUiTree({ root: 'root', nodes: { root: node('root', type) } }).some(i => i.code === 'COMPONENT_UNKNOWN')).toBe(true);
    }
  });
  it('detects cycles, broken references, duplicate parents and forbidden nesting', () => {
    const values = [
      { root: 'root', nodes: { root: node('root', 'Container', ['root']) } },
      { root: 'root', nodes: { root: node('root', 'Container', ['missing']) } },
      { root: 'root', nodes: { root: node('root', 'Container', ['a', 'a']), a: node('a') } },
      { root: 'root', nodes: { root: node('root', 'Text', ['a']), a: node('a') } },
    ];
    for (const value of values) expect(validateUiTree(value).length).toBeGreaterThan(0);
  });
  it('rejects executable props and invalid property types', () => {
    for (const props of [{ onClick: 'alert(1)' }, { dangerouslySetInnerHTML: { __html: '<script />' } }, { text: { arbitrary: 'object' } }]) {
      expect(validateUiTree({ root: 'root', nodes: { root: { ...node('root', 'Text'), props } } }).length).toBeGreaterThan(0);
    }
  });
  it('checks bounded numbers, enum properties and responsive scopes', () => {
    const values = [
      { ...node('root', 'Grid'), props: { columns: 900 } },
      { ...node('root'), props: { padding: 'arbitrary-css' } },
      { ...node('root'), responsive: { WATCH: { visible: 'hidden' } } },
    ];
    for (const root of values) expect(validateUiTree({ root: 'root', nodes: { root } }).length).toBeGreaterThan(0);
  });
  it('rejects invalid/malicious theme values and inverted breakpoints', () => {
    for (const value of [{ colors: { primary: 'url(javascript:evil)' } }, { radius: { md: -1 } }, { shadow: { card: 'url(https://evil.test)' } }, { breakpoints: { mobile: 900, tablet: 600 } }, { css: {} }]) expect(validateUiTheme(value)).toHaveLength(1);
    expect(validateUiTheme({ colors: { primary: '#2563eb' }, radius: { md: 12 }, breakpoints: { mobile: 420, tablet: 834 } })).toEqual([]);
  });
});
