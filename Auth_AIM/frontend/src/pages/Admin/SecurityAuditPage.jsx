import { useState, useMemo } from 'react';
import * as securityAuditService from '../../services/securityAuditMockService';
import SectionIcon from '../../components/SectionIcon';
import './SecurityAuditPage.css';

function SecurityAuditPage() {
  const [events] = useState(() => securityAuditService.listSecurityEvents());
  const [auditTrail] = useState(() => securityAuditService.listAuditTrail());
  const [tenantFilter, setTenantFilter] = useState('');
  const [userFilter, setUserFilter] = useState('');
  const [severityFilter, setSeverityFilter] = useState('');

  const filteredEvents = useMemo(() => {
    return events.filter((e) => {
      const matchTenant = !tenantFilter || e.tenant.toLowerCase().includes(tenantFilter.toLowerCase());
      const matchUser = !userFilter || e.user.toLowerCase().includes(userFilter.toLowerCase());
      const matchSeverity = !severityFilter || e.severity === severityFilter.toLowerCase();
      return matchTenant && matchUser && matchSeverity;
    });
  }, [events, tenantFilter, userFilter, severityFilter]);

  const markInvestigation = (eventId) => {
    securityAuditService.markUnderInvestigation(eventId);
  };

  return (
    <div className="admin-page">
      <nav className="admin-breadcrumb">
        <span>Platform Administration</span>
        <span className="admin-breadcrumb-sep">/</span>
        <span className="admin-breadcrumb-current">Sécurité & Audit</span>
      </nav>

      <div className="admin-header">
        <div>
          <div className="admin-title-row">
            <h1 className="admin-title">Sécurité & Audit</h1>
            <button className="admin-info-btn" title="Information">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 16v-4" />
                <path d="M12 8h.01" />
              </svg>
            </button>
          </div>
          <p className="admin-subtitle">Événements de sécurité, corrélation et audit trail.</p>
        </div>
      </div>

      <div className="admin-sections">
        <div className="admin-section">
          <h3 className="admin-section-title">
            <span className="admin-section-title-icon"><SectionIcon name="alert" /></span>
            Security Events
          </h3>
          <div className="admin-filters">
            <div className="admin-search">
              <svg className="admin-search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" />
                <path d="M21 21l-4.35-4.35" />
              </svg>
              <input type="text" placeholder="Tenant..." value={tenantFilter} onChange={(e) => setTenantFilter(e.target.value)} className="admin-search-input" />
            </div>
            <div className="admin-search">
              <svg className="admin-search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" />
                <path d="M21 21l-4.35-4.35" />
              </svg>
              <input type="text" placeholder="Utilisateur..." value={userFilter} onChange={(e) => setUserFilter(e.target.value)} className="admin-search-input" />
            </div>
            <select value={severityFilter} onChange={(e) => setSeverityFilter(e.target.value)} className="admin-select">
              <option value="">Toutes sévérités</option>
              <option value="critical">Critical</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>
          <div className="admin-table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Trace ID</th>
                  <th>Sévérité</th>
                  <th>Tenant</th>
                  <th>Utilisateur</th>
                  <th>Action</th>
                  <th>Résultat</th>
                  <th>Détecté le</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredEvents.map((event) => (
                  <tr key={event.id} className="admin-table-row">
                    <td className="admin-table-cell-primary">{event.traceId}</td>
                    <td>
                      <span className={`admin-severity-pill admin-severity-${event.severity}`}>{event.severity}</span>
                    </td>
                    <td>{event.tenant}</td>
                    <td>{event.user}</td>
                    <td>{event.action}</td>
                    <td>{event.result}</td>
                    <td>{event.detectedAt}</td>
                    <td>
                      <div className="admin-actions-cell">
                        {!event.investigation && (
                          <button type="button" className="admin-small-btn" onClick={() => markInvestigation(event.id)}>En investigation</button>
                        )}
                        {event.investigation && <span className="admin-investigation-badge">En investigation</span>}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="admin-section">
          <h3 className="admin-section-title">
            <span className="admin-section-title-icon"><SectionIcon name="source" /></span>
            Audit Trail
          </h3>
          <div className="admin-table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Trace ID</th>
                  <th>Auteur</th>
                  <th>Action</th>
                  <th>Cible</th>
                  <th>Résultat</th>
                  <th>Horodatage</th>
                </tr>
              </thead>
              <tbody>
                {auditTrail.map((item) => (
                  <tr key={item.id} className="admin-table-row">
                    <td className="admin-table-cell-primary">{item.traceId}</td>
                    <td>{item.actor}</td>
                    <td>{item.action}</td>
                    <td>{item.target}</td>
                    <td>{item.result}</td>
                    <td>{item.timestamp}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SecurityAuditPage;
