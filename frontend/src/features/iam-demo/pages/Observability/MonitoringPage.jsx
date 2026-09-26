import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../../components/observability/useToast';
import { SearchBar } from '../../components/observability/SearchBar';
import { FilterBar } from '../../components/observability/FilterBar';
import { DataTable } from '../../components/observability/DataTable';
import { DetailPanel } from '../../components/observability/DetailPanel';
import { ConfirmationModal } from '../../components/observability/ConfirmationModal';
import { EmptyState } from '../../components/observability/EmptyState';
import { ErrorState } from '../../components/observability/ErrorState';
import { LoadingState } from '../../components/observability/LoadingState';
import { StatusBadge } from '../../components/observability/StatusBadge';
import { SeverityBadge } from '../../components/observability/SeverityBadge';
import { obsMonitoring, obsHealthStatuses } from '../../data/observability/monitoringMock';
import './MonitoringPage.css';

const PAGE_SIZE = 8;
const PERIODS = ['1h', '24h', '7d', '30d'];

function formatNumber(value) {
  if (value === null || value === undefined) return '—';
  return new Intl.NumberFormat('fr-FR').format(value);
}

function MonitoringPage() {
  const navigate = useNavigate();
  const { toast, showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [services, setServices] = useState([]);
  const [period, setPeriod] = useState('24h');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState('service');
  const [sortDir, setSortDir] = useState('asc');
  const [page, setPage] = useState(1);
  const [detailService, setDetailService] = useState(null);
  const [confirmDrill, setConfirmDrill] = useState(null);

  const statusOptions = ['ALL', ...obsHealthStatuses];

  const loadMonitoring = () => {
    setLoading(true);
    setError(null);
    window.setTimeout(() => {
      setServices(obsMonitoring.services);
      setLoading(false);
    }, 500);
  };

  useEffect(() => {
    loadMonitoring();
  }, []);

  useEffect(() => {
    setPage(1);
  }, [search, statusFilter, sortKey, sortDir, period]);

  const periodData = obsMonitoring.periods[period] || obsMonitoring.periods['24h'];

  const filteredServices = useMemo(() => {
    let list = services.map((s) => ({ ...s }));

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter((s) =>
        [s.service, s.component, s.detailsSafe, ...s.dependencies]
          .some((v) => String(v).toLowerCase().includes(q))
      );
    }

    if (statusFilter !== 'ALL') {
      list = list.filter((s) => s.status === statusFilter);
    }

    list.sort((a, b) => {
      const statusOrder = { HEALTHY: 0, DEGRADED: 1, UNHEALTHY: 2, UNKNOWN: 3 };
      const getValue = (item) => {
        if (sortKey === 'service') return item.service.toLowerCase();
        if (sortKey === 'status') return statusOrder[item.status] ?? 9;
        if (sortKey === 'latency') return item.latency ?? 0;
        if (sortKey === 'errorRate') return item.errorRate ?? 0;
        if (sortKey === 'availability') return -(item.availability ?? 0);
        if (sortKey === 'requestCount') return item.requestCount ?? 0;
        if (sortKey === 'timeoutCount') return item.timeoutCount ?? 0;
        if (sortKey === 'cacheHitRate') return -(item.cacheHitRate ?? 0);
        if (sortKey === 'component') return item.component.toLowerCase();
        return 0;
      };
      const av = getValue(a);
      const bv = getValue(b);
      if (av < bv) return sortDir === 'asc' ? -1 : 1;
      if (av > bv) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });

    return list;
  }, [services, search, statusFilter, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(filteredServices.length / PAGE_SIZE));
  const pageItems = filteredServices.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleRefresh = () => {
    setLoading(true);
    setError(null);
    showToast('Actualisation du monitoring…');
    window.setTimeout(() => {
      setServices(obsMonitoring.services);
      setLoading(false);
    }, 500);
  };

  const handleResetFilters = () => {
    setSearch('');
    setStatusFilter('ALL');
    setSortKey('service');
    setSortDir('asc');
    setPeriod('24h');
    showToast('Filtres réinitialisés');
  };

  const handleDrillDown = (target) => {
    setConfirmDrill(target);
  };

  const confirmDrillDown = () => {
    if (!confirmDrill) return;
    if (confirmDrill.type === 'logs') {
      navigate('/observability/logs');
      showToast('Navigation vers Logs Manager');
    } else if (confirmDrill.type === 'security') {
      navigate('/observability/security-events');
      showToast('Navigation vers Security Events');
    }
    setConfirmDrill(null);
  };

  const getStatusBadgeClass = (status) => {
    const map = { HEALTHY: 'obs-status-healthy', DEGRADED: 'obs-status-degraded', UNHEALTHY: 'obs-status-unhealthy', UNKNOWN: 'obs-status-unknown' };
    return map[status] || '';
  };

  const columns = useMemo(
    () => [
      {
        key: 'service',
        label: 'Service',
        width: '12rem',
        render: (v) => <span className="obs-service-name">{v}</span>,
      },
      {
        key: 'status',
        label: 'Statut',
        width: '9rem',
        render: (v) => <StatusBadge status={v} />,
      },
      { key: 'component', label: 'Composant', width: '10rem' },
      {
        key: 'availability',
        label: 'Disponibilité',
        width: '8rem',
        render: (v) => (
          <span className={v >= 99.5 ? 'obs-metric-good' : v >= 99 ? 'obs-metric-warn' : 'obs-metric-bad'}>
            {v}%
          </span>
        ),
      },
      {
        key: 'requestCount',
        label: 'Requêtes',
        width: '8rem',
        render: (v) => <span className="obs-metric-value">{formatNumber(v)}</span>,
      },
      {
        key: 'errorRate',
        label: 'Erreurs %',
        width: '7rem',
        render: (v) => (
          <span className={v <= 0.5 ? 'obs-metric-good' : v <= 1 ? 'obs-metric-warn' : 'obs-metric-bad'}>
            {v}%
          </span>
        ),
      },
      {
        key: 'latency',
        label: 'Latence ms',
        width: '7rem',
        render: (v) => (
          <span className={v <= 100 ? 'obs-metric-good' : v <= 250 ? 'obs-metric-warn' : 'obs-metric-bad'}>
            {v}
          </span>
        ),
      },
      {
        key: 'timeoutCount',
        label: 'Timeouts',
        width: '7rem',
        render: (v) => (
          <span className={v === 0 ? 'obs-metric-good' : v <= 5 ? 'obs-metric-warn' : 'obs-metric-bad'}>
            {formatNumber(v)}
          </span>
        ),
      },
      {
        key: 'queueBacklog',
        label: 'File',
        width: '6rem',
        render: (v) => (
          <span className={v === 0 ? 'obs-metric-good' : v <= 5 ? 'obs-metric-warn' : 'obs-metric-bad'}>
            {formatNumber(v)}
          </span>
        ),
      },
      {
        key: 'cacheHitRate',
        label: 'Cache Hit',
        width: '7rem',
        render: (v) => (
          <span className={v >= 95 ? 'obs-metric-good' : v >= 85 ? 'obs-metric-warn' : 'obs-metric-bad'}>
            {v}%
          </span>
        ),
      },
      {
        key: 'actions',
        label: 'Actions',
        width: '12rem',
        render: (_, row) => (
          <div className="obs-table-actions">
            <button type="button" className="obs-alert-link" onClick={() => setDetailService(row)}>Détail</button>
            <button type="button" className="obs-alert-link" onClick={() => handleDrillDown({ type: 'logs', service: row.service })}>Logs</button>
            <button type="button" className="obs-alert-link" onClick={() => handleDrillDown({ type: 'security' })}>Sécurité</button>
          </div>
        ),
      },
    ],
    [navigate, showToast]
  );

  const renderDetailFields = () => {
    const s = detailService;
    return (
      <>
        <div className="obs-detail-field">
          <span className="obs-detail-label">Service</span>
          <span className="obs-detail-value">{s.service}</span>
        </div>
        <div className="obs-detail-field">
          <span className="obs-detail-label">Composant</span>
          <span className="obs-detail-value">{s.component}</span>
        </div>
        <div className="obs-detail-field">
          <span className="obs-detail-label">Statut</span>
          <StatusBadge status={s.status} />
        </div>
        <div className="obs-detail-field">
          <span className="obs-detail-label">Vérifié le</span>
          <span className="obs-detail-value">{s.checkedAt}</span>
        </div>
        <div className="obs-detail-field">
          <span className="obs-detail-label">Latence</span>
          <span className="obs-detail-value">{s.latency} ms</span>
        </div>
        <div className="obs-detail-field">
          <span className="obs-detail-label">Disponibilité</span>
          <span className="obs-detail-value">{s.availability}%</span>
        </div>
        <div className="obs-detail-field">
          <span className="obs-detail-label">Taux d'erreur</span>
          <span className="obs-detail-value">{s.errorRate}%</span>
        </div>
        <div className="obs-detail-field">
          <span className="obs-detail-label">Requêtes</span>
          <span className="obs-detail-value">{formatNumber(s.requestCount)}</span>
        </div>
        <div className="obs-detail-field">
          <span className="obs-detail-label">Timeouts</span>
          <span className="obs-detail-value">{formatNumber(s.timeoutCount)}</span>
        </div>
        <div className="obs-detail-field">
          <span className="obs-detail-label">File d'attente</span>
          <span className="obs-detail-value">{formatNumber(s.queueBacklog)}</span>
        </div>
        <div className="obs-detail-field">
          <span className="obs-detail-label">Cache Hit</span>
          <span className="obs-detail-value">{s.cacheHitRate}%</span>
        </div>
        <div className="obs-detail-field">
          <span className="obs-detail-label">Dépendances</span>
          <span className="obs-detail-value">{s.dependencies.join(', ')}</span>
        </div>
        <div className="obs-detail-field">
          <span className="obs-detail-label">Détails</span>
          <span className="obs-detail-value">{s.detailsSafe}</span>
        </div>
        <div className="obs-detail-actions">
          <button type="button" className="obs-btn-secondary" onClick={() => handleDrillDown({ type: 'logs', service: s.service })}>Voir les logs</button>
          <button type="button" className="obs-btn-secondary" onClick={() => handleDrillDown({ type: 'security' })}>Voir les événements</button>
        </div>
      </>
    );
  };

  return (
    <div className="obs-page">
      <nav className="obs-breadcrumb">
        <span>Observability & Security</span>
        <span className="obs-breadcrumb-sep">/</span>
        <span className="obs-breadcrumb-current">Monitoring</span>
      </nav>

      <div className="obs-header">
        <div className="obs-header-left">
          <div className="obs-title-row">
            <h1 className="obs-title">Monitoring</h1>
          </div>
           <p className="obs-subtitle">Suivi de santé et métriques.</p>
        </div>
        <div className="obs-header-actions">
          <div className="obs-mode-switcher" role="tablist" aria-label="Période">
            {PERIODS.map((p) => (
              <button
                key={p}
                type="button"
                role="tab"
                aria-selected={period === p}
                className={`obs-mode-btn ${period === p ? 'obs-mode-btn-active' : ''}`}
                onClick={() => setPeriod(p)}
              >
                {p === '1h' ? '1h' : p === '24h' ? '24h' : p === '7d' ? '7j' : '30j'}
              </button>
            ))}
          </div>
          <button type="button" className="obs-btn-secondary" onClick={handleRefresh} disabled={loading}>
            {loading ? 'Actualisation…' : 'Actualiser'}
          </button>
          <button type="button" className="obs-btn-secondary" onClick={handleResetFilters}>
            Réinitialiser
          </button>
        </div>
      </div>

      <div className="obs-metrics-summary">
        <div className="obs-metric-card">
          <span className="obs-metric-label">Requêtes ({period})</span>
          <span className="obs-metric-value">{formatNumber(periodData.requestCount)}</span>
        </div>
        <div className="obs-metric-card">
          <span className="obs-metric-label">Taux d'erreur</span>
          <span className={`obs-metric-value ${periodData.errorRate <= 0.5 ? 'obs-metric-good' : periodData.errorRate <= 1 ? 'obs-metric-warn' : 'obs-metric-bad'}`}>
            {periodData.errorRate}%
          </span>
        </div>
        <div className="obs-metric-card">
          <span className="obs-metric-label">Latence moyenne</span>
          <span className={`obs-metric-value ${periodData.latency <= 100 ? 'obs-metric-good' : periodData.latency <= 250 ? 'obs-metric-warn' : 'obs-metric-bad'}`}>
            {periodData.latency} ms
          </span>
        </div>
        <div className="obs-metric-card">
          <span className="obs-metric-label">Timeouts</span>
          <span className={`obs-metric-value ${periodData.timeoutCount === 0 ? 'obs-metric-good' : 'obs-metric-warn'}`}>
            {formatNumber(periodData.timeoutCount)}
          </span>
        </div>
      </div>

      <div className="obs-toolbar">
        <div className="obs-toolbar-left">
          <SearchBar value={search} onChange={setSearch} placeholder="Rechercher un service ou composant…" />
        </div>
        <div className="obs-toolbar-right">
          <FilterBar
            filters={statusOptions.map((s) => ({ key: s, label: s === 'ALL' ? 'Tous statuts' : s }))}
            activeFilter={statusFilter}
            onFilterChange={setStatusFilter}
          />
          <div className="obs-sort-group">
            <span className="obs-sort-label">Trier par</span>
            <select className="obs-select" value={sortKey} onChange={(e) => setSortKey(e.target.value)}>
              <option value="service">Service</option>
              <option value="status">Statut</option>
              <option value="latency">Latence</option>
              <option value="errorRate">Taux d'erreur</option>
              <option value="availability">Disponibilité</option>
              <option value="requestCount">Requêtes</option>
              <option value="timeoutCount">Timeouts</option>
              <option value="cacheHitRate">Cache Hit</option>
            </select>
            <select className="obs-select" value={sortDir} onChange={(e) => setSortDir(e.target.value)}>
              <option value="asc">Croissant</option>
              <option value="desc">Décroissant</option>
            </select>
          </div>
        </div>
      </div>

      {loading && <LoadingState message="Chargement du monitoring…" />}
      {error && !loading && <ErrorState message={error} onRetry={loadMonitoring} />}
      {!loading && !error && filteredServices.length === 0 && (
        <EmptyState
          title="Aucun service trouvé"
          description="Essayez de modifier vos filtres ou votre recherche."
          action={
            <button type="button" className="obs-btn-secondary" onClick={handleResetFilters}>
              Réinitialiser les filtres
            </button>
          }
        />
      )}
      {!loading && !error && filteredServices.length > 0 && (
        <>
          <div className="obs-table-wrapper">
            <DataTable
              columns={columns}
              rows={pageItems}
              rowKey="service"
              onRowClick={setDetailService}
              emptyMessage="Aucun service à afficher."
            />
          </div>
          <div className="obs-pagination">
            <button type="button" className="obs-pagination-btn" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
              Précédent
            </button>
            <span className="obs-pagination-info">
              Page {page} / {totalPages}
            </span>
            <button type="button" className="obs-pagination-btn" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
              Suivant
            </button>
          </div>
        </>
      )}

      {detailService && (
        <DetailPanel open={!!detailService} title="Détail du service" onClose={() => setDetailService(null)}>
          <div className="obs-detail-fields">{renderDetailFields()}</div>
        </DetailPanel>
      )}

      <ConfirmationModal
        open={!!confirmDrill}
        title="Navigation"
        message={`Voulez-vous ouvrir ${confirmDrill?.type === 'logs' ? 'les logs' : 'les événements de sécurité'} ?`}
        onConfirm={confirmDrillDown}
        onCancel={() => setConfirmDrill(null)}
        confirmLabel="Ouvrir"
      />

      {toast && <div className="obs-toast" role="status">{toast}</div>}
    </div>
  );
}

export default MonitoringPage;
