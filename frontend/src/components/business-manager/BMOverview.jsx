import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Boxes, PlayCircle, FileText, Rocket, ArrowUpRight, ChevronRight, ArrowRight, Activity,
} from 'lucide-react';
import { PageHeader } from '../ui/PageHeader.jsx';
import {
  BmPage, BmBreadcrumb, BmCard, BmKpiCard, BmBadge, BmStatusBadge, BmButton,
  BmErrorState, BmLoading, bmSafeError,
} from './bm/ui.jsx';
import { getApplications } from '../../services/api/platformApplicationsService.js';
import { api } from '../../services/apiClient.js';

// Données 100 % réelles : /business-manager/dashboard (KPIs + santé),
// /business-manager/activity (historiques réels), /business-manager/applications.
export default function BMOverview() {
  const navigate = useNavigate();
  const [state, setState] = useState({ loading: true, error: false, dashboard: null, activity: [], applications: [] });
  const [revision, setRevision] = useState(0);

  useEffect(() => {
    let live = true;
    setState((previous) => ({ ...previous, loading: true, error: false }));
    Promise.all([
      api.get('/business-manager/dashboard'),
      api.get('/business-manager/activity'),
      getApplications(),
    ])
      .then(([dashboard, activity, applications]) => {
        if (!live) return;
        setState({
          loading: false,
          error: false,
          dashboard: dashboard.data,
          activity: activity.data || [],
          applications: applications || [],
        });
      })
      .catch(() => { if (live) setState((previous) => ({ ...previous, loading: false, error: true })); });
    return () => { live = false; };
  }, [revision]);

  const dashboard = state.dashboard;
  const kpis = dashboard
    ? {
        applications: dashboard.applications?.total ?? 0,
        actives: dashboard.applications?.active ?? 0,
        brouillons: dashboard.versions?.draft ?? 0,
        pretes: dashboard.versions?.ready ?? 0,
      }
    : null;

  const recentApplications = [...state.applications]
    .sort((a, b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt))
    .slice(0, 4);

  const versionLifecycle = dashboard?.versions
    ? [
        { label: 'Brouillon', value: dashboard.versions.draft ?? 0, tone: 'bg-amber-400' },
        { label: 'Configuration', value: dashboard.configurations?.draft ?? 0, tone: 'bg-blue-300' },
        { label: 'Ready', value: dashboard.versions.ready ?? 0, tone: 'bg-emerald-300' },
        { label: 'Active', value: dashboard.versions.active ?? 0, tone: 'bg-emerald-500' },
        { label: 'Archivé', value: Math.max((dashboard.versions.total ?? 0) - (dashboard.versions.active ?? 0) - (dashboard.versions.draft ?? 0) - (dashboard.versions.ready ?? 0), 0), tone: 'bg-slate-300' },
      ]
    : [];
  const totalVersions = dashboard?.versions?.total ?? 0;

  const statusTone = { HEALTHY: 'green', WARNING: 'amber', DEGRADED: 'amber', CRITICAL: 'red' };
  const healthStatus = dashboard?.status;
  const alerts = dashboard?.alerts || [];

  const formatAction = (action) => String(action || 'MODIFIED').replaceAll('_', ' ');
  const formatDate = (timestamp) => new Date(timestamp).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' });

  return (
    <BmPage>
      <BmBreadcrumb items={[{ label: 'Business Manager', onClick: () => navigate('/business-manager') }, { label: 'Vue d’ensemble' }]} />
      <PageHeader
        title="Vue d’ensemble"
        subtitle="Pilotez vos applications métier depuis un seul espace."
        action={{ label: 'Nouvelle application', onClick: () => navigate('/business-manager/applications/new') }}
      />

      {state.loading ? (
        <BmLoading label="Chargement du cockpit…" />
      ) : state.error || !dashboard ? (
        <BmErrorState message={bmSafeError} onRetry={() => setRevision((r) => r + 1)} />
      ) : (
        <>
          {/* KPI */}
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <BmKpiCard label="Applications" value={kpis.applications} hint="au total" icon={<Boxes className="h-6 w-6" />} tone="blue" />
            <BmKpiCard label="Actives" value={kpis.actives} hint={kpis.applications > 0 ? `${Math.round((kpis.actives / kpis.applications) * 100)}% du total` : '—'} icon={<PlayCircle className="h-6 w-6" />} tone="green" />
            <BmKpiCard label="Brouillons" value={kpis.brouillons} hint="versions en DRAFT" icon={<FileText className="h-6 w-6" />} tone="amber" />
            <BmKpiCard label="Prêtes à publier" value={kpis.pretes} hint="au statut READY" icon={<Rocket className="h-6 w-6" />} tone="violet" />
          </div>

          {/* Applications récentes | Cycle de vie des versions */}
          <div className="grid gap-4 lg:grid-cols-5">
            <BmCard
              title="Applications récentes"
              className="lg:col-span-3"
              headerExtra={(
                <button onClick={() => navigate('/business-manager/applications')} className="inline-flex items-center gap-1 rounded px-1.5 py-1 text-xs font-semibold text-blue-600 hover:text-blue-800 bm-focus">
                  Voir toutes <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                </button>
              )}
            >
              {recentApplications.length === 0 ? (
                <p className="py-6 text-center text-sm text-slate-500">Aucune application. Créez votre première application pour commencer.</p>
              ) : (
                <ul className="divide-y divide-slate-100">
                  {recentApplications.map((app) => (
                    <li key={app.id}>
                      <button
                        onClick={() => navigate(`/business-manager/applications/${app.id}`)}
                        className="flex w-full items-center gap-3 rounded-lg px-2 py-2.5 text-left transition-colors duration-150 hover:bg-slate-50 bm-focus"
                      >
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600" aria-hidden="true">
                          <Boxes className="h-5 w-5" />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-semibold text-slate-800">{app.name || app.code}</span>
                          <span className="block truncate font-mono text-xs text-slate-400">{app.code}</span>
                        </span>
                        <BmStatusBadge value={app.status} />
                        <span className="hidden shrink-0 text-xs text-slate-400 sm:block">
                          Modifié le {new Date(app.updatedAt || app.createdAt).toLocaleDateString('fr-FR')}
                        </span>
                        <ChevronRight className="h-4 w-4 shrink-0 text-slate-300" aria-hidden="true" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </BmCard>

            <BmCard title="Cycle de vie des versions" className="lg:col-span-2">
              <div className="flex items-center gap-6">
                <div className="relative flex h-32 w-32 shrink-0 items-center justify-center rounded-full" style={{ background: 'conic-gradient(#3b82f6 0%, #3b82f6 100%)' }} role="img" aria-label={`${totalVersions} versions au total`}>
                  <div className="flex h-24 w-24 flex-col items-center justify-center rounded-full bg-white">
                    <span className="text-3xl font-bold text-slate-900">{totalVersions}</span>
                    <span className="text-[11px] text-slate-400">Versions</span>
                  </div>
                </div>
                <ul className="min-w-0 flex-1 space-y-2">
                  {versionLifecycle.map((entry) => (
                    <li key={entry.label} className="flex items-center gap-2 text-sm">
                      <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${entry.tone}`} aria-hidden="true" />
                      <span className="flex-1 truncate text-slate-600">{entry.label}</span>
                      <span className="font-semibold text-slate-800">{entry.value}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </BmCard>
          </div>

          {/* Activité récente | Santé plateforme */}
          <div className="grid gap-4 lg:grid-cols-5">
            <BmCard
              title="Activité récente"
              className="lg:col-span-3"
              headerExtra={<BmBadge tone="neutral">{state.activity.length} événement(s)</BmBadge>}
            >
              {state.activity.length === 0 ? (
                <p className="py-6 text-center text-sm text-slate-500">Aucune activité enregistrée pour le moment.</p>
              ) : (
                <ul className="divide-y divide-slate-100">
                  {state.activity.slice(0, 5).map((event, index) => (
                    <li key={event.resourceId || index} className="flex items-start gap-3 py-2.5">
                      <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500" aria-hidden="true">
                        <Activity className="h-4 w-4" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-slate-800">{event.resource} — {formatAction(event.action)}</p>
                        <p className="truncate text-xs text-slate-500">{event.actor || 'Système'}</p>
                      </div>
                      <time className="shrink-0 text-xs text-slate-400" dateTime={event.timestamp}>{formatDate(event.timestamp)}</time>
                    </li>
                  ))}
                </ul>
              )}
            </BmCard>

            <BmCard title="Santé plateforme" className="lg:col-span-2">
              <div className="flex items-center gap-3">
                <span className={`flex h-12 w-12 items-center justify-center rounded-full ${healthStatus === 'CRITICAL' || healthStatus === 'DEGRADED' ? 'bg-rose-50 text-rose-500' : healthStatus === 'WARNING' ? 'bg-amber-50 text-amber-500' : 'bg-emerald-50 text-emerald-500'}`} aria-hidden="true">
                  <Activity className="h-6 w-6" />
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-slate-900">
                    {healthStatus === 'CRITICAL' ? 'Plateforme critique' : healthStatus === 'DEGRADED' ? 'Plateforme dégradée' : healthStatus === 'WARNING' ? 'Plateforme en avertissement' : 'Plateforme opérationnelle'}
                  </p>
                  <BmBadge tone={statusTone[healthStatus] || 'neutral'} dot>{healthStatus || 'INCONNU'}</BmBadge>
                </div>
              </div>
              <dl className="mt-4 grid grid-cols-3 gap-2 border-t border-slate-100 pt-4 text-center">
                <div>
                  <dt className="text-[11px] text-slate-400">Alertes</dt>
                  <dd className={`text-2xl font-bold ${alerts.length > 0 ? 'text-amber-600' : 'text-slate-900'}`}>{alerts.length}</dd>
                </div>
                <div>
                  <dt className="text-[11px] text-slate-400">Snapshots valides</dt>
                  <dd className="text-2xl font-bold text-slate-900">{dashboard.snapshots?.valid ?? 0}</dd>
                </div>
                <div>
                  <dt className="text-[11px] text-slate-400">Contrats actifs</dt>
                  <dd className="text-2xl font-bold text-slate-900">{dashboard.contracts?.active ?? 0}</dd>
                </div>
              </dl>
              {alerts.length > 0 && (
                <ul className="mt-4 space-y-1.5">
                  {alerts.slice(0, 3).map((alert, index) => (
                    <li key={index} className={`rounded-lg border px-3 py-2 text-xs ${alert.type === 'ERROR' ? 'border-rose-100 bg-rose-50 text-rose-700' : 'border-amber-100 bg-amber-50 text-amber-700'}`}>
                      {alert.message}
                    </li>
                  ))}
                </ul>
              )}
            </BmCard>
          </div>
        </>
      )}
    </BmPage>
  );
}
