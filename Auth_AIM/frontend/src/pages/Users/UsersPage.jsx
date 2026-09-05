import { useState, useMemo, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { roleColors, statusConfig, identityTypeLabels, roleStats, connections24h, topUsers } from '../../data/mock';
import * as usersService from '../../services/usersMockService';
import UserDetailPanel from '../../components/UserDetailPanel';
import DonutChart from '../../components/DonutChart';
import LineChart from '../../components/LineChart';
import SectionIcon from '../../components/SectionIcon';
import './UsersPage.css';

const ROLE_OPTIONS = ['Super Admin', 'Admin', 'Manager', 'Éditeur', 'Viewer'];
const STATUS_OPTIONS = ['Actif', 'Suspendu'];
const TENANT_OPTIONS = ['Boutique A', 'Boutique B', 'Boutique C'];
const IDENTITY_TYPES = ['EMAIL', 'GOOGLE', 'SYSTEM'];

function emptyForm() {
  return {
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    tenant: 'Boutique A',
    roles: ['Viewer'],
    status: 'active',
    identityType: 'EMAIL',
  };
}

function NewUserModal({ open, onClose, onCreate }) {
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

  const toggleRole = (role) => {
    setForm((f) => {
      const has = f.roles.includes(role);
      return { ...f, roles: has ? f.roles.filter((r) => r !== role) : [...f.roles, role] };
    });
  };

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
    if (form.roles.length === 0) {
      setError('Sélectionnez au moins un rôle.');
      return;
    }
    onCreate({
      ...form,
      status: form.status === 'suspended' ? 'suspended' : 'active',
    });
  };

  return (
    <div className="users-modal-backdrop" onClick={onClose}>
      <div className="users-modal" onClick={(e) => e.stopPropagation()}>
        <div className="users-modal-header">
          <h2 className="users-modal-title">Nouvel utilisateur</h2>
          <button type="button" className="users-modal-close" onClick={onClose} aria-label="Fermer">×</button>
        </div>
        <form className="users-modal-form" onSubmit={submit}>
          <div className="users-modal-row">
            <label className="users-modal-field">
              <span>Prénom *</span>
              <input ref={firstFieldRef} type="text" value={form.firstName} onChange={(e) => update('firstName', e.target.value)} />
            </label>
            <label className="users-modal-field">
              <span>Nom *</span>
              <input type="text" value={form.lastName} onChange={(e) => update('lastName', e.target.value)} />
            </label>
          </div>
          <label className="users-modal-field">
            <span>Email *</span>
            <input type="email" value={form.email} onChange={(e) => update('email', e.target.value)} />
          </label>
          <div className="users-modal-row">
            <label className="users-modal-field">
              <span>Téléphone</span>
              <input type="text" value={form.phone} onChange={(e) => update('phone', e.target.value)} />
            </label>
            <label className="users-modal-field">
              <span>Type d'identité</span>
              <select value={form.identityType} onChange={(e) => update('identityType', e.target.value)}>
                {IDENTITY_TYPES.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </label>
          </div>
          <div className="users-modal-row">
            <label className="users-modal-field">
              <span>Tenant</span>
              <select value={form.tenant} onChange={(e) => update('tenant', e.target.value)}>
                {TENANT_OPTIONS.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </label>
            <label className="users-modal-field">
              <span>Statut</span>
              <select value={form.status} onChange={(e) => update('status', e.target.value)}>
                <option value="active">Actif</option>
                <option value="suspended">Suspendu</option>
              </select>
            </label>
          </div>
          <div className="users-modal-field">
            <span>Rôles *</span>
            <div className="users-modal-roles">
              {ROLE_OPTIONS.map((r) => (
                <label key={r} className={`users-modal-role-chip ${form.roles.includes(r) ? 'is-selected' : ''}`}>
                  <input
                    type="checkbox"
                    checked={form.roles.includes(r)}
                    onChange={() => toggleRole(r)}
                  />
                  {r}
                </label>
              ))}
            </div>
          </div>
          {error && <div className="users-modal-error">{error}</div>}
          <div className="users-modal-actions">
            <button type="button" className="users-modal-btn-secondary" onClick={onClose}>Annuler</button>
            <button type="submit" className="users-primary-btn">Créer l'utilisateur</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function EditUserModal({ open, user, onClose, onSave }) {
  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    if (open && user) {
      setForm({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
        phone: user.phone || '',
        tenant: user.tenant || TENANT_OPTIONS[0],
        roles: Array.isArray(user.roles) ? [...user.roles] : ['Viewer'],
        status: user.status || 'active',
        identityType: user.identityType || 'EMAIL',
      });
    }
  }, [open, user]);

  if (!open || !user) return null;

  const update = (field, value) => setForm((f) => ({ ...f, [field]: value }));
  const toggleRole = (role) => {
    setForm((f) => {
      const has = f.roles.includes(role);
      return { ...f, roles: has ? f.roles.filter((r) => r !== role) : [...f.roles, role] };
    });
  };

  const submit = (e) => {
    e.preventDefault();
    if (!form.firstName.trim() || !form.lastName.trim() || !form.email.trim()) return;
    if (form.roles.length === 0) return;
    onSave({
      ...form,
      status: form.status === 'suspended' ? 'suspended' : 'active',
    });
  };

  return (
    <div className="users-modal-backdrop" onClick={onClose}>
      <div className="users-modal" onClick={(e) => e.stopPropagation()}>
        <div className="users-modal-header">
          <h2 className="users-modal-title">Modifier l'utilisateur</h2>
          <button type="button" className="users-modal-close" onClick={onClose} aria-label="Fermer">×</button>
        </div>
        <form className="users-modal-form" onSubmit={submit}>
          <div className="users-modal-row">
            <label className="users-modal-field">
              <span>Prénom *</span>
              <input type="text" value={form.firstName} onChange={(e) => update('firstName', e.target.value)} />
            </label>
            <label className="users-modal-field">
              <span>Nom *</span>
              <input type="text" value={form.lastName} onChange={(e) => update('lastName', e.target.value)} />
            </label>
          </div>
          <label className="users-modal-field">
            <span>Email *</span>
            <input type="email" value={form.email} onChange={(e) => update('email', e.target.value)} />
          </label>
          <div className="users-modal-row">
            <label className="users-modal-field">
              <span>Téléphone</span>
              <input type="text" value={form.phone} onChange={(e) => update('phone', e.target.value)} />
            </label>
            <label className="users-modal-field">
              <span>Type d'identité</span>
              <select value={form.identityType} onChange={(e) => update('identityType', e.target.value)}>
                {IDENTITY_TYPES.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </label>
          </div>
          <div className="users-modal-row">
            <label className="users-modal-field">
              <span>Tenant</span>
              <select value={form.tenant} onChange={(e) => update('tenant', e.target.value)}>
                {TENANT_OPTIONS.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </label>
            <label className="users-modal-field">
              <span>Statut</span>
              <select value={form.status} onChange={(e) => update('status', e.target.value)}>
                <option value="active">Actif</option>
                <option value="suspended">Suspendu</option>
              </select>
            </label>
          </div>
          <div className="users-modal-field">
            <span>Rôles *</span>
            <div className="users-modal-roles">
              {ROLE_OPTIONS.map((r) => (
                <label key={r} className={`users-modal-role-chip ${form.roles.includes(r) ? 'is-selected' : ''}`}>
                  <input
                    type="checkbox"
                    checked={form.roles.includes(r)}
                    onChange={() => toggleRole(r)}
                  />
                  {r}
                </label>
              ))}
            </div>
          </div>
          <div className="users-modal-actions">
            <button type="button" className="users-modal-btn-secondary" onClick={onClose}>Annuler</button>
            <button type="submit" className="users-primary-btn">Enregistrer</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ActionMenu({ user, onView, onEdit, onToggleStatus, onDelete }) {
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

  const nextStatusLabel = user.status === 'active' ? 'Suspendre' : 'Réactiver';

  return (
    <div className="users-action-menu" ref={ref}>
      <button
        type="button"
        className="users-action-btn"
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
        <div className="users-action-dropdown" role="menu">
          <button type="button" role="menuitem" onClick={() => { setOpen(false); onView(user); }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
            Voir
          </button>
          <button type="button" role="menuitem" onClick={() => { setOpen(false); onEdit(user); }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 20h9" />
              <path d="M16.5 3.5a2.121 2.121 0 113 3L7 19l-4 1 1-4 12.5-12.5z" />
            </svg>
            Modifier
          </button>
          <button type="button" role="menuitem" onClick={() => { setOpen(false); onToggleStatus(user); }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              {user.status === 'active' ? (
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
          <button type="button" role="menuitem" className="users-action-danger" onClick={() => { setOpen(false); onDelete(user); }}>
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

function UsersPage() {
  const [users, setUsers] = useState(() => usersService.listUsers());
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('Tous');
  const [statusFilter, setStatusFilter] = useState('Tous');
  const [tenantFilter, setTenantFilter] = useState('Tous');
  const [pageSize, setPageSize] = useState(7);
  const [page, setPage] = useState(1);
  const [selectedUser, setSelectedUser] = useState(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const navigate = useNavigate();

  const syncSelection = (list) => {
    if (!selectedUser) return;
    const refreshed = list.find((u) => u.id === selectedUser.id) || null;
    setSelectedUser(refreshed);
  };

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return users.filter((u) => {
      const matchSearch = !q
        || `${u.firstName} ${u.lastName} ${u.email}`.toLowerCase().includes(q);
      const matchRole = roleFilter === 'Tous' || (u.roles || []).includes(roleFilter);
      const matchStatus = statusFilter === 'Tous' || u.status === statusFilter.toLowerCase();
      const matchTenant = tenantFilter === 'Tous' || u.tenant === tenantFilter;
      return matchSearch && matchRole && matchStatus && matchTenant;
    });
  }, [users, search, roleFilter, statusFilter, tenantFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const pageUsers = filtered.slice((safePage - 1) * pageSize, safePage * pageSize);
  const showingFrom = filtered.length === 0 ? 0 : (safePage - 1) * pageSize + 1;
  const showingTo = Math.min(safePage * pageSize, filtered.length);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [totalPages, page]);

  const handleRowClick = (user) => {
    setSelectedUser(user);
  };

  const handleCreate = (payload) => {
    const created = usersService.createUser(payload);
    setUsers(usersService.listUsers());
    setCreateOpen(false);
    setSelectedUser(created);
    setPage(1);
  };

  const handleSave = (payload) => {
    usersService.updateUser(editTarget.id, payload);
    const next = usersService.listUsers();
    setUsers(next);
    syncSelection(next);
    setEditTarget(null);
  };

  const handleToggleStatus = (user) => {
    const nextStatus = user.status === 'active' ? 'suspended' : 'active';
    usersService.setUserStatus(user.id, nextStatus);
    const next = usersService.listUsers();
    setUsers(next);
    syncSelection(next);
  };

  const handleDelete = (user) => {
    const ok = window.confirm(`Supprimer définitivement ${user.firstName} ${user.lastName} ?`);
    if (!ok) return;
    usersService.deleteUser(user.id);
    const next = usersService.listUsers();
    setUsers(next);
    if (selectedUser?.id === user.id) {
      setSelectedUser(null);
      navigate('/users');
    }
  };

  const stats = useMemo(() => {
    const total = users.length;
    const identities = new Set(users.map((u) => u.identityType).filter(Boolean)).size;
    const activeSessions = users.filter((u) => u.isOnline).length;
    const roles = new Set(users.flatMap((u) => u.roles || [])).size;
    const tenants = new Set(users.map((u) => u.tenant).filter(Boolean)).size;
    return [
      { label: 'Utilisateurs', value: String(total), context: 'Comptes enregistrés', icon: 'users', color: '#2563eb' },
      { label: 'Identités', value: String(identities), context: 'Types liés', icon: 'id', color: '#10b981' },
      { label: 'Sessions actives', value: String(activeSessions), context: 'Connectés maintenant', icon: 'session', color: '#7c3aed' },
      { label: 'Rôles attribués', value: String(roles), context: 'Rôles distincts', icon: 'role', color: '#f59e0b' },
      { label: 'Tenants', value: String(tenants), context: 'Actifs', icon: 'tenant', color: '#14b8a6' },
    ];
  }, [users]);

  return (
    <div className="users-page">
      <nav className="users-breadcrumb">
        <span>Auth + IAM + Context</span>
        <span className="users-breadcrumb-sep">/</span>
        <span className="users-breadcrumb-current">Utilisateurs & Identités</span>
      </nav>

      <div className="users-header">
        <div>
          <div className="users-title-row">
            <h1 className="users-title">Utilisateurs & Identités</h1>
            <button className="users-info-btn" title="Information">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 16v-4" />
                <path d="M12 8h.01" />
              </svg>
            </button>
          </div>
          <p className="users-subtitle">Gérez les comptes utilisateurs, leurs identités et leurs liaisons avec les organisations.</p>
        </div>
      </div>

      <div className="users-stats">
        {stats.map((stat) => (
          <div key={stat.label} className="users-stat-card">
            <div className="users-stat-icon" style={{ backgroundColor: `${stat.color}15`, color: stat.color }}>
              <StatIcon name={stat.icon} />
            </div>
            <div className="users-stat-content">
              <span className="users-stat-value">{stat.value}</span>
              <span className="users-stat-label">{stat.label}</span>
              <span className="users-stat-context">{stat.context}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="users-toolbar">
        <div className="users-toolbar-left">
          <div className="users-search">
            <svg className="users-search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" />
              <path d="M21 21l-4.35-4.35" />
            </svg>
            <input
              type="text"
              placeholder="Rechercher un utilisateur..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="users-search-input"
            />
          </div>
          <select
            className="users-filter-select"
            value={roleFilter}
            onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }}
          >
            <option value="Tous">Tous (rôles)</option>
            {ROLE_OPTIONS.map((r) => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
          <select
            className="users-filter-select"
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          >
            <option value="Tous">Tous (statut)</option>
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          <select
            className="users-filter-select"
            value={tenantFilter}
            onChange={(e) => { setTenantFilter(e.target.value); setPage(1); }}
          >
            <option value="Tous">Tous (tenants)</option>
            {TENANT_OPTIONS.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
          <button className="users-filter-btn" title="Filtres avancés">
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
          <button className="users-settings-btn" title="Paramètres d'affichage">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 01-2 2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 01-2 2 2 2 0 012-2h.09a1.65 1.65 0 00-1.51 1z" />
            </svg>
          </button>
        </div>
        <button type="button" className="users-primary-btn" onClick={() => setCreateOpen(true)}>+ Nouvel utilisateur</button>
      </div>

      <div className="users-main">
        <div className="users-table-wrapper">
          <table className="users-table">
            <thead>
              <tr>
                <th>Utilisateur</th>
                <th>Identité principale</th>
                <th>Rôle(s)</th>
                <th>Tenant</th>
                <th>Statut</th>
                <th>Dernière activité</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {pageUsers.length === 0 && (
                <tr>
                  <td colSpan={7} className="users-empty">Aucun utilisateur ne correspond aux filtres.</td>
                </tr>
              )}
              {pageUsers.map((u) => (
                <tr key={u.id} className={`users-table-row ${selectedUser?.id === u.id ? 'users-table-row-selected' : ''}`} onClick={() => handleRowClick(u)}>
                  <td>
                    <div className="users-user-cell">
                      <div className="users-user-avatar">{u.avatarInitials}</div>
                      <div>
                        <div className="users-user-name">{u.firstName} {u.lastName}</div>
                        <div className="users-user-email">{u.email}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div className="users-identity-cell">
                      {u.email}
                      <span className="users-identity-badge">{identityTypeLabels[u.identityType] || u.identityType}</span>
                    </div>
                  </td>
                  <td>
                    <div className="users-roles-cell">
                      {(u.roles || []).map((r) => {
                        const colors = roleColors[r] || roleColors['Viewer'];
                        return (
                          <span key={r} className="users-role-pill" style={{ backgroundColor: colors.bg, color: colors.text, borderColor: colors.border }}>
                            {r}
                          </span>
                        );
                      })}
                    </div>
                  </td>
                  <td>{u.tenant}</td>
                  <td>
                    <div className="users-status-cell">
                      <span className="users-status-dot" style={{ backgroundColor: statusConfig[u.status]?.color || '#6b7280' }} />
                      <span>{statusConfig[u.status]?.label || u.status}</span>
                    </div>
                  </td>
                  <td>
                    <div className="users-activity-cell">
                      <span>{u.lastActivity}</span>
                      <span className={u.isOnline ? 'users-online' : 'users-offline'}>{u.isOnline ? 'En ligne' : 'Hors ligne'}</span>
                    </div>
                  </td>
                  <td>
                    <div className="users-actions-cell" onClick={(e) => e.stopPropagation()}>
                      <button type="button" className="users-action-btn" title="Voir" onClick={() => handleRowClick(u)}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                          <circle cx="12" cy="12" r="3" />
                        </svg>
                      </button>
                      <ActionMenu
                        user={u}
                        onView={handleRowClick}
                        onEdit={(user) => setEditTarget(user)}
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

        <div className="users-side">
          <UserDetailPanel user={selectedUser} />
        </div>
      </div>

      <div className="users-pagination">
        <span className="users-pagination-info">
          {filtered.length === 0
            ? 'Aucun utilisateur'
            : `Affichage ${showingFrom} à ${showingTo} sur ${filtered.length} utilisateur${filtered.length > 1 ? 's' : ''}`}
        </span>
        <div className="users-pagination-controls">
          <button type="button" className="users-page-btn" disabled={safePage === 1} onClick={() => setPage(safePage - 1)}>‹</button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              type="button"
              className={`users-page-btn ${p === safePage ? 'users-page-btn-active' : ''}`}
              onClick={() => setPage(p)}
            >
              {p}
            </button>
          ))}
          <button type="button" className="users-page-btn" disabled={safePage === totalPages} onClick={() => setPage(safePage + 1)}>›</button>
        </div>
        <select
          className="users-page-size"
          value={pageSize}
          onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }}
        >
          <option value="7">7 / page</option>
          <option value="10">10 / page</option>
          <option value="25">25 / page</option>
        </select>
      </div>

      <NewUserModal open={createOpen} onClose={() => setCreateOpen(false)} onCreate={handleCreate} />
      <EditUserModal open={Boolean(editTarget)} user={editTarget} onClose={() => setEditTarget(null)} onSave={handleSave} />

      <div className="users-bottom-cards">
        <div className="users-bottom-card">
          <div className="users-bottom-card-header">
            <h3 className="users-bottom-card-title">
              <span className="users-bottom-card-title-icon"><SectionIcon name="pie" /></span>
              Répartition par rôle
            </h3>
            <a href="#roles" className="users-bottom-card-link">Voir le rapport complet →</a>
          </div>
          <DonutChart data={roleStats} size={170} />
        </div>

        <div className="users-bottom-card">
          <div className="users-bottom-card-header">
            <h3 className="users-bottom-card-title">
              <span className="users-bottom-card-title-icon"><SectionIcon name="trend" /></span>
              Connexions (24h)
            </h3>
            <a href="#connections" className="users-bottom-card-link">Voir le rapport complet →</a>
          </div>
          <LineChart data={connections24h} stats={[
            { value: '37', label: 'Sessions actives' },
            { value: '156', label: 'Connexions' },
            { value: '3', label: 'Échecs' },
            { value: '1', label: 'Suspectes' },
          ]} />
        </div>

        <div className="users-bottom-card">
          <div className="users-bottom-card-header">
            <h3 className="users-bottom-card-title">
              <span className="users-bottom-card-title-icon"><SectionIcon name="trophy" /></span>
              Top utilisateurs par activité
            </h3>
            <a href="#topusers" className="users-bottom-card-link">Voir tous les utilisateurs →</a>
          </div>
          <div className="users-top-list">
            {topUsers.map((u, i) => (
              <div key={i} className="users-top-item">
                <div className="users-top-info">
                  <span className="users-top-name">{u.name}</span>
                  <span className="users-top-duration">{u.duration}</span>
                </div>
                <div className="users-top-bar-bg">
                  <div className="users-top-bar" style={{ width: `${u.percent}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatIcon({ name }) {
  const props = { width: 18, height: 18, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' };
  if (name === 'users') {
    return (
      <svg {...props}>
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    );
  }
  if (name === 'id') {
    return (
      <svg {...props}>
        <rect x="3" y="4" width="18" height="16" rx="2" />
        <circle cx="9" cy="12" r="2.5" />
        <path d="M15 8h2M15 12h2M15 16h2" />
      </svg>
    );
  }
  if (name === 'session') {
    return (
      <svg {...props}>
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      </svg>
    );
  }
  if (name === 'role') {
    return (
      <svg {...props}>
        <path d="M12 2L2 7l10 5 10-5-10-5z" />
        <path d="M2 17l10 5 10-5" />
        <path d="M2 12l10 5 10-5" />
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
  return null;
}

export default UsersPage;
