import { useState, useMemo, useEffect, useRef } from 'react';
import * as adminTenantsService from '../../services/adminTenantsMockService';
import './OrganisationsTenantsAdminPage.css';

function ActionMenu({ tenant, onSuspend, onReactivate, onView }) {
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

  const nextLabel = tenant.status === 'ACTIVE' ? 'Suspendre' : 'Réactiver';

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
          <button type="button" role="menuitem" onClick={() => { setOpen(false); onView(tenant); }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
            Voir
          </button>
          <button type="button" role="menuitem" onClick={() => { setOpen(false); if (tenant.status === 'ACTIVE') onSuspend(tenant); else onReactivate(tenant); }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              {tenant.status === 'ACTIVE' ? (
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
            {nextLabel}
          </button>
        </div>
      )}
    </div>
  );
}

function OrganisationsTenantsAdminPage() {
  const [tenants, setTenants] = useState(() => adminTenantsService.listAdminTenants());
  const [search, setSearch] = useState('');
  const [selectedTenant, setSelectedTenant] = useState(null);
  const [actionTarget, setActionTarget] = useState(null);
  const [actionType, setActionType] = useState(null);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return tenants.filter((t) => {
      const matchSearch = !q || `${t.name} ${t.organisationName}`.toLowerCase().includes(q);
      const matchStatus = !q || t.status.toLowerCase().includes(q);
      return matchSearch || matchStatus;
    });
  }, [tenants, search]);

  const confirmAction = () => {
    if (!actionTarget || !actionType) return;
    const nextStatus = actionType === 'suspend' ? 'SUSPENDED' : 'ACTIVE';
    adminTenantsService.setAdminTenantStatus(actionTarget.id, nextStatus);
    setTenants(adminTenantsService.listAdminTenants());
    setActionTarget(null);
    setActionType(null);
  };

  return (
    <div className="admin-page">
      <nav className="admin-breadcrumb">
        <span>Platform Administration</span>
        <span className="admin-breadcrumb-sep">/</span>
        <span className="admin-breadcrumb-current">Organisations & Tenants</span>
      </nav>

      <div className="admin-header">
        <div>
          <div className="admin-title-row">
            <h1 className="admin-title">Organisations & Tenants</h1>
            <button className="admin-info-btn" title="Information">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 16v-4" />
                <path d="M12 8h.01" />
              </svg>
            </button>
          </div>
          <p className="admin-subtitle">Vue administrative des tenants, abonnements et usage.</p>
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
              placeholder="Rechercher un tenant..."
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
                <th>Tenant</th>
                <th>Organisation</th>
                <th>Statut</th>
                <th>Plan</th>
                <th>Usage</th>
                <th>Memberships</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="admin-empty">Aucun tenant ne correspond.</td>
                </tr>
              )}
              {filtered.map((tenant) => (
                <tr key={tenant.id} className={`admin-table-row ${selectedTenant?.id === tenant.id ? 'admin-table-row-selected' : ''}`} onClick={() => setSelectedTenant(tenant)}>
                  <td className="admin-table-cell-primary">{tenant.name}</td>
                  <td>{tenant.organisationName}</td>
                  <td>
                    <span className={`admin-status-pill admin-status-${tenant.status.toLowerCase()}`}>{tenant.status}</span>
                  </td>
                  <td>{tenant.plan}</td>
                  <td>
                    <div className="admin-usage">
                      <span>U:{tenant.usage.users}/{tenant.quotas.users}</span>
                      <span>S:{tenant.usage.storage}/{tenant.quotas.storage}</span>
                    </div>
                  </td>
                  <td>{tenant.memberships}</td>
                  <td>
                    <div className="admin-actions-cell" onClick={(e) => e.stopPropagation()}>
                      <ActionMenu
                        tenant={tenant}
                        onView={(t) => setSelectedTenant(t)}
                        onSuspend={(t) => { setActionTarget(t); setActionType('suspend'); }}
                        onReactivate={(t) => { setActionTarget(t); setActionType('reactivate'); }}
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="admin-side">
          {selectedTenant ? (
            <div className="admin-detail-panel">
              <div className="admin-detail-header">
                <div>
                  <div className="admin-detail-name">{selectedTenant.name}</div>
                  <div className="admin-detail-sub">{selectedTenant.organisationName}</div>
                </div>
                <span className={`admin-status-pill admin-status-${selectedTenant.status.toLowerCase()}`}>{selectedTenant.status}</span>
              </div>
              <div className="admin-detail-tabs">
                {['Profil', 'Abonnement', 'Usage', 'Historique'].map((tab) => (
                  <button key={tab} className={`admin-detail-tab ${tab === 'Profil' ? 'admin-detail-tab-active' : ''}`}>{tab}</button>
                ))}
              </div>
              <div className="admin-detail-fields">
                <div className="admin-detail-field">
                  <span className="admin-detail-field-label">Plan</span>
                  <span className="admin-detail-field-value">{selectedTenant.plan}</span>
                </div>
                <div className="admin-detail-field">
                  <span className="admin-detail-field-label">Utilisateurs</span>
                  <span className="admin-detail-field-value">{selectedTenant.usage.users} / {selectedTenant.quotas.users}</span>
                </div>
                <div className="admin-detail-field">
                  <span className="admin-detail-field-label">Stockage</span>
                  <span className="admin-detail-field-value">{selectedTenant.usage.storage} / {selectedTenant.quotas.storage}</span>
                </div>
                <div className="admin-detail-field">
                  <span className="admin-detail-field-label">API Calls</span>
                  <span className="admin-detail-field-value">{selectedTenant.usage.apiCalls} / {selectedTenant.quotas.apiCalls}</span>
                </div>
                <div className="admin-detail-field">
                  <span className="admin-detail-field-label">Memberships</span>
                  <span className="admin-detail-field-value">{selectedTenant.memberships}</span>
                </div>
                <div className="admin-detail-field">
                  <span className="admin-detail-field-label">Incidents</span>
                  <span className="admin-detail-field-value">{selectedTenant.incidents}</span>
                </div>
                <div className="admin-detail-field">
                  <span className="admin-detail-field-label">Créé le</span>
                  <span className="admin-detail-field-value">{selectedTenant.createdAt}</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="admin-detail-panel admin-detail-empty">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--color-text-muted)' }}>
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
              <p>Sélectionnez un tenant pour afficher les détails</p>
            </div>
          )}
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
              <p>Voulez-vous {actionType === 'suspend' ? 'suspendre' : 'réactiver'} le tenant <strong>{actionTarget.name}</strong> ?</p>
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

export default OrganisationsTenantsAdminPage;
