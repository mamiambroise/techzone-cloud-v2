import { useState, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { iamOverview, roleStats, connections24h, dashboardActivity } from '../../data/mock';
import DonutChart from '../../components/DonutChart';
import LineChart from '../../components/LineChart';
import { SectionIcon } from '../../components/SectionIcon';
import './IamOverviewPage.css';

const STATUS_CONFIG = {
  HEALTHY: { label: 'Sain', bg: 'var(--color-badge-success-bg)', text: 'var(--color-badge-success-text)' },
  WARNING: { label: 'À surveiller', bg: 'var(--color-badge-warning-bg)', text: 'var(--color-badge-warning-text)' },
  DEGRADED: { label: 'Dégradé', bg: 'var(--color-badge-danger-bg)', text: 'var(--color-badge-danger-text)' },
  CRITICAL: { label: 'Critique', bg: 'var(--color-badge-danger-bg)', text: 'var(--color-badge-danger-text)' },
};

const SEVERITY_ORDER = { CRITICAL: 0, HIGH: 1, WARNING: 2, INFO: 3 };

function formatRefresh(iso) {
  const d = new Date(iso);
  return d.toLocaleString('fr-FR', { dateStyle: 'medium', timeStyle: 'short' });
}

function scoreColor(score) {
  if (score >= 80) return '#10b981';
  if (score >= 50) return '#f59e0b';
  return '#ef4444';
}

function TrendArrow({ trend }) {
  if (trend === 'up') {
    return (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="6 15 12 9 18 15" />
      </svg>
    );
  }
  if (trend === 'down') {
    return (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="6 9 12 15 18 9" />
      </svg>
    );
  }
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}

function GlobalStatIcon({ name }) {
  const props = { width: 18, height: 18, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' };
  if (name === 'health') {
    return (
      <svg {...props}>
        <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
      </svg>
    );
  }
  if (name === 'security') {
    return (
      <svg {...props}>
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      </svg>
    );
  }
  if (name === 'readiness') {
    return (
      <svg {...props}>
        <polyline points="20 6 9 17 4 12" />
      </svg>
    );
  }
  if (name === 'context') {
    return (
      <svg {...props}>
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 01-2 2 2 2 0 012-2h.09a1.65 1.65 0 00-1.51 1z" />
      </svg>
    );
  }
  return null;
}

function SeverityPill({ severity }) {
  const cls = `iam-severity-pill iam-severity-${severity.toLowerCase()}`;
  return <span className={cls}>{severity}</span>;
}

function IamOverviewPage() {
  const data = iamOverview;
  const navigate = useNavigate();
  const alertsRef = useRef(null);
  const [mode, setMode] = useState(data.mode);
  const [severityFilter, setSeverityFilter] = useState('ALL');
  const [refreshing, setRefreshing] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (message) => {
    setToast(message);
    window.setTimeout(() => setToast(null), 2400);
  };

  const handleRefresh = () => {
    setRefreshing(true);
    showToast('Actualisation des données IAM…');
    window.setTimeout(() => setRefreshing(false), 900);
  };

  const handleScrollToAlerts = () => {
    alertsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleComingSoon = (feature) => {
    console.log(`[IAM] ${feature} - fonctionnalité à venir`);
    showToast('Fonctionnalité à venir');
  };

  const handleModeChange = (next) => {
    setMode(next);
    if (next !== 'STANDARD') {
      // TODO: différenciation Standard / Expert / Diagnostic — pour l'instant
      // les trois modes affichent le même contenu.
      showToast(`Mode ${next} — différenciation à venir`);
    }
  };

  const handleAlertDrill = (link) => {
    navigate(link);
  };

  const sortedAlerts = useMemo(() => {
    let list = [...data.alerts];
    if (severityFilter !== 'ALL') {
      list = list.filter((a) => a.severity === severityFilter);
    }
    return list.sort((a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity]);
  }, [data.alerts, severityFilter]);

  const statusBadge = STATUS_CONFIG[data.status];
  const severityCounts = useMemo(() => {
    const counts = { CRITICAL: 0, HIGH: 0, WARNING: 0, INFO: 0 };
    data.alerts.forEach((a) => { counts[a.severity] = (counts[a.severity] || 0) + 1; });
    return counts;
  }, [data.alerts]);

  const accessTotal = data.accessDecisions.allow + data.accessDecisions.deny;
  const allowPercent = Math.round((data.accessDecisions.allow / accessTotal) * 100);
  const denyPercent = 100 - allowPercent;

  return (
    <div className="iam-page">
      <nav className="iam-breadcrumb">
        <span>Auth + IAM + Context</span>
        <span className="iam-breadcrumb-sep">/</span>
        <span className="iam-breadcrumb-current">Vue d&apos;ensemble</span>
      </nav>

      <div className="iam-header">
        <div className="iam-header-left">
          <div className="iam-title-row">
            <h1 className="iam-title">Vue d&apos;ensemble</h1>
            <span
              className="iam-status-badge"
              style={{ backgroundColor: statusBadge.bg, color: statusBadge.text }}
            >
              {data.status}
            </span>
          </div>
          <p className="iam-subtitle">
            Dernière actualisation : {formatRefresh(data.lastRefresh)}
          </p>
        </div>
        <div className="iam-header-actions">
          <div className="iam-mode-switcher" role="tablist" aria-label="Mode d'affichage">
            {['STANDARD', 'EXPERT', 'DIAGNOSTIC'].map((m) => (
              <button
                key={m}
                type="button"
                role="tab"
                aria-selected={mode === m}
                className={`iam-mode-btn ${mode === m ? 'iam-mode-btn-active' : ''}`}
                onClick={() => handleModeChange(m)}
              >
                {m.charAt(0) + m.slice(1).toLowerCase()}
              </button>
            ))}
          </div>
          <button
            type="button"
            className="iam-btn-secondary"
            onClick={handleRefresh}
            disabled={refreshing}
          >
            {refreshing ? 'Actualisation…' : 'Actualiser'}
          </button>
          <button type="button" className="iam-btn-secondary" onClick={handleScrollToAlerts}>
            Voir les alertes
          </button>
          <button
            type="button"
            className="iam-btn-secondary"
            onClick={() => handleComingSoon('Rapport IAM')}
          >
            Rapport IAM
          </button>
          <button
            type="button"
            className="iam-btn-primary"
            onClick={() => handleComingSoon('Snapshot')}
          >
            Snapshot
          </button>
        </div>
      </div>

      <section className="iam-section">
        <h2 className="iam-section-title">Statut global</h2>
        <div className="iam-global-grid">
          {[
            { key: 'health', label: 'Health', icon: 'health' },
            { key: 'security', label: 'Security Posture', icon: 'security' },
            { key: 'readiness', label: 'Readiness', icon: 'readiness' },
            { key: 'contextIntegrity', label: 'Context Integrity', icon: 'context' },
          ].map((item) => {
            const value = data.globalStatus[item.key];
            const color = scoreColor(value.score);
            return (
              <div key={item.key} className="iam-global-card">
                <div className="iam-global-card-header">
                  <span className="iam-global-card-icon" style={{ backgroundColor: `${color}15`, color }}>
                    <GlobalStatIcon name={item.icon} />
                  </span>
                  <span className="iam-global-card-label">{item.label}</span>
                </div>
                <div className="iam-global-card-score" style={{ color }}>
                  {value.score}<span className="iam-global-card-score-suffix">/100</span>
                </div>
                <div className="iam-global-card-meta">
                  <span>{value.label}</span>
                  <span className={`iam-global-trend iam-global-trend-${value.trend}`}>
                    <TrendArrow trend={value.trend} />
                  </span>
                </div>
                <div className="iam-global-card-bar">
                  <div
                    className="iam-global-card-bar-fill"
                    style={{ width: `${value.score}%`, backgroundColor: color }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="iam-section">
        <h2 className="iam-section-title">Métriques cœur</h2>
        <div className="iam-stats-grid">
          <div className="iam-stat-card">
            <div className="iam-stat-icon" style={{ backgroundColor: '#2563eb15', color: '#2563eb' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
              </svg>
            </div>
            <div className="iam-stat-content">
              <span className="iam-stat-value">{data.coreMetrics.users}</span>
              <span className="iam-stat-label">Utilisateurs</span>
            </div>
          </div>
          <div className="iam-stat-card">
            <div className="iam-stat-icon" style={{ backgroundColor: '#10b98115', color: '#10b981' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="16" rx="2" />
                <circle cx="9" cy="12" r="2.5" />
                <path d="M15 8h2M15 12h2M15 16h2" />
              </svg>
            </div>
            <div className="iam-stat-content">
              <span className="iam-stat-value">{data.coreMetrics.identities}</span>
              <span className="iam-stat-label">Identités</span>
            </div>
          </div>
          <div className="iam-stat-card">
            <div className="iam-stat-icon" style={{ backgroundColor: '#7c3aed15', color: '#7c3aed' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
                <line x1="8" y1="21" x2="16" y2="21" />
                <line x1="12" y1="17" x2="12" y2="21" />
              </svg>
            </div>
            <div className="iam-stat-content">
              <span className="iam-stat-value">{data.coreMetrics.tenants}</span>
              <span className="iam-stat-label">Tenants</span>
            </div>
          </div>
          <div className="iam-stat-card">
            <div className="iam-stat-icon" style={{ backgroundColor: '#f59e0b15', color: '#f59e0b' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2L2 7l10 5 10-5-10-5z" />
                <path d="M2 17l10 5 10-5" />
                <path d="M2 12l10 5 10-5" />
              </svg>
            </div>
            <div className="iam-stat-content">
              <span className="iam-stat-value">{data.coreMetrics.roles}</span>
              <span className="iam-stat-label">Rôles</span>
            </div>
          </div>
          <div className="iam-stat-card">
            <div className="iam-stat-icon" style={{ backgroundColor: '#ec489915', color: '#ec4899' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="3" />
                <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 01-2 2 2 2 0 012-2h.09a1.65 1.65 0 00-1.51 1z" />
              </svg>
            </div>
            <div className="iam-stat-content">
              <span className="iam-stat-value">{data.coreMetrics.permissions}</span>
              <span className="iam-stat-label">Permissions</span>
            </div>
          </div>
          <div className="iam-stat-card">
            <div className="iam-stat-icon" style={{ backgroundColor: '#14b8a615', color: '#14b8a6' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
            </div>
            <div className="iam-stat-content">
              <span className="iam-stat-value">{data.coreMetrics.activeSessions}</span>
              <span className="iam-stat-label">Sessions actives</span>
            </div>
          </div>
          <div className="iam-stat-card">
            <div className="iam-stat-icon" style={{ backgroundColor: '#6366f115', color: '#6366f1' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="2" y1="12" x2="22" y2="12" />
                <path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" />
              </svg>
            </div>
            <div className="iam-stat-content">
              <span className="iam-stat-value">{data.coreMetrics.activeContexts}</span>
              <span className="iam-stat-label">Contextes actifs</span>
            </div>
          </div>
        </div>
      </section>

      <section className="iam-section" ref={alertsRef}>
        <div className="iam-section-header">
          <h2 className="iam-section-title">À traiter</h2>
          <div className="iam-severity-filter">
            {[
              { key: 'ALL', label: 'Toutes', count: data.alerts.length },
              { key: 'CRITICAL', label: 'Critique', count: severityCounts.CRITICAL },
              { key: 'HIGH', label: 'Haute', count: severityCounts.HIGH },
              { key: 'WARNING', label: 'Moyenne', count: severityCounts.WARNING },
              { key: 'INFO', label: 'Info', count: severityCounts.INFO },
            ].map((f) => (
              <button
                key={f.key}
                type="button"
                className={`iam-severity-btn ${severityFilter === f.key ? 'iam-severity-btn-active' : ''}`}
                onClick={() => setSeverityFilter(f.key)}
              >
                {f.label}
                <span className="iam-severity-btn-count">{f.count}</span>
              </button>
            ))}
          </div>
        </div>
        <div className="iam-alerts-list">
          {sortedAlerts.length === 0 && (
            <div className="iam-alerts-empty">Aucune alerte dans cette catégorie.</div>
          )}
          {sortedAlerts.map((alert) => (
            <div key={alert.id} className="iam-alert-item">
              <div className="iam-alert-left">
                <SeverityPill severity={alert.severity} />
                <div className="iam-alert-content">
                  <div className="iam-alert-title">{alert.title}</div>
                  <div className="iam-alert-description">{alert.description}</div>
                  <div className="iam-alert-meta">
                    <span className="iam-alert-module">{alert.module}</span>
                    <span className="iam-alert-sep">·</span>
                    <span className="iam-alert-time">{alert.createdAt}</span>
                  </div>
                </div>
              </div>
              <button
                type="button"
                className="iam-alert-link"
                onClick={() => handleAlertDrill(alert.link)}
              >
                Voir →
              </button>
            </div>
          ))}
        </div>
      </section>

      <section className="iam-section">
        <h2 className="iam-section-title">Accès &amp; Context</h2>
        <div className="iam-threecol-grid">
          <div className="iam-card">
            <div className="iam-card-header">
              <span className="iam-card-icon"><SectionIcon name="grid" /></span>
              <h3 className="iam-card-title">Context Explorer</h3>
            </div>
            <div className="iam-context-stats">
              <div className="iam-context-stat">
                <span className="iam-context-stat-value">{data.contextExplorer.activeContexts}</span>
                <span className="iam-context-stat-label">Contextes actifs</span>
              </div>
              <div className="iam-context-stat">
                <span
                  className="iam-context-stat-value"
                  style={{ color: data.contextExplorer.conflicts > 0 ? '#ef4444' : 'var(--color-text)' }}
                >
                  {data.contextExplorer.conflicts}
                </span>
                <span className="iam-context-stat-label">Conflits détectés</span>
              </div>
            </div>
            <div className="iam-context-foot">
              Dernière vérification : {formatRefresh(data.contextExplorer.lastCheck)}
            </div>
          </div>

          <div className="iam-card">
            <div className="iam-card-header">
              <span className="iam-card-icon"><SectionIcon name="pie" /></span>
              <h3 className="iam-card-title">Access Decisions</h3>
            </div>
            <div className="iam-decisions-summary">
              <div className="iam-decisions-row">
                <span className="iam-decisions-dot" style={{ backgroundColor: '#10b981' }} />
                <span className="iam-decisions-name">ALLOW</span>
                <span className="iam-decisions-value">{data.accessDecisions.allow}</span>
                <span className="iam-decisions-percent">{allowPercent}%</span>
              </div>
              <div className="iam-decisions-row">
                <span className="iam-decisions-dot" style={{ backgroundColor: '#ef4444' }} />
                <span className="iam-decisions-name">DENY</span>
                <span className="iam-decisions-value">{data.accessDecisions.deny}</span>
                <span className="iam-decisions-percent">{denyPercent}%</span>
              </div>
            </div>
            <div className="iam-decisions-bar">
              <div
                className="iam-decisions-bar-fill"
                style={{ width: `${allowPercent}%`, backgroundColor: '#10b981' }}
              />
            </div>
            <div className="iam-decisions-foot">
              Total 24h : {accessTotal} décisions
            </div>
          </div>

          <div className="iam-card">
            <div className="iam-card-header">
              <span className="iam-card-icon"><SectionIcon name="trophy" /></span>
              <h3 className="iam-card-title">IAM Coverage</h3>
            </div>
            <div className="iam-coverage-main">
              <div className="iam-coverage-percent" style={{ color: scoreColor(data.iamCoverage.percent) }}>
                {data.iamCoverage.percent}<span className="iam-coverage-suffix">%</span>
              </div>
              <div className="iam-coverage-label">Modules IAM instrumentés</div>
            </div>
            <div className="iam-coverage-bar">
              <div
                className="iam-coverage-bar-fill"
                style={{ width: `${data.iamCoverage.percent}%`, backgroundColor: scoreColor(data.iamCoverage.percent) }}
              />
            </div>
            <div className="iam-coverage-lists">
              <div className="iam-coverage-group">
                <span className="iam-coverage-group-label">Couverts</span>
                <div className="iam-coverage-tags">
                  {data.iamCoverage.coveredModules.map((m) => (
                    <span key={m} className="iam-tag iam-tag-success">{m}</span>
                  ))}
                </div>
              </div>
              <div className="iam-coverage-group">
                <span className="iam-coverage-group-label">Non couverts</span>
                <div className="iam-coverage-tags">
                  {data.iamCoverage.uncoveredModules.map((m) => (
                    <span key={m} className="iam-tag iam-tag-warning">{m}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="iam-section">
        <h2 className="iam-section-title">Sécurité &amp; Gouvernance</h2>
        <div className="iam-threecol-grid">
          <div className="iam-card">
            <div className="iam-card-header">
              <span className="iam-card-icon"><SectionIcon name="users" /></span>
              <h3 className="iam-card-title">Comptes privilégiés</h3>
            </div>
            <div className="iam-priv-list">
              {data.privilegedAccounts.map((acc) => (
                <div key={acc.userId} className="iam-priv-item">
                  <div className="iam-priv-avatar">{acc.name.split(' ').map((p) => p[0]).join('').slice(0, 2)}</div>
                  <div className="iam-priv-info">
                    <span className="iam-priv-name">{acc.name}</span>
                    <span className="iam-priv-meta">{acc.role} · {acc.lastActivity}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="iam-card">
            <div className="iam-card-header">
              <span className="iam-card-icon"><SectionIcon name="clock" /></span>
              <h3 className="iam-card-title">Changements sensibles récents</h3>
            </div>
            <ol className="iam-timeline">
              {data.sensitiveChanges.map((change) => (
                <li key={change.id} className="iam-timeline-item">
                  <span className="iam-timeline-dot" />
                  <div className="iam-timeline-body">
                    <div className="iam-timeline-text">
                      <strong>{change.actor}</strong> {change.action} <strong>{change.target}</strong>
                    </div>
                    <span className="iam-timeline-time">{change.timestamp}</span>
                  </div>
                </li>
              ))}
            </ol>
          </div>

          <div className="iam-card">
            <div className="iam-card-header">
              <span className="iam-card-icon"><SectionIcon name="alert" /></span>
              <h3 className="iam-card-title">Sessions à risque</h3>
            </div>
            <div className="iam-risk-list">
              {data.riskySessions.map((s) => (
                <div key={s.sessionId} className="iam-risk-item">
                  <div className="iam-risk-info">
                    <span className="iam-risk-reason">{s.reason}</span>
                    <span className="iam-risk-meta">
                      Utilisateur #{s.userId} · {s.location}
                    </span>
                    <code className="iam-risk-ip">{s.ip}</code>
                  </div>
                  <button
                    type="button"
                    className="iam-risk-link"
                    onClick={() => navigate('/sessions')}
                  >
                    Voir →
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="iam-section">
        <h2 className="iam-section-title">Activité &amp; Tendances</h2>
        <div className="iam-fourcol-grid">
          <div className="iam-card iam-card-wide">
            <div className="iam-card-header">
              <span className="iam-card-icon"><SectionIcon name="trend" /></span>
              <h3 className="iam-card-title">Connexions (24h)</h3>
            </div>
            <LineChart
              data={connections24h}
              stats={[
                { value: String(data.coreMetrics.activeSessions), label: 'Sessions actives' },
                { value: '1284', label: 'Connexions' },
                { value: '73', label: 'Refusées' },
              ]}
            />
          </div>

          <div className="iam-card iam-card-wide">
            <div className="iam-card-header">
              <span className="iam-card-icon"><SectionIcon name="pie" /></span>
              <h3 className="iam-card-title">Répartition par rôle</h3>
            </div>
            <DonutChart data={roleStats} size={160} />
          </div>

          <div className="iam-card iam-card-wide">
            <div className="iam-card-header">
              <span className="iam-card-icon"><SectionIcon name="grid" /></span>
              <h3 className="iam-card-title">Activité par tenant</h3>
            </div>
            <div className="iam-tenant-list">
              {data.tenantActivity.map((t) => (
                <div key={t.tenantId} className="iam-tenant-item">
                  <div className="iam-tenant-row">
                    <span className="iam-tenant-name">{t.tenantName}</span>
                    <span className="iam-tenant-score">{t.activityScore}</span>
                  </div>
                  <div className="iam-tenant-bar-bg">
                    <div
                      className="iam-tenant-bar"
                      style={{
                        width: `${t.activityScore}%`,
                        backgroundColor: t.trend === 'up' ? '#10b981' : '#ef4444',
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="iam-card iam-card-wide">
            <div className="iam-card-header">
              <span className="iam-card-icon"><SectionIcon name="clock" /></span>
              <h3 className="iam-card-title">Activité récente</h3>
            </div>
            <ol className="iam-recent-list">
              {dashboardActivity.map((item) => (
                <li key={item.id} className="iam-recent-item">
                  <span className={`iam-recent-dot iam-recent-dot-${item.type}`} />
                  <div className="iam-recent-body">
                    <div className="iam-recent-title">{item.title}</div>
                    <div className="iam-recent-meta">
                      {item.actor} · {item.detail}
                    </div>
                  </div>
                  <span className="iam-recent-time">{item.time}</span>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      {toast && (
        <div className="iam-toast" role="status">{toast}</div>
      )}
    </div>
  );
}

export default IamOverviewPage;