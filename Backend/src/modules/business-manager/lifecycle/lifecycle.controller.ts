import {
  Controller,
  Get,
  Post,
  Param,
  Body,
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

import { LifecycleService } from './lifecycle.service';
import { TransitionDto } from './dto/transition.dto';

import { AuthGuard } from '../../../common/guards/auth.guard';
import { PermissionGuard } from '../../../common/guards/permission.guard';

import { Permissions } from '../../../common/decorators/permissions.decorator';

import { User } from '../../../common/decorators/user.decorator';
import type { UserContext } from '../../../common/decorators/user.decorator';

import {
  Permission,
  ApplicationStatus,
} from '../../../common/enums';

@ApiTags('Lifecycle')
@ApiBearerAuth()
@Controller('api/v1/business-manager/applications/:applicationId')
@UseGuards(AuthGuard, PermissionGuard)
export class LifecycleController {
  constructor(
    private readonly lifecycleService: LifecycleService,
  ) {}

  @Get('transitions')
  @Permissions(Permission.APPLICATION_READ)
  @ApiOperation({
    summary: 'Obtenir les transitions autorisées',
  })
  @ApiResponse({
    status: 200,
    description: 'Transitions disponibles',
  })
  async getTransitions(
    @Param('applicationId') applicationId: string,
  ) {
    return this.lifecycleService.getAllowedTransitions(
      applicationId,
    );
  }

  @Post('transition')
  @HttpCode(HttpStatus.OK)
  @Permissions(Permission.APPLICATION_UPDATE)
  @ApiOperation({
    summary: "Changer le statut de l'application",
  })
  @ApiResponse({
    status: 200,
    description: 'Transition effectuée',
  })
  @ApiResponse({
    status: 400,
    description: 'Transition non autorisée',
  })
  async transition(
    @Param('applicationId') applicationId: string,
    @Body() transitionDto: TransitionDto,
    @User() user: UserContext,
  ) {
    return this.lifecycleService.transition(
      applicationId,
      transitionDto.targetStatus as ApplicationStatus,
      user.id,
    );
  }
}