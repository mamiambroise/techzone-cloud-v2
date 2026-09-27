import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { IamIdentityService } from './iam-identity.service';
import { IamAdminGuard } from './iam-admin-guard';
import { CreateIdentityDto } from './dto/create-identity.dto';
import { UpdateIdentityDto } from './dto/update-identity.dto';

@ApiTags('iam-identity')
@UseGuards(IamAdminGuard)
@Controller('api/iam/identities')
export class IamIdentitiesController {
  constructor(private readonly identityService: IamIdentityService) {}

  @Get()
  @ApiOperation({ summary: 'Liste des identités (admin)' })
  @ApiQuery({ name: 'type', required: false })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'userId', required: false })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  async list(
    @Query('type') type?: string,
    @Query('status') status?: string,
    @Query('search') search?: string,
    @Query('userId') userId?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const data = await this.identityService.listIdentities({
      type, status, search, userId,
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
    });
    return { success: true, message: 'OK', data };
  }

  @Post()
  @ApiOperation({ summary: 'Créer une identité (admin)' })
  async create(@Body() dto: CreateIdentityDto) {
    const data = await this.identityService.createIdentity(dto);
    return { success: true, message: 'Identity créée', data, statusCode: 201 };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Détail d une identité (admin)' })
  async getOne(@Param('id') id: string) {
    const data = await this.identityService.getIdentity(id);
    return { success: true, message: 'OK', data };
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Mettre à jour une identité (admin)' })
  async update(@Param('id') id: string, @Body() dto: UpdateIdentityDto) {
    const data = await this.identityService.updateIdentity(id, dto);
    return { success: true, message: 'Identity mise à jour', data };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Supprimer une identité (admin)' })
  async remove(@Param('id') id: string) {
    return this.identityService.deleteIdentity(id);
  }
}
