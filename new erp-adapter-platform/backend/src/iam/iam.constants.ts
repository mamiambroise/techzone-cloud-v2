export const IS_PUBLIC_KEY = 'isPublic';
export const IAM_CONTEXT_CLIENT_KEY = 'iamContextClient';

export const IDLE_TIMEOUT_MS = 30 * 60 * 1000;
export const ABSOLUTE_TIMEOUT_MS = 12 * 60 * 60 * 1000;

export const JWT_ACCESS_TTL = process.env.ACCESS_TOKEN_TTL || '15m';
export const REFRESH_TTL_MS = 7 * 24 * 60 * 60 * 1000;

// === Rôles IAM ===
export const ROLES = {
  ADMIN: 'admin',
  USER: 'user',
} as const;

// === Permissions ===
export const PERMISSIONS = {
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