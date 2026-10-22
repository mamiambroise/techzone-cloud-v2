import { Controller, Get, Post, Put, Patch, Delete, Body, Param, Logger, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBody } from '@nestjs/swagger';
import type { Request } from 'express';
import { RulesEngine } from './rules/rules.engine';
import { WorkflowEngine } from './workflow/workflow.engine';
import { TriggerEngine } from './trigger/trigger.engine';
import { AutomationHistoryService } from './history/automation-history.service';
import { ConditionsEngine } from './conditions/conditions.engine';
import { ActionEngine } from './action/action.engine';
import { AutomationContext } from './interfaces/automation.contract';
import {
  EventPayloadDto,
  SimulateRuleDto,
  StartWorkflowDto,
  FireTriggerDto,
  WorkflowDefinitionDto,
  WorkflowLifecycleDto,
} from './dto/automation.dto';
import { CurrentUser } from '../iam/decorators/current-user.decorator';
import type { IamAuthContext } from '../iam/decorators/current-user.decorator';
import { Permissions } from '../iam/iam-permissions.guard';
import { AUTOMATION_EXECUTE, AUTOMATION_READ, AUTOMATION_SIMULATE } from '../iam/iam.constants';
import { IamError } from '../iam/iam-error';
import { AutomationPersistenceService } from './automation-persistence.service';
import { CreateAutomationScheduleDto, UpdateAutomationScheduleDto } from './dto/automation.dto';

@ApiTags('automation')
@Controller('api/automation')
export class AutomationController {
  private readonly logger = new Logger(AutomationController.name);

  constructor(
    private readonly rulesEngine: RulesEngine,
    private readonly workflowEngine: WorkflowEngine,
    private readonly triggerEngine: TriggerEngine,
    private readonly historyService: AutomationHistoryService,
    private readonly conditionsEngine: ConditionsEngine,
    private readonly actionEngine: ActionEngine,
    private readonly persistence: AutomationPersistenceService,
  ) {}

  // === CONTRACT / COCKPIT (WF-CDC-00 / WF-CDC-01) ===

  @Get('cockpit')
  @Permissions(AUTOMATION_READ)
  @ApiOperation({ summary: 'Automation Cockpit - Etat global' })
  async getCockpit(@CurrentUser() principal: IamAuthContext) {
    const tenantId = this.requireTenant(principal);
    const rules = this.rulesEngine.getRules();
    const workflows = await this.persistence.listWorkflows(tenantId);
    const triggers = this.triggerEngine.getTriggers();
    const metrics = this.historyService.getMetrics(tenantId);

    return {
      engine: { status: 'UP' },
      rules: {
        total: rules.length,
        active: rules.filter((r) => r.status === 'ACTIVE').length,
        inactive: rules.filter((r) => r.status === 'INACTIVE').length,
        draft: rules.filter((r) => r.status === 'DRAFT').length,
      },
      workflows: {
        total: workflows.length,
        active: workflows.filter((w) => w.lifecycle === 'ACTIVE').length,
        ready: workflows.filter((w) => w.lifecycle === 'READY').length,
        paused: workflows.filter((w) => w.lifecycle === 'PAUSED').length,
      },
      triggers: {
        total: triggers.length,
        enabled: triggers.filter((t) => t.enabled).length,
      },
      executions: metrics,
      attention: metrics.failedCount + metrics.timeoutCount,
    };
  }

  @Get('contract')
  @Permissions(AUTOMATION_READ)
  @ApiOperation({ summary: 'Automation Contract v1' })
  async getContract(@CurrentUser() principal: IamAuthContext) {
    return {
      contract: 'techzone.automation',
      contractVersion: '1.0',
      provider: 'automation',
      instance: 'main',
      rules: this.rulesEngine.getRules(),
      workflows: await this.persistence.listWorkflows(this.requireTenant(principal)),
      triggers: this.triggerEngine.getTriggers(),
      actions: this.actionEngine.getActions().map((action) => ({
        code: action.code,
        category: action.category,
        retryable: action.retryable,
        timeout: action.timeout,
        idempotent: action.idempotent,
        version: action.version,
        executable: typeof action.handler === 'function',
      })),
      health: { status: 'UP' },
    };
  }

  @Get('actions')
  @Permissions(AUTOMATION_READ)
  @ApiOperation({ summary: 'Lister les actions disponibles' })
  async getActions() {
    return this.actionEngine.getActions().map((action) => ({
      code: action.code,
      category: action.category,
      retryable: action.retryable,
      timeout: action.timeout,
      idempotent: action.idempotent,
      version: action.version,
      executable: typeof action.handler === 'function',
    }));
  }

  // === RULES (WF-CDC-02) ===

  @Get('rules')
  @Permissions(AUTOMATION_READ)
  @ApiOperation({ summary: 'Lister les regles' })
  async getRules() {
    return this.rulesEngine.getRules();
  }

  @Get('rules/active')
  @Permissions(AUTOMATION_READ)
  @ApiOperation({ summary: 'Lister les regles actives (ordere par priorite)' })
  async getActiveRules() {
    return this.rulesEngine.getActiveRules();
  }

  @Get('rules/:code')
  @Permissions(AUTOMATION_READ)
  @ApiOperation({ summary: 'Details d une regle' })
  async getRule(@Param('code') code: string) {
    return this.rulesEngine.getRule(code);
  }

  @Post('rules/evaluate')
  @Permissions(AUTOMATION_EXECUTE)
  @ApiOperation({ summary: 'Evaluer les regles actives avec un contexte' })
  async evaluateRules(@Req() req: Request, @CurrentUser() principal: IamAuthContext, @Body('context') context: Record<string, any>) {
    const ctx = this.buildContext('rules-eval', context, principal, this.getTraceId(req));
    return this.rulesEngine.evaluateAll(ctx);
  }

  @Post('rules/simulate')
  @Permissions(AUTOMATION_SIMULATE)
  @ApiOperation({ summary: 'Simuler une regle sans effet metier' })
  @ApiBody({ type: SimulateRuleDto })
  async simulateRule(
    @Req() req: Request,
    @CurrentUser() principal: IamAuthContext,
    @Body() dto: SimulateRuleDto,
  ) {
    const ctx = this.buildContext('rule-simulate', dto.context, principal, this.getTraceId(req));
    return this.rulesEngine.simulateRule(dto.ruleCode, { ...dto.context, ...ctx });
  }

  // === WORKFLOW (WF-CDC-03) ===

  @Get('workflows')
  @Permissions(AUTOMATION_READ)
  @ApiOperation({ summary: 'Lister les workflows' })
  async getWorkflows(@CurrentUser() principal: IamAuthContext) {
    return this.persistence.listWorkflows(this.requireTenant(principal));
  }

  @Post('workflows')
  @Permissions(AUTOMATION_EXECUTE)
  @ApiOperation({ summary: 'Creer un workflow en brouillon' })
  async createWorkflow(@Body() dto: WorkflowDefinitionDto, @CurrentUser() principal: IamAuthContext) {
    return this.persistence.createWorkflow(this.requireTenant(principal), principal.userId, {
      ...dto,
      lifecycle: 'DRAFT',
      version: dto.version || '1.0',
    });
  }

  @Put('workflows/:code')
  @Permissions(AUTOMATION_EXECUTE)
  @ApiOperation({ summary: 'Modifier un workflow' })
  async updateWorkflow(@Param('code') code: string, @Body() dto: WorkflowDefinitionDto, @CurrentUser() principal: IamAuthContext) {
    return this.persistence.updateWorkflow(this.requireTenant(principal), principal.userId, code, {
      ...dto,
      lifecycle: 'DRAFT',
      version: dto.version || '1.0',
    });
  }

  @Post('workflows/:code/validate')
  @Permissions(AUTOMATION_EXECUTE)
  @ApiOperation({ summary: 'Valider la definition d un workflow' })
  async validateWorkflow(@Param('code') code: string, @CurrentUser() principal: IamAuthContext) {
    return this.persistence.validateWorkflow(this.requireTenant(principal), code);
  }

  @Patch('workflows/:code/lifecycle')
  @Permissions(AUTOMATION_EXECUTE)
  @ApiOperation({ summary: 'Modifier le cycle de vie d un workflow' })
  async setWorkflowLifecycle(
    @Param('code') code: string,
    @Body() dto: WorkflowLifecycleDto,
    @CurrentUser() principal: IamAuthContext,
  ) {
    return this.persistence.setWorkflowLifecycle(this.requireTenant(principal), code, dto.lifecycle, principal.userId);
  }

  @Post('workflows/start')
  @Permissions(AUTOMATION_EXECUTE)
  @ApiOperation({ summary: 'Demarrer un workflow' })
  @ApiBody({ type: StartWorkflowDto })
  async startWorkflow(@Req() req: Request, @CurrentUser() principal: IamAuthContext, @Body() dto: StartWorkflowDto) {
    const ctx = this.buildContext('workflow-start', dto.variables, principal, this.getTraceId(req));
    const rec = await this.persistence.startWorkflow(ctx.tenantId, dto.workflowCode, ctx);
    this.historyService.recordExecution({
      executionId: rec.executionId,
      traceId: ctx.traceId,
      tenantId: ctx.tenantId,
      workflowCode: dto.workflowCode,
      version: rec.version,
      startedAt: rec.startedAt,
      finishedAt: rec.finishedAt,
      status: rec.status as any,
      retryCount: 0,
      applicationId: 'automation',
    });
    return rec;
  }

  @Get('workflows/executions')
  @Permissions(AUTOMATION_READ)
  @ApiOperation({ summary: 'Executions de workflows' })
  async getExecutions(@CurrentUser() principal: IamAuthContext) {
    const tenantId = this.requireTenant(principal);
    return this.workflowEngine.getExecutions().filter((execution) => execution.context.tenantId === tenantId);
  }

  @Get('schedules')
  @Permissions(AUTOMATION_READ)
  @ApiOperation({ summary: 'Lister les planifications du tenant' })
  async getSchedules(@CurrentUser() principal: IamAuthContext) {
    return this.persistence.listSchedules(this.requireTenant(principal));
  }

  @Get('schedules/status')
  @Permissions(AUTOMATION_READ)
  @ApiOperation({ summary: 'État réel du scheduler serveur' })
  getScheduleStatus() {
    return this.persistence.getSchedulerStatus();
  }

  @Post('schedules')
  @Permissions(AUTOMATION_EXECUTE)
  @ApiOperation({ summary: 'Créer une planification récurrente' })
  async createSchedule(
    @Body() dto: CreateAutomationScheduleDto,
    @CurrentUser() principal: IamAuthContext,
  ) {
    return this.persistence.createSchedule(this.requireTenant(principal), principal.userId, dto);
  }

  @Patch('schedules/:id')
  @Permissions(AUTOMATION_EXECUTE)
  @ApiOperation({ summary: 'Modifier ou suspendre une planification' })
  async updateSchedule(
    @Param('id') id: string,
    @Body() dto: UpdateAutomationScheduleDto,
    @CurrentUser() principal: IamAuthContext,
  ) {
    return this.persistence.updateSchedule(this.requireTenant(principal), id, dto);
  }

  @Delete('schedules/:id')
  @Permissions(AUTOMATION_EXECUTE)
  @ApiOperation({ summary: 'Supprimer une planification' })
  async deleteSchedule(@Param('id') id: string, @CurrentUser() principal: IamAuthContext) {
    await this.persistence.deleteSchedule(this.requireTenant(principal), id);
    return { deleted: true };
  }

  // === TRIGGER (WF-CDC-04) ===

  @Get('triggers')
  @Permissions(AUTOMATION_READ)
  @ApiOperation({ summary: 'Lister les triggers' })
  async getTriggers() {
    return this.triggerEngine.getTriggers();
  }

  @Post('triggers/event')
  @Permissions(AUTOMATION_EXECUTE)
  @ApiOperation({ summary: 'Traiter un evenement entrant' })
  @ApiBody({ type: EventPayloadDto })
  async processEvent(@Req() req: Request, @CurrentUser() principal: IamAuthContext, @Body() payload: EventPayloadDto) {
    const ctx = this.buildContext('event', payload.data, principal, this.getTraceId(req));
    return this.triggerEngine.processEvent(payload, ctx);
  }

  @Post('triggers/fire')
  @Permissions(AUTOMATION_EXECUTE)
  @ApiOperation({ summary: 'Declencher manuellement un trigger' })
  @ApiBody({ type: FireTriggerDto })
  async fireTrigger(@Req() req: Request, @CurrentUser() principal: IamAuthContext, @Body() dto: FireTriggerDto) {
    const ctx = this.buildContext('manual', dto.variables, principal, this.getTraceId(req));
    return this.triggerEngine.fireManual(dto.triggerCode, ctx);
  }

  // === CONDITIONS / FORMULA (WF-CDC-06) ===

  @Post('conditions/evaluate')
  @Permissions(AUTOMATION_EXECUTE)
  @ApiOperation({ summary: 'Evaluer une condition (AST) avec un contexte' })
  async evaluateCondition(@Body('condition') condition: any, @Body('context') context: Record<string, any>) {
    const result = this.conditionsEngine.evaluate(condition, context || {});
    return { result };
  }

  @Post('conditions/simulate')
  @Permissions(AUTOMATION_EXECUTE)
  @ApiOperation({ summary: 'Simuler une condition avec trace' })
  async simulateCondition(@Body('condition') condition: any, @Body('context') context: Record<string, any>) {
    return this.conditionsEngine.simulate(condition, context || {});
  }

  // === HISTORY / DIAGNOSTICS (WF-CDC-07) ===

  @Get('history')
  @Permissions(AUTOMATION_READ)
  @ApiOperation({ summary: 'Historique des executions' })
  async getHistory(@CurrentUser() principal: IamAuthContext) {
    return this.historyService.search({ tenantId: this.requireTenant(principal) });
  }

  @Get('history/metrics')
  @Permissions(AUTOMATION_READ)
  @ApiOperation({ summary: 'Metriques du moteur' })
  async getMetrics(@CurrentUser() principal: IamAuthContext) {
    return this.historyService.getMetrics(this.requireTenant(principal));
  }

  private buildContext(
    source: string,
    variables: Record<string, any> | undefined,
    principal: IamAuthContext,
    traceId: string,
  ): AutomationContext {
    if (!principal) {
      throw new IamError(
        'Principal IAM requis pour lexecution automation',
        401,
        'UNAUTHENTICATED',
      );
    }
    if (!principal.tenantId) {
      throw new IamError(
        'tenantId requis dans le contexte IAM',
        403,
        'TENANT_REQUIRED',
      );
    }
    if (!principal.userId) {
      throw new IamError(
        'userId requis dans le contexte IAM',
        403,
        'USER_REQUIRED',
      );
    }
    const ctx: AutomationContext = {
      tenantId: principal.tenantId,
      userId: principal.userId,
      applicationId: 'automation',
      environmentId: process.env.NODE_ENV || 'development',
      eventId: `evt-${Date.now()}`,
      executionId: `exec-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      traceId,
      permissions: principal.permissions ?? [],
      variables: variables || {},
      locale: 'fr',
    };
    return ctx;
  }

  private getTraceId(req: Request): string {
    return (req as any).traceId || `tr-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 10)}`;
  }

  private requireTenant(principal: IamAuthContext): string {
    if (!principal?.tenantId) {
      throw new IamError('tenantId requis dans le contexte IAM', 403, 'TENANT_REQUIRED');
    }
    return principal.tenantId;
  }
}
