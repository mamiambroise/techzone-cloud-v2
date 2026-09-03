import { useState, useMemo } from 'react';
import { identities as mockIdentities, identityStats, identityTypeStats, identitySourceStats, identityErpLinkStats, topUnlinkedIdentities } from '../../data/mock';
import DonutChart from '../../components/DonutChart';
import './IdentitiesPage.css';

const ITEMS_PER_PAGE = 7;

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

function IdentitiesPage() {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('Tous');
  const [sourceFilter, setSourceFilter] = useState('Tous');
  const [statusFilter, setStatusFilter] = useState('Tous');
  const [erpFilter, setErpFilter] = useState('Tous');
  const [page, setPage] = useState(1);
  const [selectedIdentity, setSelectedIdentity] = useState(null);
  const [activeTab, setActiveTab] = useState('Toutes');

  const filtered = useMemo(() => {
    return mockIdentities.filter((item) => {
      const q = search.toLowerCase();
      const matchSearch = !q || `${item.firstName} ${item.lastName} ${item.email}`.toLowerCase().includes(q);
      const matchType = typeFilter === 'Tous' || item.type === typeFilter;
      const matchSource = sourceFilter === 'Tous' || item.source === sourceFilter;
      const matchStatus = statusFilter === 'Tous' || item.status === statusFilter;
      const matchErp = erpFilter === 'Tous' || (erpFilter === 'Liées' ? item.erpLink : !item.erpLink);
      return matchSearch && matchType && matchSource && matchStatus && matchErp;
    });
  }, [search, typeFilter, sourceFilter, statusFilter, erpFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const safePage = Math.min(page, totalPages);
  const pageItems = filtered.slice((safePage - 1) * ITEMS_PER_PAGE, safePage * ITEMS_PER_PAGE);

  const handleRowClick = (item) => {
    setSelectedIdentity(item);
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
          <button key={tab} className={`identities-tab ${activeTab === tab ? 'identities-tab-active' : ''}`} onClick={() => setActiveTab(tab)}>
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
            <option>EMAIL</option>
            <option>GOOGLE</option>
            <option>SYSTEM</option>
            <option>EXTERNAL</option>
          </select>
          <select className="identities-filter-select" value={sourceFilter} onChange={(e) => { setSourceFilter(e.target.value); setPage(1); }}>
            <option>Tous</option>
            <option>SIGN_UP</option>
            <option>SSO</option>
            <option>INVITE</option>
            <option>IMPORT</option>
            <option>SYSTEM</option>
          </select>
          <select className="identities-filter-select" value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}>
            <option>Tous</option>
            <option>ACTIVE</option>
            <option>SUSPENDED</option>
            <option>ARCHIVED</option>
            <option>PENDING</option>
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
              <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 01-2 2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 01-2 2 2 2 0 012-2h.09a1.65 1.65 0 00-1.51 1z" />
            </svg>
          </button>
        </div>
        <button className="identities-primary-btn">+ Nouvelle identité</button>
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
                      <span className="identities-status-dot" style={{ backgroundColor: item.status === 'ACTIVE' ? '#10b981' : item.status === 'SUSPENDED' ? '#f59e0b' : '#6b7280' }} />
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
                      <button className="identities-action-btn" title="Plus">
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
                <button className="identity-detail-btn identity-detail-btn-primary">Modifier</button>
                <button className="identity-detail-btn identity-detail-btn-secondary">Voir les liaisons</button>
                <button className="identity-detail-btn identity-detail-btn-danger">Archiver</button>
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
          Affichage {(safePage - 1) * ITEMS_PER_PAGE + 1} à {Math.min(safePage * ITEMS_PER_PAGE, filtered.length)} sur {filtered.length} identités
        </span>
        <div className="identities-pagination-controls">
          <button className="identities-page-btn" disabled={safePage === 1} onClick={() => setPage(safePage - 1)}>‹</button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <button key={p} className={`identities-page-btn ${p === safePage ? 'identities-page-btn-active' : ''}`} onClick={() => setPage(p)}>
              {p}
            </button>
          ))}
          <button className="identities-page-btn" disabled={safePage === totalPages} onClick={() => setPage(safePage + 1)}>›</button>
        </div>
        <select className="identities-page-size" value={ITEMS_PER_PAGE} onChange={() => { setPage(1); }}>
          <option value="7">7 / page</option>
          <option value="10">10 / page</option>
          <option value="25">25 / page</option>
        </select>
      </div>

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