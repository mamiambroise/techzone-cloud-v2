import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { IamPoliciesService } from './iam-policies.service';
import { IamAdminGuard } from './iam-admin-guard';
import { Permissions } from './iam-permissions.guard';
import { IAM_ADMIN } from './iam.constants';
import { CreatePolicyDto } from './dto/create-policy.dto';
import { UpdatePolicyDto } from './dto/update-policy.dto';

@ApiTags('iam-policies')
@Permissions(IAM_ADMIN)
@UseGuards(IamAdminGuard)
@Controller('api/iam/policies')
export class IamPoliciesController {
  constructor(private readonly policiesService: IamPoliciesService) {}

  @Get()
  @ApiOperation({ summary: 'Liste des policies IAM (admin)' })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'tenantId', required: false })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  async list(
    @Query('status') status?: string,
    @Query('search') search?: string,
    @Query('tenantId') tenantId?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const data = await this.policiesService.listPolicies({
      status, search, tenantId,
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
    });
    return { success: true, message: 'OK', data };
  }

  @Post()
  @ApiOperation({ summary: 'Créer une policy IAM (admin)' })
  async create(@Body() dto: CreatePolicyDto) {
    const data = await this.policiesService.createPolicy(dto);
    return { success: true, message: 'Policy créée', data, statusCode: 201 };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Détail d une policy IAM (admin)' })
  async getOne(@Param('id') id: string) {
    const data = await this.policiesService.getPolicy(id);
    return { success: true, message: 'OK', data };
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Mettre à jour une policy IAM (admin)' })
  async update(@Param('id') id: string, @Body() dto: UpdatePolicyDto) {
    const data = await this.policiesService.updatePolicy(id, dto);
    return { success: true, message: 'Policy mise à jour', data };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Supprimer une policy IAM (admin)' })
  async remove(@Param('id') id: string) {
    return this.policiesService.deletePolicy(id);
  }
}
