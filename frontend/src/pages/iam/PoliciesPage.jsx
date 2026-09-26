import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Search,
  RefreshCw,
  Shield,
  FileText,
  Edit2,
  Trash2,
  MoreVertical,
  BarChart3,
  Eye,
  Pause,
  Power,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { iamAdminService } from '../../services/apiClient.js';
import { iamPoliciesMock } from './mockData.js';
import { ModernSpinner } from '../../components/Loaders.jsx';
import ConfirmModal from '../../components/ui/ConfirmModal.jsx';
import { useToast } from '../../hooks/useToast.js';

const POLICY_TYPE_OPTIONS = ['Tous', 'PASSWORD', 'MFA', 'SESSION', 'IP_WHITELIST', 'RATE_LIMIT', 'CUSTOM'];

function PolicyForm({ open, policy, onClose, onSubmit, title }) {
  const [form, setForm] = useState({
    name: '',
    code: '',
    description: '',
    type: 'CUSTOM',
    rules: [],
    tenantIds: [],
  });
  const [rawRules, setRawRules] = useState('');

  useEffect(() => {
    if (open && policy) {
      setForm({
        name: policy.name || '',
        code: policy.code || '',
        description: policy.description || '',
        type: policy.type || 'CUSTOM',
        rules: policy.rules || [],
        tenantIds: policy.tenantIds || [],
      });
      setRawRules(JSON.stringify(policy.rules || [], null, 2));
    } else if (open && !policy) {
      setForm({ name: '', code: '', description: '', type: 'CUSTOM', rules: [], tenantIds: [] });
      setRawRules(JSON.stringify([], null, 2));
    }
  }, [open, policy]);

  if (!open) return null;

  const update = (field, value) => setForm((f) => ({ ...f, [field]: value }));

  const handleRulesChange = () => {
    try {
      const parsed = JSON.parse(rawRules);
      if (Array.isArray(parsed)) {
        update('rules', parsed);
      }
    } catch {
      // ignore parse error
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.code.trim()) return;
    handleRulesChange();
    onSubmit(form);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-xl w-full max-w-3xl mx-4" onClick={(e) => e.stopPropagation()}>
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
              <label className="block text-xs font-medium text-slate-600 mb-1">Code *</label>
              <input type="text" required value={form.code} onChange={(e) => update('code', e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Description</label>
            <textarea value={form.description} onChange={(e) => update('description', e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm h-16" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Type</label>
            <select value={form.type} onChange={(e) => update('type', e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white">
              {POLICY_TYPE_OPTIONS.slice(1).map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Règles (JSON)</label>
            <textarea value={rawRules} onChange={(e) => setRawRules(e.target.value)} onBlur={handleRulesChange} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono h-24" />
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

function ActionMenu({ policy, onEdit, onDelete }) {
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
          <button type="button" className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-100" onClick={() => { setOpen(false); onEdit(policy); }}><Edit2 className="w-4 h-4" />Modifier</button>
          {!policy.isBuiltIn && (
            <button type="button" className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50" onClick={() => { setOpen(false); onDelete(policy); }}><Trash2 className="w-4 h-4" />Supprimer</button>
          )}
        </div>
      )}
    </div>
  );
}

export default function PoliciesPage() {
  const { toast } = useToast();
  const [policies, setPolicies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('Tous');
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const [formOpen, setFormOpen] = useState(false);
  const [formPolicy, setFormPolicy] = useState(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);

  const loadPolicies = useCallback(async () => {
    setLoading(true);
    try {
      const response = await iamAdminService.policies();
      const data = response.data;
      setPolicies(Array.isArray(data) ? data : (data?.policies ?? data?.data ?? []));
    } catch {
      {
        toast.error('Erreur lors du chargement des politiques.');
        setPolicies([]);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPolicies();
  }, [loadPolicies]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return policies.filter((policy) => {
      const matches = !q ||
        (policy.name || '').toLowerCase().includes(q) ||
        (policy.code || '').toLowerCase().includes(q) ||
        (policy.description || '').toLowerCase().includes(q);
      const typeMatch = typeFilter === 'Tous' || policy.type === typeFilter;
      return matches && typeMatch;
    });
  }, [policies, search, typeFilter]);

  useEffect(() => {
    setPage(1);
  }, [search, typeFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const pageItems = filtered.slice((safePage - 1) * pageSize, safePage * pageSize);

  const typeStats = useMemo(() => {
    return POLICY_TYPE_OPTIONS.slice(1).map((t) => ({
      type: t,
      value: policies.filter((p) => p.type === t).length,
      color: t === 'MFA' ? '#10b981' : t === 'PASSWORD' ? '#f59e0b' : t === 'SESSION' ? '#7c3aed' : t === 'IP_WHITELIST' ? '#2563eb' : t === 'RATE_LIMIT' ? '#ec4899' : '#6b7280',
    }));
  }, [policies]);

  const handleCreate = async (form) => {
    try {
      if (formPolicy) {
        await iamAdminService.updatePolicy(formPolicy.id, form);
      } else {
        await iamAdminService.createPolicy(form);
      }
      toast.success(formPolicy ? 'Politique mise à jour.' : 'Politique créée avec succès.');
      setFormOpen(false);
      setFormPolicy(null);
      loadPolicies();
    } catch {
      {
        toast.error('Erreur lors de l\'opération sur la politique.');
      }
      toast.success(formPolicy ? 'Politique mise à jour.' : 'Politique créée avec succès.');
      setFormOpen(false);
      setFormPolicy(null);
    }
  };

  const handleDelete = (policy) => {
    setConfirmAction(policy);
    setConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!confirmAction) return;
    try {
      await iamAdminService.deletePolicy(confirmAction.id);
      setPolicies(policies.filter((p) => p.id !== confirmAction.id));
      toast.success('Politique supprimée.');
    } catch {
      {
        toast.error('Erreur lors de la suppression de la politique.');
      }
    }
    setConfirmOpen(false);
    setConfirmAction(null);
  };

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
        <span className="text-slate-900 font-medium">Politiques de sécurité</span>
      </nav>

      <div className="mb-6">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-slate-900">Politiques de sécurité</h1>
          <button onClick={loadPolicies} title="Actualiser" className="p-1.5 text-slate-500 hover:text-slate-700 rounded-lg hover:bg-slate-100">
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
        <p className="text-sm text-slate-500 mt-1">Définissez les politiques de sécurité (mot de passe, MFA, sessions, IP, rate limit).</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-6">
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="flex items-start justify-between">
            <div className="space-y-1 flex-1">
              <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Politiques totales</span>
              <p className="text-3xl font-bold text-slate-900">{policies.length}</p>
            </div>
            <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-blue-100 text-blue-700"><Shield className="w-5 h-5" /></div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="flex items-start justify-between">
            <div className="space-y-1 flex-1">
              <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Politiques système</span>
              <p className="text-3xl font-bold text-slate-900">{typeStats.filter((t) => t.value).length}</p>
            </div>
            <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-purple-100 text-purple-700"><Shield className="w-5 h-5" /></div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="flex items-start justify-between">
            <div className="space-y-1 flex-1">
              <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Politiques personnalisées</span>
              <p className="text-3xl font-bold text-slate-900">{policies.filter((p) => !p.isBuiltIn).length}</p>
            </div>
            <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-green-100 text-green-700"><FileText className="w-5 h-5" /></div>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3 mb-5">
        <div className="relative flex-1 max-w-md">
          <input
            type="text"
            placeholder="Rechercher une politique..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-3 py-2 border border-slate-300 rounded-lg text-sm"
          />
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
        </div>
        <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white">
          {POLICY_TYPE_OPTIONS.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
        <button
          onClick={() => { setFormPolicy(null); setFormOpen(true); }}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
        >
          + Nouvelle politique
        </button>
      </div>

      <div className="overflow-x-auto rounded-lg border border-slate-200">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-slate-700">Politique</th>
              <th className="text-left px-4 py-3 font-medium text-slate-700">Type</th>
              <th className="text-left px-4 py-3 font-medium text-slate-700">Code</th>
              <th className="text-left px-4 py-3 font-medium text-slate-700">Règles</th>
              <th className="text-left px-4 py-3 font-medium text-slate-700">Utilisateurs</th>
              <th className="text-left px-4 py-3 font-medium text-slate-700">Créé le</th>
              <th className="text-left px-4 py-3 font-medium text-slate-700">Actions</th>
            </tr>
          </thead>
          <tbody>
            {pageItems.length === 0 && (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-slate-500">Aucune politique ne correspond aux filtres.</td></tr>
            )}
            {pageItems.map((policy) => (
              <tr key={policy.id} className="border-b border-slate-100 hover:bg-slate-50">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center"><FileText className="w-4 h-4" /></div>
                    <div>
                      <div className="font-medium text-slate-900">{policy.name}</div>
                      <div className="text-slate-500">{policy.description}</div>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${policy.isBuiltIn ? 'bg-purple-100 text-purple-700' : 'bg-green-100 text-green-700'}`}>
                    {policy.type}
                  </span>
                </td>
                <td className="px-4 py-3 text-slate-600 font-mono text-xs">{policy.code}</td>
                <td className="px-4 py-3 text-slate-600">{policy.rules.length} règle(s)</td>
                <td className="px-4 py-3 text-slate-600">{policy.userCount ?? 0}</td>
                <td className="px-4 py-3 text-slate-500">{policy.createdAt ? new Date(policy.createdAt).toLocaleDateString('fr-FR') : '—'}</td>
                <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                  <ActionMenu policy={policy} onEdit={(p) => { setFormPolicy(p); setFormOpen(true); }} onDelete={handleDelete} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between mt-4 px-4 py-3 text-sm text-slate-600">
        <span>Affichage 1 à {pageItems.length} sur {filtered.length} politique(s)</span>
        <div className="flex items-center gap-2">
          <button type="button" className="px-2 py-1 text-slate-500 hover:bg-slate-100 rounded disabled:opacity-50" disabled={safePage === 1} onClick={() => setPage(safePage - 1)}><ChevronLeft className="w-4 h-4" /></button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <button key={p} type="button" className={`px-3 py-1 rounded-lg text-sm font-medium ${p === safePage ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-100'}`} onClick={() => setPage(p)}>{p}</button>
          ))}
          <button type="button" className="px-2 py-1 text-slate-500 hover:bg-slate-100 rounded disabled:opacity-50" disabled={safePage === totalPages} onClick={() => setPage(safePage + 1)}><ChevronRight className="w-4 h-4" /></button>
        </div>
      </div>

      <PolicyForm
        open={formOpen}
        policy={formPolicy}
        title={formPolicy ? 'Modifier la politique' : 'Nouvelle politique'}
        onClose={() => { setFormOpen(false); setFormPolicy(null); }}
        onSubmit={handleCreate}
      />

      <ConfirmModal
        open={confirmOpen}
        title="Supprimer la politique"
        message={confirmAction ? `Êtes-vous sûr de vouloir supprimer la politique "${confirmAction.name}" ?` : ''}
        confirmLabel="Supprimer"
        danger
        onCancel={() => { setConfirmOpen(false); setConfirmAction(null); }}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}
