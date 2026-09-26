import { useState, useMemo, useEffect, useRef } from 'react';
import * as orgsService from '../../services/organisationsMockService';
import { tenants } from '../../data/mock';
import './OrganisationsPage.css';

const TYPE_OPTIONS = ['SARL', 'SAS', 'EURL', 'SA', 'EI'];
const STATUS_OPTIONS = ['active', 'suspended', 'archived'];
const COUNTRY_OPTIONS = ['France', 'Canada', 'Belgique', 'Suisse', 'Allemagne'];

function emptyForm() {
  return {
    name: '',
    legalName: '',
    code: '',
    type: 'SARL',
    country: 'France',
    timezone: 'Europe/Paris',
  };
}

function NewOrgModal({ open, onClose, onCreate }) {
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
      setError('Le nom de l\'organisation est obligatoire.');
      return;
    }
    onCreate(form);
  };

  return (
    <div className="org-modal-backdrop" onClick={onClose}>
      <div className="org-modal" onClick={(e) => e.stopPropagation()}>
        <div className="org-modal-header">
          <h2 className="org-modal-title">Nouvelle organisation</h2>
          <button type="button" className="org-modal-close" onClick={onClose} aria-label="Fermer">×</button>
        </div>
        <form className="org-modal-form" onSubmit={submit}>
          <div className="org-modal-row">
            <label className="org-modal-field">
              <span>Nom *</span>
              <input ref={firstFieldRef} type="text" value={form.name} onChange={(e) => update('name', e.target.value)} />
            </label>
            <label className="org-modal-field">
              <span>Nom légal</span>
              <input type="text" value={form.legalName} onChange={(e) => update('legalName', e.target.value)} />
            </label>
          </div>
          <div className="org-modal-row">
            <label className="org-modal-field">
              <span>Code</span>
              <input type="text" value={form.code} onChange={(e) => update('code', e.target.value)} />
            </label>
            <label className="org-modal-field">
              <span>Type</span>
              <select value={form.type} onChange={(e) => update('type', e.target.value)}>
                {TYPE_OPTIONS.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </label>
          </div>
          <div className="org-modal-row">
            <label className="org-modal-field">
              <span>Pays</span>
              <select value={form.country} onChange={(e) => update('country', e.target.value)}>
                {COUNTRY_OPTIONS.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </label>
            <label className="org-modal-field">
              <span>Fuseau horaire</span>
              <select value={form.timezone} onChange={(e) => update('timezone', e.target.value)}>
                <option value="Europe/Paris">Europe/Paris</option>
                <option value="Europe/Berlin">Europe/Berlin</option>
                <option value="Europe/Brussels">Europe/Brussels</option>
                <option value="America/Montreal">America/Montreal</option>
                <option value="UTC">UTC</option>
              </select>
            </label>
          </div>
          {error && <div className="org-modal-error">{error}</div>}
          <div className="org-modal-actions">
            <button type="button" className="org-modal-btn-secondary" onClick={onClose}>Annuler</button>
            <button type="submit" className="org-primary-btn">Créer l'organisation</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function EditOrgModal({ open, org, onClose, onSave }) {
  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    if (open && org) {
      setForm({
        name: org.name || '',
        legalName: org.legalName || '',
        code: org.code || '',
        type: org.type || 'SARL',
        country: org.country || 'France',
        timezone: org.timezone || 'Europe/Paris',
      });
    }
  }, [open, org]);

  if (!open || !org) return null;

  const update = (field, value) => setForm((f) => ({ ...f, [field]: value }));

  const submit = (e) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    onSave(form);
  };

  return (
    <div className="org-modal-backdrop" onClick={onClose}>
      <div className="org-modal" onClick={(e) => e.stopPropagation()}>
        <div className="org-modal-header">
          <h2 className="org-modal-title">Modifier l'organisation</h2>
          <button type="button" className="org-modal-close" onClick={onClose} aria-label="Fermer">×</button>
        </div>
        <form className="org-modal-form" onSubmit={submit}>
          <div className="org-modal-row">
            <label className="org-modal-field">
              <span>Nom *</span>
              <input type="text" value={form.name} onChange={(e) => update('name', e.target.value)} />
            </label>
            <label className="org-modal-field">
              <span>Nom légal</span>
              <input type="text" value={form.legalName} onChange={(e) => update('legalName', e.target.value)} />
            </label>
          </div>
          <div className="org-modal-row">
            <label className="org-modal-field">
              <span>Code</span>
              <input type="text" value={form.code} onChange={(e) => update('code', e.target.value)} />
            </label>
            <label className="org-modal-field">
              <span>Type</span>
              <select value={form.type} onChange={(e) => update('type', e.target.value)}>
                {TYPE_OPTIONS.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </label>
          </div>
          <div className="org-modal-row">
            <label className="org-modal-field">
              <span>Pays</span>
              <select value={form.country} onChange={(e) => update('country', e.target.value)}>
                {COUNTRY_OPTIONS.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </label>
            <label className="org-modal-field">
              <span>Fuseau horaire</span>
              <select value={form.timezone} onChange={(e) => update('timezone', e.target.value)}>
                <option value="Europe/Paris">Europe/Paris</option>
                <option value="Europe/Berlin">Europe/Berlin</option>
                <option value="Europe/Brussels">Europe/Brussels</option>
                <option value="America/Montreal">America/Montreal</option>
                <option value="UTC">UTC</option>
              </select>
            </label>
          </div>
          <div className="org-modal-actions">
            <button type="button" className="org-modal-btn-secondary" onClick={onClose}>Annuler</button>
            <button type="submit" className="org-primary-btn">Enregistrer</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ActionMenu({ org, onView, onEdit, onToggleStatus, onDelete }) {
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

  const nextStatusLabel = org.status === 'active' ? 'Suspendre' : org.status === 'suspended' ? 'Réactiver' : 'Archiver';

  return (
    <div className="org-action-menu" ref={ref}>
      <button
        type="button"
        className="org-action-btn"
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
        <div className="org-action-dropdown" role="menu">
          <button type="button" role="menuitem" onClick={() => { setOpen(false); onView(org); }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
            Voir
          </button>
          <button type="button" role="menuitem" onClick={() => { setOpen(false); onEdit(org); }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 20h9" />
              <path d="M16.5 3.5a2.121 2.121 0 113 3L7 19l-4 1 1-4 12.5-12.5z" />
            </svg>
            Modifier
          </button>
          <button type="button" role="menuitem" onClick={() => { setOpen(false); onToggleStatus(org); }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              {org.status === 'active' ? (
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
          <button type="button" role="menuitem" className="org-action-danger" onClick={() => { setOpen(false); onDelete(org); }}>
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

function OrganisationsPage() {
  const [orgs, setOrgs] = useState(() => orgsService.listOrganisations());
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('Tous');
  const [statusFilter, setStatusFilter] = useState('Tous');
  const [countryFilter, setCountryFilter] = useState('Tous');
  const [pageSize, setPageSize] = useState(7);
  const [page, setPage] = useState(1);
  const [selectedOrg, setSelectedOrg] = useState(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState(null);

  const syncSelection = (list) => {
    if (!selectedOrg) return;
    const refreshed = list.find((o) => o.id === selectedOrg.id) || null;
    setSelectedOrg(refreshed);
  };

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return orgs.filter((o) => {
      const matchSearch = !q || `${o.name} ${o.code} ${o.legalName}`.toLowerCase().includes(q);
      const matchType = typeFilter === 'Tous' || o.type === typeFilter;
      const matchStatus = statusFilter === 'Tous' || o.status === statusFilter;
      const matchCountry = countryFilter === 'Tous' || o.country === countryFilter;
      return matchSearch && matchType && matchStatus && matchCountry;
    });
  }, [orgs, search, typeFilter, statusFilter, countryFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const pageOrgs = filtered.slice((safePage - 1) * pageSize, safePage * pageSize);
  const showingFrom = filtered.length === 0 ? 0 : (safePage - 1) * pageSize + 1;
  const showingTo = Math.min(safePage * pageSize, filtered.length);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [totalPages, page]);

  const handleRowClick = (org) => {
    setSelectedOrg(org);
  };

  const handleCreate = (payload) => {
    const created = orgsService.createOrganisation(payload);
    setOrgs(orgsService.listOrganisations());
    setCreateOpen(false);
    setSelectedOrg(created);
    setPage(1);
  };

  const handleSave = (payload) => {
    orgsService.updateOrganisation(editTarget.id, payload);
    const next = orgsService.listOrganisations();
    setOrgs(next);
    syncSelection(next);
    setEditTarget(null);
  };

  const handleToggleStatus = (org) => {
    const nextStatus = org.status === 'active' ? 'suspended' : org.status === 'suspended' ? 'archived' : 'active';
    orgsService.setOrganisationStatus(org.id, nextStatus);
    const next = orgsService.listOrganisations();
    setOrgs(next);
    syncSelection(next);
  };

  const handleDelete = (org) => {
    const ok = window.confirm(`Supprimer définitivement ${org.name} ?`);
    if (!ok) return;
    orgsService.deleteOrganisation(org.id);
    const next = orgsService.listOrganisations();
    setOrgs(next);
    if (selectedOrg?.id === org.id) {
      setSelectedOrg(null);
    }
  };

  const selectedTenants = useMemo(() => {
    if (!selectedOrg) return [];
    return orgsService.getTenantsByOrganisation(selectedOrg.id);
  }, [selectedOrg]);

  const stats = useMemo(() => {
    const total = orgs.length;
    const activeTenants = tenants.filter((t) => t.status === 'ACTIVE').length;
    const activeOrgs = orgs.filter((o) => o.status === 'active').length;
    const suspendedOrgs = orgs.filter((o) => o.status === 'suspended').length;
    const archivedOrgs = orgs.filter((o) => o.status === 'archived').length;
    return [
      { label: 'Organisations', value: String(total), context: 'Comptes enregistrés', icon: 'org', color: '#2563eb' },
      { label: 'Tenants', value: String(tenants.length), context: 'Environnements déployés', icon: 'tenant', color: '#7c3aed' },
      { label: 'Tenants actifs', value: String(activeTenants), context: 'Opérationnels', icon: 'active', color: '#10b981' },
      { label: 'Org. par statut', value: String(activeOrgs), context: `${suspendedOrgs} suspendues · ${archivedOrgs} archivées`, icon: 'status', color: '#f59e0b' },
    ];
  }, [orgs]);

  return (
    <div className="org-page">
      <nav className="org-breadcrumb">
        <span>Auth + IAM + Context</span>
        <span className="org-breadcrumb-sep">/</span>
        <span className="org-breadcrumb-current">Organisations & Tenants</span>
      </nav>

      <div className="org-header">
        <div>
          <div className="org-title-row">
            <h1 className="org-title">Organisations & Tenants</h1>
            <button className="org-info-btn" title="Information">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 16v-4" />
                <path d="M12 8h.01" />
              </svg>
            </button>
          </div>
          <p className="org-subtitle">Gérez les organisations, leurs tenants et les environnements déployés.</p>
        </div>
      </div>

      <div className="org-stats">
        {stats.map((stat) => (
          <div key={stat.label} className="org-stat-card">
            <div className="org-stat-icon" style={{ backgroundColor: `${stat.color}15`, color: stat.color }}>
              <StatIcon name={stat.icon} />
            </div>
            <div className="org-stat-content">
              <span className="org-stat-value">{stat.value}</span>
              <span className="org-stat-label">{stat.label}</span>
              <span className="org-stat-context">{stat.context}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="org-toolbar">
        <div className="org-toolbar-left">
          <div className="org-search">
            <svg className="org-search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" />
              <path d="M21 21l-4.35-4.35" />
            </svg>
            <input
              type="text"
              placeholder="Rechercher une organisation..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="org-search-input"
            />
          </div>
          <select className="org-filter-select" value={typeFilter} onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}>
            <option value="Tous">Tous (type)</option>
            {TYPE_OPTIONS.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
          <select className="org-filter-select" value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}>
            <option value="Tous">Tous (statut)</option>
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>{s === 'active' ? 'Actif' : s === 'suspended' ? 'Suspendu' : 'Archivé'}</option>
            ))}
          </select>
          <select className="org-filter-select" value={countryFilter} onChange={(e) => { setCountryFilter(e.target.value); setPage(1); }}>
            <option value="Tous">Tous (pays)</option>
            {COUNTRY_OPTIONS.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <button className="org-filter-btn" title="Filtres avancés">
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
        <button type="button" className="org-primary-btn" onClick={() => setCreateOpen(true)}>+ Nouvelle organisation</button>
      </div>

      <div className="org-main">
        <div className="org-table-wrapper">
          <table className="org-table">
            <thead>
              <tr>
                <th>Organisation</th>
                <th>Code</th>
                <th>Type</th>
                <th>Tenants</th>
                <th>Pays</th>
                <th>Statut</th>
                <th>Créée le</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {pageOrgs.length === 0 && (
                <tr>
                  <td colSpan={8} className="org-empty">Aucune organisation ne correspond aux filtres.</td>
                </tr>
              )}
              {pageOrgs.map((o) => (
                <tr key={o.id} className={`org-table-row ${selectedOrg?.id === o.id ? 'org-table-row-selected' : ''}`} onClick={() => handleRowClick(o)}>
                  <td>
                    <div className="org-user-cell">
                      <div className="org-user-avatar">{o.name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()}</div>
                      <div>
                        <div className="org-user-name">{o.name}</div>
                        <div className="org-user-legal">{o.legalName}</div>
                      </div>
                    </div>
                  </td>
                  <td><span className="org-code-badge">{o.code}</span></td>
                  <td>{o.type}</td>
                  <td>{o.tenantCount}</td>
                  <td>{o.country}</td>
                  <td>
                    <div className="org-status-cell">
                      <span className="org-status-dot" style={{ backgroundColor: o.status === 'active' ? '#10b981' : o.status === 'suspended' ? '#f59e0b' : '#6b7280' }} />
                      <span>{o.status === 'active' ? 'Actif' : o.status === 'suspended' ? 'Suspendu' : 'Archivé'}</span>
                    </div>
                  </td>
                  <td>{o.createdAt}</td>
                  <td>
                    <div className="org-actions-cell" onClick={(e) => e.stopPropagation()}>
                      <button type="button" className="org-action-btn" title="Voir" onClick={() => handleRowClick(o)}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                          <circle cx="12" cy="12" r="3" />
                        </svg>
                      </button>
                      <ActionMenu
                        org={o}
                        onView={handleRowClick}
                        onEdit={(org) => setEditTarget(org)}
                        onToggleStatus={handleToggleStatus}
                        onDelete={handleDelete}
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="org-side">
          {selectedOrg ? (
            <div className="org-detail-panel">
              <div className="org-detail-header">
                <div className="org-detail-identity">
                  <div className="org-detail-avatar">{selectedOrg.name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()}</div>
                  <div>
                    <div className="org-detail-name">{selectedOrg.name}</div>
                    <div className="org-detail-legal">{selectedOrg.legalName}</div>
                  </div>
                </div>
                <span className={`org-detail-status org-detail-status-${selectedOrg.status}`}>{selectedOrg.status === 'active' ? 'Actif' : selectedOrg.status === 'suspended' ? 'Suspendu' : 'Archivé'}</span>
              </div>

              <div className="org-detail-pills">
                <span className="org-detail-pill">{selectedOrg.type}</span>
                <span className="org-detail-pill">{selectedOrg.country}</span>
                <span className="org-detail-pill">{selectedOrg.timezone}</span>
              </div>

              <div className="org-detail-tabs">
                {['Général', 'Tenants', 'Activité', 'Sécurité'].map((tab) => (
                  <button key={tab} className={`org-detail-tab ${tab === 'Général' ? 'org-detail-tab-active' : ''}`}>
                    {tab}
                  </button>
                ))}
              </div>

              <div className="org-detail-fields">
                {[
                  { label: 'Nom', value: selectedOrg.name },
                  { label: 'Nom légal', value: selectedOrg.legalName },
                  { label: 'Code', value: selectedOrg.code },
                  { label: 'Type', value: selectedOrg.type },
                  { label: 'Pays', value: selectedOrg.country },
                  { label: 'Fuseau horaire', value: selectedOrg.timezone },
                  { label: 'Statut', value: selectedOrg.status },
                  { label: 'Créée le', value: selectedOrg.createdAt },
                ].map((field) => (
                  <div key={field.label} className="org-detail-field">
                    <span className="org-detail-field-label">{field.label}</span>
                    <span className="org-detail-field-value">{field.value}</span>
                  </div>
                ))}
              </div>

              <div className="org-detail-tenants">
                <h4 className="org-detail-tenants-title">Tenants rattachés ({selectedTenants.length})</h4>
                {selectedTenants.length === 0 ? (
                  <p className="org-detail-tenants-empty">Aucun tenant rattaché.</p>
                ) : (
                  <div className="org-detail-tenants-list">
                    {selectedTenants.map((t) => (
                      <div key={t.id} className="org-detail-tenant-item">
                        <div>
                          <div className="org-detail-tenant-name">{t.name}</div>
                          <div className="org-detail-tenant-meta">{t.ownerName} · {t.plan} · {t.region}</div>
                        </div>
                        <span className={`org-detail-tenant-status org-detail-tenant-status-${t.status.toLowerCase()}`}>{t.status}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="org-detail-actions">
                <button type="button" className="org-detail-btn org-detail-btn-primary" onClick={() => setEditTarget(selectedOrg)}>Modifier</button>
                <button type="button" className="org-detail-btn org-detail-btn-secondary">Voir les tenants</button>
                <button type="button" className="org-detail-btn org-detail-btn-danger" onClick={() => handleDelete(selectedOrg)}>Supprimer</button>
              </div>
            </div>
          ) : (
            <div className="org-detail-panel org-detail-empty">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--color-text-muted)' }}>
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
              <p>Sélectionnez une organisation pour afficher les détails</p>
            </div>
          )}
        </div>
      </div>

      <div className="org-pagination">
        <span className="org-pagination-info">
          {filtered.length === 0
            ? 'Aucune organisation'
            : `Affichage ${showingFrom} à ${showingTo} sur ${filtered.length} organisation${filtered.length > 1 ? 's' : ''}`}
        </span>
        <div className="org-pagination-controls">
          <button type="button" className="org-page-btn" disabled={safePage === 1} onClick={() => setPage(safePage - 1)}>‹</button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              type="button"
              className={`org-page-btn ${p === safePage ? 'org-page-btn-active' : ''}`}
              onClick={() => setPage(p)}
            >
              {p}
            </button>
          ))}
          <button type="button" className="org-page-btn" disabled={safePage === totalPages} onClick={() => setPage(safePage + 1)}>›</button>
        </div>
        <select
          className="org-page-size"
          value={pageSize}
          onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }}
        >
          <option value="7">7 / page</option>
          <option value="10">10 / page</option>
          <option value="25">25 / page</option>
        </select>
      </div>

      <NewOrgModal open={createOpen} onClose={() => setCreateOpen(false)} onCreate={handleCreate} />
      <EditOrgModal open={Boolean(editTarget)} org={editTarget} onClose={() => setEditTarget(null)} onSave={handleSave} />
    </div>
  );
}

function StatIcon({ name }) {
  const props = { width: 18, height: 18, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' };
  if (name === 'org') {
    return (
      <svg {...props}>
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <line x1="9" y1="3" x2="9" y2="21" />
      </svg>
    );
  }
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
  if (name === 'status') {
    return (
      <svg {...props}>
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
      </svg>
    );
  }
  return null;
}

export default OrganisationsPage;
