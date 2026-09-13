import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  setActiveIntegrationTab,
  setProviderMode,
  toggleContractV1Lock,
  fetchConnectors,
  fetchApis,
  fetchWebhooks,
  fetchSynchronizations,
  fetchDiagnosticsMetrics,
} from '../../store/integrationSlice.js';
import { addToast } from '../../store/platformSlice.js';
import {
  Network,
  Cpu,
  Webhook,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ShieldCheck,
  Zap,
  ArrowUpRight,
  Filter,
  Layers,
  ArrowRight,
  Play,
  Lock,
  Terminal,
  Activity,
  Server,
  KeyRound,
  ShieldAlert,
  SlidersHorizontal,
} from 'lucide-react';

export default function IntegrationCockpitView({
  onOpenNewConnector,
  onOpenNewApi,
  onOpenNewWebhook,
}) {
  const dispatch = useDispatch();

  const connectors = useSelector((state) => state.integration.connectors);
  const apis = useSelector((state) => state.integration.apis);
  const webhooks = useSelector((state) => state.integration.webhooks);
  const syncJobs = useSelector((state) => state.integration.syncJobs);
  const credentials = useSelector((state) => state.integration.credentials);
  const diagnostics = useSelector((state) => state.integration.diagnostics);
  const providerMode = useSelector((state) => state.integration.providerMode);
  const contractV1Locked = useSelector((state) => state.integration.contractV1Locked);
  const activeTenant = useSelector((state) => state.platform.activeTenant);
  const cockpitLoading = useSelector((state) => state.integration.cockpitLoading);
  const cockpitErrors = useSelector((state) => state.integration.cockpitErrors);
  const diagnosticsMetrics = useSelector((state) => state.integration.diagnosticsMetrics);

  const [showEndpointsModal, setShowEndpointsModal] = useState(false);

  const failureDiagnostics = diagnostics.filter((d) => d.status === 'FAILURE');
  const timeoutDiagnostics = failureDiagnostics.filter(
    (d) => d.errorCode === 'TIMEOUT' || /timeout/i.test(d.rootCause || '')
  );

  useEffect(() => {
    if (providerMode === 'REAL') {
      dispatch(fetchConnectors());
      dispatch(fetchApis());
      dispatch(fetchWebhooks());
      dispatch(fetchSynchronizations());
      dispatch(fetchDiagnosticsMetrics());
    }
  }, [dispatch, providerMode]);

  // Computed KPIs (API-CDC-01 Section 2)
  const activeConnectors = connectors.filter((c) => c.status === 'ACTIVE').length;
  const activeApis = apis.length;
  const activeWebhooks = webhooks.filter((w) => w.status === 'ACTIVE').length;
  const totalSyncs = syncJobs.length;

  const successRate = diagnosticsMetrics?.successRate ?? null;
  const failureRate = diagnosticsMetrics?.failureRate ?? null;

  const degradedConnectors = connectors.filter((c) => c.health?.status !== 'HEALTHY');
  const showAttentionBanner = degradedConnectors.length > 0;
  const attentionRequiredCount = degradedConnectors.length + failureDiagnostics.length;

  const renderSectionError = (section) => {
    if (!cockpitErrors[section]) return null;
    return (
      <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 mb-3">
        Erreur chargement {section} : {cockpitErrors[section]}
      </div>
    );
  };

  if (cockpitLoading) {
    return (
      <div className="space-y-6">
        <div className="p-5 sm:p-6 bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 rounded-3xl text-white shadow-xl border border-indigo-900/40">
          <div className="animate-pulse space-y-3">
            <div className="h-6 bg-white/10 rounded w-1/3"></div>
            <div className="h-4 bg-white/10 rounded w-1/2"></div>
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="p-3.5 bg-white rounded-2xl border border-slate-200/80 animate-pulse">
              <div className="h-4 bg-slate-100 rounded w-1/2 mb-2"></div>
              <div className="h-6 bg-slate-100 rounded w-1/3"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const handleToggleProvider = () => {
    const nextMode = providerMode === 'REAL' ? 'MOCK' : 'REAL';
    dispatch(setProviderMode(nextMode));
    dispatch(
      addToast({
        type: 'info',
        title: 'Provider Pattern basculé',
        message: `La couche d'intégration utilise désormais le ${nextMode === 'REAL' ? 'RealIntegrationProvider' : 'MockIntegrationProvider (Sandbox)'}.`,
      })
    );
  };

  return (
    <div className="space-y-6">
      {/* Top Banner / Integration Context Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 sm:p-6 bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 rounded-3xl text-white shadow-xl border border-indigo-900/40 relative overflow-hidden">
        {/* Subtle grid pattern background */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(99,102,241,0.15),transparent_50%)] pointer-events-none" />

        <div className="space-y-1.5 z-10">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-2.5 py-0.5 rounded-md text-[10px] font-mono font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 tracking-wide">
              API-CDC-01 • TEAM 4
            </span>
            <span className="text-xs text-slate-400 font-mono">•</span>
            <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-mono">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Integration Layer Active
            </div>
            <span className="text-xs text-slate-400 font-mono">•</span>
            <button
              onClick={handleToggleProvider}
              className={`px-2.5 py-0.5 rounded-md text-[10px] font-mono font-bold transition-all border ${
                providerMode === 'REAL'
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 hover:bg-emerald-500/30'
                  : 'bg-amber-500/20 text-amber-300 border-amber-500/40 hover:bg-amber-500/30'
              }`}
              title="Cliquer pour basculer Mock vs Real Provider"
            >
              Mode: {providerMode === 'REAL' ? 'RealProvider 🌐' : 'MockProvider 🧪'}
            </button>
          </div>

          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            Integration Cockpit
            <span className="text-xs font-normal text-slate-300 bg-white/10 px-2 py-0.5 rounded-full">
              Techzone Cloud
            </span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 max-w-2xl">
            Supervision centrale des connecteurs d'échange, APIs exposées, webhooks, synchronisations et références sécurisées.
          </p>
        </div>

        {/* Header Actions */}
        <div className="flex items-center gap-2 flex-wrap z-10">
          <button
            onClick={() => setShowEndpointsModal(true)}
            className="flex items-center gap-1.5 px-3 py-2 bg-white/10 hover:bg-white/20 border border-white/15 text-white rounded-xl text-xs font-semibold backdrop-blur-xs transition-all cursor-pointer"
          >
            <Terminal className="w-4 h-4 text-emerald-300" />
            <span>Endpoints NestJS (§5)</span>
          </button>

          <button
            onClick={() => dispatch(setActiveIntegrationTab('contracts-v1'))}
            className="flex items-center gap-1.5 px-3 py-2 bg-indigo-600/80 hover:bg-indigo-600 border border-indigo-400/30 text-white rounded-xl text-xs font-semibold shadow-sm transition-all cursor-pointer"
          >
            <ShieldCheck className="w-4 h-4 text-indigo-200" />
            <span>Contrats v1 🔒</span>
          </button>

          <button
            onClick={() => dispatch(setActiveIntegrationTab('diagnostics'))}
            className="flex items-center gap-1.5 px-3 py-2 bg-white/10 hover:bg-white/20 border border-white/15 text-white rounded-xl text-xs font-semibold backdrop-blur-xs transition-all cursor-pointer"
          >
            <Activity className="w-4 h-4 text-indigo-300" />
            <span>Diagnostics</span>
          </button>
        </div>
      </div>

      {/* NestJS Endpoints Specification Modal (API-CDC-01 §5) */}
      {showEndpointsModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-2xl w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 font-mono text-[10px] font-bold border border-indigo-200">
                  API-CDC-01 §5
                </span>
                <h3 className="text-sm font-bold text-slate-900">Endpoints Backend NestJS — Integration Cockpit</h3>
              </div>
              <button
                onClick={() => setShowEndpointsModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-500">
              Contrats d'APIs REST NestJS exposés par le module d'intégration de Techzone Cloud pour alimenter le Cockpit :
            </p>

            <div className="space-y-3 font-mono text-xs">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                <div className="flex items-center gap-2">
                  <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-800 rounded font-bold text-[10px]">GET</span>
                  <span className="font-bold text-slate-900">/api/integrations/dashboard</span>
                </div>
                <p className="text-[11px] text-slate-500 font-sans">
                  Retourne les KPIs consolidés (connecteurs, APIs, webhooks, synchronisations, taux de succès).
                </p>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                <div className="flex items-center gap-2">
                  <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-800 rounded font-bold text-[10px]">GET</span>
                  <span className="font-bold text-slate-900">/api/integrations/activity</span>
                </div>
                <p className="text-[11px] text-slate-500 font-sans">
                  Timeline paginée des événements récents, corrélés par <code>traceId</code> avec horodatage ISO-8601.
                </p>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                <div className="flex items-center gap-2">
                  <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-800 rounded font-bold text-[10px]">GET</span>
                  <span className="font-bold text-slate-900">/api/integrations/health</span>
                </div>
                <p className="text-[11px] text-slate-500 font-sans">
                  État de santé global : HEALTHY, WARNING, DEGRADED, CRITICAL ou UNKNOWN, ventilé par provider.
                </p>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                <div className="flex items-center gap-2">
                  <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-800 rounded font-bold text-[10px]">GET</span>
                  <span className="font-bold text-slate-900">/api/integrations/attention</span>
                </div>
                <p className="text-[11px] text-slate-500 font-sans">
                  Liste priorisée des anomalies critiques nécessitant une intervention opérateur (connecteurs en échec, timeouts récurrents).
                </p>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setShowEndpointsModal(false)}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold cursor-pointer"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Attention Required Banner (API-CDC-01 Section 2) */}
      {attentionRequiredCount > 0 && (
        <div className="p-4 bg-amber-50 border border-amber-200/90 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-amber-950 animate-in fade-in">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center text-amber-800 shrink-0 mt-0.5">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-amber-900 flex items-center gap-2">
                <span>Attention requise ({attentionRequiredCount} alerte(s) détectée(s))</span>
                <span className="text-[10px] px-2 py-0.2 rounded-full bg-amber-200/80 font-mono font-semibold">
                  API-CDC-01 §2
                </span>
              </h4>
              <p className="text-[11px] text-amber-800 mt-0.5">
                {degradedConnectors.length > 0
                  ? `Connecteur ${degradedConnectors[0].code} en état dégradé (taux d'erreur / latence élevée). `
                  : ''}
                {failureDiagnostics.length > 0
                  ? `${failureDiagnostics.length} échec(s) d'intégration récents à auditer.`
                  : ''}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto justify-end">
            <button
              onClick={() => dispatch(setActiveIntegrationTab('diagnostics'))}
              className="px-3 py-1.5 bg-amber-800 hover:bg-amber-900 text-white rounded-xl text-xs font-semibold transition-all shadow-2xs flex items-center gap-1"
            >
              <span>Résoudre dans Diagnostics</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* 8 Standard KPIs Grid (API-CDC-01 Section 2) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
        {/* KPI 1: Connectors Active */}
        <div
          onClick={() => dispatch(setActiveIntegrationTab('connectors'))}
          className="p-3.5 bg-white rounded-2xl border border-slate-200/80 hover:border-indigo-300 hover:shadow-sm cursor-pointer transition-all flex flex-col justify-between"
        >
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <Network className="w-4 h-4 text-indigo-600" />
            <span className="text-[10px] font-mono text-slate-400">02</span>
          </div>
          <div>
            <div className="text-xl font-bold text-slate-900 font-mono">{activeConnectors}</div>
            <div className="text-[11px] font-medium text-slate-500 mt-0.5">Connecteurs Actifs</div>
          </div>
        </div>

        {/* KPI 2: APIs Active */}
        <div
          onClick={() => dispatch(setActiveIntegrationTab('apis'))}
          className="p-3.5 bg-white rounded-2xl border border-slate-200/80 hover:border-sky-300 hover:shadow-sm cursor-pointer transition-all flex flex-col justify-between"
        >
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <Cpu className="w-4 h-4 text-sky-600" />
            <span className="text-[10px] font-mono text-slate-400">03</span>
          </div>
          <div>
            <div className="text-xl font-bold text-slate-900 font-mono">{activeApis}</div>
            <div className="text-[11px] font-medium text-slate-500 mt-0.5">APIs Exposées</div>
          </div>
        </div>

        {/* KPI 3: Webhooks Active */}
        <div
          onClick={() => dispatch(setActiveIntegrationTab('webhooks'))}
          className="p-3.5 bg-white rounded-2xl border border-slate-200/80 hover:border-violet-300 hover:shadow-sm cursor-pointer transition-all flex flex-col justify-between"
        >
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <Webhook className="w-4 h-4 text-violet-600" />
            <span className="text-[10px] font-mono text-slate-400">04</span>
          </div>
          <div>
            <div className="text-xl font-bold text-slate-900 font-mono">{activeWebhooks}</div>
            <div className="text-[11px] font-medium text-slate-500 mt-0.5">Webhooks Actifs</div>
          </div>
        </div>

        {/* KPI 4: Synchronizations Running */}
        <div
          onClick={() => dispatch(setActiveIntegrationTab('sync'))}
          className="p-3.5 bg-white rounded-2xl border border-slate-200/80 hover:border-emerald-300 hover:shadow-sm cursor-pointer transition-all flex flex-col justify-between"
        >
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <RefreshCw className="w-4 h-4 text-emerald-600" />
            <span className="text-[10px] font-mono text-slate-400">06</span>
          </div>
          <div>
            <div className="text-xl font-bold text-slate-900 font-mono">{syncJobs.length}</div>
            <div className="text-[11px] font-medium text-slate-500 mt-0.5">Synchronisations</div>
          </div>
        </div>

        {/* KPI 5: Success Rate */}
        <div className="p-3.5 bg-white rounded-2xl border border-slate-200/80 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span className="text-[10px] font-mono text-emerald-600 font-bold">99.2%</span>
          </div>
          <div>
            <div className="text-xl font-bold text-emerald-700 font-mono">99.2%</div>
            <div className="text-[11px] font-medium text-slate-500 mt-0.5">Taux de Succès</div>
          </div>
        </div>

        {/* KPI 6: Failures */}
        <div
          onClick={() => dispatch(setActiveIntegrationTab('diagnostics'))}
          className="p-3.5 bg-white rounded-2xl border border-slate-200/80 hover:border-rose-300 hover:shadow-sm cursor-pointer transition-all flex flex-col justify-between"
        >
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <AlertTriangle className="w-4 h-4 text-rose-600" />
            <span className="text-[10px] font-mono text-slate-400">24h</span>
          </div>
          <div>
            <div className="text-xl font-bold text-rose-600 font-mono">{failureDiagnostics.length}</div>
            <div className="text-[11px] font-medium text-slate-500 mt-0.5">Échecs / Erreurs</div>
          </div>
        </div>

        {/* KPI 7: Timeouts */}
        <div
          onClick={() => dispatch(setActiveIntegrationTab('diagnostics'))}
          className="p-3.5 bg-white rounded-2xl border border-slate-200/80 hover:border-amber-300 hover:shadow-sm cursor-pointer transition-all flex flex-col justify-between"
        >
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <Clock className="w-4 h-4 text-amber-600" />
            <span className="text-[10px] font-mono text-slate-400">24h</span>
          </div>
          <div>
            <div className="text-xl font-bold text-amber-600 font-mono">{timeoutDiagnostics.length}</div>
            <div className="text-[11px] font-medium text-slate-500 mt-0.5">Timeouts Détectés</div>
          </div>
        </div>

        {/* KPI 8: Attention Required */}
        <div
          onClick={() => dispatch(setActiveIntegrationTab('diagnostics'))}
          className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
            attentionRequiredCount > 0
              ? 'bg-amber-50/70 border-amber-300 ring-2 ring-amber-500/10'
              : 'bg-white border-slate-200/80'
          }`}
        >
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <ShieldAlert className={`w-4 h-4 ${attentionRequiredCount > 0 ? 'text-amber-600' : 'text-slate-400'}`} />
            <span className="text-[10px] font-mono font-bold text-amber-600">REQ</span>
          </div>
          <div>
            <div className={`text-xl font-bold font-mono ${attentionRequiredCount > 0 ? 'text-amber-700' : 'text-slate-700'}`}>
              {attentionRequiredCount}
            </div>
            <div className="text-[11px] font-medium text-slate-500 mt-0.5">Action Requise</div>
          </div>
        </div>
      </div>

      {/* 4 Pillars Bento Section (API-CDC-01 Section 3) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Section 1: Connecteurs & Santé (API-CDC-02) */}
        <div className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                <Network className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Connecteurs Systèmes Externes</h3>
                <p className="text-[11px] text-slate-500 font-mono">API-CDC-02 • {connectors.length} connecteurs enregistrés</p>
              </div>
            </div>

            <button
              onClick={() => dispatch(setActiveIntegrationTab('connectors'))}
              className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold flex items-center gap-1"
            >
              <span>Gérer</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-2.5">
            {connectors.slice(0, 4).map((c) => (
              <div
                key={c.id}
                onClick={() => dispatch(setActiveIntegrationTab('connectors'))}
                className="p-3 rounded-2xl border border-slate-100 hover:border-indigo-200 hover:bg-indigo-50/30 transition-all flex items-center justify-between gap-3 cursor-pointer"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-xs text-slate-900">{c.name}</span>
                    <span className="font-mono text-[10px] px-1.5 py-0.2 rounded bg-slate-100 text-slate-700 font-semibold">
                      {c.providerType}
                    </span>
                    <span
                      className={`text-[9px] font-semibold px-2 py-0.2 rounded-full border ${
                        c.status === 'ACTIVE'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : c.status === 'DEGRADED'
                          ? 'bg-amber-50 text-amber-800 border-amber-200'
                          : 'bg-slate-100 text-slate-600 border-slate-200'
                      }`}
                    >
                      {c.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-1 font-mono">
                    <span>{c.code}</span>
                    <span>•</span>
                    <span>Latence: {c.health?.latencyMs ?? '—'}ms</span>
                    <span>•</span>
                    <span className="text-emerald-600 font-semibold">{c.health?.availabilityPct ?? '—'}% dispo</span>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-slate-100 text-slate-600">
                    {c.contractVersion}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Section 2: APIs Exposées & Débits (API-CDC-03) */}
        <div className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-sky-50 flex items-center justify-center text-sky-600">
                <Cpu className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">APIs Exposées Contrôlées</h3>
                <p className="text-[11px] text-slate-500 font-mono">API-CDC-03 • Contrats OpenAPI & Rate Limits</p>
              </div>
            </div>

            <button
              onClick={() => dispatch(setActiveIntegrationTab('apis'))}
              className="text-xs text-sky-600 hover:text-sky-800 font-semibold flex items-center gap-1"
            >
              <span>Explorer</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-2.5">
            {apis.map((a) => (
              <div
                key={a.id}
                onClick={() => dispatch(setActiveIntegrationTab('apis'))}
                className="p-3 rounded-2xl border border-slate-100 hover:border-sky-200 hover:bg-sky-50/30 transition-all flex items-center justify-between gap-3 cursor-pointer"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-xs text-slate-900">{a.name}</span>
                    <span className="font-mono text-[10px] px-1.5 py-0.2 rounded bg-sky-50 text-sky-700 border border-sky-200 font-semibold">
                      {a.version}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-1 font-mono">
                    <span className="text-slate-700 font-semibold">{a.basePath}</span>
                    <span>•</span>
                    <span>{a.totalRequests24h?.toLocaleString()} req/24h</span>
                    <span>•</span>
                    <span>p95: {a.p95LatencyMs}ms</span>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 font-semibold">
                    {a.rateLimit}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Section 3: Webhooks & Livraisons (API-CDC-04) */}
        <div className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-violet-50 flex items-center justify-center text-violet-600">
                <Webhook className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Webhooks & Signatures HMAC</h3>
                <p className="text-[11px] text-slate-500 font-mono">API-CDC-04 • Inbound & Outbound avec Anti-Replay</p>
              </div>
            </div>

            <button
              onClick={() => dispatch(setActiveIntegrationTab('webhooks'))}
              className="text-xs text-violet-600 hover:text-violet-800 font-semibold flex items-center gap-1"
            >
              <span>Configurer</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-2.5">
            {webhooks.map((w) => (
              <div
                key={w.id}
                onClick={() => dispatch(setActiveIntegrationTab('webhooks'))}
                className="p-3 rounded-2xl border border-slate-100 hover:border-violet-200 hover:bg-violet-50/30 transition-all flex items-center justify-between gap-3 cursor-pointer"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className={`text-[9px] font-mono font-bold px-1.5 py-0.2 rounded ${
                        w.direction === 'INBOUND'
                          ? 'bg-blue-50 text-blue-700 border border-blue-200'
                          : 'bg-violet-50 text-violet-700 border border-violet-200'
                      }`}
                    >
                      {w.direction}
                    </span>
                    <span className="font-bold text-xs text-slate-900 font-mono">{w.event}</span>
                  </div>
                  <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-1 font-mono truncate">
                    <span className="truncate">{w.endpoint}</span>
                    <span>•</span>
                    <span className="text-emerald-600 font-semibold">{w.successRatePct}% délivrés</span>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-slate-100 text-slate-600">
                    {w.signaturePolicy}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Section 4: Synchronisations de Données (API-CDC-06) */}
        <div className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
                <RefreshCw className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Pipelines de Synchronisation</h3>
                <p className="text-[11px] text-slate-500 font-mono">API-CDC-06 • Checkpoints & Politiques de Conflit</p>
              </div>
            </div>

            <button
              onClick={() => dispatch(setActiveIntegrationTab('sync'))}
              className="text-xs text-emerald-600 hover:text-emerald-800 font-semibold flex items-center gap-1"
            >
              <span>Exécuter</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-2.5">
            {syncJobs.map((s) => (
              <div
                key={s.id}
                onClick={() => dispatch(setActiveIntegrationTab('sync'))}
                className="p-3 rounded-2xl border border-slate-100 hover:border-emerald-200 hover:bg-emerald-50/30 transition-all flex items-center justify-between gap-3 cursor-pointer"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-xs text-slate-900">{s.name}</span>
                    <span className="font-mono text-[10px] px-1.5 py-0.2 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold">
                      {s.mode}
                    </span>
                    <span
                      className={`text-[9px] font-semibold px-2 py-0.2 rounded-full border ${
                        s.status === 'SUCCEEDED'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : s.status === 'PARTIAL'
                          ? 'bg-amber-50 text-amber-800 border-amber-200'
                          : 'bg-blue-50 text-blue-700 border-blue-200'
                      }`}
                    >
                      {s.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-1 font-mono">
                    <span>{s.schedule}</span>
                    <span>•</span>
                    <span>Conflit: {s.conflictPolicy}</span>
                    <span>•</span>
                    <span className="text-slate-700">{s.lastExecution?.recordsWritten} écrits</span>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className="text-[10px] font-mono text-slate-400">
                    {s.lastExecution?.startedAt}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Section: Recent Integration Activity & Diagnostics Timeline (API-CDC-07) */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
              <Activity className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Activité Récente & Trace Timeline</h3>
              <p className="text-[11px] text-slate-500 font-mono">API-CDC-07 • Suivi de traceId de bout en bout avec redaction des secrets</p>
            </div>
          </div>

          <button
            onClick={() => dispatch(setActiveIntegrationTab('diagnostics'))}
            className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold flex items-center gap-1"
          >
            <span>Voir tout le journal</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 text-slate-400 font-mono text-[11px]">
                <th className="pb-2.5 font-medium">Trace ID</th>
                <th className="pb-2.5 font-medium">Connecteur / Service</th>
                <th className="pb-2.5 font-medium">Opération</th>
                <th className="pb-2.5 font-medium">Direction</th>
                <th className="pb-2.5 font-medium">Latence</th>
                <th className="pb-2.5 font-medium">Statut</th>
                <th className="pb-2.5 font-medium">Diagnostic / Cause Racine</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono">
              {diagnostics.slice(0, 5).map((d) => (
                <tr
                  key={d.id}
                  onClick={() => dispatch(setActiveIntegrationTab('diagnostics'))}
                  className="hover:bg-slate-50/80 cursor-pointer transition-colors"
                >
                  <td className="py-2.5 font-bold text-indigo-600">{d.traceId}</td>
                  <td className="py-2.5 text-slate-900 font-semibold">{d.connector}</td>
                  <td className="py-2.5 text-slate-600">{d.operation}</td>
                  <td className="py-2.5">
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-100 text-slate-700">
                      {d.direction}
                    </span>
                  </td>
                  <td className="py-2.5 text-slate-600">{d.duration}ms</td>
                  <td className="py-2.5">
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                        d.status === 'SUCCESS'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : d.status === 'WARNING'
                          ? 'bg-amber-50 text-amber-800 border-amber-200'
                          : 'bg-rose-50 text-rose-700 border-rose-200'
                      }`}
                    >
                      {d.status}
                    </span>
                  </td>
                  <td className="py-2.5 text-[11px] text-slate-500 font-sans max-w-xs truncate">
                    {d.errorCode && <span className="font-mono font-bold text-rose-600 mr-1.5">[{d.errorCode}]</span>}
                    {d.rootCause}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
