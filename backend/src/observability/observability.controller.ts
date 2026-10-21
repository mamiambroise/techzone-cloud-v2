import { BadRequestException, Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CurrentUser, type IamAuthContext } from '../iam/decorators/current-user.decorator';
import { IamAdminGuard } from '../iam/iam-admin-guard';
import { IAM_ADMIN, PERMISSIONS } from '../iam/iam.constants';
import { Permissions } from '../iam/iam-permissions.guard';
import { AlertEvaluatorService } from './alert-evaluator.service';
import { NotificationRouterService } from './notification-router.service';
import { ObservabilityService } from './observability.service';
import { RetentionService } from './retention.service';

@ApiTags('observability')
@Controller('api/observability')
export class ObservabilityController {
  constructor(private readonly observability: ObservabilityService, private readonly evaluator: AlertEvaluatorService, private readonly notifications: NotificationRouterService, private readonly retention: RetentionService) {}

  @Get('overview') @Permissions(PERMISSIONS.OBSERVABILITY_OVERVIEW_READ) overview(@CurrentUser() principal: IamAuthContext) { return this.observability.overview(principal); }
  @Get('health') @Permissions(PERMISSIONS.OBSERVABILITY_OVERVIEW_READ) health() { return this.observability.health(); }
  @Get('logs') @Permissions(PERMISSIONS.OBSERVABILITY_LOGS_READ) logs(@CurrentUser() principal: IamAuthContext, @Query() query: any) { return this.observability.searchLogs(principal, query); }
  @Get('traces') @Permissions(PERMISSIONS.OBSERVABILITY_TRACES_READ) traces(@CurrentUser() principal: IamAuthContext, @Query() query: any) { return this.observability.searchTraces(principal, query); }
  @Get('metrics') @Permissions(PERMISSIONS.OBSERVABILITY_METRICS_READ) metrics(@CurrentUser() principal: IamAuthContext, @Query('name') name?: string, @Query('rangeMinutes') rangeMinutes?: string) { return this.observability.metricsFor(principal, name, Number(rangeMinutes) || 60); }
  @Get('audit') @Permissions(PERMISSIONS.OBSERVABILITY_AUDIT_READ) audit(@CurrentUser() principal: IamAuthContext, @Query() query: any) { return this.observability.searchAudit(principal, query); }
  @Post('exports/:source') @Permissions(PERMISSIONS.OBSERVABILITY_EXPORT) exportData(@CurrentUser() principal: IamAuthContext, @Param('source') source: string, @Body() query: any) { return this.observability.exportData(principal, source, query ?? {}); }
  @Get('security-events') @Permissions(PERMISSIONS.OBSERVABILITY_SECURITY_READ) securityEvents(@CurrentUser() principal: IamAuthContext, @Query() query: any) { return this.observability.securityEvents(principal, query); }
  @Get('diagnostics') @Permissions(PERMISSIONS.OBSERVABILITY_DIAGNOSTICS_READ) diagnostics(@CurrentUser() principal: IamAuthContext) { return this.observability.diagnostics(principal); }
  @Get('alerts') @Permissions(PERMISSIONS.OBSERVABILITY_ALERTS_READ) alerts(@CurrentUser() principal: IamAuthContext, @Query() query: any) { return this.observability.listAlerts(principal, query); }
  @Get('alert-rules') @Permissions(PERMISSIONS.OBSERVABILITY_ALERTS_READ) alertRules(@CurrentUser() principal: IamAuthContext, @Query() query: any) { return this.observability.listAlertRules(principal, query); }
  @Post('alert-rules') @Permissions(PERMISSIONS.OBSERVABILITY_ALERTS_MANAGE) createAlertRule(@CurrentUser() principal: IamAuthContext, @Body() input: any) { return this.observability.createAlertRule(principal, input); }
  @Patch('alert-rules/:id') @Permissions(PERMISSIONS.OBSERVABILITY_ALERTS_MANAGE) toggleAlertRule(@CurrentUser() principal: IamAuthContext, @Param('id') id: string, @Body('enabled') enabled?: boolean) { return this.observability.toggleAlertRule(principal, id, enabled); }
  @Post('alerts/:id/ack') @Permissions(PERMISSIONS.OBSERVABILITY_ALERTS_MANAGE) ack(@CurrentUser() principal: IamAuthContext, @Param('id') id: string, @Body('note') note?: string) { return this.observability.transitionAlert(principal, id, 'ACKNOWLEDGED', note); }
  @Post('alerts/:id/resolve') @Permissions(PERMISSIONS.OBSERVABILITY_ALERTS_MANAGE) resolve(@CurrentUser() principal: IamAuthContext, @Param('id') id: string, @Body('note') note?: string) { return this.observability.transitionAlert(principal, id, 'RESOLVED', note); }
  @Get('incidents') @Permissions(PERMISSIONS.OBSERVABILITY_INCIDENTS_READ) incidents(@CurrentUser() principal: IamAuthContext, @Query() query: any) { return this.observability.listIncidents(principal, query); }
  @Post('incidents') @Permissions(PERMISSIONS.OBSERVABILITY_INCIDENTS_MANAGE) createIncident(@CurrentUser() principal: IamAuthContext, @Body() input: any) { return this.observability.createIncident(principal, input); }
  @Patch('incidents/:id') @Permissions(PERMISSIONS.OBSERVABILITY_INCIDENTS_MANAGE) updateIncident(@CurrentUser() principal: IamAuthContext, @Param('id') id: string, @Body() input: any) { return this.observability.updateIncident(principal, id, input); }
  @Get('notification-routes') @Permissions(PERMISSIONS.OBSERVABILITY_SETTINGS_MANAGE) notificationRoutes(@CurrentUser() principal: IamAuthContext) { return this.observability.listNotificationRoutes(principal); }
  @Post('notification-routes') @Permissions(PERMISSIONS.OBSERVABILITY_SETTINGS_MANAGE) createNotificationRoute(@CurrentUser() principal: IamAuthContext, @Body() input: any) { return this.observability.createNotificationRoute(principal, input); }
  @Get('retention-policies') @Permissions(PERMISSIONS.OBSERVABILITY_SETTINGS_MANAGE) retentionPolicies(@CurrentUser() principal: IamAuthContext) { return this.observability.listRetentionPolicies(principal); }
  @Post('retention-policies') @Permissions(PERMISSIONS.OBSERVABILITY_SETTINGS_MANAGE) retentionPolicy(@CurrentUser() principal: IamAuthContext, @Body() input: any) { return this.observability.upsertRetentionPolicy(principal, input); }
  @Post('admin/evaluate') @Permissions(IAM_ADMIN) @UseGuards(IamAdminGuard) evaluate() { return this.evaluator.evaluateAll(); }
  @Post('admin/alerts/:id/notify') @Permissions(IAM_ADMIN) @UseGuards(IamAdminGuard) notify(@Param('id') id: string) { return this.notifications.dispatch(id); }
  @Post('admin/retention/:policyId/run') @Permissions(IAM_ADMIN) @UseGuards(IamAdminGuard) runRetention(@Param('policyId') policyId: string, @Body('dryRun') dryRun?: boolean, @Body('confirm') confirm?: string) {
    if (dryRun === false && confirm !== 'PURGE') throw new BadRequestException('OBS_RETENTION_PURGE_CONFIRMATION_REQUIRED');
    return this.retention.run(policyId, dryRun !== false);
  }
}
