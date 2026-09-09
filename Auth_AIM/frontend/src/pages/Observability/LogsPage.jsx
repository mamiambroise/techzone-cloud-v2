import { useState, useMemo, useEffect } from 'react';
import { useToast } from '../../components/observability/useToast';
import { SearchBar } from '../../components/observability/SearchBar';
import { FilterBar } from '../../components/observability/FilterBar';
import { DataTable } from '../../components/observability/DataTable';
import { DetailPanel } from '../../components/observability/DetailPanel';
import { EmptyState } from '../../components/observability/EmptyState';
import { ErrorState } from '../../components/observability/ErrorState';
import { LoadingState } from '../../components/observability/LoadingState';
import { SeverityBadge } from '../../components/observability/SeverityBadge';
import { StatusBadge } from '../../components/observability/StatusBadge';
import { obsLogs, obsLogFilters } from '../../data/observability/logsMock';
import './LogsPage.css';

const PAGE_SIZE = 8;

function formatDate(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleString('fr-FR', { dateStyle: 'medium', timeStyle: 'short' });
}

function LogsPage() {
  const { toast, showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [logs, setLogs] = useState([]);
  const [search, setSearch] = useState('');
  const [levelFilter, setLevelFilter] = useState('ALL');
  const [serviceFilter, setServiceFilter] = useState('ALL');
  const [componentFilter, setComponentFilter] = useState('ALL');
  const [environmentFilter, setEnvironmentFilter] = useState('ALL');
  const [tenantFilter, setTenantFilter] = useState('ALL');
  const [errorCodeFilter, setErrorCodeFilter] = useState('ALL');
  const [traceIdFilter, setTraceIdFilter] = useState('ALL');
  const [sortKey, setSortKey] = useState('timestamp');
  const [sortDir, setSortDir] = useState('desc');
  const [page, setPage] = useState(1);
  const [detailLog, setDetailLog] = useState(null);

  const levelOptions = ['ALL', ...obsLogFilters.levels];
  const serviceOptions = ['ALL', ...Array.from(new Set(obsLogs.map((l) => l.service)))];
  const componentOptions = ['ALL', ...Array.from(new Set(obsLogs.map((l) => l.component)))];
  const environmentOptions = ['ALL', ...obsLogFilters.environments];
  const tenantOptions = ['ALL', ...Array.from(new Set(obsLogs.map((l) => l.tenantId).filter(Boolean))).sort((a, b) => a - b)];
  const errorCodeOptions = ['ALL', ...Array.from(new Set(obsLogs.map((l) => l.errorCode).filter(Boolean))).sort()];
  const traceIdOptions = ['ALL', ...Array.from(new Set(obsLogs.map((l) => l.traceId))).sort()];

  const loadLogs = () => {
    setLoading(true);
    setError(null);
    window.setTimeout(() => {
      setLogs(obsLogs);
      setLoading(false);
    }, 500);
  };

  useEffect(() => {
    loadLogs();
  }, []);

  useEffect(() => {
    setPage(1);
  }, [search, levelFilter, serviceFilter, componentFilter, environmentFilter, tenantFilter, errorCodeFilter, traceIdFilter, sortKey, sortDir]);

  const filteredLogs = useMemo(() => {
    let list = logs.map((l) => ({ ...l }));

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter((l) =>
        [l.message, l.service, l.component, l.traceId, l.requestId, String(l.tenantId), String(l.userId), l.errorCode]
          .some((v) => String(v).toLowerCase().includes(q))
      );
    }

    if (levelFilter !== 'ALL') {
      list = list.filter((l) => l.level === levelFilter);
    }
    if (serviceFilter !== 'ALL') {
      list = list.filter((l) => l.service === serviceFilter);
    }
    if (componentFilter !== 'ALL') {
      list = list.filter((l) => l.component === componentFilter);
    }
    if (environmentFilter !== 'ALL') {
      list = list.filter((l) => l.environmentId === environmentFilter);
    }
    if (tenantFilter !== 'ALL') {
      list = list.filter((l) => String(l.tenantId) === tenantFilter);
    }
    if (errorCodeFilter !== 'ALL') {
      list = list.filter((l) => l.errorCode === errorCodeFilter);
    }
    if (traceIdFilter !== 'ALL') {
      list = list.filter((l) => l.traceId === traceIdFilter);
    }

    list.sort((a, b) => {
      const getValue = (item) => {
        if (sortKey === 'timestamp') return new Date(item.timestamp).getTime();
        if (sortKey === 'level') return item.level;
        if (sortKey === 'service') return item.service.toLowerCase();
        if (sortKey === 'component') return item.component.toLowerCase();
        if (sortKey === 'message') return item.message.toLowerCase();
        if (sortKey === 'traceId') return item.traceId.toLowerCase();
        if (sortKey === 'requestId') return item.requestId.toLowerCase();
        if (sortKey === 'tenantId') return item.tenantId ?? 0;
        if (sortKey === 'userId') return item.userId ?? 0;
        if (sortKey === 'environmentId') return item.environmentId.toLowerCase();
        if (sortKey === 'errorCode') return (item.errorCode || '').toLowerCase();
        return 0;
      };
      const av = getValue(a);
      const bv = getValue(b);
      if (av < bv) return sortDir === 'asc' ? -1 : 1;
      if (av > bv) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });

    return list;
  }, [logs, search, levelFilter, serviceFilter, componentFilter, environmentFilter, tenantFilter, errorCodeFilter, traceIdFilter, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(filteredLogs.length / PAGE_SIZE));
  const pageItems = filteredLogs.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleToggleSort = (key) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  const handleRefresh = () => {
    setLoading(true);
    setError(null);
    showToast('Actualisation des logs…');
    window.setTimeout(() => {
      setLogs(obsLogs);
      setLoading(false);
    }, 500);
  };

  const handleResetFilters = () => {
    setSearch('');
    setLevelFilter('ALL');
    setServiceFilter('ALL');
    setComponentFilter('ALL');
    setEnvironmentFilter('ALL');
    setTenantFilter('ALL');
    setErrorCodeFilter('ALL');
    setTraceIdFilter('ALL');
    setSortKey('timestamp');
    setSortDir('desc');
    showToast('Filtres réinitialisés');
  };

  const copyTraceId = (traceId, e) => {
    e.stopPropagation();
    if (navigator.clipboard) {
      navigator.clipboard.writeText(traceId);
    }
    showToast(`Trace ID copié : ${traceId}`);
  };

  const getLevelBadgeClass = (level) => {
    const map = { ERROR: 'obs-level-error', WARN: 'obs-level-warn', INFO: 'obs-level-info', DEBUG: 'obs-level-debug' };
    return map[level] || '';
  };

  const columns = useMemo(
    () => [
      { key: 'timestamp', label: 'Horodatage', width: '10rem', render: (v) => formatDate(v) },
      {
        key: 'level',
        label: 'Niveau',
        width: '6rem',
        render: (v) => <span className={`obs-level-badge ${getLevelBadgeClass(v)}`}>{v}</span>,
      },
      { key: 'service', label: 'Service', width: '10rem' },
      { key: 'component', label: 'Composant', width: '8rem' },
      { key: 'message', label: 'Message' },
      {
        key: 'traceId',
        label: 'Trace ID',
        width: '10rem',
        render: (v) => (
          <button type="button" className="obs-trace-copy" onClick={(e) => copyTraceId(v, e)} title="Copier le traceId">
            {v}
          </button>
        ),
      },
      { key: 'requestId', label: 'Request ID', width: '10rem' },
      { key: 'tenantId', label: 'Tenant', width: '5rem' },
      { key: 'userId', label: 'Utilisateur', width: '5rem' },
      { key: 'environmentId', label: 'Env', width: '5rem' },
      { key: 'errorCode', label: 'Code erreur', width: '8rem', render: (v) => v || '—' },
      { key: 'metadataSafe', label: 'Métadonnées', width: '10rem', render: (v) => JSON.stringify(v) },
    ],
    [showToast]
  );

  const renderDetailFields = () => (
    <>
      <div className="obs-detail-field">
        <span className="obs-detail-label">ID</span>
        <span className="obs-detail-value">{detailLog.id}</span>
      </div>
      <div className="obs-detail-field">
        <span className="obs-detail-label">Horodatage</span>
        <span className="obs-detail-value">{formatDate(detailLog.timestamp)}</span>
      </div>
      <div className="obs-detail-field">
        <span className="obs-detail-label">Niveau</span>
        <span className={`obs-level-badge ${getLevelBadgeClass(detailLog.level)}`}>{detailLog.level}</span>
      </div>
      <div className="obs-detail-field">
        <span className="obs-detail-label">Service</span>
        <span className="obs-detail-value">{detailLog.service}</span>
      </div>
      <div className="obs-detail-field">
        <span className="obs-detail-label">Composant</span>
        <span className="obs-detail-value">{detailLog.component}</span>
      </div>
      <div className="obs-detail-field">
        <span className="obs-detail-label">Message</span>
        <span className="obs-detail-value">{detailLog.message}</span>
      </div>
      <div className="obs-detail-field">
        <span className="obs-detail-label">Trace ID</span>
        <span className="obs-detail-value">
          <button type="button" className="obs-copy-btn" onClick={() => copyTraceId(detailLog.traceId, { stopPropagation: () => {} })}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
            </svg>
            {detailLog.traceId}
          </button>
        </span>
      </div>
      <div className="obs-detail-field">
        <span className="obs-detail-label">Request ID</span>
        <span className="obs-detail-value">{detailLog.requestId}</span>
      </div>
      <div className="obs-detail-field">
        <span className="obs-detail-label">Tenant ID</span>
        <span className="obs-detail-value">{detailLog.tenantId ?? '—'}</span>
      </div>
      <div className="obs-detail-field">
        <span className="obs-detail-label">User ID</span>
        <span className="obs-detail-value">{detailLog.userId ?? '—'}</span>
      </div>
      <div className="obs-detail-field">
        <span className="obs-detail-label">Environment ID</span>
        <span className="obs-detail-value">{detailLog.environmentId}</span>
      </div>
      <div className="obs-detail-field">
        <span className="obs-detail-label">Code erreur</span>
        <span className="obs-detail-value">{detailLog.errorCode || '—'}</span>
      </div>
      <div className="obs-detail-field">
        <span className="obs-detail-label">Métadonnées sécurisées</span>
        <span className="obs-detail-value">
          <code style={{ fontSize: '0.75rem', background: 'var(--color-table-header)', padding: '0.25rem 0.5rem', borderRadius: 'var(--radius-sm)' }}>
            {JSON.stringify(detailLog.metadataSafe)}
          </code>
        </span>
      </div>
    </>
  );

  return (
    <div className="obs-page">
      <nav className="obs-breadcrumb">
        <span>Observability & Security</span>
        <span className="obs-breadcrumb-sep">/</span>
        <span className="obs-breadcrumb-current">Logs Manager</span>
      </nav>

      <div className="obs-header">
        <div className="obs-header-left">
          <div className="obs-title-row">
            <h1 className="obs-title">Logs Manager</h1>
          </div>
          <p className="obs-subtitle">Consultez et filtrez les journaux d'activité.</p>
        </div>
        <div className="obs-header-actions">
          <button type="button" className="obs-btn-secondary" onClick={handleRefresh} disabled={loading}>
            {loading ? 'Actualisation…' : 'Actualiser'}
          </button>
          <button type="button" className="obs-btn-secondary" onClick={handleResetFilters}>
            Réinitialiser les filtres
          </button>
        </div>
      </div>

      <div className="obs-toolbar">
        <div className="obs-toolbar-left">
          <SearchBar value={search} onChange={setSearch} placeholder="Rechercher un message, un service, un traceId…" />
        </div>
        <div className="obs-toolbar-right">
          <FilterBar
            filters={levelOptions.map((l) => ({ key: l, label: l === 'ALL' ? 'Tous niveaux' : l }))}
            activeFilter={levelFilter}
            onFilterChange={setLevelFilter}
          />
          <FilterBar
            filters={serviceOptions.map((s) => ({ key: s, label: s === 'ALL' ? 'Tous services' : s }))}
            activeFilter={serviceFilter}
            onFilterChange={setServiceFilter}
          />
          <FilterBar
            filters={componentOptions.map((c) => ({ key: c, label: c === 'ALL' ? 'Tous composants' : c }))}
            activeFilter={componentFilter}
            onFilterChange={setComponentFilter}
          />
          <FilterBar
            filters={environmentOptions.map((e) => ({ key: e, label: e === 'ALL' ? 'Tous envs' : e }))}
            activeFilter={environmentFilter}
            onFilterChange={setEnvironmentFilter}
          />
          <FilterBar
            filters={tenantOptions.map((t) => ({ key: String(t), label: t === 'ALL' ? 'Tous tenants' : `Tenant ${t}` }))}
            activeFilter={tenantFilter}
            onFilterChange={setTenantFilter}
          />
          <FilterBar
            filters={errorCodeOptions.map((c) => ({ key: c, label: c === 'ALL' ? 'Tous codes' : c }))}
            activeFilter={errorCodeFilter}
            onFilterChange={setErrorCodeFilter}
          />
          <FilterBar
            filters={traceIdOptions.map((t) => ({ key: t, label: t === 'ALL' ? 'Tous traces' : t }))}
            activeFilter={traceIdFilter}
            onFilterChange={setTraceIdFilter}
          />
          <div className="obs-sort-group">
            <span className="obs-sort-label">Trier par</span>
            <select className="obs-select" value={sortKey} onChange={(e) => setSortKey(e.target.value)}>
              <option value="timestamp">Horodatage</option>
              <option value="level">Niveau</option>
              <option value="service">Service</option>
              <option value="component">Composant</option>
              <option value="message">Message</option>
              <option value="traceId">Trace ID</option>
              <option value="requestId">Request ID</option>
              <option value="tenantId">Tenant</option>
              <option value="userId">Utilisateur</option>
              <option value="environmentId">Env</option>
              <option value="errorCode">Code erreur</option>
            </select>
            <select className="obs-select" value={sortDir} onChange={(e) => setSortDir(e.target.value)}>
              <option value="asc">Croissant</option>
              <option value="desc">Décroissant</option>
            </select>
          </div>
        </div>
      </div>

      {loading && <LoadingState message="Chargement des logs…" />}
      {error && !loading && <ErrorState message={error} onRetry={loadLogs} />}
      {!loading && !error && filteredLogs.length === 0 && (
        <EmptyState
          title="Aucun log trouvé"
          description="Essayez de modifier vos filtres ou votre recherche."
          action={
            <button type="button" className="obs-btn-secondary" onClick={handleResetFilters}>
              Réinitialiser les filtres
            </button>
          }
        />
      )}
      {!loading && !error && filteredLogs.length > 0 && (
        <>
          <div className="obs-table-wrapper">
            <DataTable
              columns={columns}
              rows={pageItems}
              rowKey="id"
              onRowClick={setDetailLog}
              emptyMessage="Aucun log à afficher."
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

      {detailLog && (
        <DetailPanel open={!!detailLog} title="Détail du log" onClose={() => setDetailLog(null)}>
          <div className="obs-detail-fields">{renderDetailFields()}</div>
        </DetailPanel>
      )}

      {toast && <div className="obs-toast" role="status">{toast}</div>}
    </div>
  );
}

export default LogsPage;
