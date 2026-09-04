import { useState, useMemo, useEffect, useRef } from 'react';
import * as identitiesService from '../../services/identitiesMockService';
import DonutChart from '../../components/DonutChart';
import { identityStats } from '../../data/mock';
import { identityTypeStats } from '../../data/mock';
import { identitySourceStats, identities, identityErpLinkStats, topUnlinkedIdentities, topUsers } from '../../data/mock';
import './IdentitiesPage.css';

const TYPE_OPTIONS = ['EMAIL', 'GOOGLE', 'SYSTEM', 'EXTERNAL'];
const SOURCE_OPTIONS = ['SIGN_UP', 'SSO', 'INVITE', 'IMPORT', 'SYSTEM'];
const STATUS_OPTIONS = ['ACTIVE', 'SUSPENDED', 'ARCHIVED', 'PENDING'];

function emptyForm() {
  return {
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
  };
}

function Sparkline({ data, color = '#2563eb', width = 80, height = 32 }) {
  const max = Math.max(...data, 1);
  const min = Math.min(...data, 0);
  const range = max - min || 1;
  const points = data.map((val, idx) => {
    const x = (idx / (data.length - 1)) * width;
    const y = height - ((val - min) / range) * height;
    return `${x},${y}`;
  }).join(' ');

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="sparkline-svg">
      <polyline fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" points={points} />
    </svg>
  );
}

function NewIdentityModal({ open, onClose, onCreate }) {
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
    if (!form.firstName.trim() || !form.lastName.trim()) {
      setError('Le prénom et le nom sont obligatoires.');
      return;
    }
    if (!form.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      setError('Veuillez saisir un email valide.');
      return;
    }
    onCreate(form);
  };

  return (
    <div className="identities-modal-backdrop" onClick={onClose}>
      <div className="identities-modal" onClick={(e) => e.stopPropagation()}>
        <div className="identities-modal-header">
          <h2 className="identities-modal-title">Nouvelle identité</h2>
          <button type="button" className="identities-modal-close" onClick={onClose} aria-label="Fermer">×</button>
        </div>
        <form className="identities-modal-form" onSubmit={submit}>
          <div className="identities-modal-row">
            <label className="identities-modal-field">
              <span>Prénom *</span>
              <input ref={firstFieldRef} type="text" value={form.firstName} onChange={(e) => update('firstName', e.target.value)} />
            </label>
            <label className="identities-modal-field">
              <span>Nom *</span>
              <input type="text" value={form.lastName} onChange={(e) => update('lastName', e.target.value)} />
            </label>
          </div>
          <label className="identities-modal-field">
            <span>Email *</span>
            <input type="email" value={form.email} onChange={(e) => update('email', e.target.value)} />
          </label>
          <div className="identities-modal-row">
            <label className="identities-modal-field">
              <span>Type</span>
              <select value={form.type} onChange={(e) => update('type', e.target.value)}>
                {TYPE_OPTIONS.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </label>
            <label className="identities-modal-field">
              <span>Source</span>
              <select value={form.source} onChange={(e) => update('source', e.target.value)}>
                {SOURCE_OPTIONS.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </label>
          </div>
          <div className="identities-modal-row">
            <label className="identities-modal-field">
              <span>Statut</span>
              <select value={form.status} onChange={(e) => update('status', e.target.value)}>
                {STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </label>
            <label className="identities-modal-field">
              <span>Identité principale</span>
              <select value={String(form.isPrimary)} onChange={(e) => update('isPrimary', e.target.value === 'true')}>
                <option value="true">Oui</option>
                <option value="false">Non</option>
              </select>
            </label>
          </div>
          <label className="identities-modal-field">
            <span>Utilisateur lié</span>
            <input type="text" value={form.linkedUser} onChange={(e) => update('linkedUser', e.target.value)} />
          </label>
          <div className="identities-modal-row">
            <label className="identities-modal-field">
              <span>Lien ERP</span>
              <select value={String(form.erpLink)} onChange={(e) => update('erpLink', e.target.value === 'true')}>
                <option value="true">Lié</option>
                <option value="false">Non lié</option>
              </select>
            </label>
            <label className="identities-modal-field">
              <span>Source ERP</span>
              <input type="text" value={form.erpSource} onChange={(e) => update('erpSource', e.target.value)} />
            </label>
          </div>
          {error && <div className="identities-modal-error">{error}</div>}
          <div className="identities-modal-actions">
            <button type="button" className="identities-modal-btn-secondary" onClick={onClose}>Annuler</button>
            <button type="submit" className="identities-primary-btn">Créer l'identité</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function EditIdentityModal({ open, identity, onClose, onSave }) {
  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    if (open && identity) {
      setForm({
        firstName: identity.firstName || '',
        lastName: identity.lastName || '',
        email: identity.email || '',
        type: identity.type || 'EMAIL',
        source: identity.source || 'SIGN_UP',
        status: identity.status || 'ACTIVE',
        isPrimary: identity.isPrimary === true,
        linkedUser: identity.linkedUser || '',
        erpLink: identity.erpLink === true,
        erpSource: identity.erpSource || '',
      });
    }
  }, [open, identity]);

  if (!open || !identity) return null;

  const update = (field, value) => setForm((f) => ({ ...f, [field]: value }));

  const submit = (e) => {
    e.preventDefault();
    if (!form.firstName.trim() || !form.lastName.trim() || !form.email.trim()) return;
    onSave(form);
  };

  return (
    <div className="identities-modal-backdrop" onClick={onClose}>
      <div className="identities-modal" onClick={(e) => e.stopPropagation()}>
        <div className="identities-modal-header">
          <h2 className="identities-modal-title">Modifier l'identité</h2>
          <button type="button" className="identities-modal-close" onClick={onClose} aria-label="Fermer">×</button>
        </div>
        <form className="identities-modal-form" onSubmit={submit}>
          <div className="identities-modal-row">
            <label className="identities-modal-field">
              <span>Prénom *</span>
              <input type="text" value={form.firstName} onChange={(e) => update('firstName', e.target.value)} />
            </label>
            <label className="identities-modal-field">
              <span>Nom *</span>
              <input type="text" value={form.lastName} onChange={(e) => update('lastName', e.target.value)} />
            </label>
          </div>
          <label className="identities-modal-field">
            <span>Email *</span>
            <input type="email" value={form.email} onChange={(e) => update('email', e.target.value)} />
          </label>
          <div className="identities-modal-row">
            <label className="identities-modal-field">
              <span>Type</span>
              <select value={form.type} onChange={(e) => update('type', e.target.value)}>
                {TYPE_OPTIONS.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </label>
            <label className="identities-modal-field">
              <span>Source</span>
              <select value={form.source} onChange={(e) => update('source', e.target.value)}>
                {SOURCE_OPTIONS.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </label>
          </div>
          <div className="identities-modal-row">
            <label className="identities-modal-field">
              <span>Statut</span>
              <select value={form.status} onChange={(e) => update('status', e.target.value)}>
                {STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </label>
            <label className="identities-modal-field">
              <span>Identité principale</span>
              <select value={String(form.isPrimary)} onChange={(e) => update('isPrimary', e.target.value === 'true')}>
                <option value="true">Oui</option>
                <option value="false">Non</option>
              </select>
            </label>
          </div>
          <label className="identities-modal-field">
            <span>Utilisateur lié</span>
            <input type="text" value={form.linkedUser} onChange={(e) => update('linkedUser', e.target.value)} />
          </label>
          <div className="identities-modal-row">
            <label className="identities-modal-field">
              <span>Lien ERP</span>
              <select value={String(form.erpLink)} onChange={(e) => update('erpLink', e.target.value === 'true')}>
                <option value="true">Lié</option>
                <option value="false">Non lié</option>
              </select>
            </label>
            <label className="identities-modal-field">
              <span>Source ERP</span>
              <input type="text" value={form.erpSource} onChange={(e) => update('erpSource', e.target.value)} />
            </label>
          </div>
          <div className="identities-modal-actions">
            <button type="button" className="identities-modal-btn-secondary" onClick={onClose}>Annuler</button>
            <button type="submit" className="identities-primary-btn">Enregistrer</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ActionMenu({ identity, onView, onEdit, onToggleStatus, onDelete }) {
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

  const nextStatusLabel = identity.status === 'ACTIVE' ? 'Suspendre' : identity.status === 'SUSPENDED' ? 'Réactiver' : 'Archiver';

  return (
    <div className="identities-action-menu" ref={ref}>
      <button
        type="button"
        className="identities-action-btn"
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
        <div className="identities-action-dropdown" role="menu">
          <button type="button" role="menuitem" onClick={() => { setOpen(false); onView(identity); }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
            Voir
          </button>
          <button type="button" role="menuitem" onClick={() => { setOpen(false); onEdit(identity); }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 20h9" />
              <path d="M16.5 3.5a2.121 2.121 0 113 3L7 19l-4 1 1-4 12.5-12.5z" />
            </svg>
            Modifier
          </button>
          <button type="button" role="menuitem" onClick={() => { setOpen(false); onToggleStatus(identity); }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              {identity.status === 'ACTIVE' ? (
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
          <button type="button" role="menuitem" className="identities-action-danger" onClick={() => { setOpen(false); onDelete(identity); }}>
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

function IdentitiesPage() {
  const [identities, setIdentities] = useState(() => identitiesService.listIdentities());
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('Tous');
  const [sourceFilter, setSourceFilter] = useState('Tous');
  const [statusFilter, setStatusFilter] = useState('Tous');
  const [erpFilter, setErpFilter] = useState('Tous');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(7);
  const [selectedIdentity, setSelectedIdentity] = useState(null);
  const [activeTab, setActiveTab] = useState('Toutes');
  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState(null);

  const syncSelection = (list) => {
    if (!selectedIdentity) return;
    const refreshed = list.find((i) => i.id === selectedIdentity.id) || null;
    setSelectedIdentity(refreshed);
  };

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return identities.filter((item) => {
      const matchSearch = !q || `${item.firstName} ${item.lastName} ${item.email}`.toLowerCase().includes(q);
      const matchType = typeFilter === 'Tous' || item.type === typeFilter;
      const matchSource = sourceFilter === 'Tous' || item.source === sourceFilter;
      const matchStatus = statusFilter === 'Tous' || item.status === statusFilter;
      const matchErp = erpFilter === 'Tous' || (erpFilter === 'Liées' ? item.erpLink : !item.erpLink);
      const matchTab = activeTab === 'Toutes' || (
        activeTab === 'Principales' ? item.isPrimary :
        activeTab === 'Liées à ERP' ? item.erpLink :
        activeTab === 'Google/SSO' ? item.type === 'GOOGLE' || item.source === 'SSO' :
        activeTab === 'Invités' ? item.source === 'INVITE' :
        activeTab === 'Sans lien ERP' ? !item.erpLink :
        activeTab === 'Archivées' ? item.status === 'ARCHIVED' : true
      );
      return matchSearch && matchType && matchSource && matchStatus && matchErp && matchTab;
    });
  }, [identities, search, typeFilter, sourceFilter, statusFilter, erpFilter, activeTab]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const pageItems = filtered.slice((safePage - 1) * pageSize, safePage * pageSize);
  const showingFrom = filtered.length === 0 ? 0 : (safePage - 1) * pageSize + 1;
  const showingTo = Math.min(safePage * pageSize, filtered.length);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [totalPages, page]);

  const handleRowClick = (item) => {
    setSelectedIdentity(item);
  };

  const handleCreate = (payload) => {
    const created = identitiesService.createIdentity(payload);
    setIdentities(identitiesService.listIdentities());
    setCreateOpen(false);
    setSelectedIdentity(created);
    setPage(1);
  };

  const handleSave = (payload) => {
    identitiesService.updateIdentity(editTarget.id, payload);
    const next = identitiesService.listIdentities();
    setIdentities(next);
    syncSelection(next);
    setEditTarget(null);
  };

  const handleToggleStatus = (identity) => {
    const nextStatus = identity.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
    identitiesService.setIdentityStatus(identity.id, nextStatus);
    const next = identitiesService.listIdentities();
    setIdentities(next);
    syncSelection(next);
  };

  const handleDelete = (identity) => {
    const ok = window.confirm(`Supprimer définitivement ${identity.firstName} ${identity.lastName} ?`);
    if (!ok) return;
    identitiesService.deleteIdentity(identity.id);
    const next = identitiesService.listIdentities();
    setIdentities(next);
    if (selectedIdentity?.id === identity.id) {
      setSelectedIdentity(null);
    }
  };

  const tabs = ['Toutes', 'Principales', 'Liées à ERP', 'Google/SSO', 'Invités', 'Sans lien ERP', 'Archivées'];

  return (
    <div className="identities-page">
      <nav className="identities-breadcrumb">
        <span>Auth + IAM + Context</span>
        <span className="identities-breadcrumb-sep">/</span>
        <span className="identities-breadcrumb-current">Utilisateurs & Identités</span>
        <span className="identities-breadcrumb-sep">/</span>
        <span>Identités</span>
      </nav>

      <div className="identities-header">
        <div>
          <div className="identities-title-row">
            <h1 className="identities-title">Identités</h1>
            <button className="identities-info-btn" title="Information">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 16v-4" />
                <path d="M12 8h.01" />
              </svg>
            </button>
          </div>
          <p className="identities-subtitle">Gérez les identités numériques, leurs sources et leurs liaisons ERP.</p>
        </div>
      </div>

      <div className="identities-stats">
        {identityStats.map((stat) => (
          <div key={stat.label} className="identities-stat-card">
            <div className="identities-stat-icon" style={{ backgroundColor: `${stat.color}15`, color: stat.color }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="16" rx="2" />
                <circle cx="9" cy="12" r="2.5" />
                <path d="M15 8h2M15 12h2M15 16h2" />
              </svg>
            </div>
            <div className="identities-stat-content">
              <span className="identities-stat-value">{stat.value}</span>
              <span className="identities-stat-label">{stat.label}</span>
              <span className="identities-stat-context">{stat.context}</span>
            </div>
            <Sparkline data={stat.sparkline} color={stat.color} />
          </div>
        ))}
      </div>

      <div className="identities-tabs">
        {tabs.map((tab) => (
          <button key={tab} className={`identities-tab ${activeTab === tab ? 'identities-tab-active' : ''}`} onClick={() => { setActiveTab(tab); setPage(1); }}>
            {tab}
          </button>
        ))}
      </div>

      <div className="identities-toolbar">
        <div className="identities-toolbar-left">
          <div className="identities-search">
            <svg className="identities-search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" />
              <path d="M21 21l-4.35-4.35" />
            </svg>
            <input
              type="text"
              placeholder="Rechercher une identité..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="identities-search-input"
            />
          </div>
          <select className="identities-filter-select" value={typeFilter} onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}>
            <option>Tous</option>
            {TYPE_OPTIONS.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
          <select className="identities-filter-select" value={sourceFilter} onChange={(e) => { setSourceFilter(e.target.value); setPage(1); }}>
            <option>Tous</option>
            {SOURCE_OPTIONS.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          <select className="identities-filter-select" value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}>
            <option>Tous</option>
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          <select className="identities-filter-select" value={erpFilter} onChange={(e) => { setErpFilter(e.target.value); setPage(1); }}>
            <option>Tous</option>
            <option>Liées</option>
            <option>Non liées</option>
          </select>
          <button className="identities-filter-btn" title="Filtres avancés">
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
          <button className="identities-settings-btn" title="Paramètres d'affichage">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 01-2 2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 01-2 2 2 2 0 012-2h.09a1.65 1.65 0 00-1.51 1z" />
            </svg>
          </button>
        </div>
        <button type="button" className="identities-primary-btn" onClick={() => setCreateOpen(true)}>+ Nouvelle identité</button>
      </div>

      <div className="identities-main">
        <div className="identities-table-wrapper">
          <table className="identities-table">
            <thead>
              <tr>
                <th>Identité</th>
                <th>Type</th>
                <th>Source</th>
                <th>Identité principale</th>
                <th>Utilisateur lié</th>
                <th>Lien ERP</th>
                <th>Statut</th>
                <th>Créée le</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {pageItems.length === 0 && (
                <tr>
                  <td colSpan={9} className="identities-empty">Aucune identité ne correspond aux filtres.</td>
                </tr>
              )}
              {pageItems.map((item) => (
                <tr key={item.id} className={`identities-table-row ${selectedIdentity?.id === item.id ? 'identities-table-row-selected' : ''}`} onClick={() => handleRowClick(item)}>
                  <td>
                    <div className="identities-user-cell">
                      <div className="identities-user-avatar">{item.avatarInitials}</div>
                      <div>
                        <div className="identities-user-name">{item.firstName} {item.lastName}</div>
                        <div className="identities-user-email">{item.email}</div>
                      </div>
                    </div>
                  </td>
                  <td><span className="identities-type-badge">{item.type}</span></td>
                  <td>{item.source}</td>
                  <td>{item.isPrimary ? 'Oui' : 'Non'}</td>
                  <td>{item.linkedUser || '—'}</td>
                  <td>
                    {item.erpLink ? (
                      <span className="identities-erp-linked">{item.erpSource}</span>
                    ) : (
                      <span className="identities-erp-none">Non lié</span>
                    )}
                  </td>
                  <td>
                    <div className="identities-status-cell">
                      <span className="identities-status-dot" style={{ backgroundColor: item.status === 'ACTIVE' ? '#10b981' : item.status === 'SUSPENDED' ? '#f59e0b' : item.status === 'PENDING' ? '#3b82f6' : '#6b7280' }} />
                      <span>{item.status}</span>
                    </div>
                  </td>
                  <td>{item.createdAt}</td>
                  <td>
                    <div className="identities-actions-cell" onClick={(_e) => _e.stopPropagation()}>
                      <button className="identities-action-btn" title="Voir" onClick={() => handleRowClick(item)}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                          <circle cx="12" cy="12" r="3" />
                        </svg>
                      </button>
                      <ActionMenu
                        identity={item}
                        onView={handleRowClick}
                        onEdit={(identity) => setEditTarget(identity)}
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

        <div className="identities-side">
          {selectedIdentity ? (
            <div className="identity-detail-panel">
              <div className="identity-detail-header">
                <div className="identity-detail-identity">
                  <div className="identity-detail-avatar">{selectedIdentity.avatarInitials}</div>
                  <div>
                    <div className="identity-detail-name">{selectedIdentity.firstName} {selectedIdentity.lastName}</div>
                    <div className="identity-detail-email">{selectedIdentity.email}</div>
                  </div>
                </div>
                <span className={`identity-detail-status identity-detail-status-${selectedIdentity.status.toLowerCase()}`}>{selectedIdentity.status}</span>
              </div>

              <div className="identity-detail-pills">
                <span className="identity-detail-pill">{selectedIdentity.type}</span>
                {selectedIdentity.erpLink && <span className="identity-detail-pill identity-detail-pill-erp">ERP: {selectedIdentity.erpSource}</span>}
              </div>

              <div className="identity-detail-tabs">
                {['Résumé', 'Liaisons', 'Activité', 'Sécurité'].map((tab) => (
                  <button key={tab} className={`identity-detail-tab ${tab === 'Résumé' ? 'identity-detail-tab-active' : ''}`}>
                    {tab}
                  </button>
                ))}
              </div>

              <div className="identity-detail-fields">
                {[
                  { label: 'Identité principale', value: selectedIdentity.isPrimary ? 'Oui' : 'Non' },
                  { label: 'Identités liées', value: '1' },
                  { label: 'Téléphone', value: '+33 6 12 34 56 78' },
                  { label: 'Créée le', value: selectedIdentity.createdAt },
                  { label: 'Dernière activité', value: selectedIdentity.lastActivity },
                  { label: 'Langue', value: 'fr' },
                  { label: 'Fuseau horaire', value: 'Europe/Paris' },
                  { label: 'Préférences', value: 'Notifications activées' },
                ].map((field) => (
                  <div key={field.label} className="identity-detail-field">
                    <span className="identity-detail-field-label">{field.label}</span>
                    <span className="identity-detail-field-value">{field.value}</span>
                  </div>
                ))}
              </div>

              <div className="identity-detail-actions">
                <button type="button" className="identity-detail-btn identity-detail-btn-primary" onClick={() => setEditTarget(selectedIdentity)}>Modifier</button>
                <button type="button" className="identity-detail-btn identity-detail-btn-secondary">Voir les liaisons</button>
                <button type="button" className="identity-detail-btn identity-detail-btn-danger" onClick={() => handleDelete(selectedIdentity)}>Archiver</button>
              </div>
            </div>
          ) : (
            <div className="identity-detail-panel identity-detail-empty">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--color-text-muted)' }}>
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
              <p>Sélectionnez une identité pour afficher les détails</p>
            </div>
          )}
        </div>
      </div>

      <div className="identities-pagination">
        <span className="identities-pagination-info">
          {filtered.length === 0 ? 'Aucune identité' : `Affichage ${showingFrom} à ${showingTo} sur ${filtered.length} identité${filtered.length > 1 ? 's' : ''}`}
        </span>
        <div className="identities-pagination-controls">
          <button type="button" className="identities-page-btn" disabled={safePage === 1} onClick={() => setPage(safePage - 1)}>‹</button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              type="button"
              className={`identities-page-btn ${p === safePage ? 'identities-page-btn-active' : ''}`}
              onClick={() => setPage(p)}
            >
              {p}
            </button>
          ))}
          <button type="button" className="identities-page-btn" disabled={safePage === totalPages} onClick={() => setPage(safePage + 1)}>›</button>
        </div>
        <select
          className="identities-page-size"
          value={pageSize}
          onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }}
        >
          <option value="7">7 / page</option>
          <option value="10">10 / page</option>
          <option value="25">25 / page</option>
        </select>
      </div>

      <NewIdentityModal open={createOpen} onClose={() => setCreateOpen(false)} onCreate={handleCreate} />
      <EditIdentityModal open={Boolean(editTarget)} identity={editTarget} onClose={() => setEditTarget(null)} onSave={handleSave} />

      <div className="identities-bottom-cards">
        <div className="identities-bottom-card">
          <div className="identities-bottom-card-header">
            <h3 className="identities-bottom-card-title">Identités par type</h3>
            <a href="#type" className="identities-bottom-card-link">Voir le rapport complet →</a>
          </div>
          <DonutChart data={identityTypeStats} size={170} />
        </div>

        <div className="identities-bottom-card">
          <div className="identities-bottom-card-header">
            <h3 className="identities-bottom-card-title">Identités par source</h3>
            <a href="#source" className="identities-bottom-card-link">Voir le rapport complet →</a>
          </div>
          <DonutChart data={identitySourceStats} size={170} />
        </div>

        <div className="identities-bottom-card">
          <div className="identities-bottom-card-header">
            <h3 className="identities-bottom-card-title">Identités liées à ERP</h3>
            <a href="#erp" className="identities-bottom-card-link">Voir le rapport complet →</a>
          </div>
          <DonutChart data={identityErpLinkStats} size={170} />
        </div>
      </div>

      <div className="identities-top-card">
        <div className="identities-top-card-header">
          <h3 className="identities-top-card-title">Top identités non liées à ERP</h3>
          <a href="#top-unlinked" className="identities-top-card-link">Voir toutes les identités →</a>
        </div>
        <div className="identities-top-list">
          {topUnlinkedIdentities.map((item, i) => (
            <div key={i} className="identities-top-item">
              <div className="identities-top-info">
                <div className="identities-top-user">
                  <div className="identities-top-avatar">{item.avatarInitials}</div>
                  <div>
                    <span className="identities-top-name">{item.name}</span>
                    <span className="identities-top-email">{item.email}</span>
                  </div>
                </div>
                <span className="identities-top-status">{item.status === 'ACTIVE' ? 'Actif' : 'En attente'}</span>
              </div>
              <div className="identities-top-badge">Jamais lié</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default IdentitiesPage;