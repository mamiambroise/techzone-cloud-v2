import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  UseGuards,
  HttpCode,
} from '@nestjs/common';

import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';

import { PublicationService } from './publication.service';
import { PublishDto } from './dto/publish.dto';

import { AuthGuard } from '../../../common/guards/auth.guard';
import { PermissionGuard } from '../../../common/guards/permission.guard';

import { Permissions } from '../../../common/decorators/permissions.decorator';

import { User } from '../../../common/decorators/user.decorator';
import type { UserContext } from '../../../common/decorators/user.decorator';

import { Permission } from '../../../common/enums';

@ApiTags('Publication')
@ApiBearerAuth()
@Controller('api/v1/business-manager/applications/:applicationId')
@UseGuards(AuthGuard, PermissionGuard)
export class PublicationController {
  constructor(
    private readonly publicationService: PublicationService,
  ) {}

  @Post('versions/:versionId/publish')
  @HttpCode(200)
  @Permissions(Permission.PUBLISH)
  @ApiOperation({
    summary: 'Publier une version',
  })
  @ApiResponse({
    status: 200,
    description: 'Publication réussie',
  })
  @ApiResponse({
    status: 400,
    description: 'Validation échouée',
  })
  @ApiResponse({
    status: 404,
    description: 'Application ou version non trouvée',
  })
  async publish(
    @Param('applicationId') applicationId: string,
    @Param('versionId') versionId: string,
    @Body() publishDto: PublishDto,
    @User() user: UserContext,
  ) {
    return this.publicationService.publish(
      applicationId,
      versionId,
      publishDto,
      user.id,
    );
  }

  @Get('publications')
  @Permissions(Permission.APPLICATION_READ)
  @ApiOperation({
    summary: "Historique des publications",
  })
  @ApiResponse({
    status: 200,
    description: 'Historique',
  })
  async getPublicationHistory(
    @Param('applicationId') applicationId: string,
  ) {
    return this.publicationService.getPublicationHistory(
      applicationId,
    );
  }
}