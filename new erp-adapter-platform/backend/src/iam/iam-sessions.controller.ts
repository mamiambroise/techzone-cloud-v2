import { Controller, Delete, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { IamAdminService } from './iam-admin.service';
import { IamAdminGuard } from './iam-admin-guard';
import { CurrentUser, IamAuthContext } from './decorators/current-user.decorator';

@ApiTags('iam-sessions')
@UseGuards(IamAdminGuard)
@Controller('iam/sessions')
export class IamSessionsController {
  constructor(private readonly adminService: IamAdminService) {}

  @Get()
  @ApiOperation({ summary: 'Lister toutes les sessions IAM (admin)' })
  @ApiQuery({ name: 'status', required: false })
  async list(@Query('status') status?: string) {
    const data = await this.adminService.listSessions(status);
    return { success: true, message: 'OK', data };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Révoquer une session (admin)' })
  async revoke(@Param('id') id: string, @CurrentUser() ctx: IamAuthContext) {
    return this.adminService.revokeSession(id, ctx.userId);
  }
}