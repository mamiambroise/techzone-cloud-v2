import { useState, useMemo, useEffect, useRef } from 'react';
import * as adminUsersService from '../../services/adminUsersMockService';
import UserDetailPanel from '../../components/UserDetailPanel';
import './UsersAdminPage.css';

function ActionMenu({ user, onSuspend, onReactivate, onLock, onUnlock, onView }) {
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
  const nextLockLabel = user.isLocked ? 'Déverrouiller' : 'Verrouiller';

  return (
    <div className="admin-action-menu" ref={ref}>
      <button type="button" className="admin-action-btn" title="Actions" onClick={() => setOpen((v) => !v)}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="1" />
          <circle cx="19" cy="12" r="1" />
          <circle cx="5" cy="12" r="1" />
        </svg>
      </button>
      {open && (
        <div className="admin-action-dropdown" role="menu">
          <button type="button" role="menuitem" onClick={() => { setOpen(false); onView(user); }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
            Voir
          </button>
          <button type="button" role="menuitem" onClick={() => { setOpen(false); if (user.status === 'active') onSuspend(user); else onReactivate(user); }}>
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
          <button type="button" role="menuitem" onClick={() => { setOpen(false); if (user.isLocked) onUnlock(user); else onLock(user); }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              {user.isLocked ? (
                <>
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </>
              ) : (
                <>
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 9.9-1" />
                </>
              )}
            </svg>
            {nextLockLabel}
          </button>
        </div>
      )}
    </div>
  );
}

function UsersAdminPage() {
  const [users, setUsers] = useState(() => adminUsersService.listAdminUsers());
  const [search, setSearch] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [actionTarget, setActionTarget] = useState(null);
  const [actionType, setActionType] = useState(null);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return users.filter((u) => {
      const matchSearch = !q || `${u.firstName} ${u.lastName} ${u.email}`.toLowerCase().includes(q);
      const matchStatus = !q || u.status.includes(q);
      return matchSearch || matchStatus;
    });
  }, [users, search]);

  const handleView = (user) => {
    setSelectedUser(user);
  };

  const confirmAction = () => {
    if (!actionTarget || !actionType) return;
    if (actionType === 'suspend') {
      adminUsersService.setAdminUserStatus(actionTarget.id, 'suspended');
    } else if (actionType === 'reactivate') {
      adminUsersService.setAdminUserStatus(actionTarget.id, 'active');
    } else if (actionType === 'lock') {
      adminUsersService.setAdminUserLock(actionTarget.id, true);
    } else if (actionType === 'unlock') {
      adminUsersService.setAdminUserLock(actionTarget.id, false);
    }
    setUsers(adminUsersService.listAdminUsers());
    setActionTarget(null);
    setActionType(null);
  };

  const handleSuspend = (user) => {
    setActionTarget(user);
    setActionType('suspend');
  };

  const handleReactivate = (user) => {
    setActionTarget(user);
    setActionType('reactivate');
  };

  const handleLock = (user) => {
    setActionTarget(user);
    setActionType('lock');
  };

  const handleUnlock = (user) => {
    setActionTarget(user);
    setActionType('unlock');
  };

  const actionLabel = actionType === 'suspend' ? 'suspendre' : actionType === 'reactivate' ? 'réactiver' : actionType === 'lock' ? 'verrouiller' : 'déverrouiller';

  return (
    <div className="admin-page">
      <nav className="admin-breadcrumb">
        <span>Platform Administration</span>
        <span className="admin-breadcrumb-sep">/</span>
        <span className="admin-breadcrumb-current">Utilisateurs</span>
      </nav>

      <div className="admin-header">
        <div>
          <div className="admin-title-row">
            <h1 className="admin-title">Utilisateurs</h1>
            <button className="admin-info-btn" title="Information">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 16v-4" />
                <path d="M12 8h.01" />
              </svg>
            </button>
          </div>
          <p className="admin-subtitle">Gestion administrative des utilisateurs et de leurs accès.</p>
        </div>
      </div>

      <div className="admin-toolbar">
        <div className="admin-toolbar-left">
          <div className="admin-search">
            <svg className="admin-search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" />
              <path d="M21 21l-4.35-4.35" />
            </svg>
            <input
              type="text"
              placeholder="Rechercher un utilisateur..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="admin-search-input"
            />
          </div>
        </div>
      </div>

      <div className="admin-main">
        <div className="admin-table-wrapper">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Utilisateur</th>
                <th>Identité</th>
                <th>Memberships</th>
                <th>État</th>
                <th>Dernière activité</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="admin-empty">Aucun utilisateur ne correspond.</td>
                </tr>
              )}
              {filtered.map((user) => (
                <tr key={user.id} className={`admin-table-row ${selectedUser?.id === user.id ? 'admin-table-row-selected' : ''}`} onClick={() => handleView(user)}>
                  <td>
                    <div className="admin-user-cell">
                      <div className="admin-user-avatar">{user.avatarInitials}</div>
                      <div>
                        <div className="admin-user-name">{user.firstName} {user.lastName}</div>
                        <div className="admin-user-email">{user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td>{user.identityType}</td>
                  <td>{user.memberships.map((m) => `${m.role} (${m.tenantId})`).join(', ')}</td>
                  <td>
                    <div className="admin-status-cell">
                      <span className="admin-status-dot" style={{ backgroundColor: user.status === 'active' ? '#10b981' : '#f59e0b' }} />
                      <span>{user.status === 'active' ? 'Actif' : 'Suspendu'}</span>
                    </div>
                  </td>
                  <td>{user.lastActivity}</td>
                  <td>
                    <div className="admin-actions-cell" onClick={(e) => e.stopPropagation()}>
                      <ActionMenu
                        user={user}
                        onView={handleView}
                        onSuspend={handleSuspend}
                        onReactivate={handleReactivate}
                        onLock={handleLock}
                        onUnlock={handleUnlock}
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="admin-side">
          <UserDetailPanel user={selectedUser} />
        </div>
      </div>

      {actionTarget && (
        <div className="admin-modal-backdrop" onClick={() => { setActionTarget(null); setActionType(null); }}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h2 className="admin-modal-title">Confirmation</h2>
              <button type="button" className="admin-modal-close" onClick={() => { setActionTarget(null); setActionType(null); }} aria-label="Fermer">×</button>
            </div>
            <div className="admin-modal-body">
              <p>Voulez-vous {actionLabel} l'utilisateur <strong>{actionTarget.firstName} {actionTarget.lastName}</strong> ?</p>
            </div>
            <div className="admin-modal-actions">
              <button type="button" className="admin-modal-btn-secondary" onClick={() => { setActionTarget(null); setActionType(null); }}>Annuler</button>
              <button type="button" className="admin-modal-btn-danger" onClick={confirmAction}>Confirmer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default UsersAdminPage;
