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
import { GateService } from './gate.service';
import { EvaluateGateDto } from './dto/evaluate-gate.dto';
import { ApproveGateDto } from './dto/approve-gate.dto';
import { BypassGateDto } from './dto/bypass-gate.dto';

@Controller('api/deployments/:id/gates')
@TenantResource({ table: 'deployment', idParam: 'id' })
export class GateController {
  constructor(private readonly gateService: GateService) {}

  @Get()
  @RequirePermission(PERMISSIONS.DEPLOYMENT_READ)
  findByDeployment(
    @Param('id') deploymentId: string,
    @CurrentUser() principal: IamAuthContext,
  ) {
    return this.gateService.findByDeployment(deploymentId, principal);
  }

  @Post('evaluate')
  @RequirePermission(PERMISSIONS.DEPLOYMENT_EXECUTE)
  evaluate(
    @Param('id') deploymentId: string,
    @Body() _dto: EvaluateGateDto,
    @CurrentUser() principal: IamAuthContext,
  ) {
    return this.gateService.evaluate(deploymentId, principal);
  }

  @Post(':gateId/approve')
  @RequirePermission(PERMISSIONS.DEPLOYMENT_EXECUTE)
  approve(
    @Param('id') deploymentId: string,
    @Param('gateId') gateId: string,
    @Body() dto: ApproveGateDto,
    @CurrentUser() principal: IamAuthContext,
  ) {
    return this.gateService.approve(deploymentId, gateId, dto, principal);
  }

  @Post(':gateId/bypass')
  @RequirePermission(PERMISSIONS.DEPLOYMENT_EXECUTE)
  bypass(
    @Param('id') deploymentId: string,
    @Param('gateId') gateId: string,
    @Body() dto: BypassGateDto,
    @CurrentUser() principal: IamAuthContext,
  ) {
    return this.gateService.bypass(deploymentId, gateId, dto, principal);
  }
}
