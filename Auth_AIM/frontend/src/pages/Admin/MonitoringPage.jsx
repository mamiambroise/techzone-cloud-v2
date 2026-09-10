import { useState } from 'react';
import { getMonitoring, searchTraceId as searchTraceIdService } from '../../services/adminMonitoringMockService';
import SectionIcon from '../../components/SectionIcon';
import './MonitoringPage.css';

function MonitoringPage() {
  const [monitoringData, _setMonitoringData] = useState(() => getMonitoring());
  const [traceSearch, setTraceSearch] = useState('');
  const [traceResult, setTraceResult] = useState(null);

  const handleTraceSearch = () => {
    const result = searchTraceIdService(traceSearch.trim());
    setTraceResult(result);
  };

  return (
    <div className="admin-page">
      <nav className="admin-breadcrumb">
        <span>Platform Administration</span>
        <span className="admin-breadcrumb-sep">/</span>
        <span className="admin-breadcrumb-current">Monitoring & Diagnostics</span>
      </nav>

      <div className="admin-header">
        <div>
          <div className="admin-title-row">
            <h1 className="admin-title">Monitoring & Diagnostics</h1>
            <button className="admin-info-btn" title="Information">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 16v-4" />
                <path d="M12 8h.01" />
              </svg>
            </button>
          </div>
          <p className="admin-subtitle">Santé globale, services et diagnostics détaillés.</p>
        </div>
      </div>

      <div className="admin-stats">
        <div className="admin-stat-card">
          <div className="admin-stat-icon" style={{ backgroundColor: '#10b98115', color: '#10b981' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
            </svg>
          </div>
          <div className="admin-stat-content">
            <span className="admin-stat-value">{monitoringData.health.global}</span>
            <span className="admin-stat-label">Health globale</span>
            <span className="admin-stat-context">Score {monitoringData.health.score}</span>
          </div>
        </div>
        <div className="admin-stat-card">
          <div className="admin-stat-icon" style={{ backgroundColor: '#ef444415', color: '#ef4444' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
          </div>
          <div className="admin-stat-content">
            <span className="admin-stat-value">{monitoringData.health.criticalErrors}</span>
            <span className="admin-stat-label">Erreurs critiques</span>
            <span className="admin-stat-context">Depuis 24h</span>
          </div>
        </div>
        <div className="admin-stat-card">
          <div className="admin-stat-icon" style={{ backgroundColor: '#7c3aed15', color: '#7c3aed' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
          </div>
          <div className="admin-stat-content">
            <span className="admin-stat-value">{monitoringData.health.latency}</span>
            <span className="admin-stat-label">Latence moyenne</span>
            <span className="admin-stat-context">Tous services</span>
          </div>
        </div>
        <div className="admin-stat-card">
          <div className="admin-stat-icon" style={{ backgroundColor: '#f59e0b15', color: '#f59e0b' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
              <line x1="8" y1="21" x2="16" y2="21" />
              <line x1="12" y1="17" x2="12" y2="21" />
            </svg>
          </div>
          <div className="admin-stat-content">
            <span className="admin-stat-value">{monitoringData.health.degradedDependencies.length}</span>
            <span className="admin-stat-label">Dépendances dégradées</span>
            <span className="admin-stat-context">{monitoringData.health.degradedDependencies.join(', ')}</span>
          </div>
        </div>
      </div>

      <div className="admin-sections">
        <div className="admin-section">
          <h3 className="admin-section-title">
            <span className="admin-section-title-icon"><SectionIcon name="grid" /></span>
            Health par service
          </h3>
          <div className="admin-table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Service</th>
                  <th>Statut</th>
                  <th>Latence</th>
                  <th>Erreurs</th>
                  <th>Uptime</th>
                </tr>
              </thead>
              <tbody>
                {monitoringData.services.map((service) => (
                  <tr key={service.name} className="admin-table-row">
                    <td className="admin-table-cell-primary">{service.name}</td>
                    <td>
                      <span className={`admin-status-pill admin-status-${service.status.toLowerCase()}`}>{service.status}</span>
                    </td>
                    <td>{service.latency}</td>
                    <td>{service.errors}</td>
                    <td>{service.uptime}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="admin-section">
          <h3 className="admin-section-title">
            <span className="admin-section-title-icon"><SectionIcon name="alert" /></span>
            Incidents récents
          </h3>
          <div className="admin-table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Incident</th>
                  <th>Sévérité</th>
                  <th>Service</th>
                  <th>Détecté le</th>
                  <th>Statut</th>
                </tr>
              </thead>
              <tbody>
                {monitoringData.incidents.map((incident) => (
                  <tr key={incident.id} className="admin-table-row">
                    <td className="admin-table-cell-primary">{incident.title}</td>
                    <td>
                      <span className={`admin-severity-pill admin-severity-${incident.severity}`}>{incident.severity}</span>
                    </td>
                    <td>{incident.service}</td>
                    <td>{incident.detectedAt}</td>
                    <td>{incident.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="admin-section">
          <h3 className="admin-section-title">
            <span className="admin-section-title-icon"><SectionIcon name="trend" /></span>
            Recherche par traceId
          </h3>
          <div className="admin-trace-search">
            <input
              type="text"
              placeholder="Ex: trace-abc-123"
              value={traceSearch}
              onChange={(e) => setTraceSearch(e.target.value)}
              className="admin-trace-input"
            />
            <button type="button" className="admin-trace-btn" onClick={handleTraceSearch}>Rechercher</button>
          </div>
          {traceResult && (
            <div className="admin-trace-result">
              <strong>Résultat :</strong> {traceResult.mockDetail}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default MonitoringPage;
