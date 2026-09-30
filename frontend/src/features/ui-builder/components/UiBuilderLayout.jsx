/**
 * UI Builder — shell commun aux 8 écrans (mission §8, §42, §43).
 *
 * Réutilise le design system BM (bm/ui.jsx) et le pattern de contexte
 * Application/Version de BMWorkspaceRoute. Une seule sidebar globale :
 * le shell ne crée jamais de navigation concurrente.
 */
import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { PanelsTopLeft, AlertTriangle } from 'lucide-react';

import { api } from '../../../services/apiClient.js';
import { useTenant } from '../../../contexts/TenantProvider.jsx';
import {
  BmCard, BmErrorState, BmLoading, bmSafeError, BmBadge, BmSelect,
} from '../../../components/business-manager/bm/ui.jsx';
import { setContext, fetchOverview, fetchPages, fetchBusinessContext } from '../store/uiBuilderSlice.js';
import { ROUTES } from '../../../app/routes.js';

const get = (path) => api.get(`/business-manager${path}`).then((r) => r.data);

export const UIB_SUB_TABS = [
  { id: 'overview', label: 'Vue d’ensemble', route: ROUTES.ui },
  { id: 'pages', label: 'Pages', route: ROUTES.uiPages },
  { id: 'editor', label: 'Éditeur visuel', route: ROUTES.uiBuilder.replace(':pageId', 'editor') },
  { id: 'components', label: 'Composants', route: ROUTES.uiComponents },
  { id: 'forms', label: 'Formulaires', route: ROUTES.uiForms },
  { id: 'navigation', label: 'Navigation', route: ROUTES.uiPages },
  { id: 'theme', label: 'Thème', route: ROUTES.uiThemes },
  { id: 'preview', label: 'Aperçu & Test', route: ROUTES.uiPreview },
];

export default function UiBuilderLayout({ subTab, children }) {
  const { activeTenant } = useTenant();
  const dispatch = useDispatch();
  const params = useParams();
  const location = useLocation();

  const uiBuilder = useSelector((state) => state.uiBuilder);
  const storageKey = `ui-builder-context:${activeTenant?.id}`;

  const [applications, setApplications] = useState([]);
  const [versions, setVersions] = useState([]);
  const [status, setStatus] = useState('LOADING');
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(() => {
    try { return JSON.parse(sessionStorage.getItem(storageKey) || '{}'); } catch { return {}; }
  });

  const applicationId = params.applicationId || saved.applicationId || '';
  const versionId = params.versionId || (applicationId === saved.applicationId ? saved.versionId : '') || '';

  useEffect(() => {
    let live = true;
    setStatus('LOADING');
    setError('');
    if (!activeTenant) { setStatus('EMPTY'); return undefined; }
    (async () => {
      const [apps, versionsById] = await Promise.all([
        get('/applications'),
        applicationId ? get(`/applications/${applicationId}/versions`) : Promise.resolve([]),
      ]);
      if (!live) return;
      setApplications(apps);
      setVersions(versionsById);
      setStatus('LOADED');
    })().catch(() => { if (live) { setError(bmSafeError); setStatus('ERROR'); } });
    return () => { live = false; };
  }, [activeTenant?.id, applicationId]);

  const application = applications.find((a) => a.id === applicationId);
  const version = versions.find((v) => v.id === versionId);

  useEffect(() => {
    if (versionId) {
      sessionStorage.setItem(storageKey, JSON.stringify({ applicationId, versionId }));
      dispatch(setContext({ applicationVersionId: versionId }));
      dispatch(fetchOverview(versionId));
      dispatch(fetchPages(versionId));
      dispatch(fetchBusinessContext(versionId));
    }
  }, [versionId, dispatch, storageKey, applicationId]);

  const tabs = UIB_SUB_TABS;

  if (status === 'LOADING') return <BmLoading label="Chargement du UI Builder…" />;
  if (status === 'ERROR') return <BmErrorState message={error} onRetry={() => window.location.reload()} />;
  if (!activeTenant || !application || !version) {
    return (
      <BmCard title="Contexte requis">
        <div className="space-y-4">
          <p className="text-sm text-slate-600">
            Sélectionnez l’application et la version à construire. Le UI Builder opère
            toujours dans le contexte Tenant → Application → Version.
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            <BmSelect
              label="Application"
              value={applicationId}
              onChange={(event) => { setVersions([]); sessionStorage.setItem(storageKey, JSON.stringify({ applicationId: event.target.value })); window.location.hash = ''; setSaved({ applicationId: event.target.value }); }}
              options={applications.map((a) => ({ value: a.id, label: a.name || a.code }))}
            />
            <BmSelect
              label="Version"
              value={versionId}
              onChange={(event) => setSaved({ applicationId, versionId: event.target.value })}
              options={versions.map((v) => ({ value: v.id, label: `${v.version || v.versionNumber || ''} — ${v.status || ''}` }))}
            />
          </div>
          {!applications.length && status === 'LOADED' && (
            <p className="rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-500">
              Aucune application dans ce tenant. Créez-la d’abord dans le Business Manager.
            </p>
          )}
        </div>
      </BmCard>
    );
  }

  return (
    <div className="space-y-5">
      <header className="space-y-1">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-violet-50 text-violet-600"><PanelsTopLeft className="h-5 w-5" /></span>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">UI Builder</h1>
              <p className="mt-0.5 text-sm text-slate-500">
                {application.name || application.code} · Version {version.version || version.versionNumber} · {version.status}
              </p>
            </div>
          </div>
          <Link to={ROUTES.bm} className="text-xs font-medium text-blue-600 hover:text-blue-700">Business Manager →</Link>
        </div>
      </header>

      <nav aria-label="Sections UI Builder" className="flex flex-wrap gap-1 border-b border-slate-200">
        {tabs.map((tab) => {
          const isActive = tab.id === subTab
            || (subTab === 'pages' && tab.id === 'navigation' && location.hash === '#navigation');
          return (
            <Link
              key={tab.id}
              to={tab.route}
              aria-current={isActive ? 'page' : undefined}
              className={`rounded-t-lg px-3 py-2 text-xs font-semibold transition-colors duration-150 ${isActive ? 'border-b-2 border-violet-500 text-violet-700' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'}`}
            >
              {tab.label}
            </Link>
          );
        })}
      </nav>

      {!uiBuilder.overview?.applicationVersion?.editable && uiBuilder.overview && (
        <div role="alert" className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          Version {uiBuilder.overview.applicationVersion.version} en statut {uiBuilder.overview.applicationVersion.status} :
          lecture seule — les modifications sont refusées par le backend tant qu’elle n’est pas DRAFT/CONFIGURING/VALIDATING.
        </div>
      )}

      {children}
    </div>
  );
}
