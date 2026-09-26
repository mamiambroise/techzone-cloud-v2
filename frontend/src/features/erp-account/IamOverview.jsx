import React, { useCallback, useEffect, useState } from 'react';
import {
  UsersIcon,
  CheckCircleIcon,
  ClockIcon,
  LinkIcon,
  ShieldCheckIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';
import { useNavigate } from 'react-router-dom';
import { iamAdminService } from './services.js';
import { useAuth } from '../../auth/AuthProvider.jsx';
import { ModernSpinner } from '../../components/Loaders';

const timeAgo = (iso) => {
  if (!iso) return '—';
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "à l'instant";
  if (m < 60) return `il y a ${m} min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `il y a ${h} h`;
  return `il y a ${Math.floor(h / 24)} j`;
};

function IamOverview() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [s, ses] = await Promise.all([iamAdminService.stats(), iamAdminService.sessions()]);
      setStats(s.data?.data);
      setSessions(Array.isArray(ses.data?.data) ? ses.data.data : []);
    } catch (err) {
      setError(err?.response?.data?.message || err.message || 'Erreur de chargement');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  if (loading) return <ModernSpinner label="Chargement de la console IAM..." />;

  const cards = [
    { label: 'Utilisateurs', value: stats?.users ?? 0, icon: UsersIcon, tint: 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-300' },
    { label: 'Actifs', value: stats?.activeUsers ?? 0, icon: CheckCircleIcon, tint: 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-300' },
    { label: 'En attente', value: stats?.pendingUsers ?? 0, icon: ClockIcon, tint: 'bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-300' },
    { label: 'Sessions actives', value: stats?.activeSessions ?? 0, icon: LinkIcon, tint: 'bg-sky-50 dark:bg-sky-900/30 text-sky-600 dark:text-sky-300' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">IAM · Vue d'ensemble</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Identité, accès et gestion des sessions ({user?.username || 'utilisateur'})
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 px-3 py-1.5 rounded-full">
            <ShieldCheckIcon className="w-4 h-4" /> IAM sécurisé par JWT
          </span>
          <button
            onClick={load}
            className="inline-flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300 hover:text-[#5469D4] px-3 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <ArrowPathIcon className="w-4 h-4" /> Actualiser
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 px-4 py-3 text-sm text-red-600 dark:text-red-400">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        {cards.map((c) => (
          <div key={c.label} className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5 flex items-start justify-between shadow-sm">
            <div>
              <p className="text-sm text-slate-500 dark:text-slate-400">{c.label}</p>
              <p className="mt-1 text-3xl font-bold text-slate-900 dark:text-white">{c.value}</p>
            </div>
            <span className={`inline-flex h-11 w-11 rounded-xl items-center justify-center ${c.tint}`}>
              <c.icon className="w-5 h-5" />
            </span>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-slate-800 dark:text-slate-100">Sessions récentes</h2>
            <button onClick={() => navigate('/iam/sessions')} className="text-xs font-medium text-[#5469D4] dark:text-[#94A3FF] hover:underline">
              Tout voir
            </button>
          </div>
          <div className="divide-y divide-slate-100 dark:divide-slate-700/50">
            {sessions.length === 0 ? (
              <p className="py-8 text-center text-sm text-slate-400 dark:text-slate-500">Aucune session</p>
            ) : (
              sessions.slice(0, 6).map((s) => (
                <div key={s.id} className="py-3 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-700 dark:text-slate-200 truncate">{s.username || s.email || 'Utilisateur'}</p>
                    <p className="text-xs text-slate-400 dark:text-slate-500">Auth {s.authenticationLevel || '—'} · {timeAgo(s.lastActivityAt)}</p>
                  </div>
                  <span className={`shrink-0 text-[11px] font-semibold px-2.5 py-1 rounded-full ${
                    s.status === 'ACTIVE'
                      ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400'
                      : s.status === 'EXPIRED'
                        ? 'bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400'
                        : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400'
                  }`}>
                    {s.status}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm">
          <h2 className="font-semibold text-slate-800 dark:text-slate-100 mb-4">Actions rapides</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button onClick={() => navigate('/iam/users')} className="text-left px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-[#5469D4] hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">Utilisateurs</p>
              <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">Liste, création, statuts</p>
            </button>
            <button onClick={() => navigate('/iam/sessions')} className="text-left px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-[#5469D4] hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">Sessions</p>
              <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">Sessions actives et révéquées</p>
            </button>
            <button onClick={() => navigate('/iam/profile')} className="text-left px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-[#5469D4] hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors sm:col-span-2">
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">Mon profil & mot de passe</p>
              <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">Modifier son mot de passe (les 5 derniers interdits)</p>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default IamOverview;