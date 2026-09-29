import { Body, Controller, Post, Param, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { IamAdminService } from './iam-admin.service';
import { IamAdminGuard } from './iam-admin-guard';
import { Permissions } from './iam-permissions.guard';
import { IAM_ADMIN } from './iam.constants';
import { CurrentUser } from './decorators/current-user.decorator';
import type { IamAuthContext } from './decorators/current-user.decorator';

@ApiTags('iam-admin-users')
@Permissions(IAM_ADMIN)
@UseGuards(IamAdminGuard)
@Controller('api/iam/admin/users')
export class IamAdminUsersController {
  constructor(private readonly adminService: IamAdminService) {}

  @Post(':id/status')
  @ApiOperation({ summary: 'Changer le statut d un utilisateur (admin)' })
  async updateStatus(
    @Param('id') id: string,
    @Body() body: { status?: string; reason?: string },
    @CurrentUser() ctx: IamAuthContext,
  ) {
    const data = await this.adminService.updateUserStatus(id, { status: body.status ?? 'ACTIVE', reason: body.reason }, ctx.userId);
    return { success: true, message: 'Statut mis à jour', data };
  }
}
