import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Search,
  RefreshCw,
  Shield,
  ShieldCheck,
  ShieldQuestion,
  Edit2,
  Trash2,
  MoreVertical,
  BarChart3,
  Users,
  CheckCircle,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { iamAdminService } from '../../services/apiClient.js';
import { iamRolesMock, iamRolesOptions } from './mockData.js';
import { ModernSpinner } from '../../components/Loaders.jsx';
import ConfirmModal from '../../components/ui/ConfirmModal.jsx';
import { useToast } from '../../hooks/useToast.js';

const ROLE_TYPE_OPTIONS = ['Tous', 'SYSTEM', 'CUSTOM'];

function RoleForm({ open, role, onClose, onSubmit, title }) {
  const [form, setForm] = useState({ name: '', displayName: '', description: '', type: 'CUSTOM', permissions: [] });
  const [customPerm, setCustomPerm] = useState('');

  useEffect(() => {
    if (open && role) {
      setForm({
        name: role.name || '',
        displayName: role.displayName || '',
        description: role.description || '',
        type: role.type || 'CUSTOM',
        permissions: role.permissions || [],
      });
    } else if (open && !role) {
      setForm({ name: '', displayName: '', description: '', type: 'CUSTOM', permissions: [] });
    }
  }, [open, role]);

  if (!open) return null;

  const update = (field, value) => setForm((f) => ({ ...f, [field]: value }));

  const addPermission = () => {
    const trimmed = customPerm.trim();
    if (trimmed && !form.permissions.includes(trimmed)) {
      update('permissions', [...form.permissions, trimmed]);
    }
    setCustomPerm('');
  };

  const removePermission = (perm) => {
    update('permissions', form.permissions.filter((p) => p !== perm));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.displayName.trim()) return;
    onSubmit(form);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl mx-4" onClick={(e) => e.stopPropagation()}>
        <div className="p-5 border-b border-slate-200 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-xl">×</button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Nom *</label>
              <input type="text" required value={form.name} onChange={(e) => update('name', e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Affichage *</label>
              <input type="text" required value={form.displayName} onChange={(e) => update('displayName', e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Description</label>
            <textarea value={form.description} onChange={(e) => update('description', e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm h-20" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Type</label>
            <select value={form.type} onChange={(e) => update('type', e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white">
              {ROLE_TYPE_OPTIONS.slice(1).map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Permissions</label>
            <div className="flex gap-2">
              <input type="text" value={customPerm} onChange={(e) => setCustomPerm(e.target.value)} placeholder="ex: user:create" className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm" />
              <button type="button" onClick={addPermission} className="px-3 py-2 bg-slate-100 text-slate-700 rounded-lg text-sm hover:bg-slate-200">Ajouter</button>
            </div>
            <div className="flex flex-wrap gap-1.5 mt-2">
              {form.permissions.map((p) => (
                <span key={p} className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs">
                  {p}
                  <button type="button" onClick={() => removePermission(p)} className="hover:text-blue-900">×</button>
                </span>
              ))}
            </div>
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

function ActionMenu({ role, onEdit, onDelete }) {
  const [open, setOpen] = useState(false);
  const [ref, setRef] = useState(null);

  useEffect(() => {
    if (!open) return undefined;
    const handler = (e) => {
      if (ref && !ref.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open, ref]);

  return (
    <div className="relative" ref={setRef}>
      <button type="button" className="p-1.5 text-slate-500 hover:text-slate-700 rounded-lg hover:bg-slate-100" title="Actions" onClick={() => setOpen((v) => !v)}>
        <MoreVertical className="w-4 h-4" />
      </button>
      {open && (
        <div className="absolute right-0 z-20 mt-1 w-40 bg-white border border-slate-200 rounded-lg shadow-lg">
          <button type="button" className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-100" onClick={() => { setOpen(false); onEdit(role); }}><Edit2 className="w-4 h-4" />Modifier</button>
          {!role.isBuiltIn && (
            <button type="button" className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50" onClick={() => { setOpen(false); onDelete(role); }}><Trash2 className="w-4 h-4" />Supprimer</button>
          )}
        </div>
      )}
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-2">
      <div className="flex items-start justify-between">
        <div className="space-y-1 flex-1">
          <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">{label}</span>
          <p className="text-3xl font-bold text-slate-900">{value}</p>
        </div>
        <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${color}15`, color: color }}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </div>
  );
}

export default function RolesPage() {
  const { toast } = useToast();
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('Tous');
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const [formOpen, setFormOpen] = useState(false);
  const [formRole, setFormRole] = useState(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);

  const loadRoles = useCallback(async () => {
    setLoading(true);
    try {
      const response = await iamAdminService.roles();
      const data = response.data;
      setRoles(Array.isArray(data) ? data : (data?.roles ?? data?.data ?? []));
    } catch {
      {
        toast.error('Erreur lors du chargement des rôles.');
        setRoles([]);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRoles();
  }, [loadRoles]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return roles.filter((role) => {
      const matches = !q ||
        (role.name || '').toLowerCase().includes(q) ||
        (role.displayName || '').toLowerCase().includes(q) ||
        (role.description || '').toLowerCase().includes(q);
      const typeMatch = typeFilter === 'Tous' || role.type === typeFilter;
      return matches && typeMatch;
    });
  }, [roles, search, typeFilter]);

  useEffect(() => {
    setPage(1);
  }, [search, typeFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const pageItems = filtered.slice((safePage - 1) * pageSize, safePage * pageSize);

  const handleCreate = async (form) => {
    try {
      const body = role.displayName === '' ? { ...form } : { ...form };
      if (formRole) {
        await iamAdminService.updateRole(formRole.id, body);
      } else {
        await iamAdminService.createRole(body);
      }
      toast.success(formRole ? 'Rôle mis à jour.' : 'Rôle créé avec succès.');
      setFormOpen(false);
      setFormRole(null);
      loadRoles();
    } catch {
      {
        toast.error('Erreur lors de l\'opération sur le rôle.');
      }
      toast.success(formRole ? 'Rôle mis à jour.' : 'Rôle créé avec succès.');
      setFormOpen(false);
      setFormRole(null);
    }
  };

  const handleDelete = (role) => {
    setConfirmAction(role);
    setConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!confirmAction) return;
    try {
      await iamAdminService.deleteRole(confirmAction.id);
      setRoles(roles.filter((r) => r.id !== confirmAction.id));
      toast.success('Rôle supprimé.');
    } catch {
      {
        toast.error('Erreur lors de la suppression du rôle.');
      }
    }
    setConfirmOpen(false);
    setConfirmAction(null);
  };

  const typeStats = ROLE_TYPE_OPTIONS.slice(1).map((t) => ({
    type: t,
    value: roles.filter((r) => r.type === t).length,
    color: t === 'SYSTEM' ? '#6366f1' : '#10b981',
  }));

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
        <span className="text-slate-900 font-medium">Rôles IAM</span>
      </nav>

      <div className="mb-6">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-slate-900">Rôles IAM</h1>
          <button onClick={loadRoles} title="Actualiser" className="p-1.5 text-slate-500 hover:text-slate-700 rounded-lg hover:bg-slate-100">
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
        <p className="text-sm text-slate-500 mt-1">Définissez les rôles et leurs permissions au sein de votre organisation.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-6">
        <StatCard icon={Shield} label="Rôles totales" value={roles.length} color="#2563eb" />
        <StatCard icon={ShieldCheck} label="Rôles système" value={typeStats[0].value} color={typeStats[0].color} />
        <StatCard icon={ShieldQuestion} label="Rôles personnalisées" value={typeStats[1].value} color={typeStats[1].color} />
      </div>

      <div className="flex items-center gap-3 mb-5">
        <div className="relative flex-1 max-w-md">
          <input
            type="text"
            placeholder="Rechercher un rôle..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-3 py-2 border border-slate-300 rounded-lg text-sm"
          />
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
        </div>
        <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white">
          {ROLE_TYPE_OPTIONS.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
        <button
          onClick={() => { setFormRole(null); setFormOpen(true); }}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
        >
          + Nouveau rôle
        </button>
      </div>

      <div className="overflow-x-auto rounded-lg border border-slate-200">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-slate-700">Rôle</th>
              <th className="text-left px-4 py-3 font-medium text-slate-700">Type</th>
              <th className="text-left px-4 py-3 font-medium text-slate-700">Permissions</th>
              <th className="text-left px-4 py-3 font-medium text-slate-700">Utilisateurs</th>
              <th className="text-left px-4 py-3 font-medium text-slate-700">Créé le</th>
              <th className="text-left px-4 py-3 font-medium text-slate-700">Actions</th>
            </tr>
          </thead>
          <tbody>
            {pageItems.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-slate-500">Aucun rôle ne correspond aux filtres.</td></tr>
            )}
            {pageItems.map((role) => {
              const TypeIcon = role.type === 'SYSTEM' ? ShieldQuestion : ShieldCheck;
              return (
                <tr key={role.id} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center"><TypeIcon className="w-4 h-4" /></div>
                      <div>
                        <div className="font-medium text-slate-900">{role.displayName || role.name}</div>
                        <div className="text-slate-500">{role.name}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${role.type === 'SYSTEM' ? 'bg-purple-100 text-purple-700' : 'bg-green-100 text-green-700'}`}>
                      {role.type === 'SYSTEM' ? 'Système' : 'Personnalisé'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {role.permissions.slice(0, 3).map((p) => <span key={p} className="inline-block bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-xs mr-1">{p}</span>)}
                    {role.permissions.length > 3 && <span className="text-slate-500 text-xs">+{role.permissions.length - 3}</span>}
                  </td>
                  <td className="px-4 py-3 text-slate-600">{role.userCount ?? 0}</td>
                  <td className="px-4 py-3 text-slate-500">{role.createdAt ? new Date(role.createdAt).toLocaleDateString('fr-FR') : '—'}</td>
                  <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                    <ActionMenu role={role} onEdit={(r) => { setFormRole(r); setFormOpen(true); }} onDelete={handleDelete} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between mt-4 px-4 py-3 text-sm text-slate-600">
        <span>Affichage 1 à {pageItems.length} sur {filtered.length} rôle(s)</span>
        <div className="flex items-center gap-2">
          <button type="button" className="px-2 py-1 text-slate-500 hover:bg-slate-100 rounded disabled:opacity-50" disabled={safePage === 1} onClick={() => setPage(safePage - 1)}><ChevronLeft className="w-4 h-4" /></button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <button key={p} type="button" className={`px-3 py-1 rounded-lg text-sm font-medium ${p === safePage ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-100'}`} onClick={() => setPage(p)}>{p}</button>
          ))}
          <button type="button" className="px-2 py-1 text-slate-500 hover:bg-slate-100 rounded disabled:opacity-50" disabled={safePage === totalPages} onClick={() => setPage(safePage + 1)}><ChevronRight className="w-4 h-4" /></button>
        </div>
      </div>

      <RoleForm
        open={formOpen}
        role={formRole}
        title={formRole ? 'Modifier le rôle' : 'Nouveau rôle'}
        onClose={() => { setFormOpen(false); setFormRole(null); }}
        onSubmit={handleCreate}
      />

      <ConfirmModal
        open={confirmOpen}
        title="Supprimer le rôle"
        message={confirmAction ? `Êtes-vous sûr de vouloir supprimer le rôle "${confirmAction.displayName || confirmAction.name}" ?` : ''}
        confirmLabel="Supprimer"
        danger
        onCancel={() => { setConfirmOpen(false); setConfirmAction(null); }}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}
