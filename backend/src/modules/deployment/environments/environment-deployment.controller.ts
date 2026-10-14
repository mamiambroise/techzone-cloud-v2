import {
  Body,
  Controller,
  Get,
  Param,
  Post,
} from '@nestjs/common';
import { RequirePermission } from '../../../iam/permission.decorator';
import { PERMISSIONS } from '../../../iam/iam.constants';
import { TenantResource } from '../../../iam/tenant-resource.decorator';
import { EnvironmentDeploymentService } from './environment-deployment.service';
import { PromoteReleaseDto } from './dto/promote-release.dto';
import { LockEnvironmentDto } from './dto/lock-environment.dto';

@Controller('api/deployment/environments')
@TenantResource({ table: 'environment', idParam: 'environmentId' })
export class EnvironmentDeploymentController {
  constructor(
    private readonly envDeploymentService: EnvironmentDeploymentService,
  ) {}

  @Get()
  @RequirePermission(PERMISSIONS.ENVIRONMENT_READ)
  findAll() {
    return this.envDeploymentService.findAll();
  }

  @Post('promote')
  @RequirePermission(PERMISSIONS.DEPLOYMENT_EXECUTE)
  promote(@Body() dto: PromoteReleaseDto) {
    return this.envDeploymentService.promote(dto);
  }

  @Get(':environmentId/status')
  @RequirePermission(PERMISSIONS.ENVIRONMENT_READ)
  getStatus(@Param('environmentId') environmentId: string) {
    return this.envDeploymentService.getStatus(environmentId);
  }

  @Post(':environmentId/lock')
  @RequirePermission(PERMISSIONS.ENVIRONMENT_UPDATE)
  lock(
    @Param('environmentId') environmentId: string,
    @Body() dto: LockEnvironmentDto,
  ) {
    return this.envDeploymentService.lock(environmentId, dto);
  }

  @Post(':environmentId/unlock')
  @RequirePermission(PERMISSIONS.ENVIRONMENT_UPDATE)
  unlock(
    @Param('environmentId') environmentId: string,
    @Body('actor') actor?: string,
  ) {
    return this.envDeploymentService.unlock(environmentId, actor);
  }

  @Get(':environmentId/drift')
  @RequirePermission(PERMISSIONS.DEPLOYMENT_DIAGNOSTICS)
  detectDrift(@Param('environmentId') environmentId: string) {
    return this.envDeploymentService.detectDrift(environmentId);
  }
}
