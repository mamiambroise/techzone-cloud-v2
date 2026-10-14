import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  ForbiddenException,
} from '@nestjs/common';
import { CurrentUser } from '../../../iam/decorators/current-user.decorator';
import type { IamAuthContext } from '../../../iam/decorators/current-user.decorator';
import { Permissions } from '../../../iam/iam-permissions.guard';
import { PERMISSIONS } from '../../../iam/iam.constants';
import { EnvironmentDeploymentService } from './environment-deployment.service';
import { PromoteReleaseDto } from './dto/promote-release.dto';
import { LockEnvironmentDto } from './dto/lock-environment.dto';

@Controller('api/deployment/environments')
export class EnvironmentDeploymentController {
  constructor(
    private readonly envDeploymentService: EnvironmentDeploymentService,
  ) {}

  @Get()
  @Permissions(PERMISSIONS.ENVIRONMENT_READ)
  findAll(@CurrentUser() principal: IamAuthContext) {
    if (!principal.tenantId) throw new ForbiddenException('Tenant context required');
    return this.envDeploymentService.findAll(principal.tenantId);
  }

  @Post('promote')
  @Permissions(PERMISSIONS.DEPLOYMENT_CREATE, PERMISSIONS.DEPLOYMENT_EXECUTE)
  promote(
    @Body() dto: PromoteReleaseDto,
    @CurrentUser() principal: IamAuthContext,
  ) {
    if (!principal.tenantId) throw new ForbiddenException('Tenant context required');
    return this.envDeploymentService.promote(dto, principal.tenantId, principal.userId);
  }

  @Get(':environmentId/status')
  @Permissions(PERMISSIONS.ENVIRONMENT_READ)
  getStatus(
    @Param('environmentId') environmentId: string,
    @CurrentUser() principal: IamAuthContext,
  ) {
    if (!principal.tenantId) throw new ForbiddenException('Tenant context required');
    return this.envDeploymentService.getStatus(environmentId, principal.tenantId);
  }

  @Post(':environmentId/lock')
  @Permissions(PERMISSIONS.ENVIRONMENT_UPDATE)
  lock(
    @Param('environmentId') environmentId: string,
    @Body() dto: LockEnvironmentDto,
    @CurrentUser() principal: IamAuthContext,
  ) {
    if (!principal.tenantId) throw new ForbiddenException('Tenant context required');
    return this.envDeploymentService.lock(environmentId, dto, principal.tenantId, principal.userId);
  }

  @Post(':environmentId/unlock')
  @Permissions(PERMISSIONS.ENVIRONMENT_UPDATE)
  unlock(
    @Param('environmentId') environmentId: string,
    @CurrentUser() principal: IamAuthContext,
  ) {
    if (!principal.tenantId) throw new ForbiddenException('Tenant context required');
    return this.envDeploymentService.unlock(environmentId, principal.tenantId, principal.userId);
  }

  @Get(':environmentId/drift')
  @Permissions(PERMISSIONS.ENVIRONMENT_READ)
  detectDrift(
    @Param('environmentId') environmentId: string,
    @CurrentUser() principal: IamAuthContext,
  ) {
    if (!principal.tenantId) throw new ForbiddenException('Tenant context required');
    return this.envDeploymentService.detectDrift(environmentId, principal.tenantId);
  }
}
