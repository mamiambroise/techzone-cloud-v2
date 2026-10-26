import { HistoryService } from './history.service';

describe('HistoryService tenant metrics', () => {
  it('does not aggregate another tenant in exposed metrics', () => {
    const service = new HistoryService();

    service.recordExecution({
      tenantId: 'tenant-a',
      operation: 'QUERY',
      resource: 'Product',
      status: 'SUCCESS',
      duration: 10,
      startTime: new Date().toISOString(),
      traceId: 'trace-a',
    } as any);
    service.recordExecution({
      tenantId: 'tenant-b',
      operation: 'QUERY',
      resource: 'Product',
      status: 'DENIED',
      duration: 100,
      startTime: new Date().toISOString(),
      traceId: 'trace-b',
    } as any);

    expect(service.getMetrics('tenant-a')).toMatchObject({
      queryCount: 1,
      executionCount: 1,
      successRate: 100,
      deniedCount: 0,
      averageLatency: 10,
    });
  });
});
