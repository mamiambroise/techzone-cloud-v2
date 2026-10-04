import { describe, it, expect } from 'vitest';
import { recordRows, runtimeResource, serializeFields } from './runtimeBinding.js';
describe('BM runtime binding', () => {
  const context = { applicationVersionId: 'version', entities: [{ code: 'item', fields: [{ code: 'active', type: 'BOOLEAN' }, { code: 'price', type: 'DECIMAL' }] }] };
  it('pins the explicit application version and unwraps record data', () => {
    expect(runtimeResource('item', context)).toBe('bm:version:item');
    expect(recordRows({ items: [{ id: 'id', entityCode: 'item', data: { name: 'PH6' } }] })).toEqual([{ id: 'id', name: 'PH6' }]);
  });
  it('serializes booleans and numbers, not checkbox strings', () => {
    const form = document.createElement('form');
    form.innerHTML = '<input name="a" type="checkbox" checked><input name="p" value="12.5">';
    const nodes = ['active', 'price'].map((field, i) => ({ id: i ? 'p' : 'a', bindings: { value: { kind: 'ENTITY_FIELD', entity: 'item', field } } }));
    expect(serializeFields(nodes, form, context)).toEqual({ active: true, price: 12.5 });
  });
});
