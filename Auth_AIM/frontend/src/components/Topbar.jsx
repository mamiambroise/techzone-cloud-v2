import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import './Topbar.css';

function getInitials(name) {
  if (!name) return '?';
  const parts = String(name).trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function getDisplayName(user) {
  if (!user) return 'Invité';
  if (user.displayName) return user.displayName;
  const first = user.firstName || '';
  const last = user.lastName || '';
  const full = `${first} ${last}`.trim();
  if (full) return full;
  if (user.username) return user.username;
  if (user.primaryEmail) return user.primaryEmail;
  return 'Utilisateur';
}

function getRoleLabel(user) {
  if (!user) return '—';
  if (Array.isArray(user.roles) && user.roles.length > 0) return user.roles[0];
  if (user.role) return user.role;
  return '—';
}

function Topbar() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    if (!menuOpen) return undefined;
    const handleClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };
    const handleKey = (e) => {
      if (e.key === 'Escape') setMenuOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleKey);
    };
  }, [menuOpen]);

  const handleLogout = async () => {
    setMenuOpen(false);
    const confirmed = window.confirm('Voulez-vous vraiment vous déconnecter ?');
    if (!confirmed) return;
    try {
      await logout();
    } catch {
      /* ignore: on redirige dans tous les cas */
    }
    navigate('/login', { replace: true });
  };

  const displayName = getDisplayName(user);
  const roleLabel = getRoleLabel(user);
  const initials = getInitials(displayName);

  return (
    <header className="topbar">
      <div className="topbar-context">
        <div className="topbar-context-item">
          <label className="topbar-context-label">Application</label>
          <div className="topbar-select-wrapper">
            <select className="topbar-select" defaultValue="Boutique Mode & Chaussures">
              <option>Boutique Mode & Chaussures</option>
            </select>
            <svg className="topbar-select-chevron" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </div>
        </div>

        <div className="topbar-context-item">
          <label className="topbar-context-label">Version</label>
          <div className="topbar-select-wrapper">
            <select className="topbar-select" defaultValue="v1.2.0 (Working)">
              <option>v1.2.0 (Working)</option>
              <option>v1.1.0 (Stable)</option>
            </select>
            <svg className="topbar-select-chevron" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </div>
        </div>

        <div className="topbar-context-item">
          <label className="topbar-context-label">ERP</label>
          <div className="topbar-select-wrapper">
            <select className="topbar-select" defaultValue="Dolibarr PROD">
              <option>Dolibarr PROD</option>
              <option>Dolibarr DEV</option>
              <option>SAP S/4HANA</option>
            </select>
            <svg className="topbar-select-chevron" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </div>
        </div>

        <div className="topbar-context-item">
          <label className="topbar-context-label">Environnement</label>
          <div className="topbar-select-wrapper topbar-env-select">
            <span className="topbar-env-dot" />
            <select className="topbar-select" defaultValue="PRODUCTION">
              <option>PRODUCTION</option>
              <option>STAGING</option>
              <option>DEVELOPMENT</option>
            </select>
            <svg className="topbar-select-chevron" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </div>
        </div>

        <div className="topbar-context-item">
          <label className="topbar-context-label">Tenant</label>
          <div className="topbar-select-wrapper">
            <select className="topbar-select" defaultValue="Boutique A">
              <option>Boutique A</option>
              <option>Boutique B</option>
              <option>Boutique C</option>
            </select>
            <svg className="topbar-select-chevron" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </div>
        </div>
      </div>

      <div className="topbar-actions">
        <div className="topbar-search">
          <svg className="topbar-search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" />
            <path d="M21 21l-4.35-4.35" />
          </svg>
          <input type="text" placeholder="Rechercher..." className="topbar-search-input" />
          <kbd className="topbar-search-kbd">Ctrl+K</kbd>
        </div>

        <button className="topbar-icon-btn" title="Notifications">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
            <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
          </svg>
          <span className="topbar-badge" />
        </button>

        <button className="topbar-icon-btn" title="Aide">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
        </button>

        <div className="topbar-user-wrapper" ref={menuRef}>
          <button
            type="button"
            className="topbar-user"
            onClick={() => setMenuOpen((v) => !v)}
            aria-haspopup="menu"
            aria-expanded={menuOpen}
          >
            <div className="topbar-avatar">{initials}</div>
            <div className="topbar-user-info">
              <span className="topbar-user-name">{displayName}</span>
              <span className="topbar-user-role">{roleLabel}</span>
            </div>
            <svg className="topbar-user-chevron" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>
          {menuOpen ? (
            <div className="topbar-user-menu" role="menu">
              <div className="topbar-user-menu-header">
                <div className="topbar-avatar topbar-avatar-sm">{initials}</div>
                <div className="topbar-user-menu-meta">
                  <span className="topbar-user-menu-name">{displayName}</span>
                  <span className="topbar-user-menu-role">{roleLabel}</span>
                </div>
              </div>
              <button
                type="button"
                className="topbar-user-menu-item topbar-user-menu-item-danger"
                role="menuitem"
                onClick={handleLogout}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                  <polyline points="16 17 21 12 16 7" />
                  <line x1="21" y1="12" x2="9" y2="12" />
                </svg>
                <span>Déconnexion</span>
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </header>
  );
}

export default Topbar;