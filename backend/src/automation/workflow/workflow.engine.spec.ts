import { WorkflowEngine, WorkflowDefinition } from './workflow.engine';
import { ConditionsEngine } from '../conditions/conditions.engine';
import { ActionEngine } from '../action/action.engine';
import { AutomationContext } from '../interfaces/automation.contract';

describe('WorkflowEngine', () => {
  let workflowEngine: WorkflowEngine;
  let ctx: AutomationContext;

  const workflow: WorkflowDefinition = {
    code: 'wf.simple',
    nom: 'Workflow simple',
    lifecycle: 'ACTIVE',
    version: '1.0',
    steps: [
      { id: 'start', type: 'START', next: 'cond' },
      { id: 'cond', type: 'CONDITION', condition: { field: 'approved', operator: 'EQ', value: true }, transitions: { YES: 'act', NO: 'end' } },
      { id: 'act', type: 'ACTION', actionRef: 'send.notification', next: 'end' },
      { id: 'end', type: 'END' },
    ],
    maxSteps: 10,
  };

  beforeEach(() => {
    const conditionsEngine = new ConditionsEngine();
    const actionEngine = new ActionEngine();
    workflowEngine = new WorkflowEngine(conditionsEngine, actionEngine);
    actionEngine.registerAction({
      code: 'send.notification',
      category: 'NOTIFICATION',
      retryable: true,
      timeout: 5000,
      idempotent: true,
      version: '1.0',
      handler: async () => ({ success: true }),
    });
    workflowEngine.registerWorkflow(workflow);

    ctx = {
      tenantId: 'tenant-1',
      userId: 'user-1',
      traceId: 'trace-1',
      permissions: ['*'],
      variables: { approved: true },
    };
  });

  describe('registration & validation', () => {
    it('should register and retrieve a workflow', () => {
      const wf = workflowEngine.getWorkflow('wf.simple');
      expect(wf.code).toBe('wf.simple');
    });

    it('should reject workflow without start', () => {
      const invalid: WorkflowDefinition = { ...workflow, code: 'wf.bad', steps: [{ id: 'a', type: 'STEP', next: 'b' }, { id: 'b', type: 'END' }] };
      const result = workflowEngine.validateWorkflow(invalid);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes('START'))).toBe(true);
    });

    it('should reject workflow with unknown transition target', () => {
      const invalid: WorkflowDefinition = { ...workflow, code: 'wf.bad2', steps: [{ id: 'start', type: 'START', next: 'ghost' }, { id: 'end', type: 'END' }] };
      const result = workflowEngine.validateWorkflow(invalid);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes('inconnue'))).toBe(true);
    });

    it('should reject workflow actions that are not registered', () => {
      const invalid: WorkflowDefinition = {
        ...workflow,
        code: 'wf.bad-action',
        steps: [
          { id: 'start', type: 'START', next: 'act' },
          { id: 'act', type: 'ACTION', actionRef: 'unknown.action', next: 'end' },
          { id: 'end', type: 'END' },
        ],
      };
      expect(workflowEngine.validateWorkflow(invalid)).toEqual({
        valid: false,
        errors: ['Action inconnue "unknown.action" pour l\'etape act'],
      });
    });

    it('should create workflows as drafts and reject duplicate codes', () => {
      const draft: WorkflowDefinition = {
        ...workflow,
        code: 'wf.created',
        lifecycle: 'ACTIVE',
      };
      expect(workflowEngine.createWorkflow(draft).lifecycle).toBe('DRAFT');
      expect(() => workflowEngine.createWorkflow(draft)).toThrow('existe deja');
    });

    it('should save edits as drafts and refuse to change the workflow code', () => {
      const edited = workflowEngine.updateWorkflow('wf.simple', {
        ...workflow,
        nom: 'Workflow modifie',
      });
      expect(edited.nom).toBe('Workflow modifie');
      expect(edited.lifecycle).toBe('DRAFT');
      expect(() => workflowEngine.updateWorkflow('wf.simple', {
        ...workflow,
        code: 'wf.changed',
      })).toThrow('ne peut pas etre modifie');
    });

    it('should refuse to activate invalid workflow definitions', () => {
      workflowEngine.getWorkflow('wf.simple').steps[0].next = 'missing';
      expect(() => workflowEngine.setLifecycle('wf.simple', 'ACTIVE')).toThrow('Workflow invalide');
    });
  });

  describe('execution', () => {
    it('should run a workflow to completion', async () => {
      const rec = await workflowEngine.startWorkflow('wf.simple', ctx);
      expect(rec.status).toBe('SUCCEEDED');
      expect(rec.timeline.some((t) => t.event === 'END_REACHED')).toBe(true);
    });

    it('should take the NO branch', async () => {
      const noCtx = { ...ctx, variables: { approved: false } };
      const rec = await workflowEngine.startWorkflow('wf.simple', noCtx);
      expect(rec.status).toBe('SUCCEEDED');
      expect(rec.timeline.some((t) => t.event === 'CONDITION NO')).toBe(true);
    });

    it('should refuse to run a non-ACTIVE workflow', async () => {
      workflowEngine.setLifecycle('wf.simple', 'PAUSED');
      await expect(workflowEngine.startWorkflow('wf.simple', ctx)).rejects.toThrow('non exécutable');
    });

    it('should detect loops (max steps)', async () => {
      const loopWf: WorkflowDefinition = {
        code: 'wf.loop',
        nom: 'Boucle',
        lifecycle: 'ACTIVE',
        version: '1.0',
        steps: [{ id: 'start', type: 'START', next: 'a' }, { id: 'a', type: 'STEP', next: 'a' }, { id: 'end', type: 'END' }],
        maxSteps: 3,
      };
      workflowEngine.registerWorkflow(loopWf);
      const rec = await workflowEngine.startWorkflow('wf.loop', ctx);
      expect(rec.status).toBe('FAILED');
    });

    it('should stop the workflow when an action reports failure', async () => {
      const failingActionEngine = new ActionEngine();
      failingActionEngine.registerAction({
        code: 'send.notification',
        category: 'NOTIFICATION',
        retryable: false,
        timeout: 1000,
        idempotent: false,
        version: '1.0',
        handler: async () => ({ success: false, error: 'notification rejected' }),
      });
      const engineWithFailingAction = new WorkflowEngine(new ConditionsEngine(), failingActionEngine);
      engineWithFailingAction.registerWorkflow(workflow);

      const rec = await engineWithFailingAction.startWorkflow('wf.simple', ctx);
      expect(rec.status).toBe('FAILED');
      expect(rec.timeline.some((entry) => entry.status === 'FAILED')).toBe(true);
    });
  });

  describe('execution records', () => {
    it('should store execution history', async () => {
      await workflowEngine.startWorkflow('wf.simple', ctx);
      const executions = workflowEngine.getExecutions();
      expect(executions.length).toBeGreaterThan(0);
      expect(executions[0].executionId).toBeDefined();
      expect(workflowEngine.getExecution(executions[0].executionId)).toBeDefined();
    });
  });
});
