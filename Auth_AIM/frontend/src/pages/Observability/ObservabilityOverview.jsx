import { useState, useMemo, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../../components/observability/useToast';
import {
  obsGlobalStatus,
  obsCoreMetrics,
  obsAlerts,
  obsContextExplorer,
  obsAccessDecisions,
  obsCoverage,
  obsPrivilegedAccounts,
  obsSensitiveChanges,
  obsRiskySessions,
  obsConnectionsTrend,
  obsRoleDistribution,
  obsTenantActivity,
  obsRecentActivity,
  obsComponentHealth,
  obsDiagnostics,
  obsModeData,
  obsRefreshInterval,
} from '../../data/observability/cockpitMock';
import { StatusBadge } from '../../components/observability/StatusBadge';
import { SeverityBadge } from '../../components/observability/SeverityBadge';
import { KpiCard } from '../../components/observability/KpiCard';
import { FilterBar } from '../../components/observability/FilterBar';
import { ConfirmationModal } from '../../components/observability/ConfirmationModal';
import { Timeline } from '../../components/observability/Timeline';
import LineChart from '../../components/LineChart';
import DonutChart from '../../components/DonutChart';
import { SectionIcon } from '../../components/SectionIcon';
import './ObservabilityOverview.css';

const SEVERITY_FILTERS = [
  { key: 'ALL', label: 'Toutes' },
  { key: 'CRITICAL', label: 'Critique' },
  { key: 'HIGH', label: 'Haute' },
  { key: 'WARNING', label: 'Moyenne' },
  { key: 'INFO', label: 'Info' },
];

const PERIODS = ['24h', '7j', '30j', 'Custom'];
const MODES = ['STANDARD', 'EXPERT', 'DIAGNOSTIC'];
const REFRESH_OPTIONS = ['Manual', '30 sec', '1 min', '5 min', 'OFF'];

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

function GlobalStatusIcon({ name }) {
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

function ObservabilityOverview() {
  const navigate = useNavigate();
  const { toast, showToast } = useToast();
  const [mode, setMode] = useState('STANDARD');
  const [refreshOption, setRefreshOption] = useState('Manual');
  const [lastRefresh, setLastRefresh] = useState(new Date().toISOString());
  const [severityFilter, setSeverityFilter] = useState('ALL');
  const [period, setPeriod] = useState('24h');
  const [refreshing, setRefreshing] = useState(false);
  const [snapshots, setSnapshots] = useState([]);
  const [showSnapshotModal, setShowSnapshotModal] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [alertDetail, setAlertDetail] = useState(null);
  const [ackModal, setAckModal] = useState(null);
  const refreshTimerRef = useRef(null);

  const data = obsGlobalStatus;
  const modeConfig = obsModeData[mode] || obsModeData.STANDARD;

  const filteredAlerts = useMemo(() => {
    let list = [...obsAlerts];
    if (severityFilter !== 'ALL') {
      list = list.filter((a) => a.severity === severityFilter);
    }
    return list.sort((a, b) => {
      const order = { CRITICAL: 0, HIGH: 1, WARNING: 2, INFO: 3 };
      return (order[a.severity] || 9) - (order[b.severity] || 9);
    });
  }, [severityFilter]);

  const severityCounts = useMemo(() => {
    const counts = { CRITICAL: 0, HIGH: 0, WARNING: 0, INFO: 0 };
    obsAlerts.forEach((a) => { counts[a.severity] = (counts[a.severity] || 0) + 1; });
    return counts;
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    showToast('Actualisation des données…');
    window.setTimeout(() => {
      setLastRefresh(new Date().toISOString());
      setRefreshing(false);
    }, 800);
  };

  useEffect(() => {
    if (refreshTimerRef.current) clearInterval(refreshTimerRef.current);
    const interval = obsRefreshInterval[refreshOption];
    if (interval && interval > 0) {
      refreshTimerRef.current = window.setInterval(() => {
        setLastRefresh(new Date().toISOString());
      }, interval);
    }
    return () => {
      if (refreshTimerRef.current) clearInterval(refreshTimerRef.current);
    };
  }, [refreshOption]);

  const handleSnapshot = () => {
    const id = `snap-${Date.now().toString(36)}`;
    const snapshot = {
      id,
      createdAt: new Date().toISOString(),
      mode,
      period,
      globalStatus: data,
      coreMetrics: obsCoreMetrics,
      alerts: obsAlerts,
    };
    setSnapshots((prev) => [snapshot, ...prev]);
    setShowSnapshotModal(false);
    showToast(`Snapshot ${id} créé`);
  };

  const handleAcknowledge = (alertId) => {
    setAckModal(alertId);
  };

  const confirmAcknowledge = () => {
    if (!ackModal) return;
    const alert = obsAlerts.find((a) => a.id === ackModal);
    if (alert) {
      alert.status = 'ACKNOWLEDGED';
      showToast(`Alerte ${ackModal} acquittée`);
    }
    setAckModal(null);
    setAlertDetail(null);
  };

  const handleAlertAction = (alertId, action) => {
    const alert = obsAlerts.find((a) => a.id === alertId);
    if (!alert) return;
    if (action === 'ack') {
      alert.status = 'ACKNOWLEDGED';
      showToast(`Alerte ${alertId} acquittée`);
    } else if (action === 'resolve') {
      alert.status = 'RESOLVED';
      showToast(`Alerte ${alertId} résolue`);
    } else if (action === 'suppress') {
      alert.status = 'SUPPRESSED';
      showToast(`Alerte ${alertId} supprimée`);
    }
    setAlertDetail(null);
  };

  const accessTotal = obsAccessDecisions.allow + obsAccessDecisions.deny;
  const allowPercent = Math.round((obsAccessDecisions.allow / accessTotal) * 100);

  return (
    <div className="obs-page">
      <nav className="obs-breadcrumb">
        <span>Observability & Security</span>
        <span className="obs-breadcrumb-sep">/</span>
        <span className="obs-breadcrumb-current">Vue d'ensemble</span>
      </nav>

      <div className="obs-header">
        <div className="obs-header-left">
          <div className="obs-title-row">
            <h1 className="obs-title">Vue d'ensemble</h1>
            <StatusBadge status={data.platformHealth.status} />
          </div>
          <p className="obs-subtitle">Dernière actualisation : {formatRefresh(lastRefresh)}</p>
        </div>
        <div className="obs-header-actions">
          <div className="obs-mode-switcher" role="tablist" aria-label="Mode d'affichage">
            {MODES.map((m) => (
              <button
                key={m}
                type="button"
                role="tab"
                aria-selected={mode === m}
                className={`obs-mode-btn ${mode === m ? 'obs-mode-btn-active' : ''}`}
                onClick={() => setMode(m)}
              >
                {m === 'STANDARD' ? 'Standard' : m === 'EXPERT' ? 'Expert' : 'Diagnostic'}
              </button>
            ))}
          </div>
          <select
            className="obs-select"
            value={refreshOption}
            onChange={(e) => setRefreshOption(e.target.value)}
          >
            {REFRESH_OPTIONS.map((r) => (
              <option key={r} value={r}>{r === 'Manual' ? 'Manuel' : r === 'OFF' ? 'Désactivé' : r}</option>
            ))}
          </select>
          <select
            className="obs-select"
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
          >
            {PERIODS.map((p) => (
              <option key={p} value={p}>{p === '24h' ? '24 h' : p === '7j' ? '7 j' : p === '30j' ? '30 j' : 'Custom'}</option>
            ))}
          </select>
          <button type="button" className="obs-btn-secondary" onClick={handleRefresh} disabled={refreshing}>
            {refreshing ? 'Actualisation…' : 'Actualiser'}
          </button>
          <button type="button" className="obs-btn-secondary" onClick={() => navigate('/observability/alerts')}>
            Voir les alertes
          </button>
          <button type="button" className="obs-btn-secondary" onClick={() => setShowReport(true)}>
            Rapport IAM
          </button>
          <button type="button" className="obs-btn-primary" onClick={() => setShowSnapshotModal(true)}>
            Snapshot
          </button>
        </div>
      </div>

      {modeConfig.sections.includes('globalStatus') && (
        <section className="obs-section">
          <h2 className="obs-section-title">Global Status</h2>
          <div className="obs-global-grid">
            {[
              { key: 'platformHealth', label: 'Platform Health', icon: 'health' },
              { key: 'securityPosture', label: 'Security Posture', icon: 'security' },
              { key: 'iamReadiness', label: 'IAM Readiness', icon: 'readiness' },
              { key: 'contextIntegrity', label: 'Context Integrity', icon: 'context' },
            ].map((item) => {
              const value = data[item.key];
              const color = scoreColor(value.score);
              return (
                <div key={item.key} className="obs-global-card">
                  <div className="obs-global-card-header">
                    <span className="obs-global-card-icon" style={{ backgroundColor: `${color}15`, color }}>
                      <GlobalStatusIcon name={item.icon} />
                    </span>
                    <span className="obs-global-card-label">{item.label}</span>
                  </div>
                  <div className="obs-global-card-score" style={{ color }}>{value.score}<span className="obs-global-card-score-suffix">/100</span></div>
                  <div className="obs-global-card-meta">
                    <span>{value.label}</span>
                    <span className={`obs-global-trend obs-global-trend-${value.trend}`}><TrendArrow trend={value.trend} /></span>
                  </div>
                  <div className="obs-global-card-bar">
                    <div className="obs-global-card-bar-fill" style={{ width: `${value.score}%`, backgroundColor: color }} />
                  </div>
                  {mode === 'EXPERT' || mode === 'DIAGNOSTIC' ? (
                    <div className="obs-global-card-details">{value.details}</div>
                  ) : null}
                </div>
              );
            })}
          </div>
        </section>
      )}

      {modeConfig.sections.includes('coreMetrics') && (
        <section className="obs-section">
          <h2 className="obs-section-title">Core Metrics</h2>
          <div className="obs-stats-grid">
            <KpiCard label="Users" value={obsCoreMetrics.users} context="Comptes enregistrés" color="#2563eb" icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /></svg>} onClick={() => navigate('/users')} />
            <KpiCard label="Identities" value={obsCoreMetrics.identities} context="Types liés" color="#10b981" icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="16" rx="2" /><circle cx="9" cy="12" r="2.5" /></svg>} onClick={() => navigate('/identities')} />
            <KpiCard label="Tenants" value={obsCoreMetrics.tenants} context="Environnements" color="#7c3aed" icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2" ry="2" /><line x1="8" y1="21" x2="16" y2="21" /></svg>} onClick={() => navigate('/tenants')} />
            <KpiCard label="Rôles" value={obsCoreMetrics.roles} context="Définis" color="#f59e0b" icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5z" /><path d="M2 17l10 5 10-5" /></svg>} onClick={() => navigate('/roles')} />
            <KpiCard label="Permissions" value={obsCoreMetrics.permissions} context="Actives" color="#ec4899" icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 01-2 2 2 2 0 012-2h.09a1.65 1.65 0 00-1.51 1z" /></svg>} onClick={() => navigate('/policies')} />
            <KpiCard label="Sessions" value={obsCoreMetrics.sessions} context="Actives" color="#14b8a6" icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>} onClick={() => navigate('/sessions')} />
            <KpiCard label="Contextes" value={obsCoreMetrics.contexts} context="Actifs" color="#6366f1" icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="2" y1="12" x2="22" y2="12" /></svg>} onClick={() => navigate('/contexts')} />
          </div>
        </section>
      )}

      {modeConfig.sections.includes('alerts') && (
        <section className="obs-section">
          <div className="obs-section-header">
            <h2 className="obs-section-title">À traiter</h2>
            <FilterBar
              filters={SEVERITY_FILTERS.map((f) => ({ key: f.key, label: f.label, count: f.key === 'ALL' ? obsAlerts.length : severityCounts[f.key] }))}
              activeFilter={severityFilter}
              onFilterChange={setSeverityFilter}
            />
          </div>
          <div className="obs-alerts-list">
            {filteredAlerts.length === 0 && <div className="obs-alerts-empty">Aucune alerte dans cette catégorie.</div>}
            {filteredAlerts.map((alert) => (
              <div key={alert.id} className="obs-alert-item">
                <div className="obs-alert-left">
                  <SeverityBadge severity={alert.severity} />
                  <div className="obs-alert-content">
                    <div className="obs-alert-title">{alert.title}</div>
                    <div className="obs-alert-description">{alert.description}</div>
                    <div className="obs-alert-meta">
                      <span className="obs-alert-module">{alert.module}</span>
                      <span className="obs-alert-sep">·</span>
                      <span className="obs-alert-time">{alert.createdAt}</span>
                    </div>
                  </div>
                </div>
                <div className="obs-alert-actions">
                  <button type="button" className="obs-alert-link" onClick={() => setAlertDetail(alert)}>Détail</button>
                  {alert.status === 'OPEN' && (
                    <button type="button" className="obs-alert-action" onClick={() => handleAcknowledge(alert.id)}>Acquitter</button>
                  )}
                  {alert.status === 'ACKNOWLEDGED' && (
                    <button type="button" className="obs-alert-action" onClick={() => handleAlertAction(alert.id, 'resolve')}>Résoudre</button>
                  )}
                  {alert.link && (
                    <button type="button" className="obs-alert-link" onClick={() => navigate(alert.link)}>Voir →</button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {modeConfig.sections.includes('componentHealth') && (
        <section className="obs-section">
          <h2 className="obs-section-title">Component Health</h2>
          <div className="obs-component-grid">
            {obsComponentHealth.map((comp) => (
              <div key={comp.componentId} className="obs-component-card">
                <div className="obs-component-header">
                  <span className="obs-component-name">{comp.name}</span>
                  <StatusBadge status={comp.status} />
                </div>
                <div className="obs-component-meta">
                  <span>Latence: {comp.latency}ms</span>
                  <span>Dépendances: {comp.dependencies.length}</span>
                </div>
                <div className="obs-component-details">{comp.detailsSafe}</div>
              </div>
            ))}
          </div>
        </section>
      )}

      {modeConfig.sections.includes('contextExplorer') && (
        <section className="obs-section">
          <h2 className="obs-section-title">Access & Context</h2>
          <div className="obs-threecol-grid">
            <div className="obs-card">
              <div className="obs-card-header">
                <span className="obs-card-icon"><SectionIcon name="grid" /></span>
                <h3 className="obs-card-title">Context Explorer</h3>
              </div>
              <div className="obs-context-chain">
                {['User', 'Tenant', 'Application', 'Pack', 'Environment', 'ERP', 'Role', 'Permissions', 'Policies', 'Context'].map((step, idx) => (
                  <div key={step} className="obs-context-step">
                    <span className="obs-context-step-label">{step}</span>
                    {idx < 9 && <span className="obs-context-step-arrow">↓</span>}
                  </div>
                ))}
              </div>
              <div className="obs-context-footer">
                <StatusBadge status={obsContextExplorer.contextState} />
                <span>Context ID: {obsContextExplorer.contextId}</span>
                <span>Hash: {obsContextExplorer.contextHash}</span>
              </div>
            </div>

            <div className="obs-card">
              <div className="obs-card-header">
                <span className="obs-card-icon"><SectionIcon name="pie" /></span>
                <h3 className="obs-card-title">Access Decisions</h3>
              </div>
              <div className="obs-decisions-summary">
                <div className="obs-decisions-row">
                  <span className="obs-decisions-dot" style={{ backgroundColor: '#10b981' }} />
                  <span className="obs-decisions-name">ALLOW</span>
                  <span className="obs-decisions-value">{obsAccessDecisions.allow}</span>
                  <span className="obs-decisions-percent">{allowPercent}%</span>
                </div>
                <div className="obs-decisions-row">
                  <span className="obs-decisions-dot" style={{ backgroundColor: '#ef4444' }} />
                  <span className="obs-decisions-name">DENY</span>
                  <span className="obs-decisions-value">{obsAccessDecisions.deny}</span>
                  <span className="obs-decisions-percent">{100 - allowPercent}%</span>
                </div>
              </div>
              <div className="obs-decisions-bar">
                <div className="obs-decisions-bar-fill" style={{ width: `${allowPercent}%`, backgroundColor: '#10b981' }} />
              </div>
              <div className="obs-decisions-foot">Total 24h : {accessTotal} décisions</div>
            </div>

            <div className="obs-card">
              <div className="obs-card-header">
                <span className="obs-card-icon"><SectionIcon name="trophy" /></span>
                <h3 className="obs-card-title">IAM Coverage</h3>
              </div>
              <div className="obs-coverage-main">
                <div className="obs-coverage-percent" style={{ color: scoreColor(obsCoverage.percent) }}>{obsCoverage.percent}<span className="obs-coverage-suffix">%</span></div>
                <div className="obs-coverage-label">Modules IAM instrumentés</div>
              </div>
              <div className="obs-coverage-bar">
                <div className="obs-coverage-bar-fill" style={{ width: `${obsCoverage.percent}%`, backgroundColor: scoreColor(obsCoverage.percent) }} />
              </div>
              <div className="obs-coverage-lists">
                <div className="obs-coverage-group">
                  <span className="obs-coverage-group-label">Couverts</span>
                  <div className="obs-coverage-tags">
                    {obsCoverage.coveredModules.map((m) => <span key={m} className="obs-tag obs-tag-success">{m}</span>)}
                  </div>
                </div>
                <div className="obs-coverage-group">
                  <span className="obs-coverage-group-label">Non couverts</span>
                  <div className="obs-coverage-tags">
                    {obsCoverage.uncoveredModules.map((m) => <span key={m} className="obs-tag obs-tag-warning">{m}</span>)}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {modeConfig.sections.includes('securityGovernance') && (
        <section className="obs-section">
          <h2 className="obs-section-title">Security & Governance</h2>
          <div className="obs-threecol-grid">
            <div className="obs-card">
              <div className="obs-card-header">
                <span className="obs-card-icon"><SectionIcon name="users" /></span>
                <h3 className="obs-card-title">Comptes privilégiés</h3>
              </div>
              <div className="obs-priv-list">
                {obsPrivilegedAccounts.map((acc) => (
                  <div key={acc.userId} className="obs-priv-item">
                    <div className="obs-priv-avatar">{acc.name.split(' ').map((p) => p[0]).join('').slice(0, 2)}</div>
                    <div className="obs-priv-info">
                      <span className="obs-priv-name">{acc.name}</span>
                      <span className="obs-priv-meta">{acc.role} · {acc.lastActivity}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="obs-card">
              <div className="obs-card-header">
                <span className="obs-card-icon"><SectionIcon name="clock" /></span>
                <h3 className="obs-card-title">Changements sensibles récents</h3>
              </div>
              <Timeline
                items={obsSensitiveChanges}
                renderItem={(item) => (
                  <>
                    <div className="obs-timeline-text">
                      <strong>{item.actor}</strong> {item.action} <strong>{item.target}</strong>
                    </div>
                    <span className="obs-timeline-time">{item.timestamp}</span>
                    {(mode === 'EXPERT' || mode === 'DIAGNOSTIC') && item.before && (
                      <span className="obs-timeline-badge">{item.before} → {item.after}</span>
                    )}
                  </>
                )}
              />
            </div>

            <div className="obs-card">
              <div className="obs-card-header">
                <span className="obs-card-icon"><SectionIcon name="alert" /></span>
                <h3 className="obs-card-title">Sessions à risque</h3>
              </div>
              <div className="obs-risk-list">
                {obsRiskySessions.map((s) => (
                  <div key={s.sessionId} className="obs-risk-item">
                    <div className="obs-risk-info">
                      <span className="obs-risk-reason">{s.reason}</span>
                      <span className="obs-risk-meta">Utilisateur #{s.userId} · {s.location}</span>
                      <code className="obs-risk-ip">{s.ip}</code>
                    </div>
                    <button type="button" className="obs-risk-link" onClick={() => navigate('/sessions')}>Voir →</button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {modeConfig.sections.includes('diagnostics') && (
        <section className="obs-section">
          <h2 className="obs-section-title">Diagnostics</h2>
          <div className="obs-diagnostics-grid">
            <div className="obs-diagnostic-item">
              <span className="obs-diagnostic-label">Trace ID</span>
              <span className="obs-diagnostic-value">{obsDiagnostics.traceId}</span>
            </div>
            <div className="obs-diagnostic-item">
              <span className="obs-diagnostic-label">Échecs</span>
              <span className="obs-diagnostic-value" style={{ color: '#ef4444' }}>{obsDiagnostics.failedChecks}</span>
            </div>
            <div className="obs-diagnostic-item">
              <span className="obs-diagnostic-label">Anomalies session</span>
              <span className="obs-diagnostic-value" style={{ color: '#f59e0b' }}>{obsDiagnostics.sessionAnomalies}</span>
            </div>
            <div className="obs-diagnostic-item">
              <span className="obs-diagnostic-label">Conflits contexte</span>
              <span className="obs-diagnostic-value" style={{ color: '#ef4444' }}>{obsDiagnostics.contextConflicts}</span>
            </div>
            <div className="obs-diagnostic-item">
              <span className="obs-diagnostic-label">Échecs ERP</span>
              <span className="obs-diagnostic-value">{obsDiagnostics.ERPLinkFailures}</span>
            </div>
            <div className="obs-diagnostic-item">
              <span className="obs-diagnostic-label">Échecs dépendances</span>
              <span className="obs-diagnostic-value" style={{ color: '#f59e0b' }}>{obsDiagnostics.dependencyFailures}</span>
            </div>
            <div className="obs-diagnostic-item obs-diagnostic-item-wide">
              <span className="obs-diagnostic-label">Codes d'erreur</span>
              <div className="obs-diagnostic-codes">
                {obsDiagnostics.errorCodes.map((code) => (
                  <span key={code} className="obs-tag obs-tag-warning">{code}</span>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {modeConfig.sections.includes('activityTrends') && (
        <section className="obs-section">
          <h2 className="obs-section-title">Activity & Trends</h2>
          <div className="obs-fourcol-grid">
            <div className="obs-card obs-card-wide">
              <div className="obs-card-header">
                <span className="obs-card-icon"><SectionIcon name="trend" /></span>
                <h3 className="obs-card-title">Connexions (24h)</h3>
              </div>
              <LineChart data={obsConnectionsTrend} stats={[{ value: String(obsCoreMetrics.sessions), label: 'Sessions actives' }, { value: '1284', label: 'Connexions' }, { value: '73', label: 'Refusées' }]} />
            </div>
            <div className="obs-card obs-card-wide">
              <div className="obs-card-header">
                <span className="obs-card-icon"><SectionIcon name="pie" /></span>
                <h3 className="obs-card-title">Répartition par rôle</h3>
              </div>
              <DonutChart data={obsRoleDistribution} size={160} />
            </div>
            <div className="obs-card obs-card-wide">
              <div className="obs-card-header">
                <span className="obs-card-icon"><SectionIcon name="grid" /></span>
                <h3 className="obs-card-title">Activité par tenant</h3>
              </div>
              <div className="obs-tenant-list">
                {obsTenantActivity.map((t) => (
                  <div key={t.tenantId} className="obs-tenant-item">
                    <div className="obs-tenant-row">
                      <span className="obs-tenant-name">{t.tenantName}</span>
                      <span className="obs-tenant-score">{t.activityScore}</span>
                    </div>
                    <div className="obs-tenant-bar-bg">
                      <div className="obs-tenant-bar" style={{ width: `${t.activityScore}%`, backgroundColor: t.trend === 'up' ? '#10b981' : '#ef4444' }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="obs-card obs-card-wide">
              <div className="obs-card-header">
                <span className="obs-card-icon"><SectionIcon name="clock" /></span>
                <h3 className="obs-card-title">Activité récente</h3>
              </div>
              <Timeline
                items={obsRecentActivity}
                renderItem={(item) => (
                  <>
                    <span className={`obs-recent-dot obs-recent-dot-${item.type}`} />
                    <div className="obs-recent-body">
                      <div className="obs-recent-title">{item.title}</div>
                      <div className="obs-recent-meta">{item.actor} · {item.detail}</div>
                    </div>
                    <span className="obs-recent-time">{item.time}</span>
                  </>
                )}
              />
            </div>
          </div>
        </section>
      )}

      {showSnapshotModal && (
        <ConfirmationModal
          open={showSnapshotModal}
          title="Créer un snapshot"
          message="Voulez-vous créer un snapshot local de l'état actuel du cockpit ?"
          onConfirm={handleSnapshot}
          onCancel={() => setShowSnapshotModal(false)}
          confirmLabel="Créer"
        />
      )}

      {alertDetail && (
        <DetailPanel open={!!alertDetail} title="Détail de l'alerte" onClose={() => setAlertDetail(null)}>
          <div className="obs-detail-fields">
            <div className="obs-detail-field"><span className="obs-detail-label">ID</span><span className="obs-detail-value">{alertDetail.id}</span></div>
            <div className="obs-detail-field"><span className="obs-detail-label">Sévérité</span><SeverityBadge severity={alertDetail.severity} /></div>
            <div className="obs-detail-field"><span className="obs-detail-label">Statut</span><StatusBadge status={alertDetail.status} /></div>
            <div className="obs-detail-field"><span className="obs-detail-label">Titre</span><span className="obs-detail-value">{alertDetail.title}</span></div>
            <div className="obs-detail-field"><span className="obs-detail-label">Description</span><span className="obs-detail-value">{alertDetail.description}</span></div>
            <div className="obs-detail-field"><span className="obs-detail-label">Module</span><span className="obs-detail-value">{alertDetail.module}</span></div>
            <div className="obs-detail-field"><span className="obs-detail-label">Créée le</span><span className="obs-detail-value">{alertDetail.createdAt}</span></div>
            {alertDetail.link && (
              <div className="obs-detail-field">
                <span className="obs-detail-label">Lien</span>
                <button type="button" className="obs-alert-link" onClick={() => navigate(alertDetail.link)}>Accéder →</button>
              </div>
            )}
            <div className="obs-detail-actions">
              {alertDetail.status === 'OPEN' && (
                <button type="button" className="obs-btn-primary" onClick={() => handleAlertAction(alertDetail.id, 'ack')}>Acquitter</button>
              )}
              {alertDetail.status === 'ACKNOWLEDGED' && (
                <button type="button" className="obs-btn-primary" onClick={() => handleAlertAction(alertDetail.id, 'resolve')}>Résoudre</button>
              )}
              <button type="button" className="obs-btn-secondary" onClick={() => handleAlertAction(alertDetail.id, 'suppress')}>Supprimer</button>
            </div>
          </div>
        </DetailPanel>
      )}

      <ConfirmationModal
        open={!!ackModal}
        title="Acquitter l'alerte"
        message="Voulez-vous acquitter cette alerte ?"
        onConfirm={confirmAcknowledge}
        onCancel={() => setAckModal(null)}
        confirmLabel="Acquitter"
      />

      {showReport && (
        <div className="obs-report-backdrop" onClick={() => setShowReport(false)}>
          <div className="obs-report" onClick={(e) => e.stopPropagation()}>
            <div className="obs-report-header">
              <h2 className="obs-report-title">Rapport IAM — {formatRefresh(lastRefresh)}</h2>
              <button type="button" className="obs-report-close" onClick={() => setShowReport(false)}>×</button>
            </div>
            <div className="obs-report-body">
              <div className="obs-report-section">
                <h3>Global Status</h3>
                <div className="obs-report-grid">
                  {Object.entries(data).map(([key, val]) => (
                    <div key={key} className="obs-report-row">
                      <span className="obs-report-label">{key}</span>
                      <span className="obs-report-value">{val.status} — {val.label} ({val.score}/100)</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="obs-report-section">
                <h3>Core Metrics</h3>
                <div className="obs-report-grid">
                  {Object.entries(obsCoreMetrics).map(([key, val]) => (
                    <div key={key} className="obs-report-row">
                      <span className="obs-report-label">{key}</span>
                      <span className="obs-report-value">{val}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="obs-report-section">
                <h3>Alertes ({obsAlerts.length})</h3>
                <div className="obs-report-grid">
                  {obsAlerts.map((a) => (
                    <div key={a.id} className="obs-report-row">
                      <span className="obs-report-label">{a.severity}</span>
                      <span className="obs-report-value">{a.title} — {a.status}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="obs-report-footer">
              <button type="button" className="obs-btn-secondary" onClick={() => window.print()}>Imprimer / PDF</button>
              <button type="button" className="obs-btn-secondary" onClick={() => setShowReport(false)}>Fermer</button>
            </div>
          </div>
        </div>
      )}

      {snapshots.length > 0 && (
        <section className="obs-section">
          <h2 className="obs-section-title">Snapshots locaux</h2>
          <div className="obs-snapshots-list">
            {snapshots.map((snap) => (
              <div key={snap.id} className="obs-snapshot-item">
                <div className="obs-snapshot-id">{snap.id}</div>
                <div className="obs-snapshot-meta">{formatRefresh(snap.createdAt)} · Mode: {snap.mode}</div>
                <div className="obs-snapshot-stats">{snap.alerts.length} alertes · {Object.keys(snap.coreMetrics).length} métriques</div>
              </div>
            ))}
          </div>
        </section>
      )}

      {toast && <div className="obs-toast" role="status">{toast}</div>}
    </div>
  );
}

export default ObservabilityOverview;
