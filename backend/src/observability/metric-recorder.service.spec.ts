import { MetricRecorderService } from './metric-recorder.service';

describe('MetricRecorderService', () => {
  it('rejects high-cardinality labels', () => {
    const recorder = new MetricRecorderService();
    expect(() => recorder.increment('techzone_api_requests_total', { requestId: 'unsafe' })).toThrow('OBS_METRIC_LABEL_FORBIDDEN');
  });

  it('records observed measurements rather than seeded values', () => {
    const recorder = new MetricRecorderService();
    expect(recorder.query()).toEqual([]);
    recorder.observe('techzone_api_request_duration_ms', 24, { module: 'iam' });
    expect(recorder.query('techzone_api_request_duration_ms')).toHaveLength(1);
  });

  it('persists bounded metric points with their tenant scope', async () => {
    const prisma: any = { observabilityMetric: { create: jest.fn().mockResolvedValue({}), findMany: jest.fn().mockResolvedValue([{ name: 'techzone_api_requests_total', type: 'COUNTER', value: 1, timestamp: new Date('2026-10-21T10:00:00Z'), labels: { tenantId: 'tenant-a' } }]) } };
    const recorder = new MetricRecorderService(prisma);
    recorder.increment('techzone_api_requests_total', { tenantId: 'tenant-a', module: 'iam' });
    await Promise.resolve();
    const points = await recorder.queryPersisted('techzone_api_requests_total', new Date('2026-10-21T09:00:00Z'), 'tenant-a');
    expect(prisma.observabilityMetric.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ tenantId: 'tenant-a' }) }));
    expect(points).toHaveLength(1);
    expect(prisma.observabilityMetric.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: expect.objectContaining({ tenantId: 'tenant-a' }) }));
  });

  it('reports an unavailable durable provider instead of returning memory data', async () => {
    const recorder = new MetricRecorderService({ observabilityMetric: { create: jest.fn().mockRejectedValue(new Error('database down')), findMany: jest.fn().mockRejectedValue(new Error('database down')) } } as any);
    recorder.observe('techzone_api_request_duration_ms', 24, { module: 'iam' });
    await expect(recorder.queryPersisted()).rejects.toThrow('OBS_SOURCE_UNAVAILABLE');
  });
});
