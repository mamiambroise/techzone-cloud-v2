import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { users as mockUsers, roleColors, statusConfig, identityTypeLabels, topUsers, connections24h, roleStats } from '../../data/mock';
import UserDetailPanel from '../../components/UserDetailPanel';
import DonutChart from '../../components/DonutChart';
import LineChart from '../../components/LineChart';
import './UsersPage.css';

const ITEMS_PER_PAGE = 7;

function UsersPage() {
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('Tous');
  const [statusFilter, setStatusFilter] = useState('Tous');
  const [tenantFilter, setTenantFilter] = useState('Tous');
  const [page, setPage] = useState(1);
  const [selectedUser, setSelectedUser] = useState(null);
  const navigate = useNavigate();

  const filtered = useMemo(() => {
    return mockUsers.filter((u) => {
      const q = search.toLowerCase();
      const matchSearch = !q || `${u.firstName} ${u.lastName} ${u.email}`.toLowerCase().includes(q);
      const matchRole = roleFilter === 'Tous' || u.roles.includes(roleFilter);
      const matchStatus = statusFilter === 'Tous' || u.status === statusFilter.toLowerCase();
      const matchTenant = tenantFilter === 'Tous' || u.tenant === tenantFilter;
      return matchSearch && matchRole && matchStatus && matchTenant;
    });
  }, [search, roleFilter, statusFilter, tenantFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const safePage = Math.min(page, totalPages);
  const pageUsers = filtered.slice((safePage - 1) * ITEMS_PER_PAGE, safePage * ITEMS_PER_PAGE);

  const handleRowClick = (user) => {
    setSelectedUser(user);
    navigate(`/users/${user.id}`);
  };

  const stats = [
    { label: 'Utilisateurs', value: '168', context: '+12 ce mois-ci', icon: 'users', color: '#2563eb' },
    { label: 'Identités', value: '142', context: '85% liées', icon: 'id', color: '#10b981' },
    { label: 'Sessions actives', value: '37', context: 'Voir en temps réel', icon: 'session', color: '#7c3aed' },
    { label: 'Rôles attribués', value: '24', context: '+2 ce mois-ci', icon: 'role', color: '#f59e0b' },
    { label: 'Tenants', value: '5', context: 'Actifs', icon: 'tenant', color: '#14b8a6' },
  ];

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
          <select className="users-filter-select" value={roleFilter} onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }}>
            <option>Tous</option>
            <option>Super Admin</option>
            <option>Admin</option>
            <option>Manager</option>
            <option>Éditeur</option>
            <option>Viewer</option>
          </select>
          <select className="users-filter-select" value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}>
            <option>Tous</option>
            <option>Actif</option>
            <option>Suspendu</option>
          </select>
          <select className="users-filter-select" value={tenantFilter} onChange={(e) => { setTenantFilter(e.target.value); setPage(1); }}>
            <option>Tous</option>
            <option>Boutique A</option>
            <option>Boutique B</option>
            <option>Boutique C</option>
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
        <button className="users-primary-btn">+ Nouvel utilisateur</button>
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
                      <span className="users-identity-badge">{identityTypeLabels[u.identityType]}</span>
                    </div>
                  </td>
                  <td>
                    <div className="users-roles-cell">
                      {u.roles.map((r) => {
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
                      <span className="users-status-dot" style={{ backgroundColor: statusConfig[u.status].color }} />
                      <span>{statusConfig[u.status].label}</span>
                    </div>
                  </td>
                  <td>
                    <div className="users-activity-cell">
                      <span>{u.lastActivity}</span>
                      <span className={u.isOnline ? 'users-online' : 'users-offline'}>{u.isOnline ? 'En ligne' : 'Hors ligne'}</span>
                    </div>
                  </td>
                  <td>
                    <div className="users-actions-cell" onClick={(_e) => _e.stopPropagation()}>
                      <button className="users-action-btn" title="Voir" onClick={() => handleRowClick(u)}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                          <circle cx="12" cy="12" r="3" />
                        </svg>
                      </button>
                      <button className="users-action-btn" title="Plus">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="12" cy="12" r="1" />
                          <circle cx="19" cy="12" r="1" />
                          <circle cx="5" cy="12" r="1" />
                        </svg>
                      </button>
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
          Affichage {(safePage - 1) * ITEMS_PER_PAGE + 1} à {Math.min(safePage * ITEMS_PER_PAGE, filtered.length)} sur {filtered.length} utilisateurs
        </span>
        <div className="users-pagination-controls">
          <button className="users-page-btn" disabled={safePage === 1} onClick={() => setPage(safePage - 1)}>‹</button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <button key={p} className={`users-page-btn ${p === safePage ? 'users-page-btn-active' : ''}`} onClick={() => setPage(p)}>
              {p}
            </button>
          ))}
          <button className="users-page-btn" disabled={safePage === totalPages} onClick={() => setPage(safePage + 1)}>›</button>
        </div>
        <select className="users-page-size" value={ITEMS_PER_PAGE} onChange={() => { setPage(1); }}>
          <option value="7">7 / page</option>
          <option value="10">10 / page</option>
          <option value="25">25 / page</option>
        </select>
      </div>

      <div className="users-bottom-cards">
        <div className="users-bottom-card">
          <div className="users-bottom-card-header">
            <h3 className="users-bottom-card-title">Répartition par rôle</h3>
            <a href="#roles" className="users-bottom-card-link">Voir le rapport complet →</a>
          </div>
          <DonutChart data={roleStats} size={170} />
        </div>

        <div className="users-bottom-card">
          <div className="users-bottom-card-header">
            <h3 className="users-bottom-card-title">Connexions (24h)</h3>
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
            <h3 className="users-bottom-card-title">Top utilisateurs par activité</h3>
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