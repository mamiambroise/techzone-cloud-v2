import { describe, expect, it } from 'vitest';
import { resolveEditorPage } from './resolveEditorPage.js';
const pages = [{ id: 'first' }, { id: 'selected' }, { id: 'linked' }];
describe('editor page resolver', () => {
  it.each([
    ['linked', 'selected', 'linked'],
    ['deleted', 'selected', 'selected'],
    ['editor', 'deleted', 'first'],
    [undefined, undefined, 'first'],
  ])('resolves route %s and selection %s to %s', (routePageId, selectedPageId, expected) => {
    expect(resolveEditorPage({ routePageId, selectedPageId, pages })?.id).toBe(expected);
  });
  it('returns null for an empty version even with stale IDs', () => {
    expect(resolveEditorPage({ routePageId: 'linked', selectedPageId: 'selected', pages: [] })).toBeNull();
  });
});
