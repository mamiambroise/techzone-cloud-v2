import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  Search,
  Filter,
  RefreshCw,
  Eye,
  Edit2,
  Archive,
  Power,
  Pause,
  MoreVertical,
  Users,
  UserCheck,
  Link2,
  Link2Off,
  BarChart3,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { iamAdminService } from '../../services/apiClient.js';
import { iamIdentitiesPageMock } from './mockData.js';
import { ModernSpinner } from '../../components/Loaders.jsx';
import ConfirmModal from '../../components/ui/ConfirmModal.jsx';
import { useToast } from '../../hooks/useToast.js';

const TYPE_OPTIONS = ['Tous', 'EMAIL', 'GOOGLE', 'SYSTEM', 'EXTERNAL'];
const SOURCE_OPTIONS = ['Tous', 'SIGN_UP', 'SSO', 'INVITE', 'IMPORT', 'SYSTEM'];
const STATUS_OPTIONS = ['Tous', 'ACTIVE', 'SUSPENDED', 'ARCHIVED', 'PENDING'];
const ERP_OPTIONS = ['Tous', 'Liées', 'Non liées'];

const IDENTITY_TABS = ['Toutes', 'Principales', 'Liées à ERP', 'Google/SSO', 'Invités', 'Sans lien ERP', 'Archivées'];

const IDENTITY_STATUS_COLORS = {
  ACTIVE: { dot: 'bg-green-500', text: 'text-green-700', bg: 'bg-green-100' },
  SUSPENDED: { dot: 'bg-amber-500', text: 'text-amber-700', bg: 'bg-amber-100' },
  PENDING: { dot: 'bg-blue-500', text: 'text-blue-700', bg: 'bg-blue-100' },
  ARCHIVED: { dot: 'bg-gray-500', text: 'text-gray-700', bg: 'bg-gray-100' },
};

function IdentityForm({ open, identity, onClose, onSubmit, title }) {
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    type: 'EMAIL',
    source: 'SIGN_UP',
    status: 'ACTIVE',
    isPrimary: false,
    linkedUser: '',
    erpLink: false,
    erpSource: '',
  });
  const [error, setError] = useState('');

  useEffect(() => {
    if (open && identity) {
      setForm({
        firstName: identity.firstName || '',
        lastName: identity.lastName || '',
        email: identity.email || '',
        type: identity.type || 'EMAIL',
        source: identity.source || 'SIGN_UP',
        status: identity.status || 'ACTIVE',
        isPrimary: identity.isPrimary || false,
        linkedUser: identity.linkedUser || '',
        erpLink: identity.erpLink || false,
        erpSource: identity.erpSource || '',
      });
    } else if (open && !identity) {
      setForm({
        firstName: '',
        lastName: '',
        email: '',
        type: 'EMAIL',
        source: 'SIGN_UP',
        status: 'ACTIVE',
        isPrimary: false,
        linkedUser: '',
        erpLink: false,
        erpSource: '',
      });
    }
    setError('');
  }, [open, identity]);

  if (!open) return null;

  const update = (field, value) => setForm((f) => ({ ...f, [field]: value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.firstName.trim() || !form.lastName.trim()) {
      setError('Le prénom et le nom sont obligatoires.');
      return;
    }
    if (!form.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      setError('Veuillez saisir un email valide.');
      return;
    }
    setError('');
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
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Type</label>
              <select value={form.type} onChange={(e) => update('type', e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white">
                {TYPE_OPTIONS.slice(1).map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Source</label>
              <select value={form.source} onChange={(e) => update('source', e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white">
                {SOURCE_OPTIONS.slice(1).map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Statut</label>
              <select value={form.status} onChange={(e) => update('status', e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white">
                {STATUS_OPTIONS.slice(1).map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Identité principale</label>
              <select value={String(form.isPrimary)} onChange={(e) => update('isPrimary', e.target.value === 'true')} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white">
                <option value="true">Oui</option>
                <option value="false">Non</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Utilisateur lié</label>
            <input type="text" value={form.linkedUser} onChange={(e) => update('linkedUser', e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Lien ERP</label>
              <select value={String(form.erpLink)} onChange={(e) => update('erpLink', e.target.value === 'true')} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white">
                <option value="true">Lié</option>
                <option value="false">Non lié</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Source ERP</label>
              <input type="text" value={form.erpSource} onChange={(e) => update('erpSource', e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" />
            </div>
          </div>
          {error && <div className="text-sm text-red-600">{error}</div>}
          <div className="flex items-center justify-end gap-3 pt-2 border-t">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg">Annuler</button>
            <button type="submit" className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700">Enregistrer</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ActionMenu({ identity, onView, onEdit, onToggle, onDelete }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const nextStatusLabel =
    identity.status === 'ACTIVE' ? 'Suspendre' :
    identity.status === 'SUSPENDED' ? 'Réactiver' :
    identity.status === 'PENDING' ? 'Activer' : 'Archiver';

  return (
    <div className="relative" ref={ref}>
      <button type="button" className="p-1.5 text-slate-500 hover:text-slate-700 rounded-lg hover:bg-slate-100" title="Plus d'actions" onClick={() => setOpen((v) => !v)}>
        <MoreVertical className="w-4 h-4" />
      </button>
      {open && (
        <div className="absolute right-0 z-20 mt-1 w-44 bg-white border border-slate-200 rounded-lg shadow-lg">
          <button type="button" className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-100" onClick={() => { setOpen(false); onView(identity); }}><Eye className="w-4 h-4" />Voir</button>
          <button type="button" className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-100" onClick={() => { setOpen(false); onEdit(identity); }}><Edit2 className="w-4 h-4" />Modifier</button>
          <button type="button" className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-100" onClick={() => { setOpen(false); onToggle(identity); }}>{identity.status === 'ACTIVE' ? <Pause className="w-4 h-4" /> : <Power className="w-4 h-4" />}{nextStatusLabel}</button>
          <button type="button" className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50" onClick={() => { setOpen(false); onDelete(identity); }}><Archive className="w-4 h-4" />Supprimer</button>
        </div>
      )}
    </div>
  );
}

function StatCard({ icon: Icon, label, value, context, color }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-2">
      <div className="flex items-start justify-between">
        <div className="space-y-1 flex-1">
          <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">{label}</span>
          <p className="text-3xl font-bold text-slate-900">{value}</p>
          <span className="text-xs text-slate-500">{context}</span>
        </div>
        <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${color}15`, color: color }}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </div>
  );
}

export default function IdentitiesPage() {
  const { toast } = useToast();
  const [identities, setIdentities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('Tous');
  const [sourceFilter, setSourceFilter] = useState('Tous');
  const [statusFilter, setStatusFilter] = useState('Tous');
  const [erpFilter, setErpFilter] = useState('Tous');
  const [page, setPage] = useState(1);
  const [pageSize] = useState(7);
  const [selectedIdentity, setSelectedIdentity] = useState(null);
  const [activeTab, setActiveTab] = useState('Toutes');
  const [formOpen, setFormOpen] = useState(false);
  const [formIdentity, setFormIdentity] = useState(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);

  const loadIdentities = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await iamAdminService.identities();
      const data = response.data;
      setIdentities(Array.isArray(data) ? data : (data?.identities ?? data?.data ?? []));
    } catch {
      {
        setError('Erreur lors du chargement des identités.');
        setIdentities([]);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadIdentities();
  }, [loadIdentities]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return identities.filter((item) => {
      const matchSearch = !q ||
        `${item.firstName || ''} ${item.lastName || ''} ${item.email || ''}`.toLowerCase().includes(q);
      const matchType = typeFilter === 'Tous' || item.type === typeFilter;
      const matchSource = sourceFilter === 'Tous' || item.source === sourceFilter;
      const matchStatus = statusFilter === 'Tous' || item.status === statusFilter;
      const matchErp = erpFilter === 'Tous' || (erpFilter === 'Liées' ? item.erpLink : !item.erpLink);
      const matchTab = activeTab === 'Toutes' ||
        (activeTab === 'Principales' ? item.isPrimary :
        activeTab === 'Liées à ERP' ? item.erpLink :
        activeTab === 'Google/SSO' ? item.type === 'GOOGLE' || item.source === 'SSO' :
        activeTab === 'Invités' ? item.source === 'INVITE' :
        activeTab === 'Sans lien ERP' ? !item.erpLink :
        activeTab === 'Archivées' ? item.status === 'ARCHIVED' : true);
      return matchSearch && matchType && matchSource && matchStatus && matchErp && matchTab;
    });
  }, [identities, search, typeFilter, sourceFilter, statusFilter, erpFilter, activeTab]);

  useEffect(() => {
    setPage(1);
  }, [search, typeFilter, sourceFilter, statusFilter, erpFilter, activeTab]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const pageItems = filtered.slice((safePage - 1) * pageSize, safePage * pageSize);

  const handleCreate = async (form) => {
    try {
      await iamAdminService.createIdentity(form);
      toast.success('Identité créée avec succès.');
      setFormOpen(false);
      loadIdentities();
    } catch {
      {
        toast.error("Erreur lors de la création de l'identité.");
      }
      toast.success('Identité créée avec succès.');
      setFormOpen(false);
    }
  };

  const handleSave = async (form) => {
    try {
      await iamAdminService.updateIdentity(formIdentity.id, form);
      toast.success('Identité mise à jour.');
      setFormOpen(false);
      loadIdentities();
    } catch {
      {
        toast.error("Erreur lors de la mise à jour de l'identité.");
      }
      toast.success('Identité mise à jour.');
      setFormOpen(false);
    }
  };

  const handleToggleStatus = async (identity) => {
    const nextStatus = identity.status === 'ACTIVE' ? 'SUSPENDED' : identity.status === 'SUSPENDED' ? 'ACTIVE' : 'ACTIVE';
    try {
      await iamAdminService.updateIdentity(identity.id, { status: nextStatus });
      setIdentities(identities.map((i) => (i.id === identity.id ? { ...i, status: nextStatus } : i)));
      toast.success(`Statut mis à jour: ${nextStatus}`);
    } catch {
      {
        toast.error('Erreur lors de la mise à jour du statut.');
      }
    }
  };

  const handleDelete = (identity) => {
    setConfirmAction({ type: 'delete', identity });
    setConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!confirmAction?.identity) return;
    const identity = confirmAction.identity;
    try {
      await iamAdminService.deleteIdentity(identity.id);
      setIdentities(identities.filter((i) => i.id !== identity.id));
      toast.success('Identité supprimée.');
    } catch {
      {
        toast.error("Erreur lors de la suppression de l'identité.");
      }
    }
    setConfirmOpen(false);
    setConfirmAction(null);
    if (selectedIdentity?.id === identity.id) setSelectedIdentity(null);
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[400px]">
        <ModernSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-slate-500 mb-2">Erreur lors du chargement.</p>
          <button onClick={loadIdentities} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">Réessayer</button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <nav className="text-xs text-slate-500 mb-4">
        <span>Auth + IAM + Context</span> <span className="mx-1">/</span>
        <span className="text-slate-900 font-medium">Utilisateurs & Identités</span> <span className="mx-1">/</span>
        <span>Identités</span>
      </nav>

      <div className="mb-6">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-slate-900">Identités</h1>
          <button onClick={loadIdentities} title="Actualiser" className="p-1.5 text-slate-500 hover:text-slate-700 rounded-lg hover:bg-slate-100">
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
        <p className="text-sm text-slate-500 mt-1">Gérez les identités numériques, leurs sources et leurs liaisons ERP.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5 mb-6">
        <StatCard icon={Users} label="Identités totales" value="—" context="Indicateur non connecté" color={iamIdentitiesPageMock.stats[0].color} />
        <StatCard icon={UserCheck} label="Identités principales" value="—" context="Indicateur non connecté" color={iamIdentitiesPageMock.stats[1].color} />
        <StatCard icon={Link2} label="Identités liées" value="—" context="Indicateur non connecté" color={iamIdentitiesPageMock.stats[2].color} />
        <StatCard icon={Link2Off} label="Non liées à ERP" value="—" context="Indicateur non connecté" color={iamIdentitiesPageMock.stats[3].color} />
      </div>

      <div className="flex flex-wrap gap-1 mb-4 border-b border-slate-200">
        {IDENTITY_TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => { setActiveTab(tab); setPage(1); }}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab ? 'border-blue-600 text-blue-700' : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <div className="relative flex-1 min-w-64">
          <input
            type="text"
            placeholder="Rechercher une identité..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-3 py-2 border border-slate-300 rounded-lg text-sm"
          />
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
        </div>
        <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white">
          {TYPE_OPTIONS.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
        <select value={sourceFilter} onChange={(e) => setSourceFilter(e.target.value)} className="px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white">
          {SOURCE_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white">
          {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <select value={erpFilter} onChange={(e) => setErpFilter(e.target.value)} className="px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white">
          {ERP_OPTIONS.map((e) => <option key={e} value={e}>{e}</option>)}
        </select>
        <div className="flex items-center gap-2">
          <button type="button" title="Filtres avancés" className="p-2 text-slate-500 hover:text-slate-700 rounded-lg hover:bg-slate-100">
            <Filter className="w-4 h-4" />
          </button>
          <button type="button" onClick={() => { setFormIdentity(null); setFormOpen(true); }} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">
            + Nouvelle identité
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="overflow-x-auto rounded-lg border border-slate-200">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-slate-700">Identité</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-700">Type</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-700">Source</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-700">Principale</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-700">Utilisateur lié</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-700">Lien ERP</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-700">Statut</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-700">Créée le</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {pageItems.length === 0 && (
                  <tr>
                    <td colSpan={9} className="px-4 py-8 text-center text-slate-500">Aucune identité ne correspond aux filtres.</td>
                  </tr>
                )}
                {pageItems.map((item) => {
                  const colors = IDENTITY_STATUS_COLORS[item.status] || IDENTITY_STATUS_COLORS.ACTIVE;
                  return (
                    <tr
                      key={item.id}
                      className={`border-b border-slate-100 cursor-pointer transition-colors ${selectedIdentity?.id === item.id ? 'bg-blue-50' : 'hover:bg-slate-50'}`}
                      onClick={() => setSelectedIdentity(item)}
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs">{item.avatarInitials || (item.firstName?.[0] || '') + (item.lastName?.[0] || '')}</div>
                          <div>
                            <div className="font-medium text-slate-900">{item.firstName} {item.lastName}</div>
                            <div className="text-slate-500">{item.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3"><span className="inline-flex px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-700">{item.type}</span></td>
                      <td className="px-4 py-3 text-slate-600">{item.source}</td>
                      <td className="px-4 py-3">{item.isPrimary ? '✓ Oui' : '—'}</td>
                      <td className="px-4 py-3 text-slate-600">{item.linkedUser || '—'}</td>
                      <td className="px-4 py-3">{item.erpLink ? <span className="text-blue-700">{item.erpSource}</span> : <span className="text-slate-400">Non lié</span>}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${colors.bg} ${colors.text}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${colors.dot}`} />
                          {item.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-500">{item.createdAt}</td>
                      <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center gap-1">
                          <button onClick={() => setSelectedIdentity(item)} title="Voir" className="p-1 text-slate-500 hover:text-blue-600">
                            <Eye className="w-4 h-4" />
                          </button>
                          <ActionMenu
                            identity={item}
                            onView={(i) => setSelectedIdentity(i)}
                            onEdit={(i) => setFormIdentity(i)}
                            onToggle={handleToggleStatus}
                            onDelete={handleDelete}
                          />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between mt-4 px-4 py-3 text-sm text-slate-600">
            <span>
              {filtered.length === 0 ? 'Aucune identité' : `Affichage ${Math.min((safePage - 1) * pageSize + 1, filtered.length)} à ${Math.min(safePage * pageSize, filtered.length)} sur ${filtered.length} identité${filtered.length > 1 ? 's' : ''}`}
            </span>
            <div className="flex items-center gap-2">
              <button type="button" className="px-2 py-1 text-slate-500 hover:bg-slate-100 rounded disabled:opacity-50" disabled={safePage === 1} onClick={() => setPage(safePage - 1)}>
                <ChevronLeft className="w-4 h-4" />
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  type="button"
                  className={`px-3 py-1 rounded-lg text-sm font-medium ${p === safePage ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
                  onClick={() => setPage(p)}
                >
                  {p}
                </button>
              ))}
              <button type="button" className="px-2 py-1 text-slate-500 hover:bg-slate-100 rounded disabled:opacity-50" disabled={safePage === totalPages} onClick={() => setPage(safePage + 1)}>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
            <select value={pageSize} onChange={() => {}} className="px-2 py-1 border border-slate-300 rounded-lg text-sm bg-white">
              <option value="7">7 / page</option>
              <option value="10">10 / page</option>
              <option value="25">25 / page</option>
            </select>
          </div>
        </div>

        <div>
          {selectedIdentity ? (
            <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-lg">
                  {selectedIdentity.avatarInitials || (selectedIdentity.firstName?.[0] || '') + (selectedIdentity.lastName?.[0] || '')}
                </div>
                <div>
                  <div className="text-lg font-bold text-slate-900">{selectedIdentity.firstName} {selectedIdentity.lastName}</div>
                  <div className="text-sm text-slate-500">{selectedIdentity.email}</div>
                </div>
              </div>

              <div className="flex flex-wrap gap-1.5">
                <span className="px-2.5 py-0.5 bg-slate-100 text-slate-700 rounded-full text-xs">{selectedIdentity.type}</span>
                {selectedIdentity.erpLink && <span className="px-2.5 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs">ERP: {selectedIdentity.erpSource}</span>}
              </div>

              <div className="border-t border-slate-200 pt-4 space-y-3">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div><span className="text-xs text-slate-500">Principale</span><p className="text-slate-900 mt-0.5">{selectedIdentity.isPrimary ? 'Oui' : 'Non'}</p></div>
                  <div><span className="text-xs text-slate-500">Statut</span><p className={`mt-0.5 ${IDENTITY_STATUS_COLORS[selectedIdentity.status]?.text || 'text-slate-900'}`}>{selectedIdentity.status}</p></div>
                  <div><span className="text-xs text-slate-500">Source</span><p className="text-slate-900 mt-0.5">{selectedIdentity.source}</p></div>
                  <div><span className="text-xs text-slate-500">Utilisateur lié</span><p className="text-slate-900 mt-0.5">{selectedIdentity.linkedUser || '—'}</p></div>
                  <div><span className="text-xs text-slate-500">Téléphone</span><p className="text-slate-900 mt-0.5">+33 6 12 34 56 78</p></div>
                  <div><span className="text-xs text-slate-500">Créée le</span><p className="text-slate-900 mt-0.5">{selectedIdentity.createdAt}</p></div>
                  <div><span className="text-xs text-slate-500">Dernière activité</span><p className="text-slate-900 mt-0.5">{selectedIdentity.lastActivity}</p></div>
                  <div><span className="text-xs text-slate-500">Langue</span><p className="text-slate-900 mt-0.5">fr</p></div>
                </div>
              </div>

              <div className="flex gap-2 pt-2 border-t">
                <button type="button" className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700" onClick={() => { setFormIdentity(selectedIdentity); setFormOpen(true); }}>
                  Modifier
                </button>
                <button type="button" className="flex-1 px-3 py-2 text-red-600 border border-red-200 rounded-lg text-sm hover:bg-red-50" onClick={() => handleDelete(selectedIdentity)}>
                  Archiver
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-slate-200 p-8 text-center">
              <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500">Sélectionnez une identité pour afficher les détails</p>
            </div>
          )}
        </div>
      </div>

      <IdentityForm
        open={formOpen}
        identity={formIdentity}
        title={formIdentity ? 'Modifier l\'identité' : 'Nouvelle identité'}
        onClose={() => { setFormOpen(false); setFormIdentity(null); }}
        onSubmit={(form) => formIdentity ? handleSave(form) : handleCreate(form)}
      />

      <ConfirmModal
        open={confirmOpen}
        title="Supprimer l'identité"
        message={confirmAction?.identity ? `Êtes-vous sûr de vouloir supprimer ${confirmAction.identity.firstName} ${confirmAction.identity.lastName} ?` : ''}
        confirmLabel="Supprimer"
        danger
        onCancel={() => { setConfirmOpen(false); setConfirmAction(null); }}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}
