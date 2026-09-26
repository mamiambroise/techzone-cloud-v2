import * as jwt from 'jsonwebtoken';
import { ALL_PERMISSIONS, ROLES } from '../../src/iam/iam.constants';

const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || 'change_me';

export function generateAdminToken(overrides?: Partial<any>): string {
  return jwt.sign(
    {
      type: 'access',
      userId: 'test-admin-user',
      sessionId: 'test-admin-session',
      tenantId: 'test-tenant',
      organizationId: 'test-org',
      authenticationLevel: 'PASSWORD',
      roles: [ROLES.ADMIN],
      permissions: ALL_PERMISSIONS,
      iss: 'techzone-cloud-iam',
      ...overrides,
    },
    ACCESS_SECRET,
    { expiresIn: '15m' },
  );
}

export function generateUserToken(overrides?: Partial<any>): string {
  return jwt.sign(
    {
      type: 'access',
      userId: 'test-user',
      sessionId: 'test-user-session',
      tenantId: 'test-tenant',
      organizationId: 'test-org',
      authenticationLevel: 'PASSWORD',
      roles: [ROLES.USER],
      permissions: [
        'erp:read',
        'automation:read',
        'data-runtime:read',
        'data-runtime:query',
        'config:read',
      ],
      iss: 'techzone-cloud-iam',
      ...overrides,
    },
    ACCESS_SECRET,
    { expiresIn: '15m' },
  );
}

export function authHeader(token: string) {
  return { Authorization: `Bearer ${token}` };
}