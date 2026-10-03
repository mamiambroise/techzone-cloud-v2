export const IS_PUBLIC_KEY = 'isPublic';
export const PRINCIPAL_KEY = 'iamPrincipal';
export const IAM_CONTEXT_CLIENT_KEY = 'iamContextClient';
export const IAM_PERMISSIONS_KEY = 'iam_permissions';

export const IAM_ISSUER = 'techzone-cloud-iam';

export const IDLE_TIMEOUT_MS = 30 * 60 * 1000;
export const ABSOLUTE_TIMEOUT_MS = 12 * 60 * 60 * 1000;
export const JWT_ACCESS_TTL = process.env.ACCESS_TOKEN_TTL || '15m';
export const REFRESH_TTL_MS = 7 * 24 * 60 * 60 * 1000;

export const ROLES = {
  ADMIN: 'admin',
  USER: 'user',
} as const;

export const PERMISSIONS = {
  PACK_CAPABILITY_UPDATE: 'pack.capability.update',
  PACK_CREATE: 'pack.create',
  PACK_READ: 'pack.read',
  PACK_VERSION_CREATE: 'pack.version.create',
  PACK_VERSION_READ: 'pack.version.read',
  PACK_UPDATE: 'pack.update',
  PACK_ARCHIVE: 'pack.archive',
  PACK_RESTORE: 'pack.restore',
  PACK_VERSION_UPDATE: 'pack.version.update',
  PACK_MODULE_READ: 'pack.module.read',
  PACK_MODULE_CREATE: 'pack.module.create',
  PACK_FEATURE_READ: 'pack.feature.read',
  PACK_FEATURE_CREATE: 'pack.feature.create',
  PACK_CAPABILITY_READ: 'pack.capability.read',
  PACK_CAPABILITY_CREATE: 'pack.capability.create',
  PACK_CAPABILITY_ATTACH: 'pack.capability.attach',
  PACK_DEPENDENCY_READ: 'pack.dependency.read',
  PACK_DEPENDENCY_CREATE: 'pack.dependency.create',
  PACK_RULE_READ: 'pack.rule.read',
  PACK_RULE_CREATE: 'pack.rule.create',
  PACK_VERSION_VALIDATE: 'pack.version.validate',
  PACK_VERSION_GENERATE_MANIFEST: 'pack.version.generate.manifest',
  PACK_VERSION_PUBLISH: 'pack.version.publish',
  RUNTIME_EFFECTIVE_MANIFEST_READ: 'runtime.effective.manifest.read',
  RUNTIME_RESOLVE: 'runtime.resolve',
  RUNTIME_CACHE_READ: 'runtime.cache.read',
  RUNTIME_CACHE_INVALIDATE: 'runtime.cache.invalidate',
  RUNTIME_PROVIDER_READ: 'runtime.provider.read',
  RUNTIME_PROVIDER_PROBE: 'runtime.provider.probe',
  RUNTIME_RESILIENCE_READ: 'runtime.resilience.read',
  RUNTIME_DIAGNOSTIC_READ: 'runtime.diagnostic.read',
  RUNTIME_DIAGNOSTIC_EXPORT: 'runtime.diagnostic.export',
  RUNTIME_RESOLUTION_RERESOLVE: 'runtime.resolution.reresolve',
  RUNTIME_RESOLUTION_READ: 'runtime.resolution.read',
  ERP_READ: 'erp:read',
  ERP_WRITE: 'erp:write',
  // Integration Hub / API & Intégrations.
  // Le catalogue d'intégration (connecteurs, définitions d'API, webhooks,
  // credentials, synchronisations) est une ressource de PLATEFORME : il ne
  // porte pas de tenantId et son frontière de sécurité est donc la permission,
  // pas le tenant. Les journaux d'intégration (IntegrationLog) sont, eux,
  // tenant-scoped et filtrés côté service sur le principal.
  INTEGRATION_READ: 'integration:read',
  INTEGRATION_WRITE: 'integration:write',
  INTEGRATION_EXECUTE: 'integration:execute',
  INTEGRATION_CREDENTIAL_READ: 'integration:credential:read',
  INTEGRATION_CREDENTIAL_WRITE: 'integration:credential:write',
  INTEGRATION_DIAGNOSTIC_READ: 'integration:diagnostic:read',
  AUTOMATION_READ: 'automation:read',
  AUTOMATION_EXECUTE: 'automation:execute',
  DATA_RUNTIME_READ: 'data-runtime:read',
  DATA_RUNTIME_QUERY: 'data-runtime:query',
  DATA_RUNTIME_EXECUTE: 'data-runtime:execute',
  IAM_ADMIN: 'iam:admin',
  CONFIG_READ: 'config:read',
  // UI Builder: page composition remains tenant-scoped and is protected by
  // explicit capabilities. A UI definition is not a public application API.
  UI_BUILDER_READ: 'ui-builder:read',
  UI_BUILDER_WRITE: 'ui-builder:write',
  UI_BUILDER_VALIDATE: 'ui-builder:validate',
  // Subscription & Billing (CDC 15).
  //
  // Ces permissions autorisent un ACTEUR à agir sur la surface Billing.
  // Elles ne sont PAS des entitlements : un entitlement répond « le Tenant a-t-il
  // acheté ce droit commercial ? », une permission répond « cet utilisateur
  // est-il autorisé à le faire ? » (CDC 5 / RG-BILL-002 / RG-BILL-004).
  // Billing n'est donc jamais l'autorite IAM et aucun role Billing n'est cree
  // ici : seules des permissions rejoignent le registre existant (CDC 81).
  BILLING_READ: 'billing:read',
  BILLING_MANAGE: 'billing:manage',
  BILLING_PLAN_READ: 'billing:plan:read',
  BILLING_PLAN_MANAGE: 'billing:plan:manage',
  BILLING_SUBSCRIPTION_READ: 'billing:subscription:read',
  BILLING_SUBSCRIPTION_MANAGE: 'billing:subscription:manage',
  BILLING_INVOICE_READ: 'billing:invoice:read',
  BILLING_INVOICE_MANAGE: 'billing:invoice:manage',
  BILLING_PAYMENT_READ: 'billing:payment:read',
  BILLING_PAYMENT_RECORD: 'billing:payment:record',
  BILLING_PAYMENT_REFUND: 'billing:payment:refund',
  BILLING_USAGE_READ: 'billing:usage:read',
  BILLING_OVERRIDE_MANAGE: 'billing:override:manage',
  BILLING_DIAGNOSTIC_READ: 'billing:diagnostic:read',
} as const;

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

export const ERP_READ = PERMISSIONS.ERP_READ;
export const ERP_WRITE = PERMISSIONS.ERP_WRITE;
export const INTEGRATION_READ = PERMISSIONS.INTEGRATION_READ;
export const INTEGRATION_WRITE = PERMISSIONS.INTEGRATION_WRITE;
export const INTEGRATION_EXECUTE = PERMISSIONS.INTEGRATION_EXECUTE;
export const INTEGRATION_CREDENTIAL_READ = PERMISSIONS.INTEGRATION_CREDENTIAL_READ;
export const INTEGRATION_CREDENTIAL_WRITE = PERMISSIONS.INTEGRATION_CREDENTIAL_WRITE;
export const INTEGRATION_DIAGNOSTIC_READ = PERMISSIONS.INTEGRATION_DIAGNOSTIC_READ;
export const AUTOMATION_READ = PERMISSIONS.AUTOMATION_READ;
export const AUTOMATION_EXECUTE = PERMISSIONS.AUTOMATION_EXECUTE;
export const DATA_RUNTIME_READ = PERMISSIONS.DATA_RUNTIME_READ;
export const DATA_RUNTIME_QUERY = PERMISSIONS.DATA_RUNTIME_QUERY;
export const DATA_RUNTIME_EXECUTE = PERMISSIONS.DATA_RUNTIME_EXECUTE;
export const IAM_ADMIN = PERMISSIONS.IAM_ADMIN;
export const CONFIG_READ = PERMISSIONS.CONFIG_READ;
export const UI_BUILDER_READ = PERMISSIONS.UI_BUILDER_READ;
export const UI_BUILDER_WRITE = PERMISSIONS.UI_BUILDER_WRITE;
export const UI_BUILDER_VALIDATE = PERMISSIONS.UI_BUILDER_VALIDATE;
export const BILLING_READ = PERMISSIONS.BILLING_READ;
export const BILLING_MANAGE = PERMISSIONS.BILLING_MANAGE;
export const BILLING_PLAN_READ = PERMISSIONS.BILLING_PLAN_READ;
export const BILLING_PLAN_MANAGE = PERMISSIONS.BILLING_PLAN_MANAGE;
export const BILLING_SUBSCRIPTION_READ = PERMISSIONS.BILLING_SUBSCRIPTION_READ;
export const BILLING_SUBSCRIPTION_MANAGE = PERMISSIONS.BILLING_SUBSCRIPTION_MANAGE;
export const BILLING_INVOICE_READ = PERMISSIONS.BILLING_INVOICE_READ;
export const BILLING_INVOICE_MANAGE = PERMISSIONS.BILLING_INVOICE_MANAGE;
export const BILLING_PAYMENT_READ = PERMISSIONS.BILLING_PAYMENT_READ;
export const BILLING_PAYMENT_RECORD = PERMISSIONS.BILLING_PAYMENT_RECORD;
export const BILLING_PAYMENT_REFUND = PERMISSIONS.BILLING_PAYMENT_REFUND;
export const BILLING_USAGE_READ = PERMISSIONS.BILLING_USAGE_READ;
export const BILLING_OVERRIDE_MANAGE = PERMISSIONS.BILLING_OVERRIDE_MANAGE;
export const BILLING_DIAGNOSTIC_READ = PERMISSIONS.BILLING_DIAGNOSTIC_READ;

export const ROLE_PERMISSIONS: Record<string, string[]> = {
  [ROLES.ADMIN]: Object.values(PERMISSIONS),
  [ROLES.USER]: [
    PERMISSIONS.ERP_READ,
    PERMISSIONS.AUTOMATION_READ,
    PERMISSIONS.DATA_RUNTIME_READ,
    PERMISSIONS.DATA_RUNTIME_QUERY,
    PERMISSIONS.CONFIG_READ,
    PERMISSIONS.UI_BUILDER_READ,
    // Lecture seule du catalogue d'intégration : le rôle standard pouvait déjà
    // consulter cette surface (elle était filtrée par `erp:read`). On conserve
    // exactement cette visibilité, mais en lecture seule côté API : toute
    // mutation exige désormais une permission d'écriture réservée à l'admin.
    // `integration:diagnostic:read` est également accordé car l'onglet
    // Diagnostics était visible pour ce rôle, et les journaux sont déjà bornés
    // à son propre tenant. Les références de secrets (credential:*) restent
    // réservées à l'admin.
    PERMISSIONS.INTEGRATION_READ,
    PERMISSIONS.INTEGRATION_DIAGNOSTIC_READ,
    // Billing : consultation de son propre abonnement, de ses factures, de ses
    // paiements et de sa consommation. Aucune permission d'écriture n'est
    // accordée ici — `billing:manage`, `billing:payment:record`,
    // `billing:override:manage` et `billing:plan:manage` restent réservées à
    // l'admin (CDC 23 : valider un paiement manuel exige une permission
    // explicite).
    PERMISSIONS.BILLING_READ,
    PERMISSIONS.BILLING_PLAN_READ,
    PERMISSIONS.BILLING_SUBSCRIPTION_READ,
    PERMISSIONS.BILLING_INVOICE_READ,
    PERMISSIONS.BILLING_PAYMENT_READ,
    PERMISSIONS.BILLING_USAGE_READ,
  ],
};

export const ALL_ROLES = Object.values(ROLES);
export const ALL_PERMISSIONS = Object.values(PERMISSIONS);

export const COOKIE_ACCESS_TOKEN = 'iam_access_token';
export const COOKIE_REFRESH_TOKEN = 'iam_refresh_token';
export const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/',
  maxAge: 7 * 24 * 60 * 60 * 1000,
};
