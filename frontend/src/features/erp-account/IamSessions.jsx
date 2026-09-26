import React, { useCallback, useEffect, useState } from 'react';
import { LinkIcon, TrashIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import { iamAdminService } from './services.js';
import { useAuth } from '../../auth/AuthProvider.jsx';
import { TableSkeleton } from '../../components/Loaders';

const statusBadge = (status) => {
  const map = {
    ACTIVE: 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400',
    EXPIRED: 'bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400',
    REVOKED: 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400',
  };
  return map[status] || 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400';
};

const fmt = (iso) => (iso ? new Date(iso).toLocaleString() : '—');

function IamSessions() {
  const { user: me } = useAuth();
  const [sessions, setSessions] = useState([]);
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await iamAdminService.sessions(status ? { status } : {});
      setSessions(Array.isArray(res.data?.data) ? res.data.data : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [status]);

  useEffect(() => { load(); }, [load]);

  const handleRevoke = async (s) => {
    if (!window.confirm(`Révoquer la session de « ${s.username || s.email} » ?`)) return;
    setBusy(true);
    setNotice('');
    try {
      await iamAdminService.revokeSession(s.id);
      setNotice('Session révoquée');
      load();
    } catch (err) {
      setNotice(err?.response?.data?.message || 'Échec de la révocation');
    } finally {
      setBusy(false);
    }
  };

  const mine = sessions.filter((s) => s.userId === me?.id);
  const others = sessions.filter((s) => s.userId !== me?.id);

  const renderTable = (rows, label) => (
    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm">
      <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-700/60 flex items-center justify-between">
        <h2 className="font-semibold text-slate-800 dark:text-slate-100">{label}</h2>
        <span className="text-xs text-slate-400 dark:text-slate-500">{rows.length}</span>
      </div>
      {loading ? (
        <TableSkeleton rows={4} />
      ) : rows.length === 0 ? (
        <div className="px-6 py-10 text-center">
          <LinkIcon className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-600" />
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Aucune session</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wide text-slate-400 dark:text-slate-500 border-b border-slate-100 dark:border-slate-700/60">
                <th className="px-5 py-3 font-semibold">Utilisateur</th>
                <th className="px-5 py-3 font-semibold">Niveau</th>
                <th className="px-5 py-3 font-semibold">Statut</th>
                <th className="px-5 py-3 font-semibold">Créée</th>
                <th className="px-5 py-3 font-semibold">Dernière activité</th>
                <th className="px-5 py-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
              {rows.map((s) => (
                <tr key={s.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/40 transition-colors">
                  <td className="px-5 py-3">
                    <p className="font-medium text-slate-800 dark:text-slate-100">{s.username || s.email || 'Utilisateur'}</p>
                    <p className="text-xs text-slate-400 dark:text-slate-500">{s.userId === me?.id ? 'vous' : s.environment || ''}</p>
                  </td>
                  <td className="px-5 py-3 text-slate-500 dark:text-slate-400">{s.authenticationLevel || '—'}</td>
                  <td className="px-5 py-3">
                    <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full ${statusBadge(s.status)}`}>{s.status}</span>
                  </td>
                  <td className="px-5 py-3 text-slate-400 dark:text-slate-500">{fmt(s.createdAt)}</td>
                  <td className="px-5 py-3 text-slate-400 dark:text-slate-500">{fmt(s.lastActivityAt)}</td>
                  <td className="px-5 py-3 text-right">
                    {s.status === 'ACTIVE' && (
                      <button onClick={() => handleRevoke(s)} disabled={busy} title="Révoquer" className="p-2 rounded-lg text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 disabled:opacity-40">
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">IAM · Sessions</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Sessions de connexion et révocation</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-[#5469D4]"
          >
            <option value="">Tous les statuts</option>
            <option value="ACTIVE">Actives</option>
            <option value="EXPIRED">Expirées</option>
            <option value="REVOKED">Révéquées</option>
          </select>
          <button onClick={load} title="Actualiser" className="p-2 rounded-xl text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors">
            <ArrowPathIcon className="w-5 h-5" />
          </button>
        </div>
      </div>

      {notice && (
        <div className="rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 px-4 py-3 text-sm text-emerald-600 dark:text-emerald-400">{notice}</div>
      )}

      {renderTable(mine, 'Mes sessions')}
      {renderTable(others, 'Toutes les autres sessions')}
    </div>
  );
}

export default IamSessions;