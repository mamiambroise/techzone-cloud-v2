import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  Logger,
  Req,
  HttpException,
  NotFoundException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBody } from '@nestjs/swagger';
import type { Request } from 'express';
import { RulesEngine } from './rules/rules.engine';
import { WorkflowEngine } from './workflow/workflow.engine';
import { TriggerEngine } from './trigger/trigger.engine';
import { AutomationHistoryService } from './history/automation-history.service';
import { ConditionsEngine } from './conditions/conditions.engine';
import { AutomationContext } from './interfaces/automation.contract';
import {
  EventPayloadDto,
  SimulateRuleDto,
  StartWorkflowDto,
  FireTriggerDto,
} from './dto/automation.dto';
import { HistoryQueryDto } from './dto/history-query.dto';
import { CurrentUser } from '../iam/decorators/current-user.decorator';
import type { IamAuthContext } from '../iam/decorators/current-user.decorator';
import { Permissions } from '../iam/iam-permissions.guard';
import { AUTOMATION_EXECUTE, AUTOMATION_READ } from '../iam/iam.constants';
import { IamError } from '../iam/iam-error';

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
  ) {}

  // === CONTRACT / COCKPIT (WF-CDC-00 / WF-CDC-01) ===

  @Get('cockpit')
  @Permissions(AUTOMATION_READ)
  @ApiOperation({ summary: 'Automation Cockpit - Etat global' })
  async getCockpit(@CurrentUser() principal?: IamAuthContext) {
    const rules = this.rulesEngine.getRules();
    const workflows = this.workflowEngine.getWorkflows();
    const triggers = this.triggerEngine.getTriggers();
    // Métriques limitées au tenant du principal (le paramètre reste optionnel
    // pour ne pas casser le test "getCockpit sans principal").
    const metrics = this.historyService.getMetrics(principal?.tenantId ?? undefined);

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
  async getContract() {
    return {
      contract: 'techzone.automation',
      contractVersion: '1.0',
      provider: 'automation',
      instance: 'main',
      rules: this.rulesEngine.getRules(),
      workflows: this.workflowEngine.getWorkflows(),
      triggers: this.triggerEngine.getTriggers(),
      health: { status: 'UP' },
    };
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
  @Permissions(AUTOMATION_EXECUTE)
  @ApiOperation({ summary: 'Simuler une regle sans effet metier' })
  @ApiBody({ type: SimulateRuleDto })
  async simulateRule(@Body() dto: SimulateRuleDto) {
    return this.rulesEngine.simulateRule(dto.ruleCode, dto.context || {});
  }

  // === WORKFLOW (WF-CDC-03) ===

  @Get('workflows')
  @Permissions(AUTOMATION_READ)
  @ApiOperation({ summary: 'Lister les workflows' })
  async getWorkflows() {
    return this.workflowEngine.getWorkflows();
  }

  @Post('workflows/start')
  @Permissions(AUTOMATION_EXECUTE)
  @ApiOperation({ summary: 'Demarrer un workflow' })
  @ApiBody({ type: StartWorkflowDto })
  async startWorkflow(@Req() req: Request, @CurrentUser() principal: IamAuthContext, @Body() dto: StartWorkflowDto) {
    const ctx = this.buildContext('workflow-start', dto.variables, principal, this.getTraceId(req));
    const startedAt = new Date().toISOString();

    let rec;
    try {
      rec = await this.workflowEngine.startWorkflow(dto.workflowCode, ctx);
    } catch (err) {
      // Une exécution qui lève une erreur (ERP indisponible, timeout…) doit apparaître
      // dans l'historique et dans les métriques. Les erreurs client (4xx : workflow
      // inconnu, payload invalide) ne sont pas des exécutions et ne sont pas enregistrées.
      const isClientError = err instanceof HttpException && err.getStatus() < 500;
      if (!isClientError) {
        this.historyService.recordExecution({
          executionId: ctx.executionId,
          traceId: ctx.traceId,
          tenantId: ctx.tenantId,
          workflowCode: dto.workflowCode,
          version: 'unknown',
          startedAt,
          finishedAt: new Date().toISOString(),
          status: 'FAILED' as any,
          retryCount: 0,
          applicationId: 'automation',
          errorCode: String((err as any)?.code ?? 'WORKFLOW_ERROR'),
        });
      }
      throw err;
    }

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
  async getExecutions() {
    return this.workflowEngine.getExecutions();
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
  @ApiOperation({
    summary: 'Historique des executions du tenant (pagine, filtrable, plus recent d abord)',
  })
  async getHistory(@CurrentUser() principal: IamAuthContext, @Query() query: HistoryQueryDto) {
    return this.historyService.searchPaged(query, this.requireTenantId(principal));
  }

  // Doit rester declare avant history/:executionId
  @Get('history/metrics')
  @Permissions(AUTOMATION_READ)
  @ApiOperation({ summary: 'Metriques du moteur (tenant courant)' })
  async getMetrics(@CurrentUser() principal: IamAuthContext) {
    return this.historyService.getMetrics(this.requireTenantId(principal));
  }

  @Get('history/:executionId')
  @Permissions(AUTOMATION_READ)
  @ApiOperation({ summary: 'Detail d une execution (record + timeline)' })
  async getHistoryDetail(@CurrentUser() principal: IamAuthContext, @Param('executionId') executionId: string) {
    const tenantId = this.requireTenantId(principal);
    const record = this.historyService.getById(executionId, tenantId);
    // 404 aussi pour une execution d'un autre tenant : on ne revele pas son existence.
    if (!record) throw new NotFoundException('Execution introuvable');
    return { record, timeline: this.historyService.getTimeline(executionId) };
  }

  private requireTenantId(principal: IamAuthContext): string {
    if (!principal) {
      throw new IamError('Principal IAM requis pour consulter lhistorique', 401, 'UNAUTHENTICATED');
    }
    if (!principal.tenantId) {
      throw new IamError('tenantId requis dans le contexte IAM', 403, 'TENANT_REQUIRED');
    }
    return principal.tenantId;
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
}
