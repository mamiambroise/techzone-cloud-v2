import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { IamAdminService } from './iam-admin.service';
import { IamAdminGuard } from './iam-admin-guard';
import { Permissions } from './iam-permissions.guard';
import { IAM_ADMIN } from './iam.constants';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserStatusDto } from './dto/update-user-status.dto';
import { CurrentUser } from './decorators/current-user.decorator';
import type { IamAuthContext } from './decorators/current-user.decorator';

@ApiTags('iam-users')
@Permissions(IAM_ADMIN)
@UseGuards(IamAdminGuard)
@Controller('api/iam/users')
export class IamUsersController {
  constructor(private readonly adminService: IamAdminService) {}

  @Get()
  @ApiOperation({ summary: 'Lister les utilisateurs IAM (admin)' })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'search', required: false })
  async list(@Query('status') status?: string, @Query('search') search?: string) {
    const data = await this.adminService.listUsers(status, search);
    return { success: true, message: 'OK', data };
  }

  @Get('stats')
  @ApiOperation({ summary: 'Statistiques IAM (admin)' })
  async stats() {
    const data = await this.adminService.stats();
    return { success: true, message: 'OK', data };
  }

  @Post()
  @ApiOperation({ summary: 'Créer un utilisateur IAM (admin)' })
  async create(@Body() dto: CreateUserDto) {
    const data = await this.adminService.createUser(dto);
    return { success: true, message: 'Utilisateur créé', data };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Détail d un utilisateur IAM (admin)' })
  async getOne(@Param('id') id: string) {
    const data = await this.adminService.getUserById(id);
    return { success: true, message: 'OK', data };
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Modifier le statut d un utilisateur (admin)' })
  async updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateUserStatusDto,
    @CurrentUser() ctx: IamAuthContext,
  ) {
    const data = await this.adminService.updateUserStatus(id, dto, ctx.userId);
    return { success: true, message: 'Statut mis à jour', data };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Supprimer un utilisateur IAM (admin)' })
  async remove(@Param('id') id: string, @CurrentUser() ctx: IamAuthContext) {
    return this.adminService.deleteUser(id, ctx.userId);
  }
}

