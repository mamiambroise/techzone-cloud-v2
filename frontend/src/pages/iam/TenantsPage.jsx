import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Search,
  RefreshCw,
  Building,
  Globe,
  Edit2,
  Trash2,
  MoreVertical,
  BarChart3,
  Users,
  Shield,
  FileText,
  Power,
  Pause,
  CheckCircle,
  Clock,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { iamAdminService } from '../../services/apiClient.js';
import { iamTenantsPageMock, iamTenantStatusConfig } from './mockData.js';
import { ModernSpinner } from '../../components/Loaders.jsx';
import ConfirmModal from '../../components/ui/ConfirmModal.jsx';
import { useToast } from '../../hooks/useToast.js';

function TenantForm({ open, tenant, onClose, onSubmit, title }) {
  const [form, setForm] = useState({ name: '', code: '', domain: '', status: 'ACTIVE', isDefault: false });

  useEffect(() => {
    if (open && tenant) {
      setForm({
        name: tenant.name || '',
        code: tenant.code || '',
        domain: tenant.domain || '',
        status: tenant.status || 'ACTIVE',
        isDefault: tenant.isDefault || false,
      });
    } else if (open && !tenant) {
      setForm({ name: '', code: '', domain: '', status: 'ACTIVE', isDefault: false });
    }
  }, [open, tenant]);

  if (!open) return null;

  const update = (field, value) => setForm((f) => ({ ...f, [field]: value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.code.trim()) return;
    onSubmit(form);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg mx-4" onClick={(e) => e.stopPropagation()}>
        <div className="p-5 border-b border-slate-200 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-xl">×</button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Nom *</label>
            <input type="text" required value={form.name} onChange={(e) => update('name', e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Code *</label>
            <input type="text" required value={form.code} onChange={(e) => update('code', e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Domaine</label>
            <input type="text" value={form.domain} onChange={(e) => update('domain', e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Statut</label>
            <select value={form.status} onChange={(e) => update('status', e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white">
              {Object.entries(iamTenantStatusConfig).map(([key, cfg]) => <option key={key} value={key}>{cfg.label}</option>)}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" id="isDefault" checked={form.isDefault} onChange={(e) => update('isDefault', e.target.checked)} className="rounded border-slate-300" />
            <label htmlFor="isDefault" className="text-xs text-slate-600">Tenant par défaut</label>
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

function ActionMenu({ tenant, onEdit, onDelete }) {
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
          <button type="button" className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-100" onClick={() => { setOpen(false); onEdit(tenant); }}><Edit2 className="w-4 h-4" />Modifier</button>
          {!tenant.isDefault && (
            <button type="button" className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50" onClick={() => { setOpen(false); onDelete(tenant); }}><Trash2 className="w-4 h-4" />Supprimer</button>
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

export default function TenantsPage() {
  const { toast } = useToast();
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('Tous');
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const [formOpen, setFormOpen] = useState(false);
  const [formTenant, setFormTenant] = useState(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);

  const loadTenants = useCallback(async () => {
    setLoading(true);
    try {
      const response = await iamAdminService.tenants();
      const data = response.data;
      setTenants(Array.isArray(data) ? data : (data?.tenants ?? data?.data ?? []));
    } catch {
      {
        toast.error('Erreur lors du chargement des tenants.');
        setTenants([]);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTenants();
  }, [loadTenants]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    const statusMap = { Tous: null, Actif: 'ACTIVE', Suspendu: 'SUSPENDED', 'En attente': 'PENDING' };
    return tenants.filter((tenant) => {
      const matches = !q ||
        (tenant.name || '').toLowerCase().includes(q) ||
        (tenant.code || '').toLowerCase().includes(q) ||
        (tenant.domain || '').toLowerCase().includes(q);
      const statusMatch = statusFilter === 'Tous' || tenant.status === (statusMap[statusFilter] || statusFilter);
      return matches && statusMatch;
    });
  }, [tenants, search, statusFilter]);

  useEffect(() => {
    setPage(1);
  }, [search, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const pageItems = filtered.slice((safePage - 1) * pageSize, safePage * pageSize);

  const handleCreate = async (form) => {
    try {
      if (formTenant) {
        await iamAdminService.updateTenant(formTenant.id, form);
      } else {
        await iamAdminService.createTenant(form);
      }
      toast.success(formTenant ? 'Tenant mis à jour.' : 'Tenant créé avec succès.');
      setFormOpen(false);
      setFormTenant(null);
      loadTenants();
    } catch {
      {
        toast.error('Erreur lors de l\'opération sur le tenant.');
      }
      toast.success(formTenant ? 'Tenant mis à jour.' : 'Tenant créé avec succès.');
      setFormOpen(false);
      setFormTenant(null);
    }
  };

  const handleDelete = (tenant) => {
    setConfirmAction(tenant);
    setConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!confirmAction) return;
    try {
      await iamAdminService.deleteTenant(confirmAction.id);
      setTenants(tenants.filter((t) => t.id !== confirmAction.id));
      toast.success('Tenant supprimé.');
    } catch {
      {
        toast.error('Erreur lors de la suppression du tenant.');
      }
    }
    setConfirmOpen(false);
    setConfirmAction(null);
  };

  const activeCount = tenants.filter((t) => t.status === 'ACTIVE').length;
  const suspendedCount = tenants.filter((t) => t.status === 'SUSPENDED').length;
  const totalCount = tenants.length;
  const totalUsers = tenants.reduce((sum, t) => sum + (t.userCount || 0), 0);

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
        <span className="text-slate-900 font-medium">Tenants</span>
      </nav>

      <div className="mb-6">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-slate-900">Tenants</h1>
          <button onClick={loadTenants} title="Actualiser" className="p-1.5 text-slate-500 hover:text-slate-700 rounded-lg hover:bg-slate-100">
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
        <p className="text-sm text-slate-500 mt-1">Gérez les tenants, leurs statuts et leurs limites d'accès.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-5 mb-6">
        <StatCard icon={Building} label="Tenants totaux" value={totalCount} color="#2563eb" />
        <StatCard icon={CheckCircle} label="Actifs" value={activeCount} color="#10b981" />
        <StatCard icon={Clock} label="En attente" value={tenants.filter((t) => t.status === 'PENDING').length} color="#3b82f6" />
        <StatCard icon={Users} label="Utilisateurs total" value={totalUsers} color="#7c3aed" />
      </div>

      <div className="flex items-center gap-3 mb-5">
        <div className="relative flex-1 max-w-md">
          <input
            type="text"
            placeholder="Rechercher un tenant..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-3 py-2 border border-slate-300 rounded-lg text-sm"
          />
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white">
          <option>Tous</option>
          <option>Actif</option>
          <option>Suspendu</option>
          <option>En attente</option>
        </select>
        <button
          onClick={() => { setFormTenant(null); setFormOpen(true); }}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
        >
          + Nouveau tenant
        </button>
      </div>

      <div className="overflow-x-auto rounded-lg border border-slate-200">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-slate-700">Tenant</th>
              <th className="text-left px-4 py-3 font-medium text-slate-700">Code</th>
              <th className="text-left px-4 py-3 font-medium text-slate-700">Domaine</th>
              <th className="text-left px-4 py-3 font-medium text-slate-700">Statut</th>
              <th className="text-left px-4 py-3 font-medium text-slate-700">Défaut</th>
              <th className="text-left px-4 py-3 font-medium text-slate-700">Utilisateurs</th>
              <th className="text-left px-4 py-3 font-medium text-slate-700">Rôles</th>
              <th className="text-left px-4 py-3 font-medium text-slate-700">Politiques</th>
              <th className="text-left px-4 py-3 font-medium text-slate-700">Créé le</th>
              <th className="text-left px-4 py-3 font-medium text-slate-700">Actions</th>
            </tr>
          </thead>
          <tbody>
            {pageItems.length === 0 && (
              <tr><td colSpan={10} className="px-4 py-8 text-center text-slate-500">Aucun tenant ne correspond aux filtres.</td></tr>
            )}
            {pageItems.map((tenant) => {
              const colors = iamTenantStatusConfig[tenant.status] || iamTenantStatusConfig.ACTIVE;
              return (
                <tr key={tenant.id} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center"><Building className="w-4 h-4" /></div>
                      <div>
                        <div className="font-medium text-slate-900">{tenant.name}</div>
                        {tenant.isDefault && <span className="text-xs text-blue-600">Par défaut</span>}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-600 font-mono text-xs">{tenant.code}</td>
                  <td className="px-4 py-3 text-slate-600 font-mono text-xs">{tenant.domain}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${colors.bg} ${colors.text}`}>
                      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: colors.color }} />
                      {colors.label}
                    </span>
                  </td>
                  <td className="px-4 py-3">{tenant.isDefault ? '✓ Oui' : '—'}</td>
                  <td className="px-4 py-3 text-slate-600">{tenant.userCount ?? 0}</td>
                  <td className="px-4 py-3 text-slate-600">{tenant.roleCount ?? 0}</td>
                  <td className="px-4 py-3 text-slate-600">{tenant.policyCount ?? 0}</td>
                  <td className="px-4 py-3 text-slate-500">{tenant.createdAt ? new Date(tenant.createdAt).toLocaleDateString('fr-FR') : '—'}</td>
                  <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                    <ActionMenu tenant={tenant} onEdit={(t) => { setFormTenant(t); setFormOpen(true); }} onDelete={handleDelete} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between mt-4 px-4 py-3 text-sm text-slate-600">
        <span>Affichage 1 à {pageItems.length} sur {filtered.length} tenant(s)</span>
        <div className="flex items-center gap-2">
          <button type="button" className="px-2 py-1 text-slate-500 hover:bg-slate-100 rounded disabled:opacity-50" disabled={safePage === 1} onClick={() => setPage(safePage - 1)}><ChevronLeft className="w-4 h-4" /></button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <button key={p} type="button" className={`px-3 py-1 rounded-lg text-sm font-medium ${p === safePage ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-100'}`} onClick={() => setPage(p)}>{p}</button>
          ))}
          <button type="button" className="px-2 py-1 text-slate-500 hover:bg-slate-100 rounded disabled:opacity-50" disabled={safePage === totalPages} onClick={() => setPage(safePage + 1)}><ChevronRight className="w-4 h-4" /></button>
        </div>
        <select value={pageSize} onChange={() => {}} className="px-2 py-1 border border-slate-300 rounded-lg text-sm bg-white">
          <option value="10">10 / page</option>
          <option value="25">25 / page</option>
          <option value="50">50 / page</option>
        </select>
      </div>

      <TenantForm
        open={formOpen}
        tenant={formTenant}
        title={formTenant ? 'Modifier le tenant' : 'Nouveau tenant'}
        onClose={() => { setFormOpen(false); setFormTenant(null); }}
        onSubmit={handleCreate}
      />

      <ConfirmModal
        open={confirmOpen}
        title="Supprimer le tenant"
        message={confirmAction ? `Êtes-vous sûr de vouloir supprimer le tenant "${confirmAction.name}" ?` : ''}
        confirmLabel="Supprimer"
        danger
        onCancel={() => { setConfirmOpen(false); setConfirmAction(null); }}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}
