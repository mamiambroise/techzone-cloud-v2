import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { IamGovernanceService } from './iam-governance.service';
import { IamAdminGuard } from './iam-admin-guard';
import { Permissions } from './iam-permissions.guard';
import { IAM_ADMIN } from './iam.constants';
import { CurrentUser } from './decorators/current-user.decorator';
import type { IamAuthContext } from './decorators/current-user.decorator';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';

@ApiTags('iam-governance')
@Permissions(IAM_ADMIN)
@UseGuards(IamAdminGuard)
@Controller('api/iam/admin/governance/roles')
export class IamGovernanceController {
  constructor(private readonly governanceService: IamGovernanceService) {}

  @Get()
  @ApiOperation({ summary: 'Liste des rôles (admin)' })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'tenantId', required: false })
  async list(@Query('status') status?: string, @Query('search') search?: string, @Query('tenantId') tenantId?: string) {
    const data = await this.governanceService.listRoles({ status, search, tenantId });
    return { success: true, message: 'OK', data };
  }

  @Get('permissions')
  @ApiOperation({ summary: 'Liste des permissions (admin)' })
  async permissions() {
    const data = await this.governanceService.listPermissions();
    return { success: true, message: 'OK', data };
  }

  @Get('assignments')
  @ApiOperation({ summary: 'Liste des assignations de rôles (admin)' })
  @ApiQuery({ name: 'userId', required: false })
  @ApiQuery({ name: 'roleId', required: false })
  @ApiQuery({ name: 'status', required: false })
  async assignments(
    @Query('userId') userId?: string,
    @Query('roleId') roleId?: string,
    @Query('status') status?: string,
    @Query('tenantId') tenantId?: string,
  ) {
    const data = await this.governanceService.listAssignments({ userId, roleId, tenantId, status });
    return { success: true, message: 'OK', data };
  }

  @Post()
  @ApiOperation({ summary: 'Créer un rôle (admin)' })
  async create(@Body() dto: CreateRoleDto) {
    const data = await this.governanceService.createRole(dto);
    return { success: true, message: 'Rôle créé', data, statusCode: 201 };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Détail d un rôle (admin)' })
  async getOne(@Param('id') id: string) {
    const data = await this.governanceService.getRole(id);
    return { success: true, message: 'OK', data };
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Mettre à jour un rôle (admin)' })
  async update(@Param('id') id: string, @Body() dto: UpdateRoleDto) {
    const data = await this.governanceService.updateRole(id, dto);
    return { success: true, message: 'Rôle mis à jour', data };
  }

  @Post(':id/permissions/:permissionId')
  @ApiOperation({ summary: 'Assigner une permission à un rôle (admin)' })
  async assignPermission(@Param('id') roleId: string, @Param('permissionId') permissionId: string, @CurrentUser() ctx: IamAuthContext) {
    const data = await this.governanceService.assignPermission(roleId, permissionId, ctx.userId);
    return { success: true, message: 'Permission assignée', data };
  }

  @Delete(':id/permissions/:permissionId')
  @ApiOperation({ summary: 'Révoquer une permission d un rôle (admin)' })
  async revokePermission(@Param('id') roleId: string, @Param('permissionId') permissionId: string, @CurrentUser() ctx: IamAuthContext) {
    return this.governanceService.revokePermission(roleId, permissionId, ctx.userId);
  }

  @Post('assignments/:id/revoke')
  @ApiOperation({ summary: 'Révoquer une assignation de rôle (admin)' })
  async revokeAssignment(@Param('id') assignmentId: string, @CurrentUser() ctx: IamAuthContext) {
    return this.governanceService.revokeAssignment(assignmentId, ctx.userId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Supprimer un rôle (admin)' })
  async remove(@Param('id') id: string, @CurrentUser() ctx: IamAuthContext) {
    return this.governanceService.deleteRole(id, ctx.userId);
  }
}
