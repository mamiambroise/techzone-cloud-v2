import { getComponentDefinition } from '../registry/componentRegistry.js';

export function safeUiHref(value, image = false) {
  if (typeof value !== 'string' || /[\s\\\u0000-\u001f]/.test(value)) return null;
  if (!image && /^\/(?!\/)[a-zA-Z0-9_\-/:{}]*$/.test(value)) return value;
  try { const url = new URL(value); return url.protocol === 'https:' && url.hostname && !url.username && !url.password ? value : null; }
  catch { return null; }
}

const record = value => value && typeof value === 'object' && !Array.isArray(value);

/** Guard the graph before either Forms or layout components traverse it. */
export function rendererTreeError(tree) {
  if (!record(tree) || !record(tree.nodes) || typeof tree.root !== 'string') return 'Structure de page invalide.';
  const { nodes } = tree;
  if (!Object.hasOwn(nodes, tree.root)) return 'Racine de page manquante.';
  if (Object.keys(nodes).length > 1000) return 'La page dépasse la limite de composants.';
  const parents = new Set();
  for (const [id, node] of Object.entries(nodes)) {
    if (!record(node) || node.id !== id || typeof node.type !== 'string') return 'Identité de composant invalide.';
    if (node.children !== undefined && !Array.isArray(node.children)) return 'Liste de composants invalide.';
    if (node.actions !== undefined && (!Array.isArray(node.actions) || node.actions.some(action => !record(action) || typeof action.type !== 'string'))) return 'Liste d’actions invalide.';
    if (node.props !== undefined && !record(node.props)) return 'Propriétés de composant invalides.';
    const schema = getComponentDefinition(node.type)?.propertiesSchema || {};
    for (const [key, value] of Object.entries(node.props || {})) {
      const type = schema[key]?.type;
      if (value == null) continue;
      if ((type === 'text' && typeof value !== 'string') || (type === 'textList' && (!Array.isArray(value) || value.some(item => typeof item !== 'string'))) || (type === 'number' && (typeof value !== 'number' || !Number.isFinite(value)))) return 'Propriété incompatible avec le composant.';
    }
    for (const child of node.children || []) {
      if (typeof child !== 'string' || !Object.hasOwn(nodes, child)) return 'Référence de composant manquante.';
      if (parents.has(child) || child === tree.root) return 'Arbre de composants cyclique ou partagé.';
      parents.add(child);
    }
  }
  const visiting = new Set(), visited = new Set();
  function valid(id, depth = 0) {
    if (visiting.has(id) || depth > 50) return false;
    if (visited.has(id)) return true;
    visiting.add(id);
    if (!(nodes[id].children || []).every(child => valid(child, depth + 1))) return false;
    visiting.delete(id); visited.add(id); return true;
  }
  return valid(tree.root) && Object.keys(nodes).every(id => valid(id)) ? null : 'Cycle ou profondeur excessive de composants.';
}
