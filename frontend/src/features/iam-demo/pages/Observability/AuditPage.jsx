import { useState, useMemo, useEffect } from 'react';
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
import { obsAuditLogs, obsAuditFilters } from '../../data/observability/auditMock';
import './AuditPage.css';

const PAGE_SIZE = 8;

function formatDate(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleString('fr-FR', { dateStyle: 'medium', timeStyle: 'short' });
}

function AuditPage() {
  const { toast, showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [auditLogs, setAuditLogs] = useState([]);
  const [search, setSearch] = useState('');
  const [actorTypeFilter, setActorTypeFilter] = useState('ALL');
  const [actionFilter, setActionFilter] = useState('ALL');
  const [resourceTypeFilter, setResourceTypeFilter] = useState('ALL');
  const [resultFilter, setResultFilter] = useState('ALL');
  const [tenantIdFilter, setTenantIdFilter] = useState('ALL');
  const [traceIdFilter, setTraceIdFilter] = useState('ALL');
  const [sortKey, setSortKey] = useState('timestamp');
  const [sortDir, setSortDir] = useState('desc');
  const [page, setPage] = useState(1);
  const [detailLog, setDetailLog] = useState(null);

  const actorTypeOptions = ['ALL', ...obsAuditFilters.actorTypes];
  const actionOptions = ['ALL', ...obsAuditFilters.actions];
  const resourceTypeOptions = ['ALL', ...obsAuditFilters.resourceTypes];
  const resultOptions = ['ALL', ...obsAuditFilters.results];
  const tenantIdOptions = ['ALL', ...Array.from(new Set(obsAuditLogs.map((l) => l.tenantId).filter(Boolean))).sort((a, b) => a - b)];
  const traceIdOptions = ['ALL', ...Array.from(new Set(obsAuditLogs.map((l) => l.traceId))).sort()];

  const loadAuditLogs = () => {
    setLoading(true);
    setError(null);
    window.setTimeout(() => {
      setAuditLogs(obsAuditLogs);
      setLoading(false);
    }, 500);
  };

  useEffect(() => {
    loadAuditLogs();
  }, []);

  useEffect(() => {
    setPage(1);
  }, [search, actorTypeFilter, actionFilter, resourceTypeFilter, resultFilter, tenantIdFilter, traceIdFilter, sortKey, sortDir]);

  const filteredLogs = useMemo(() => {
    let list = auditLogs.map((l) => ({ ...l }));

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter((l) =>
        [l.id, l.action, l.resourceType, l.resourceId, l.reason, l.traceId, l.applicationId, String(l.actorId), String(l.tenantId)]
          .some((v) => String(v).toLowerCase().includes(q))
      );
    }

    if (actorTypeFilter !== 'ALL') {
      list = list.filter((l) => l.actorType === actorTypeFilter);
    }
    if (actionFilter !== 'ALL') {
      list = list.filter((l) => l.action === actionFilter);
    }
    if (resourceTypeFilter !== 'ALL') {
      list = list.filter((l) => l.resourceType === resourceTypeFilter);
    }
    if (resultFilter !== 'ALL') {
      list = list.filter((l) => l.result === resultFilter);
    }
    if (tenantIdFilter !== 'ALL') {
      list = list.filter((l) => String(l.tenantId) === tenantIdFilter);
    }
    if (traceIdFilter !== 'ALL') {
      list = list.filter((l) => l.traceId === traceIdFilter);
    }

    list.sort((a, b) => {
      const getValue = (item) => {
        if (sortKey === 'timestamp') return new Date(item.timestamp).getTime();
        if (sortKey === 'actorType') return item.actorType.toLowerCase();
        if (sortKey === 'action') return item.action.toLowerCase();
        if (sortKey === 'resourceType') return item.resourceType.toLowerCase();
        if (sortKey === 'result') return item.result.toLowerCase();
        if (sortKey === 'tenantId') return item.tenantId ?? 0;
        if (sortKey === 'traceId') return item.traceId.toLowerCase();
        if (sortKey === 'actorId') return item.actorId ?? 0;
        if (sortKey === 'applicationId') return item.applicationId.toLowerCase();
        if (sortKey === 'auditId') return item.id.toLowerCase();
        return 0;
      };
      const av = getValue(a);
      const bv = getValue(b);
      if (av < bv) return sortDir === 'asc' ? -1 : 1;
      if (av > bv) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });

    return list;
  }, [auditLogs, search, actorTypeFilter, actionFilter, resourceTypeFilter, resultFilter, tenantIdFilter, traceIdFilter, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(filteredLogs.length / PAGE_SIZE));
  const pageItems = filteredLogs.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleRefresh = () => {
    setLoading(true);
    setError(null);
    showToast('Actualisation des audits…');
    window.setTimeout(() => {
      setAuditLogs(obsAuditLogs);
      setLoading(false);
    }, 500);
  };

  const handleResetFilters = () => {
    setSearch('');
    setActorTypeFilter('ALL');
    setActionFilter('ALL');
    setResourceTypeFilter('ALL');
    setResultFilter('ALL');
    setTenantIdFilter('ALL');
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

  const getResultBadgeClass = (result) => {
    const map = { SUCCESS: 'obs-result-success', FAILURE: 'obs-result-failure', PARTIAL: 'obs-result-partial' };
    return map[result] || '';
  };

  const getActorBadgeClass = (actorType) => {
    const map = { USER: 'obs-actor-user', SYSTEM: 'obs-actor-system', SERVICE: 'obs-actor-service' };
    return map[actorType] || '';
  };

  const columns = useMemo(
    () => [
      { key: 'auditId', label: 'ID Audit', width: '10rem', render: (v) => v },
      { key: 'timestamp', label: 'Horodatage', width: '10rem', render: (v) => formatDate(v) },
      {
        key: 'actorType',
        label: 'Type Acteur',
        width: '8rem',
        render: (v) => <span className={`obs-actor-badge ${getActorBadgeClass(v)}`}>{v}</span>,
      },
      { key: 'actorId', label: 'Acteur ID', width: '7rem' },
      { key: 'tenantId', label: 'Tenant', width: '6rem' },
      { key: 'applicationId', label: 'Application', width: '10rem' },
      { key: 'action', label: 'Action', width: '12rem' },
      { key: 'resourceType', label: 'Type Ressource', width: '10rem' },
      { key: 'resourceId', label: 'Ressource ID', width: '10rem' },
      {
        key: 'result',
        label: 'Résultat',
        width: '8rem',
        render: (v) => <span className={`obs-result-badge ${getResultBadgeClass(v)}`}>{v}</span>,
      },
      { key: 'reason', label: 'Raison', width: '12rem' },
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
      { key: 'metadataSafe', label: 'Métadonnées', width: '10rem', render: (v) => JSON.stringify(v) },
    ],
    [showToast]
  );

  const renderDetailFields = () => (
    <>
      <div className="obs-detail-field">
        <span className="obs-detail-label">ID Audit</span>
        <span className="obs-detail-value">{detailLog.id}</span>
      </div>
      <div className="obs-detail-field">
        <span className="obs-detail-label">Horodatage</span>
        <span className="obs-detail-value">{formatDate(detailLog.timestamp)}</span>
      </div>
      <div className="obs-detail-field">
        <span className="obs-detail-label">Type Acteur</span>
        <span className={`obs-actor-badge ${getActorBadgeClass(detailLog.actorType)}`}>{detailLog.actorType}</span>
      </div>
      <div className="obs-detail-field">
        <span className="obs-detail-label">Acteur ID</span>
        <span className="obs-detail-value">{detailLog.actorId ?? '—'}</span>
      </div>
      <div className="obs-detail-field">
        <span className="obs-detail-label">Tenant ID</span>
        <span className="obs-detail-value">{detailLog.tenantId ?? '—'}</span>
      </div>
      <div className="obs-detail-field">
        <span className="obs-detail-label">Application ID</span>
        <span className="obs-detail-value">{detailLog.applicationId}</span>
      </div>
      <div className="obs-detail-field">
        <span className="obs-detail-label">Action</span>
        <span className="obs-detail-value">{detailLog.action}</span>
      </div>
      <div className="obs-detail-field">
        <span className="obs-detail-label">Type Ressource</span>
        <span className="obs-detail-value">{detailLog.resourceType}</span>
      </div>
      <div className="obs-detail-field">
        <span className="obs-detail-label">Ressource ID</span>
        <span className="obs-detail-value">{detailLog.resourceId ?? '—'}</span>
      </div>
      <div className="obs-detail-field">
        <span className="obs-detail-label">Résultat</span>
        <span className={`obs-result-badge ${getResultBadgeClass(detailLog.result)}`}>{detailLog.result}</span>
      </div>
      <div className="obs-detail-field">
        <span className="obs-detail-label">Raison</span>
        <span className="obs-detail-value">{detailLog.reason || '—'}</span>
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
        <span className="obs-breadcrumb-current">Audit Manager</span>
      </nav>

      <div className="obs-header">
        <div className="obs-header-left">
          <div className="obs-title-row">
            <h1 className="obs-title">Audit Manager</h1>
          </div>
           <p className="obs-subtitle">Consultez et filtrez les journaux d'audit.</p>
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
          <SearchBar value={search} onChange={setSearch} placeholder="Rechercher un ID, une action, un traceId…" />
        </div>
        <div className="obs-toolbar-right">
          <FilterBar
            filters={actorTypeOptions.map((a) => ({ key: a, label: a === 'ALL' ? 'Tous types' : a }))}
            activeFilter={actorTypeFilter}
            onFilterChange={setActorTypeFilter}
          />
          <FilterBar
            filters={actionOptions.map((a) => ({ key: a, label: a === 'ALL' ? 'Toutes actions' : a }))}
            activeFilter={actionFilter}
            onFilterChange={setActionFilter}
          />
          <FilterBar
            filters={resourceTypeOptions.map((r) => ({ key: r, label: r === 'ALL' ? 'Tous types' : r }))}
            activeFilter={resourceTypeFilter}
            onFilterChange={setResourceTypeFilter}
          />
          <FilterBar
            filters={resultOptions.map((r) => ({ key: r, label: r === 'ALL' ? 'Tous résultats' : r }))}
            activeFilter={resultFilter}
            onFilterChange={setResultFilter}
          />
          <FilterBar
            filters={tenantIdOptions.map((t) => ({ key: String(t), label: t === 'ALL' ? 'Tous tenants' : `Tenant ${t}` }))}
            activeFilter={tenantIdFilter}
            onFilterChange={setTenantIdFilter}
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
              <option value="auditId">ID Audit</option>
              <option value="actorType">Type Acteur</option>
              <option value="action">Action</option>
              <option value="resourceType">Type Ressource</option>
              <option value="result">Résultat</option>
              <option value="tenantId">Tenant</option>
              <option value="applicationId">Application</option>
              <option value="traceId">Trace ID</option>
            </select>
            <select className="obs-select" value={sortDir} onChange={(e) => setSortDir(e.target.value)}>
              <option value="asc">Croissant</option>
              <option value="desc">Décroissant</option>
            </select>
          </div>
        </div>
      </div>

      {loading && <LoadingState message="Chargement des audits…" />}
      {error && !loading && <ErrorState message={error} onRetry={loadAuditLogs} />}
      {!loading && !error && filteredLogs.length === 0 && (
        <EmptyState
          title="Aucun audit trouvé"
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
              emptyMessage="Aucun audit à afficher."
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
        <DetailPanel open={!!detailLog} title="Détail de l'audit" onClose={() => setDetailLog(null)}>
          <div className="obs-detail-fields">{renderDetailFields()}</div>
        </DetailPanel>
      )}

      {toast && <div className="obs-toast" role="status">{toast}</div>}
    </div>
  );
}

export default AuditPage;
