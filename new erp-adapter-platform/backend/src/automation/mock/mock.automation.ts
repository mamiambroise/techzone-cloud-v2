// WF-CDC-00 : Mock Automation conforme au Automation Contract v1
// Permet le developpement parallele sans dependre de l'implementation interne.

import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { RulesEngine } from '../rules/rules.engine';
import { WorkflowEngine, WorkflowDefinition } from '../workflow/workflow.engine';
import { TriggerEngine, TriggerDefinition } from '../trigger/trigger.engine';
import { ActionEngine, ActionDefinition } from '../action/action.engine';
import { RuleDefinition } from '../interfaces/rule.contract';

@Injectable()
export class MockAutomation implements OnModuleInit {
  private readonly logger = new Logger(MockAutomation.name);

  constructor(
    private readonly rulesEngine: RulesEngine,
    private readonly workflowEngine: WorkflowEngine,
    private readonly triggerEngine: TriggerEngine,
    private readonly actionEngine: ActionEngine,
  ) {}

  onModuleInit(): void {
    this.registerActions();
    this.registerRules();
    this.registerWorkflows();
    this.registerTriggers();
    this.logger.log('Mock Automation initie (conforme Automation Contract v1)');
  }

  private registerActions(): void {
    const defs: ActionDefinition[] = [
      { code: 'send.notification', category: 'NOTIFICATION', retryable: true, timeout: 5000, idempotent: true, version: '1.0' },
      { code: 'workflow.start', category: 'WORKFLOW_START', retryable: true, timeout: 5000, idempotent: true, version: '1.0' },
      { code: 'data.update', category: 'DATA_UPDATE', retryable: true, timeout: 10000, idempotent: true, version: '1.0' },
    ];
    defs.forEach((d) => this.actionEngine.registerAction(d));
  }

  private registerRules(): void {
    const rules: RuleDefinition[] = [
      {
        code: 'rule.invoice.total.high',
        nom: 'Commande a fort montant',
        status: 'ACTIVE',
        priority: 100,
        version: '1.0',
        conditions: {
          logic: 'AND',
          conditions: [
            { field: 'invoice.total', operator: 'GT', value: 100000 },
            { field: 'invoice.status', operator: 'EQ', value: 'VALIDATED' },
          ],
        },
        effects: ['send.notification', 'workflow.invoice-validation'],
        allowedContextFields: ['invoice.total', 'invoice.status'],
      },
      {
        code: 'rule.stock.low',
        nom: 'Stock bas',
        status: 'ACTIVE',
        priority: 80,
        version: '1.0',
        conditions: {
          field: 'stock.current',
          operator: 'LTE',
          value: 5,
        },
        effects: ['send.notification'],
        allowedContextFields: ['stock.current'],
      },
      {
        code: 'rule.invoice.total.high.draft',
        nom: 'Commande fort montant (brouillon)',
        status: 'INACTIVE',
        priority: 90,
        version: '1.0',
        conditions: { field: 'invoice.status', operator: 'EQ', value: 'DRAFT' },
        effects: [],
      },
    ];
    rules.forEach((r) => this.rulesEngine.registerRule(r));
  }

  private registerWorkflows(): void {
    const wfs: WorkflowDefinition[] = [
      {
        code: 'workflow.invoice-validation',
        nom: 'Validation de facture',
        lifecycle: 'ACTIVE',
        version: '1.0',
        steps: [
          { id: 'start', type: 'START', next: 'step-check-total' },
          { id: 'step-check-total', type: 'STEP', name: 'Verifier total', next: 'cond-high' },
          { id: 'cond-high', type: 'CONDITION', name: 'Total eleve?', condition: { field: 'invoice.total', operator: 'GT', value: 100000 }, transitions: { YES: 'act-notify', NO: 'end' } },
          { id: 'act-notify', type: 'ACTION', name: 'Notifier', actionRef: 'send.notification', next: 'end' },
          { id: 'end', type: 'END' },
        ],
        maxSteps: 10,
      },
      {
        code: 'workflow.stock-replenish',
        nom: 'Reapprovisionnement stock',
        lifecycle: 'ACTIVE',
        version: '1.0',
        steps: [
          { id: 'start', type: 'START', next: 'cond-low' },
          { id: 'cond-low', type: 'CONDITION', condition: { field: 'stock.current', operator: 'LTE', value: 5 }, transitions: { YES: 'end', NO: 'end' } },
          { id: 'end', type: 'END' },
        ],
        maxSteps: 5,
      },
    ];
    wfs.forEach((w) => this.workflowEngine.registerWorkflow(w));
  }

  private registerTriggers(): void {
    const defs: TriggerDefinition[] = [
      {
        code: 'trigger.invoice.created',
        type: 'EVENT',
        source: 'erp',
        event: 'invoice.created',
        targetWorkflow: 'workflow.invoice-validation',
        enabled: true,
        version: '1.0',
        idempotencyPolicy: 'EXACTLY_ONCE',
      },
      {
        code: 'trigger.stock.changed',
        type: 'DATA_CHANGE',
        source: 'erp',
        event: 'stock.changed',
        targetRule: 'rule.stock.low',
        enabled: true,
        version: '1.0',
        idempotencyPolicy: 'AT_LEAST_ONCE',
      },
      {
        code: 'trigger.manual.validate',
        type: 'MANUAL',
        targetWorkflow: 'workflow.invoice-validation',
        enabled: true,
        version: '1.0',
      },
    ];
    defs.forEach((t) => this.triggerEngine.registerTrigger(t));
  }
}
