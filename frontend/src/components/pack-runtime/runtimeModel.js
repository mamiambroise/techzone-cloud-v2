export const RUNTIME_SECTIONS = [
  ['overview', '/runtime', 'Vue d’ensemble'],
  ['applications', '/runtime/applications', 'Applications'],
  ['resolutions', '/runtime/resolutions', 'Résolutions'],
  ['activations', '/runtime/activations', 'Activations'],
  ['context', '/runtime/context', 'Contextes'],
  ['cache', '/runtime/cache', 'Cache'],
  ['diagnostics', '/runtime/diagnostics', 'Diagnostics'],
  ['history', '/runtime/history', 'Historique'],
];

export const canRuntime = (user, permission) => Boolean(user?.isAdmin || user?.isSuperAdmin || user?.permissions?.includes('*') || user?.permissions?.includes(permission));
export const effectiveOf = resolution => resolution?.effectiveManifest?.content ?? null;
export const expired = (value, now = Date.now()) => Boolean(value && Number.isFinite(Date.parse(value)) && Date.parse(value) <= now);
export const resolutionStatus = (resolution, now) => expired(resolution?.result?.expiresAt, now) ? 'EXPIRED' : resolution?.status || 'UNKNOWN';
export const contextStatus = (context, now) => expired(context?.expiresAt, now) ? 'EXPIRED' : context?.status || 'UNKNOWN';
export const canActivate = (resolution, now = Date.now()) => resolutionStatus(resolution, now) === 'EXECUTABLE'
  && resolution?.effectiveManifest?.executable === true && effectiveOf(resolution)?.executable === true
  && Number.isFinite(Date.parse(resolution?.result?.expiresAt)) && Date.parse(resolution.result.expiresAt) > now;
export const canOpen = (resolution, context, now) => canActivate(resolution, now)
  && context?.resolutionId === resolution?.id && contextStatus(context, now) === 'ACTIVE' && context?.readiness === 'READY';
export const shortId = value => value ? String(value).slice(0, 8) : '—';
export const formatDate = value => value != null && Number.isFinite(new Date(value).getTime()) ? new Date(value).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' }) : '—';
export function resolutionIdentity(resolution, applications = []) {
  const manifest = effectiveOf(resolution);
  return {
    application: applications.find(a => a.id === resolution?.applicationId)?.name || manifest?.businessConfiguration?.application?.name || resolution?.applicationId || 'Application inconnue',
    version: manifest?.businessConfiguration?.application?.version || manifest?.scope?.businessVersionId || '—',
    pack: manifest?.source?.packCode || 'Pack non renseigné',
    packVersion: manifest?.source?.packVersion || '—',
    environment: resolution?.environment || '—',
  };
}
export function resolutionDiagnostics(resolutions) {
  return resolutions.flatMap(r => (Array.isArray(r.diagnostics) ? r.diagnostics : []).map((d, index) => ({
    ...d, id: `${r.id}:${index}`, resolutionId: r.id, occurredAt: d.occurredAt || r.completedAt || r.startedAt,
    applicationId: r.applicationId, environment: r.environment,
  })));
}
export function runtimeHistory(resolutions, contexts) {
  const events = resolutions.map(r => ({ id: `${r.id}:resolution`, resolutionId: r.id, applicationId: r.applicationId, environment: r.environment, occurredAt: r.completedAt || r.startedAt, label: 'Résolution', status: r.status, actor: r.createdBy }));
  for (const c of contexts) {
    if (c.activatedAt) events.push({ id: `${c.id}:active`, resolutionId: c.resolutionId, applicationId: c.applicationId, environment: c.environment, occurredAt: c.activatedAt, label: 'Activation', status: 'ACTIVE', actor: c.activatedBy });
    if (c.deactivatedAt) events.push({ id: `${c.id}:inactive`, resolutionId: c.resolutionId, applicationId: c.applicationId, environment: c.environment, occurredAt: c.deactivatedAt, label: 'Désactivation', status: 'INACTIVE', actor: c.deactivatedBy });
  }
  return events.sort((a, b) => (Date.parse(b.occurredAt) || 0) - (Date.parse(a.occurredAt) || 0));
}

/** Defensive display only. Execution authority remains the backend gate. */
export function publicRuntimeJson(value) {
  return JSON.stringify(value, (key, item) => /password|secret|token|credential|private.?key/i.test(key) ? '[masqué]' : item, 2);
}
