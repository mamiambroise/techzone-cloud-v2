import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { IamError } from './iam-error';

@Injectable()
export class IamContextService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * RG-IAM-018 : le `tenantId` qui vient du frontend n'est jamais une
   * autorité. Toute session/commutation sur un tenant passe ici : membership
   * ACTIVE, fenêtre de validité, puis statuts tenant / organisation / site.
   * Toute valeur invalide est un DENY (fail-closed).
   */
  async assertTenantAccess(
    userId: string,
    tenantId: string,
    requested?: { organizationId?: string | null; siteId?: string | null },
  ) {
    const membership = await this.prisma.membership.findFirst({
      where: { userId, tenantId, status: 'ACTIVE' },
      include: {
        tenant: { select: { id: true, status: true } },
        organization: { select: { id: true, status: true } },
        site: { select: { id: true, status: true } },
      },
    });
    if (!membership) {
      throw new IamError(
        'Appartenance au locataire non active',
        403,
        'TENANT_ACCESS_DENIED',
      );
    }

    const now = new Date();
    if (membership.validFrom && membership.validFrom > now) {
      throw new IamError('Appartenance pas encore valide', 403, 'TENANT_ACCESS_DENIED');
    }
    if (membership.validUntil && membership.validUntil < now) {
      throw new IamError('Appartenance expirée', 403, 'TENANT_ACCESS_DENIED');
    }
    if (membership.tenant.status !== 'ACTIVE') {
      throw new IamError('Locataire non actif', 403, 'TENANT_ACCESS_DENIED');
    }
    if (membership.organizationId && membership.organization?.status !== 'ACTIVE') {
      throw new IamError('Organisation non active', 403, 'TENANT_ACCESS_DENIED');
    }
    if (membership.siteId && membership.site?.status !== 'ACTIVE') {
      throw new IamError('Site non actif', 403, 'TENANT_ACCESS_DENIED');
    }

    // La requête ne peut pas suggérer un org/site hors de son membership :
    // forge cross-tenant interdite.
    if (requested?.organizationId && requested.organizationId !== membership.organizationId) {
      throw new IamError('Contexte organisation non autorisé', 403, 'CONTEXT_ACCESS_DENIED');
    }
    if (requested?.siteId && requested.siteId !== membership.siteId) {
      throw new IamError('Contexte site non autorisé', 403, 'CONTEXT_ACCESS_DENIED');
    }

    return membership;
  }

  async resolveContext(userId: string, sessionId: string, source = 'ERP_API') {
    const session = await this.prisma.iamSession.findUnique({
      where: { id: sessionId },
      include: { user: true, device: true },
    });

    if (!session) {
      throw new IamError('Session introuvable', 401, 'SESSION_NOT_FOUND');
    }

    if (session.userId !== userId) {
      throw new IamError('Contexte non autorisé', 403, 'CONTEXT_UNAUTHORIZED');
    }

    if (session.status !== 'ACTIVE') {
      throw new IamError('Session non active', 401, 'SESSION_INACTIVE');
    }

    const now = new Date();
    if (session.expiresAt && session.expiresAt < now) {
      throw new IamError('Session expirée', 401, 'SESSION_EXPIRED');
    }

    const user = session.user;

    const memberships = await this.prisma.membership.findMany({
      where: { userId },
      include: { tenant: true, organization: true, site: true },
    });

    const tenantMemberships = memberships.filter((m) => m.tenantId);

    const roleAssignments = await this.prisma.roleAssignment.findMany({
      where: {
        OR: [
          { userId },
          { groupId: { in: await this.getUserGroupIds(userId) } },
        ],
      },
      include: { role: { include: { permissions: { include: { permission: true } } } } },
    });

    const effectiveRoleIds = new Set<string>();
    for (const ra of roleAssignments) {
      effectiveRoleIds.add(ra.roleId);
    }

    const roles = await this.prisma.role.findMany({
      where: { id: { in: Array.from(effectiveRoleIds) } },
      include: { permissions: { include: { permission: true } } },
    });

    const roleCodes = roles.map((r) => r.code);
    const permissionCodes = new Set<string>();
    for (const role of roles) {
      for (const rp of role.permissions) {
        permissionCodes.add(rp.permission.code);
      }
    }

    const context = {
      status: 'RESOLVED' as const,
      principal: {
        userId,
        sessionId,
        username: user.username,
        primaryEmail: user.primaryEmail,
      },
      tenant: tenantMemberships[0]
        ? {
            tenantId: tenantMemberships[0].tenantId,
            organizationId: tenantMemberships[0].organizationId ?? undefined,
            siteId: tenantMemberships[0].siteId ?? undefined,
          }
        : null,
      memberships: tenantMemberships.map((m) => ({
        tenantId: m.tenantId,
        organizationId: m.organizationId ?? undefined,
        siteId: m.siteId ?? undefined,
        status: m.status,
      })),
      roles: roleCodes.map((code) => ({ code })),
      permissions: Array.from(permissionCodes).map((code) => ({ code })),
      authentication: {
        level: session.authenticationLevel ?? null,
        riskLevel: session.riskLevel,
      },
      security: {
        deviceTrust: session.device?.trustLevel ?? 'UNKNOWN',
      },
      resolvedAt: new Date().toISOString(),
      source,
    };

    return context;
  }

  private async getUserGroupIds(userId: string): Promise<string[]> {
    const groupMembers = await this.prisma.groupMember.findMany({
      where: { userId },
    });
    return groupMembers.map((gm) => gm.groupId);
  }

  async listActiveTenants(userId: string) {
    const memberships = await this.prisma.membership.findMany({
      where: { userId, status: 'ACTIVE' },
      include: { tenant: { select: { id: true, code: true, name: true, status: true } } },
    });
    return memberships.map((m) => m.tenant);
  }

  async switchTenant(
    userId: string,
    tenantId: string,
    requested?: { organizationId?: string | null; siteId?: string | null },
  ) {
    const membership = await this.assertTenantAccess(userId, tenantId, requested);
    return { tenantId, organizationId: membership.organizationId ?? null, siteId: membership.siteId ?? null };
  }

  async invalidateContext(subjectType: string, subjectId: string, tenantId: string | null, reason: string) {
    await this.prisma.contextInvalidation.create({
      data: {
        subjectType,
        subjectId,
        tenantId,
        reason,
        sourceEventType: 'MANUAL_INVALIDATION',
        sourceEventId: subjectId,
        revision: 1,
      },
    });
  }
}
