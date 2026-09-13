import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { setActiveTab, setPlatformHealth } from '../store/platformSlice.js';
import { setSelectedAppId } from '../store/applicationsSlice.js';
import { setSelectedEnvId } from '../store/environmentsSlice.js';
import { setSelectedContractId } from '../store/contractsSlice.js';
import {
  Boxes,
  Server,
  FileCode2,
  Sliders,
  Camera,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ArrowRight,
  Shield,
  Lock,
  Layers,
  Activity,
  Zap,
} from 'lucide-react';

export default function CockpitView({ onOpenNewSnapshot, onOpenNewApp }) {
  const dispatch = useDispatch();

  const applications = useSelector((state) => state.applications.applications);
  const versions = useSelector((state) => state.applications.versions);
  const environments = useSelector((state) => state.environments.environments);
  const contracts = useSelector((state) => state.contracts.contracts);
  const configItems = useSelector((state) => state.config.items);
  const snapshots = useSelector((state) => state.snapshots.snapshots);
  const alerts = useSelector((state) => state.platform.alerts);
  const platformHealth = useSelector((state) => state.platform.platformHealth);
  const platformContractLocked = useSelector((state) => state.platform.platformContractLocked);
  const auditLogs = useSelector((state) => state.audit.logs);

  // Computations
  const activeVersionsCount = versions.filter((v) => v.status === 'ACTIVE').length;
  const activeContractsCount = contracts.filter((c) => c.status === 'ACTIVE' || c.status === 'LOCKED').length;
  const invalidConfigsCount = configItems.filter((c) => c.status === 'INVALID').length;
  const lockedContractsCount = contracts.filter((c) => c.status === 'LOCKED').length;

  const kpis = [
    {
      label: 'Applications',
      value: applications.length,
      subtext: `${activeVersionsCount} versions actives`,
      icon: Boxes,
      color: 'text-indigo-600 bg-indigo-50 border-indigo-200',
      tab: 'applications',
    },
    {
      label: 'Environnements',
      value: environments.length,
      subtext: 'Isolés logiquement',
      icon: Server,
      color: 'text-sky-600 bg-sky-50 border-sky-200',
      tab: 'environments',
    },
    {
      label: 'Contrats Actifs',
      value: activeContractsCount,
      subtext: `${lockedContractsCount} verrouillés`,
      icon: FileCode2,
      color: 'text-violet-600 bg-violet-50 border-violet-200',
      tab: 'contracts',
    },
    {
      label: 'Configs Invalides',
      value: invalidConfigsCount,
      subtext: invalidConfigsCount > 0 ? 'Action requise !' : 'Toutes valides',
      icon: Sliders,
      color: invalidConfigsCount > 0 ? 'text-amber-600 bg-amber-50 border-amber-300' : 'text-emerald-600 bg-emerald-50 border-emerald-200',
      tab: 'config',
    },
    {
      label: 'Snapshots Récents',
      value: snapshots.length,
      subtext: 'Hashable & traçables',
      icon: Camera,
      color: 'text-blue-600 bg-blue-50 border-blue-200',
      tab: 'snapshots',
    },
    {
      label: 'Alertes & Warnings',
      value: alerts.length,
      subtext: 'Plateforme supervisée',
      icon: AlertTriangle,
      color: alerts.length > 0 ? 'text-rose-600 bg-rose-50 border-rose-200' : 'text-slate-600 bg-slate-50 border-slate-200',
      tab: 'cockpit',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner / Platform Health Overview (PF-CDC-01 Section 4) */}
      <div className="bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 text-white rounded-3xl p-6 sm:p-7 shadow-sm border border-slate-800 relative overflow-hidden">
        {/* Subtle Bento background decorative glow */}
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-72 h-72 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2.5">
            <div className="flex items-center gap-2.5">
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                PF-CDC-01 — Cockpit Opérationnel
              </span>
              <span className="text-xs text-slate-400 font-mono">Platform Foundation Team 4</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
              Techzone Cloud Platform Cockpit
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              Supervision unifiée de l’état de la plateforme : intégrité du <strong className="text-indigo-200 font-semibold">Platform Contract v1</strong>,
              cycle de vie des applications, isolation des 4 environnements, registre de contrats et snapshots canoniques.
            </p>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap gap-2.5 shrink-0 relative z-10">
            <button
              onClick={onOpenNewSnapshot}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold bg-indigo-500 hover:bg-indigo-600 text-white transition-all shadow-sm shadow-indigo-950/40 active:scale-95"
            >
              <Camera className="w-4 h-4" />
              <span>Nouveau Snapshot</span>
            </button>
            <button
              onClick={() => dispatch(setActiveTab('contracts'))}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-all active:scale-95"
            >
              <Shield className="w-4 h-4 text-emerald-400" />
              <span>Vérifier Contrats</span>
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

        {/* Health state selector pill */}
        <div className="mt-6 pt-5 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-4 text-xs relative z-10">
          <div className="flex items-center gap-2">
            <span className="text-slate-400 font-medium">Statut Plateforme :</span>
            {['HEALTHY', 'WARNING', 'DEGRADED', 'CRITICAL'].map((st) => (
              <button
                key={st}
                onClick={() => dispatch(setPlatformHealth(st))}
                className={`px-3 py-1 rounded-lg font-mono text-[11px] font-semibold transition-all ${
                  platformHealth === st
                    ? st === 'HEALTHY'
                      ? 'bg-emerald-500 text-white shadow-sm'
                      : st === 'WARNING'
                      ? 'bg-amber-500 text-white shadow-sm'
                      : 'bg-rose-500 text-white shadow-sm'
                    : 'bg-slate-800/70 text-slate-400 hover:text-white'
                }`}
              >
                {st}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3 text-slate-400 text-xs">
            <span className="flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-emerald-400" />
              Platform Contract v1 : <span className="text-slate-200 font-semibold">{platformContractLocked ? 'VERROUILLÉ' : 'OUVERT'}</span>
            </span>
            <span>•</span>
            <span className="hidden sm:inline">Garantie d'absence de breaking change silencieux</span>
          </div>
        </div>
      </div>

      {/* KPI Bento Cards Grid (PF-CDC-01 Section 2) */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5 sm:gap-4">
        {kpis.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <button
              key={kpi.label}
              onClick={() => dispatch(setActiveTab(kpi.tab))}
              className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm hover:border-slate-300 hover:shadow-md transition-all duration-200 text-left group flex flex-col justify-between"
            >
              <div className="flex items-center justify-between mb-3">
                <span className={`w-9 h-9 rounded-xl flex items-center justify-center border ${kpi.color}`}>
                  <Icon className="w-4 h-4" />
                </span>
                <ArrowRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-indigo-600 transition-colors" />
              </div>
              <div>
                <div className="text-2xl font-bold text-slate-900 tracking-tight">{kpi.value}</div>
                <div className="text-xs font-semibold text-slate-700 mt-0.5">{kpi.label}</div>
                <div className="text-[11px] text-slate-400 mt-1 truncate">{kpi.subtext}</div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Two Columns: Environments Matrix & Core Apps Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Environments Topology Matrix (PF-CDC-03) */}
        <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden flex flex-col">
          <div className="px-6 py-4.5 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-sky-50 border border-sky-100 flex items-center justify-center">
                <Server className="w-4 h-4 text-sky-600" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-900">Matrice des Environnements (PF-CDC-03)</h2>
                <p className="text-[11px] text-slate-400 font-medium">DEV, STAGING, PROD, SECURITY isolés logiquement</p>
              </div>
            </div>
            <button
              onClick={() => dispatch(setActiveTab('environments'))}
              className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold flex items-center gap-1 px-3 py-1.5 rounded-lg hover:bg-indigo-50/60 transition-colors"
            >
              <span>Gérer</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4 flex-1">
            {environments.map((env) => {
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
              }[env.securityTier];

              return (
                <div
                  key={env.id}
                  onClick={() => {
                    dispatch(setSelectedEnvId(env.id));
                    dispatch(setActiveTab('environments'));
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
                  <div className="text-xs text-slate-500 mb-2.5 font-mono">{env.region}</div>

                  <div className="flex items-center justify-between text-xs py-1.5 border-t border-slate-200/60">
                    <span className="text-slate-500">Apps déployées :</span>
                    <span className="font-semibold text-slate-800">{env.deployedApps?.length || 0} modules</span>
                  </div>

                  <div className="flex items-center justify-between text-xs pt-1.5 border-t border-slate-200/60">
                    <span className="text-slate-500">Sécurité :</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-md font-mono ${tierBadge}`}>
                      {env.securityTier}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Platform Contracts & Inter-pack status (PF-CDC-04) */}
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden flex flex-col">
          <div className="px-6 py-4.5 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-violet-50 border border-violet-100 flex items-center justify-center">
                <FileCode2 className="w-4 h-4 text-violet-600" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-900">Contrats Inter-Packs (PF-CDC-04)</h2>
                <p className="text-[11px] text-slate-400 font-medium">APIs & Événements figés</p>
              </div>
            </div>
            <button
              onClick={() => dispatch(setActiveTab('contracts'))}
              className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold px-2.5 py-1 rounded-lg hover:bg-indigo-50/60"
            >
              Registre
            </button>
          </div>

          <div className="p-5 space-y-2.5 flex-1 overflow-y-auto max-h-96">
            {contracts.slice(0, 5).map((contr) => (
              <div
                key={contr.id}
                onClick={() => {
                  dispatch(setSelectedContractId(contr.id));
                  dispatch(setActiveTab('contracts'));
                }}
                className="p-3.5 rounded-2xl border border-slate-100 bg-slate-50/60 hover:border-indigo-200 hover:bg-indigo-50/20 transition-all cursor-pointer flex items-center justify-between"
              >
                <div>
                  <div className="flex items-center gap-1.5 font-semibold text-xs text-slate-900">
                    {contr.contractCode}
                    {contr.status === 'LOCKED' && <Lock className="w-3 h-3 text-emerald-600" />}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">{contr.ownerTeam}</div>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-semibold">
                    v{contr.contractVersion}
                  </span>
                  <div className="text-[10px] text-slate-400 mt-1">{contr.status}</div>
                </div>
              </div>
            ))}
          </div>

          <div className="p-4 bg-slate-50/80 border-t border-slate-100 text-center">
            <button
              onClick={() => dispatch(setActiveTab('contract-v1'))}
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center justify-center gap-1.5 w-full py-1.5 rounded-xl hover:bg-white transition-all border border-transparent hover:border-slate-200/80 shadow-none hover:shadow-sm"
            >
              <Shield className="w-3.5 h-3.5 text-emerald-500" />
              <span>Consulter la spécification Platform Contract v1</span>
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
              onClick={() => dispatch(setActiveTab('applications'))}
              className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold flex items-center gap-1 px-3 py-1.5 rounded-lg hover:bg-indigo-50/60"
            >
              <span>Toutes les applications ({applications.length})</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="divide-y divide-slate-100 flex-1">
            {applications.map((app) => {
              const appVersions = versions.filter((v) => v.applicationId === app.id);
              const activeVer = appVersions.find((v) => v.status === 'ACTIVE');

              return (
                <div
                  key={app.id}
                  onClick={() => {
                    dispatch(setSelectedAppId(app.id));
                    dispatch(setActiveTab('applications'));
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
                    <p className="text-xs text-slate-500 line-clamp-1">{app.description}</p>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <div className="text-right">
                      <div className="text-[10px] text-slate-400">Version Active</div>
                      <div className="font-mono text-xs font-bold text-indigo-600">
                        {activeVer ? `v${activeVer.version}` : 'Aucune'}
                      </div>
                    </div>
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      {app.status}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Activity & Audit Stream (PF-CDC-00, PF-CDC-06) */}
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden flex flex-col">
          <div className="px-6 py-4.5 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center">
                <Activity className="w-4 h-4 text-emerald-600" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-900">Activité Récente & Audit</h2>
                <p className="text-[11px] text-slate-400 font-medium">Traces de gouvernance immuables</p>
              </div>
            </div>
            <span className="text-[10px] font-mono text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md">Temps réel</span>
          </div>

          <div className="p-5 space-y-3 flex-1 overflow-y-auto max-h-96">
            {auditLogs.slice(0, 6).map((log) => (
              <div key={log.id} className="p-3 rounded-2xl border border-slate-100 bg-slate-50/50 text-xs space-y-1">
                <div className="flex items-center justify-between text-slate-400 text-[10px]">
                  <span className="font-medium text-slate-600">{log.actor}</span>
                  <span className="font-mono">{new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
                <div className="font-bold text-slate-800">{log.action}</div>
                <p className="text-slate-500 text-[11px] leading-relaxed">{log.details}</p>
                <div className="text-[10px] font-mono text-indigo-500">{log.traceId}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
