import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { api } from '../../services/apiClient.js';
import { useTenant } from '../../contexts/TenantProvider.jsx';

const root = '/business-manager';
const canonicalPathBySection = {
  'data-model': `${root}/models`,
  features: `${root}/features`,
  navigation: `${root}/navigation`,
  configuration: `${root}/configuration`,
  validation: `${root}/validation`,
};
const sectionForPath = (pathname) => Object.keys(canonicalPathBySection).find((section) => pathname.endsWith(`/${section}`)) || '';
const readStored = (key) => {
  try { return JSON.parse(sessionStorage.getItem(key) || '{}'); } catch { return {}; }
};

/**
 * Canonical Business Manager context. Route parameters win over URL parameters,
 * then over the last valid tenant-scoped selection. Requests are guarded so a
 * response for a previous application or tenant cannot replace current data.
 */
export function useBmContext() {
  const { activeTenant } = useTenant();
  const params = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const storageKey = `bm-context:${activeTenant?.id || 'none'}`;
  const query = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const saved = useMemo(() => readStored(storageKey), [storageKey]);
  const applicationId = params.applicationId || query.get('applicationId') || saved.applicationId || '';
  const versionId = params.versionId || query.get('versionId') || query.get('applicationVersionId') || (applicationId === saved.applicationId ? saved.versionId : '') || '';
  const [applications, setApplications] = useState([]);
  const [versions, setVersions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [revision, setRevision] = useState(0);

  useEffect(() => {
    let live = true;
    setLoading(true); setError(''); setApplications([]); setVersions([]);
    if (!activeTenant?.id) { setLoading(false); return () => { live = false; }; }
    api.get(`${root}/applications`).then(async ({ data: apps }) => {
      if (!live) return;
      const list = Array.isArray(apps) ? apps : [];
      setApplications(list);
      if (!applicationId || !list.some((item) => item.id === applicationId)) return;
      const { data: appVersions } = await api.get(`${root}/applications/${applicationId}/versions`);
      if (live) setVersions(Array.isArray(appVersions) ? appVersions : []);
    }).catch(() => { if (live) setError('Impossible de charger le contexte Business Manager.'); })
      .finally(() => { if (live) setLoading(false); });
    return () => { live = false; };
  }, [activeTenant?.id, applicationId, revision]);

  const application = applications.find((item) => item.id === applicationId);
  const version = versions.find((item) => item.id === versionId);

  useEffect(() => {
    if (!activeTenant?.id || loading) return;
    if (!application) { sessionStorage.removeItem(storageKey); return; }
    sessionStorage.setItem(storageKey, JSON.stringify({ applicationId: application.id, versionId: version?.id || '' }));
  }, [activeTenant?.id, application, version, storageKey, loading]);

  const select = (nextApplicationId, nextVersionId = '') => {
    const next = new URLSearchParams(location.search);
    if (nextApplicationId) next.set('applicationId', nextApplicationId); else next.delete('applicationId');
    if (nextVersionId) next.set('versionId', nextVersionId); else next.delete('versionId');
    next.delete('applicationVersionId');
    // A selector change from an historical deep link must not retain stale
    // route parameters: return to the equivalent canonical workspace route.
    const section = sectionForPath(location.pathname);
    const pathname = params.applicationId && section ? canonicalPathBySection[section] : location.pathname;
    navigate({ pathname, search: next.toString() ? `?${next}` : '' });
  };

  return {
    tenant: activeTenant, applications, versions, application, version, applicationId, versionId,
    loading, error, retry: () => setRevision((value) => value + 1),
    selectApplication: (id) => select(id, ''),
    selectVersion: (id) => select(applicationId, id),
  };
}
