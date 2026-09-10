import { useState } from 'react';
import { getOverview, searchTraceId } from '../../services/adminMonitoringMockService';
import DonutChart from '../../components/DonutChart';
import LineChart from '../../components/LineChart';
import SectionIcon from '../../components/SectionIcon';
import './OverviewPage.css';

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
  if (name === 'tenant') {
    return (
      <svg {...props}>
        <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
        <line x1="8" y1="21" x2="16" y2="21" />
        <line x1="12" y1="17" x2="12" y2="21" />
      </svg>
    );
  }
  if (name === 'alert') {
    return (
      <svg {...props}>
        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
        <line x1="12" y1="9" x2="12" y2="13" />
        <line x1="12" y1="17" x2="12.01" y2="17" />
      </svg>
    );
  }
  if (name === 'health') {
    return (
      <svg {...props}>
        <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
      </svg>
    );
  }
  return null;
}

function OverviewPage() {
  const [overview] = useState(() => getOverview());
  const [traceSearch, setTraceSearch] = useState('');
  const [traceResult, setTraceResult] = useState(null);

  const handleTraceSearch = () => {
    const result = searchTraceId(traceSearch.trim());
    setTraceResult(result);
  };

  return (
    <div className="admin-overview-page">
      <nav className="admin-breadcrumb">
        <span>Platform Administration</span>
        <span className="admin-breadcrumb-sep">/</span>
        <span className="admin-breadcrumb-current">Vue d'ensemble</span>
      </nav>

      <div className="admin-header">
        <div>
          <div className="admin-title-row">
            <h1 className="admin-title">Vue d'ensemble</h1>
            <button className="admin-info-btn" title="Information">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 16v-4" />
                <path d="M12 8h.01" />
              </svg>
            </button>
          </div>
          <p className="admin-subtitle">Cockpit administratif global de la plateforme.</p>
        </div>
      </div>

      <div className="admin-stats">
        {overview.stats.map((stat) => (
          <div key={stat.label} className="admin-stat-card">
            <div className="admin-stat-icon" style={{ backgroundColor: `${stat.color}15`, color: stat.color }}>
              <StatIcon name={stat.icon} />
            </div>
            <div className="admin-stat-content">
              <span className="admin-stat-value">{stat.value}</span>
              <span className="admin-stat-label">{stat.label}</span>
              <span className="admin-stat-context">{stat.context}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="admin-charts">
        <div className="admin-chart-card">
          <h3 className="admin-chart-title">
            <span className="admin-section-title-icon"><SectionIcon name="pie" /></span>
            Health par service
          </h3>
          <div className="admin-chart-body">
            <DonutChart data={overview.charts.serviceHealthDistribution} size={180} />
            <div className="admin-chart-legend">
              {overview.charts.serviceHealthDistribution.map((item) => (
                <div key={item.name} className="admin-chart-legend-item">
                  <span className="admin-chart-legend-dot" style={{ backgroundColor: item.color }} />
                  <span className="admin-chart-legend-name">{item.name}</span>
                  <span className="admin-chart-legend-value">{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="admin-chart-card">
          <h3 className="admin-chart-title">
            <span className="admin-section-title-icon"><SectionIcon name="trend" /></span>
            Tendance incidents
          </h3>
          <div className="admin-chart-body">
            <LineChart
              data={overview.charts.incidentTrend.map((p) => p.incidents)}
              width={420}
              height={180}
              stats={[
                { label: 'Max', value: String(Math.max(...overview.charts.incidentTrend.map((p) => p.incidents))) },
                { label: 'Moyenne', value: String((overview.charts.incidentTrend.reduce((s, p) => s + p.incidents, 0) / overview.charts.incidentTrend.length).toFixed(1)) },
              ]}
            />
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
                  <th>Dépendances</th>
                </tr>
              </thead>
              <tbody>
                {overview.services.map((service) => (
                  <tr key={service.name} className="admin-table-row">
                    <td className="admin-table-cell-primary">{service.name}</td>
                    <td>
                      <span className={`admin-status-pill admin-status-${service.status.toLowerCase()}`}>{service.status}</span>
                    </td>
                    <td>{service.latency}</td>
                    <td>{service.errors}</td>
                    <td>{service.dependencies.join(', ')}</td>
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
                {overview.incidents.map((incident) => (
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

export default OverviewPage;
