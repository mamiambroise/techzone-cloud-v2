import { useState, useMemo, useEffect, useRef } from 'react';
import * as policiesService from '../../services/policiesMockService';
import './PoliciesPage.css';

const TYPE_OPTIONS = ['system', 'custom'];
const EFFECT_OPTIONS = ['ALLOW', 'DENY'];
const STATUS_OPTIONS = ['active', 'inactive'];

function emptyForm() {
  return {
    name: '',
    type: 'custom',
    effect: 'ALLOW',
    priority: 100,
    description: '',
    subject: '',
    resource: '',
    action: '',
    conditions: '',
  };
}

function NewPolicyModal({ open, onClose, onCreate }) {
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
      setError('Le nom de la policy est obligatoire.');
      return;
    }
    onCreate(form);
  };

  return (
    <div className="policies-modal-backdrop" onClick={onClose}>
      <div className="policies-modal" onClick={(e) => e.stopPropagation()}>
        <div className="policies-modal-header">
          <h2 className="policies-modal-title">Nouvelle policy</h2>
          <button type="button" className="policies-modal-close" onClick={onClose} aria-label="Fermer">×</button>
        </div>
        <form className="policies-modal-form" onSubmit={submit}>
          <label className="policies-modal-field">
            <span>Nom *</span>
            <input ref={firstFieldRef} type="text" value={form.name} onChange={(e) => update('name', e.target.value)} />
          </label>
          <div className="policies-modal-row">
            <label className="policies-modal-field">
              <span>Type</span>
              <select value={form.type} onChange={(e) => update('type', e.target.value)}>
                {TYPE_OPTIONS.map((t) => (
                  <option key={t} value={t}>{t === 'system' ? 'Système' : 'Personnalisé'}</option>
                ))}
              </select>
            </label>
            <label className="policies-modal-field">
              <span>Effet</span>
              <select value={form.effect} onChange={(e) => update('effect', e.target.value)}>
                {EFFECT_OPTIONS.map((e) => (
                  <option key={e} value={e}>{e}</option>
                ))}
              </select>
            </label>
          </div>
          <div className="policies-modal-row">
            <label className="policies-modal-field">
              <span>Priorité</span>
              <input type="number" value={form.priority} onChange={(e) => update('priority', e.target.value)} min={0} max={1000} />
            </label>
            <label className="policies-modal-field">
              <span>Statut</span>
              <select value={form.status} onChange={(e) => update('status', e.target.value)}>
                {STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s}>{s === 'active' ? 'Actif' : 'Inactif'}</option>
                ))}
              </select>
            </label>
          </div>
          <label className="policies-modal-field">
            <span>Description</span>
            <textarea value={form.description} onChange={(e) => update('description', e.target.value)} rows={2} />
          </label>
          <label className="policies-modal-field">
            <span>Subject</span>
            <input type="text" value={form.subject} onChange={(e) => update('subject', e.target.value)} placeholder="ex: role:Admin" />
          </label>
          <div className="policies-modal-row">
            <label className="policies-modal-field">
              <span>Resource</span>
              <input type="text" value={form.resource} onChange={(e) => update('resource', e.target.value)} placeholder="ex: users" />
            </label>
            <label className="policies-modal-field">
              <span>Action</span>
              <input type="text" value={form.action} onChange={(e) => update('action', e.target.value)} placeholder="ex: read" />
            </label>
          </div>
          <label className="policies-modal-field">
            <span>Conditions</span>
            <textarea value={form.conditions} onChange={(e) => update('conditions', e.target.value)} rows={2} placeholder="ex: mfa.enabled == true" />
          </label>
          {error && <div className="policies-modal-error">{error}</div>}
          <div className="policies-modal-actions">
            <button type="button" className="policies-modal-btn-secondary" onClick={onClose}>Annuler</button>
            <button type="submit" className="policies-primary-btn">Créer la policy</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function EditPolicyModal({ open, policy, onClose, onSave }) {
  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    if (open && policy) {
      setForm({
        name: policy.name || '',
        type: policy.type || 'custom',
        effect: policy.effect || 'ALLOW',
        priority: policy.priority || 100,
        status: policy.status || 'active',
        description: policy.description || '',
        subject: policy.subject || '',
        resource: policy.resource || '',
        action: policy.action || '',
        conditions: policy.conditions || '',
      });
    }
  }, [open, policy]);

  if (!open || !policy) return null;

  const update = (field, value) => setForm((f) => ({ ...f, [field]: value }));

  const submit = (e) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    onSave(form);
  };

  return (
    <div className="policies-modal-backdrop" onClick={onClose}>
      <div className="policies-modal" onClick={(e) => e.stopPropagation()}>
        <div className="policies-modal-header">
          <h2 className="policies-modal-title">Modifier la policy</h2>
          <button type="button" className="policies-modal-close" onClick={onClose} aria-label="Fermer">×</button>
        </div>
        <form className="policies-modal-form" onSubmit={submit}>
          <label className="policies-modal-field">
            <span>Nom</span>
            <input type="text" value={form.name} onChange={(e) => update('name', e.target.value)} />
          </label>
          <div className="policies-modal-row">
            <label className="policies-modal-field">
              <span>Type</span>
              <select value={form.type} onChange={(e) => update('type', e.target.value)}>
                {TYPE_OPTIONS.map((t) => (
                  <option key={t} value={t}>{t === 'system' ? 'Système' : 'Personnalisé'}</option>
                ))}
              </select>
            </label>
            <label className="policies-modal-field">
              <span>Effet</span>
              <select value={form.effect} onChange={(e) => update('effect', e.target.value)}>
                {EFFECT_OPTIONS.map((e) => (
                  <option key={e} value={e}>{e}</option>
                ))}
              </select>
            </label>
          </div>
          <div className="policies-modal-row">
            <label className="policies-modal-field">
              <span>Priorité</span>
              <input type="number" value={form.priority} onChange={(e) => update('priority', e.target.value)} min={0} max={1000} />
            </label>
            <label className="policies-modal-field">
              <span>Statut</span>
              <select value={form.status} onChange={(e) => update('status', e.target.value)}>
                {STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s}>{s === 'active' ? 'Actif' : 'Inactif'}</option>
                ))}
              </select>
            </label>
          </div>
          <label className="policies-modal-field">
            <span>Description</span>
            <textarea value={form.description} onChange={(e) => update('description', e.target.value)} rows={2} />
          </label>
          <label className="policies-modal-field">
            <span>Subject</span>
            <input type="text" value={form.subject} onChange={(e) => update('subject', e.target.value)} />
          </label>
          <div className="policies-modal-row">
            <label className="policies-modal-field">
              <span>Resource</span>
              <input type="text" value={form.resource} onChange={(e) => update('resource', e.target.value)} />
            </label>
            <label className="policies-modal-field">
              <span>Action</span>
              <input type="text" value={form.action} onChange={(e) => update('action', e.target.value)} />
            </label>
          </div>
          <label className="policies-modal-field">
            <span>Conditions</span>
            <textarea value={form.conditions} onChange={(e) => update('conditions', e.target.value)} rows={2} />
          </label>
          <div className="policies-modal-actions">
            <button type="button" className="policies-modal-btn-secondary" onClick={onClose}>Annuler</button>
            <button type="submit" className="policies-primary-btn">Enregistrer</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ActionMenu({ policy, onView, onEdit, onToggleStatus, onDelete }) {
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

  const nextStatusLabel = policy.status === 'active' ? 'Désactiver' : 'Activer';

  return (
    <div className="policies-action-menu" ref={ref}>
      <button
        type="button"
        className="policies-action-btn"
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
        <div className="policies-action-dropdown" role="menu">
          <button type="button" role="menuitem" onClick={() => { setOpen(false); onView(policy); }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
            Voir
          </button>
          <button type="button" role="menuitem" onClick={() => { setOpen(false); onEdit(policy); }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 20h9" />
              <path d="M16.5 3.5a2.121 2.121 0 113 3L7 19l-4 1 1-4 12.5-12.5z" />
            </svg>
            Modifier
          </button>
          <button type="button" role="menuitem" onClick={() => { setOpen(false); onToggleStatus(policy); }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              {policy.status === 'active' ? (
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
          <button type="button" role="menuitem" className="policies-action-danger" onClick={() => { setOpen(false); onDelete(policy); }}>
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

function PoliciesPage() {
  const [policies, setPolicies] = useState(() => policiesService.listPolicies());
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('Tous');
  const [effectFilter, setEffectFilter] = useState('Tous');
  const [statusFilter, setStatusFilter] = useState('Tous');
  const [pageSize, setPageSize] = useState(7);
  const [page, setPage] = useState(1);
  const [selectedPolicy, setSelectedPolicy] = useState(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState(null);

  const syncSelection = (list) => {
    if (!selectedPolicy) return;
    const refreshed = list.find((p) => p.id === selectedPolicy.id) || null;
    setSelectedPolicy(refreshed);
  };

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return policies.filter((p) => {
      const matchSearch = !q || `${p.name} ${p.description} ${p.subject} ${p.resource}`.toLowerCase().includes(q);
      const matchType = typeFilter === 'Tous' || p.type === typeFilter;
      const matchEffect = effectFilter === 'Tous' || p.effect === effectFilter;
      const matchStatus = statusFilter === 'Tous' || p.status === statusFilter;
      return matchSearch && matchType && matchEffect && matchStatus;
    });
  }, [policies, search, typeFilter, effectFilter, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const pagePolicies = filtered.slice((safePage - 1) * pageSize, safePage * pageSize);
  const showingFrom = filtered.length === 0 ? 0 : (safePage - 1) * pageSize + 1;
  const showingTo = Math.min(safePage * pageSize, filtered.length);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [totalPages, page]);

  const handleRowClick = (policy) => {
    setSelectedPolicy(policy);
  };

  const handleCreate = (payload) => {
    const created = policiesService.createPolicy(payload);
    setPolicies(policiesService.listPolicies());
    setCreateOpen(false);
    setSelectedPolicy(created);
    setPage(1);
  };

  const handleSave = (payload) => {
    policiesService.updatePolicy(editTarget.id, payload);
    const next = policiesService.listPolicies();
    setPolicies(next);
    syncSelection(next);
    setEditTarget(null);
  };

  const handleToggleStatus = (policy) => {
    const nextStatus = policy.status === 'active' ? 'inactive' : 'active';
    policiesService.setPolicyStatus(policy.id, nextStatus);
    const next = policiesService.listPolicies();
    setPolicies(next);
    syncSelection(next);
  };

  const handleDelete = (policy) => {
    const ok = window.confirm(`Supprimer définitivement la policy « ${policy.name} » ?`);
    if (!ok) return;
    policiesService.deletePolicy(policy.id);
    const next = policiesService.listPolicies();
    setPolicies(next);
    if (selectedPolicy?.id === policy.id) {
      setSelectedPolicy(null);
    }
  };

  const stats = useMemo(() => {
    const total = policies.length;
    const activePolicies = policies.filter((p) => p.status === 'active').length;
    const allowPolicies = policies.filter((p) => p.effect === 'ALLOW').length;
    const denyPolicies = policies.filter((p) => p.effect === 'DENY').length;
    return [
      { label: 'Policies', value: String(total), context: 'Règles enregistrées', icon: 'policy', color: '#2563eb' },
      { label: 'Policies actives', value: String(activePolicies), context: 'En application', icon: 'active', color: '#10b981' },
      { label: 'Règles ALLOW', value: String(allowPolicies), context: 'Autorisations', icon: 'allow', color: '#7c3aed' },
      { label: 'Règles DENY', value: String(denyPolicies), context: 'Interdictions', icon: 'deny', color: '#ef4444' },
    ];
  }, [policies]);

  return (
    <div className="policies-page">
      <nav className="policies-breadcrumb">
        <span>Auth + IAM + Context</span>
        <span className="policies-breadcrumb-sep">/</span>
        <span className="policies-breadcrumb-current">Accès & Policies</span>
      </nav>

      <div className="policies-header">
        <div>
          <div className="policies-title-row">
            <h1 className="policies-title">Accès & Policies</h1>
            <button className="policies-info-btn" title="Information">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 16v-4" />
                <path d="M12 8h.01" />
              </svg>
            </button>
          </div>
          <p className="policies-subtitle">Gérez les policies d'accès, leurs effets et leurs conditions.</p>
        </div>
      </div>

      <div className="policies-stats">
        {stats.map((stat) => (
          <div key={stat.label} className="policies-stat-card">
            <div className="policies-stat-icon" style={{ backgroundColor: `${stat.color}15`, color: stat.color }}>
              <StatIcon name={stat.icon} />
            </div>
            <div className="policies-stat-content">
              <span className="policies-stat-value">{stat.value}</span>
              <span className="policies-stat-label">{stat.label}</span>
              <span className="policies-stat-context">{stat.context}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="policies-toolbar">
        <div className="policies-toolbar-left">
          <div className="policies-search">
            <svg className="policies-search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" />
              <path d="M21 21l-4.35-4.35" />
            </svg>
            <input
              type="text"
              placeholder="Rechercher une policy..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="policies-search-input"
            />
          </div>
          <select className="policies-filter-select" value={typeFilter} onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}>
            <option value="Tous">Tous (type)</option>
            {TYPE_OPTIONS.map((t) => (
              <option key={t} value={t}>{t === 'system' ? 'Système' : 'Personnalisé'}</option>
            ))}
          </select>
          <select className="policies-filter-select" value={effectFilter} onChange={(e) => { setEffectFilter(e.target.value); setPage(1); }}>
            <option value="Tous">Tous (effet)</option>
            {EFFECT_OPTIONS.map((e) => (
              <option key={e} value={e}>{e}</option>
            ))}
          </select>
          <select className="policies-filter-select" value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}>
            <option value="Tous">Tous (statut)</option>
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>{s === 'active' ? 'Actif' : 'Inactif'}</option>
            ))}
          </select>
          <button className="policies-filter-btn" title="Filtres avancés">
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
        <button type="button" className="policies-primary-btn" onClick={() => setCreateOpen(true)}>+ Nouvelle policy</button>
      </div>

      <div className="policies-main">
        <div className="policies-table-wrapper">
          <table className="policies-table">
            <thead>
              <tr>
                <th>Policy</th>
                <th>Type</th>
                <th>Effet</th>
                <th>Priorité</th>
                <th>Statut</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {pagePolicies.length === 0 && (
                <tr>
                  <td colSpan={6} className="policies-empty">Aucune policy ne correspond aux filtres.</td>
                </tr>
              )}
              {pagePolicies.map((p) => (
                <tr key={p.id} className={`policies-table-row ${selectedPolicy?.id === p.id ? 'policies-table-row-selected' : ''}`} onClick={() => handleRowClick(p)}>
                  <td>
                    <div className="policies-policy-cell">
                      <div className="policies-policy-avatar">{p.name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()}</div>
                      <div>
                        <div className="policies-policy-name">{p.name}</div>
                        <div className="policies-policy-desc">{p.description}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className={`policies-type-badge policies-type-badge-${p.type}`}>{p.type === 'system' ? 'Système' : 'Personnalisé'}</span>
                  </td>
                  <td>
                    <span className={`policies-effect-badge policies-effect-badge-${p.effect.toLowerCase()}`}>{p.effect}</span>
                  </td>
                  <td>{p.priority}</td>
                  <td>
                    <div className="policies-status-cell">
                      <span className="policies-status-dot" style={{ backgroundColor: p.status === 'active' ? '#10b981' : '#6b7280' }} />
                      <span>{p.status === 'active' ? 'Actif' : 'Inactif'}</span>
                    </div>
                  </td>
                  <td>
                    <div className="policies-actions-cell" onClick={(e) => e.stopPropagation()}>
                      <button type="button" className="policies-action-btn" title="Voir" onClick={() => handleRowClick(p)}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                          <circle cx="12" cy="12" r="3" />
                        </svg>
                      </button>
                      <ActionMenu
                        policy={p}
                        onView={handleRowClick}
                        onEdit={(policy) => setEditTarget(policy)}
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

        <div className="policies-side">
          {selectedPolicy ? (
            <div className="policy-detail-panel">
              <div className="policy-detail-header">
                <div className="policy-detail-identity">
                  <div className="policy-detail-avatar">{selectedPolicy.name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()}</div>
                  <div>
                    <div className="policy-detail-name">{selectedPolicy.name}</div>
                    <div className="policy-detail-desc">{selectedPolicy.description}</div>
                  </div>
                </div>
                <span className={`policies-detail-status policies-detail-status-${selectedPolicy.status}`}>{selectedPolicy.status === 'active' ? 'Actif' : 'Inactif'}</span>
              </div>

              <div className="policy-detail-pills">
                <span className={`policy-detail-pill policy-detail-pill-${selectedPolicy.type}`}>{selectedPolicy.type === 'system' ? 'Système' : 'Personnalisé'}</span>
                <span className={`policy-detail-pill policy-detail-pill-effect-${selectedPolicy.effect.toLowerCase()}`}>{selectedPolicy.effect}</span>
                <span className="policy-detail-pill">Priorité {selectedPolicy.priority}</span>
              </div>

              <div className="policy-detail-tabs">
                {['Résumé', 'Sélecteurs', 'Conditions', 'Historique'].map((tab) => (
                  <button key={tab} className={`policy-detail-tab ${tab === 'Résumé' ? 'policy-detail-tab-active' : ''}`}>
                    {tab}
                  </button>
                ))}
              </div>

              <div className="policy-detail-fields">
                {[
                  { label: 'Subject', value: selectedPolicy.subject || '—' },
                  { label: 'Resource', value: selectedPolicy.resource || '—' },
                  { label: 'Action', value: selectedPolicy.action || '—' },
                  { label: 'Effet', value: selectedPolicy.effect },
                  { label: 'Priorité', value: String(selectedPolicy.priority) },
                  { label: 'Statut', value: selectedPolicy.status },
                  { label: 'Créée le', value: selectedPolicy.createdAt },
                ].map((field) => (
                  <div key={field.label} className="policy-detail-field">
                    <span className="policy-detail-field-label">{field.label}</span>
                    <span className="policy-detail-field-value">{field.value}</span>
                  </div>
                ))}
              </div>

              <div className="policy-detail-conditions">
                <h4 className="policy-detail-conditions-title">Conditions</h4>
                {selectedPolicy.conditions ? (
                  <pre className="policy-detail-conditions-code">{selectedPolicy.conditions}</pre>
                ) : (
                  <p className="policy-detail-conditions-empty">Aucune condition définie.</p>
                )}
              </div>

              <div className="policy-detail-actions">
                <button type="button" className="policy-detail-btn policy-detail-btn-primary" onClick={() => setEditTarget(selectedPolicy)}>Modifier</button>
                <button type="button" className="policy-detail-btn policy-detail-btn-secondary" onClick={() => handleToggleStatus(selectedPolicy)}>
                  {selectedPolicy.status === 'active' ? 'Désactiver' : 'Activer'}
                </button>
                <button type="button" className="policy-detail-btn policy-detail-btn-danger" onClick={() => handleDelete(selectedPolicy)}>Supprimer</button>
              </div>
            </div>
          ) : (
            <div className="policy-detail-panel policy-detail-empty">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--color-text-muted)' }}>
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
              <p>Sélectionnez une policy pour afficher les détails</p>
            </div>
          )}
        </div>
      </div>

      <div className="policies-pagination">
        <span className="policies-pagination-info">
          {filtered.length === 0
            ? 'Aucune policy'
            : `Affichage ${showingFrom} à ${showingTo} sur ${filtered.length} policy${filtered.length > 1 ? 's' : ''}`}
        </span>
        <div className="policies-pagination-controls">
          <button type="button" className="policies-page-btn" disabled={safePage === 1} onClick={() => setPage(safePage - 1)}>‹</button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              type="button"
              className={`policies-page-btn ${p === safePage ? 'policies-page-btn-active' : ''}`}
              onClick={() => setPage(p)}
            >
              {p}
            </button>
          ))}
          <button type="button" className="policies-page-btn" disabled={safePage === totalPages} onClick={() => setPage(safePage + 1)}>›</button>
        </div>
        <select
          className="policies-page-size"
          value={pageSize}
          onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }}
        >
          <option value="7">7 / page</option>
          <option value="10">10 / page</option>
          <option value="25">25 / page</option>
        </select>
      </div>

      <NewPolicyModal open={createOpen} onClose={() => setCreateOpen(false)} onCreate={handleCreate} />
      <EditPolicyModal open={Boolean(editTarget)} policy={editTarget} onClose={() => setEditTarget(null)} onSave={handleSave} />
    </div>
  );
}

function StatIcon({ name }) {
  const props = { width: 18, height: 18, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' };
  if (name === 'policy') {
    return (
      <svg {...props}>
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
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
  if (name === 'allow') {
    return (
      <svg {...props}>
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
        <polyline points="22 4 12 14.01 9 11.01" />
      </svg>
    );
  }
  if (name === 'deny') {
    return (
      <svg {...props}>
        <circle cx="12" cy="12" r="10" />
        <line x1="15" y1="9" x2="9" y2="15" />
        <line x1="9" y1="9" x2="15" y2="15" />
      </svg>
    );
  }
  return null;
}

export default PoliciesPage;
