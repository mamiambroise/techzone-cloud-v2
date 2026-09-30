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
  AUTOMATION_READ: 'automation:read',
  AUTOMATION_EXECUTE: 'automation:execute',
  DATA_RUNTIME_READ: 'data-runtime:read',
  DATA_RUNTIME_QUERY: 'data-runtime:query',
  DATA_RUNTIME_EXECUTE: 'data-runtime:execute',
  IAM_ADMIN: 'iam:admin',
  CONFIG_READ: 'config:read',
} as const;

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

export const ERP_READ = PERMISSIONS.ERP_READ;
export const ERP_WRITE = PERMISSIONS.ERP_WRITE;
export const AUTOMATION_READ = PERMISSIONS.AUTOMATION_READ;
export const AUTOMATION_EXECUTE = PERMISSIONS.AUTOMATION_EXECUTE;
export const DATA_RUNTIME_READ = PERMISSIONS.DATA_RUNTIME_READ;
export const DATA_RUNTIME_QUERY = PERMISSIONS.DATA_RUNTIME_QUERY;
export const DATA_RUNTIME_EXECUTE = PERMISSIONS.DATA_RUNTIME_EXECUTE;
export const IAM_ADMIN = PERMISSIONS.IAM_ADMIN;
export const CONFIG_READ = PERMISSIONS.CONFIG_READ;

export const ROLE_PERMISSIONS: Record<string, string[]> = {
  [ROLES.ADMIN]: Object.values(PERMISSIONS),
  [ROLES.USER]: [
    PERMISSIONS.ERP_READ,
    PERMISSIONS.AUTOMATION_READ,
    PERMISSIONS.DATA_RUNTIME_READ,
    PERMISSIONS.DATA_RUNTIME_QUERY,
    PERMISSIONS.CONFIG_READ,
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
