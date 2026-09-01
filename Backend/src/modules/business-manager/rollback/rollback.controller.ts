import {
  Controller,
  Post,
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

import { RollbackService } from './rollback.service';
import { RollbackDto } from './dto/rollback.dto';

import { AuthGuard } from '../../../common/guards/auth.guard';
import { PermissionGuard } from '../../../common/guards/permission.guard';

import { Permissions } from '../../../common/decorators/permissions.decorator';

import { User } from '../../../common/decorators/user.decorator';
import type { UserContext } from '../../../common/decorators/user.decorator';

import { Permission } from '../../../common/enums';

@ApiTags('Rollback')
@ApiBearerAuth()
@Controller(
  'api/v1/business-manager/applications/:applicationId/rollback',
)
@UseGuards(AuthGuard, PermissionGuard)
export class RollbackController {
  constructor(
    private readonly rollbackService: RollbackService,
  ) {}

  @Post()
  @HttpCode(200)
  @Permissions(Permission.ROLLBACK)
  @ApiOperation({
    summary: 'Effectuer un rollback',
  })
  @ApiResponse({
    status: 200,
    description: 'Rollback réussi',
  })
  @ApiResponse({
    status: 400,
    description: 'Rollback impossible',
  })
  @ApiResponse({
    status: 404,
    description: 'Application ou version non trouvée',
  })
  async rollback(
    @Param('applicationId') applicationId: string,
    @Body() rollbackDto: RollbackDto,
    @User() user: UserContext,
  ) {
    return this.rollbackService.rollback(
      applicationId,
      rollbackDto,
      user.id,
    );
  }
}