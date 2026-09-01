import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';

import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';

import { ApplicationService } from './application.service';
import { CreateApplicationDto } from './dto/create-application.dto';
import { UpdateApplicationDto } from './dto/update-application.dto';
import { ApplicationQueryDto } from './dto/application-query.dto';

import { AuthGuard } from '../../../common/guards/auth.guard';
import { PermissionGuard } from '../../../common/guards/permission.guard';

import { Permissions } from '../../../common/decorators/permissions.decorator';

import { User } from '../../../common/decorators/user.decorator';
import type { UserContext } from '../../../common/decorators/user.decorator';

import { Permission } from '../../../common/enums';

@ApiTags('Applications')
@ApiBearerAuth()
@Controller('api/v1/business-manager/applications')
@UseGuards(AuthGuard, PermissionGuard)
export class ApplicationController {
  constructor(
    private readonly applicationService: ApplicationService,
  ) {}

  @Post()
  @Permissions(Permission.APPLICATION_CREATE)
  @ApiOperation({
    summary: 'Créer une nouvelle application',
  })
  @ApiResponse({
    status: 201,
    description: 'Application créée avec succès',
  })
  @ApiResponse({
    status: 400,
    description: 'Données invalides',
  })
  @ApiResponse({
    status: 409,
    description: 'Code déjà utilisé',
  })
  async create(
    @Body() createDto: CreateApplicationDto,
    @User() user: UserContext,
  ) {
    return this.applicationService.create({
      ...createDto,
      createdBy: user.id,
    });
  }

  @Get()
  @Permissions(Permission.APPLICATION_READ)
  @ApiOperation({
    summary: 'Lister les applications',
  })
  @ApiResponse({
    status: 200,
    description: 'Liste des applications',
  })
  async findAll(
    @Query() query: ApplicationQueryDto,
  ) {
    return this.applicationService.findAll(query);
  }

  @Get('stats')
  @Permissions(Permission.APPLICATION_READ)
  @ApiOperation({
    summary: 'Statistiques du dashboard',
  })
  @ApiResponse({
    status: 200,
    description: 'Statistiques',
  })
  async getDashboardStats() {
    return this.applicationService.getDashboardStats();
  }

  @Get('recent')
  @Permissions(Permission.APPLICATION_READ)
  @ApiOperation({
    summary: 'Applications récentes',
  })
  @ApiResponse({
    status: 200,
    description: 'Applications récentes',
  })
  async getRecentApplications() {
    return this.applicationService.getRecentApplications(5);
  }

  @Get(':id')
  @Permissions(Permission.APPLICATION_READ)
  @ApiOperation({
    summary: 'Obtenir une application par ID',
  })
  @ApiResponse({
    status: 200,
    description: 'Application trouvée',
  })
  @ApiResponse({
    status: 404,
    description: 'Application non trouvée',
  })
  async findById(
    @Param('id') id: string,
  ) {
    return this.applicationService.findById(id);
  }

  @Patch(':id')
  @Permissions(Permission.APPLICATION_UPDATE)
  @ApiOperation({
    summary: 'Modifier une application',
  })
  @ApiResponse({
    status: 200,
    description: 'Application modifiée',
  })
  @ApiResponse({
    status: 404,
    description: 'Application non trouvée',
  })
  async update(
    @Param('id') id: string,
    @Body() updateDto: UpdateApplicationDto,
    @User() user: UserContext,
  ) {
    return this.applicationService.update(
      id,
      updateDto,
      user.id,
    );
  }

  @Post(':id/archive')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Permissions(Permission.APPLICATION_ARCHIVE)
  @ApiOperation({
    summary: 'Archiver une application',
  })
  @ApiResponse({
    status: 204,
    description: 'Application archivée',
  })
  @ApiResponse({
    status: 404,
    description: 'Application non trouvée',
  })
  async archive(
    @Param('id') id: string,
    @User() user: UserContext,
  ): Promise<void> {
    await this.applicationService.archive(
      id,
      user.id,
    );
  }
}