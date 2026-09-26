import { useState, useMemo, useEffect, useRef } from 'react';
import * as tenantsService from '../../services/tenantsMockService';
import { organisations as initialOrgs } from '../../data/mock';
import './TenantsPage.css';

const STATUS_OPTIONS = ['ACTIVE', 'SUSPENDED', 'ARCHIVED'];
const PLAN_OPTIONS = ['Standard', 'Premium', 'Enterprise'];
const REGION_OPTIONS = ['EU-West', 'EU-Central', 'NA-East', 'APAC'];

function emptyForm() {
  return {
    name: '',
    organisationId: '',
    ownerId: '',
    ownerName: '',
    plan: 'Standard',
    region: 'EU-West',
  };
}

function NewTenantModal({ open, onClose, onCreate }) {
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState('');
  const firstFieldRef = useRef(null);

  useEffect(() => {
    if (open) {
      setForm(emptyForm());
      setError('');
      setTimeout(() => firstFieldRef.current?.focus(), 0);
    }
  }, [open]);

  if (!open) return null;

  const update = (field, value) => setForm((f) => ({ ...f, [field]: value }));

  const submit = (e) => {
    e.preventDefault();
    if (!form.name.trim()) {
      setError('Le nom du tenant est obligatoire.');
      return;
    }
    if (!form.organisationId) {
      setError('L\'organisation est obligatoire.');
      return;
    }
    onCreate(form);
  };

  return (
    <div className="tenant-modal-backdrop" onClick={onClose}>
      <div className="tenant-modal" onClick={(e) => e.stopPropagation()}>
        <div className="tenant-modal-header">
          <h2 className="tenant-modal-title">Nouveau tenant</h2>
          <button type="button" className="tenant-modal-close" onClick={onClose} aria-label="Fermer">×</button>
        </div>
        <form className="tenant-modal-form" onSubmit={submit}>
          <div className="tenant-modal-row">
            <label className="tenant-modal-field">
              <span>Nom *</span>
              <input ref={firstFieldRef} type="text" value={form.name} onChange={(e) => update('name', e.target.value)} />
            </label>
            <label className="tenant-modal-field">
              <span>Organisation *</span>
              <select value={form.organisationId} onChange={(e) => update('organisationId', Number(e.target.value))}>
                <option value="">Sélectionner...</option>
                {initialOrgs.map((o) => (
                  <option key={o.id} value={o.id}>{o.name}</option>
                ))}
              </select>
            </label>
          </div>
          <div className="tenant-modal-row">
            <label className="tenant-modal-field">
              <span>Owner ID</span>
              <input type="number" value={form.ownerId} onChange={(e) => update('ownerId', e.target.value)} />
            </label>
            <label className="tenant-modal-field">
              <span>Nom owner</span>
              <input type="text" value={form.ownerName} onChange={(e) => update('ownerName', e.target.value)} />
            </label>
          </div>
          <div className="tenant-modal-row">
            <label className="tenant-modal-field">
              <span>Plan</span>
              <select value={form.plan} onChange={(e) => update('plan', e.target.value)}>
                {PLAN_OPTIONS.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </label>
            <label className="tenant-modal-field">
              <span>Région</span>
              <select value={form.region} onChange={(e) => update('region', e.target.value)}>
                {REGION_OPTIONS.map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </label>
          </div>
          {error && <div className="tenant-modal-error">{error}</div>}
          <div className="tenant-modal-actions">
            <button type="button" className="tenant-modal-btn-secondary" onClick={onClose}>Annuler</button>
            <button type="submit" className="tenant-primary-btn">Créer le tenant</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function EditTenantModal({ open, tenant, onClose, onSave }) {
  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    if (open && tenant) {
      setForm({
        name: tenant.name || '',
        organisationId: tenant.organisationId || '',
        ownerId: tenant.ownerId || '',
        ownerName: tenant.ownerName || '',
        plan: tenant.plan || 'Standard',
        region: tenant.region || 'EU-West',
      });
    }
  }, [open, tenant]);

  if (!open || !tenant) return null;

  const update = (field, value) => setForm((f) => ({ ...f, [field]: value }));

  const submit = (e) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    onSave(form);
  };

  return (
    <div className="tenant-modal-backdrop" onClick={onClose}>
      <div className="tenant-modal" onClick={(e) => e.stopPropagation()}>
        <div className="tenant-modal-header">
          <h2 className="tenant-modal-title">Modifier le tenant</h2>
          <button type="button" className="tenant-modal-close" onClick={onClose} aria-label="Fermer">×</button>
        </div>
        <form className="tenant-modal-form" onSubmit={submit}>
          <div className="tenant-modal-row">
            <label className="tenant-modal-field">
              <span>Nom *</span>
              <input type="text" value={form.name} onChange={(e) => update('name', e.target.value)} />
            </label>
            <label className="tenant-modal-field">
              <span>Organisation</span>
              <select value={form.organisationId} onChange={(e) => update('organisationId', Number(e.target.value))}>
                {initialOrgs.map((o) => (
                  <option key={o.id} value={o.id}>{o.name}</option>
                ))}
              </select>
            </label>
          </div>
          <div className="tenant-modal-row">
            <label className="tenant-modal-field">
              <span>Owner ID</span>
              <input type="number" value={form.ownerId} onChange={(e) => update('ownerId', e.target.value)} />
            </label>
            <label className="tenant-modal-field">
              <span>Nom owner</span>
              <input type="text" value={form.ownerName} onChange={(e) => update('ownerName', e.target.value)} />
            </label>
          </div>
          <div className="tenant-modal-row">
            <label className="tenant-modal-field">
              <span>Plan</span>
              <select value={form.plan} onChange={(e) => update('plan', e.target.value)}>
                {PLAN_OPTIONS.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </label>
            <label className="tenant-modal-field">
              <span>Région</span>
              <select value={form.region} onChange={(e) => update('region', e.target.value)}>
                {REGION_OPTIONS.map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </label>
          </div>
          <div className="tenant-modal-actions">
            <button type="button" className="tenant-modal-btn-secondary" onClick={onClose}>Annuler</button>
            <button type="submit" className="tenant-primary-btn">Enregistrer</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ActionMenu({ tenant, onView, onEdit, onToggleStatus, onDelete, canDeleteOwner }) {
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

  const nextStatusLabel = tenant.status === 'ACTIVE' ? 'Suspendre' : tenant.status === 'SUSPENDED' ? 'Réactiver' : 'Archiver';

  return (
    <div className="tenant-action-menu" ref={ref}>
      <button
        type="button"
        className="tenant-action-btn"
        title="Plus d'actions"
        onClick={() => setOpen((v) => !v)}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="1" />
          <circle cx="19" cy="12" r="1" />
          <circle cx="5" cy="12" r="1" />
        </svg>
      </button>
      {open && (
        <div className="tenant-action-dropdown" role="menu">
          <button type="button" role="menuitem" onClick={() => { setOpen(false); onView(tenant); }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
            Voir
          </button>
          <button type="button" role="menuitem" onClick={() => { setOpen(false); onEdit(tenant); }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 20h9" />
              <path d="M16.5 3.5a2.121 2.121 0 113 3L7 19l-4 1 1-4 12.5-12.5z" />
            </svg>
            Modifier
          </button>
          <button type="button" role="menuitem" onClick={() => { setOpen(false); onToggleStatus(tenant); }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              {tenant.status === 'ACTIVE' ? (
                <>
                  <rect x="6" y="4" width="4" height="16" />
                  <line x1="4" y1="12" x2="12" y2="12" />
                  <line x1="8" y1="2" x2="8" y2="6" />
                  <line x1="8" y1="18" x2="8" y2="22" />
                </>
              ) : (
                <>
                  <polyline points="20 6 9 17 4 12" />
                </>
              )}
            </svg>
            {nextStatusLabel}
          </button>
          <button
            type="button"
            role="menuitem"
            className={`tenant-action-danger ${!canDeleteOwner ? 'is-disabled' : ''}`}
            onClick={() => { if (canDeleteOwner) { setOpen(false); onDelete(tenant); } }}
            title={!canDeleteOwner ? 'Impossible : ce tenant possède encore un owner actif' : 'Supprimer'}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6l-2 14a2 2 0 01-2 2H9a2 2 0 01-2-2L5 6" />
              <path d="M10 11v6" />
              <path d="M14 11v6" />
              <path d="M9 6V4a2 2 0 012-2h2a2 2 0 012 2v2" />
            </svg>
            Supprimer
          </button>
        </div>
      )}
    </div>
  );
}

function TenantsPage() {
  const [tenants, setTenants] = useState(() => tenantsService.listTenants());
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('Tous');
  const [planFilter, setPlanFilter] = useState('Tous');
  const [regionFilter, setRegionFilter] = useState('Tous');
  const [pageSize, setPageSize] = useState(7);
  const [page, setPage] = useState(1);
  const [selectedTenant, setSelectedTenant] = useState(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState(null);

  const syncSelection = (list) => {
    if (!selectedTenant) return;
    const refreshed = list.find((t) => t.id === selectedTenant.id) || null;
    setSelectedTenant(refreshed);
  };

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return tenants.filter((t) => {
      const matchSearch = !q || `${t.name} ${t.ownerName}`.toLowerCase().includes(q);
      const matchStatus = statusFilter === 'Tous' || t.status === statusFilter;
      const matchPlan = planFilter === 'Tous' || t.plan === planFilter;
      const matchRegion = regionFilter === 'Tous' || t.region === regionFilter;
      return matchSearch && matchStatus && matchPlan && matchRegion;
    });
  }, [tenants, search, statusFilter, planFilter, regionFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const pageTenants = filtered.slice((safePage - 1) * pageSize, safePage * pageSize);
  const showingFrom = filtered.length === 0 ? 0 : (safePage - 1) * pageSize + 1;
  const showingTo = Math.min(safePage * pageSize, filtered.length);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [totalPages, page]);

  const handleRowClick = (tenant) => {
    setSelectedTenant(tenant);
  };

  const handleCreate = (payload) => {
    const created = tenantsService.createTenant(payload);
    setTenants(tenantsService.listTenants());
    setCreateOpen(false);
    setSelectedTenant(created);
    setPage(1);
  };

  const handleSave = (payload) => {
    tenantsService.updateTenant(editTarget.id, payload);
    const next = tenantsService.listTenants();
    setTenants(next);
    syncSelection(next);
    setEditTarget(null);
  };

  const handleToggleStatus = (tenant) => {
    const nextStatus = tenant.status === 'ACTIVE' ? 'SUSPENDED' : tenant.status === 'SUSPENDED' ? 'ARCHIVED' : 'ACTIVE';
    tenantsService.setTenantStatus(tenant.id, nextStatus);
    const next = tenantsService.listTenants();
    setTenants(next);
    syncSelection(next);
  };

  const handleDelete = (tenant) => {
    if (!tenant.ownerId) {
      alert('Ce tenant n\'a pas d\'owner assigné et peut être supprimé.');
    } else if (tenantsService.hasActiveOwner(tenant.organisationId)) {
      const activeOwners = tenants.filter((t) => t.organisationId === tenant.organisationId && t.status === 'ACTIVE' && t.ownerId === tenant.ownerId).length;
      if (activeOwners > 1) {
        const ok = window.confirm(`Supprimer définitivement ${tenant.name} ?`);
        if (!ok) return;
      } else {
        alert('Impossible de supprimer ce tenant : il est le dernier owner actif de son organisation.');
        return;
      }
    } else {
      const ok = window.confirm(`Supprimer définitivement ${tenant.name} ?`);
      if (!ok) return;
    }

    tenantsService.deleteTenant(tenant.id);
    const next = tenantsService.listTenants();
    setTenants(next);
    if (selectedTenant?.id === tenant.id) {
      setSelectedTenant(null);
    }
  };

  const getOrganisationName = (orgId) => {
    const org = initialOrgs.find((o) => o.id === orgId);
    return org ? org.name : '—';
  };

  const canDeleteOwner = (tenant) => {
    if (!tenant.ownerId) return true;
    const activeOwners = tenants.filter((t) => t.organisationId === tenant.organisationId && t.status === 'ACTIVE' && t.ownerId === tenant.ownerId).length;
    return activeOwners > 1;
  };

  const stats = useMemo(() => {
    const total = tenants.length;
    const activeTenants = tenants.filter((t) => t.status === 'ACTIVE').length;
    const suspendedTenants = tenants.filter((t) => t.status === 'SUSPENDED').length;
    const archivedTenants = tenants.filter((t) => t.status === 'ARCHIVED').length;
    const uniqueOrgs = new Set(tenants.map((t) => t.organisationId)).size;
    return [
      { label: 'Tenants', value: String(total), context: 'Environnements déployés', icon: 'tenant', color: '#7c3aed' },
      { label: 'Tenants actifs', value: String(activeTenants), context: 'Opérationnels', icon: 'active', color: '#10b981' },
      { label: 'Suspendus', value: String(suspendedTenants), context: 'En attente', icon: 'suspended', color: '#f59e0b' },
      { label: 'Organisations', value: String(uniqueOrgs), context: `${archivedTenants} archivés`, icon: 'org', color: '#2563eb' },
    ];
  }, [tenants]);

  return (
    <div className="tenant-page">
      <nav className="tenant-breadcrumb">
        <span>Auth + IAM + Context</span>
        <span className="tenant-breadcrumb-sep">/</span>
        <span className="tenant-breadcrumb-current">Organisations & Tenants</span>
        <span className="tenant-breadcrumb-sep">/</span>
        <span>Tenants</span>
      </nav>

      <div className="tenant-header">
        <div>
          <div className="tenant-title-row">
            <h1 className="tenant-title">Tenants</h1>
            <button className="tenant-info-btn" title="Information">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 16v-4" />
                <path d="M12 8h.01" />
              </svg>
            </button>
          </div>
          <p className="tenant-subtitle">Gérez les tenants, leurs propriétaires et les environnements déployés.</p>
        </div>
      </div>

      <div className="tenant-stats">
        {stats.map((stat) => (
          <div key={stat.label} className="tenant-stat-card">
            <div className="tenant-stat-icon" style={{ backgroundColor: `${stat.color}15`, color: stat.color }}>
              <StatIcon name={stat.icon} />
            </div>
            <div className="tenant-stat-content">
              <span className="tenant-stat-value">{stat.value}</span>
              <span className="tenant-stat-label">{stat.label}</span>
              <span className="tenant-stat-context">{stat.context}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="tenant-toolbar">
        <div className="tenant-toolbar-left">
          <div className="tenant-search">
            <svg className="tenant-search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" />
              <path d="M21 21l-4.35-4.35" />
            </svg>
            <input
              type="text"
              placeholder="Rechercher un tenant..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="tenant-search-input"
            />
          </div>
          <select className="tenant-filter-select" value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}>
            <option value="Tous">Tous (statut)</option>
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>{s === 'ACTIVE' ? 'Actif' : s === 'SUSPENDED' ? 'Suspendu' : 'Archivé'}</option>
            ))}
          </select>
          <select className="tenant-filter-select" value={planFilter} onChange={(e) => { setPlanFilter(e.target.value); setPage(1); }}>
            <option value="Tous">Tous (plan)</option>
            {PLAN_OPTIONS.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
          <select className="tenant-filter-select" value={regionFilter} onChange={(e) => { setRegionFilter(e.target.value); setPage(1); }}>
            <option value="Tous">Tous (région)</option>
            {REGION_OPTIONS.map((r) => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
          <button className="tenant-filter-btn" title="Filtres avancés">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="4" y1="21" x2="4" y2="14" />
              <line x1="4" y1="10" x2="4" y2="3" />
              <line x1="12" y1="21" x2="12" y2="12" />
              <line x1="12" y1="8" x2="12" y2="3" />
              <line x1="20" y1="21" x2="20" y2="16" />
              <line x1="20" y1="12" x2="20" y2="3" />
              <line x1="1" y1="14" x2="7" y2="14" />
              <line x1="9" y1="8" x2="15" y2="8" />
              <line x1="17" y1="16" x2="23" y2="16" />
            </svg>
          </button>
        </div>
        <button type="button" className="tenant-primary-btn" onClick={() => setCreateOpen(true)}>+ Nouveau tenant</button>
      </div>

      <div className="tenant-main">
        <div className="tenant-table-wrapper">
          <table className="tenant-table">
            <thead>
              <tr>
                <th>Tenant</th>
                <th>Organisation</th>
                <th>Owner</th>
                <th>Plan</th>
                <th>Région</th>
                <th>Statut</th>
                <th>Créé le</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {pageTenants.length === 0 && (
                <tr>
                  <td colSpan={8} className="tenant-empty">Aucun tenant ne correspond aux filtres.</td>
                </tr>
              )}
              {pageTenants.map((t) => (
                <tr key={t.id} className={`tenant-table-row ${selectedTenant?.id === t.id ? 'tenant-table-row-selected' : ''}`} onClick={() => handleRowClick(t)}>
                  <td>
                    <div className="tenant-user-cell">
                      <div className="tenant-user-avatar">{t.name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()}</div>
                      <div className="tenant-user-name">{t.name}</div>
                    </div>
                  </td>
                  <td>{getOrganisationName(t.organisationId)}</td>
                  <td>{t.ownerName || '—'}</td>
                  <td>{t.plan}</td>
                  <td>{t.region}</td>
                  <td>
                    <div className="tenant-status-cell">
                      <span className="tenant-status-dot" style={{ backgroundColor: t.status === 'ACTIVE' ? '#10b981' : t.status === 'SUSPENDED' ? '#f59e0b' : '#6b7280' }} />
                      <span>{t.status === 'ACTIVE' ? 'Actif' : t.status === 'SUSPENDED' ? 'Suspendu' : 'Archivé'}</span>
                    </div>
                  </td>
                  <td>{t.createdAt}</td>
                  <td>
                    <div className="tenant-actions-cell" onClick={(e) => e.stopPropagation()}>
                      <button type="button" className="tenant-action-btn" title="Voir" onClick={() => handleRowClick(t)}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                          <circle cx="12" cy="12" r="3" />
                        </svg>
                      </button>
                      <ActionMenu
                        tenant={t}
                        onView={handleRowClick}
                        onEdit={(tenant) => setEditTarget(tenant)}
                        onToggleStatus={handleToggleStatus}
                        onDelete={handleDelete}
                        canDeleteOwner={canDeleteOwner(t)}
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="tenant-side">
          {selectedTenant ? (
            <div className="tenant-detail-panel">
              <div className="tenant-detail-header">
                <div className="tenant-detail-identity">
                  <div className="tenant-detail-avatar">{selectedTenant.name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()}</div>
                  <div>
                    <div className="tenant-detail-name">{selectedTenant.name}</div>
                    <div className="tenant-detail-org">{getOrganisationName(selectedTenant.organisationId)}</div>
                  </div>
                </div>
                <span className={`tenant-detail-status tenant-detail-status-${selectedTenant.status.toLowerCase()}`}>{selectedTenant.status}</span>
              </div>

              <div className="tenant-detail-pills">
                <span className="tenant-detail-pill">{selectedTenant.plan}</span>
                <span className="tenant-detail-pill">{selectedTenant.region}</span>
                <span className="tenant-detail-pill">Owner: {selectedTenant.ownerName || '—'}</span>
              </div>

              <div className="tenant-detail-tabs">
                {['Général', 'Activité', 'Sécurité', 'Accès'].map((tab) => (
                  <button key={tab} className={`tenant-detail-tab ${tab === 'Général' ? 'tenant-detail-tab-active' : ''}`}>
                    {tab}
                  </button>
                ))}
              </div>

              <div className="tenant-detail-fields">
                {[
                  { label: 'Nom', value: selectedTenant.name },
                  { label: 'Organisation', value: getOrganisationName(selectedTenant.organisationId) },
                  { label: 'Owner', value: selectedTenant.ownerName || '—' },
                  { label: 'Plan', value: selectedTenant.plan },
                  { label: 'Région', value: selectedTenant.region },
                  { label: 'Statut', value: selectedTenant.status },
                  { label: 'Créé le', value: selectedTenant.createdAt },
                ].map((field) => (
                  <div key={field.label} className="tenant-detail-field">
                    <span className="tenant-detail-field-label">{field.label}</span>
                    <span className="tenant-detail-field-value">{field.value}</span>
                  </div>
                ))}
              </div>

              <div className="tenant-detail-actions">
                <button type="button" className="tenant-detail-btn tenant-detail-btn-primary" onClick={() => setEditTarget(selectedTenant)}>Modifier</button>
                <button type="button" className="tenant-detail-btn tenant-detail-btn-secondary" onClick={() => handleToggleStatus(selectedTenant)}>
                  {selectedTenant.status === 'ACTIVE' ? 'Suspendre' : selectedTenant.status === 'SUSPENDED' ? 'Réactiver' : 'Archiver'}
                </button>
                <button type="button" className="tenant-detail-btn tenant-detail-btn-danger" onClick={() => handleDelete(selectedTenant)}>Supprimer</button>
              </div>
            </div>
          ) : (
            <div className="tenant-detail-panel tenant-detail-empty">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--color-text-muted)' }}>
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
              <p>Sélectionnez un tenant pour afficher les détails</p>
            </div>
          )}
        </div>
      </div>

      <div className="tenant-pagination">
        <span className="tenant-pagination-info">
          {filtered.length === 0
            ? 'Aucun tenant'
            : `Affichage ${showingFrom} à ${showingTo} sur ${filtered.length} tenant${filtered.length > 1 ? 's' : ''}`}
        </span>
        <div className="tenant-pagination-controls">
          <button type="button" className="tenant-page-btn" disabled={safePage === 1} onClick={() => setPage(safePage - 1)}>‹</button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              type="button"
              className={`tenant-page-btn ${p === safePage ? 'tenant-page-btn-active' : ''}`}
              onClick={() => setPage(p)}
            >
              {p}
            </button>
          ))}
          <button type="button" className="tenant-page-btn" disabled={safePage === totalPages} onClick={() => setPage(safePage + 1)}>›</button>
        </div>
        <select
          className="tenant-page-size"
          value={pageSize}
          onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }}
        >
          <option value="7">7 / page</option>
          <option value="10">10 / page</option>
          <option value="25">25 / page</option>
        </select>
      </div>

      <NewTenantModal open={createOpen} onClose={() => setCreateOpen(false)} onCreate={handleCreate} />
      <EditTenantModal open={Boolean(editTarget)} tenant={editTarget} onClose={() => setEditTarget(null)} onSave={handleSave} />
    </div>
  );
}

function StatIcon({ name }) {
  const props = { width: 18, height: 18, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' };
  if (name === 'tenant') {
    return (
      <svg {...props}>
        <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
        <line x1="8" y1="21" x2="16" y2="21" />
        <line x1="12" y1="17" x2="12" y2="21" />
      </svg>
    );
  }
  if (name === 'active') {
    return (
      <svg {...props}>
        <polyline points="20 6 9 17 4 12" />
      </svg>
    );
  }
  if (name === 'suspended') {
    return (
      <svg {...props}>
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="8" x2="12" y2="12" />
        <line x1="12" y1="16" x2="12.01" y2="16" />
      </svg>
    );
  }
  if (name === 'org') {
    return (
      <svg {...props}>
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <line x1="9" y1="3" x2="9" y2="21" />
      </svg>
    );
  }
  return null;
}

export default TenantsPage;
