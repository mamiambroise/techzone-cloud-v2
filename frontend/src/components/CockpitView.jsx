import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { routeForTab } from '../app/navigationConfig.js';
import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { api } from '../services/apiClient.js';
import { setSelectedAppId } from '../store/applicationsSlice.js';
import { setSelectedEnvId } from '../store/environmentsSlice.js';
import { setSelectedContractId } from '../store/contractsSlice.js';
import { fetchApplicationsAsync } from '../store/applicationsSlice.js';
import { fetchEnvironmentsAsync } from '../store/environmentsSlice.js';
import { ROUTES } from '../app/routes.js';
import {
  Boxes,
  Server,
  FileCode2,
  Sliders,
  Camera,
  AlertTriangle,
  ArrowRight,
  Shield,
  Layers,
  Activity,
  RefreshCw,
  BriefcaseBusiness,
  PanelsTopLeft,
  Workflow,
  Package,
  Play,
  Database,
  Building,
  Plug,
  PackageX,
  CircleSlash,
} from 'lucide-react';

// REAL DATA ONLY : toutes les données affichées proviennent des API réelles.
// - GET /business-manager/dashboard : KPI, statut calculé serveur, alertes
// - GET /business-manager/activity  : historiques réels (config/env/contract/snapshot)
// - Redux applications/environments : catalogs chargés via leurs thunks
// Dégradation partielle : la panne d'un appel n'empêche pas le rendu des autres.
const STATUS_TONE = {
  HEALTHY: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
  WARNING: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
  DEGRADED: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
  CRITICAL: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
};

export default function CockpitView({ onOpenNewSnapshot, onOpenNewApp }) {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const applications = useSelector((state) => state.applications.applications);
  const environments = useSelector((state) => state.environments.environments);
  const alerts = useSelector((state) => state.platform.alerts);

  const [state, setState] = useState({ loading: true, error: false, dashboard: null, activity: [], packs: null, runtime: null });
  const [revision, setRevision] = useState(0);

  useEffect(() => {
    let live = true;
    setState((previous) => ({ ...previous, loading: true, error: false }));
    // Dégradation partielle : chaque module répond de son côté, une panne n'abat pas les autres.
    Promise.allSettled([
      api.get('/business-manager/dashboard'),
      api.get('/business-manager/activity'),
      dispatch(fetchApplicationsAsync()).unwrap(),
      dispatch(fetchEnvironmentsAsync()).unwrap(),
      api.get('/pack-manager/cockpit'),
      api.get('/runtime/cockpit'),
    ]).then(([dashboard, activity, , , packs, runtime]) => {
      if (!live) return;
      const nextDashboard = dashboard.status === 'fulfilled' ? dashboard.value?.data ?? dashboard.value : null;
      const nextActivity = activity.status === 'fulfilled' ? activity.value?.data ?? activity.value ?? [] : [];
      const nextPacks = packs.status === 'fulfilled' ? packs.value?.data ?? packs.value : null;
      const nextRuntime = runtime.status === 'fulfilled' ? runtime.value?.data ?? runtime.value : null;
      setState({ loading: false, error: dashboard.status === 'rejected' && activity.status === 'rejected', dashboard: nextDashboard, activity: Array.isArray(nextActivity) ? nextActivity : [], packs: nextPacks, runtime: nextRuntime });
    });
    return () => { live = false; };
  }, [dispatch, revision]);

  const dashboard = state.dashboard;

  const kpis = [
    {
      label: 'Applications',
      value: dashboard?.kpis?.applications ?? applications.length,
      subtext: dashboard ? `${dashboard.kpis?.activeVersions ?? 0} versions actives` : '—',
      icon: Boxes,
      color: 'text-indigo-600 bg-indigo-50 border-indigo-200',
      tab: 'applications',
    },
    {
      label: 'Environnements',
      value: dashboard?.kpis?.environments ?? environments.length,
      subtext: dashboard ? `${dashboard.environments?.active ?? 0} actifs` : '—',
      icon: Server,
      color: 'text-sky-600 bg-sky-50 border-sky-200',
      tab: 'environments',
    },
    {
      label: 'Contrats Actifs',
      value: dashboard?.kpis?.activeContracts ?? 0,
      subtext: dashboard ? `${dashboard.contracts?.locked ?? 0} verrouillés` : '—',
      icon: FileCode2,
      color: 'text-violet-600 bg-violet-50 border-violet-200',
      tab: 'contracts',
    },
    {
      label: 'Configurations',
      value: dashboard?.configurations?.total ?? 0,
      subtext: dashboard ? `${dashboard.configurations?.draft ?? 0} brouillons` : '—',
      icon: Sliders,
      color: 'text-blue-600 bg-blue-50 border-blue-200',
      tab: 'config',
    },
    {
      label: 'Snapshots',
      value: dashboard?.snapshots?.total ?? 0,
      subtext: dashboard ? `${dashboard.snapshots?.valid ?? 0} valides` : '—',
      icon: Camera,
      color: 'text-emerald-600 bg-emerald-50 border-emerald-200',
      tab: 'snapshots',
    },
    {
      label: 'Alertes',
      value: (dashboard?.alerts?.length ?? 0) + alerts.length,
      subtext: (dashboard?.alerts?.length ?? 0) + alerts.length > 0 ? 'Action requise' : 'Aucun problème détecté',
      icon: AlertTriangle,
      color: (dashboard?.alerts?.length ?? 0) + alerts.length > 0 ? 'text-rose-600 bg-rose-50 border-rose-200' : 'text-slate-600 bg-slate-50 border-slate-200',
      tab: 'cockpit',
    },
  ];

  const serverAlerts = dashboard?.alerts ?? [];
  const status = dashboard?.status;
  const lockedContracts = dashboard?.contracts?.locked ?? 0;

  return (
    <div className="space-y-6">
      {/* Hero / Platform status — statut calculé côté serveur (getDashboard), jamais saisi à la main */}
      <div className="bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 text-white rounded-3xl p-6 sm:p-7 shadow-sm border border-slate-800 relative overflow-hidden">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-72 h-72 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2.5">
            <div className="flex flex-wrap items-center gap-2.5">
              {state.loading ? (
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-slate-800/80 text-slate-300 border border-slate-700 flex items-center gap-1.5">
                  <RefreshCw className="w-3 h-3 animate-spin" />
                  Chargement de l'état plateforme…
                </span>
              ) : status ? (
                <span className={`px-3 py-1 rounded-full text-xs font-semibold border flex items-center gap-1.5 ${STATUS_TONE[status] ?? STATUS_TONE.WARNING}`}>
                  <span className="w-2 h-2 rounded-full bg-current animate-pulse" />
                  Statut plateforme : {status}
                </span>
              ) : (
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-rose-500/20 text-rose-300 border border-rose-500/30 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-current" />
                  Statut plateforme indisponible
                </span>
              )}
              <span className="text-xs text-slate-400 font-mono">Techzone Cloud — Cockpit global</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
              Tableau de bord
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              Vue consolidée de la plateforme : applications et versions, environnements, registre de contrats,
              snapshots, packs et activité récente. Chaque widget provient de son module propriétaire.
            </p>
          </div>

          {/* Quick Actions */}
          <div className="flex flex-wrap gap-2.5 shrink-0 relative z-10">
            <button
              onClick={onOpenNewSnapshot}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold bg-indigo-500 hover:bg-indigo-600 text-white transition-all shadow-sm shadow-indigo-950/40 active:scale-95"
            >
              <Camera className="w-4 h-4" />
              <span>Nouveau Snapshot</span>
            </button>
            <button
              onClick={() => navigate(routeForTab('contracts'))}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-all active:scale-95"
            >
              <Shield className="w-4 h-4 text-emerald-400" />
              <span>Registre des contrats</span>
            </button>
            <button
              onClick={onOpenNewApp}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-all active:scale-95"
            >
              <Boxes className="w-4 h-4 text-sky-400" />
              <span>Créer Application</span>
            </button>
          </div>
        </div>

        <div className="mt-6 pt-5 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-4 text-xs relative z-10">
          <div className="flex flex-wrap items-center gap-2">
            {serverAlerts.length === 0 ? (
              <span className="text-slate-400">Aucune alerte plateforme remontée par les modules.</span>
            ) : (
              serverAlerts.map((alert, index) => (
                <span
                  key={index}
                  className={`px-2.5 py-1 rounded-lg font-mono text-[11px] font-semibold border ${
                    alert.type === 'ERROR'
                      ? 'bg-rose-500/10 text-rose-300 border-rose-500/30'
                      : 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                  }`}
                >
                  {alert.resource} — {alert.message}
                </span>
              ))
            )}
          </div>

          <div className="flex items-center gap-3 text-slate-400 text-xs">
            <span className="flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-emerald-400" />
              Contrats verrouillés : <span className="text-slate-200 font-semibold">{lockedContracts}</span>
            </span>
            <span>•</span>
            <button onClick={() => setRevision((r) => r + 1)} className="flex items-center gap-1.5 hover:text-white transition-colors">
              <RefreshCw className="w-3.5 h-3.5" />
              Rafraîchir
            </button>
          </div>
        </div>
      </div>

      {/* KPI Bento Cards Grid — valeurs réelles uniquement (jamais hardcodées) */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5 sm:gap-4">
        {kpis.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <button
              key={kpi.label}
              onClick={() => navigate(routeForTab(kpi.tab))}
              className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm hover:border-slate-300 hover:shadow-md transition-all duration-200 text-left group flex flex-col justify-between"
            >
              <div className="flex items-center justify-between mb-3">
                <span className={`w-9 h-9 rounded-xl flex items-center justify-center border ${kpi.color}`}>
                  <Icon className="w-4 h-4" />
                </span>
                <ArrowRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-indigo-600 transition-colors" />
              </div>
              <div>
                <div className="text-2xl font-bold text-slate-900 tracking-tight">{state.loading && state.dashboard === null ? '…' : kpi.value}</div>
                <div className="text-xs font-semibold text-slate-700 mt-0.5">{kpi.label}</div>
                <div className="text-[11px] text-slate-400 mt-1 truncate">{kpi.subtext}</div>
              </div>
            </button>
          );
        })}
      </div>

      {state.error && (
        <div role="alert" className="rounded-2xl border border-rose-200 bg-rose-50 p-4 flex items-center justify-between gap-3">
          <p className="text-sm text-rose-800">
            Impossible de charger l'état consolidé de la plateforme. Les modules restent accessibles individuellement.
          </p>
          <button onClick={() => setRevision((r) => r + 1)} className="shrink-0 text-xs font-semibold text-rose-700 hover:text-rose-900 underline underline-offset-2">
            Réessayer
          </button>
        </div>
      )}

      {/* Two Columns: Environments Matrix & Core Apps Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Environments Topology Matrix (PF-CDC-03) — environnements réels uniquement */}
        <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden flex flex-col">
          <div className="px-6 py-4.5 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-sky-50 border border-sky-100 flex items-center justify-center">
                <Server className="w-4 h-4 text-sky-600" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-900">Matrice des Environnements (PF-CDC-03)</h2>
                <p className="text-[11px] text-slate-400 font-medium">Environnements réellement configurés sur la plateforme</p>
              </div>
            </div>
            <button
              onClick={() => navigate(routeForTab('environments'))}
              className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold flex items-center gap-1 px-3 py-1.5 rounded-lg hover:bg-indigo-50/60 transition-colors"
            >
              <span>Gérer</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4 flex-1">
            {environments.length === 0 ? (
              <div className="col-span-full flex flex-col items-center justify-center py-8 text-center">
                <Server className="w-8 h-8 text-slate-300 mb-3" />
                <p className="text-sm font-semibold text-slate-700">Aucun environnement configuré</p>
                <p className="text-xs text-slate-400 mt-1">Créez un environnement pour préparer les déploiements.</p>
              </div>
            ) : (
              environments.map((env) => {
                const statusColors = {
                  ACTIVE: 'bg-emerald-50 text-emerald-700 border-emerald-200',
                  MAINTENANCE: 'bg-amber-50 text-amber-700 border-amber-200',
                  DEGRADED: 'bg-rose-50 text-rose-700 border-rose-200',
                }[env.status] || 'bg-slate-50 text-slate-700 border-slate-200';

                const tierBadge = {
                  LOW: 'bg-slate-100 text-slate-600',
                  MEDIUM: 'bg-blue-100 text-blue-700',
                  HIGH: 'bg-amber-100 text-amber-800',
                  CRITICAL: 'bg-rose-100 text-rose-800 font-bold',
                }[env.securityTier] || 'bg-slate-100 text-slate-600';

                return (
                  <div
                    key={env.id}
                    onClick={() => {
                      dispatch(setSelectedEnvId(env.id));
                      navigate(routeForTab('environments'));
                    }}
                    className="p-4 rounded-2xl border border-slate-200/80 bg-slate-50/50 hover:bg-white hover:border-indigo-300 hover:shadow-sm transition-all cursor-pointer group"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="font-bold text-sm text-slate-900 group-hover:text-indigo-600 transition-colors">
                        {env.code}
                      </div>
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${statusColors}`}>
                        {env.status}
                      </span>
                    </div>
                    <div className="text-xs text-slate-500 mb-2.5 font-mono">{env.name || env.region || '—'}</div>

                    <div className="flex items-center justify-between text-xs py-1.5 border-t border-slate-200/60">
                      <span className="text-slate-500">Applications déployées :</span>
                      <span className="font-semibold text-slate-800">{env.deployedApps?.length ?? 0}</span>
                    </div>

                    <div className="flex items-center justify-between text-xs pt-1.5 border-t border-slate-200/60">
                      <span className="text-slate-500">Sécurité :</span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-md font-mono ${tierBadge}`}>
                        {env.securityTier || '—'}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Platform Contracts status (PF-CDC-04) — agrégation serveur */}
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden flex flex-col">
          <div className="px-6 py-4.5 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-violet-50 border border-violet-100 flex items-center justify-center">
                <FileCode2 className="w-4 h-4 text-violet-600" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-900">Contrats Inter-Packs (PF-CDC-04)</h2>
                <p className="text-[11px] text-slate-400 font-medium">Registre et verrouillage</p>
              </div>
            </div>
            <button
              onClick={() => navigate(routeForTab('contracts'))}
              className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold px-2.5 py-1 rounded-lg hover:bg-indigo-50/60"
            >
              Registre
            </button>
          </div>

          <div className="p-5 flex-1 space-y-3">
            {[
              { label: 'Total contrats enregistrés', value: dashboard?.contracts?.total ?? 0 },
              { label: 'Contrats actifs', value: dashboard?.contracts?.active ?? 0 },
              { label: 'Contrats verrouillés', value: dashboard?.contracts?.locked ?? 0 },
              { label: 'Contrats dépréciés', value: dashboard?.contracts?.deprecated ?? 0 },
            ].map((row) => (
              <div key={row.label} className="flex items-center justify-between p-3.5 rounded-2xl border border-slate-100 bg-slate-50/60">
                <span className="text-xs font-medium text-slate-600">{row.label}</span>
                <span className="text-sm font-bold text-slate-900 font-mono">{row.value}</span>
              </div>
            ))}
          </div>

          <div className="p-4 bg-slate-50/80 border-t border-slate-100 text-center">
            <button
              onClick={() => navigate(routeForTab('contract-v1'))}
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center justify-center gap-1.5 w-full py-1.5 rounded-xl hover:bg-white transition-all border border-transparent hover:border-slate-200/80"
            >
              <Shield className="w-3.5 h-3.5 text-emerald-500" />
              <span>Consulter la spécification Platform Contract v1</span>
            </button>
          </div>
        </div>
      </div>

      {/* Modules principaux (CDC §16) — accès rapides vers les vrais modules */}
      <div>
        <h2 className="text-sm font-bold text-slate-900 mb-3">Modules principaux</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
          {[
            { id: 'bm', label: 'Business Manager', icon: BriefcaseBusiness, route: ROUTES.bm, hint: 'Applications & versions', color: 'text-blue-600 bg-blue-50 border-blue-100' },
            { id: 'ui', label: 'UI Builder', icon: PanelsTopLeft, route: ROUTES.ui, hint: 'Pages, thème, aperçu', color: 'text-violet-600 bg-violet-50 border-violet-100' },
            { id: 'automation', label: 'Automatisation', icon: Workflow, route: ROUTES.automation, hint: 'Workflows & règles', color: 'text-orange-600 bg-orange-50 border-orange-100' },
            { id: 'packs', label: 'Pack Manager', icon: Package, route: ROUTES.packs, hint: 'Composition & publication', color: 'text-indigo-600 bg-indigo-50 border-indigo-100' },
            { id: 'runtime', label: 'Runtime', icon: Play, route: ROUTES.runtime, hint: 'Résolution & cache', color: 'text-emerald-600 bg-emerald-50 border-emerald-100' },
            { id: 'data', label: 'Données', icon: Database, route: ROUTES.dataRuntime, hint: 'Requêtes & exécution', color: 'text-teal-600 bg-teal-50 border-teal-100' },
            { id: 'erp', label: 'ERP / Dolibarr', icon: Building, route: ROUTES.erp, hint: 'Clients, produits, stocks', color: 'text-cyan-600 bg-cyan-50 border-cyan-100' },
            { id: 'api', label: 'API & Intégrations', icon: Plug, route: ROUTES.settingsIntegrations, hint: 'Connecteurs & webhooks', color: 'text-blue-500 bg-blue-50 border-blue-100' },
          ].map((module) => {
            const Icon = module.icon;
            return (
              <button
                key={module.id}
                onClick={() => navigate(module.route)}
                className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-sm hover:border-blue-300 hover:shadow-md transition-all duration-200 text-left group"
              >
                <span className={`w-8 h-8 rounded-xl flex items-center justify-center border mb-2.5 ${module.color}`}>
                  <Icon className="w-4 h-4" />
                </span>
                <span className="block text-[11px] font-bold text-slate-800 leading-tight">{module.label}</span>
                <span className="block text-[10px] text-slate-400 mt-0.5">{module.hint}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Packs récents (CDC §18) + Runtime santé — données réelles des cockpits */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden flex flex-col">
          <div className="px-6 py-4.5 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center">
                <Package className="w-4 h-4 text-indigo-600" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-900">Packs (PM-CDC)</h2>
                <p className="text-[11px] text-slate-400 font-medium">Composition, validation, publication — Pack Manager</p>
              </div>
            </div>
            <button
              onClick={() => navigate(ROUTES.packs)}
              className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold flex items-center gap-1 px-3 py-1.5 rounded-lg hover:bg-indigo-50/60 transition-colors"
            >
              <span>Ouvrir Pack Manager</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="p-5 grid grid-cols-2 sm:grid-cols-3 gap-3">
            {state.packs ? (
              [
                { label: 'Packs', value: state.packs.packs?.total ?? 0, hint: `${state.packs.packs?.ACTIVE ?? 0} actifs`, tone: 'text-indigo-600' },
                { label: 'Versions', value: state.packs.versions?.total ?? 0, hint: `${state.packs.versions?.PUBLISHED ?? 0} publiées`, tone: 'text-blue-600' },
                { label: 'Manifests', value: state.packs.versions?.manifests ?? 0, hint: `${state.packs.versions?.validation?.valid ?? 0} valides`, tone: 'text-emerald-600' },
              ].map((row) => (
                <div key={row.label} className="p-4 rounded-2xl border border-slate-100 bg-slate-50/60">
                  <div className={`text-xl font-bold font-mono ${row.tone}`}>{row.value}</div>
                  <div className="text-xs font-semibold text-slate-700 mt-0.5">{row.label}</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">{row.hint}</div>
                </div>
              ))
            ) : (
              <div className="col-span-full flex items-center gap-2 p-4 rounded-2xl border border-amber-200 bg-amber-50 text-xs text-amber-800">
                <CircleSlash className="w-4 h-4 shrink-0" />
                Pack Manager indisponible — le module ne répond pas actuellement.
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden flex flex-col">
          <div className="px-6 py-4.5 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center">
                <Play className="w-4 h-4 text-emerald-600" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-900">Runtime (PR-CDC)</h2>
                <p className="text-[11px] text-slate-400 font-medium">Résolutions réelles — jamais de statut inventé</p>
              </div>
            </div>
          </div>

          <div className="p-5 space-y-3 flex-1">
            {state.runtime ? (
              <>
                <div className="flex items-center justify-between p-3.5 rounded-2xl border border-slate-100 bg-slate-50/60">
                  <span className="text-xs font-medium text-slate-600">Santé runtime</span>
                  <span className="text-xs font-bold font-mono text-slate-900">{state.runtime.health ?? 'UNKNOWN'}</span>
                </div>
                <div className="flex items-center justify-between p-3.5 rounded-2xl border border-slate-100 bg-slate-50/60">
                  <span className="text-xs font-medium text-slate-600">Résolutions (total / 24 h)</span>
                  <span className="text-sm font-bold text-slate-900 font-mono">{state.runtime.resolutions?.total ?? 0} / {state.runtime.resolutions?.last24h ?? 0}</span>
                </div>
                <div className="flex items-center justify-between p-3.5 rounded-2xl border border-slate-100 bg-slate-50/60">
                  <span className="text-xs font-medium text-slate-600">Entrées de cache</span>
                  <span className="text-sm font-bold text-slate-900 font-mono">{state.runtime.cache?.entries ?? 0}</span>
                </div>
                {state.runtime.diagnostics?.length > 0 && (
                  <div className="p-3.5 rounded-2xl border border-amber-200 bg-amber-50 text-xs text-amber-800">
                    {state.runtime.diagnostics.length} diagnostic(s) runtime actif(s).
                  </div>
                )}
              </>
            ) : (
              <div className="flex items-center gap-2 p-4 rounded-2xl border border-amber-200 bg-amber-50 text-xs text-amber-800">
                <PackageX className="w-4 h-4 shrink-0" />
                Runtime indisponible — le module ne répond pas actuellement.
              </div>
            )}
          </div>

          <div className="p-4 bg-slate-50/80 border-t border-slate-100">
            <button
              onClick={() => navigate(ROUTES.runtime)}
              className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 flex items-center justify-center gap-1.5 w-full py-1.5 rounded-xl hover:bg-white transition-all border border-transparent hover:border-slate-200/80"
            >
              <Play className="w-3.5 h-3.5" />
              <span>Ouvrir le module Runtime</span>
            </button>
          </div>
        </div>
      </div>

      {/* Applications Catalog & Activity Stream */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Applications & Versions Summary (PF-CDC-02) */}
        <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden flex flex-col">
          <div className="px-6 py-4.5 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center">
                <Boxes className="w-4 h-4 text-indigo-600" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-900">Applications de la Plateforme (PF-CDC-02)</h2>
                <p className="text-[11px] text-slate-400 font-medium">Gestion fine du cycle de vie et versions actives</p>
              </div>
            </div>
            <button
              onClick={() => navigate(routeForTab('applications'))}
              className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold flex items-center gap-1 px-3 py-1.5 rounded-lg hover:bg-indigo-50/60"
            >
              <span>Toutes les applications ({applications.length})</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="divide-y divide-slate-100 flex-1">
            {applications.length === 0 ? (
              <div className="p-10 flex flex-col items-center justify-center text-center">
                <Layers className="w-8 h-8 text-slate-300 mb-3" />
                <p className="text-sm font-semibold text-slate-700">Aucune application enregistrée</p>
                <p className="text-xs text-slate-400 mt-1 mb-4">Déclarez votre première application pour démarrer.</p>
                <button onClick={onOpenNewApp} className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700 transition-colors">
                  Créer une application
                </button>
              </div>
            ) : (
              applications.slice(0, 6).map((app) => {
                const activeVer = app.activeVersion;
                return (
                  <div
                    key={app.id}
                    onClick={() => {
                      dispatch(setSelectedAppId(app.id));
                      navigate(routeForTab('applications'));
                    }}
                    className="p-5 hover:bg-slate-50/70 transition-colors cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-slate-900">{app.name}</span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 font-semibold">
                          {app.code}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 line-clamp-1">{app.description || '—'}</p>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <div className="text-right">
                        <div className="text-[10px] text-slate-400">Version active</div>
                        <div className="font-mono text-xs font-bold text-indigo-600">
                          {activeVer || '—'}
                        </div>
                      </div>
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        {app.status}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Activity & Audit Stream — historiques réels via /business-manager/activity */}
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden flex flex-col">
          <div className="px-6 py-4.5 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center">
                <Activity className="w-4 h-4 text-emerald-600" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-900">Activité Récente & Audit</h2>
                <p className="text-[11px] text-slate-400 font-medium">Historiques réels des modules</p>
              </div>
            </div>
            <span className="text-[10px] font-mono text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md">Serveur</span>
          </div>

          <div className="p-5 space-y-3 flex-1 overflow-y-auto max-h-96">
            {state.activity.length === 0 ? (
              <p className="text-xs text-slate-500 text-center py-6">Aucune activité enregistrée pour ce tenant.</p>
            ) : (
              state.activity.slice(0, 8).map((log, index) => (
                <div key={`${log.resourceId}-${index}`} className="p-3 rounded-2xl border border-slate-100 bg-slate-50/50 text-xs space-y-1">
                  <div className="flex items-center justify-between text-slate-400 text-[10px]">
                    <span className="font-medium text-slate-600">{log.actor || 'Système'}</span>
                    <span className="font-mono">{log.timestamp ? new Date(log.timestamp).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' }) : '—'}</span>
                  </div>
                  <div className="font-bold text-slate-800">{String(log.action || 'ACTION').replaceAll('_', ' ')}</div>
                  <p className="text-slate-500 text-[11px] leading-relaxed">
                    <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">{log.resource}</span>
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
