import {
  Body,
  Controller,
  Get,
  Param,
  Post,
} from '@nestjs/common';
import { RollbackService } from './rollback.service';
import { CreateRollbackDto } from './dto/create-rollback.dto';
import { EnvironmentRollbackDto } from './dto/environment-rollback.dto';

@Controller()
export class RollbackController {
  constructor(private readonly rollbackService: RollbackService) {}

  @Get('api/rollbacks')
  findAll() {
    return this.rollbackService.findAll();
  }

  @Get('api/rollbacks/:id')
  findOne(@Param('id') id: string) {
    return this.rollbackService.findOne(id);
  }

  @Post('api/deployments/:id/rollback')
  rollbackDeployment(
    @Param('id') deploymentId: string,
    @Body() dto: CreateRollbackDto,
  ) {
    return this.rollbackService.rollbackDeployment(deploymentId, dto);
  }

  @Post('api/deployment/environments/:environmentId/rollback')
  rollbackEnvironment(
    @Param('environmentId') environmentId: string,
    @Body() dto: EnvironmentRollbackDto,
  ) {
    return this.rollbackService.rollbackEnvironment(environmentId, dto);
  }
}
