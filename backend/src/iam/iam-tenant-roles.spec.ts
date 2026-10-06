import { PERMISSIONS } from './iam.constants';
import {
  PERMISSION_CODES,
  PERMISSION_DEFINITIONS,
  isCriticalPermission,
} from './iam-permission-registry';
import {
  PLATFORM_ADMIN_ROLE_CODE,
  SYSTEM_ROLES,
  effectiveSystemRolePermissions,
  systemRoleByCode,
} from './iam-tenant-roles';

/**
 * Le registre `permission` est un miroir de `iam.constants.ts`. Cette suite
 * verrouille la parité dans les deux sens : une permission déclarée par le code
 * mais absente du registre ne serait jamais insérée en base, et une permission
 * du registre inconnue du code serait morte. Les deux cas sont des défauts.
 */

describe('permission registry', () => {
  it('mirrors every permission declared by the code, without exception', () => {
    const declared = new Set<string>(Object.values(PERMISSIONS));
    const registered = new Set<string>(PERMISSION_CODES);

    const missingFromRegistry = [...declared].filter(
      (code) => !registered.has(code),
    );
    const missingFromCode = [...registered].filter(
      (code) => !declared.has(code),
    );

    expect(missingFromRegistry).toEqual([]);
    expect(missingFromCode).toEqual([]);
  });

  it('deduplicates codes', () => {
    expect(PERMISSION_CODES.length).toBe(new Set(PERMISSION_CODES).size);
  });

  it('splits every code into a non-empty resource and action', () => {
    for (const definition of PERMISSION_DEFINITIONS) {
      expect(definition.resource).toBeTruthy();
      expect(definition.action).toBeTruthy();
    }
  });

  it('marks platform administration as critical', () => {
    expect(isCriticalPermission(PERMISSIONS.IAM_ADMIN)).toBe(true);
  });

  it('accepts any permission code, not only the literal union', () => {
    expect(isCriticalPermission('not:a:real:permission')).toBe(false);
  });

  it('does not mark ordinary business permissions as critical', () => {
    expect(isCriticalPermission(PERMISSIONS.BM_READ)).toBe(false);
    expect(isCriticalPermission(PERMISSIONS.BM_WRITE)).toBe(false);
    expect(isCriticalPermission(PERMISSIONS.PACK_READ)).toBe(false);
  });
});

describe('tenant role catalogue', () => {
  it('grants no critical permission to any tenant role', () => {
    for (const role of SYSTEM_ROLES) {
      const critical = effectiveSystemRolePermissions(role.code).filter(
        isCriticalPermission,
      );
      expect({ role: role.code, critical }).toEqual({
        role: role.code,
        critical: [],
      });
    }
  });

  it('excludes platform administration from the tenant_admin role', () => {
    const permissions = effectiveSystemRolePermissions('tenant_admin');
    expect(permissions).not.toContain(PERMISSIONS.IAM_ADMIN);
    expect(permissions).not.toContain(PERMISSIONS.INTEGRATION_CREDENTIAL_READ);
    expect(permissions).not.toContain(PERMISSIONS.INTEGRATION_CREDENTIAL_WRITE);
  });

  it('excludes payment mutation from the application_manager role', () => {
    const permissions = effectiveSystemRolePermissions('application_manager');
    expect(permissions).not.toContain(PERMISSIONS.BILLING_MANAGE);
    expect(permissions).not.toContain(PERMISSIONS.BILLING_PAYMENT_RECORD);
    expect(permissions).not.toContain(PERMISSIONS.BILLING_PAYMENT_REFUND);
    expect(permissions).not.toContain(PERMISSIONS.BILLING_OVERRIDE_MANAGE);
  });

  it('excludes runtime platform actions from the application_manager role', () => {
    const permissions = effectiveSystemRolePermissions('application_manager');
    expect(permissions).not.toContain(PERMISSIONS.RUNTIME_CACHE_INVALIDATE);
    expect(permissions).not.toContain(PERMISSIONS.RUNTIME_DIAGNOSTIC_EXPORT);
  });

  it('grants application_manager the full application life cycle of its tenant', () => {
    const permissions = effectiveSystemRolePermissions('application_manager');
    // Business Manager
    expect(permissions).toContain(PERMISSIONS.BM_WRITE);
    expect(permissions).toContain(PERMISSIONS.BM_VALIDATE);
    expect(permissions).toContain(PERMISSIONS.BM_PUBLISH);
    // UI Builder
    expect(permissions).toContain(PERMISSIONS.UI_BUILDER_WRITE);
    expect(permissions).toContain(PERMISSIONS.UI_BUILDER_VALIDATE);
    // Data Runtime
    expect(permissions).toContain(PERMISSIONS.DATA_RUNTIME_EXECUTE);
    // Pack Manager
    expect(permissions).toContain(PERMISSIONS.PACK_CREATE);
    expect(permissions).toContain(PERMISSIONS.PACK_VERSION_PUBLISH);
    // Pack Runtime
    expect(permissions).toContain(PERMISSIONS.RUNTIME_RESOLVE);
  });

  it('keeps tenant_user read-only', () => {
    const permissions = effectiveSystemRolePermissions('tenant_user');
    for (const definition of PERMISSION_DEFINITIONS) {
      const isWrite = /(write|create|update|delete|publish|execute|attach|restore|archive|validate|generate|record|refund|manage|probe|invalidate|export)/.test(
        definition.action,
      );
      if (isWrite) {
        expect(permissions).not.toContain(definition.code);
      }
    }
  });

  it('resolves inheritance so application_manager is a superset of tenant_user', () => {
    const tenantUser = effectiveSystemRolePermissions('tenant_user');
    const applicationManager = effectiveSystemRolePermissions('application_manager');
    expect(applicationManager.length).toBeGreaterThan(tenantUser.length);
    for (const code of tenantUser) {
      expect(applicationManager).toContain(code);
    }
  });

  it('resolves inheritance for tenant_admin', () => {
    const applicationManager = effectiveSystemRolePermissions('application_manager');
    const tenantAdmin = effectiveSystemRolePermissions('tenant_admin');
    for (const code of applicationManager) {
      expect(tenantAdmin).toContain(code);
    }
  });

  it('survives an inheritance cycle without looping forever', () => {
    expect(systemRoleByCode(PLATFORM_ADMIN_ROLE_CODE)).toBeUndefined();
    expect(effectiveSystemRolePermissions('unknown_role')).toEqual([]);
  });

  it('does not declare any tenant role as a platform role', () => {
    for (const role of SYSTEM_ROLES) {
      expect(role.platform).toBe(false);
    }
  });
});