import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { IamJwtGuard } from './iam-jwt.guard';
import { CurrentUser } from './decorators/current-user.decorator';
import type { IamAuthContext } from './decorators/current-user.decorator';
import { ROLES, ROLE_PERMISSIONS } from './iam.constants';
import { PrismaService } from '../prisma/prisma.service';

@ApiTags('iam-context')
@Controller('api/iam/context')
export class IamContextController {
  constructor(private readonly prisma: PrismaService) {}

  @Post('resolve')
  @UseGuards(IamJwtGuard)
  @ApiOperation({ summary: 'Résoudre le contexte IAM' })
  async resolve(@CurrentUser() ctx: IamAuthContext, @Body() _body: { source?: string }) {
    const user = await this.prisma.iamUser.findUnique({ where: { id: ctx.userId } });

    const roles = ctx.roles ?? [ROLES.USER];
    const rolePermissions: Record<string, string[]> = {};
    for (const role of roles) {
      rolePermissions[role] = ROLE_PERMISSIONS[role] ?? [];
    }

    const permissions = (ctx.permissions ?? []).map((code) => ({ code, name: code }));

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
        roles: roles.map((code) => ({ code, permissions: rolePermissions[code] ?? [] })),
        permissions,
        tenant: ctx.tenantId ? { tenantId: ctx.tenantId, organizationId: ctx.organizationId ?? null } : null,
        session: {
          sessionId: ctx.sessionId,
          authenticationLevel: ctx.authenticationLevel,
        },
        isSuperAdmin: user?.isAdmin ?? false,
      },
    };
  }
}
