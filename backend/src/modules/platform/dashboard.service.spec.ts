import { describe, it, expect, jest } from '@jest/globals';
import { DashboardService } from './dashboard.service';
import type { IamPrincipal } from '../../iam/principal.decorator';
const actor = (
  tenantId: string | null,
  permissions: string[] = [],
): IamPrincipal => ({
  tenantId,
  userId: 'u',
  sessionId: 's',
  organizationId: null,
  authenticationLevel: null,
  permissions,
  roles: [],
  isSuperAdmin: false,
});
function database() {
  const rows = () => ({
    findMany: jest.fn<any>().mockResolvedValue([]),
    count: jest.fn<any>().mockResolvedValue(0),
  });
  return {
    application: rows(),
    pmPack: rows(),
    deployment: rows(),
    environment: rows(),
    auditEvent: rows(),
    bmqQualityReport: rows(),
    pmPackVersion: rows(),
    prRuntimeDiagnostic: rows(),
  };
}
describe('Platform dashboard read boundary', () => {
  it('requires a tenant even for super administrators', async () => {
    const db = database(),
      s = new DashboardService(db as any);
    await expect(
      s.getDashboard({ ...actor(null), isSuperAdmin: true }),
    ).rejects.toThrow('TENANT_REQUIRED');
    expect(db.application.count).not.toHaveBeenCalled();
  });
  it('does not query forbidden packs or diagnostics', async () => {
    const db = database(),
      r = await new DashboardService(db as any).getDashboard(actor('a'));
    expect(r.widgets.packs).toEqual({ state: 'FORBIDDEN', data: null });
    expect(db.pmPack.findMany).not.toHaveBeenCalled();
    expect(db.pmPack.count).not.toHaveBeenCalled();
    expect(db.prRuntimeDiagnostic.findMany).not.toHaveBeenCalled();
  });
  it('isolates every projection by authenticated tenant and bounds lists', async () => {
    const db = database(),
      s = new DashboardService(db as any);
    await s.getDashboard(actor('a', ['*']));
    await s.getDashboard(actor('b', ['*']));
    for (const model of Object.values(db))
      for (const method of Object.values(model))
        for (const [query] of method.mock.calls) {
          expect(['a', 'b']).toContain(query.where.tenantId);
          if (method === model.findMany)
            expect(query.take).toBeLessThanOrEqual(10);
        }
    expect(
      db.application.count.mock.calls.map(([q]) => q.where.tenantId),
    ).toEqual(['a', 'b']);
  });
  it('preserves successful widgets when a module fails without leaking errors', async () => {
    const db = database();
    db.application.count.mockResolvedValue(7);
    db.pmPack.count.mockRejectedValue(new Error('password=private'));
    const r = await new DashboardService(db as any).getDashboard(
      actor('a', ['*']),
    );
    expect(r.widgets.applications).toEqual({ state: 'LOADED', data: 7 });
    expect(r.widgets.packs.state).toBe('ERROR');
    expect(JSON.stringify(r)).not.toContain('private');
  });
  it('distinguishes true zero, empty lists and unavailable catalogs', async () => {
    const r = await new DashboardService(database() as any).getDashboard(
      actor('a', ['*']),
    );
    expect(r.widgets.applications.data).toBe(0);
    expect(r.widgets.recentPacks.state).toBe('EMPTY');
    expect(r.widgets.connectors).toMatchObject({
      state: 'UNAVAILABLE',
      data: null,
    });
  });
  it('refreshes only the requested widget', async () => {
    const db = database(),
      r = await new DashboardService(db as any).getDashboard(
        actor('a', ['*']),
        'packs',
      );
    expect(Object.keys(r.widgets)).toEqual(['packs']);
    expect(db.application.count).not.toHaveBeenCalled();
  });
  it('filters activity before limiting and excludes sensitive audit payloads', async () => {
    const db = database();
    await new DashboardService(db as any).getDashboard(actor('a'), 'activity');
    const q = db.auditEvent.findMany.mock.calls[0][0];
    expect(q.where.OR).not.toContainEqual({ action: { startsWith: 'pack.' } });
    expect(q.select).not.toHaveProperty('metadata');
    expect(q.select).not.toHaveProperty('before');
  });
  it('searches only authorized tenant resources, bounds input and hides secrets', async () => {
    const db = database();
    await new DashboardService(db as any).search(actor('b'), '  abc  ');
    expect(db.pmPack.findMany).not.toHaveBeenCalled();
    expect(db.application.findMany.mock.calls[0][0]).toMatchObject({
      where: { tenantId: 'b', name: { contains: 'abc' } },
      take: 5,
      select: { id: true, name: true },
    });
  });
  it('does not query for a short search', async () => {
    const db = database();
    await new DashboardService(db as any).search(actor('a'), 'x');
    expect(db.application.findMany).not.toHaveBeenCalled();
  });
  it('times out a stalled source without blocking peers', async () => {
    jest.useFakeTimers();
    try {
      const s = new DashboardService(database() as any);
      const p = s.widget(actor('a'), null, () => new Promise(() => {}));
      await jest.advanceTimersByTimeAsync(4501);
      expect((await p).state).toBe('ERROR');
    } finally {
      jest.useRealTimers();
    }
  });
});
