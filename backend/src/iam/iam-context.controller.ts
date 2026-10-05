import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { IamJwtGuard } from './iam-jwt.guard';
import { CurrentUser } from './decorators/current-user.decorator';
import type { IamAuthContext } from './decorators/current-user.decorator';
import {
  SYSTEM_ROLES,
  effectiveSystemRolePermissions,
} from './iam-tenant-roles';
import { PrismaService } from '../prisma/prisma.service';

@ApiTags('iam-context')
@Controller('api/iam/context')
export class IamContextController {
  constructor(private readonly prisma: PrismaService) {}

  @Post('resolve')
  @UseGuards(IamJwtGuard)
  @ApiOperation({ summary: 'Résoudre le contexte IAM' })
  async resolve(
    @CurrentUser() ctx: IamAuthContext,
    @Body() _body: { source?: string },
  ) {
    const user = await this.prisma.iamUser.findUnique({
      where: { id: ctx.userId },
    });

    const effectivePermissions = ctx.permissions ?? [];

    // Phase 8 : les permissions rapportées sont celles que le RBAC a
    // effectivement résolues pour le tenant actif. On n'y ré-applique jamais
    // `ROLE_PERMISSIONS` côté code : ce serait une seconde source de vérité,
    // capable d'accorder plus que la base n'a autorisé — et de renvoyer des
    // listes vides pour les rôles tenant, que le catalogue ne connaît pas.
    const tenantRoleCodes = ctx.tenantRoleCodes ?? [];
    const isSuperAdmin = ctx.isSuperAdmin === true;

    const roles = tenantRoleCodes.map((code: string) => {
      const definition = SYSTEM_ROLES.find((role) => role.code === code);
      return {
        code,
        // Rappel du catalogue, jamais appliqué comme autorité : ce qui compte
        // est `permissions` ci-dessous, filtré par le RBAC.
        catalogPermissions: definition
          ? effectiveSystemRolePermissions(code)
          : [],
      };
    });

    return {
      success: true,
      message: 'Contexte résolu',
      data: {
        status: 'RESOLVED',
        principal: {
          userId: ctx.userId,
          username: user?.username ?? null,
          primaryEmail: user?.primaryEmail ?? null,
          displayName: user?.displayName ?? null,
        },
        roles,
        permissions: effectivePermissions.map((code) => ({ code, name: code })),
        tenant: ctx.tenantId
          ? { tenantId: ctx.tenantId, organizationId: ctx.organizationId ?? null }
          : null,
        session: {
          sessionId: ctx.sessionId,
          authenticationLevel: ctx.authenticationLevel,
        },
        isSuperAdmin,
      },
    };
  }
}