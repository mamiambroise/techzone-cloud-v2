import { ActionEngine } from './action.engine';

describe('ActionEngine', () => {
  let engine: ActionEngine;

  beforeEach(() => {
    engine = new ActionEngine();
  });

  describe('registerAction', () => {
    it('should register and retrieve an action', () => {
      engine.registerAction({ code: 'act.test', category: 'NOTIFICATION', retryable: true, timeout: 1000, idempotent: true, version: '1.0' });
      expect(engine.getAction('act.test').code).toBe('act.test');
    });

    it('should reject action without code', () => {
      expect(() => engine.registerAction({ code: '', category: 'NOTIFICATION', retryable: true, timeout: 1, idempotent: true, version: '1' })).toThrow('code requis');
    });

    it('should reject unknown action on get', () => {
      expect(() => engine.getAction('does.not.exist')).toThrow('non enregistree');
    });
  });

  describe('executeAction', () => {
    const ctx = { tenantId: 't1', userId: 'u1', traceId: 'tr1' };

    it('should SUCCEED a no-op action', async () => {
      engine.registerAction({ code: 'act.noop', category: 'NOTIFICATION', retryable: true, timeout: 1000, idempotent: false, version: '1' });
      const outcome = await engine.executeAction('act.noop', ctx);
      expect(outcome).toBe('SUCCEEDED');
    });

    it('should SUCCEED a handler that returns success', async () => {
      engine.registerAction({
        code: 'act.ok', category: 'HTTP', retryable: true, timeout: 1000, idempotent: false, version: '1',
        handler: async () => ({ success: true }),
      });
      expect(await engine.executeAction('act.ok', ctx)).toBe('SUCCEEDED');
    });

    it('should FAIL when handler returns failure', async () => {
      engine.registerAction({
        code: 'act.fail', category: 'HTTP', retryable: true, timeout: 1000, idempotent: false, version: '1',
        handler: async () => ({ success: false, error: 'boom' }),
      });
      expect(await engine.executeAction('act.fail', ctx)).toBe('FAILED');
    });

    it('should re-execute idempotent actions per traceId', async () => {
      let calls = 0;
      engine.registerAction({
        code: 'act.idempotent', category: 'HTTP', retryable: true, timeout: 1000, idempotent: true, version: '1',
        handler: async () => { calls++; return { success: true }; },
      });
      await engine.executeAction('act.idempotent', ctx);
      await engine.executeAction('act.idempotent', ctx);
      expect(calls).toBe(1);
    });
  });
});
