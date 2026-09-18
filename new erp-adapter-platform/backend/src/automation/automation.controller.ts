import { Controller, Get, Post, Body, Param, Logger } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
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

@ApiTags('automation')
@Controller('automation')
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
  @ApiOperation({ summary: 'Automation Cockpit - Etat global' })
  async getCockpit() {
    const rules = this.rulesEngine.getRules();
    const workflows = this.workflowEngine.getWorkflows();
    const triggers = this.triggerEngine.getTriggers();
    const metrics = this.historyService.getMetrics();

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
  @ApiOperation({ summary: 'Lister les regles' })
  async getRules() {
    return this.rulesEngine.getRules();
  }

  @Get('rules/active')
  @ApiOperation({ summary: 'Lister les regles actives (ordere par priorite)' })
  async getActiveRules() {
    return this.rulesEngine.getActiveRules();
  }

  @Get('rules/:code')
  @ApiOperation({ summary: 'Details d une regle' })
  async getRule(@Param('code') code: string) {
    return this.rulesEngine.getRule(code);
  }

  @Post('rules/evaluate')
  @ApiOperation({ summary: 'Evaluer les regles actives avec un contexte' })
  async evaluateRules(@Body('context') context: Record<string, any>) {
    const ctx = this.buildContext('rules-eval', context);
    return this.rulesEngine.evaluateAll(ctx);
  }

  @Post('rules/simulate')
  @ApiOperation({ summary: 'Simuler une regle sans effet metier' })
  @ApiBody({ type: SimulateRuleDto })
  async simulateRule(@Body() dto: SimulateRuleDto) {
    return this.rulesEngine.simulateRule(dto.ruleCode, dto.context || {});
  }

  // === WORKFLOW (WF-CDC-03) ===

  @Get('workflows')
  @ApiOperation({ summary: 'Lister les workflows' })
  async getWorkflows() {
    return this.workflowEngine.getWorkflows();
  }

  @Post('workflows/start')
  @ApiOperation({ summary: 'Demarrer un workflow' })
  @ApiBody({ type: StartWorkflowDto })
  async startWorkflow(@Body() dto: StartWorkflowDto) {
    const ctx = this.buildContext('workflow-start', dto.variables);
    const rec = await this.workflowEngine.startWorkflow(dto.workflowCode, ctx);
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
  @ApiOperation({ summary: 'Executions de workflows' })
  async getExecutions() {
    return this.workflowEngine.getExecutions();
  }

  // === TRIGGER (WF-CDC-04) ===

  @Get('triggers')
  @ApiOperation({ summary: 'Lister les triggers' })
  async getTriggers() {
    return this.triggerEngine.getTriggers();
  }

  @Post('triggers/event')
  @ApiOperation({ summary: 'Traiter un evenement entrant' })
  @ApiBody({ type: EventPayloadDto })
  async processEvent(@Body() payload: EventPayloadDto) {
    const ctx = this.buildContext('event', payload.data);
    return this.triggerEngine.processEvent(payload, ctx);
  }

  @Post('triggers/fire')
  @ApiOperation({ summary: 'Declencher manuellement un trigger' })
  @ApiBody({ type: FireTriggerDto })
  async fireTrigger(@Body() dto: FireTriggerDto) {
    const ctx = this.buildContext('manual', dto.variables);
    return this.triggerEngine.fireManual(dto.triggerCode, ctx);
  }

  // === CONDITIONS / FORMULA (WF-CDC-06) ===

  @Post('conditions/evaluate')
  @ApiOperation({ summary: 'Evaluer une condition (AST) avec un contexte' })
  async evaluateCondition(@Body('condition') condition: any, @Body('context') context: Record<string, any>) {
    const result = this.conditionsEngine.evaluate(condition, context || {});
    return { result };
  }

  @Post('conditions/simulate')
  @ApiOperation({ summary: 'Simuler une condition avec trace' })
  async simulateCondition(@Body('condition') condition: any, @Body('context') context: Record<string, any>) {
    return this.conditionsEngine.simulate(condition, context || {});
  }

  // === HISTORY / DIAGNOSTICS (WF-CDC-07) ===

  @Get('history')
  @ApiOperation({ summary: 'Historique des executions' })
  async getHistory() {
    return this.historyService.search();
  }

  @Get('history/metrics')
  @ApiOperation({ summary: 'Metriques du moteur' })
  async getMetrics() {
    return this.historyService.getMetrics();
  }

  private buildContext(source: string, variables?: Record<string, any>): AutomationContext {
    return {
      tenantId: 'system',
      userId: 'system',
      applicationId: 'automation',
      environmentId: process.env.NODE_ENV || 'development',
      eventId: `evt-${Date.now()}`,
      executionId: `exec-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      traceId: `trace-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      permissions: ['*'],
      variables: variables || {},
      locale: 'fr',
    };
  }
}
