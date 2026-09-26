import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { iamAdminService } from '../../services/apiClient.js';
import { iamUsersPageMock } from './mockData.js';
import { ModernSpinner } from '../../components/Loaders.jsx';
import ConfirmModal from '../../components/ui/ConfirmModal.jsx';
import { useToast } from '../../hooks/useToast.js';

const STATUS_OPTIONS = ['ALL', 'ACTIVE', 'SUSPENDED', 'DISABLED'];
const STATUS_LABELS = { ALL: 'Tous', ACTIVE: 'Actif', SUSPENDED: 'Suspendu', DISABLED: 'Désactivé' };
const STATUS_COLORS = {
  ACTIVE: { dot: 'bg-green-500', text: 'text-green-700', bg: 'bg-green-100' },
  SUSPENDED: { dot: 'bg-amber-500', text: 'text-amber-700', bg: 'bg-amber-100' },
  DISABLED: { dot: 'bg-gray-500', text: 'text-gray-700', bg: 'bg-gray-100' },
};

function UserForm({ open, user, onClose, onSubmit, title }) {
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', username: '', isAdmin: false });

  useEffect(() => {
    if (open && user) {
      setForm({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.primaryEmail || '',
        username: user.username || '',
        isAdmin: user.isAdmin || false,
      });
    } else if (open && !user) {
      setForm({ firstName: '', lastName: '', email: '', username: '', isAdmin: false });
    }
  }, [open, user]);

  if (!open) return null;

  const update = (field, value) => setForm((f) => ({ ...f, [field]: value }));
  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(form);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4" onClick={(e) => e.stopPropagation()}>
        <div className="p-5 border-b border-slate-200 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">×</button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Prénom *</label>
              <input type="text" required value={form.firstName} onChange={(e) => update('firstName', e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Nom *</label>
              <input type="text" required value={form.lastName} onChange={(e) => update('lastName', e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Email *</label>
            <input type="email" required value={form.email} onChange={(e) => update('email', e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Nom d'utilisateur *</label>
            <input type="text" required value={form.username} onChange={(e) => update('username', e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" />
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" id="isAdmin" checked={form.isAdmin} onChange={(e) => update('isAdmin', e.target.checked)} className="rounded border-slate-300" />
            <label htmlFor="isAdmin" className="text-xs text-slate-600">Administrateur</label>
          </div>
          <div className="flex items-center justify-end gap-3 pt-2 border-t">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg">Annuler</button>
            <button type="submit" className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700">Enregistrer</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function IamUsersPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedUser, setSelectedUser] = useState(null);
  const [formOpen, setFormOpen] = useState(false);
  const [formUser, setFormUser] = useState(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      const response = await iamAdminService.users({ status: statusFilter !== 'ALL' ? statusFilter : undefined });
      const apiUsers = response.data;
      setUsers(Array.isArray(apiUsers) ? apiUsers : []);
    } catch {
      {
        toast.error('Erreur lors du chargement des utilisateurs.');
        setUsers([]);
      }
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const filteredUsers = users.filter((u) => {
    const q = search.toLowerCase().trim();
    const matches = !q ||
      (u.firstName || '').toLowerCase().includes(q) ||
      (u.lastName || '').toLowerCase().includes(q) ||
      (u.username || '').toLowerCase().includes(q) ||
      (u.primaryEmail || '').toLowerCase().includes(q);
    const statusMatch = statusFilter === 'ALL' || u.status === statusFilter;
    return matches && statusMatch;
  });

  const handleCreate = async (form) => {
    try {
      await iamAdminService.createUser(form);
      setFormOpen(false);
      loadUsers();
    } catch {
      {
        toast.error("Erreur lors de la création de l'utilisateur.");
      }
    }
  };

  const handleUpdateStatus = async (user, status) => {
    try {
      await iamAdminService.updateUserStatus(user.id, { status });
      setUsers(users.map((u) => u.id === user.id ? { ...u, status } : u));
    } catch {
      {
        toast.error('Erreur lors de la mise à jour du statut.');
      }
    }
  };

  const handleDelete = async (user) => {
    try {
      await iamAdminService.deleteUser(user.id);
      setUsers(users.filter((u) => u.id !== user.id));
      setSelectedUser(null);
    } catch {
      {
        toast.error("Erreur lors de la suppression de l'utilisateur.");
      }
    }
    setConfirmOpen(false);
  };

  const handleDeleteClick = (user) => {
    setConfirmAction({ type: 'delete', user });
    setConfirmOpen(true);
  };

  const handleStatusClick = (user) => {
    if (user.status === 'ACTIVE') {
      setConfirmAction({ type: 'suspend', user });
    } else {
      setConfirmAction({ type: 'activate', user });
    }
    setConfirmOpen(true);
  };

  const confirmLabel = confirmAction?.type === 'suspend' ? 'Suspendre' :
    confirmAction?.type === 'activate' ? 'Réactiver' : 'Supprimer';

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[400px]">
        <ModernSpinner />
      </div>
    );
  }

  return (
    <div className="p-6">
      <nav className="text-xs text-slate-500 mb-4">
        <span>Auth + IAM + Context</span> <span className="mx-1">/</span>
        <span className="text-slate-900 font-medium">Utilisateurs IAM</span>
      </nav>

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Utilisateurs IAM</h1>
        <p className="text-sm text-slate-500 mt-1">Gérez les comptes utilisateurs, leurs statuts et leurs droits.</p>
      </div>

      <div className="flex items-center gap-4 mb-5">
        <div className="relative flex-1 max-w-md">
          <input
            type="text"
            placeholder="Rechercher un utilisateur..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-3 py-2 border border-slate-300 rounded-lg text-sm"
          />
          <svg className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" /></svg>
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white">
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>{STATUS_LABELS[s]}</option>
          ))}
        </select>
        <button
          onClick={() => { setFormUser(null); setFormOpen(true); }}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
        >
          + Nouvel utilisateur
        </button>
      </div>

      <div className="overflow-x-auto rounded-lg border border-slate-200">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-slate-700">Utilisateur</th>
              <th className="text-left px-4 py-3 font-medium text-slate-700">Email</th>
              <th className="text-left px-4 py-3 font-medium text-slate-700">Statut</th>
              <th className="text-left px-4 py-3 font-medium text-slate-700">Admin</th>
              <th className="text-left px-4 py-3 font-medium text-slate-700">Dernière modif.</th>
              <th className="text-left px-4 py-3 font-medium text-slate-700">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-slate-500">Aucun utilisateur ne correspond aux filtres.</td></tr>
            )}
            {filteredUsers.map((u) => (
              <tr key={u.id} className={`border-b border-slate-100 cursor-pointer transition-colors ${selectedUser?.id === u.id ? 'bg-blue-50' : 'hover:bg-slate-50'}`} onClick={() => setSelectedUser(u)}>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs">{(u.firstName?.[0] || '') + (u.lastName?.[0] || '')}</div>
                    <div>
                      <div className="font-medium text-slate-900">{u.firstName} {u.lastName}</div>
                      <div className="text-slate-500">@{u.username}</div>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-slate-600">{u.primaryEmail}</td>
                <td className="px-4 py-3">
                  {u.status && (
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[u.status]?.bg || 'bg-gray-100'} ${STATUS_COLORS[u.status]?.text || 'text-gray-700'}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${STATUS_COLORS[u.status]?.dot || 'bg-gray-400'}`} />
                      {u.status}
                    </span>
                  )}
                </td>
                <td className="px-4 py-3">{u.isAdmin ? '✓ Oui' : '—'}</td>
                <td className="px-4 py-3 text-slate-500">{u.updatedAt ? new Date(u.updatedAt).toLocaleDateString('fr-FR') : '—'}</td>
                <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center gap-1">
                    <button onClick={() => handleStatusClick(u)} title={u.status === 'ACTIVE' ? 'Suspendre' : 'Réactiver'} className="p-1 text-slate-500 hover:text-amber-600">
                      {u.status === 'ACTIVE' ? '⤡' : '⤊'}
                    </button>
                    <button onClick={() => { setFormUser(u); setFormOpen(true); }} title="Modifier" className="p-1 text-slate-500 hover:text-blue-600">✎</button>
                    <button onClick={() => handleDeleteClick(u)} title="Supprimer" className="p-1 text-slate-500 hover:text-red-600">×</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <UserForm
        open={formOpen}
        user={formUser}
        title={formUser ? 'Modifier l\'utilisateur' : 'Nouvel utilisateur'}
        onClose={() => { setFormOpen(false); setFormUser(null); }}
        onSubmit={(form) => formUser ? handleCreate(form) : handleCreate(form)}
      />

      <ConfirmModal
        open={confirmOpen}
        title={confirmAction?.type === 'delete' ? 'Supprimer l\'utilisateur' : confirmAction?.type === 'suspend' ? 'Suspendre l\'utilisateur' : 'Réactiver l\'utilisateur'}
        message={confirmAction?.type === 'delete'
          ? `Êtes-vous sûr de vouloir supprimer ${confirmAction?.user?.firstName} ${confirmAction?.user?.lastName} ?`
          : confirmAction?.type === 'suspend'
            ? `Suspension de ${confirmAction?.user?.firstName} ${confirmAction?.user?.lastName}.`
            : `Réactivation de ${confirmAction?.user?.firstName} ${confirmAction?.user?.lastName}.`}
        confirmLabel={confirmLabel}
        confirmVariant={confirmAction?.type === 'delete' ? 'danger' : 'primary'}
        onCancel={() => setConfirmOpen(false)}
        onConfirm={() => {
          if (confirmAction?.type === 'delete') {
            handleDelete(confirmAction.user);
          } else if (confirmAction?.type === 'suspend') {
            handleUpdateStatus(confirmAction.user, 'SUSPENDED');
          } else if (confirmAction?.type === 'activate') {
            handleUpdateStatus(confirmAction.user, 'ACTIVE');
          }
        }}
      />
    </div>
  );
}
