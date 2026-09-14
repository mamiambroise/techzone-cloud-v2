import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  setActiveDeploymentTab,
  switchBlueGreenSlot,
  triggerNewDeployment,
  fetchCockpitDashboardAsync,
  fetchRecentReleasesAsync,
  fetchRunningDeploymentsAsync,
  fetchDeploymentActivityAsync,
  fetchDeploymentHealthAsync,
} from '../../store/deploymentSlice.js';
import { setProviderMode } from '../../store/integrationSlice.js';
import { addToast } from '../../store/platformSlice.js';
import {
  Rocket,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Clock,
  RotateCw,
  Server,
  Layers,
  ArrowRight,
  TrendingUp,
  Activity,
  Zap,
  Lock,
  GitBranch,
  Play,
  CornerUpLeft,
} from 'lucide-react';

export default function DeploymentCockpitView() {
  const dispatch = useDispatch();
  const deployments = useSelector((state) => state.deployment?.deployments || []);
  const releases = useSelector((state) => state.deployment?.releases || []);
  const activeBlueGreenSlot = useSelector((state) => state.deployment?.activeBlueGreenSlot || 'BLUE');
  const canaryTrafficWeight = useSelector((state) => state.deployment?.canaryTrafficWeight || 20);
  const providerMode = useSelector((state) => state.integration.providerMode);

  useEffect(() => {
    if (providerMode === 'REAL') {
      dispatch(fetchCockpitDashboardAsync());
      dispatch(fetchRecentReleasesAsync());
      dispatch(fetchRunningDeploymentsAsync());
      dispatch(fetchDeploymentActivityAsync());
      dispatch(fetchDeploymentHealthAsync());
    }
  }, [dispatch, providerMode]);

  const [filterEnv, setFilterEnv] = useState('ALL');

  const filteredDeployments =
    filterEnv === 'ALL'
      ? deployments
      : deployments.filter((d) => d.environment === filterEnv);

  const handleToggleProvider = () => {
    const nextMode = providerMode === 'REAL' ? 'MOCK' : 'REAL';
    dispatch(setProviderMode(nextMode));
    dispatch(
      addToast({
        type: 'info',
        title: 'Provider Pattern basculé',
        message: `La couche de déploiement utilise désormais le ${nextMode === 'REAL' ? 'RealDeploymentProvider' : 'MockDeploymentProvider (Sandbox)'}.`,
      })
    );
  };

  const environments = [
    {
      code: 'DEV',
      name: 'Development',
      appCount: 4,
      version: 'v3.0.0-beta',
      status: 'HEALTHY',
      instances: 2,
      color: 'slate',
    },
    {
      code: 'TEST',
      name: 'Test / QA Automation',
      appCount: 4,
      version: 'v2.5.0-rc1',
      status: 'HEALTHY',
      instances: 4,
      color: 'blue',
    },
    {
      code: 'STAGING',
      name: 'Staging / Pre-Prod',
      appCount: 4,
      version: 'v2.5.0-rc1',
      status: 'CANARY_ACTIVE',
      instances: 6,
      canaryWeight: canaryTrafficWeight,
      color: 'amber',
    },
    {
      code: 'PRODUCTION',
      name: 'Production High-Availability',
      appCount: 4,
      version: 'v2.4.0',
      status: 'HEALTHY',
      instances: 16,
      activeSlot: activeBlueGreenSlot,
      color: 'emerald',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Cockpit Header */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-5 sm:p-6 shadow-2xs">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200 font-mono">
                DEP-CDC-01
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200 font-mono">
                COCKPIT DE PUBLICATION
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1 font-mono">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>Cluster Prod Opérationnel</span>
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              DEP Publication • Cockpit
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 max-w-3xl">
              Supervision unifiée des pipelines de déploiement, orchestration sans coupure (Blue/Green & Canary),
              suivi des promotions d’environnements et conformité des manifestes scellés.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => dispatch(switchBlueGreenSlot())}
              className="px-3.5 py-2 rounded-lg border border-indigo-200 bg-indigo-50 text-xs font-semibold text-indigo-700 hover:bg-indigo-100 transition-colors shadow-2xs flex items-center gap-1.5 cursor-pointer"
            >
              <Zap className="w-3.5 h-3.5 text-indigo-600" />
              <span>Bascule Blue/Green (Slot: {activeBlueGreenSlot})</span>
            </button>
            <button
              onClick={() => dispatch(setActiveDeploymentTab('pipelines'))}
              className="px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-semibold transition-colors shadow-2xs flex items-center gap-1.5 cursor-pointer"
            >
              <Rocket className="w-3.5 h-3.5" />
              <span>Gérer les Pipelines</span>
            </button>
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
        </div>
      </div>

      {/* KPI Cards (4 metrics) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-2xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Taux de Succès Déploiements</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900">99.8%</div>
          <div className="text-[11px] text-emerald-600 flex items-center gap-1">
            <TrendingUp className="w-3 h-3" />
            <span>48 déploiements réussis / 30j</span>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-2xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">MTTR (Temps de Rollback)</span>
            <CornerUpLeft className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900">5.4s</div>
          <div className="text-[11px] text-blue-600 font-mono">
            SLA garanti &lt; 10s (Snapshot PF-06)
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-2xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Lead Time for Changes</span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900">18 min</div>
          <div className="text-[11px] text-slate-500">
            Du commit au Staging validé
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-2xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Releases Actives en Prod</span>
            <Server className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900">
            {releases.filter((r) => r.status === 'ACTIVE_PROD').length}
          </div>
          <div className="text-[11px] text-purple-600 font-mono">
            100% manifestes signés SHA-256
          </div>
        </div>
      </div>

      {/* Grid: Environnements Status Cards */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-900 uppercase font-mono tracking-wider flex items-center gap-2">
            <Server className="w-4 h-4 text-amber-600" />
            <span>Matrice d'État des Environnements</span>
          </h2>
          <span className="text-xs text-slate-500 font-mono">4 Environnements Actifs</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {environments.map((env) => (
            <div
              key={env.code}
              className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-2xs space-y-3 relative overflow-hidden"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded text-xs font-bold font-mono bg-slate-100 text-slate-800">
                    {env.code}
                  </span>
                  <span className="text-xs font-semibold text-slate-700">{env.name}</span>
                </div>
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
              </div>

              <div className="space-y-1.5 pt-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500">Version Live :</span>
                  <span className="font-mono font-bold text-slate-900 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-200">
                    {env.version}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500">Répliques :</span>
                  <span className="font-semibold text-slate-800">{env.instances} pods</span>
                </div>

                {env.canaryWeight !== undefined && (
                  <div className="space-y-1 pt-1">
                    <div className="flex items-center justify-between text-[11px] font-mono">
                      <span className="text-amber-700 font-semibold">Trafic Canary :</span>
                      <span className="font-bold text-amber-700">{env.canaryWeight}%</span>
                    </div>
                    <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                      <div
                        className="bg-amber-500 h-full rounded-full transition-all"
                        style={{ width: `${env.canaryWeight}%` }}
                      />
                    </div>
                  </div>
                )}

                {env.activeSlot && (
                  <div className="flex items-center justify-between text-[11px] font-mono pt-1">
                    <span className="text-indigo-600 font-semibold">Slot Actif :</span>
                    <span className="px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-700 font-bold border border-indigo-200">
                      {env.activeSlot} (Live 100%)
                    </span>
                  </div>
                )}
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
                <button
                  onClick={() => dispatch(setActiveDeploymentTab('promotions'))}
                  className="text-amber-600 hover:text-amber-700 font-semibold flex items-center gap-1 cursor-pointer"
                >
                  <span>Promouvoir</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
                <button
                  onClick={() => dispatch(setActiveDeploymentTab('diagnostics'))}
                  className="text-slate-400 hover:text-slate-600 font-mono cursor-pointer"
                >
                  Logs →
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Deployments Table */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-2xs overflow-hidden">
        <div className="p-4 border-b border-slate-200/80 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-amber-600" />
            <h2 className="text-sm font-bold text-slate-900 uppercase font-mono">
              Historique Récent des Déploiements (Pipelines)
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500">Filtrer :</span>
            {['ALL', 'PRODUCTION', 'STAGING', 'TEST'].map((env) => (
              <button
                key={env}
                onClick={() => setFilterEnv(env)}
                className={`px-2.5 py-1 rounded-md text-xs font-mono transition-colors cursor-pointer ${
                  filterEnv === env
                    ? 'bg-amber-600 text-white font-bold'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {env}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-mono uppercase text-[11px]">
              <tr>
                <th className="py-3 px-4">Release & Version</th>
                <th className="py-3 px-4">Application</th>
                <th className="py-3 px-4">Environnement</th>
                <th className="py-3 px-4">Stratégie</th>
                <th className="py-3 px-4">Statut</th>
                <th className="py-3 px-4">Durée</th>
                <th className="py-3 px-4">Snapshot PF-06</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredDeployments.map((dep) => (
                <tr key={dep.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3 px-4">
                    <div className="font-mono font-bold text-slate-900">{dep.version}</div>
                    <div className="font-mono text-[10px] text-slate-400">{dep.releaseCode}</div>
                  </td>
                  <td className="py-3 px-4 font-medium text-slate-800">{dep.appName}</td>
                  <td className="py-3 px-4">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                        dep.environment === 'PRODUCTION'
                          ? 'bg-emerald-100 text-emerald-800'
                          : dep.environment === 'STAGING'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}
                    >
                      {dep.environment}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="font-mono text-[11px] text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded">
                      {dep.strategy}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    {dep.status === 'SUCCEEDED' ? (
                      <span className="inline-flex items-center gap-1 text-emerald-700 font-semibold text-xs">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Succès</span>
                      </span>
                    ) : dep.status === 'RUNNING' ? (
                      <span className="inline-flex items-center gap-1 text-amber-700 font-semibold text-xs animate-pulse">
                        <RotateCw className="w-3.5 h-3.5 text-amber-600 animate-spin" />
                        <span>En cours</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-rose-700 font-semibold text-xs">
                        <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                        <span>Rolled Back</span>
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4 font-mono text-slate-600">{dep.durationSeconds}s</td>
                  <td className="py-3 px-4">
                    <span className="font-mono text-[10px] text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100">
                      {dep.snapshotRef}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => dispatch(setActiveDeploymentTab('diagnostics'))}
                      className="text-amber-600 hover:text-amber-700 font-semibold text-xs cursor-pointer"
                    >
                      Détails →
                    </button>
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
