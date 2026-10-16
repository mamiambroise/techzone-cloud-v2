import { UI_COMPONENT_REGISTRY } from './ui-component-registry';

export interface UiIssue { level: 'ERROR' | 'WARNING' | 'INFO'; code: string; message: string; componentId?: string }
export const isRecord = (value: unknown): value is Record<string, any> => !!value && typeof value === 'object' && !Array.isArray(value);

/** Internal route templates, never browser protocol-relative URLs or escaped paths. */
export function isUiRoute(value: unknown): value is string {
  return typeof value === 'string' && value.length <= 200 && /^\/(?:[a-zA-Z0-9_:{\}-]+(?:\/[a-zA-Z0-9_:{\}-]+)*)?$/.test(value)
    && !/^\/(api|auth|login|logout)(\/|$)/i.test(value);
}

export function isUiUrl(value: unknown, image = false): boolean {
  if (typeof value !== 'string' || /[\s\\\u0000-\u001f]/.test(value)) return false;
  if (!image && isUiRoute(value)) return true;
  try { const url = new URL(value); return url.protocol === 'https:' && !!url.hostname && !url.username && !url.password; }
  catch { return false; }
}

/** JSON stays declarative; text containing markup is safe as React text. */
export function unsafeUiJson(value: unknown, depth = 0): boolean {
  if (depth > 50) return true;
  if (typeof value === 'function' || typeof value === 'symbol') return true;
  if (!value || typeof value !== 'object') return false;
  return Object.entries(value).some(([key, child]) => /^(?:__proto__|prototype|constructor|dangerouslySetInnerHTML|innerHTML|srcDoc|on[A-Z].*)$/.test(key)
    || /^on(?:click|load|error|submit|change|mouseover|focus)$/i.test(key) || unsafeUiJson(child, depth + 1));
}

/** Structural validation before any recursive renderer or binding traversal. */
export function validateUiTree(value: unknown): UiIssue[] {
  const issues: UiIssue[] = [];
  const error = (code: string, message: string, componentId?: string) => issues.push({ level: 'ERROR', code, message, ...(componentId ? { componentId } : {}) });
  if (!isRecord(value) || typeof value.root !== 'string' || !isRecord(value.nodes)) {
    error('COMPONENT_SCHEMA_INVALID', 'Arbre de composants invalide.'); return issues;
  }
  const nodes = value.nodes;
  if (!Object.hasOwn(nodes, value.root)) error('ROOT_MISSING', 'Racine manquante dans l’arbre.');
  if (Object.keys(nodes).length > 1000) { error('COMPONENT_SCHEMA_INVALID', 'Maximum de 1000 composants dépassé.'); return issues; }
  if (unsafeUiJson(value)) error('COMPONENT_SCHEMA_INVALID', 'Propriété exécutable ou profondeur JSON non autorisée.');
  const parents = new Map<string, number>();
  for (const [id, node] of Object.entries(nodes)) {
    if (!isRecord(node) || node.id !== id || typeof node.type !== 'string') { error('COMPONENT_SCHEMA_INVALID', 'Identité de composant invalide.', id); continue; }
    const def = Object.hasOwn(UI_COMPONENT_REGISTRY, node.type) ? UI_COMPONENT_REGISTRY[node.type] : undefined;
    if (!def) { error('COMPONENT_UNKNOWN', `Composant inconnu : ${node.type}.`, id); continue; }
    if (node.props !== undefined && !isRecord(node.props)) error('COMPONENT_SCHEMA_INVALID', 'Props invalides.', id);
    const props = isRecord(node.props) ? node.props : {};
    for (const [prop, rule] of Object.entries(def.propertiesSchema)) {
      const v = props[prop];
      if (v === undefined || v === null || v === '') continue; // incomplete drafts remain editable
      if ((rule.type === 'text' && typeof v !== 'string')
        || (rule.type === 'boolean' && typeof v !== 'boolean')
        || (rule.type === 'textList' && (!Array.isArray(v) || v.some(item => typeof item !== 'string')))
        || (rule.type === 'number' && (typeof v !== 'number' || !Number.isFinite(v) || (rule.min !== undefined && v < rule.min) || (rule.max !== undefined && v > rule.max)))
        || (rule.type === 'select' && !rule.options?.some(o => o.value === v))) error('COMPONENT_SCHEMA_INVALID', `Propriété invalide : ${prop}.`, id);
    }
    if (node.type === 'Link' && props.href && !isUiUrl(props.href)) error('COMPONENT_SCHEMA_INVALID', 'Cible de lien non autorisée.', id);
    if (node.type === 'Image' && props.src && !isUiUrl(props.src, true)) error('COMPONENT_SCHEMA_INVALID', 'URL d’image non autorisée.', id);
    if (node.bindings !== undefined && !isRecord(node.bindings)) error('BINDING_INVALID', 'Bindings invalides.', id);
    if (node.actions !== undefined && (!Array.isArray(node.actions) || node.actions.length > 20)) error('ACTION_INVALID', 'Liste d’actions invalide.', id);
    if (node.children !== undefined && (!Array.isArray(node.children) || node.children.some(child => typeof child !== 'string'))) error('COMPONENT_SCHEMA_INVALID', 'Liste d’enfants invalide.', id);
    for (const child of Array.isArray(node.children) ? node.children : []) {
      if (!Object.hasOwn(nodes, child)) error('REFERENCE_BROKEN', `Référence enfant cassée : ${child}.`, id);
      else {
        parents.set(child, (parents.get(child) || 0) + 1);
        if (def.allowedChildren !== '*' && !def.allowedChildren.includes(nodes[child]?.type)) error('COMPONENT_SCHEMA_INVALID', `Imbrication non autorisée : ${child}.`, id);
      }
    }
    if (node.responsive !== undefined) {
      if (!isRecord(node.responsive) || Object.entries(node.responsive).some(([device, config]) => !['DESKTOP', 'TABLET', 'MOBILE'].includes(device) || !isRecord(config) || (config.visible !== undefined && !['default', 'visible', 'hidden'].includes(config.visible)))) error('RESPONSIVE_INVALID', 'Configuration responsive invalide.', id);
    }
  }
  if ([...parents.values()].some(count => count > 1) || parents.has(value.root)) error('COMPONENT_SCHEMA_INVALID', 'Un composant ne peut avoir plusieurs parents ni contenir la racine.');
  const visiting = new Set<string>(), visited = new Set<string>();
  const visit = (id: string, depth: number) => {
    if (visiting.has(id) || depth > 50) { error('COMPONENT_SCHEMA_INVALID', 'Cycle ou profondeur excessive de composants.', id); return; }
    if (visited.has(id) || !isRecord(nodes[id])) return;
    visiting.add(id);
    for (const child of Array.isArray(nodes[id].children) ? nodes[id].children : []) visit(child, depth + 1);
    visiting.delete(id); visited.add(id);
  };
  // Check disconnected nodes too: editor operations can otherwise recurse on them.
  visit(value.root, 0);
  for (const id of Object.keys(nodes)) visit(id, 0);
  return issues;
}

export function validateUiTheme(value: unknown): UiIssue[] {
  const invalid = () => [{ level: 'ERROR' as const, code: 'UI_THEME_INVALID', message: 'Design tokens invalides ou non gouvernés.' }];
  if (!isRecord(value) || unsafeUiJson(value)) return invalid();
  const groups = ['colors', 'typography', 'spacing', 'radius', 'shadow', 'breakpoints'];
  for (const [group, tokens] of Object.entries(value)) {
    if (!groups.includes(group) || !isRecord(tokens)) return invalid();
    for (const [key, token] of Object.entries(tokens)) {
      if (group === 'colors' && (typeof token !== 'string' || !/^#[a-f0-9]{3}(?:[a-f0-9]{3})?$/i.test(token))) return invalid();
      if (['spacing', 'radius', 'breakpoints'].includes(group) && (typeof token !== 'number' || !Number.isFinite(token) || token < 0 || token > 10000)) return invalid();
      if (group === 'typography' && (key === 'baseSize' ? typeof token !== 'number' || token < 8 || token > 72 : typeof token !== 'string' || /[;{}<>]/.test(token))) return invalid();
      if (group === 'shadow' && (typeof token !== 'string' || /url\s*\(|expression\s*\(|[;{}<>]/i.test(token))) return invalid();
    }
  }
  const bp = value.breakpoints;
  if (bp?.mobile !== undefined && bp?.tablet !== undefined && bp.mobile >= bp.tablet) return invalid();
  return [];
}
