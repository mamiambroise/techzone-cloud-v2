import { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import './MainLayout.css';

const menuItems = [
  { path: '/dashboard', label: "Vue d'ensemble" },
  { path: '/users', label: 'Utilisateurs & Identités' },
  { path: '/organisations', label: 'Organisations & Tenants' },
  { path: '/roles', label: 'Rôles & Permissions' },
  { path: '/policies', label: 'Accès & Policies' },
  { path: '/sessions', label: 'Sessions & Sécurité' },
  { path: '/contexts', label: 'Contextes' },
];

function MainLayout() {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="main-layout">
      <aside className={`main-sidebar ${collapsed ? 'main-sidebar-collapsed' : ''}`}>
        <div className="main-sidebar-header">
          <div className="main-sidebar-brand">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2L2 7l10 5 10-5-10-5z" />
              <path d="M2 17l10 5 10-5" />
              <path d="M2 12l10 5 10-5" />
            </svg>
            {!collapsed && (
              <div className="main-sidebar-brand-text">
                <span className="main-sidebar-title">TECHZONE CLOUD</span>
                <span className="main-sidebar-subtitle">ADMIN</span>
              </div>
            )}
          </div>
        </div>

        <nav className="main-sidebar-nav">
          {menuItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `main-sidebar-link ${isActive ? 'main-sidebar-link-active' : ''}`
              }
              title={collapsed ? item.label : undefined}
            >
              <span className="main-sidebar-link-label">{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="main-sidebar-footer">
          <button
            type="button"
            className="main-sidebar-collapse"
            onClick={() => setCollapsed((v) => !v)}
            title={collapsed ? 'Développer le menu' : 'Réduire le menu'}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6" />
            </svg>
            {!collapsed && <span>Réduire le menu</span>}
          </button>
        </div>
      </aside>

      <div className={`main-content ${collapsed ? 'main-content-collapsed' : ''}`}>
        <main className="main-page">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default MainLayout;