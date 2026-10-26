import { ObservabilityService } from './observability.service';

const log = (tenantId: string, traceId: string, timestamp: string, severity = 'INFO') => ({ id: `${tenantId}-${traceId}-${timestamp}`, timestamp: new Date(timestamp), tenantId, traceId, requestId: `request-${traceId}`, correlationId: null, module: 'iam', service: 'api', operation: 'GET /', severity, status: severity === 'ERROR' ? '500' : '200', durationMs: severity === 'ERROR' ? 50 : 20, category: 'APPLICATION', event: 'request.done', message: `event ${tenantId}`, attributes: {} });

describe('ObservabilityService durable telemetry', () => {
  it('groups only the current tenant’s persisted correlated log events', async () => {
    const prisma: any = { observabilityLog: { create: jest.fn().mockResolvedValue({}), findMany: jest.fn().mockResolvedValue([log('tenant-a', 'trace-a', '2026-10-21T10:00:00.000Z'), log('tenant-a', 'trace-a', '2026-10-21T10:00:01.000Z', 'ERROR'), log('tenant-b', 'trace-b', '2026-10-21T10:00:02.000Z')]) } };
    const service = new ObservabilityService(prisma, {} as any, { redact: (value: unknown) => value } as any);
    const result = await service.searchTraces({ tenantId: 'tenant-a', isSuperAdmin: false } as any, { from: '2026-10-21T09:00:00.000Z', to: '2026-10-21T11:00:00.000Z' });
    expect(result.total).toBe(1);
    expect(result.items[0]).toMatchObject({ traceId: 'trace-a', events: 2, errors: 1, status: 'ERROR', durationMs: 50 });
    expect(prisma.observabilityLog.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: expect.objectContaining({ tenantId: 'tenant-a' }) }));
  });

  it('exports only scoped, persisted logs and records the export in audit', async () => {
    const prisma: any = { observabilityLog: { create: jest.fn().mockResolvedValue({}), findMany: jest.fn().mockResolvedValue([log('tenant-a', 'trace-a', '2026-10-21T10:00:00.000Z')]) }, auditEvent: { create: jest.fn().mockResolvedValue({ id: 'audit-export' }) } };
    const service = new ObservabilityService(prisma, {} as any, { redact: (value: unknown) => value } as any);
    const result = await service.exportData({ userId: 'user-a', tenantId: 'tenant-a', isSuperAdmin: false } as any, 'LOGS', { from: '2026-10-21T09:00:00.000Z', to: '2026-10-21T11:00:00.000Z' });
    expect(result).toMatchObject({ source: 'LOGS', count: 1 });
    expect(result.items[0]).toMatchObject({ tenantId: 'tenant-a' });
    expect(prisma.auditEvent.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ action: 'OBSERVABILITY_EXPORT', actorId: 'user-a', tenantId: 'tenant-a' }) }));
  });

  it('does not expose cached data if the durable log provider is unavailable', async () => {
    const prisma: any = { observabilityLog: { create: jest.fn().mockResolvedValue({}), findMany: jest.fn().mockRejectedValue(new Error('database down')) } };
    const service = new ObservabilityService(prisma, {} as any, { redact: (value: unknown) => value } as any);
    await expect(service.searchLogs({ tenantId: 'tenant-a', isSuperAdmin: false } as any, {})).rejects.toThrow('OBS_SOURCE_UNAVAILABLE');
  });
});
