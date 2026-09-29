import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { IamObservabilityService } from './iam-observability.service';
import { IamAdminGuard } from './iam-admin-guard';
import { Permissions } from './iam-permissions.guard';
import { IAM_ADMIN } from './iam.constants';

@ApiTags('iam-observability')
@Controller('api/iam')
export class IamObservabilityController {
  constructor(private readonly observabilityService: IamObservabilityService) {}

  @Get('security/events')
  @Permissions(IAM_ADMIN)
  @UseGuards(IamAdminGuard)
  @ApiOperation({ summary: 'Liste des événements de sécurité (admin)' })
  @ApiQuery({ name: 'severity', required: false })
  @ApiQuery({ name: 'type', required: false })
  @ApiQuery({ name: 'userId', required: false })
  @ApiQuery({ name: 'tenantId', required: false })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  async securityEvents(
    @Query('severity') severity?: string,
    @Query('type') type?: string,
    @Query('userId') userId?: string,
    @Query('tenantId') tenantId?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const data = await this.observabilityService.listSecurityEvents({
      severity, type, userId, tenantId,
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
    });
    return { success: true, message: 'OK', data };
  }

  @Patch('security/events/:id')
  @Permissions(IAM_ADMIN)
  @UseGuards(IamAdminGuard)
  @ApiOperation({ summary: 'Mettre à jour un événement de sécurité (admin)' })
  async updateSecurityEvent(@Param('id') id: string, @Body() body: { status?: string; metadata?: Record<string, unknown> }) {
    const data = await this.observabilityService.updateSecurityEvent(id, body);
    return { success: true, message: 'Événement mis à jour', data };
  }

  @Get('observability/dashboard')
  @Permissions(IAM_ADMIN)
  @UseGuards(IamAdminGuard)
  @ApiOperation({ summary: 'Dashboard d observabilité (admin)' })
  async dashboard() {
    const data = await this.observabilityService.dashboard();
    return { success: true, message: 'OK', data };
  }

  @Get('logs/search')
  @Permissions(IAM_ADMIN)
  @UseGuards(IamAdminGuard)
  @ApiOperation({ summary: 'Recherche de logs (admin)' })
  @ApiQuery({ name: 'level', required: false })
  @ApiQuery({ name: 'source', required: false })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'traceId', required: false })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  async logs(
    @Query('level') level?: string,
    @Query('source') source?: string,
    @Query('search') search?: string,
    @Query('traceId') traceId?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const data = await this.observabilityService.searchLogs({ level, source, search, traceId, page: page ? parseInt(page, 10) : undefined, limit: limit ? parseInt(limit, 10) : undefined });
    return { success: true, message: 'OK', data };
  }

  @Get('audit/search')
  @Permissions(IAM_ADMIN)
  @UseGuards(IamAdminGuard)
  @ApiOperation({ summary: 'Recherche d audit (admin)' })
  @ApiQuery({ name: 'action', required: false })
  @ApiQuery({ name: 'actorId', required: false })
  @ApiQuery({ name: 'targetType', required: false })
  @ApiQuery({ name: 'result', required: false })
  @ApiQuery({ name: 'traceId', required: false })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  async audit(
    @Query('action') action?: string,
    @Query('actorId') actorId?: string,
    @Query('targetType') targetType?: string,
    @Query('result') result?: string,
    @Query('traceId') traceId?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const data = await this.observabilityService.searchAudit({ action, actorId, targetType, result, traceId, page: page ? parseInt(page, 10) : undefined, limit: limit ? parseInt(limit, 10) : undefined });
    return { success: true, message: 'OK', data };
  }

  @Get('alerts/rules')
  @Permissions(IAM_ADMIN)
  @UseGuards(IamAdminGuard)
  @ApiOperation({ summary: 'Liste des règles d alerte (admin)' })
  @ApiQuery({ name: 'enabled', required: false })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'severity', required: false })
  async alertRules(@Query('enabled') enabled?: string, @Query('search') search?: string, @Query('severity') severity?: string) {
    const data = await this.observabilityService.listAlertRules({
      enabled: enabled ? enabled === 'true' : undefined,
      search, severity,
    });
    return { success: true, message: 'OK', data };
  }

  @Patch('alerts/rules/:id')
  @Permissions(IAM_ADMIN)
  @UseGuards(IamAdminGuard)
  @ApiOperation({ summary: 'Toggle une règle d alerte (admin)' })
  async toggleAlertRule(@Param('id') id: string, @Body() body: { enabled?: boolean }) {
    const data = await this.observabilityService.toggleAlertRule(id, body);
    return { success: true, message: 'Règle mise à jour', data };
  }

  @Get('alerts')
  @Permissions(IAM_ADMIN)
  @UseGuards(IamAdminGuard)
  @ApiOperation({ summary: 'Liste des alertes (admin)' })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'severity', required: false })
  @ApiQuery({ name: 'ruleId', required: false })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  async alerts(
    @Query('status') status?: string,
    @Query('severity') severity?: string,
    @Query('ruleId') ruleId?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const data = await this.observabilityService.listAlerts({ status, severity, ruleId, page: page ? parseInt(page, 10) : undefined, limit: limit ? parseInt(limit, 10) : undefined });
    return { success: true, message: 'OK', data };
  }

  @Post('alerts/:id/acknowledge')
  @Permissions(IAM_ADMIN)
  @UseGuards(IamAdminGuard)
  @ApiOperation({ summary: 'Acquitter une alerte (admin)' })
  async acknowledgeAlert(@Param('id') id: string) {
    const data = await this.observabilityService.updateAlertInstance(id, 'acknowledge');
    return { success: true, message: 'Alerte acquittée', data };
  }

  @Post('alerts/:id/resolve')
  @Permissions(IAM_ADMIN)
  @UseGuards(IamAdminGuard)
  @ApiOperation({ summary: 'Résoudre une alerte (admin)' })
  async resolveAlert(@Param('id') id: string) {
    const data = await this.observabilityService.updateAlertInstance(id, 'resolve');
    return { success: true, message: 'Alerte résolue', data };
  }
}
