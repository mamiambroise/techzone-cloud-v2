import { AlertEvaluatorService } from './alert-evaluator.service';

describe('AlertEvaluatorService', () => {
  const rule = { id: 'rule-1', tenantId: null, code: 'REQUESTS', severity: 'HIGH', cooldownSec: 300, condition: { source: 'METRIC', metric: 'techzone_api_requests_total', operator: 'GTE', threshold: 3 } };

  it('does not open an alert below its actual metric threshold', async () => {
    const prisma: any = { observabilityAlert: { findUnique: jest.fn(), create: jest.fn() } };
    const metrics: any = { queryPersisted: jest.fn().mockResolvedValue([{ value: 2 }]) };
    const service = new AlertEvaluatorService(prisma, metrics, { dispatch: jest.fn() } as any);
    await expect(service.evaluateRule(rule)).resolves.toMatchObject({ status: 'NOT_TRIGGERED', value: 2 });
    expect(prisma.observabilityAlert.create).not.toHaveBeenCalled();
  });

  it('persists one alert and dispatches it when a threshold is reached', async () => {
    const alert = { id: 'alert-1' };
    const prisma: any = { observabilityAlert: { findUnique: jest.fn().mockResolvedValue(null), create: jest.fn().mockResolvedValue(alert) } };
    const metrics: any = { queryPersisted: jest.fn().mockResolvedValue([{ value: 3 }]) };
    const notifications = { dispatch: jest.fn().mockResolvedValue([]) };
    const service = new AlertEvaluatorService(prisma, metrics, notifications as any);
    await expect(service.evaluateRule(rule)).resolves.toMatchObject({ status: 'OPENED', alertId: alert.id });
    expect(notifications.dispatch).toHaveBeenCalledWith(alert.id);
  });

  it('does not evaluate another tenant’s metric points for a tenant rule', async () => {
    const tenantRule = { ...rule, tenantId: 'tenant-a' };
    const prisma: any = { observabilityAlert: { findUnique: jest.fn(), create: jest.fn() } };
    const metrics: any = { queryPersisted: jest.fn().mockResolvedValue([{ value: 2, labels: { tenantId: 'tenant-a' } }, { value: 100, labels: { tenantId: 'tenant-b' } }]) };
    const service = new AlertEvaluatorService(prisma, metrics, { dispatch: jest.fn() } as any);
    await expect(service.evaluateRule(tenantRule)).resolves.toMatchObject({ status: 'NOT_TRIGGERED', value: 2 });
    expect(prisma.observabilityAlert.create).not.toHaveBeenCalled();
  });

  it('propagates a persistence outage instead of reporting a false deduplication', async () => {
    const prisma: any = { observabilityAlert: { findUnique: jest.fn().mockResolvedValue(null), create: jest.fn().mockRejectedValue({ code: 'P1001' }) } };
    const metrics: any = { queryPersisted: jest.fn().mockResolvedValue([{ value: 3 }]) };
    const service = new AlertEvaluatorService(prisma, metrics, { dispatch: jest.fn() } as any);
    await expect(service.evaluateRule(rule)).rejects.toMatchObject({ code: 'P1001' });
  });
});
