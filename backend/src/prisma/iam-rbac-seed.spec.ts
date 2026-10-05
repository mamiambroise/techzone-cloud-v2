import { seedIamRbac } from './iam-rbac-seed';
import { PERMISSIONS } from '../iam/iam.constants';
import { TENANT_ROLE_CODES } from '../iam/iam-tenant-roles';
import type { PrismaClient } from '../generated/prisma/client';

/**
 * Le seed IAM doit être rejouable : c'est la seule garantie qu'un environnement
 * puisse être reconstruit sans dérive. Cette suite l'exerce sur un faux Prisma
 * en mémoire, en comptant réellement les écritures pour que l'idempotence soit
 * observée et non supposée.
 */

type PermissionRow = {
  id: string;
  code: string;
  resource: string;
  action: string;
  name: string;
  description: string;
  critical: boolean;
  active: boolean;
  createdBy?: string | null;
  updatedBy?: string | null;
};

type RoleRow = {
  id: string;
  tenantId: string | null;
  code: string;
  name: string;
  description: string | null;
  status: string;
  system: boolean;
  privileged: boolean;
  archivedAt: Date | null;
  createdBy?: string | null;
  updatedBy?: string | null;
};

type RolePermissionRow = {
  roleId: string;
  permissionId: string;
  grantedBy: string | null;
  revokedAt: Date | null;
  revokedBy: string | null;
};

type AssignmentRow = {
  id: string;
  userId: string;
  roleId: string;
  tenantId: string;
  assignedBy: string | null;
  revokedAt: Date | null;
};

const TENANTS = [
  { id: 'tenant-informatique', code: 'techzone-informatique', status: 'ACTIVE' },
  { id: 'tenant-test', code: 'techzone-test', status: 'ACTIVE' },
  { id: 'tenant-wifi', code: 'techzone-wifi-services', status: 'ACTIVE' },
];

function createFakePrisma(
  options: {
    isAdmin?: boolean;
    membershipStatus?: string | null;
    missingTenants?: string[];
  } = {},
) {
  const permissions = new Map<string, PermissionRow>();
  const roles: RoleRow[] = [];
  const rolePermissions: RolePermissionRow[] = [];
  const assignments: AssignmentRow[] = [];
  let sequence = 0;
  const nextId = () => `id-${++sequence}`;

  const writes = { permissions: 0, roles: 0, rolePermissions: 0, assignments: 0 };

  const prisma = {
    permission: {
      findUnique: jest.fn(async ({ where }: { where: { code: string } }) => {
        const row = permissions.get(where.code);
        return row ? { id: row.id } : null;
      }),
      update: jest.fn(async ({ where, data }: never) => {
        writes.permissions += 1;
        const { id } = where as unknown as { id: string };
        const existing = [...permissions.values()].find((row) => row.id === id);
        if (!existing) {
          throw new Error(`permission ${id} introuvable`);
        }
        Object.assign(existing, data);
        return { id: existing.id };
      }),
      create: jest.fn(async ({ data }: never) => {
        writes.permissions += 1;
        const payload = data as unknown as PermissionRow;
        permissions.set(payload.code, { ...payload, id: nextId() });
        return { id: nextId() };
      }),
    },
    role: {
      findFirst: jest.fn(
        async ({ where }: { where: { code: string; tenantId: string | null } }) => {
          const found = roles.find(
            (role) => role.code === where.code && role.tenantId === where.tenantId,
          );
          return found
            ? {
                id: found.id,
                status: found.status,
                archivedAt: found.archivedAt,
              }
            : null;
        },
      ),
      create: jest.fn(async ({ data }: never) => {
        writes.roles += 1;
        const payload = data as unknown as RoleRow;
        const row: RoleRow = { ...payload, id: nextId() };
        roles.push(row);
        return { id: row.id };
      }),
      update: jest.fn(async ({ where, data }: never) => {
        writes.roles += 1;
        const { id } = where as unknown as { id: string };
        const existing = roles.find((role) => role.id === id);
        if (!existing) {
          throw new Error(`role ${id} introuvable`);
        }
        Object.assign(existing, data);
        return { id: existing.id };
      }),
    },
    rolePermission: {
      findMany: jest.fn(
        async ({ where }: { where: { roleId: string; revokedAt: { not: null } | null } }) => {
          return rolePermissions
            .filter((row) => row.roleId === where.roleId)
            .filter((row) =>
              where.revokedAt === null
                ? row.revokedAt === null
                : row.revokedAt !== null,
            )
            .map((row) => ({ permissionId: row.permissionId, revokedAt: row.revokedAt }));
        },
      ),
      createMany: jest.fn(async ({ data }: never) => {
        let inserted = 0;
        for (const payload of data as unknown as RolePermissionRow[]) {
          const duplicate = rolePermissions.some(
            (row) =>
              row.roleId === payload.roleId &&
              row.permissionId === payload.permissionId,
          );
          if (duplicate) {
            continue;
          }
          rolePermissions.push({ ...payload, revokedBy: payload.revokedBy ?? null });
          inserted += 1;
        }
        // `skipDuplicates` ne touche en base que les lignes réellement insérées.
        writes.rolePermissions += inserted;
        return { count: inserted };
      }),
      updateMany: jest.fn(
        async ({ where, data }: never) => {
          const clause = where as unknown as { roleId: string; permissionId: { in: string[] } };
          let count = 0;
          for (const row of rolePermissions) {
            if (
              row.roleId === clause.roleId &&
              row.revokedAt === null &&
              clause.permissionId.in.includes(row.permissionId)
            ) {
              Object.assign(row, data);
              count += 1;
            }
          }
          return { count };
        },
      ),
    },
    roleAssignment: {
      findFirst: jest.fn(
        async ({
          where,
        }: {
          where: { userId: string; roleId: string; tenantId: string; revokedAt: null };
        }) => {
          const found = assignments.find(
            (row) =>
              row.userId === where.userId &&
              row.roleId === where.roleId &&
              row.tenantId === where.tenantId &&
              row.revokedAt === null,
          );
          return found ? { id: found.id } : null;
        },
      ),
      create: jest.fn(async ({ data }: never) => {
        writes.assignments += 1;
        const payload = data as unknown as AssignmentRow;
        const row: AssignmentRow = {
          ...payload,
          id: nextId(),
          assignedBy: payload.assignedBy ?? null,
          revokedAt: payload.revokedAt ?? null,
        };
        assignments.push(row);
        return { id: row.id };
      }),
    },
    iamUser: {
      findFirst: jest.fn(async () => ({
        id: 'user-techzonetest',
        isAdmin: options.isAdmin ?? false,
        status: 'ACTIVE',
      })),
    },
    membership: {
      findFirst: jest.fn(async () => {
        const status = options.membershipStatus === undefined ? 'ACTIVE' : options.membershipStatus;
        if (status === null) {
          return null;
        }
        return { status };
      }),
    },
    tenant: {
      findMany: jest.fn(async ({ where }: { where: { code: { in: string[] } } }) => {
        const missing = options.missingTenants ?? [];
        return TENANTS.filter(
          (tenant) =>
            where.code.in.includes(tenant.code) && !missing.includes(tenant.code),
        );
      }),
    },
  };

  return {
    prisma: prisma as unknown as PrismaClient,
    permissions,
    roles,
    rolePermissions,
    assignments,
    writes,
  };
}

describe('seedIamRbac', () => {
  it('replicates the permission catalogue into the permission table', async () => {
    const fake = createFakePrisma();

    const summary = await seedIamRbac(fake.prisma);

    expect(summary.permissions).toBeGreaterThan(0);
    expect(fake.permissions.has(PERMISSIONS.BM_WRITE)).toBe(true);
    expect(fake.permissions.has(PERMISSIONS.IAM_ADMIN)).toBe(true);
    expect(fake.permissions.get(PERMISSIONS.IAM_ADMIN)?.critical).toBe(true);
  });

  it('creates the three tenant roles as global system roles', async () => {
    const fake = createFakePrisma();

    await seedIamRbac(fake.prisma);

    for (const code of Object.values(TENANT_ROLE_CODES)) {
      const role = fake.roles.find(
        (candidate) => candidate.code === code && candidate.tenantId === null,
      );
      expect(role).toBeDefined();
      expect(role?.system).toBe(true);
      expect(role?.privileged).toBe(false);
      expect(role?.status).toBe('ACTIVE');
    }
  });

  it('never assigns the platform_admin role', async () => {
    const fake = createFakePrisma();

    await seedIamRbac(fake.prisma);

    const platformAdmin = fake.roles.find(
      (role) => role.code === 'platform_admin',
    );
    expect(platformAdmin).toBeDefined();
    expect(
      fake.assignments.filter(
        (row) =>
          fake.roles.find((role) => role.id === row.roleId)?.code === 'platform_admin',
      ),
    ).toEqual([]);
  });

  it('grants no critical permission to a tenant role', async () => {
    const fake = createFakePrisma();

    await seedIamRbac(fake.prisma);

    const criticalIds = new Set(
      [...fake.permissions.values()]
        .filter((permission) => permission.critical)
        .map((permission) => permission.id),
    );
    const applicationManager = fake.roles.find(
      (role) => role.code === TENANT_ROLE_CODES.APPLICATION_MANAGER,
    );
    const granted = fake.rolePermissions.filter(
      (row) => row.roleId === applicationManager?.id && row.revokedAt === null,
    );
    expect(granted.every((row) => !criticalIds.has(row.permissionId))).toBe(true);
    expect(granted.length).toBeGreaterThan(0);
  });

  it('assigns application_manager to the recette account in its three tenants', async () => {
    const fake = createFakePrisma();

    const summary = await seedIamRbac(fake.prisma);

    expect(summary.assignments).toBe(3);
    expect(summary.createdAssignments).toBe(3);
    expect(
      fake.assignments.map((row) => row.tenantId).sort(),
    ).toEqual(TENANTS.map((tenant) => tenant.id).sort());
  });

  it('is idempotent: a second run writes nothing new', async () => {
    const fake = createFakePrisma();

    await seedIamRbac(fake.prisma);
    const firstState = {
      permissions: fake.permissions.size,
      roles: fake.roles.length,
      rolePermissions: fake.rolePermissions.length,
      assignments: fake.assignments.length,
    };
    const writesAfterFirstRun = { ...fake.writes };

    const second = await seedIamRbac(fake.prisma);

    expect({
      permissions: fake.permissions.size,
      roles: fake.roles.length,
      rolePermissions: fake.rolePermissions.length,
      assignments: fake.assignments.length,
    }).toEqual(firstState);
    expect(second.createdAssignments).toBe(0);
    expect(second.assignments).toBe(firstState.assignments);
    // Seules les réconciliations d'upsert ont lieu, aucune création de ligne.
    expect(fake.writes.rolePermissions).toBe(writesAfterFirstRun.rolePermissions);
    expect(fake.writes.assignments).toBe(writesAfterFirstRun.assignments);
  });

  it('refuses to write anything when the account is already a platform admin', async () => {
    const fake = createFakePrisma({ isAdmin: true });

    await expect(seedIamRbac(fake.prisma)).rejects.toThrow(
      /administrateur plateforme/,
    );
    expect(fake.assignments).toEqual([]);
  });

  it('refuses an assignment when a tenant does not exist', async () => {
    const fake = createFakePrisma({ missingTenants: ['techzone-wifi-services'] });

    await expect(seedIamRbac(fake.prisma)).rejects.toThrow(/Tenants introuvables/);
  });

  it('refuses an assignment when the membership is not ACTIVE', async () => {
    const fake = createFakePrisma({ membershipStatus: 'INVITED' });

    await expect(seedIamRbac(fake.prisma)).rejects.toThrow(/membre ACTIVE/);
    expect(fake.assignments).toEqual([]);
  });
});