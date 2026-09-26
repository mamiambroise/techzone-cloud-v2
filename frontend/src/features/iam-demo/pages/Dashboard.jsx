import { dashboardMetrics, dashboardActions, dashboardActivity, activityTypeConfig, userStatusStats, tenantStatusStats, orgTypeStats, connections24h, recentUsers } from '../data/mock';
import SectionIcon from '../components/SectionIcon';
import DonutChart from '../components/DonutChart';
import LineChart from '../components/LineChart';
import './Dashboard.css';

function MetricSparkline({ data, color }) {
  if (!data || data.length < 2) return null;
  const width = 90;
  const height = 28;
  const max = Math.max(...data, 1);
  const min = Math.min(...data, 0);
  const range = max - min || 1;
  const points = data
    .map((val, idx) => {
      const x = (idx / (data.length - 1)) * width;
      const y = height - ((val - min) / range) * height;
      return `${x},${y}`;
    })
    .join(' ');

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="dashboard-sparkline">
      <polyline
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={points}
      />
    </svg>
  );
}

function MetricIcon({ name }) {
  const props = {
    width: 18,
    height: 18,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 2,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
  };
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
  if (name === 'sessions') {
    return (
      <svg {...props}>
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
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
        <polyline points="20 6 9 17 4 12" />
      </svg>
    );
  }
  return null;
}

function Dashboard() {
  const metrics = [
    {
      key: 'activeUsers',
      label: 'Utilisateurs actifs',
      icon: 'users',
      ...dashboardMetrics.activeUsers,
    },
    {
      key: 'activeSessions',
      label: 'Sessions actives',
      icon: 'sessions',
      ...dashboardMetrics.activeSessions,
    },
    {
      key: 'securityAlerts',
      label: 'Alertes de sécurité',
      icon: 'alert',
      ...dashboardMetrics.securityAlerts,
    },
    {
      key: 'systemHealth',
      label: 'Santé du système',
      icon: 'health',
      ...dashboardMetrics.systemHealth,
    },
  ];

  return (
    <div className="dashboard-page">
      <nav className="dashboard-breadcrumb">
        <span>Auth + IAM + Context</span>
        <span className="dashboard-breadcrumb-sep">/</span>
        <span className="dashboard-breadcrumb-current">Tableau de bord</span>
      </nav>

      <div className="dashboard-header">
        <div>
          <div className="dashboard-title-row">
            <h1 className="dashboard-title">Vue d'ensemble</h1>
            <button className="dashboard-info-btn" title="Information">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 16v-4" />
                <path d="M12 8h.01" />
              </svg>
            </button>
          </div>
          <p className="dashboard-subtitle">
            Cockpit d'authentification et de gestion des identités — état global du tenant.
          </p>
        </div>
      </div>

      <div className="dashboard-stats">
        {metrics.map((m) => (
          <div key={m.key} className="dashboard-stat-card">
            <div className="dashboard-stat-icon" style={{ backgroundColor: `${m.color}15`, color: m.color }}>
              <MetricIcon name={m.icon} />
            </div>
            <div className="dashboard-stat-content">
              <span className="dashboard-stat-value">{m.value}</span>
              <span className="dashboard-stat-label">{m.label}</span>
              <span className="dashboard-stat-context">{m.context}</span>
            </div>
            {m.trend ? (
              <div className="dashboard-stat-spark">
                <MetricSparkline data={m.trend} color={m.color} />
              </div>
            ) : null}
          </div>
        ))}
      </div>

      <div className="dashboard-grid">
        <section className="dashboard-card">
          <div className="dashboard-card-header">
            <h3 className="dashboard-card-title">
              <span className="dashboard-card-title-icon"><SectionIcon name="alert" /></span>
              À traiter maintenant
            </h3>
            <span className="dashboard-card-badge">{dashboardActions.length}</span>
          </div>
          <ul className="dashboard-action-list">
            {dashboardActions.map((a) => (
              <li key={a.id} className={`dashboard-action-item dashboard-action-${a.priority}`}>
                <span className={`dashboard-action-dot dashboard-action-dot-${a.priority}`} />
                <div className="dashboard-action-text">
                  <span className="dashboard-action-title">{a.title}</span>
                  <span className="dashboard-action-context">{a.context}</span>
                </div>
              </li>
            ))}
          </ul>
        </section>

        <section className="dashboard-card dashboard-card-activity">
          <div className="dashboard-card-header">
            <h3 className="dashboard-card-title">
              <span className="dashboard-card-title-icon"><SectionIcon name="clock" /></span>
              Activité récente
            </h3>
            <a href="#activity" className="dashboard-card-link">Voir le journal complet →</a>
          </div>
          <ul className="dashboard-activity-list">
            {dashboardActivity.map((e) => {
              const cfg = activityTypeConfig[e.type] || activityTypeConfig.info;
              return (
                <li key={e.id} className="dashboard-activity-item">
                  <span
                    className="dashboard-activity-dot"
                    style={{ backgroundColor: cfg.color }}
                    title={cfg.label}
                  />
                  <div className="dashboard-activity-text">
                    <div className="dashboard-activity-line">
                      <span className="dashboard-activity-title">{e.title}</span>
                      <span className="dashboard-activity-actor">· {e.actor}</span>
                    </div>
                    <span className="dashboard-activity-detail">{e.detail}</span>
                  </div>
                  <span className="dashboard-activity-time">{e.time}</span>
                </li>
              );
            })}
          </ul>
        </section>
      </div>

      <div className="dashboard-charts-grid">
        <section className="dashboard-card">
          <div className="dashboard-card-header">
            <h3 className="dashboard-card-title">
              <span className="dashboard-card-title-icon"><SectionIcon name="users" /></span>
              Répartition des utilisateurs par statut
            </h3>
          </div>
          <DonutChart data={userStatusStats} size={170} />
        </section>

        <section className="dashboard-card">
          <div className="dashboard-card-header">
            <h3 className="dashboard-card-title">
              <span className="dashboard-card-title-icon"><SectionIcon name="grid" /></span>
              Répartition des tenants par statut
            </h3>
          </div>
          <DonutChart data={tenantStatusStats} size={170} />
        </section>

        <section className="dashboard-card">
          <div className="dashboard-card-header">
            <h3 className="dashboard-card-title">
              <span className="dashboard-card-title-icon"><SectionIcon name="pie" /></span>
              Répartition des organisations par type
            </h3>
          </div>
          <DonutChart data={orgTypeStats} size={170} />
        </section>
      </div>

      <div className="dashboard-grid">
        <section className="dashboard-card">
          <div className="dashboard-card-header">
            <h3 className="dashboard-card-title">
              <span className="dashboard-card-title-icon"><SectionIcon name="trend" /></span>
              Connexions (24h)
            </h3>
          </div>
          <LineChart data={connections24h} stats={[
            { value: '37', label: 'Sessions actives' },
            { value: '156', label: 'Connexions' },
            { value: '3', label: 'Échecs' },
            { value: '1', label: 'Suspectes' },
          ]} />
        </section>

        <section className="dashboard-card">
          <div className="dashboard-card-header">
            <h3 className="dashboard-card-title">
              <span className="dashboard-card-title-icon"><SectionIcon name="clock" /></span>
              Derniers utilisateurs créés
            </h3>
            <a href="/users" className="dashboard-card-link">Voir tout →</a>
          </div>
          <div className="dashboard-recent-list">
            {recentUsers.map((u) => (
              <div key={u.id} className="dashboard-recent-item">
                <div className="dashboard-recent-info">
                  <span className="dashboard-recent-name">{u.firstName} {u.lastName}</span>
                  <span className="dashboard-recent-email">{u.email}</span>
                </div>
                <span className={`dashboard-recent-status dashboard-recent-status-${u.status}`}>{u.status}</span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

export default Dashboard;
