import {
  Controller,
  Post,
  Param,
  UseGuards,
  HttpCode,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { ValidationService } from './validation.service';
import { AuthGuard } from '../../../common/guards/auth.guard';
import { PermissionGuard } from '../../../common/guards/permission.guard';
import { Permissions } from '../../../common/decorators/permissions.decorator';
import { Permission } from '../../../common/enums';

@ApiTags('Validation')
@ApiBearerAuth()
@Controller('api/v1/business-manager/applications/:applicationId/versions/:versionId')
@UseGuards(AuthGuard, PermissionGuard)
export class ValidationController {
  constructor(private readonly validationService: ValidationService) {}

  @Post('validate')
  @HttpCode(200)
  @Permissions(Permission.VALIDATE)
  @ApiOperation({ summary: 'Valider une version' })
  @ApiResponse({ status: 200, description: 'Résultat de validation' })
  @ApiResponse({ status: 404, description: 'Application ou version non trouvée' })
  async validate(
    @Param('applicationId') applicationId: string,
    @Param('versionId') versionId: string,
  ) {
    return this.validationService.validate(applicationId, versionId);
  }
}