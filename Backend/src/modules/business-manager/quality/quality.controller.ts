import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { User } from '../../../common/decorators/user.decorator';
import type { UserContext } from '../../../common/decorators/user.decorator';
import { AuthGuard } from '../../../common/guards/auth.guard';
import { PermissionGuard } from '../../../common/guards/permission.guard';
import { QualityService } from './quality.service';
@Controller('api/v1/business-manager') @UseGuards(AuthGuard, PermissionGuard)
export class QualityController {
  constructor(private readonly service: QualityService) {}
  @Post('application-versions/:versionId/quality/campaigns') run(@Param('versionId') id: string, @Body() body: any, @User() user: UserContext) { return this.service.run(id, body.mode, user.id); }
  @Get('application-versions/:versionId/quality/campaigns') campaigns(@Param('versionId') id: string) { return this.service.campaigns(id); }
  @Get('quality/campaigns/:id/report') report(@Param('id') id: string) { return this.service.report(id); }
  @Get('application-versions/:versionId/quality/gate') gate(@Param('versionId') id: string) { return this.service.gate(id); }
  @Post('application-versions/:versionId/quality/waivers') waiver(@Param('versionId') id: string, @Body() body: any) { return this.service.requestWaiver(id, body.issueCode, body.reason, body.expiresAt); }
  @Post('quality/waivers/:id/approve') approve(@Param('id') id: string, @User() user: UserContext) { return this.service.approveWaiver(id, user.id); }
}
