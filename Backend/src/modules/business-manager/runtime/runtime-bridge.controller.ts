import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../../../common/guards/auth.guard';
import { PermissionGuard } from '../../../common/guards/permission.guard';
import { RuntimeBridgeService } from './runtime-bridge.service';
@Controller('api/v1/business-manager') @UseGuards(AuthGuard, PermissionGuard)
export class RuntimeBridgeController {
  constructor(private readonly service: RuntimeBridgeService) {}
  @Get('application-versions/:versionId/runtime-manifest') manifest(@Param('versionId') id: string, @Query('environment') env?: string, @Query('channel') channel?: string) { return this.service.manifest(id, env, channel); }
  @Get('application-versions/:versionId/runtime-readiness') readiness(@Param('versionId') id: string, @Query('environment') env?: string) { return this.service.readiness(id, env); }
  @Post('application-versions/:versionId/runtime-readiness/validate') validateReadiness(@Param('versionId') id: string, @Query('environment') env?: string) { return this.service.readiness(id, env); }
  @Post('application-versions/:versionId/contracts') contracts(@Param('versionId') id: string) { return this.service.generateContracts(id); }
  @Get('application-versions/:versionId/contracts') listContracts(@Param('versionId') id: string) { return this.service.contracts(id); }
  @Get('application-versions/:versionId/contracts/:type') contract(@Param('versionId') id: string, @Param('type') type: string) { return this.service.contracts(id, type); }
  @Post('application-versions/:versionId/runtime-snapshot') snapshot(@Param('versionId') id: string, @Query('environment') env?: string) { return this.service.snapshot(id, env); }
  @Get('application-versions/:versionId/runtime-snapshot') getSnapshot(@Param('versionId') id: string, @Query('environment') env?: string) { return this.service.getSnapshot(id, env); }
  @Get('integrations') integrations() { return this.service.listIntegrations(); }
  @Post('integrations') integration(@Body() body: any) { return this.service.createIntegration(body); }
  @Get('application-versions/:versionId/integration-bindings') bindings(@Param('versionId') id: string) { return this.service.listBindings(id); }
  @Post('application-versions/:versionId/integration-bindings') bind(@Param('versionId') id: string, @Body() body: any) { return this.service.bind(id, body); }
  @Patch('integration-bindings/:id') updateBinding(@Param('id') id: string, @Body() body: any) { return this.service.updateBinding(id, body); }
  @Post('integration-bindings/:id/validate') validateBinding(@Param('id') id: string) { return this.service.validateBinding(id); }
  @Post('integration-bindings/:id/test') testBinding(@Param('id') id: string) { return this.service.testBinding(id); }
  @Post('integration-bindings/:id/enable') enableBinding(@Param('id') id: string) { return this.service.updateBinding(id, { status: 'ENABLED' }); }
  @Post('integration-bindings/:id/disable') disableBinding(@Param('id') id: string) { return this.service.updateBinding(id, { status: 'DISABLED' }); }
}
