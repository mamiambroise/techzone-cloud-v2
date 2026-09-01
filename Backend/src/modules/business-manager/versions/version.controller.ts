import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';

import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';

import { VersionService } from './version.service';
import { CreateVersionDto } from './dto/create-version.dto';
import { VersionQueryDto } from './dto/version-query.dto';

import { AuthGuard } from '../../../common/guards/auth.guard';
import { PermissionGuard } from '../../../common/guards/permission.guard';

import { Permissions } from '../../../common/decorators/permissions.decorator';

import { User } from '../../../common/decorators/user.decorator';
import type { UserContext } from '../../../common/decorators/user.decorator';

import { Permission } from '../../../common/enums';

@ApiTags('Versions')
@ApiBearerAuth()
@Controller(
  'api/v1/business-manager/applications/:applicationId/versions',
)
@UseGuards(AuthGuard, PermissionGuard)
export class VersionController {
  constructor(
    private readonly versionService: VersionService,
  ) {}

  @Get()
  @Permissions(Permission.VERSION_READ)
  @ApiOperation({
    summary: 'Lister les versions',
  })
  @ApiResponse({
    status: 200,
    description: 'Liste des versions',
  })
  async getVersions(
    @Param('applicationId') applicationId: string,
    @Query() query: VersionQueryDto,
  ) {
    return this.versionService.getVersions(
      applicationId,
    );
  }

  @Post()
  @Permissions(Permission.VERSION_CREATE)
  @ApiOperation({
    summary: 'Créer une nouvelle version',
  })
  @ApiResponse({
    status: 201,
    description: 'Version créée',
  })
  @ApiResponse({
    status: 400,
    description: 'Données invalides',
  })
  @ApiResponse({
    status: 409,
    description: 'Version existe déjà',
  })
  async createVersion(
    @Param('applicationId') applicationId: string,
    @Body() createDto: CreateVersionDto,
    @User() user: UserContext,
  ) {
    return this.versionService.createVersion(
      applicationId,
      createDto,
      user.id,
    );
  }

  @Get('published')
  @Permissions(Permission.VERSION_READ)
  @ApiOperation({
    summary: 'Obtenir la version publiée',
  })
  @ApiResponse({
    status: 200,
    description: 'Version publiée',
  })
  async getPublishedVersion(
    @Param('applicationId') applicationId: string,
  ) {
    return this.versionService.getPublishedVersion(
      applicationId,
    );
  }

  @Get('draft')
  @Permissions(Permission.VERSION_READ)
  @ApiOperation({
    summary: 'Obtenir la version en préparation',
  })
  @ApiResponse({
    status: 200,
    description: 'Version en préparation',
  })
  async getDraftVersion(
    @Param('applicationId') applicationId: string,
  ) {
    return this.versionService.getDraftVersion(
      applicationId,
    );
  }

  @Get(':versionId')
  @Permissions(Permission.VERSION_READ)
  @ApiOperation({
    summary: 'Obtenir une version',
  })
  @ApiResponse({
    status: 200,
    description: 'Version trouvée',
  })
  @ApiResponse({
    status: 404,
    description: 'Version non trouvée',
  })
  async getVersion(
    @Param('versionId') versionId: string,
  ) {
    return this.versionService.findById(versionId);
  }

  @Get(':versionId/snapshot')
  @Permissions(Permission.VERSION_READ)
  @ApiOperation({
    summary: "Obtenir le snapshot d'une version",
  })
  @ApiResponse({
    status: 200,
    description: 'Snapshot',
  })
  async getSnapshot(
    @Param('versionId') versionId: string,
  ) {
    return this.versionService.getVersionSnapshot(
      versionId,
    );
  }

  @Get(':versionId/compare/:otherVersionId')
  @Permissions(Permission.VERSION_READ)
  @ApiOperation({
    summary: 'Comparer deux versions',
  })
  @ApiResponse({
    status: 200,
    description: 'Différences',
  })
  async compareVersions(
    @Param('applicationId') applicationId: string,
    @Param('versionId') versionId: string,
    @Param('otherVersionId') otherVersionId: string,
  ) {
    return this.versionService.compareVersions(
      applicationId,
      versionId,
      otherVersionId,
    );
  }
}