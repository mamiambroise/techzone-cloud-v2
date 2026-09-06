import {
  Body,
  Controller,
  Get,
  Param,
  Post,
} from '@nestjs/common';
import { EnvironmentDeploymentService } from './environment-deployment.service';
import { PromoteReleaseDto } from './dto/promote-release.dto';
import { LockEnvironmentDto } from './dto/lock-environment.dto';

@Controller('api/deployment/environments')
export class EnvironmentDeploymentController {
  constructor(
    private readonly envDeploymentService: EnvironmentDeploymentService,
  ) {}

  @Get()
  findAll() {
    return this.envDeploymentService.findAll();
  }

  @Post('promote')
  promote(@Body() dto: PromoteReleaseDto) {
    return this.envDeploymentService.promote(dto);
  }

  @Get(':environmentId/status')
  getStatus(@Param('environmentId') environmentId: string) {
    return this.envDeploymentService.getStatus(environmentId);
  }

  @Post(':environmentId/lock')
  lock(
    @Param('environmentId') environmentId: string,
    @Body() dto: LockEnvironmentDto,
  ) {
    return this.envDeploymentService.lock(environmentId, dto);
  }

  @Post(':environmentId/unlock')
  unlock(
    @Param('environmentId') environmentId: string,
    @Body('actor') actor?: string,
  ) {
    return this.envDeploymentService.unlock(environmentId, actor);
  }

  @Get(':environmentId/drift')
  detectDrift(@Param('environmentId') environmentId: string) {
    return this.envDeploymentService.detectDrift(environmentId);
  }
}
