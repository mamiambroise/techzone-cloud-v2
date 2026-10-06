/**
 * UI Builder — shell commun aux 8 écrans (mission §8, §42, §43).
 *
 * Réutilise le design system BM (bm/ui.jsx) et le pattern de contexte
 * Application/Version de BMWorkspaceRoute. Une seule sidebar globale :
 * le shell ne crée jamais de navigation concurrente.
 *
 * Contexte canonique : Tenant → Application → ApplicationVersion, résolu par
 * `useUiBuilderContext` (versions réelles du Business Manager, purge au
 * changement d'application, auto-sélection si version unique). Tant que le
 * contexte n'est pas résolu, l'écran affiche un état explicité — jamais une
 * page blanche.
 */
import { useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { PanelsTopLeft, AlertTriangle, Layers, FolderTree } from 'lucide-react';

import { useTenant } from '../../../contexts/TenantProvider.jsx';
import {
  BmCard, BmErrorState, BmLoading, BmEmptyState, BmForbiddenState,
} from '../../../components/business-manager/bm/ui.jsx';
import useUiBuilderContext from '../hooks/useUiBuilderContext.js';
import { setContext, fetchOverview, fetchPages, fetchBusinessContext } from '../store/uiBuilderSlice.js';
import { ROUTES } from '../../../app/routes.js';

export const UIB_SUB_TABS = [
  { id: 'overview', label: 'Vue d’ensemble', route: ROUTES.ui },
  { id: 'pages', label: 'Pages', route: ROUTES.uiPages },
  { id: 'editor', label: 'Éditeur visuel', route: ROUTES.uiBuilder.replace(':pageId', 'editor') },
  { id: 'components', label: 'Composants', route: ROUTES.uiComponents },
  { id: 'forms', label: 'Formulaires', route: ROUTES.uiForms },
  { id: 'navigation', label: 'Navigation', route: ROUTES.uiNavigation },
  { id: 'theme', label: 'Thème', route: ROUTES.uiThemes },
  { id: 'preview', label: 'Aperçu & Test', route: ROUTES.uiPreview },
];

const VERSION_PLACEHOLDER = 'Sélectionner une version';
const APPLICATION_PLACEHOLDER = 'Sélectionner une application';

export default function UiBuilderLayout({ subTab, children }) {
  const { activeTenant } = useTenant();
  const dispatch = useDispatch();
  const params = useParams();

  const uiBuilder = useSelector((state) => state.uiBuilder);
  const context = useUiBuilderContext({
    tenantId: activeTenant?.id,
    applicationId: params.applicationId,
    versionId: params.versionId,
  });

  const { applicationId, versionId, application, version, versionsStatus } = context;

  useEffect(() => {
    if (versionId) {
      dispatch(setContext({ applicationVersionId: versionId }));
      dispatch(fetchOverview(versionId));
      dispatch(fetchPages(versionId));
      dispatch(fetchBusinessContext(versionId));
    }
  }, [versionId, dispatch]);

  if (!activeTenant) {
    return (
      <BmCard title="Tenant requis">
        <BmEmptyState
          icon={FolderTree}
          title="Aucun tenant actif"
          description="Sélectionnez un tenant depuis la barre supérieure : le UI Builder travaille toujours dans le contexte Tenant → Application → Version."
        />
      </BmCard>
    );
  }

  if (context.applicationsForbidden) {
    return <BmCard title="Contexte requis"><BmForbiddenState /></BmCard>;
  }

  if (context.applicationsStatus === 'ERROR') {
    return (
      <BmCard title="Contexte requis">
        <BmErrorState message="Applications indisponibles." onRetry={context.retryApplications} />
      </BmCard>
    );
  }

  if (context.applicationsStatus === 'LOADING') {
    return <BmLoading label="Chargement des applications…" />;
  }

  if (!applicationId) {
    return <ContextPicker context={context} mode="NO_APPLICATION" />;
  }

  if (!versionId) {
    return <ContextPicker context={context} mode={versionsStatus === 'LOADING' ? 'LOADING' : 'NO_VERSION'} />;
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
                {application?.name || application?.code} · Version {version?.version || version?.versionNumber} · {version?.status}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <ContextSwitcher context={context} />
            <Link to={ROUTES.bm} className="text-xs font-medium text-blue-600 hover:text-blue-700">Business Manager →</Link>
          </div>
        </div>
      </header>

      <nav aria-label="Sections UI Builder" className="flex flex-wrap gap-1 border-b border-slate-200">
        {UIB_SUB_TABS.map((tab) => {
          const isActive = tab.id === subTab;
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

/**
 * Sélecteur de contexte toujours accessible une fois la version résolue :
 * changer d'application purge la version, changer de version recharge la
 * définition. Reste utilisable en 390px grâce à `flex-wrap`.
 */
function ContextSwitcher({ context }) {
  const { applications, versions, applicationId, versionId, versionsStatus } = context;
  if (context.applicationsStatus !== 'LOADED' || applications.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <select
        aria-label="Application"
        className="max-w-[13rem] rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 bm-focus"
        value={applicationId}
        onChange={(event) => context.selectApplication(event.target.value)}
      >
        {applications.map((row) => (
          <option key={row.id} value={row.id}>{row.name || row.code}</option>
        ))}
      </select>
      <select
        aria-label="Version"
        disabled={versionsStatus !== 'LOADED' || versions.length === 0}
        className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 bm-focus disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400"
        value={versionId}
        onChange={(event) => context.selectVersion(event.target.value)}
      >
        {versions.length === 0 && <option value="">{versionsStatus === 'LOADING' ? 'Chargement…' : VERSION_PLACEHOLDER}</option>}
        {versions.map((row) => (
          <option key={row.id} value={row.id}>{row.version || row.versionNumber} — {row.status}</option>
        ))}
      </select>
    </div>
  );
}

/**
 * Sélecteur de contexte (Application → Version). Rend un état explicite pour
 * chaque cas : chargement, aucune application, aucune version, accès refusé.
 */
function ContextPicker({ context, mode }) {
  const { applications, versions, applicationId, versionId, versionsStatus } = context;

  const applicationOptions = [
    { value: '', label: APPLICATION_PLACEHOLDER },
    ...applications.map((application) => ({ value: application.id, label: application.name || application.code })),
  ];
  const versionOptions = [
    { value: '', label: versionsStatus === 'LOADING' ? 'Chargement des versions…' : VERSION_PLACEHOLDER },
    ...versions.map((version) => ({
      value: version.id,
      label: `${version.version || version.versionNumber || '—'} — ${version.status || '—'}`,
    })),
  ];

  return (
    <BmCard title="Contexte requis" subtitle="Tenant → Application → Version">
      <div className="space-y-4">
        <p className="text-sm text-slate-600">
          Sélectionnez l’application et la version à construire. Le UI Builder opère
          toujours dans le contexte Tenant → Application → Version.
        </p>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block text-xs font-semibold text-slate-600">
            Application
            <select
              aria-label="Application"
              className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 bm-focus"
              value={applicationId}
              onChange={(event) => context.selectApplication(event.target.value)}
            >
              {applicationOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
          </label>
          <label className="block text-xs font-semibold text-slate-600">
            Version
            <select
              aria-label="Version"
              disabled={!applicationId || versionsStatus === 'LOADING'}
              className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 bm-focus disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400"
              value={versionId}
              onChange={(event) => context.selectVersion(event.target.value)}
            >
              {versionOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
          </label>
        </div>

        {mode === 'LOADING' && <BmLoading label="Chargement des versions de l’application…" />}

        {mode === 'NO_APPLICATION' && applications.length === 0 && (
          <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600">
            Aucune application dans ce tenant. Créez-la d’abord dans le Business Manager.
            <Link to={ROUTES.bm} className="ml-1 font-semibold text-blue-600 hover:text-blue-700">Ouvrir le Business Manager →</Link>
          </div>
        )}

        {mode === 'NO_APPLICATION' && applications.length > 0 && (
          <p className="rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-500">
            {applications.length} application(s) disponible(s) dans ce tenant. Choisissez-en une pour charger ses versions.
          </p>
        )}

        {mode === 'NO_VERSION' && context.versionsForbidden && <BmForbiddenState />}

        {mode === 'NO_VERSION' && !context.versionsForbidden && versionsStatus === 'ERROR' && (
          <BmErrorState message="Versions indisponibles pour cette application." onRetry={context.retryVersions} />
        )}

        {mode === 'NO_VERSION' && !context.versionsForbidden && versionsStatus === 'EMPTY' && (
          <div className="flex flex-col gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 text-xs text-amber-900 sm:flex-row sm:items-center sm:justify-between">
            <span>
              Aucune version disponible pour cette application.
              <span className="ml-1 text-amber-800">Créez sa première version dans le Business Manager pour commencer à construire l’interface.</span>
            </span>
            <Link to={ROUTES.bm} className="inline-flex shrink-0 items-center gap-1 font-semibold text-blue-700 hover:text-blue-800">
              <Layers className="h-3.5 w-3.5" aria-hidden="true" /> Gérer les versions →
            </Link>
          </div>
        )}

        {mode === 'NO_VERSION' && versionsStatus === 'LOADED' && versions.length > 1 && (
          <p className="rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-500">
            Cette application expose {versions.length} versions. Choisissez celle à construire.
          </p>
        )}
      </div>
    </BmCard>
  );
}

export { ContextPicker, VERSION_PLACEHOLDER };