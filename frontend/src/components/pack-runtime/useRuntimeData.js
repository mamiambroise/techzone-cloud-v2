import { useEffect, useState } from 'react';
import { api } from '../../services/apiClient.js';
import { canRuntime } from './runtimeModel.js';

export const runtimeError = error => ({
  message: error.normalized?.message || error.response?.data?.message || 'Le service Runtime est indisponible. Réessayez.',
  status: error.normalized?.statusCode || error.response?.status,
  code: error.normalized?.code || error.response?.data?.code,
  traceId: error.normalized?.traceId || error.response?.data?.traceId,
});
const descriptors = {
  dashboard: ['/runtime/dashboard', 'runtime.resolution.read'],
  resolutions: ['/runtime/resolutions', 'runtime.resolution.read'],
  contexts: ['/runtime/contexts', 'runtime.resolution.read'],
  applications: ['/business-manager/applications', 'bm:read'],
  packs: ['/pack-manager/registry', 'pack.read'],
  environments: ['/business-manager/environments', 'bm:read'],
  cache: ['/runtime/cache/status', 'runtime.cache.read'],
  entries: ['/runtime/cache/entries', 'runtime.cache.read'],
  health: ['/runtime/providers/health', 'runtime.provider.read'],
};

export function useRuntimeData(tenantId, user, revision) {
  const [resources, setResources] = useState({});
  const permissions = JSON.stringify([user?.id, user?.isAdmin, user?.isSuperAdmin, [...(user?.permissions || [])].sort()]);
  useEffect(() => {
    if (!tenantId) return undefined;
    const controller = new AbortController();
    const initial = Object.fromEntries(Object.entries(descriptors).map(([key, [, permission]]) => [key, { status: canRuntime(user, permission) ? 'loading' : 'forbidden' }]));
    setResources(initial);
    const requests = Object.entries(descriptors).filter(([key]) => initial[key].status === 'loading').map(async ([key, [path]]) => {
      try {
        const response = await api.get(path, { signal: controller.signal, errorHandling: 'local' });
        if (!controller.signal.aborted) setResources(current => ({ ...current, [key]: { status: 'ready', data: response.data } }));
      } catch (error) {
        if (!controller.signal.aborted) setResources(current => ({ ...current, [key]: { status: 'error', error: runtimeError(error) } }));
      }
    });
    void Promise.allSettled(requests);
    return () => controller.abort();
    // Permission content, rather than object identity, controls reloads.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tenantId, permissions, revision]);
  return resources;
}

export function useRuntimeResolution(id, tenantId, revision) {
  const [state, setState] = useState({});
  useEffect(() => {
    if (!id || !tenantId) return undefined;
    const controller = new AbortController();
    setState({ id, loading: true });
    const read = path => api.get(path, { signal: controller.signal, errorHandling: 'local' }).then(r => r.data);
    void Promise.allSettled([read(`/runtime/resolutions/${encodeURIComponent(id)}`), read(`/runtime/resolutions/${encodeURIComponent(id)}/diagnostics`)]).then(([resolution, diagnostics]) => {
      if (controller.signal.aborted) return;
      setState({ id, loading: false, resolution: resolution.status === 'fulfilled' ? resolution.value : null,
        error: resolution.status === 'rejected' ? runtimeError(resolution.reason) : null,
        diagnostics: diagnostics.status === 'fulfilled' ? diagnostics.value : null,
        diagnosticError: diagnostics.status === 'rejected' ? runtimeError(diagnostics.reason) : null });
    });
    return () => controller.abort();
  }, [id, tenantId, revision]);
  return state.id === id ? state : { loading: Boolean(id) };
}
