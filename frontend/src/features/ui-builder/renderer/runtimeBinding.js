/** Resolve BM entity codes using the explicit version, never a draft/latest lookup. */
export function runtimeResource(entity, context) {
  if (!entity) return null;
  if (entity.startsWith('bm:')) return entity;
  return context?.applicationVersionId && context.entities?.some(e => e.code === entity)
    ? `bm:${context.applicationVersionId}:${entity}` : entity;
}

export function fieldSchema(node, context) {
  const binding = node?.bindings?.value;
  const code = binding?.entity?.startsWith('bm:') ? binding.entity.split(':')[2] : binding?.entity;
  return context?.entities?.find(e => e.code === code)?.fields?.find(f => f.code === binding?.field);
}

export function serializeFields(nodes, form, context) {
  const values = new FormData(form);
  const input = {};
  for (const node of nodes) {
    const binding = node.bindings?.value;
    if (binding?.kind !== 'ENTITY_FIELD' || !binding.field) continue;
    const schema = fieldSchema(node, context);
    if (schema?.readonly || node.props?.readonly) continue;
    let value = values.get(node.id);
    if (schema?.type === 'BOOLEAN' || node.type === 'Checkbox') value = Boolean(form.elements.namedItem(node.id)?.checked);
    else if (['INTEGER', 'DECIMAL'].includes(schema?.type) || node.props?.inputType === 'number') value = value === '' || value === null ? null : Number(value);
    else if (value === '' && !schema?.required) continue;
    input[binding.field] = value;
  }
  return input;
}

export function recordRows(result) {
  const rows = result.items || result.data || [];
  return rows.map(row => row.data && typeof row.data === 'object' && row.entityCode ? { ...row.data, id: row.id } : row);
}
