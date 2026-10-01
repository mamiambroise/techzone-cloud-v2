import { AutomationHistoryService } from './automation-history.service';
import type { AutomationExecutionRecord } from '../interfaces/rule.contract';

function rec(overrides: Partial<AutomationExecutionRecord> = {}): AutomationExecutionRecord {
  return {
    executionId: 'exec-1',
    traceId: 'trace-1',
    tenantId: 'tenant-A',
    workflowCode: 'wf.validate',
    version: '1.0',
    startedAt: '2026-09-01T10:00:00.000Z',
    finishedAt: '2026-09-01T10:00:01.000Z',
    status: 'SUCCEEDED',
    retryCount: 0,
    applicationId: 'automation',
    ...overrides,
  } as AutomationExecutionRecord;
}

describe('AutomationHistoryService', () => {
  let service: AutomationHistoryService;

  beforeEach(() => {
    service = new AutomationHistoryService();
  });

  describe('durée', () => {
    it('calcule la durée depuis startedAt / finishedAt quand elle est absente', () => {
      service.recordExecution(rec());
      expect(service.getById('exec-1', 'tenant-A')?.duration).toBe(1000);
      expect(service.getMetrics().averageDuration).toBe(1000);
    });

    it('conserve la durée fournie par l’appelant', () => {
      service.recordExecution(rec({ duration: 42 }));
      expect(service.getById('exec-1', 'tenant-A')?.duration).toBe(42);
    });
  });

  describe('searchPaged', () => {
    it('ne renvoie jamais les exécutions d’un autre tenant', () => {
      service.recordExecution(rec({ executionId: 'a', tenantId: 'tenant-A' }));
      service.recordExecution(rec({ executionId: 'b', tenantId: 'tenant-B' }));

      const page = service.searchPaged({}, 'tenant-A');
      expect(page.total).toBe(1);
      expect(page.items.map((r) => r.executionId)).toEqual(['a']);
    });

    it('trie de la plus récente à la plus ancienne', () => {
      service.recordExecution(rec({ executionId: 'old', startedAt: '2026-09-01T08:00:00.000Z' }));
      service.recordExecution(rec({ executionId: 'new', startedAt: '2026-09-01T12:00:00.000Z' }));
      service.recordExecution(rec({ executionId: 'mid', startedAt: '2026-09-01T10:00:00.000Z' }));

      const ids = service.searchPaged({}, 'tenant-A').items.map((r) => r.executionId);
      expect(ids).toEqual(['new', 'mid', 'old']);
    });

    it('pagine et renvoie le total', () => {
      for (let i = 0; i < 25; i++) {
        service.recordExecution(
          rec({ executionId: `e${i}`, startedAt: new Date(Date.UTC(2026, 8, 1, 0, i)).toISOString() }),
        );
      }
      const p1 = service.searchPaged({ page: 1, pageSize: 10 }, 'tenant-A');
      const p3 = service.searchPaged({ page: 3, pageSize: 10 }, 'tenant-A');

      expect(p1.total).toBe(25);
      expect(p1.items).toHaveLength(10);
      expect(p1.items[0].executionId).toBe('e24');
      expect(p3.items).toHaveLength(5);
    });

    it('plafonne pageSize à 100 et tolère des valeurs invalides', () => {
      service.recordExecution(rec());
      expect(service.searchPaged({ pageSize: 5000 }, 'tenant-A').pageSize).toBe(100);
      expect(service.searchPaged({ page: -3, pageSize: NaN as any }, 'tenant-A')).toMatchObject({
        page: 1,
        pageSize: 20,
      });
    });

    it('filtre par statut, workflow, texte et période', () => {
      service.recordExecution(rec({ executionId: 'ok', status: 'SUCCEEDED' }));
      service.recordExecution(
        rec({ executionId: 'ko', status: 'FAILED', workflowCode: 'wf.sync', traceId: 'tr-xyz' }),
      );

      expect(service.searchPaged({ status: 'failed' }, 'tenant-A').items.map((r) => r.executionId)).toEqual(['ko']);
      expect(service.searchPaged({ workflowCode: 'wf.sync' }, 'tenant-A').total).toBe(1);
      expect(service.searchPaged({ q: 'TR-XYZ' }, 'tenant-A').total).toBe(1);
      expect(service.searchPaged({ from: '2026-09-02T00:00:00Z' }, 'tenant-A').total).toBe(0);
      expect(service.searchPaged({ to: '2026-09-02T00:00:00Z' }, 'tenant-A').total).toBe(2);
    });
  });

  describe('getById', () => {
    it('refuse l’accès à une exécution d’un autre tenant', () => {
      service.recordExecution(rec({ executionId: 'secret', tenantId: 'tenant-B' }));
      expect(service.getById('secret', 'tenant-A')).toBeUndefined();
      expect(service.getById('secret', 'tenant-B')).toBeDefined();
    });
  });

  describe('getMetrics', () => {
    it('isole les métriques par tenant', () => {
      service.recordExecution(rec({ executionId: 'a', tenantId: 'tenant-A', status: 'SUCCEEDED' }));
      service.recordExecution(rec({ executionId: 'b', tenantId: 'tenant-B', status: 'FAILED' }));

      expect(service.getMetrics('tenant-A')).toMatchObject({ executionsCount: 1, succeededCount: 1, failedCount: 0 });
      expect(service.getMetrics('tenant-B')).toMatchObject({ executionsCount: 1, failedCount: 1 });
      expect(service.getMetrics().executionsCount).toBe(2);
    });
  });
});
