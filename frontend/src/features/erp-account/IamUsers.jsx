import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  UsersIcon,
  PlusIcon,
  MagnifyingGlassIcon,
  TrashIcon,
  CheckCircleIcon,
  XCircleIcon,
  PauseCircleIcon,
  ShieldCheckIcon,
  UserCircleIcon,
} from '@heroicons/react/24/outline';
import { iamAdminService } from './services.js';
import { useAuth } from '../../auth/AuthProvider.jsx';
import { TableSkeleton } from '../../components/Loaders';

const statusBadge = (status) => {
  const map = {
    ACTIVE: 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400',
    PENDING: 'bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400',
    SUSPENDED: 'bg-orange-50 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400',
    DISABLED: 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400',
    LOCKED: 'bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400',
    ARCHIVED: 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400',
  };
  return map[status] || 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400';
};

function IamUsers() {
  const { user: me } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ username: '', email: '', firstName: '', lastName: '', password: '', isAdmin: false });

  const load = useCallback(async (q) => {
    setLoading(true);
    setError('');
    try {
      const res = await iamAdminService.users(q ? { search: q } : {});
      setUsers(Array.isArray(res.data?.data) ? res.data.data : []);
    } catch (err) {
      setError(err?.response?.data?.message || err.message || 'Erreur de chargement');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => load(search), 250);
    return () => clearTimeout(t);
  }, [search, load]);

  const handleStatus = async (u, status) => {
    setBusy(true);
    setNotice('');
    setError('');
    try {
      await iamAdminService.updateUserStatus(u.id, { status });
      setNotice(`Statut de « ${u.username} » → ${status}`);
      load(search);
    } catch (err) {
      setError(err?.response?.data?.message || 'Échec de la mise à jour du statut');
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async (u) => {
    if (!window.confirm(`Supprimer définitivement « ${u.username} » ?`)) return;
    setBusy(true);
    setError('');
    setNotice('');
    try {
      await iamAdminService.deleteUser(u.id);
      setNotice(`Utilisateur « ${u.username} » supprimé`);
      load(search);
    } catch (err) {
      setError(err?.response?.data?.message || 'Échec de la suppression');
    } finally {
      setBusy(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    setNotice('');
    try {
      await iamAdminService.createUser(form);
      setNotice(`Utilisateur « ${form.username} » créé`);
      setShowCreate(false);
      setForm({ username: '', email: '', firstName: '', lastName: '', password: '', isAdmin: false });
      load(search);
    } catch (err) {
      const body = err?.response?.data;
      const msg =
        body?.code === 'USER_ALREADY_EXISTS' ? 'Nom d\'utilisateur ou email déjà utilisé' :
        body?.code === 'PASSWORD_TOO_SHORT' ? 'Mot de passe trop court (min 10 caractères)' :
        body?.message || err.message || 'Échec de la création';
      setError(msg);
    } finally {
      setBusy(false);
    }
  };

  const sortedUsers = useMemo(
    () => [...users].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)),
    [users],
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">IAM · Utilisateurs</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Gestion des comptes et de leurs statuts</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#3B4BA8] to-[#5469D4] text-white text-sm font-semibold shadow-lg shadow-indigo-500/25 hover:from-[#35439A] hover:to-[#4A5EC7] transition-all"
        >
          <PlusIcon className="w-4 h-4" /> Créer un utilisateur
        </button>
      </div>

      {error && (
        <div className="rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 px-4 py-3 text-sm text-red-600 dark:text-red-400">{error}</div>
      )}
      {notice && (
        <div className="rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 px-4 py-3 text-sm text-emerald-600 dark:text-emerald-400">{notice}</div>
      )}

      {showCreate && (
        <form onSubmit={handleCreate} className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-slate-800 dark:text-slate-100">Nouvel utilisateur</h2>
            <button type="button" onClick={() => setShowCreate(false)} className="text-sm text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">Fermer</button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Nom d'utilisateur *</label>
              <input value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} required className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#5469D4]" placeholder="ex: jean" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Email *</label>
              <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#5469D4]" placeholder="jean@techcloud.com" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Prénom</label>
              <input value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#5469D4]" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Nom</label>
              <input value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#5469D4]" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Mot de passe * (min 10)</label>
              <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required minLength={10} className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#5469D4]" />
            </div>
            <div className="flex items-end">
              <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300 cursor-pointer pb-2">
                <input type="checkbox" checked={form.isAdmin} onChange={(e) => setForm({ ...form, isAdmin: e.target.checked })} className="w-4 h-4 accent-[#5469D4]" />
                Administrateur (accès console IAM)
              </label>
            </div>
          </div>
          <div className="mt-5 flex justify-end gap-3">
            <button type="button" onClick={() => setShowCreate(false)} className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-600 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">Annuler</button>
            <button type="submit" disabled={busy} className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#5469D4] text-white text-sm font-semibold hover:bg-[#4A5EC7] disabled:opacity-60 transition-colors">
              {busy ? 'Création...' : 'Créer'}
            </button>
          </div>
        </form>
      )}

      <div className="relative max-w-sm">
        <MagnifyingGlassIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Rechercher (nom, email)..."
          className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-[#5469D4]"
        />
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm">
        {loading ? (
          <TableSkeleton rows={6} />
        ) : sortedUsers.length === 0 ? (
          <div className="px-6 py-14 text-center">
            <UsersIcon className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-600" />
            <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">Aucun utilisateur</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wide text-slate-400 dark:text-slate-500 border-b border-slate-100 dark:border-slate-700/60">
                  <th className="px-5 py-3 font-semibold">Utilisateur</th>
                  <th className="px-5 py-3 font-semibold">Email</th>
                  <th className="px-5 py-3 font-semibold">Statut</th>
                  <th className="px-5 py-3 font-semibold">Créé le</th>
                  <th className="px-5 py-3 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                {sortedUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/40 transition-colors">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <span className={`inline-flex h-9 w-9 rounded-full items-center justify-center text-white text-xs font-bold ${u.isAdmin ? 'bg-gradient-to-br from-[#3B4BA8] to-[#5469D4]' : 'bg-slate-400 dark:bg-slate-600'}`}>
                          {((u.firstName?.[0] || '') + (u.lastName?.[0] || '') || u.username?.[0]).toUpperCase()}
                        </span>
                        <div className="min-w-0">
                          <p className="font-medium text-slate-800 dark:text-slate-100 flex items-center gap-1.5 truncate">
                            {[u.firstName, u.lastName].filter(Boolean).join(' ') || u.username}
                            {u.isAdmin && <ShieldCheckIcon className="w-4 h-4 text-[#5469D4]" />}
                          </p>
                          <p className="text-xs text-slate-400 dark:text-slate-500 truncate">@{u.username}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-slate-500 dark:text-slate-400">{u.primaryEmail}</td>
                    <td className="px-5 py-3">
                      <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full ${statusBadge(u.status)}`}>{u.status}</span>
                    </td>
                    <td className="px-5 py-3 text-slate-400 dark:text-slate-500">{u.createdAt ? new Date(u.createdAt).toLocaleDateString() : '—'}</td>
                    <td className="px-5 py-3 text-right">
                      <div className="inline-flex items-center gap-1">
                        {u.status !== 'ACTIVE' && (
                          <button onClick={() => handleStatus(u, 'ACTIVE')} disabled={busy} title="Activer" className="p-2 rounded-lg text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 disabled:opacity-40">
                            <CheckCircleIcon className="w-4 h-4" />
                          </button>
                        )}
                        {u.status !== 'SUSPENDED' && (
                          <button onClick={() => handleStatus(u, 'SUSPENDED')} disabled={busy || u.id === me?.id} title="Suspendre" className="p-2 rounded-lg text-orange-600 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-900/30 disabled:opacity-40">
                            <PauseCircleIcon className="w-4 h-4" />
                          </button>
                        )}
                        {u.status !== 'DISABLED' && u.id !== me?.id && (
                          <button onClick={() => handleStatus(u, 'DISABLED')} disabled={busy} title="Désactiver" className="p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700/60 disabled:opacity-40">
                            <XCircleIcon className="w-4 h-4" />
                          </button>
                        )}
                        {u.id !== me?.id && (
                          <button onClick={() => handleDelete(u)} disabled={busy} title="Supprimer" className="p-2 rounded-lg text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 disabled:opacity-40">
                            <TrashIcon className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <p className="text-xs text-slate-400 dark:text-slate-500">
        <UserCircleIcon className="inline w-3.5 h-3.5 mr-1" />
        Vous ne pouvez pas modifier vos propres statut ni supprimer votre compte.
      </p>
    </div>
  );
}

export default IamUsers;