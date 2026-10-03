/**
 * UI Builder — Component Registry (UI-BUILDER CDC V1 §5).
 *
 * Catalogue contrôlé : un composant n'est rendable que si le Shared Renderer
 * connaît son type. Aucun switch dispersé : l'ajout d'un composant se fait
 * ici (une entrée) — Inspector et Canvas en dérivent automatiquement.
 *
 * propertiesSchema : { [prop]: { type, label, options?, min?, max?, required? } }
 * bindingCapabilities : props bindables (ENTITY_FIELD, CONTEXT, VARIABLE…)
 * supportedActions : types d'actions autorisés sur ce composant.
 */

export const COMPONENT_CATEGORIES = [
  'LAYOUT',
  'TYPOGRAPHY',
  'INPUTS',
  'FORMS',
  'DATA_DISPLAY',
  'NAVIGATION',
  'FEEDBACK',
  'ACTIONS',
];

export const CATEGORY_LABELS = {
  LAYOUT: 'Mise en page',
  TYPOGRAPHY: 'Typographie',
  INPUTS: 'Champs de saisie',
  FORMS: 'Formulaires',
  DATA_DISPLAY: 'Affichage de données',
  NAVIGATION: 'Navigation',
  FEEDBACK: 'Feedback',
  ACTIONS: 'Actions',
};

const SPACING_OPTIONS = [
  { value: 'none', label: 'Aucun' },
  { value: 'sm', label: 'Petit' },
  { value: 'md', label: 'Moyen' },
  { value: 'lg', label: 'Large' },
];

const ALIGN_OPTIONS = [
  { value: 'start', label: 'Début' },
  { value: 'center', label: 'Centré' },
  { value: 'end', label: 'Fin' },
];

const components = [
  // ---------------- LAYOUT ----------------
  {
    key: 'Container', category: 'LAYOUT', label: 'Conteneur', icon: 'Box',
    description: 'Bloc de mise en page vertical.',
    allowedChildren: '*',
    propertiesSchema: {
      padding: { type: 'select', label: 'Espacement interne', options: SPACING_OPTIONS, defaultValue: 'md' },
      gap: { type: 'select', label: 'Écart entre éléments', options: SPACING_OPTIONS, defaultValue: 'md' },
      align: { type: 'select', label: 'Alignement', options: ALIGN_OPTIONS, defaultValue: 'start' },
    },
    bindingCapabilities: [],
    supportedActions: [],
  },
  {
    key: 'Section', category: 'LAYOUT', label: 'Section', icon: 'PanelTop',
    description: 'Section avec titre optionnel.',
    allowedChildren: '*',
    propertiesSchema: {
      title: { type: 'text', label: 'Titre de section' },
      padding: { type: 'select', label: 'Espacement interne', options: SPACING_OPTIONS, defaultValue: 'md' },
    },
    bindingCapabilities: ['title'],
    supportedActions: [],
  },
  {
    key: 'Card', category: 'LAYOUT', label: 'Carte', icon: 'Square',
    description: 'Carte de contenu.',
    allowedChildren: '*',
    propertiesSchema: {
      title: { type: 'text', label: 'Titre' },
      description: { type: 'text', label: 'Sous-titre' },
      padding: { type: 'select', label: 'Espacement interne', options: SPACING_OPTIONS, defaultValue: 'md' },
    },
    bindingCapabilities: ['title', 'description'],
    supportedActions: ['NAVIGATE', 'OPEN_MODAL'],
  },
  {
    key: 'Grid', category: 'LAYOUT', label: 'Grille', icon: 'Grid3X3',
    description: 'Grille de colonnes responsives.',
    allowedChildren: '*',
    propertiesSchema: {
      columns: { type: 'number', label: 'Colonnes', min: 1, max: 6, defaultValue: 2 },
      gap: { type: 'select', label: 'Écart', options: SPACING_OPTIONS, defaultValue: 'md' },
    },
    bindingCapabilities: [],
    supportedActions: [],
  },
  {
    key: 'Stack', category: 'LAYOUT', label: 'Pile horizontale', icon: 'Columns3',
    description: 'Disposition horizontale espacée.',
    allowedChildren: '*',
    propertiesSchema: {
      gap: { type: 'select', label: 'Écart', options: SPACING_OPTIONS, defaultValue: 'md' },
      align: { type: 'select', label: 'Alignement', options: ALIGN_OPTIONS, defaultValue: 'start' },
    },
    bindingCapabilities: [],
    supportedActions: [],
  },

  // ---------------- TYPOGRAPHY ----------------
  {
    key: 'Heading', category: 'TYPOGRAPHY', label: 'Titre', icon: 'Heading1',
    description: 'Titre de niveau 1 à 4.',
    allowedChildren: [],
    propertiesSchema: {
      text: { type: 'text', label: 'Texte', required: true },
      level: { type: 'select', label: 'Niveau', options: [1, 2, 3, 4].map((n) => ({ value: n, label: `H${n}` })), defaultValue: 2 },
      align: { type: 'select', label: 'Alignement', options: ALIGN_OPTIONS, defaultValue: 'start' },
    },
    bindingCapabilities: ['text'],
    supportedActions: [],
  },
  {
    key: 'Text', category: 'TYPOGRAPHY', label: 'Texte', icon: 'Type',
    description: 'Paragraphe de texte.',
    allowedChildren: [],
    propertiesSchema: {
      text: { type: 'text', label: 'Texte', required: true },
      tone: { type: 'select', label: 'Intensité', options: [
        { value: 'default', label: 'Normal' },
        { value: 'muted', label: 'Atténué' },
        { value: 'strong', label: 'Accentué' },
      ], defaultValue: 'default' },
    },
    bindingCapabilities: ['text'],
    supportedActions: [],
  },

  // ---------------- INPUTS ----------------
  {
    key: 'Input', category: 'INPUTS', label: 'Champ texte', icon: 'TextCursorInput',
    description: 'Saisie monoligne.',
    allowedChildren: [],
    propertiesSchema: {
      label: { type: 'text', label: 'Libellé' },
      placeholder: { type: 'text', label: 'Placeholder' },
      inputType: { type: 'select', label: 'Type', options: [
        { value: 'text', label: 'Texte' },
        { value: 'email', label: 'E-mail' },
        { value: 'number', label: 'Nombre' },
        { value: 'tel', label: 'Téléphone' },
        { value: 'url', label: 'URL' },
      ], defaultValue: 'text' },
      required: { type: 'boolean', label: 'Requis', defaultValue: false },
    },
    bindingCapabilities: ['value'],
    supportedActions: [],
  },
  {
    key: 'Textarea', category: 'INPUTS', label: 'Zone de texte', icon: 'AlignLeft',
    description: 'Saisie multiligne.',
    allowedChildren: [],
    propertiesSchema: {
      label: { type: 'text', label: 'Libellé' },
      placeholder: { type: 'text', label: 'Placeholder' },
      rows: { type: 'number', label: 'Lignes', min: 2, max: 12, defaultValue: 3 },
    },
    bindingCapabilities: ['value'],
    supportedActions: [],
  },
  {
    key: 'Select', category: 'INPUTS', label: 'Liste déroulante', icon: 'ChevronDownSquare',
    description: 'Sélection dans une liste.',
    allowedChildren: [],
    propertiesSchema: {
      label: { type: 'text', label: 'Libellé' },
      placeholder: { type: 'text', label: 'Option vide' },
      options: { type: 'textList', label: 'Options (une par ligne)' },
    },
    bindingCapabilities: ['value'],
    supportedActions: [],
  },
  {
    key: 'Checkbox', category: 'INPUTS', label: 'Case à cocher', icon: 'CheckSquare',
    description: 'Option booléenne.',
    allowedChildren: [],
    propertiesSchema: {
      label: { type: 'text', label: 'Libellé', required: true },
      checked: { type: 'boolean', label: 'Cochée par défaut', defaultValue: false },
    },
    bindingCapabilities: ['value'],
    supportedActions: [],
  },
  {
    key: 'DatePicker', category: 'INPUTS', label: 'Date', icon: 'Calendar',
    description: 'Sélecteur de date.',
    allowedChildren: [],
    propertiesSchema: {
      label: { type: 'text', label: 'Libellé' },
    },
    bindingCapabilities: ['value'],
    supportedActions: [],
  },

  // ---------------- FORMS ----------------
  {
    key: 'FormField', category: 'FORMS', label: 'Champ métier', icon: 'Braces',
    description: 'Champ lié à un Business Field (Business Manager).',
    allowedChildren: [],
    propertiesSchema: {
      label: { type: 'text', label: 'Libellé' },
      placeholder: { type: 'text', label: 'Placeholder' },
      required: { type: 'boolean', label: 'Requis', defaultValue: false },
      readonly: { type: 'boolean', label: 'Lecture seule', defaultValue: false },
      inputType: { type: 'select', label: 'Type de saisie', options: [
        { value: 'text', label: 'Texte' }, { value: 'email', label: 'E-mail' },
        { value: 'number', label: 'Nombre' }, { value: 'date', label: 'Date' },
      ], defaultValue: 'text' },
    },
    bindingCapabilities: ['value'],
    supportedActions: [],
  },
  {
    key: 'Form', category: 'FORMS', label: 'Formulaire', icon: 'ClipboardList',
    description: 'Regroupe des champs métier et déclenche une action.',
    allowedChildren: ['FormField', 'Input', 'Textarea', 'Select', 'Checkbox', 'DatePicker', 'Button', 'Text'],
    propertiesSchema: {
      title: { type: 'text', label: 'Titre du formulaire' },
      submitLabel: { type: 'text', label: 'Libellé du bouton', defaultValue: 'Enregistrer' },
      cancelLabel: { type: 'text', label: 'Libellé d’annulation', defaultValue: 'Annuler' },
    },
    bindingCapabilities: [],
    supportedActions: ['CREATE_RECORD', 'UPDATE_RECORD', 'DELETE_RECORD', 'TRIGGER_AUTOMATION', 'CLOSE_MODAL', 'SHOW_NOTIFICATION', 'NAVIGATE'],
  },

  // ---------------- DATA_DISPLAY ----------------
  {
    key: 'DataTable', category: 'DATA_DISPLAY', label: 'Table de données', icon: 'Table',
    description: 'Liste d’enregistrements d’une entité.',
    allowedChildren: [],
    propertiesSchema: {
      title: { type: 'text', label: 'Titre' },
      pageSize: { type: 'number', label: 'Lignes par page', min: 5, max: 100, defaultValue: 20 },
      emptyMessage: { type: 'text', label: 'Message liste vide', defaultValue: 'Aucun enregistrement' },
    },
    bindingCapabilities: ['rows'],
    supportedActions: ['NAVIGATE', 'REFRESH_DATA'],
  },
  {
    key: 'Badge', category: 'DATA_DISPLAY', label: 'Badge', icon: 'Tag',
    description: 'Étiquette courte.',
    allowedChildren: [],
    propertiesSchema: {
      text: { type: 'text', label: 'Texte', required: true },
      tone: { type: 'select', label: 'Tonalité', options: [
        { value: 'neutral', label: 'Neutre' },
        { value: 'blue', label: 'Bleu' },
        { value: 'green', label: 'Vert' },
        { value: 'amber', label: 'Ambre' },
        { value: 'rose', label: 'Rose' },
      ], defaultValue: 'neutral' },
    },
    bindingCapabilities: ['text'],
    supportedActions: [],
  },
  {
    key: 'Alert', category: 'DATA_DISPLAY', label: 'Alerte', icon: 'TriangleAlert',
    description: 'Message d’information mis en avant.',
    allowedChildren: [],
    propertiesSchema: {
      title: { type: 'text', label: 'Titre' },
      message: { type: 'text', label: 'Message', required: true },
      tone: { type: 'select', label: 'Tonalité', options: [
        { value: 'info', label: 'Info' },
        { value: 'success', label: 'Succès' },
        { value: 'warning', label: 'Attention' },
        { value: 'danger', label: 'Critique' },
      ], defaultValue: 'info' },
    },
    bindingCapabilities: ['message'],
    supportedActions: [],
  },
  {
    key: 'Image', category: 'DATA_DISPLAY', label: 'Image', icon: 'Image',
    description: 'Image avec texte alternatif.',
    allowedChildren: [],
    propertiesSchema: {
      src: { type: 'text', label: 'URL de l’image' },
      alt: { type: 'text', label: 'Texte alternatif', required: true },
      height: { type: 'number', label: 'Hauteur (px)', min: 40, max: 600, defaultValue: 160 },
    },
    bindingCapabilities: [],
    supportedActions: [],
  },
  {
    key: 'Link', category: 'DATA_DISPLAY', label: 'Lien', icon: 'Link2',
    description: 'Lien interne ou externe (https uniquement).',
    allowedChildren: [],
    propertiesSchema: {
      text: { type: 'text', label: 'Texte', required: true },
      href: { type: 'text', label: 'Cible', required: true },
    },
    bindingCapabilities: ['text'],
    supportedActions: [],
  },

  // ---------------- NAVIGATION ----------------
  {
    key: 'Tabs', category: 'NAVIGATION', label: 'Onglets', icon: 'PanelsTopLeft',
    description: 'Panneaux à onglets.',
    allowedChildren: ['Section', 'Card'],
    propertiesSchema: {
      tabs: { type: 'textList', label: 'Onglets (un par ligne)' },
    },
    bindingCapabilities: [],
    supportedActions: [],
  },

  // ---------------- FEEDBACK ----------------
  {
    key: 'Spinner', category: 'FEEDBACK', label: 'Indicateur', icon: 'Loader2',
    description: 'Chargement en cours.',
    allowedChildren: [],
    propertiesSchema: {
      label: { type: 'text', label: 'Libellé' },
    },
    bindingCapabilities: [],
    supportedActions: [],
  },

  // ---------------- ACTIONS ----------------
  {
    key: 'Button', category: 'ACTIONS', label: 'Bouton', icon: 'MousePointerClick',
    description: 'Déclenche une UI Action.',
    allowedChildren: [],
    propertiesSchema: {
      label: { type: 'text', label: 'Libellé', required: true },
      variant: { type: 'select', label: 'Style', options: [
        { value: 'primary', label: 'Principal' },
        { value: 'secondary', label: 'Secondaire' },
        { value: 'ghost', label: 'Discret' },
        { value: 'danger', label: 'Danger' },
      ], defaultValue: 'primary' },
      size: { type: 'select', label: 'Taille', options: [
        { value: 'sm', label: 'Petit' },
        { value: 'md', label: 'Moyen' },
        { value: 'lg', label: 'Large' },
      ], defaultValue: 'md' },
    },
    bindingCapabilities: [],
    supportedActions: ['NAVIGATE', 'REFRESH_DATA', 'SET_VARIABLE', 'SHOW_NOTIFICATION', 'OPEN_MODAL', 'OPEN_DRAWER', 'CLOSE_MODAL', 'TRIGGER_AUTOMATION', 'CREATE_RECORD', 'UPDATE_RECORD', 'DELETE_RECORD'],
  },
];

const byKey = new Map(components.map((c) => [c.key, c]));

/** Registry public : liste figée + accès contrôlé. */
export const componentRegistry = components.map((c) => Object.freeze({ ...c }));

export function getComponentDefinition(key) {
  return byKey.get(key) || null;
}

export function isKnownComponent(key) {
  return byKey.has(key);
}

export function componentsByCategory() {
  return COMPONENT_CATEGORIES
    .map((category) => ({
      category,
      label: CATEGORY_LABELS[category],
      items: components.filter((c) => c.category === category),
    }))
    .filter((group) => group.items.length > 0);
}

/** Défauts de props depuis le propertiesSchema (à l'ajout d'un composant). */
export function defaultProps(key) {
  const def = byKey.get(key);
  if (!def) return {};
  const props = {};
  for (const [prop, schema] of Object.entries(def.propertiesSchema)) {
    if (schema.defaultValue !== undefined) props[prop] = schema.defaultValue;
  }
  return props;
}
