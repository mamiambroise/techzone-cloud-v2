import { Injectable } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';
import { IamError } from './iam-error';
import { ROLES, ROLE_PERMISSIONS } from './iam.constants';
import { TENANT_ROLE_CODES } from './iam-tenant-roles';
import { IamLogger } from './iam.logger';

/**
 * Phase 8 — résolution des permissions effectives, scopées au tenant actif.
 *
 * Modèle : USER → MEMBERSHIP (ACTIVE) → ROLE_ASSIGNMENT (tenant) → ROLE →
 * ROLE_PERMISSION → PERMISSION.
 *
 * Règles :
 *  - la membership ACTIVE est un prérequis. Un rôle sans membership ne donne
 *    aucun droit : le résolveur ne consulte les affectations qu'après avoir
 *    vérifié la membership du tenant actif ;
 *  - seules les affectations du tenant actif comptent. Une affectation portée
 *    par un autre tenant ne fuite jamais ;
 *  - `isAdmin` reste un override plateforme explicite, jamais un rôle ;
 *  - en l'absence de toute affectation, le membre retombe sur le minimum
 *    documenté `tenant_user` (lecture seule). C'est un plancher explicite,
 *    pas une concession implicite de droits.
 */

export type EffectiveAuthorization = {
  userId: string;
  tenantId: string | null;
  roles: string[];
  permissions: string[];
  isSuperAdmin: boolean;
  /** Rôles persistés qui ont effectivement produit des permissions. */
  tenantRoleCodes: string[];
  /** Le minimum `tenant_user` a été appliqué faute d'affectation. */
  baselineApplied: boolean;
};

/**
 * Cache court, invalidé à chaque changement de tenant et après toute écriture
 * RBAC. La durée est volontairement courte : la sécurité prime, et une
 * révocation doit devenir effective sans attendre l'expiration du JWT.
 */
const CACHE_TTL_MS = 5_000;

type CacheEntry = { value: EffectiveAuthorization; expiresAt: number };

@Injectable()
export class IamAuthorizationService {
  private readonly cache = new Map<string, CacheEntry>();

  constructor(private readonly prisma: PrismaService) {}

  /** Invalidation explicite, appelée après toute écriture RBAC ou changement de tenant. */
  invalidate(userId?: string, tenantId?: string): void {
    if (!userId) {
      this.cache.clear();
      return;
    }
    for (const key of this.cache.keys()) {
      const [cachedUser, cachedTenant] = key.split('|');
      if (
        cachedUser === userId &&
        (tenantId === undefined || cachedTenant === tenantId)
      ) {
        this.cache.delete(key);
      }
    }
  }

  async resolve(
    user: { id: string; isAdmin?: boolean | null },
    tenantId: string | null | undefined,
  ): Promise<EffectiveAuthorization> {
    const effectiveTenantId = tenantId ?? null;

    // Override plateforme. Volontairement évalué avant la membership : un
    // superadmin doit pouvoir administrer un tenant auquel il n'appartient pas.
    if (user.isAdmin) {
      return {
        userId: user.id,
        tenantId: effectiveTenantId,
        roles: [ROLES.ADMIN],
        permissions: Object.freeze([...ROLE_PERMISSIONS[ROLES.ADMIN]]) as string[],
        isSuperAdmin: true,
        tenantRoleCodes: [],
        baselineApplied: false,
      };
    }

    if (!effectiveTenantId) {
      // Pas de tenant actif : aucune donnée tenant à autoriser. On ne
      // accorde rien plutôt que le minimum, qui impliquerait un tenant
      // inexistant. Les routes réellement concernées remontent déjà 403 via
      // TenantGuard (NO_TENANT_ON_PRINCIPAL).
      return {
        userId: user.id,
        tenantId: null,
        roles: [],
        permissions: [],
        isSuperAdmin: false,
        tenantRoleCodes: [],
        baselineApplied: false,
      };
    }

    const cacheKey = `${user.id}|${effectiveTenantId}`;
    const cached = this.cache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.value;
    }

    const value = await this.resolveFromDatabase(user.id, effectiveTenantId);
    this.cache.set(cacheKey, { value, expiresAt: Date.now() + CACHE_TTL_MS });
    return value;
  }

  private async resolveFromDatabase(
    userId: string,
    tenantId: string,
  ): Promise<EffectiveAuthorization> {
    const membership = await this.prisma.membership.findFirst({
      where: { userId, tenantId, revokedAt: null },
      select: { status: true },
    });

    const membershipActive = membership?.status === 'ACTIVE';

    // Une affectation ne peut jamais compenser une membership absente ou
    // inactive : on ne consulte donc pas les rôles dans ce cas.
    const assignments = membershipActive
      ? await this.prisma.roleAssignment.findMany({
          where: {
            userId,
            tenantId,
            revokedAt: null,
            OR: [
              { validFrom: null },
              { validFrom: { lte: new Date() } },
            ],
            AND: [
              {
                OR: [{ validUntil: null }, { validUntil: { gt: new Date() } }],
              },
            ],
          },
          select: { id: true, roleId: true },
        })
      : [];

    const roleIds = assignments.map((assignment) => assignment.roleId);

    const rows = roleIds.length
      ? await this.prisma.rolePermission.findMany({
          where: {
            roleId: { in: roleIds },
            revokedAt: null,
            role: { status: 'ACTIVE', archivedAt: null },
            permission: { active: true },
          },
          select: {
            role: {
              select: {
                id: true,
                code: true,
                status: true,
                archivedAt: true,
                tenantId: true,
              },
            },
            permission: { select: { code: true, active: true } },
          },
        })
      : [];

    // Garde-fou : une affectation ne vaut que si son rôle est lui-même
    // global ou porté par ce tenant. Un rôle d'un autre tenant ne peut pas
    // être résolu depuis celui-ci, même si l'affectation est incohérente.
    const usableRows = rows.filter(
      (row) =>
        row.role.archivedAt === null &&
        row.role.status === 'ACTIVE' &&
        (row.role.tenantId === null || row.role.tenantId === tenantId),
    );

    const permissions = new Set<string>();
    for (const row of usableRows) {
      if (row.permission.active) {
        permissions.add(row.permission.code);
      }
    }

    const tenantRoleCodes = Array.from(
      new Set(usableRows.map((row) => row.role.code)),
    ).sort();

    let baselineApplied = false;
    if (!membershipActive) {
      // Ni membre actif, ni droits. On journalise pour rendre l'échec
      // diagnosticable sans exposer le détail au client.
      IamLogger.authFailure(
        { headers: {} } as never,
        'TENANT_ACCESS_DENIED',
        `membership inactive or absent for tenant ${tenantId}`,
      );
    } else if (permissions.size === 0) {
      // Membre actif sans rôle : minimum documenté `tenant_user`.
      // Volontairement borné à la lecture, jamais l'APPLICATION_MANAGER.
      ROLE_PERMISSIONS[ROLES.USER].forEach((permission) =>
        permissions.add(permission),
      );
      tenantRoleCodes.push(TENANT_ROLE_CODES.TENANT_USER);
      baselineApplied = true;
    }

    return {
      userId,
      tenantId,
      roles: tenantRoleCodes,
      permissions: Array.from(permissions).sort(),
      isSuperAdmin: false,
      tenantRoleCodes,
      baselineApplied,
    };
  }

  /**
   * Applique une affectation de rôle de façon idempotente et journalisée.
   * Utilisé par le seed IAM et par les tests d'intégration.
   */
  async assignRole(
    userId: string,
    roleId: string,
    tenantId: string,
    assignedBy?: string,
  ): Promise<{ id: string; created: boolean }> {
    const existing = await this.prisma.roleAssignment.findFirst({
      where: { userId, roleId, tenantId, revokedAt: null },
      select: { id: true },
    });
    if (existing) {
      return { id: existing.id, created: false };
    }

    const created = await this.prisma.roleAssignment.create({
      data: { userId, roleId, tenantId, assignedBy },
      select: { id: true },
    });
    this.invalidate(userId, tenantId);
    return { id: created.id, created: true };
  }

  async assertTenantAccess(userId: string, tenantId: string): Promise<void> {
    const membership = await this.prisma.membership.findFirst({
      where: { userId, tenantId, revokedAt: null },
      select: { status: true },
    });
    if (!membership || membership.status !== 'ACTIVE') {
      throw new IamError('Appartenance au locataire non active', 403, 'TENANT_ACCESS_DENIED');
    }
  }
}