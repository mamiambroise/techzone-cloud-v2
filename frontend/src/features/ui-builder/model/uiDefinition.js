/**
 * UI Builder — modèle UI Definition (UI-BUILDER CDC V1 §4).
 *
 * Contrat partagé builder ↔ preview ↔ runtime :
 *   { schemaVersion, applicationId, applicationVersionId, theme, navigation, pages[], metadata }
 * Page : { id, key, route, title, type, layout, visibility, order, permissions, components, metadata }
 * Composant (node) : { id, type, props, bindings, actions, children[], responsive }
 *
 * Les bindings/actions respectent les allowlists backend (dto/ui-page.dto.ts) :
 *   BINDING_KINDS / ACTION_TYPES.
 */

export const UI_DEFINITION_SCHEMA_VERSION = '1.0';

export const BINDING_KINDS = ['STATIC', 'ENTITY_FIELD', 'ENTITY_LIST', 'CONTEXT', 'VARIABLE'];
export const CONTEXT_KEYS = ['currentUser', 'currentTenant', 'currentApplication'];
export const ACTION_TYPES = [
  'NAVIGATE',
  'REFRESH_DATA',
  'SET_VARIABLE',
  'SHOW_NOTIFICATION',
  'OPEN_MODAL',
  'OPEN_DRAWER',
  'CLOSE_MODAL',
  'TRIGGER_AUTOMATION',
  'CREATE_RECORD',
  'UPDATE_RECORD',
  'DELETE_RECORD',
];

export const PAGE_TYPES = ['LIST', 'DETAIL', 'FORM', 'DASHBOARD', 'CUSTOM'];
export const PAGE_LAYOUTS = ['SIDEBAR', 'FULL_WIDTH', 'CENTERED'];
export const PAGE_VISIBILITIES = ['ALWAYS', 'TENANT_ADMIN_ONLY', 'HIDDEN'];
export const DEVICE_KINDS = ['DESKTOP', 'TABLET', 'MOBILE'];

export const DEVICE_WIDTHS = {
  DESKTOP: 1180,
  TABLET: 834,
  MOBILE: 420,
};

/** Nœud par défaut d'une nouvelle page : un Container racine vide. */
export function createDefaultTree() {
  return {
    root: 'root',
    nodes: {
      root: { id: 'root', type: 'Container', props: { padding: 'md', gap: 'md' }, bindings: {}, actions: [], children: [] },
    },
  };
}

/** Nouveau nœud composant (id stable côté client, uuid() backend). */
export function createNode(type, props = {}) {
  const id = `c-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
  return {
    id,
    type,
    props,
    bindings: {},
    actions: [],
    children: [],
    responsive: {},
  };
}

export function describeError(error) {
  const code = error?.code || error?.details?.code;
  if (error?.type === 'TENANT_REQUIRED' || code === 'TENANT_REQUIRED') return 'Sélectionnez un tenant actif pour utiliser le UI Builder.';
  if (error?.statusCode === 409) return error?.message || 'Conflit : la ressource existe déjà ou la version est verrouillée.';
  if (error?.statusCode === 404) return error?.message || 'Ressource introuvable.';
  if (error?.statusCode === 403) return 'Accès refusé : droit insuffisant pour cette opération.';
  return error?.message || 'Opération impossible. Vérifiez vos droits et la disponibilité du service, puis réessayez.';
}
