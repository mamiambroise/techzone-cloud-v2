import { useState, useMemo, useEffect, useRef } from 'react';
import * as rolesService from '../../services/rolesMockService';
import { permissions } from '../../data/mock';
import './RolesPage.css';

const TYPE_OPTIONS = ['system', 'custom'];
const SCOPE_OPTIONS = ['global', 'tenant'];
const STATUS_OPTIONS = ['active', 'archived'];

function emptyForm() {
  return {
    name: '',
    type: 'custom',
    scope: 'global',
    description: '',
  };
}

function NewRoleModal({ open, onClose, onCreate }) {
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
      setError('Le nom du rôle est obligatoire.');
      return;
    }
    onCreate(form);
  };

  return (
    <div className="roles-modal-backdrop" onClick={onClose}>
      <div className="roles-modal" onClick={(e) => e.stopPropagation()}>
        <div className="roles-modal-header">
          <h2 className="roles-modal-title">Nouveau rôle</h2>
          <button type="button" className="roles-modal-close" onClick={onClose} aria-label="Fermer">×</button>
        </div>
        <form className="roles-modal-form" onSubmit={submit}>
          <label className="roles-modal-field">
            <span>Nom *</span>
            <input ref={firstFieldRef} type="text" value={form.name} onChange={(e) => update('name', e.target.value)} />
          </label>
          <div className="roles-modal-row">
            <label className="roles-modal-field">
              <span>Type</span>
              <select value={form.type} onChange={(e) => update('type', e.target.value)}>
                {TYPE_OPTIONS.map((t) => (
                  <option key={t} value={t}>{t === 'system' ? 'Système' : 'Personnalisé'}</option>
                ))}
              </select>
            </label>
            <label className="roles-modal-field">
              <span>Scope</span>
              <select value={form.scope} onChange={(e) => update('scope', e.target.value)}>
                {SCOPE_OPTIONS.map((s) => (
                  <option key={s} value={s}>{s === 'global' ? 'Global' : 'Tenant'}</option>
                ))}
              </select>
            </label>
          </div>
          <label className="roles-modal-field">
            <span>Description</span>
            <textarea value={form.description} onChange={(e) => update('description', e.target.value)} rows={3} />
          </label>
          {error && <div className="roles-modal-error">{error}</div>}
          <div className="roles-modal-actions">
            <button type="button" className="roles-modal-btn-secondary" onClick={onClose}>Annuler</button>
            <button type="submit" className="roles-primary-btn">Créer le rôle</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function EditRoleModal({ open, role, onClose, onSave }) {
  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    if (open && role) {
      setForm({
        name: role.name || '',
        type: role.type || 'custom',
        scope: role.scope || 'global',
        description: role.description || '',
      });
    }
  }, [open, role]);

  if (!open || !role) return null;

  const update = (field, value) => setForm((f) => ({ ...f, [field]: value }));

  const submit = (e) => {
    e.preventDefault();
    if (!form.name.trim() || role.isSystem) return;
    onSave(form);
  };

  return (
    <div className="roles-modal-backdrop" onClick={onClose}>
      <div className="roles-modal" onClick={(e) => e.stopPropagation()}>
        <div className="roles-modal-header">
          <h2 className="roles-modal-title">Modifier le rôle</h2>
          <button type="button" className="roles-modal-close" onClick={onClose} aria-label="Fermer">×</button>
        </div>
        <form className="roles-modal-form" onSubmit={submit}>
          <label className="roles-modal-field">
            <span>Nom</span>
            <input type="text" value={form.name} onChange={(e) => update('name', e.target.value)} disabled={role.isSystem} />
          </label>
          <div className="roles-modal-row">
            <label className="roles-modal-field">
              <span>Type</span>
              <select value={form.type} onChange={(e) => update('type', e.target.value)} disabled={role.isSystem}>
                {TYPE_OPTIONS.map((t) => (
                  <option key={t} value={t}>{t === 'system' ? 'Système' : 'Personnalisé'}</option>
                ))}
              </select>
            </label>
            <label className="roles-modal-field">
              <span>Scope</span>
              <select value={form.scope} onChange={(e) => update('scope', e.target.value)}>
                {SCOPE_OPTIONS.map((s) => (
                  <option key={s} value={s}>{s === 'global' ? 'Global' : 'Tenant'}</option>
                ))}
              </select>
            </label>
          </div>
          <label className="roles-modal-field">
            <span>Description</span>
            <textarea value={form.description} onChange={(e) => update('description', e.target.value)} rows={3} disabled={role.isSystem} />
          </label>
          {role.isSystem && <div className="roles-modal-warning">Les rôles système ne sont pas modifiables.</div>}
          <div className="roles-modal-actions">
            <button type="button" className="roles-modal-btn-secondary" onClick={onClose}>Annuler</button>
            <button type="submit" className="roles-primary-btn" disabled={role.isSystem}>Enregistrer</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function PermissionsModal({ open, role, onClose, onSave }) {
  const [selected, setSelected] = useState([]);

  useEffect(() => {
    if (open && role) {
      setSelected(rolesService.listRolePermissions(role.id).map((p) => p.id));
    }
  }, [open, role]);

  if (!open || !role) return null;

  const toggle = (id) => {
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const handleSave = () => {
    const current = rolesService.listRolePermissions(role.id).map((p) => p.id);
    const toAdd = selected.filter((id) => !current.includes(id));
    const toRemove = current.filter((id) => !selected.includes(id));
    let result = rolesService.listRolePermissions(role.id);
    toAdd.forEach((id) => {
      result = rolesService.assignPermission(role.id, id);
    });
    toRemove.forEach((id) => {
      result = rolesService.removePermission(role.id, id);
    });
    onSave(result);
  };

  return (
    <div className="roles-modal-backdrop" onClick={onClose}>
      <div className="roles-modal" onClick={(e) => e.stopPropagation()}>
        <div className="roles-modal-header">
          <h2 className="roles-modal-title">Permissions de « {role.name} »</h2>
          <button type="button" className="roles-modal-close" onClick={onClose} aria-label="Fermer">×</button>
        </div>
        <div className="roles-modal-form">
          {role.isSystem && <div className="roles-modal-warning">Les permissions des rôles système ne peuvent pas être modifiées.</div>}
          <div className="roles-permissions-list">
            {permissions.map((perm) => {
              const checked = selected.includes(perm.id);
              const disabled = role.isSystem;
              return (
                <label key={perm.id} className={`roles-permission-item ${checked ? 'is-selected' : ''} ${disabled ? 'is-disabled' : ''}`}>
                  <input type="checkbox" checked={checked} onChange={() => toggle(perm.id)} disabled={disabled} />
                  <div className="roles-permission-info">
                    <span className="roles-permission-name">{perm.name}</span>
                    <span className="roles-permission-desc">{perm.description}</span>
                  </div>
                  <span className={`roles-permission-effect roles-permission-effect-${perm.effect.toLowerCase()}`}>{perm.effect}</span>
                </label>
              );
            })}
          </div>
          <div className="roles-modal-actions">
            <button type="button" className="roles-modal-btn-secondary" onClick={onClose}>Annuler</button>
            <button type="button" className="roles-primary-btn" onClick={handleSave} disabled={role.isSystem}>Enregistrer</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ActionMenu({ role, onView, onEdit, onArchive, onManagePermissions, onDelete }) {
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

  return (
    <div className="roles-action-menu" ref={ref}>
      <button
        type="button"
        className="roles-action-btn"
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
        <div className="roles-action-dropdown" role="menu">
          <button type="button" role="menuitem" onClick={() => { setOpen(false); onView(role); }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
            Voir
          </button>
          <button type="button" role="menuitem" onClick={() => { setOpen(false); onEdit(role); }} disabled={role.isSystem}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 20h9" />
              <path d="M16.5 3.5a2.121 2.121 0 113 3L7 19l-4 1 1-4 12.5-12.5z" />
            </svg>
            Modifier
          </button>
          <button type="button" role="menuitem" onClick={() => { setOpen(false); onManagePermissions(role); }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0110 0v4" />
            </svg>
            Gérer les permissions
          </button>
          <button type="button" role="menuitem" onClick={() => { setOpen(false); onArchive(role); }} disabled={role.isSystem}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="21 8 21 21 8 21" />
              <path d="M3 3h18v18H3z" />
            </svg>
            Archiver
          </button>
          <button type="button" role="menuitem" className={`roles-action-danger ${role.isSystem ? 'is-disabled' : ''}`} onClick={() => { if (!role.isSystem) { setOpen(false); onDelete(role); } }} disabled={role.isSystem}>
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

function RolesPage() {
  const [roles, setRoles] = useState(() => rolesService.listRoles());
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('Tous');
  const [scopeFilter, setScopeFilter] = useState('Tous');
  const [statusFilter, setStatusFilter] = useState('Tous');
  const [pageSize, setPageSize] = useState(7);
  const [page, setPage] = useState(1);
  const [selectedRole, setSelectedRole] = useState(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [permissionsTarget, setPermissionsTarget] = useState(null);

  const syncSelection = (list) => {
    if (!selectedRole) return;
    const refreshed = list.find((r) => r.id === selectedRole.id) || null;
    setSelectedRole(refreshed);
  };

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return roles.filter((r) => {
      const matchSearch = !q || `${r.name} ${r.description}`.toLowerCase().includes(q);
      const matchType = typeFilter === 'Tous' || r.type === typeFilter;
      const matchScope = scopeFilter === 'Tous' || r.scope === scopeFilter;
      const matchStatus = statusFilter === 'Tous' || r.status === statusFilter;
      return matchSearch && matchType && matchScope && matchStatus;
    });
  }, [roles, search, typeFilter, scopeFilter, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const pageRoles = filtered.slice((safePage - 1) * pageSize, safePage * pageSize);
  const showingFrom = filtered.length === 0 ? 0 : (safePage - 1) * pageSize + 1;
  const showingTo = Math.min(safePage * pageSize, filtered.length);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [totalPages, page]);

  const handleRowClick = (role) => {
    setSelectedRole(role);
  };

  const handleCreate = (payload) => {
    const created = rolesService.createRole(payload);
    setRoles(rolesService.listRoles());
    setCreateOpen(false);
    setSelectedRole(created);
    setPage(1);
  };

  const handleSave = (payload) => {
    if (editTarget?.isSystem) return;
    rolesService.updateRole(editTarget.id, payload);
    const next = rolesService.listRoles();
    setRoles(next);
    syncSelection(next);
    setEditTarget(null);
  };

  const handleArchive = (role) => {
    if (role.isSystem) return;
    const ok = window.confirm(`Archiver le rôle « ${role.name} » ?`);
    if (!ok) return;
    rolesService.archiveRole(role.id);
    const next = rolesService.listRoles();
    setRoles(next);
    syncSelection(next);
  };

  const handleDelete = (role) => {
    if (role.isSystem) return;
    const ok = window.confirm(`Supprimer définitivement le rôle « ${role.name} » ?`);
    if (!ok) return;
    rolesService.deleteRole(role.id);
    const next = rolesService.listRoles();
    setRoles(next);
    if (selectedRole?.id === role.id) {
      setSelectedRole(null);
    }
  };

  const handleSavePermissions = () => {
    const next = rolesService.listRoles();
    setRoles(next);
    syncSelection(next);
    setPermissionsTarget(null);
  };

  const selectedPermissions = useMemo(() => {
    if (!selectedRole) return [];
    return rolesService.listRolePermissions(selectedRole.id);
  }, [selectedRole]);

  const stats = useMemo(() => {
    const total = roles.length;
    const systemRoles = roles.filter((r) => r.type === 'system').length;
    const customRoles = roles.filter((r) => r.type === 'custom').length;
    const totalPerms = permissions.length;
    const activeAssignments = roles.reduce((sum, r) => sum + rolesService.getRoleAssignmentCount(r.id), 0);
    return [
      { label: 'Rôles', value: String(total), context: 'Comptes enregistrés', icon: 'role', color: '#2563eb' },
      { label: 'Rôles système', value: String(systemRoles), context: `${customRoles} personnalisés`, icon: 'system', color: '#7c3aed' },
      { label: 'Permissions', value: String(totalPerms), context: 'Règles disponibles', icon: 'perm', color: '#10b981' },
      { label: 'Assignations', value: String(activeAssignments), context: 'Liens actifs', icon: 'assign', color: '#f59e0b' },
    ];
  }, [roles]);

  return (
    <div className="roles-page">
      <nav className="roles-breadcrumb">
        <span>Auth + IAM + Context</span>
        <span className="roles-breadcrumb-sep">/</span>
        <span className="roles-breadcrumb-current">Rôles & Permissions</span>
      </nav>

      <div className="roles-header">
        <div>
          <div className="roles-title-row">
            <h1 className="roles-title">Rôles & Permissions</h1>
            <button className="roles-info-btn" title="Information">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 16v-4" />
                <path d="M12 8h.01" />
              </svg>
            </button>
          </div>
          <p className="roles-subtitle">Gérez les rôles, leurs scopes et les permissions associées.</p>
        </div>
      </div>

      <div className="roles-stats">
        {stats.map((stat) => (
          <div key={stat.label} className="roles-stat-card">
            <div className="roles-stat-icon" style={{ backgroundColor: `${stat.color}15`, color: stat.color }}>
              <StatIcon name={stat.icon} />
            </div>
            <div className="roles-stat-content">
              <span className="roles-stat-value">{stat.value}</span>
              <span className="roles-stat-label">{stat.label}</span>
              <span className="roles-stat-context">{stat.context}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="roles-toolbar">
        <div className="roles-toolbar-left">
          <div className="roles-search">
            <svg className="roles-search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" />
              <path d="M21 21l-4.35-4.35" />
            </svg>
            <input
              type="text"
              placeholder="Rechercher un rôle..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="roles-search-input"
            />
          </div>
          <select className="roles-filter-select" value={typeFilter} onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}>
            <option value="Tous">Tous (type)</option>
            {TYPE_OPTIONS.map((t) => (
              <option key={t} value={t}>{t === 'system' ? 'Système' : 'Personnalisé'}</option>
            ))}
          </select>
          <select className="roles-filter-select" value={scopeFilter} onChange={(e) => { setScopeFilter(e.target.value); setPage(1); }}>
            <option value="Tous">Tous (scope)</option>
            {SCOPE_OPTIONS.map((s) => (
              <option key={s} value={s}>{s === 'global' ? 'Global' : 'Tenant'}</option>
            ))}
          </select>
          <select className="roles-filter-select" value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}>
            <option value="Tous">Tous (statut)</option>
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>{s === 'active' ? 'Actif' : 'Archivé'}</option>
            ))}
          </select>
          <button className="roles-filter-btn" title="Filtres avancés">
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
        <button type="button" className="roles-primary-btn" onClick={() => setCreateOpen(true)}>+ Nouveau rôle</button>
      </div>

      <div className="roles-main">
        <div className="roles-table-wrapper">
          <table className="roles-table">
            <thead>
              <tr>
                <th>Rôle</th>
                <th>Type</th>
                <th>Scope</th>
                <th>Permissions</th>
                <th>Assignations</th>
                <th>Statut</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {pageRoles.length === 0 && (
                <tr>
                  <td colSpan={7} className="roles-empty">Aucun rôle ne correspond aux filtres.</td>
                </tr>
              )}
              {pageRoles.map((r) => {
                const permCount = rolesService.listRolePermissions(r.id).length;
                const assignCount = rolesService.getRoleAssignmentCount(r.id);
                return (
                  <tr key={r.id} className={`roles-table-row ${selectedRole?.id === r.id ? 'roles-table-row-selected' : ''}`} onClick={() => handleRowClick(r)}>
                    <td>
                      <div className="roles-role-cell">
                            <div className="roles-role-avatar">{r.name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()}</div>
                            <div>
                              <div className="roles-role-name">{r.name}</div>
                              <div className="roles-role-desc">{r.description}</div>
                            </div>
                          </div>
                    </td>
                    <td>
                      <span className={`roles-type-badge roles-type-badge-${r.type}`}>{r.type === 'system' ? 'Système' : 'Personnalisé'}</span>
                    </td>
                    <td>{r.scope === 'global' ? 'Global' : 'Tenant'}</td>
                    <td>{permCount}</td>
                    <td>{assignCount}</td>
                    <td>
                      <div className="roles-status-cell">
                        <span className="roles-status-dot" style={{ backgroundColor: r.status === 'active' ? '#10b981' : '#6b7280' }} />
                        <span>{r.status === 'active' ? 'Actif' : 'Archivé'}</span>
                      </div>
                    </td>
                    <td>
                      <div className="roles-actions-cell" onClick={(e) => e.stopPropagation()}>
                        <button type="button" className="roles-action-btn" title="Voir" onClick={() => handleRowClick(r)}>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                            <circle cx="12" cy="12" r="3" />
                          </svg>
                        </button>
                        <ActionMenu
                          role={r}
                          onView={handleRowClick}
                          onEdit={(role) => setEditTarget(role)}
                          onArchive={handleArchive}
                          onManagePermissions={(role) => setPermissionsTarget(role)}
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

        <div className="roles-side">
          {selectedRole ? (
            <div className="role-detail-panel">
              <div className="role-detail-header">
                <div className="role-detail-identity">
                  <div className="role-detail-avatar">{selectedRole.name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()}</div>
                  <div>
                    <div className="role-detail-name">{selectedRole.name}</div>
                    <div className="role-detail-desc">{selectedRole.description}</div>
                  </div>
                </div>
                <span className={`roles-detail-status roles-detail-status-${selectedRole.status}`}>{selectedRole.status === 'active' ? 'Actif' : 'Archivé'}</span>
              </div>

              <div className="role-detail-pills">
                <span className={`role-detail-pill role-detail-pill-${selectedRole.type}`}>{selectedRole.type === 'system' ? 'Système' : 'Personnalisé'}</span>
                <span className="role-detail-pill">{selectedRole.scope === 'global' ? 'Global' : 'Tenant'}</span>
                <span className="role-detail-pill">Créé le {selectedRole.createdAt}</span>
              </div>

              <div className="role-detail-tabs">
                {['Général', 'Permissions', 'Assignations', 'Sécurité'].map((tab) => (
                  <button key={tab} className={`role-detail-tab ${tab === 'Général' ? 'role-detail-tab-active' : ''}`}>
                    {tab}
                  </button>
                ))}
              </div>

              <div className="role-detail-fields">
                {[
                  { label: 'Nom', value: selectedRole.name },
                  { label: 'Type', value: selectedRole.type === 'system' ? 'Système' : 'Personnalisé' },
                  { label: 'Scope', value: selectedRole.scope },
                  { label: 'Statut', value: selectedRole.status },
                  { label: 'Créé le', value: selectedRole.createdAt },
                  { label: 'ID', value: String(selectedRole.id) },
                ].map((field) => (
                  <div key={field.label} className="role-detail-field">
                    <span className="role-detail-field-label">{field.label}</span>
                    <span className="role-detail-field-value">{field.value}</span>
                  </div>
                ))}
              </div>

              <div className="role-detail-permissions">
                <h4 className="role-detail-permissions-title">Permissions associées ({selectedPermissions.length})</h4>
                {selectedPermissions.length === 0 ? (
                  <p className="role-detail-permissions-empty">Aucune permission associée.</p>
                ) : (
                  <div className="role-detail-permissions-list">
                    {selectedPermissions.map((perm) => (
                      <div key={perm.id} className="role-detail-permission-item">
                        <div>
                          <div className="role-detail-permission-name">{perm.name}</div>
                          <div className="role-detail-permission-desc">{perm.description}</div>
                        </div>
                        <span className={`role-detail-permission-effect role-detail-permission-effect-${perm.effect.toLowerCase()}`}>{perm.effect}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="role-detail-actions">
                <button type="button" className="role-detail-btn role-detail-btn-primary" onClick={() => setEditTarget(selectedRole)} disabled={selectedRole.isSystem}>Modifier</button>
                <button type="button" className="role-detail-btn role-detail-btn-secondary" onClick={() => setPermissionsTarget(selectedRole)}>Gérer les permissions</button>
                <button type="button" className="role-detail-btn role-detail-btn-danger" onClick={() => handleDelete(selectedRole)} disabled={selectedRole.isSystem}>Supprimer</button>
              </div>
            </div>
          ) : (
            <div className="role-detail-panel role-detail-empty">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--color-text-muted)' }}>
                <path d="M12 2L2 7l10 5 10-5-10-5z" />
                <path d="M2 17l10 5 10-5" />
                <path d="M2 12l10 5 10-5" />
              </svg>
              <p>Sélectionnez un rôle pour afficher les détails</p>
            </div>
          )}
        </div>
      </div>

      <div className="roles-pagination">
        <span className="roles-pagination-info">
          {filtered.length === 0
            ? 'Aucun rôle'
            : `Affichage ${showingFrom} à ${showingTo} sur ${filtered.length} rôle${filtered.length > 1 ? 's' : ''}`}
        </span>
        <div className="roles-pagination-controls">
          <button type="button" className="roles-page-btn" disabled={safePage === 1} onClick={() => setPage(safePage - 1)}>‹</button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              type="button"
              className={`roles-page-btn ${p === safePage ? 'roles-page-btn-active' : ''}`}
              onClick={() => setPage(p)}
            >
              {p}
            </button>
          ))}
          <button type="button" className="roles-page-btn" disabled={safePage === totalPages} onClick={() => setPage(safePage + 1)}>›</button>
        </div>
        <select
          className="roles-page-size"
          value={pageSize}
          onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }}
        >
          <option value="7">7 / page</option>
          <option value="10">10 / page</option>
          <option value="25">25 / page</option>
        </select>
      </div>

      <NewRoleModal open={createOpen} onClose={() => setCreateOpen(false)} onCreate={handleCreate} />
      <EditRoleModal open={Boolean(editTarget)} role={editTarget} onClose={() => setEditTarget(null)} onSave={handleSave} />
      <PermissionsModal open={Boolean(permissionsTarget)} role={permissionsTarget} onClose={() => setPermissionsTarget(null)} onSave={handleSavePermissions} />
    </div>
  );
}

function StatIcon({ name }) {
  const props = { width: 18, height: 18, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' };
  if (name === 'role') {
    return (
      <svg {...props}>
        <path d="M12 2L2 7l10 5 10-5-10-5z" />
        <path d="M2 17l10 5 10-5" />
        <path d="M2 12l10 5 10-5" />
      </svg>
    );
  }
  if (name === 'system') {
    return (
      <svg {...props}>
        <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
        <line x1="8" y1="21" x2="16" y2="21" />
        <line x1="12" y1="17" x2="12" y2="21" />
      </svg>
    );
  }
  if (name === 'perm') {
    return (
      <svg {...props}>
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
        <path d="M7 11V7a5 5 0 0110 0v4" />
      </svg>
    );
  }
  if (name === 'assign') {
    return (
      <svg {...props}>
        <path d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
        <circle cx="8.5" cy="7" r="4" />
        <line x1="20" y1="8" x2="20" y2="14" />
        <line x1="23" y1="11" x2="17" y2="11" />
      </svg>
    );
  }
  return null;
}

export default RolesPage;
