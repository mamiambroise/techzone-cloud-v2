import { TriggerEngine } from './trigger.engine';
import { ConditionsEngine } from '../conditions/conditions.engine';
import { ActionEngine } from '../action/action.engine';
import { WorkflowEngine } from '../workflow/workflow.engine';
import { RulesEngine } from '../rules/rules.engine';
import { AutomationContext } from '../interfaces/automation.contract';

describe('TriggerEngine', () => {
  let triggerEngine: TriggerEngine;
  let ctx: AutomationContext;

  beforeEach(() => {
    const conditionsEngine = new ConditionsEngine();
    const actionEngine = new ActionEngine();
    const workflowEngine = new WorkflowEngine(conditionsEngine, actionEngine);
    const rulesEngine = new RulesEngine(conditionsEngine);

    workflowEngine.registerWorkflow({
      code: 'wf.invoice',
      nom: 'Facture',
      lifecycle: 'ACTIVE',
      version: '1.0',
      steps: [{ id: 'start', type: 'START', next: 'end' }, { id: 'end', type: 'END' }],
    });

    rulesEngine.registerRule({
      code: 'rule.stock.low',
      nom: 'Stock bas',
      status: 'ACTIVE',
      priority: 10,
      version: '1.0',
      conditions: { field: 'stock.current', operator: 'LTE', value: 5 },
      effects: ['send.notification'],
    });

    triggerEngine = new TriggerEngine(workflowEngine, rulesEngine);
    triggerEngine.registerTrigger({
      code: 'trig.invoice',
      type: 'EVENT',
      source: 'erp',
      event: 'invoice.created',
      targetWorkflow: 'wf.invoice',
      enabled: true,
      version: '1.0',
      idempotencyPolicy: 'EXACTLY_ONCE',
    });
    triggerEngine.registerTrigger({
      code: 'trig.stock',
      type: 'DATA_CHANGE',
      event: 'stock.changed',
      targetRule: 'rule.stock.low',
      enabled: true,
      version: '1.0',
      filters: { productId: 1 },
    });
    triggerEngine.registerTrigger({
      code: 'trig.disabled',
      type: 'EVENT',
      event: 'x',
      targetWorkflow: 'wf.invoice',
      enabled: false,
      version: '1.0',
    });

    ctx = { tenantId: 'tenant-1', userId: 'user-1', traceId: 'trace-1', permissions: ['*'], variables: {} };
  });

  describe('processEvent', () => {
    it('should trigger a workflow on matching event', async () => {
      const results = await triggerEngine.processEvent({ eventType: 'invoice.created', source: 'erp' }, ctx);
      expect(results.some((r) => r.triggerCode === 'trig.invoice')).toBe(true);
      const matched = results.find((r) => r.triggerCode === 'trig.invoice');
      expect(matched!.status).toBe('SUCCEEDED');
    });

    it('should ignore non-matching events', async () => {
      const results = await triggerEngine.processEvent({ eventType: 'other.event', source: 'erp' }, ctx);
      expect(results).toHaveLength(0);
    });

    it('should apply filters', async () => {
      const results = await triggerEngine.processEvent(
        { eventType: 'stock.changed', source: 'erp', data: { productId: 2 } },
        ctx,
      );
      const stock = results.find((r) => r.triggerCode === 'trig.stock');
      expect(stock).toBeUndefined();
    });

    it('should ignore disabled triggers', async () => {
      const results = await triggerEngine.processEvent({ eventType: 'x', source: 'any' }, ctx);
      expect(results.some((r) => r.triggerCode === 'trig.disabled')).toBe(false);
    });

    it('should deduplicate exactly-once events', async () => {
      const payload = { eventType: 'invoice.created', source: 'erp', timestamp: '2026-01-01T00:00:00Z' };
      const first = await triggerEngine.processEvent(payload, ctx);
      const second = await triggerEngine.processEvent(payload, ctx);
      expect(first.some((r) => r.triggerCode === 'trig.invoice' && r.status !== 'SKIPPED_DUPLICATE')).toBe(true);
      expect(second.some((r) => r.triggerCode === 'trig.invoice' && r.status === 'SKIPPED_DUPLICATE')).toBe(true);
    });
  });

  describe('fireManual', () => {
    it('should fire a manual trigger', async () => {
      triggerEngine.registerTrigger({ code: 'trig.manual', type: 'MANUAL', targetWorkflow: 'wf.invoice', enabled: true, version: '1.0' });
      const result = await triggerEngine.fireManual('trig.manual', ctx);
      expect(result.status).toBe('SUCCEEDED');
    });

    it('should refuse non-manual trigger', async () => {
      await expect(triggerEngine.fireManual('trig.invoice', ctx)).rejects.toThrow('non declenchable');
    });
    it('should report disabled manual trigger', async () => {
      triggerEngine.registerTrigger({ code: 'trig.manual2', type: 'MANUAL', targetWorkflow: 'wf.invoice', enabled: false, version: '1.0' });
      const result = await triggerEngine.fireManual('trig.manual2', ctx);
      expect(result.status).toBe('DISABLED');
    });
  });

  describe('lifecycle', () => {
    it('should enable/disable triggers', () => {
      triggerEngine.setEnabled('trig.invoice', false);
      expect(triggerEngine.getTrigger('trig.invoice').enabled).toBe(false);
      triggerEngine.setEnabled('trig.invoice', true);
      expect(triggerEngine.getTrigger('trig.invoice').enabled).toBe(true);
    });

    it('should list only enabled triggers', () => {
      const enabled = triggerEngine.getEnabledTriggers();
      expect(enabled.length).toBe(2);
    });
  });
});
