import {
  Body,
  Controller,
  Get,
  Param,
  Post,
} from '@nestjs/common';
import { GateService } from './gate.service';
import { EvaluateGateDto } from './dto/evaluate-gate.dto';
import { ApproveGateDto } from './dto/approve-gate.dto';
import { BypassGateDto } from './dto/bypass-gate.dto';

@Controller('api/deployments/:id/gates')
export class GateController {
  constructor(private readonly gateService: GateService) {}

  @Get()
  findByDeployment(@Param('id') deploymentId: string) {
    return this.gateService.findByDeployment(deploymentId);
  }

  @Post('evaluate')
  evaluate(
    @Param('id') deploymentId: string,
    @Body() dto: EvaluateGateDto,
  ) {
    return this.gateService.evaluate(deploymentId, dto);
  }

  @Post(':gateId/approve')
  approve(
    @Param('id') deploymentId: string,
    @Param('gateId') gateId: string,
    @Body() dto: ApproveGateDto,
  ) {
    return this.gateService.approve(deploymentId, gateId, dto);
  }

  @Post(':gateId/bypass')
  bypass(
    @Param('id') deploymentId: string,
    @Param('gateId') gateId: string,
    @Body() dto: BypassGateDto,
  ) {
    return this.gateService.bypass(deploymentId, gateId, dto);
  }
}
