import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  CubeTransparentIcon,
  ShieldCheckIcon,
  ServerStackIcon,
  BoltIcon,
  ExclamationTriangleIcon,
  ArrowTopRightOnSquareIcon,
} from '@heroicons/react/24/outline';
import { erpHealthService as healthService, statsService, erpRegistryService } from '../services/apiClient.js';
import { MODULES } from '../erp/modulesConfig';
import { TableSkeleton } from '../components/Loaders';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

function Adapters() {
  const [health, setHealth] = useState(null);
  const [stats, setStats] = useState(null);
  const [registry, setRegistry] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      const [healthRes, statsRes, regRes] = await Promise.allSettled([
        healthService.check(),
        statsService.get(),
        erpRegistryService.getAll(),
      ]);
      if (healthRes.status === 'fulfilled') setHealth(healthRes.value.data);
      if (statsRes.status === 'fulfilled') setStats(statsRes.value.data);
      if (regRes.status === 'fulfilled') setRegistry(regRes.value.data);
      if (healthRes.status === 'rejected') {
        setError('Impossible de contacter l adapter (sante indisponible)');
        console.error(healthRes.reason);
      }
      setLoading(false);
    };
    fetchData();
  }, []);

  const healthState = health?.status;
  const healthy = healthState === 'CONNECTED';
  const degraded = healthState === 'DEGRADED';
  const unavailable = healthState === 'UNAVAILABLE';
  const notConfigured = healthState === 'NOT_CONFIGURED';

  const healthLabel = healthy ? 'Adapter connecte' : degraded ? 'Adapter degrade' : unavailable ? 'Adapter indisponible' : notConfigured ? 'Non configure' : 'Inconnu';

  const registryEntry = registry.find((r) => r.code === 'DOLIBARR');
  const stat = (key) => {
    const group = stats?.[key];
    return group?.total ?? 0;
  };

  if (loading) {
    return <TableSkeleton rows={8} />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Adapters</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Connecteurs entre la plateforme et le systeme ERP reel (Dolibarr). Aucun mock : donnees live via l API REST Dolibarr.
          </p>
        </div>
          <span
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-full font-medium ${
              healthy ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300' : degraded ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300' : 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300'
            }`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${healthy ? 'bg-emerald-500' : degraded ? 'bg-amber-500' : 'bg-red-500'} animate-pulse`} />
            {healthLabel}
          </span>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 rounded-xl p-4 flex items-center gap-3">
          <ExclamationTriangleIcon className="w-5 h-5 text-red-500 dark:text-red-400" />
          <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
        </div>
      )}

      {/* Sante de l adapter */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5">
          <div className="flex items-center gap-2 mb-2">
            <ShieldCheckIcon className="w-5 h-5 text-emerald-500 dark:text-emerald-400" />
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">Sante globale</p>
          </div>
          <p className={`text-2xl font-bold ${healthy ? 'text-emerald-600 dark:text-emerald-400' : degraded ? 'text-amber-600 dark:text-amber-400' : unavailable ? 'text-red-600 dark:text-red-400' : notConfigured ? 'text-slate-600 dark:text-slate-400' : 'text-red-600 dark:text-red-400'}`}>
            {health?.status ?? 'INCONNU'}
          </p>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Dernier check : {new Date(health?.timestamp ?? Date.now()).toLocaleString('fr-FR')}</p>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5">
          <div className="flex items-center gap-2 mb-2">
            <ServerStackIcon className="w-5 h-5 text-[#5469D4]" />
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">Mode exploite</p>
          </div>
          <p className="text-2xl font-bold text-slate-800 dark:text-slate-100">{health?.mode ?? 'DOLIBARR'}</p>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Source de verite : base Dolibarr reelle</p>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5">
          <div className="flex items-center gap-2 mb-2">
            <BoltIcon className="w-5 h-5 text-amber-500 dark:text-amber-400" />
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">Endpoints REST</p>
          </div>
          <p className="text-2xl font-bold text-slate-800 dark:text-slate-100">{MODULES.length}</p>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">modules ERP exposes via {BASE_URL}/erp</p>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5">
          <div className="flex items-center gap-2 mb-2">
            <CubeTransparentIcon className="w-5 h-5 text-orange-500 dark:text-orange-400" />
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">Registre</p>
          </div>
          {registryEntry ? (
            <>
              <p className="text-xl font-bold text-slate-800 dark:text-slate-100 truncate">{registryEntry.nom}</p>
              <span
                className={`inline-flex items-center gap-1.5 px-2 py-0.5 mt-1 text-[11px] rounded-full font-medium ${
                  registryEntry.status === 'active' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300' : 'bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400'
                }`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${registryEntry.status === 'active' ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                {registryEntry.status}
              </span>
            </>
          ) : (
            <p className="text-sm text-slate-400 dark:text-slate-500">Non enregistre</p>
          )}
        </div>
      </div>

      {/* Modules exposes */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-700/60">
          <h3 className="font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <ServerStackIcon className="w-5 h-5 text-[#5469D4]" />
            Modules exposes par l adapter Dolibarr
          </h3>
          <Link to="/mapping" className="text-sm text-[#5469D4] hover:text-[#4355B9] font-medium">
            Voir le mapping
          </Link>
        </div>
        <div className="px-6 py-4 overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left text-xs text-slate-400 dark:text-slate-500 uppercase tracking-wider border-b border-slate-100 dark:border-slate-700/60">
                <th className="pb-3 font-semibold">Module</th>
                <th className="pb-3 font-semibold">Endpoint</th>
                <th className="pb-3 font-semibold">Creations</th>
                <th className="pb-3 font-semibold text-right">Elements reels</th>
              </tr>
            </thead>
            <tbody>
              {MODULES.map((m) => {
                const Icon = m.icon;
                return (
                  <tr key={m.key} className="border-b border-slate-50 hover:bg-slate-50/50 dark:hover:bg-slate-700/40">
                    <td className="py-3">
                      <Link to={`/erp/${m.key}`} className="flex items-center gap-2.5 group">
                        <span className={`w-8 h-8 rounded-lg bg-gradient-to-br ${m.gradient} flex items-center justify-center shrink-0`}>
                          <Icon className="w-4 h-4 text-white" />
                        </span>
                        <span className="text-sm font-medium text-slate-700 dark:text-slate-200 group-hover:text-[#5469D4] truncate">{m.title}</span>
                      </Link>
                    </td>
                    <td className="py-3 font-mono text-xs text-slate-500 dark:text-slate-400">/erp/{m.key}</td>
                    <td className="py-3 text-sm text-slate-600 dark:text-slate-300">{m.create ? 'Oui' : 'Non'}</td>
                    <td className="py-3 text-right">
                      <Link to={`/erp/${m.key}`} className="inline-flex items-center gap-1 text-sm font-semibold text-[#5469D4] hover:text-[#4355B9]">
                        {stat(m.key)}
                        <ArrowTopRightOnSquareIcon className="w-3.5 h-3.5" />
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default Adapters;