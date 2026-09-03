import './Topbar.css';

function Topbar() {
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

        <div className="topbar-user">
          <div className="topbar-avatar">MA</div>
          <div className="topbar-user-info">
            <span className="topbar-user-name">Mami</span>
            <span className="topbar-user-role">Super Admin</span>
          </div>
          <svg className="topbar-user-chevron" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </div>
      </div>
    </header>
  );
}

export default Topbar;