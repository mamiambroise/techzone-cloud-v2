import React, { useState, useEffect } from 'react';
import {
  ServerStackIcon,
  KeyIcon,
  UsersIcon,
  ShieldCheckIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';
import { erpUserService as userService, erpHealthService as healthService, erpRegistryService } from '../services/apiClient.js';
import { TableSkeleton } from '../components/Loaders';

function Settings() {
  const [users, setUsers] = useState([]);
  const [health, setHealth] = useState(null);
  const [registry, setRegistry] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      const [userRes, healthRes, regRes] = await Promise.allSettled([
         userService.getAll(),
         healthService.check(),
        erpRegistryService.getAll(),
      ]);
      if (userRes.status === 'fulfilled') setUsers(Array.isArray(userRes.value.data) ? userRes.value.data : []);
      if (healthRes.status === 'fulfilled') setHealth(healthRes.value.data);
      if (regRes.status === 'fulfilled') {
        const list = regRes.value.data || [];
        setRegistry(list.find((r) => r.code === 'DOLIBARR') || null);
      }
      if (userRes.status === 'rejected') {
        setError('Impossible de charger les utilisateurs Dolibarr');
        console.error(userRes.reason);
      }
      setLoading(false);
    };
    fetchData();
  }, []);

  if (loading) {
    return <TableSkeleton rows={9} />;
  }

  const healthState = health?.status;
  const healthy = healthState === 'CONNECTED';
  const degraded = healthState === 'DEGRADED';
  const unavailable = healthState === 'UNAVAILABLE';
  const notConfigured = healthState === 'NOT_CONFIGURED';

  const healthLabel = healthy ? 'Connecte' : degraded ? 'Degrade' : unavailable ? 'Indisponible' : notConfigured ? 'Non configure' : 'Inconnu';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Paramètres ERP · Dolibarr</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Configuration de la connexion et utilisateurs reels du systeme ERP Dolibarr.
          </p>
        </div>
        <span
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-full font-medium ${
            healthy ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300' : degraded ? 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300' : 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300'
          }`}
        >
          <span className={`w-1.5 h-1.5 rounded-full ${healthy ? 'bg-emerald-500' : degraded ? 'bg-amber-500' : 'bg-red-50 dark:bg-red-900/300'} animate-pulse`} />
          {healthLabel}
        </span>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 rounded-xl p-4 flex items-center gap-3">
          <ExclamationTriangleIcon className="w-5 h-5 text-red-500" />
          <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
        </div>
      )}

      {/* Configuration */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5">
          <div className="flex items-center gap-2 mb-3">
            <ServerStackIcon className="w-5 h-5 text-[#5469D4]" />
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">Connexion ERP</p>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-500 dark:text-slate-400">ERP</span>
              <span className="font-medium text-slate-700 dark:text-slate-200">{registry?.nom || 'DOLIBARR'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 dark:text-slate-400">Code</span>
              <span className="font-mono text-slate-700 dark:text-slate-200">{registry?.code || 'DOLIBARR'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 dark:text-slate-400">Mode exploite</span>
              <span className="font-medium text-slate-700 dark:text-slate-200">{health?.mode ?? 'DOLIBARR'}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500 dark:text-slate-400">Statut API</span>
              <span className={`px-2.5 py-1 text-xs rounded-full font-medium ${healthy ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300' : degraded ? 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300' : unavailable ? 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300' : notConfigured ? 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400' : 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300'}`}>
                {health?.status ?? 'INCONNU'}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5">
          <div className="flex items-center gap-2 mb-3">
            <KeyIcon className="w-5 h-5 text-amber-500" />
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">Controle d acces API</p>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between items-center">
              <span className="text-slate-500 dark:text-slate-400">API REST</span>
              <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 text-xs font-medium">
                <CheckCircleIcon className="w-4 h-4" /> Active (DOLAPIKEY)
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 dark:text-slate-400">Entite</span>
              <span className="font-mono text-slate-700 dark:text-slate-200">{registry?.entity ?? '1'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 dark:text-slate-400">Version</span>
              <span className="text-slate-700 dark:text-slate-200">Dolibarr 23.0.3</span>
            </div>
          </div>
        </div>
      </div>

      {/* Utilisateurs Dolibarr */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-700/60">
          <h3 className="font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <UsersIcon className="w-5 h-5 text-[#5469D4]" />
            Utilisateurs Dolibarr
          </h3>
          <span className="text-xs font-medium text-slate-400 dark:text-slate-500">{users.length} utilisateur(s) reel(s)</span>
        </div>
        <div className="px-6 py-4 overflow-x-auto">
          {users.length === 0 ? (
            <p className="text-slate-500 dark:text-slate-400 text-sm">Aucun utilisateur trouve</p>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="text-left text-xs text-slate-400 dark:text-slate-500 uppercase tracking-wider border-b border-slate-100 dark:border-slate-700/60">
                  <th className="pb-3 font-semibold">ID</th>
                  <th className="pb-3 font-semibold">Login</th>
                  <th className="pb-3 font-semibold">Nom complet</th>
                  <th className="pb-3 font-semibold">Email</th>
                  <th className="pb-3 font-semibold">Role</th>
                  <th className="pb-3 font-semibold">Statut</th>
                  <th className="pb-3 font-semibold">Derniere connexion</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} className="border-b border-slate-50 hover:bg-slate-50/50 dark:hover:bg-slate-700/40">
                    <td className="py-3 font-mono text-sm text-slate-500 dark:text-slate-400">{u.id}</td>
                    <td className="py-3 font-mono text-sm font-medium text-slate-700 dark:text-slate-200">{u.login}</td>
                    <td className="py-3 text-sm text-slate-700 dark:text-slate-200">{[u.firstname, u.name].filter(Boolean).join(' ') || '—'}</td>
                    <td className="py-3 text-sm text-slate-600 dark:text-slate-300">{u.email || '—'}</td>
                    <td className="py-3">
                      <span className={`px-2.5 py-1 text-xs rounded-full font-medium ${u.admin ? 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300' : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'}`}>
                        {u.admin ? 'Admin' : 'Utilisateur'}
                      </span>
                    </td>
                    <td className="py-3">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-full font-medium ${u.active ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300' : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400'}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${u.active ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                        {u.active ? 'Actif' : 'Inactif'}
                      </span>
                    </td>
                    <td className="py-3 text-sm text-slate-500 dark:text-slate-400">{u.lastLogin ? new Date(u.lastLogin).toLocaleString('fr-FR') : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 text-xs text-slate-400 dark:text-slate-500">
        <ShieldCheckIcon className="w-4 h-4" />
        Les utilisateurs proviennent directement de la base Dolibarr (read-only via API REST).
      </div>
    </div>
  );
}

export default Settings;