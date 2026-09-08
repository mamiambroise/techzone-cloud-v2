// WF-CDC-03 : Workflow Engine
// Orchestre une sequence controlee d'etapes, conditions et actions.

import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import {
  WorkflowStep,
  WorkflowLifecycle,
  AutomationContext,
  ConditionNode,
} from '../interfaces/automation.contract';
import { ConditionsEngine } from '../conditions/conditions.engine';
import { ActionEngine } from '../action/action.engine';

export interface WorkflowDefinition {
  code: string;
  nom: string;
  lifecycle: WorkflowLifecycle;
  version: string;
  steps: WorkflowStep[];
  maxSteps?: number;
}

export interface WorkflowExecutionRecord {
  executionId: string;
  workflowCode: string;
  version: string;
  context: AutomationContext;
  status: string;
  timeline: Array<{ timestamp: string; event: string; stepId?: string; status: string; detail?: string }>;
  startedAt: string;
  finishedAt?: string;
}

const DEFAULT_MAX_STEPS = 20;

@Injectable()
export class WorkflowEngine {
  private readonly logger = new Logger(WorkflowEngine.name);
  private readonly workflows: Map<string, WorkflowDefinition> = new Map();
  private readonly executions: Map<string, WorkflowExecutionRecord> = new Map();
  private executionSeq = 0;

  constructor(
    private readonly conditionsEngine: ConditionsEngine,
    private readonly actionEngine: ActionEngine,
  ) {}

  registerWorkflow(def: WorkflowDefinition): void {
    const validation = this.validateWorkflow(def);
    if (!validation.valid) {
      throw new BadRequestException(`Workflow invalide: ${validation.errors.join('; ')}`);
    }
    this.workflows.set(def.code, structuredClone(def));
    this.logger.log(`Workflow enregistre: ${def.code} (v${def.version}, ${def.steps.length} etapes)`);
  }

  getWorkflow(code: string): WorkflowDefinition {
    const wf = this.workflows.get(code);
    if (!wf) throw new NotFoundException(`Workflow "${code}" non trouve`);
    return wf;
  }

  getWorkflows(): WorkflowDefinition[] {
    return Array.from(this.workflows.values());
  }

  getActiveWorkflows(): WorkflowDefinition[] {
    return this.getWorkflows().filter((w) => w.lifecycle === 'ACTIVE');
  }

  /**
   * Valide un workflow (steps accessibles, cycles, terminaison).
   */
  validateWorkflow(def: WorkflowDefinition): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!def.code) errors.push('code requis');
    if (!def.nom) errors.push('nom requis');
    if (!def.version) errors.push('version requise');

    if (!Array.isArray(def.steps) || def.steps.length === 0) {
      errors.push('steps requis');
      return { valid: false, errors };
    }

    const maxSteps = def.maxSteps || DEFAULT_MAX_STEPS;
    if (def.steps.length > maxSteps) {
      errors.push(`Nombre d'etapes (${def.steps.length}) depasse la limite (${maxSteps})`);
    }

    // Each step must have an id
    const ids = new Set<string>();
    for (const step of def.steps) {
      if (!step.id) { errors.push('Id d etape requis'); continue; }
      if (ids.has(step.id)) errors.push(`Id d etape duplique: ${step.id}`);
      ids.add(step.id);
    }

    // Exactly one START
    const starts = def.steps.filter((s) => s.type === 'START');
    if (starts.length !== 1) errors.push(`Exactement un START requis (trouve: ${starts.length})`);

    // At least one END
    const ends = def.steps.filter((s) => s.type === 'END');
    if (ends.length === 0) errors.push('Au moins un END requis');

    // Validate transitions reference existing steps
    const transitionTargets = new Set<string>();
    for (const step of def.steps) {
      if (step.next) transitionTargets.add(step.next);
      if (step.transitions) Object.values(step.transitions).forEach((t) => transitionTargets.add(t));
    }
    for (const target of transitionTargets) {
      if (!ids.has(target)) errors.push(`Transition vers etape inconnue: ${target}`);
    }

    return { valid: errors.length === 0, errors };
  }

  /**
   * Lance l'execution d'un workflow.
   */
  async startWorkflow(code: string, ctx: AutomationContext): Promise<WorkflowExecutionRecord> {
    const wf = this.getWorkflow(code);

    if (wf.lifecycle !== 'ACTIVE' && wf.lifecycle !== 'READY') {
      throw new BadRequestException(`Workflow "${code}" non exécutable (lifecycle: ${wf.lifecycle})`);
    }

    const executionId = `wf-${++this.executionSeq}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const record: WorkflowExecutionRecord = {
      executionId,
      workflowCode: code,
      version: wf.version,
      context: { ...ctx, executionId },
      status: 'RUNNING',
      timeline: [{ timestamp: new Date().toISOString(), event: 'WORKFLOW_START', status: 'RUNNING' }],
      startedAt: new Date().toISOString(),
    };
    this.executions.set(executionId, record);

    this.logger.log(`Workflow demarre: ${code} (exec ${executionId})`);

    try {
      const result = await this.executeSteps(wf, record);
      record.status = result.success ? 'SUCCEEDED' : 'FAILED';
      record.timeline.push({
        timestamp: new Date().toISOString(),
        event: result.success ? 'WORKFLOW_SUCCEEDED' : 'WORKFLOW_FAILED',
        status: record.status,
        detail: result.error,
      });
      record.finishedAt = new Date().toISOString();
    } catch (error) {
      record.status = 'FAILED';
      record.timeline.push({
        timestamp: new Date().toISOString(),
        event: 'WORKFLOW_FAILED',
        status: 'FAILED',
        detail: error.message,
      });
      record.finishedAt = new Date().toISOString();
    }

    return record;
  }

  private async executeSteps(
    wf: WorkflowDefinition,
    record: WorkflowExecutionRecord,
  ): Promise<{ success: boolean; error?: string }> {
    const maxSteps = wf.maxSteps || DEFAULT_MAX_STEPS;
    const startStep = wf.steps.find((s) => s.type === 'START');
    if (!startStep) return { success: false, error: 'START introuvable' };

    let current: WorkflowStep | undefined = startStep;
    let stepCount = 0;

    while (current) {
      if (stepCount++ > maxSteps) {
        return { success: false, error: `Boucle detection: depasse ${maxSteps} etapes` };
      }

      const step: WorkflowStep = current;

      if (step.type === 'END') {
        record.timeline.push({
          timestamp: new Date().toISOString(),
          event: 'END_REACHED',
          stepId: step.id,
          status: 'SUCCEEDED',
        });
        return { success: true };
      }

      // Action step
      if (step.type === 'ACTION' && step.actionRef) {
        try {
          const result = await this.actionEngine.executeAction(step.actionRef, {
            tenantId: record.context.tenantId,
            userId: record.context.userId,
            traceId: record.context.traceId,
            variables: record.context.variables,
          });
          record.timeline.push({
            timestamp: new Date().toISOString(),
            event: `ACTION ${step.actionRef}`,
            stepId: step.id,
            status: result === 'SUCCEEDED' ? 'SUCCEEDED' : 'FAILED',
            detail: `outcome=${result}`,
          });
        } catch (error) {
          record.timeline.push({
            timestamp: new Date().toISOString(),
            event: `ACTION ${step.actionRef} FAILED`,
            stepId: step.id,
            status: 'FAILED',
            detail: error.message,
          });
          return { success: false, error: error.message };
        }
      }

      // Condition step
      if (step.type === 'CONDITION' && step.condition) {
        const branch = this.conditionsEngine.evaluate(step.condition, record.context.variables || {})
          ? 'YES'
          : 'NO';
        record.timeline.push({
          timestamp: new Date().toISOString(),
          event: `CONDITION ${branch}`,
          stepId: step.id,
          status: 'SUCCEEDED',
        });
        const nextId: string | undefined = step.transitions?.[branch];
        const fallback: string | undefined = step.next;
        current = wf.steps.find((s) => s.id === nextId) || wf.steps.find((s) => s.id === fallback);
        continue;
      }

      // Regular step or branch
      const nextId2: string | undefined = step.next || (step.type === 'BRANCH' ? step.transitions?.YES : undefined);
      current = wf.steps.find((s) => s.id === nextId2) || undefined;
    }

    return { success: false, error: 'Chemin sans fin (END jamais atteint)' };
  }

  getExecution(executionId: string): WorkflowExecutionRecord {
    const rec = this.executions.get(executionId);
    if (!rec) throw new NotFoundException(`Execution "${executionId}" non trouvee`);
    return rec;
  }

  getExecutions(): WorkflowExecutionRecord[] {
    return Array.from(this.executions.values());
  }

  setLifecycle(code: string, lifecycle: WorkflowLifecycle): void {
    const wf = this.getWorkflow(code);
    wf.lifecycle = lifecycle;
    this.workflows.set(code, wf);
    this.logger.log(`Workflow ${code} lifecycle -> ${lifecycle}`);
  }
}
