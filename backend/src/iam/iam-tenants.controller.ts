import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { IamTenantsService } from './iam-tenants.service';
import { IamAdminGuard } from './iam-admin-guard';
import { CurrentUser } from './decorators/current-user.decorator';
import type { IamAuthContext } from './decorators/current-user.decorator';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { UpdateTenantDto } from './dto/update-tenant.dto';

@ApiTags('iam-tenants')
@UseGuards(IamAdminGuard)
@Controller('api/iam/admin/tenants')
export class IamTenantsController {
  constructor(private readonly tenantsService: IamTenantsService) {}

  @Get()
  @ApiOperation({ summary: 'Liste des tenants IAM (admin)' })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  async list(
    @Query('status') status?: string,
    @Query('search') search?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const data = await this.tenantsService.listTenants({
      status, search,
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
    });
    return { success: true, message: 'OK', data };
  }

  @Post()
  @ApiOperation({ summary: 'Créer un tenant IAM (admin)' })
  async create(@Body() dto: CreateTenantDto) {
    const data = await this.tenantsService.createTenant(dto);
    return { success: true, message: 'Tenant créé', data, statusCode: 201 };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Détail d un tenant IAM (admin)' })
  async getOne(@Param('id') id: string) {
    const data = await this.tenantsService.getTenant(id);
    return { success: true, message: 'OK', data };
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Mettre à jour un tenant IAM (admin)' })
  async update(@Param('id') id: string, @Body() dto: UpdateTenantDto, @CurrentUser() ctx: IamAuthContext) {
    const data = await this.tenantsService.updateTenant(id, dto, ctx.userId);
    return { success: true, message: 'Tenant mis à jour', data };
  }

  @Post(':id/status')
  @ApiOperation({ summary: 'Changer le statut d un tenant (admin)' })
  async updateStatus(@Param('id') id: string, @Body() body: { status: string; reason?: string }, @CurrentUser() ctx: IamAuthContext) {
    const data = await this.tenantsService.updateTenant(id, { status: body.status, reason: body.reason }, ctx.userId);
    return { success: true, message: 'Statut mis à jour', data };
  }

  @Get(':id/memberships')
  @ApiOperation({ summary: 'Memberships d un tenant (admin)' })
  async memberships(@Param('id') id: string) {
    const data = await this.tenantsService.getTenantMemberships(id);
    return { success: true, message: 'OK', data };
  }

  @Get(':id/subscriptions')
  @ApiOperation({ summary: 'Subscriptions d un tenant (admin)' })
  async subscriptions(@Param('id') id: string) {
    const data = await this.tenantsService.getTenantSubscriptions(id);
    return { success: true, message: 'OK', data };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Supprimer un tenant IAM (admin)' })
  async remove(@Param('id') id: string) {
    return this.tenantsService.deleteTenant(id);
  }
}
