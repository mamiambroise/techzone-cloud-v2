import { useState, useMemo, useRef, useEffect } from 'react';
import { memberships, tenants, organisations } from '../../data/mock';
import './ContextsPage.css';

const CURRENT_USER_ID = 1;

const MOCK_APP = 'Boutique Mode & Chaussures';
const MOCK_ENV = 'PRODUCTION';

function getTenantOrg(tenantId) {
  const tenant = tenants.find((t) => t.id === tenantId);
  if (!tenant) return null;
  const org = organisations.find((o) => o.id === tenant.organisationId);
  return { tenant, org };
}

function ActionMenu({ tenant, isCurrent, onSwitch, onView }) {
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
    <div className="ctx-action-menu" ref={ref}>
      <button
        type="button"
        className="ctx-action-btn"
        title="Actions"
        onClick={() => setOpen((v) => !v)}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="1" />
          <circle cx="19" cy="12" r="1" />
          <circle cx="5" cy="12" r="1" />
        </svg>
      </button>
      {open && (
        <div className="ctx-action-dropdown" role="menu">
          <button type="button" role="menuitem" onClick={() => { setOpen(false); onView(tenant); }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
            Voir
          </button>
          {!isCurrent && (
            <button type="button" role="menuitem" onClick={() => { setOpen(false); onSwitch(tenant.id); }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
              </svg>
              Basculer vers ce tenant
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function ContextsPage() {
  const [currentTenantId, setCurrentTenantId] = useState(() => {
    const current = memberships.find((m) => m.userId === CURRENT_USER_ID);
    return current ? current.tenantId : memberships[0]?.tenantId || 1;
  });

  const myMemberships = useMemo(
    () => memberships.filter((m) => m.userId === CURRENT_USER_ID),
    []
  );

  const currentTenantInfo = useMemo(() => {
    const tenant = tenants.find((t) => t.id === currentTenantId);
    if (!tenant) return null;
    const org = organisations.find((o) => o.id === tenant.organisationId);
    return { tenant, org };
  }, [currentTenantId]);

  const handleSwitch = (tenantId) => {
    setCurrentTenantId(tenantId);
  };

  const handleView = (tenant) => {
    alert(`Détails du tenant : ${tenant.name}\nOrganisation : ${organisations.find(o => o.id === tenant.organisationId)?.name || '—'}\nRôle : ${memberships.find(m => m.tenantId === tenant.id && m.userId === CURRENT_USER_ID)?.role || '—'}`);
  };

  return (
    <div className="context-page">
      <nav className="context-breadcrumb">
        <span>Auth + IAM + Context</span>
        <span className="context-breadcrumb-sep">/</span>
        <span className="context-breadcrumb-current">Contextes</span>
      </nav>

      <div className="context-header">
        <div>
          <div className="context-title-row">
            <h1 className="context-title">Contextes</h1>
            <button className="context-info-btn" title="Information">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 16v-4" />
                <path d="M12 8h.01" />
              </svg>
            </button>
          </div>
          <p className="context-subtitle">Contexte actif et bascule entre organisations/tenants</p>
        </div>
      </div>

      {currentTenantInfo && (
        <div className="context-current-card">
          <div className="context-current-header">
            <h3 className="context-current-title">Contexte actuel</h3>
            <span className="context-current-badge">Actif</span>
          </div>
          <div className="context-current-grid">
            <div className="context-current-field">
              <span className="context-current-label">Organisation</span>
              <span className="context-current-value">{currentTenantInfo.org?.name || '—'}</span>
            </div>
            <div className="context-current-field">
              <span className="context-current-label">Tenant</span>
              <span className="context-current-value">{currentTenantInfo.tenant.name}</span>
            </div>
            <div className="context-current-field">
              <span className="context-current-label">Application</span>
              <span className="context-current-value">{MOCK_APP}</span>
            </div>
            <div className="context-current-field">
              <span className="context-current-label">Environnement</span>
              <span className="context-current-value">{MOCK_ENV}</span>
            </div>
          </div>
        </div>
      )}

      <div className="context-tenants-section">
        <h3 className="context-tenants-title">Mes tenants</h3>
        <div className="context-tenants-grid">
          {myMemberships.length === 0 && (
            <p className="context-tenants-empty">Aucun tenant rattaché.</p>
          )}
          {myMemberships.map((membership) => {
            const info = getTenantOrg(membership.tenantId);
            if (!info) return null;
            const isCurrent = membership.tenantId === currentTenantId;
            return (
              <div
                key={membership.id}
                className={`context-tenant-card ${isCurrent ? 'context-tenant-card-current' : ''}`}
              >
                <div className="context-tenant-header">
                  <div className="context-tenant-avatar">
                    {info.tenant.name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()}
                  </div>
                  <div className="context-tenant-identity">
                    <div className="context-tenant-name">{info.tenant.name}</div>
                    <div className="context-tenant-org">{info.org?.name || '—'}</div>
                  </div>
                  {isCurrent && (
                    <span className="context-tenant-current-badge">Actuel</span>
                  )}
                  <ActionMenu
                    tenant={info.tenant}
                    isCurrent={isCurrent}
                    onSwitch={handleSwitch}
                    onView={handleView}
                  />
                </div>
                <div className="context-tenant-meta">
                  <span className="context-tenant-role">{membership.role}</span>
                  <span className="context-tenant-plan">{info.tenant.plan}</span>
                  <span className="context-tenant-region">{info.tenant.region}</span>
                </div>
                <div className="context-tenant-actions">
                  {!isCurrent && (
                    <button
                      type="button"
                      className="context-tenant-switch-btn"
                      onClick={() => handleSwitch(membership.tenantId)}
                    >
                      Basculer vers ce tenant
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default ContextsPage;
