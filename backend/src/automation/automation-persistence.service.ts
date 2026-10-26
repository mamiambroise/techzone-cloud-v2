import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { WorkflowDefinition, WorkflowEngine } from './workflow/workflow.engine';
import { AutomationContext, WorkflowLifecycle, WorkflowStep } from './interfaces/automation.contract';
import { ActionEngine } from './action/action.engine';

const SCHEDULE_INTERVAL_MS = 30_000;

@Injectable()
export class AutomationPersistenceService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(AutomationPersistenceService.name);
  private timer: NodeJS.Timeout | null = null;
  private running = false;

  constructor(
    private readonly prisma: PrismaService,
    private readonly workflowEngine: WorkflowEngine,
    private readonly actionEngine: ActionEngine,
  ) {}

  onModuleInit(): void {
    if (process.env.AUTOMATION_SCHEDULER_ENABLED !== 'true') {
      this.logger.log('Scheduler Automation désactivé (AUTOMATION_SCHEDULER_ENABLED != true).');
      return;
    }

    this.timer = setInterval(() => void this.runDueSchedules(), SCHEDULE_INTERVAL_MS);
    this.logger.log(`Scheduler Automation actif (tick ${SCHEDULE_INTERVAL_MS / 1000}s).`);
  }

  onModuleDestroy(): void {
    if (this.timer) clearInterval(this.timer);
  }

  async listWorkflows(tenantId: string): Promise<WorkflowDefinition[]> {
    const rows = await this.prisma.automationWorkflow.findMany({
      where: { tenantId },
      orderBy: { updatedAt: 'desc' },
    });
    return rows.map((row) => this.toDefinition(row));
  }

  async getWorkflow(tenantId: string, code: string): Promise<WorkflowDefinition> {
    const row = await this.prisma.automationWorkflow.findUnique({
      where: { tenantId_code: { tenantId, code } },
    });
    if (!row) throw new NotFoundException(`Workflow "${code}" non trouvé`);
    return this.toDefinition(row);
  }

  async createWorkflow(
    tenantId: string,
    userId: string,
    definition: WorkflowDefinition,
  ): Promise<WorkflowDefinition> {
    const draft = { ...definition, tenantId, lifecycle: 'DRAFT' as const };
    this.assertValid(draft);
    try {
      const row = await this.prisma.automationWorkflow.create({
        data: {
          tenantId,
          code: draft.code,
          name: draft.nom,
          version: draft.version,
          lifecycle: draft.lifecycle,
          steps: draft.steps as object[],
          maxSteps: draft.maxSteps ?? 20,
          createdBy: userId,
          updatedBy: userId,
        },
      });
      return this.toDefinition(row);
    } catch (error) {
      if (this.isUniqueViolation(error)) throw new ConflictException(`Workflow "${draft.code}" existe déjà`);
      throw error;
    }
  }

  async updateWorkflow(
    tenantId: string,
    userId: string,
    code: string,
    definition: WorkflowDefinition,
  ): Promise<WorkflowDefinition> {
    if (definition.code !== code) throw new BadRequestException('Le code du workflow ne peut pas être modifié');
    const existing = await this.getWorkflow(tenantId, code);
    const draft = {
      ...definition,
      tenantId,
      lifecycle: 'DRAFT' as const,
      version: definition.version || existing.version,
    };
    this.assertValid(draft);
    const row = await this.prisma.$transaction(async (transaction) => {
      const updated = await transaction.automationWorkflow.update({
        where: { tenantId_code: { tenantId, code } },
        data: {
          name: draft.nom,
          version: draft.version,
          lifecycle: draft.lifecycle,
          steps: draft.steps as object[],
          maxSteps: draft.maxSteps ?? 20,
          updatedBy: userId,
        },
      });
      await transaction.automationSchedule.updateMany({
        where: { tenantId, workflowId: updated.id },
        data: { enabled: false },
      });
      return updated;
    });
    return this.toDefinition(row);
  }

  async validateWorkflow(tenantId: string, code: string) {
    return this.workflowEngine.validateWorkflow(await this.getWorkflow(tenantId, code));
  }

  async setWorkflowLifecycle(
    tenantId: string,
    code: string,
    lifecycle: WorkflowLifecycle,
    userId: string,
  ): Promise<WorkflowDefinition> {
    const workflow = await this.getWorkflow(tenantId, code);
    if (lifecycle === 'READY' || lifecycle === 'ACTIVE') {
      this.assertValid(workflow);
      this.assertActionsExecutable(workflow);
    }
    if (workflow.lifecycle === 'ARCHIVED' && lifecycle !== 'ARCHIVED') {
      throw new BadRequestException('Un workflow archivé ne peut pas être réactivé');
    }
    const updated = await this.prisma.$transaction(async (transaction) => {
      const result = await transaction.automationWorkflow.update({
        where: { tenantId_code: { tenantId, code } },
        data: { lifecycle, updatedBy: userId },
      });
      if (lifecycle !== 'READY' && lifecycle !== 'ACTIVE') {
        await transaction.automationSchedule.updateMany({
          where: { tenantId, workflowId: result.id },
          data: { enabled: false },
        });
      }
      return result;
    });
    return this.toDefinition(updated);
  }

  async startWorkflow(
    tenantId: string,
    code: string,
    context: AutomationContext,
  ) {
    const workflow = await this.getWorkflow(tenantId, code);
    return this.workflowEngine.startWorkflowDefinition(workflow, context);
  }

  async listSchedules(tenantId: string) {
    return this.prisma.automationSchedule.findMany({
      where: { tenantId },
      include: { workflow: { select: { code: true, name: true, lifecycle: true } } },
      orderBy: { nextRunAt: 'asc' },
    });
  }

  getSchedulerStatus() {
    return { enabled: process.env.AUTOMATION_SCHEDULER_ENABLED === 'true' };
  }

  async createSchedule(
    tenantId: string,
    userId: string,
    input: { workflowCode: string; frequencyMinutes: number; timezone?: string },
  ) {
    const workflow = await this.getWorkflow(tenantId, input.workflowCode);
    if (workflow.lifecycle !== 'ACTIVE' && workflow.lifecycle !== 'READY') {
      throw new BadRequestException('Seuls les workflows READY ou ACTIVE peuvent être planifiés');
    }
    this.assertActionsExecutable(workflow);
    this.assertSchedule(input.frequencyMinutes, input.timezone || 'UTC');
    const workflowRow = await this.prisma.automationWorkflow.findUniqueOrThrow({
      where: { tenantId_code: { tenantId, code: input.workflowCode } },
      select: { id: true },
    });
    return this.prisma.automationSchedule.create({
      data: {
        tenantId,
        workflowId: workflowRow.id,
        frequencyMinutes: input.frequencyMinutes,
        timezone: input.timezone || 'UTC',
        nextRunAt: new Date(Date.now() + input.frequencyMinutes * 60_000),
        createdBy: userId,
      },
      include: { workflow: { select: { code: true, name: true, lifecycle: true } } },
    });
  }

  async updateSchedule(
    tenantId: string,
    id: string,
    input: { frequencyMinutes?: number; timezone?: string; enabled?: boolean },
  ) {
    const current = await this.prisma.automationSchedule.findFirst({ where: { id, tenantId } });
    if (!current) throw new NotFoundException('Planification non trouvée');
    const frequencyMinutes = input.frequencyMinutes ?? current.frequencyMinutes;
    const timezone = input.timezone ?? current.timezone;
    this.assertSchedule(frequencyMinutes, timezone);
    return this.prisma.automationSchedule.update({
      where: { id },
      data: {
        frequencyMinutes,
        timezone,
        enabled: input.enabled ?? current.enabled,
        ...(input.frequencyMinutes !== undefined ? {
          nextRunAt: new Date(Date.now() + frequencyMinutes * 60_000),
        } : {}),
      },
      include: { workflow: { select: { code: true, name: true, lifecycle: true } } },
    });
  }

  async deleteSchedule(tenantId: string, id: string): Promise<void> {
    const result = await this.prisma.automationSchedule.deleteMany({ where: { id, tenantId } });
    if (result.count === 0) throw new NotFoundException('Planification non trouvée');
  }

  private async runDueSchedules(): Promise<void> {
    if (this.running) return;
    this.running = true;
    try {
      const due = await this.prisma.automationSchedule.findMany({
        where: { enabled: true, nextRunAt: { lte: new Date() } },
        orderBy: { nextRunAt: 'asc' },
        take: 50,
      });
      for (const schedule of due) {
        const now = new Date();
        const claimed = await this.prisma.automationSchedule.updateMany({
          where: { id: schedule.id, enabled: true, nextRunAt: { lte: now } },
          data: {
            nextRunAt: new Date(now.getTime() + schedule.frequencyMinutes * 60_000),
            lastRunAt: now,
            lastRunStatus: 'RUNNING',
            lastRunError: null,
          },
        });
        if (claimed.count !== 1) continue;

        try {
          const workflowRow = await this.prisma.automationWorkflow.findFirst({
            where: { id: schedule.workflowId, tenantId: schedule.tenantId },
          });
          if (!workflowRow) throw new NotFoundException('Workflow planifié introuvable');
          const workflow = this.toDefinition(workflowRow);
          const context: AutomationContext = {
            tenantId: schedule.tenantId,
            userId: schedule.createdBy,
            applicationId: 'automation',
            environmentId: process.env.NODE_ENV || 'development',
            eventId: `schedule-${schedule.id}`,
            traceId: `schedule-${schedule.id}-${now.getTime()}`,
            permissions: [],
            variables: {},
            locale: schedule.timezone,
          };
          const execution = await this.workflowEngine.startWorkflowDefinition(workflow, context);
          await this.prisma.automationSchedule.updateMany({
            where: { id: schedule.id, tenantId: schedule.tenantId },
            data: {
              lastRunStatus: execution.status,
              lastRunError: execution.status === 'SUCCEEDED' ? null : execution.timeline.at(-1)?.detail || 'Workflow failed',
              lastExecutionId: execution.executionId,
            },
          });
        } catch (error) {
          this.logger.error(`Échec de la planification ${schedule.id} (${error instanceof Error ? error.name : 'unknown error'}).`);
          await this.prisma.automationSchedule.updateMany({
            where: { id: schedule.id, tenantId: schedule.tenantId },
            data: { lastRunStatus: 'FAILED', lastRunError: 'Échec d’exécution. Consultez les journaux serveur autorisés.' },
          });
        }
      }
    } catch (error) {
      this.logger.error(`Échec du tick des planifications: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      this.running = false;
    }
  }

  private assertValid(workflow: WorkflowDefinition): void {
    const result = this.workflowEngine.validateWorkflow(workflow);
    if (!result.valid) throw new BadRequestException(`Workflow invalide: ${result.errors.join('; ')}`);
  }

  private assertActionsExecutable(workflow: WorkflowDefinition): void {
    for (const step of workflow.steps) {
      if (step.type !== 'ACTION' || !step.actionRef) continue;
      if (typeof this.actionEngine.getAction(step.actionRef).handler !== 'function') {
        throw new BadRequestException(`L’action de l’étape "${step.id}" ne dispose d’aucun handler serveur`);
      }
    }
  }

  private assertSchedule(frequencyMinutes: number, timezone: string): void {
    if (!Number.isInteger(frequencyMinutes) || frequencyMinutes < 1 || frequencyMinutes > 10080) {
      throw new BadRequestException('La fréquence doit être comprise entre 1 et 10080 minutes');
    }
    try {
      new Intl.DateTimeFormat('en', { timeZone: timezone });
    } catch {
      throw new BadRequestException('Fuseau horaire invalide');
    }
  }

  private toDefinition(row: {
    tenantId: string;
    code: string;
    name: string;
    lifecycle: string;
    version: string;
    steps: unknown;
    maxSteps: number;
  }): WorkflowDefinition {
    return {
      tenantId: row.tenantId,
      code: row.code,
      nom: row.name,
      lifecycle: row.lifecycle as WorkflowLifecycle,
      version: row.version,
      steps: row.steps as WorkflowStep[],
      maxSteps: row.maxSteps,
    };
  }

  private isUniqueViolation(error: unknown): boolean {
    return typeof error === 'object' && error !== null && 'code' in error && error.code === 'P2002';
  }
}
