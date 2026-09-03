const existing = (id, label, path, view, description = '') => ({ id, label, path, view, status: 'AVAILABLE', description });
const partial = (id, label, path, view, description = '') => ({ id, label, path, view, status: 'PARTIAL', description });
const comingSoon = (id, label, path, description = '') => ({ id, label, path, status: 'COMING_SOON', description });

const moduleItems = (moduleId, basePath, labels, overrides = {}) => labels.map(([key, label]) => {
  const item = overrides[key];
  if (item) return item;
  return comingSoon(`${moduleId}.${key}`, label, `${basePath}/${key}`);
});

export const navigationConfig = [
  { id: 'dashboard', label: 'Dashboard', path: '/dashboard', view: 'overview', status: 'PARTIAL', standalone: true },
  {
    id: 'platform', label: 'PLATEFORME', children: [
      { id: 'platform.foundation', label: 'Platform Foundation', children: [
        existing('platform.foundation.overview', 'Vue d’ensemble', '/platform-foundation', 'overview'),
        existing('platform.foundation.apps', 'Applications & Versions', '/platform-foundation/applications', 'applications'),
        ...moduleItems('platform.foundation', '/platform-foundation', [['environments', 'Environnements'], ['contracts', 'Contrats'], ['configuration', 'Configuration'], ['snapshots', 'Snapshots & Historique']], {
          contracts: partial('platform.foundation.contracts', 'Contrats', '/platform-foundation/contracts', 'integrations'),
          configuration: partial('platform.foundation.configuration', 'Configuration', '/platform-foundation/configuration', 'configuration'),
          snapshots: partial('platform.foundation.snapshots', 'Snapshots & Historique', '/platform-foundation/snapshots', 'audit'),
        }),
      ]},
      { id: 'platform.iam', label: 'Auth + IAM + Context', children: [
        partial('platform.iam.overview', 'Vue d’ensemble', '/auth-iam', 'iam-overview'),
        partial('platform.iam.users', 'Utilisateurs & Identités', '/auth-iam/users', 'iam-users'),
        ...moduleItems('platform.iam', '/auth-iam', [['tenants', 'Organisations & Tenants'], ['roles', 'Rôles & Permissions'], ['policies', 'Accès & Policies'], ['sessions', 'Sessions & Sécurité'], ['contexts', 'Contextes']], {
          tenants: comingSoon('platform.iam.tenants', 'Organisations & Tenants', '/auth-iam/tenants'),
          roles: partial('platform.iam.roles', 'Rôles & Permissions', '/auth-iam/roles', 'iam-roles'),
        }),
      ]},
      { id: 'platform.billing', label: 'Tenant, Subscription & Billing', children: moduleItems('platform.billing', '/billing', [['overview', 'Vue d’ensemble'], ['tenants', 'Tenants'], ['plans', 'Plans & Offres'], ['subscriptions', 'Abonnements'], ['invoices', 'Facturation'], ['payments', 'Paiements'], ['quotas', 'Quotas & Limites'], ['usage', 'Usage / Metering'], ['history', 'Historique']]) },
      { id: 'platform.observability', label: 'Observability & Security', children: [
        partial('platform.observability.overview', 'Vue d’ensemble', '/observability', 'audit'),
        partial('platform.observability.audit', 'Audit', '/observability/audit', 'audit'),
        ...moduleItems('platform.observability', '/observability', [['logs', 'Logs'], ['security-events', 'Événements de sécurité'], ['monitoring', 'Monitoring'], ['alerts', 'Alertes'], ['health', 'Health'], ['diagnostics', 'Diagnostics']], {
          logs: partial('platform.observability.logs', 'Logs', '/observability/logs', 'audit'),
          health: partial('platform.observability.health', 'Health', '/observability/health', 'iam-overview'),
          diagnostics: partial('platform.observability.diagnostics', 'Diagnostics', '/observability/diagnostics', 'e2e-bench'),
        }),
      ]},
    ],
  },
  {
    id: 'design', label: 'CONCEPTION', children: [
      { id: 'design.bm', label: 'Business Manager', children: [
        existing('business-manager.overview', 'Vue d’ensemble', '/business-manager', 'overview'),
        existing('business-manager.applications', 'Applications', '/business-manager/applications', 'applications'),
        partial('business-manager.versions', 'Versions & Lifecycle', '/business-manager/versions', 'versions'),
        partial('business-manager.data-model', 'Data Model', '/business-manager/data-model', 'data-model'),
        partial('business-manager.features', 'Features & Capabilities', '/business-manager/features', 'features'),
        partial('business-manager.menus', 'Menus & Navigation', '/business-manager/menus', 'menus'),
        partial('business-manager.configuration', 'Configuration & Metadata', '/business-manager/configuration', 'configuration'),
        existing('business-manager.contracts', 'Contracts & Runtime Bridge', '/business-manager/contracts', 'integrations'),
        partial('business-manager.validation', 'Validation & Quality', '/business-manager/validation', 'validation'),
      ]},
      { id: 'design.pm', label: 'Pack Manager', children: [
        existing('pack-manager.overview', 'Vue d’ensemble', '/pack-manager', 'pack-overview'),
        partial('pack-manager.packs', 'Packs', '/pack-manager/packs', 'packs'),
        partial('pack-manager.versions', 'Versions de packs', '/pack-manager/versions', 'pack-versions'),
        partial('pack-manager.modules', 'Modules', '/pack-manager/modules', 'pack-modules'),
        partial('pack-manager.features', 'Features & Capabilities', '/pack-manager/features', 'pack-modules'),
        partial('pack-manager.dependencies', 'Dépendances', '/pack-manager/dependencies', 'pack-dependencies'),
        partial('pack-manager.rules', 'Règles & Conditions', '/pack-manager/rules', 'pack-rules'),
        partial('pack-manager.validation', 'Validation', '/pack-manager/validation', 'pack-versions'),
        partial('pack-manager.publication', 'Publication', '/pack-manager/publication', 'pack-versions'),
        existing('pack-manager.manifest', 'Manifest', '/pack-manager/manifest', 'pack-versions'),
      ]},
    ],
  },
  {
    id: 'runtime', label: 'ERP & RUNTIME', children: [
      { id: 'runtime.erp', label: 'ERP Adapter', children: moduleItems('runtime.erp', '/erp-adapter', [['overview', 'Vue d’ensemble'], ['analysis', 'Analyse & Adaptation'], ['capabilities', 'Capacités ERP'], ['mappings', 'Mappings'], ['extensions', 'Extensions'], ['compatibility', 'Compatibilité'], ['reports', 'Rapports d’analyse']]) },
      { id: 'runtime.pr', label: 'Pack Runtime', children: [
        existing('pack-runtime.overview', 'Vue d’ensemble', '/pack-runtime', 'pack-runtime'),
        partial('pack-runtime.context', 'Runtime Context', '/pack-runtime/context', 'pack-runtime'),
        existing('pack-runtime.resolver', 'Resolver', '/pack-runtime/resolver', 'pack-runtime'),
        existing('pack-runtime.manifest', 'Effective Manifest', '/pack-runtime/effective-manifest', 'pack-runtime'),
        partial('pack-runtime.status', 'Runtime Status', '/pack-runtime/status', 'pack-runtime'),
        partial('pack-runtime.cache', 'Cache & Résilience', '/pack-runtime/cache', 'pack-runtime'),
        partial('pack-runtime.diagnostics', 'Diagnostics', '/pack-runtime/diagnostics', 'pack-runtime'),
        partial('pack-runtime.api', 'API Runtime', '/pack-runtime/api', 'pack-runtime'),
      ]},
    ],
  },
  { id: 'experience', label: 'UI & EXPERIENCE', children: [{ id: 'experience.ui', label: 'UI Builder / Experience Engine', children: moduleItems('experience.ui', '/ui-builder', [['overview', 'Vue d’ensemble'], ['pages', 'Page & UI Builder'], ['layouts', 'Layouts'], ['components', 'Components Registry'], ['menu-engine', 'Menu Engine'], ['forms', 'Form Engine'], ['dashboards', 'Dashboard Engine'], ['themes', 'Themes'], ['templates', 'Templates UI'], ['data-binding', 'Data Binding'], ['actions', 'Actions UI']], { 'menu-engine': existing('ui-builder.menu-engine', 'Menu Engine', '/ui-builder/menu-engine', 'menus') }) }] },
  { id: 'data', label: 'DATA & LOGIC', children: [
    { id: 'data.model', label: 'Data Model Manager', children: moduleItems('data.model', '/data-model', [['overview', 'Vue d’ensemble'], ['entities', 'Entités'], ['fields', 'Champs'], ['relations', 'Relations'], ['metadata', 'Métadonnées'], ['schemas', 'Schémas'], ['validations', 'Validations'], ['migrations', 'Migrations / Versions']], { overview: partial('data-model.overview', 'Vue d’ensemble', '/data-model', 'data-model'), entities: partial('data-model.entities', 'Entités', '/data-model/entities', 'data-model'), fields: partial('data-model.fields', 'Champs', '/data-model/fields', 'data-model'), metadata: partial('data-model.metadata', 'Métadonnées', '/data-model/metadata', 'configuration'), schemas: partial('data-model.schemas', 'Schémas', '/data-model/schemas', 'data-model'), validations: partial('data-model.validations', 'Validations', '/data-model/validations', 'data-model') }) },
    { id: 'data.query', label: 'Query Engine', children: moduleItems('data.query', '/query-engine', [['overview', 'Vue d’ensemble'], ['queries', 'Queries'], ['data-sources', 'Data Sources'], ['filters', 'Filtres'], ['aggregations', 'Agrégations'], ['saved', 'Saved Queries'], ['api', 'API Queries'], ['tests', 'Tests']]) },
    { id: 'data.features', label: 'Feature & Capability Manager', children: moduleItems('data.features', '/features', [['overview', 'Vue d’ensemble'], ['features', 'Features'], ['capabilities', 'Capabilities'], ['relations', 'Relations'], ['dependencies', 'Dépendances'], ['constraints', 'Contraintes'], ['compatibility', 'Compatibilité'], ['coverage', 'Matrice de couverture']], { overview: partial('features.overview', 'Vue d’ensemble', '/features', 'features'), features: partial('features.features', 'Features', '/features/features', 'features'), capabilities: partial('features.capabilities', 'Capabilities', '/features/capabilities', 'features'), relations: partial('features.relations', 'Relations', '/features/relations', 'features'), dependencies: partial('features.dependencies', 'Dépendances', '/features/dependencies', 'features'), constraints: partial('features.constraints', 'Contraintes', '/features/constraints', 'features'), compatibility: partial('features.compatibility', 'Compatibilité', '/features/compatibility', 'features'), coverage: partial('features.coverage', 'Matrice de couverture', '/features/coverage', 'features') }) },
  ] },
  { id: 'automation', label: 'AUTOMATION', children: [
    { id: 'automation.rules', label: 'Rules & Formula Engine', children: moduleItems('automation.rules', '/rules-engine', [['overview', 'Vue d’ensemble'], ['rules', 'Règles'], ['formulas', 'Formules'], ['conditions', 'Conditions'], ['expressions', 'Expressions'], ['validation', 'Validation'], ['simulation', 'Simulation'], ['history', 'Historique']], { overview: partial('rules-engine.overview', 'Vue d’ensemble', '/rules-engine', 'pack-rules'), rules: partial('rules-engine.rules', 'Règles', '/rules-engine/rules', 'pack-rules'), conditions: partial('rules-engine.conditions', 'Conditions', '/rules-engine/conditions', 'pack-rules'), validation: partial('rules-engine.validation', 'Validation', '/rules-engine/validation', 'pack-rules'), history: partial('rules-engine.history', 'Historique', '/rules-engine/history', 'audit') }) },
    { id: 'automation.workflow', label: 'Workflow Engine', children: moduleItems('automation.workflow', '/workflows', [['overview', 'Vue d’ensemble'], ['workflows', 'Workflows'], ['steps', 'Étapes'], ['transitions', 'Transitions'], ['conditions', 'Conditions'], ['actions', 'Actions'], ['runs', 'Exécutions'], ['history', 'Historique']]) },
    { id: 'automation.approval', label: 'Approval Engine', children: moduleItems('automation.approval', '/approvals', [['overview', 'Vue d’ensemble'], ['flows', 'Circuits d’approbation'], ['levels', 'Niveaux'], ['approvers', 'Approbateurs'], ['conditions', 'Conditions'], ['requests', 'Demandes'], ['history', 'Historique']], { overview: partial('approvals.overview', 'Vue d’ensemble', '/approvals', 'validation'), history: partial('approvals.history', 'Historique', '/approvals/history', 'audit') }) },
    { id: 'automation.engine', label: 'Automation Engine', children: moduleItems('automation.engine', '/automation', [['overview', 'Vue d’ensemble'], ['automations', 'Automations'], ['triggers', 'Triggers'], ['actions', 'Actions'], ['schedules', 'Schedules'], ['conditions', 'Conditions'], ['runs', 'Exécutions'], ['history', 'Historique']]) },
  ] },
  { id: 'communication', label: 'COMMUNICATION & DOCUMENTS', children: [{ id: 'communication.notifications', label: 'Notification Manager', children: moduleItems('communication.notifications', '/notifications', [['overview', 'Vue d’ensemble'], ['notifications', 'Notifications'], ['templates', 'Templates'], ['channels', 'Canaux'], ['email', 'Email'], ['sms', 'SMS'], ['push', 'Push'], ['in-app', 'In-App'], ['rules', 'Règles d’envoi'], ['history', 'Historique']]) }, { id: 'communication.reports', label: 'Report & Document Builder', children: moduleItems('communication.reports', '/reports', [['overview', 'Vue d’ensemble'], ['reports', 'Rapports'], ['documents', 'Documents'], ['templates', 'Templates'], ['data-sources', 'Sources de données'], ['pdf', 'Génération PDF'], ['exports', 'Exports'], ['history', 'Historique']]) }] },
  { id: 'extensions', label: 'EXTENSIONS & DEVELOPER PLATFORM', children: [{ id: 'extensions.manager', label: 'Extension & Template Manager', children: moduleItems('extensions.manager', '/extensions', [['overview', 'Vue d’ensemble'], ['extensions', 'Extensions'], ['plugins', 'Plugins'], ['templates', 'Templates'], ['versions', 'Versions'], ['dependencies', 'Dépendances'], ['installations', 'Installation'], ['publication', 'Publication']]) }, { id: 'extensions.integrations', label: 'Integrations', children: moduleItems('extensions.integrations', '/integrations', [['overview', 'Vue d’ensemble'], ['connectors', 'Connecteurs'], ['api', 'API'], ['webhooks', 'Webhooks'], ['credentials', 'Credentials'], ['sync', 'Synchronisations'], ['mapping', 'Mapping'], ['logs', 'Logs d’intégration']], { overview: existing('integrations.overview', 'Vue d’ensemble', '/integrations', 'integrations'), connectors: partial('integrations.connectors', 'Connecteurs', '/integrations/connectors', 'integrations'), mapping: partial('integrations.mapping', 'Mapping', '/integrations/mapping', 'integrations') }) }, { id: 'extensions.developer', label: 'Developer Platform', children: moduleItems('extensions.developer', '/developer-platform', [['overview', 'Vue d’ensemble'], ['api-explorer', 'API Explorer'], ['sdk', 'SDK'], ['apps', 'Developer Apps'], ['api-keys', 'API Keys'], ['webhooks', 'Webhooks'], ['sandbox', 'Sandbox'], ['docs', 'Documentation'], ['tests', 'Tests']]) }, { id: 'extensions.marketplace', label: 'Marketplace', children: moduleItems('extensions.marketplace', '/marketplace', [['overview', 'Vue d’ensemble'], ['packs', 'Packs'], ['extensions', 'Extensions'], ['templates', 'Templates'], ['versions', 'Versions'], ['publication', 'Publication'], ['certification', 'Validation / Certification'], ['installations', 'Installations']]) }] },
  { id: 'delivery', label: 'VERSIONING & DELIVERY', children: [{ id: 'delivery.versioning', label: 'Version & Sandbox Manager', children: moduleItems('delivery.versioning', '/versioning', [['overview', 'Vue d’ensemble'], ['versions', 'Versions'], ['drafts', 'Drafts'], ['sandboxes', 'Sandboxes'], ['compare', 'Comparaisons'], ['validation', 'Validation'], ['promotion', 'Promotion'], ['history', 'Historique']], { versions: existing('versioning.versions', 'Versions', '/versioning/versions', 'versions'), validation: partial('versioning.validation', 'Validation', '/versioning/validation', 'validation') }) }, { id: 'delivery.publication', label: 'Publication & Rollback Manager', children: moduleItems('delivery.publication', '/delivery', [['overview', 'Vue d’ensemble'], ['publications', 'Publications'], ['releases', 'Releases'], ['deployments', 'Déploiements'], ['environments', 'Environnements'], ['validation', 'Validation'], ['rollback', 'Rollback'], ['history', 'Historique']], { validation: partial('delivery.validation', 'Validation', '/delivery/validation', 'validation'), rollback: partial('delivery.rollback', 'Rollback', '/delivery/rollback', 'packs') }) }] },
  { id: 'administration', label: 'ADMINISTRATION', children: [{ id: 'administration.platform', label: 'Platform Administration', children: moduleItems('administration.platform', '/administration', [['overview', 'Vue d’ensemble'], ['platform-settings', 'Paramètres plateforme'], ['organizations', 'Organisations'], ['tenants', 'Tenants'], ['users', 'Utilisateurs'], ['roles', 'Rôles & Permissions'], ['feature-flags', 'Feature Flags'], ['system-settings', 'Paramètres système'], ['maintenance', 'Maintenance'], ['jobs', 'Jobs'], ['backups', 'Sauvegardes'], ['diagnostics', 'Diagnostics']], { overview: partial('administration.overview', 'Vue d’ensemble', '/administration', 'iam-overview'), 'platform-settings': partial('administration.settings', 'Paramètres plateforme', '/administration/platform-settings', 'configuration'), users: partial('administration.users', 'Utilisateurs', '/administration/users', 'iam-users'), roles: partial('administration.roles', 'Rôles & Permissions', '/administration/roles', 'iam-roles'), diagnostics: partial('administration.diagnostics', 'Diagnostics', '/administration/diagnostics', 'e2e-bench') }) }] },
];

export function flattenNavigation(items = navigationConfig, result = []) {
  items.forEach((item) => {
    if (item.path) result.push(item);
    if (item.children) flattenNavigation(item.children, result);
  });
  return result;
}

export function findNavigationItem(path) {
  return flattenNavigation().find((item) => item.path === path);
}

export function findNavigationAncestors(path, items = navigationConfig, ancestors = []) {
  for (const item of items) {
    if (item.path === path) return ancestors;
    if (item.children) {
      const result = findNavigationAncestors(path, item.children, [...ancestors, item.id]);
      if (result) return result;
    }
  }
  return null;
}
