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
import {
  CurrentUser,
  type IamAuthContext,
} from '../../../iam/decorators/current-user.decorator';
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
  findAll(@CurrentUser() principal: IamAuthContext) {
    return this.envDeploymentService.findAll(principal);
  }

  @Post('promote')
  @RequirePermission(PERMISSIONS.DEPLOYMENT_EXECUTE)
  promote(
    @Body() dto: PromoteReleaseDto,
    @CurrentUser() principal: IamAuthContext,
  ) {
    return this.envDeploymentService.promote(dto, principal);
  }

  @Get(':environmentId/status')
  @RequirePermission(PERMISSIONS.ENVIRONMENT_READ)
  getStatus(
    @Param('environmentId') environmentId: string,
    @CurrentUser() principal: IamAuthContext,
  ) {
    return this.envDeploymentService.getStatus(environmentId, principal);
  }

  @Post(':environmentId/lock')
  @RequirePermission(PERMISSIONS.ENVIRONMENT_UPDATE)
  lock(
    @Param('environmentId') environmentId: string,
    @Body() dto: LockEnvironmentDto,
    @CurrentUser() principal: IamAuthContext,
  ) {
    return this.envDeploymentService.lock(environmentId, dto, principal);
  }

  @Post(':environmentId/unlock')
  @RequirePermission(PERMISSIONS.ENVIRONMENT_UPDATE)
  unlock(
    @Param('environmentId') environmentId: string,
    @CurrentUser() principal: IamAuthContext,
  ) {
    return this.envDeploymentService.unlock(environmentId, principal);
  }

  @Get(':environmentId/drift')
  @RequirePermission(PERMISSIONS.DEPLOYMENT_DIAGNOSTICS)
  detectDrift(
    @Param('environmentId') environmentId: string,
    @CurrentUser() principal: IamAuthContext,
  ) {
    return this.envDeploymentService.detectDrift(environmentId, principal);
  }
}
