/**
 * Seed IAM/RBAC — Phase 8.
 *
 * Ce module réplique en base le catalogue déclaré par le code :
 * `iam-permission-registry.ts` (permissions) et `iam-tenant-roles.ts` (rôles
 * système). Il ne décide rien : l'autorisation se lit toujours en base via
 * `IamAuthorizationService`. Le seed sert uniquement à rendre la base
 * reproductible.
 *
 *  - IDEMPOTENT : chaque permission et chaque rôle sont réconciliés à l'identique
 *    par `upsert`, et les `role_permission` sont recalculés depuis le catalogue
 *    (grants absents créés, grants retirés révoqués). Deux exécutions successives
 *    laissent exactement le même état.
 *  - GLOBAL UNIQUEMENT : les rôles système sont écrits avec `tenantId = null`.
 *    Un rôle porté par un tenant n'est jamais créé ni modifié ici, sinon le seed
 *    réécrirait les droits d'un client.
 *  - MOINDRE PRIVILÈGE : le catalogue refuse d'accorder une permission critique
 *    (administration plateforme, secrets d'intégration, mouvement de fonds)
 *    à un rôle tenant. Le seed échoue plutôt que d'écrire un rôle qui_encoderait
 *    une escalade de privilège.
 *  - JAMAIS `isAdmin` : l'override superadmin reste une décision de plateforme,
 *    hors de portée d'un seed de rôles. Ce seed n'écrit jamais `iamUser.isAdmin`.
 */

import type { PrismaClient } from '../generated/prisma/client';
import {
  PERMISSION_DEFINITIONS,
  type PermissionDefinition,
} from '../iam/iam-permission-registry';
import {
  PLATFORM_ADMIN_ROLE_CODE,
  SYSTEM_ROLES,
  TENANT_ROLE_CODES,
  effectiveSystemRolePermissions,
  systemRoleByCode,
} from '../iam/iam-tenant-roles';
import { ROLES, ROLE_PERMISSIONS } from '../iam/iam.constants';

export type ApplicationManagerAssignmentSpec = {
  /** `iamUser.username` — jamais un email ni un id : le seed doit être relisible. */
  username: string;
  tenantCodes: string[];
};

export type IamRbacSeedSummary = {
  permissions: number;
  roles: number;
  rolePermissions: number;
  revokedRolePermissions: number;
  assignments: number;
  createdAssignments: number;
  /** Rôles système qui contredisent la règle de moindre privilège. */
  refusedRoles: string[];
};

/**
 * Affectations de démonstration demandées pour la Phase 8 : le compte de
 * recette doit construire et publier ses applications sans devenir admin.
 *
 * `techzonetest` n'apparaît volontairement dans aucune liste de rôles
 * administrateurs, et son `isAdmin` reste à `false`.
 */
export const DEFAULT_APPLICATION_MANAGER_ASSIGNMENTS: ApplicationManagerAssignmentSpec[] =
  [
    {
      username: 'techzonetest',
      tenantCodes: [
        'techzone-informatique',
        'techzone-test',
        'techzone-wifi-services',
      ],
    },
  ];

export type SeedIamRbacOptions = {
  assignments?: ApplicationManagerAssignmentSpec[];
  logger?: (message: string) => void;
};

const SEED_SYSTEM = 'prisma-seed';

async function upsertPermission(
  prisma: PrismaClient,
  definition: PermissionDefinition,
): Promise<void> {
  const data = {
    resource: definition.resource,
    action: definition.action,
    name: definition.name,
    description: definition.description,
    critical: definition.critical,
    active: definition.active,
    updatedBy: SEED_SYSTEM,
  };

  const existing = await prisma.permission.findUnique({
    where: { code: definition.code },
    select: { id: true },
  });

  if (existing) {
    await prisma.permission.update({ where: { id: existing.id }, data });
    return;
  }

  await prisma.permission.create({
    data: { code: definition.code, createdBy: SEED_SYSTEM, ...data },
  });
}

/**
 * Trouve un rôle par code, en distinguant un rôle global (`tenantId = null`)
 * d'un rôle de tenant. L'upsert Prisma sur `tenantId_code` est inutilisable ici :
 * en PostgreSQL deux NULLs sont distincts, donc la contrainte n'unicité ne
 * s'applique pas aux rôles globaux.
 */
async function findRoleByCode(
  prisma: PrismaClient,
  tenantId: string | null,
  code: string,
) {
  return prisma.role.findFirst({
    where: { code, tenantId },
    select: { id: true, status: true, archivedAt: true },
  });
}

/**
 * Réconcilie les `role_permission` d'un rôle avec le catalogue :
 *  - un grant absent, ou révoqué, est (re)mis en service ;
 *  - un grant retiré du catalogue est RÉVOQUÉ, jamais supprimé, pour que
 *    l'historique d'attribution reste auditable.
 *
 * Les grants déjà actifs ne sont pas réémis : une ré-exécution du seed n'émet
 * donc aucune écriture de permission.
 */
async function reconcileGrants(
  prisma: PrismaClient,
  roleId: string,
  permissionCodes: readonly string[],
  permissionIdsByCode: Map<string, string>,
) {
  const current = await prisma.rolePermission.findMany({
    where: { roleId, revokedAt: { not: null } },
    select: { permissionId: true, revokedAt: true },
  });
  const active = await prisma.rolePermission.findMany({
    where: { roleId, revokedAt: null },
    select: { permissionId: true, revokedAt: true },
  });

  const currentByPermissionId = new Map(
    [...current, ...active].map((row) => [row.permissionId, row]),
  );

  const grantedPermissionIds = permissionCodes
    .map((code) => permissionIdsByCode.get(code))
    .filter((id): id is string => Boolean(id));

  const toGrant = grantedPermissionIds.filter((permissionId) => {
    const row = currentByPermissionId.get(permissionId);
    return !row || row.revokedAt !== null;
  });

  const toRevoke = active
    .map((row) => row.permissionId)
    .filter((permissionId) => !grantedPermissionIds.includes(permissionId));

  // `skipDuplicates` couvre le cas d'une ré-exécution concurrente.
  if (toGrant.length) {
    await prisma.rolePermission.createMany({
      data: toGrant.map((permissionId) => ({
        roleId,
        permissionId,
        grantedBy: SEED_SYSTEM,
        revokedAt: null,
      })),
      skipDuplicates: true,
    });
  }

  if (toRevoke.length) {
    await prisma.rolePermission.updateMany({
      where: { roleId, permissionId: { in: toRevoke }, revokedAt: null },
      data: { revokedAt: new Date(), revokedBy: SEED_SYSTEM },
    });
  }

  return { granted: grantedPermissionIds.length, revoked: toRevoke.length };
}

async function upsertSystemRole(
  prisma: PrismaClient,
  definition: (typeof SYSTEM_ROLES)[number],
  permissionIdsByCode: Map<string, string>,
) {
  const permissionCodes = effectiveSystemRolePermissions(definition.code);
  const existing = await findRoleByCode(prisma, null, definition.code);

  const role = existing
    ? await prisma.role.update({
        where: { id: existing.id },
        data: {
          name: definition.name,
          description: definition.description,
          status: 'ACTIVE',
          system: true,
          privileged: definition.platform,
          archivedAt: null,
          updatedBy: SEED_SYSTEM,
        },
        select: { id: true },
      })
    : await prisma.role.create({
        data: {
          tenantId: null,
          code: definition.code,
          name: definition.name,
          description: definition.description,
          status: 'ACTIVE',
          system: true,
          privileged: definition.platform,
          createdBy: SEED_SYSTEM,
        },
        select: { id: true },
      });

  const outcome = await reconcileGrants(
    prisma,
    role.id,
    permissionCodes,
    permissionIdsByCode,
  );

  return { roleId: role.id, ...outcome };
}

/**
 * Rôle plateforme de référence, jamais accordé par `role_assignment` :
 * `iamUser.isAdmin` reste l'unique voie superadmin. Le seed le crée uniquement
 * pour que le catalogue en base soit complet et vérifiable.
 */
const PLATFORM_ADMIN_DESCRIPTION =
  'Catalogue de référence de la plateforme. Non assignable : `iamUser.isAdmin` est l’override superadmin explicite.';

async function upsertPlatformAdminRole(
  prisma: PrismaClient,
  permissionIdsByCode: Map<string, string>,
) {
  const permissionCodes = Object.freeze([...ROLE_PERMISSIONS[ROLES.ADMIN]]);
  const existing = await findRoleByCode(prisma, null, PLATFORM_ADMIN_ROLE_CODE);

  const role = existing
    ? await prisma.role.update({
        where: { id: existing.id },
        data: {
          name: 'Administrateur plateforme',
          description: PLATFORM_ADMIN_DESCRIPTION,
          status: 'ACTIVE',
          system: true,
          privileged: true,
          archivedAt: null,
          updatedBy: SEED_SYSTEM,
        },
        select: { id: true },
      })
    : await prisma.role.create({
        data: {
          tenantId: null,
          code: PLATFORM_ADMIN_ROLE_CODE,
          name: 'Administrateur plateforme',
          description: PLATFORM_ADMIN_DESCRIPTION,
          status: 'ACTIVE',
          system: true,
          privileged: true,
          createdBy: SEED_SYSTEM,
        },
        select: { id: true },
      });

  const outcome = await reconcileGrants(
    prisma,
    role.id,
    permissionCodes,
    permissionIdsByCode,
  );

  return { roleId: role.id, ...outcome };
}

async function assignApplicationManager(
  prisma: PrismaClient,
  spec: ApplicationManagerAssignmentSpec,
) {
  const roleDefinition = systemRoleByCode(TENANT_ROLE_CODES.APPLICATION_MANAGER);
  const existingRole = await findRoleByCode(
    prisma,
    null,
    TENANT_ROLE_CODES.APPLICATION_MANAGER,
  );
  if (!roleDefinition || !existingRole) {
    throw new Error(
      `Rôle ${TENANT_ROLE_CODES.APPLICATION_MANAGER} absent du catalogue : seed IAM exécuté dans le désordre`,
    );
  }

  const user = await prisma.iamUser.findFirst({
    where: { username: spec.username },
    select: { id: true, isAdmin: true, status: true },
  });
  if (!user) {
    throw new Error(`Utilisateur ${spec.username} introuvable : seed IAM non applicable`);
  }
  if (user.isAdmin) {
    throw new Error(
      `L'utilisateur ${spec.username} est administrateur plateforme : l'affectation tenant serait redondante et contournerait le RBAC`,
    );
  }

  const tenants = await prisma.tenant.findMany({
    where: { code: { in: spec.tenantCodes } },
    select: { id: true, code: true, status: true },
  });
  const missing = spec.tenantCodes.filter(
    (code) => !tenants.some((tenant) => tenant.code === code),
  );
  if (missing.length) {
    throw new Error(
      `Tenants introuvables pour ${spec.username} : ${missing.join(', ')}`,
    );
  }

  const result = { total: 0, created: 0 };
  for (const tenant of tenants) {
    const membership = await prisma.membership.findFirst({
      where: { userId: user.id, tenantId: tenant.id, revokedAt: null },
      select: { status: true },
    });
    if (!membership || membership.status !== 'ACTIVE') {
      throw new Error(
        `${spec.username} n'est pas membre ACTIVE du tenant ${tenant.code} : une affectation de rôle serait inopérante`,
      );
    }

    const already = await prisma.roleAssignment.findFirst({
      where: {
        userId: user.id,
        roleId: existingRole.id,
        tenantId: tenant.id,
        revokedAt: null,
      },
      select: { id: true },
    });
    if (already) {
      result.total += 1;
      continue;
    }

    await prisma.roleAssignment.create({
      data: {
        userId: user.id,
        roleId: existingRole.id,
        tenantId: tenant.id,
        assignedBy: SEED_SYSTEM,
      },
    });
    result.total += 1;
    result.created += 1;
  }

  return result;
}

export async function seedIamRbac(
  prisma: PrismaClient,
  options: SeedIamRbacOptions = {},
): Promise<IamRbacSeedSummary> {
  const log = options.logger ?? (() => undefined);
  const assignments =
    options.assignments ?? DEFAULT_APPLICATION_MANAGER_ASSIGNMENTS;

  // Garde-fou de moindre privilège, évalué AVANT toute écriture : si le
  // catalogue concède une permission critique à un rôle tenant, on refuse
  // l'ensemble du seed plutôt que d'écrire une escalade partielle.
  const refusedRoles: string[] = [];
  for (const definition of SYSTEM_ROLES) {
    if (definition.platform) {
      refusedRoles.push(definition.code);
      continue;
    }
    const offending = effectiveSystemRolePermissions(definition.code).filter(
      (code) =>
        PERMISSION_DEFINITIONS.find(
          (permission) => permission.code === code,
        )?.critical,
    );
    if (offending.length) {
      refusedRoles.push(`${definition.code} → ${offending.join(', ')}`);
    }
  }
  if (refusedRoles.length) {
    throw new Error(
      `Catalogue IAM/RBAC incohérent, seed refusé (permissions critiques accordées à un rôle tenant) : ${refusedRoles.join(' | ')}`,
    );
  }

  const permissionIdsByCode = new Map<string, string>();
  for (const definition of PERMISSION_DEFINITIONS) {
    await upsertPermission(prisma, definition);
    const stored = await prisma.permission.findUnique({
      where: { code: definition.code },
      select: { id: true },
    });
    if (!stored) {
      throw new Error(`Permission ${definition.code} non persistée`);
    }
    permissionIdsByCode.set(definition.code, stored.id);
  }
  log(`IAM : ${PERMISSION_DEFINITIONS.length} permissions réconciliées`);

  let granted = 0;
  let revoked = 0;
  for (const definition of SYSTEM_ROLES) {
    const outcome = await upsertSystemRole(
      prisma,
      definition,
      permissionIdsByCode,
    );
    granted += outcome.granted;
    revoked += outcome.revoked;
  }
  await upsertPlatformAdminRole(prisma, permissionIdsByCode);
  log(
    `IAM : ${SYSTEM_ROLES.length + 1} rôles système réconciliés (${granted} grants, ${revoked} révocations)`,
  );

  let assignmentTotal = 0;
  let assignmentCreated = 0;
  for (const spec of assignments) {
    const outcome = await assignApplicationManager(prisma, spec);
    assignmentTotal += outcome.total;
    assignmentCreated += outcome.created;
  }
  log(
    `IAM : ${assignmentTotal} affectations application_manager (${assignmentCreated} créées)`,
  );

  return {
    permissions: PERMISSION_DEFINITIONS.length,
    roles: SYSTEM_ROLES.length + 1,
    rolePermissions: granted,
    revokedRolePermissions: revoked,
    assignments: assignmentTotal,
    createdAssignments: assignmentCreated,
    refusedRoles,
  };
}