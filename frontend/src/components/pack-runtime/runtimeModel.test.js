import { describe, expect, it } from 'vitest';
import { canActivate, canOpen, contextStatus, publicRuntimeJson, resolutionDiagnostics, runtimeHistory } from './runtimeModel.js';

const now = Date.parse('2026-10-20T10:00:00Z');
const resolution = { id: 'r1', status: 'EXECUTABLE', result: { expiresAt: '2026-10-20T10:30:00Z' }, effectiveManifest: { executable: true, content: { executable: true } } };
describe('Runtime presentation guards', () => {
  it('does not open an application from an executable resolution alone', () => {
    expect(canActivate(resolution, now)).toBe(true);
    expect(canOpen(resolution, null, now)).toBe(false);
    expect(canOpen(resolution, { resolutionId: 'r1', status: 'ACTIVE', readiness: 'READY' }, now)).toBe(true);
  });
  it('refuses a foreign context, blocked resolution and missing or elapsed validity', () => {
    expect(canOpen(resolution, { resolutionId: 'foreign', status: 'ACTIVE', readiness: 'READY' }, now)).toBe(false);
    expect(canActivate({ ...resolution, status: 'BLOCKED' }, now)).toBe(false);
    expect(canActivate({ ...resolution, result: {} }, now)).toBe(false);
    expect(canActivate(resolution, Date.parse('2026-10-20T11:00:00Z'))).toBe(false);
    expect(contextStatus({ status: 'ACTIVE', expiresAt: '2026-10-20T09:00:00Z' }, now)).toBe('EXPIRED');
  });
  it('masks private keys in the read-only inspector', () => {
    expect(publicRuntimeJson({ name: 'Boutique', config: { apiToken: 'private-value', nested: { password: 'hidden' } } })).not.toMatch(/private-value|hidden/);
  });
  it('preserves diagnostic ownership when several resolutions have the same error', () => {
    const rows = resolutionDiagnostics([{ id: 'a', diagnostics: [{ code: 'CAPABILITY_MISSING' }] }, { id: 'b', diagnostics: [{ code: 'CAPABILITY_MISSING' }] }]);
    expect(new Set(rows.map(r => r.id)).size).toBe(2);
    expect(rows.map(r => r.resolutionId)).toEqual(['a', 'b']);
  });
  it('builds history only from persisted event timestamps', () => {
    const events = runtimeHistory([{ id: 'r1', status: 'BLOCKED', completedAt: '2026-10-20T10:00:00Z' }], [{ id: 'c1', resolutionId: 'r1', activatedAt: '2026-10-20T09:00:00Z', deactivatedAt: '2026-10-20T09:30:00Z' }]);
    expect(events.map(e => e.label)).toEqual(['Résolution', 'Désactivation', 'Activation']);
  });
});
