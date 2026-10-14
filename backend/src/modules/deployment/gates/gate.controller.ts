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
  findByDeployment(@Param('id') deploymentId: string) {
    return this.gateService.findByDeployment(deploymentId);
  }

  @Post('evaluate')
  @RequirePermission(PERMISSIONS.DEPLOYMENT_EXECUTE)
  evaluate(
    @Param('id') deploymentId: string,
    @Body() dto: EvaluateGateDto,
  ) {
    return this.gateService.evaluate(deploymentId, dto);
  }

  @Post(':gateId/approve')
  @RequirePermission(PERMISSIONS.DEPLOYMENT_EXECUTE)
  approve(
    @Param('id') deploymentId: string,
    @Param('gateId') gateId: string,
    @Body() dto: ApproveGateDto,
  ) {
    return this.gateService.approve(deploymentId, gateId, dto);
  }

  @Post(':gateId/bypass')
  @RequirePermission(PERMISSIONS.DEPLOYMENT_EXECUTE)
  bypass(
    @Param('id') deploymentId: string,
    @Param('gateId') gateId: string,
    @Body() dto: BypassGateDto,
  ) {
    return this.gateService.bypass(deploymentId, gateId, dto);
  }
}
