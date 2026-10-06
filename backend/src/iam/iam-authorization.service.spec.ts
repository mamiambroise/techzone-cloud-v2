import { IamAuthorizationService } from './iam-authorization.service';
import { ROLE_PERMISSIONS, ROLES } from './iam.constants';
import { TENANT_ROLE_CODES } from './iam-tenant-roles';
import type { PrismaService } from '../prisma/prisma.service';

/**
 * Phase 8 — règles d'autorisation tenant.
 *
 * Ces tests verrouillent les propriétés de sécurité, pas l'implémentation :
 * une régression qui réaccorde un droit à un non-membre, qui laisse fuir un
 * rôle d'un autre tenant, ou qui réintroduit `isAdmin` comme rôle doit faire
 * échouer cette suite.
 */

const TENANT_A = '11111111-1111-4111-8111-111111111111';
const TENANT_B = '22222222-2222-4222-8222-222222222222';
const USER = 'user-1';
const TENANT_USER_ROLE = 'role-tenant-user';
const APPLICATION_MANAGER_ROLE = 'role-application-manager';

/**
 * Un membre ACTIVE dont aucune affectation ne produit de permission retombe sur
 * le minimum `tenant_user`. C'est le comportement attendu : le refus porte sur
 * le rôle fautif, pas sur le membre.
 */
function expectedBaseline(): string[] {
  return [...ROLE_PERMISSIONS[ROLES.USER]].sort();
}

type StubOptions = {
  membershipStatus?: 'ACTIVE' | 'INVITED' | 'SUSPENDED' | null;
  assignments?: { id: string; roleId: string }[];
  grants?: {
    role: {
      id: string;
      code: string;
      status: string;
      archivedAt: Date | null;
      tenantId: string | null;
    };
    permission: { code: string; active: boolean };
  }[];
};

function prismaStub(options: StubOptions = {}) {
  const createdAssignments: unknown[] = [];
  const updatedRolePermissions: unknown[] = [];

  const prisma = {
    membership: {
      findFirst: jest.fn().mockResolvedValue(
        options.membershipStatus === undefined
          ? { status: 'ACTIVE' }
          : options.membershipStatus === null
            ? null
            : { status: options.membershipStatus },
      ),
    },
    roleAssignment: {
      findMany: jest.fn().mockResolvedValue(options.assignments ?? []),
      findFirst: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockImplementation(({ data }) => {
        createdAssignments.push(data);
        return Promise.resolve({ id: `assignment-${createdAssignments.length}` });
      }),
    },
    rolePermission: {
      findMany: jest.fn().mockResolvedValue(options.grants ?? []),
      updateMany: jest.fn().mockImplementation(({ data }) => {
        updatedRolePermissions.push(data);
        return Promise.resolve({ count: 0 });
      }),
    },
  };

  return {
    prisma: prisma as unknown as PrismaService,
    createdAssignments,
    updatedRolePermissions,
  };
}

describe('IamAuthorizationService', () => {
  describe('membership gate', () => {
    it('accords nothing to a user without membership in the active tenant', async () => {
      const { prisma } = prismaStub({
        membershipStatus: null,
        // Une affectation orpheline existe pourtant : elle ne doit rien valoir.
        assignments: [{ id: 'a1', roleId: APPLICATION_MANAGER_ROLE }],
        grants: [
          {
            role: {
              id: APPLICATION_MANAGER_ROLE,
              code: TENANT_ROLE_CODES.APPLICATION_MANAGER,
              status: 'ACTIVE',
              archivedAt: null,
              tenantId: null,
            },
            permission: { code: 'bm:write', active: true },
          },
        ],
      });
      const service = new IamAuthorizationService(prisma);

      const effective = await service.resolve({ id: USER, isAdmin: false }, TENANT_A);

      expect(effective.permissions).toEqual([]);
      expect(effective.roles).toEqual([]);
      expect(effective.baselineApplied).toBe(false);
    });

    it('accords nothing when the membership is not ACTIVE', async () => {
      const { prisma } = prismaStub({
        membershipStatus: 'SUSPENDED',
        assignments: [{ id: 'a1', roleId: APPLICATION_MANAGER_ROLE }],
      });
      const service = new IamAuthorizationService(prisma);

      const effective = await service.resolve({ id: USER, isAdmin: false }, TENANT_A);

      expect(effective.permissions).toEqual([]);
      expect(effective.baselineApplied).toBe(false);
    });

    it('does not even read the assignments when the membership is inactive', async () => {
      const { prisma } = prismaStub({ membershipStatus: 'INVITED' });
      const service = new IamAuthorizationService(prisma);

      await service.resolve({ id: USER, isAdmin: false }, TENANT_A);

      expect(prisma.roleAssignment.findMany).not.toHaveBeenCalled();
    });
  });

  describe('tenant scoping', () => {
    it('ignores a role owned by another tenant', async () => {
      const { prisma } = prismaStub({
        assignments: [{ id: 'a1', roleId: 'role-other-tenant' }],
        grants: [
          {
            role: {
              id: 'role-other-tenant',
              code: 'tenant_admin',
              status: 'ACTIVE',
              archivedAt: null,
              tenantId: TENANT_B,
            },
            permission: { code: 'bm:write', active: true },
          },
        ],
      });
      const service = new IamAuthorizationService(prisma);

      const effective = await service.resolve({ id: USER, isAdmin: false }, TENANT_A);

      expect(effective.permissions).toEqual(expectedBaseline());
      expect(effective.tenantRoleCodes).toEqual([TENANT_ROLE_CODES.TENANT_USER]);
      expect(effective.baselineApplied).toBe(true);
    });

    it('ignores an archived role', async () => {
      const { prisma } = prismaStub({
        assignments: [{ id: 'a1', roleId: TENANT_USER_ROLE }],
        grants: [
          {
            role: {
              id: TENANT_USER_ROLE,
              code: TENANT_ROLE_CODES.TENANT_USER,
              status: 'ACTIVE',
              archivedAt: new Date(),
              tenantId: null,
            },
            permission: { code: 'bm:read', active: true },
          },
        ],
      });
      const service = new IamAuthorizationService(prisma);

      const effective = await service.resolve({ id: USER, isAdmin: false }, TENANT_A);

      expect(effective.permissions).toEqual(expectedBaseline());
      expect(effective.baselineApplied).toBe(true);
    });

    it('ignores an inactive permission even when the grant is active', async () => {
      const { prisma } = prismaStub({
        assignments: [{ id: 'a1', roleId: APPLICATION_MANAGER_ROLE }],
        grants: [
          {
            role: {
              id: APPLICATION_MANAGER_ROLE,
              code: TENANT_ROLE_CODES.APPLICATION_MANAGER,
              status: 'ACTIVE',
              archivedAt: null,
              tenantId: null,
            },
            permission: { code: 'bm:write', active: false },
          },
        ],
      });
      const service = new IamAuthorizationService(prisma);

      const effective = await service.resolve({ id: USER, isAdmin: false }, TENANT_A);

      expect(effective.permissions).toEqual(expectedBaseline());
      expect(effective.baselineApplied).toBe(true);
    });
  });

  describe('baseline', () => {
    it('falls back to the read-only tenant_user baseline for an active member with no role', async () => {
      const { prisma } = prismaStub({ assignments: [] });
      const service = new IamAuthorizationService(prisma);

      const effective = await service.resolve({ id: USER, isAdmin: false }, TENANT_A);

      expect(effective.baselineApplied).toBe(true);
      expect(effective.tenantRoleCodes).toContain(TENANT_ROLE_CODES.TENANT_USER);
      expect([...effective.permissions].sort()).toEqual(
        [...ROLE_PERMISSIONS[ROLES.USER]].sort(),
      );
    });

    it('never grants the baseline without an active tenant', async () => {
      const { prisma } = prismaStub({ assignments: [] });
      const service = new IamAuthorizationService(prisma);

      const effective = await service.resolve({ id: USER, isAdmin: false }, null);

      expect(effective.permissions).toEqual([]);
      expect(effective.baselineApplied).toBe(false);
    });
  });

  describe('platform override', () => {
    it('gives isAdmin the full platform permission set', async () => {
      const { prisma } = prismaStub();
      const service = new IamAuthorizationService(prisma);

      const effective = await service.resolve({ id: USER, isAdmin: true }, TENANT_A);

      expect(effective.isSuperAdmin).toBe(true);
      expect(effective.roles).toEqual([ROLES.ADMIN]);
      expect([...effective.permissions].sort()).toEqual(
        [...ROLE_PERMISSIONS[ROLES.ADMIN]].sort(),
      );
    });

    it('does not require membership for the platform override', async () => {
      const { prisma } = prismaStub({ membershipStatus: null });
      const service = new IamAuthorizationService(prisma);

      const effective = await service.resolve({ id: USER, isAdmin: true }, TENANT_A);

      expect(effective.isSuperAdmin).toBe(true);
    });
  });

  describe('cache', () => {
    it('serves a repeated resolution from the cache', async () => {
      const { prisma } = prismaStub({
        assignments: [{ id: 'a1', roleId: APPLICATION_MANAGER_ROLE }],
        grants: [
          {
            role: {
              id: APPLICATION_MANAGER_ROLE,
              code: TENANT_ROLE_CODES.APPLICATION_MANAGER,
              status: 'ACTIVE',
              archivedAt: null,
              tenantId: null,
            },
            permission: { code: 'bm:write', active: true },
          },
        ],
      });
      const service = new IamAuthorizationService(prisma);

      await service.resolve({ id: USER, isAdmin: false }, TENANT_A);
      await service.resolve({ id: USER, isAdmin: false }, TENANT_A);

      expect(prisma.rolePermission.findMany).toHaveBeenCalledTimes(1);
    });

    it('recomputes after invalidate(user, tenant)', async () => {
      const { prisma } = prismaStub({
        assignments: [{ id: 'a1', roleId: APPLICATION_MANAGER_ROLE }],
      });
      const service = new IamAuthorizationService(prisma);

      await service.resolve({ id: USER, isAdmin: false }, TENANT_A);
      service.invalidate(USER, TENANT_A);
      await service.resolve({ id: USER, isAdmin: false }, TENANT_A);

      expect(prisma.rolePermission.findMany).toHaveBeenCalledTimes(2);
    });

    it('keys the cache per tenant so switching tenant cannot reuse the previous rights', async () => {
      const { prisma } = prismaStub({
        assignments: [{ id: 'a1', roleId: APPLICATION_MANAGER_ROLE }],
        grants: [
          {
            role: {
              id: APPLICATION_MANAGER_ROLE,
              code: TENANT_ROLE_CODES.APPLICATION_MANAGER,
              status: 'ACTIVE',
              archivedAt: null,
              tenantId: null,
            },
            permission: { code: 'bm:write', active: true },
          },
        ],
      });
      const service = new IamAuthorizationService(prisma);

      const inA = await service.resolve({ id: USER, isAdmin: false }, TENANT_A);
      const inB = await service.resolve({ id: USER, isAdmin: false }, TENANT_B);

      expect(inA.permissions).toEqual(['bm:write']);
      expect(inB.tenantId).toBe(TENANT_B);
      expect(prisma.rolePermission.findMany).toHaveBeenCalledTimes(2);
    });

    it('clears every entry when invalidate() is called without arguments', async () => {
      const { prisma } = prismaStub({
        assignments: [{ id: 'a1', roleId: APPLICATION_MANAGER_ROLE }],
      });
      const service = new IamAuthorizationService(prisma);

      await service.resolve({ id: USER, isAdmin: false }, TENANT_A);
      service.invalidate();
      await service.resolve({ id: USER, isAdmin: false }, TENANT_A);

      expect(prisma.rolePermission.findMany).toHaveBeenCalledTimes(2);
    });
  });

  describe('assignRole', () => {
    it('creates the assignment when none is active', async () => {
      const { prisma, createdAssignments } = prismaStub();
      const service = new IamAuthorizationService(prisma);

      const outcome = await service.assignRole(
        USER,
        APPLICATION_MANAGER_ROLE,
        TENANT_A,
        'admin-1',
      );

      expect(outcome.created).toBe(true);
      expect(createdAssignments).toEqual([
        {
          userId: USER,
          roleId: APPLICATION_MANAGER_ROLE,
          tenantId: TENANT_A,
          assignedBy: 'admin-1',
        },
      ]);
    });

    it('is idempotent when an active assignment already exists', async () => {
      const { prisma, createdAssignments } = prismaStub();
      prisma.roleAssignment.findFirst = jest
        .fn()
        .mockResolvedValue({ id: 'existing' });
      const service = new IamAuthorizationService(prisma);

      const outcome = await service.assignRole(
        USER,
        APPLICATION_MANAGER_ROLE,
        TENANT_A,
      );

      expect(outcome).toEqual({ id: 'existing', created: false });
      expect(createdAssignments).toEqual([]);
    });
  });

  describe('assertTenantAccess', () => {
    it('resolves for an ACTIVE membership', async () => {
      const { prisma } = prismaStub({ membershipStatus: 'ACTIVE' });
      const service = new IamAuthorizationService(prisma);

      await expect(
        service.assertTenantAccess(USER, TENANT_A),
      ).resolves.toBeUndefined();
    });

    it('rejects a missing membership with 403', async () => {
      const { prisma } = prismaStub({ membershipStatus: null });
      const service = new IamAuthorizationService(prisma);

      await expect(service.assertTenantAccess(USER, TENANT_A)).rejects.toMatchObject({
        statusCode: 403,
        code: 'TENANT_ACCESS_DENIED',
      });
    });

    it('rejects an inactive membership with 403', async () => {
      const { prisma } = prismaStub({ membershipStatus: 'INVITED' });
      const service = new IamAuthorizationService(prisma);

      await expect(service.assertTenantAccess(USER, TENANT_A)).rejects.toMatchObject({
        statusCode: 403,
      });
    });
  });
});