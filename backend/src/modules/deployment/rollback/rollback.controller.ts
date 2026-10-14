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
import { RollbackService } from './rollback.service';
import { CreateRollbackDto } from './dto/create-rollback.dto';
import { EnvironmentRollbackDto } from './dto/environment-rollback.dto';

@Controller()
export class RollbackController {
  constructor(private readonly rollbackService: RollbackService) {}

  @Get('api/rollbacks')
  @RequirePermission(PERMISSIONS.DEPLOYMENT_READ)
  findAll() {
    return this.rollbackService.findAll();
  }

  @Get('api/rollbacks/:id')
  @RequirePermission(PERMISSIONS.DEPLOYMENT_READ)
  findOne(@Param('id') id: string) {
    return this.rollbackService.findOne(id);
  }

  @Post('api/deployments/:id/rollback')
  @TenantResource({ table: 'deployment', idParam: 'id' })
  @RequirePermission(PERMISSIONS.DEPLOYMENT_ROLLBACK)
  rollbackDeployment(
    @Param('id') deploymentId: string,
    @Body() dto: CreateRollbackDto,
  ) {
    return this.rollbackService.rollbackDeployment(deploymentId, dto);
  }

  @Post('api/deployment/environments/:environmentId/rollback')
  @TenantResource({ table: 'environment', idParam: 'environmentId' })
  @RequirePermission(PERMISSIONS.DEPLOYMENT_ROLLBACK)
  rollbackEnvironment(
    @Param('environmentId') environmentId: string,
    @Body() dto: EnvironmentRollbackDto,
  ) {
    return this.rollbackService.rollbackEnvironment(environmentId, dto);
  }
}
