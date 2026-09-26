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
import { SeverityBadge } from '../../components/observability/SeverityBadge';
import { StatusBadge } from '../../components/observability/StatusBadge';
import { obsSecurityEvents, obsSecurityEventTypes, obsSecuritySeverities, obsSecurityStatuses } from '../../data/observability/securityEventsMock';
import './SecurityEventsPage.css';

const PAGE_SIZE = 8;

function formatDate(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleString('fr-FR', { dateStyle: 'medium', timeStyle: 'short' });
}

function SecurityEventsPage() {
  const { toast, showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [events, setEvents] = useState([]);
  const [search, setSearch] = useState('');
  const [eventTypeFilter, setEventTypeFilter] = useState('ALL');
  const [severityFilter, setSeverityFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [tenantIdFilter, setTenantIdFilter] = useState('ALL');
  const [sortKey, setSortKey] = useState('timestamp');
  const [sortDir, setSortDir] = useState('desc');
  const [page, setPage] = useState(1);
  const [detailEvent, setDetailEvent] = useState(null);
  const [actionTarget, setActionTarget] = useState(null);
  const [confirmAction, setConfirmAction] = useState(null);

  const eventTypeOptions = ['ALL', ...obsSecurityEventTypes];
  const severityOptions = ['ALL', ...obsSecuritySeverities];
  const statusOptions = ['ALL', ...obsSecurityStatuses];
  const tenantIdOptions = ['ALL', ...Array.from(new Set(obsSecurityEvents.map((e) => e.tenantId).filter(Boolean))).sort((a, b) => a - b)];

  const loadEvents = () => {
    setLoading(true);
    setError(null);
    window.setTimeout(() => {
      setEvents(obsSecurityEvents);
      setLoading(false);
    }, 500);
  };

  useEffect(() => {
    loadEvents();
  }, []);

  useEffect(() => {
    setPage(1);
  }, [search, eventTypeFilter, severityFilter, statusFilter, tenantIdFilter, sortKey, sortDir]);

  const filteredEvents = useMemo(() => {
    let list = events.map((e) => ({ ...e }));

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter((e) =>
        [e.id, e.eventType, e.source, e.resource, e.traceId, e.detailsSafe, String(e.userId), String(e.tenantId), e.ipSafe]
          .some((v) => String(v).toLowerCase().includes(q))
      );
    }

    if (eventTypeFilter !== 'ALL') {
      list = list.filter((e) => e.eventType === eventTypeFilter);
    }
    if (severityFilter !== 'ALL') {
      list = list.filter((e) => e.severity === severityFilter);
    }
    if (statusFilter !== 'ALL') {
      list = list.filter((e) => e.status === statusFilter);
    }
    if (tenantIdFilter !== 'ALL') {
      list = list.filter((e) => String(e.tenantId) === tenantIdFilter);
    }

    list.sort((a, b) => {
      const severityOrder = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3, INFO: 4 };
      const statusOrder = { OPEN: 0, ACKNOWLEDGED: 1, INVESTIGATING: 2, RESOLVED: 3, FALSE_POSITIVE: 4 };
      const getValue = (item) => {
        if (sortKey === 'timestamp') return new Date(item.timestamp).getTime();
        if (sortKey === 'eventType') return item.eventType.toLowerCase();
        if (sortKey === 'severity') return severityOrder[item.severity] ?? 9;
        if (sortKey === 'status') return statusOrder[item.status] ?? 9;
        if (sortKey === 'tenantId') return item.tenantId ?? 0;
        if (sortKey === 'userId') return item.userId ?? 0;
        if (sortKey === 'source') return item.source.toLowerCase();
        if (sortKey === 'traceId') return item.traceId.toLowerCase();
        return 0;
      };
      const av = getValue(a);
      const bv = getValue(b);
      if (av < bv) return sortDir === 'asc' ? -1 : 1;
      if (av > bv) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });

    return list;
  }, [events, search, eventTypeFilter, severityFilter, statusFilter, tenantIdFilter, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(filteredEvents.length / PAGE_SIZE));
  const pageItems = filteredEvents.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleRefresh = () => {
    setLoading(true);
    setError(null);
    showToast('Actualisation des événements…');
    window.setTimeout(() => {
      setEvents(obsSecurityEvents);
      setLoading(false);
    }, 500);
  };

  const handleResetFilters = () => {
    setSearch('');
    setEventTypeFilter('ALL');
    setSeverityFilter('ALL');
    setStatusFilter('ALL');
    setTenantIdFilter('ALL');
    setSortKey('timestamp');
    setSortDir('desc');
    showToast('Filtres réinitialisés');
  };

  const handleRequestAction = (event, action) => {
    setActionTarget({ event, action });
    setConfirmAction(action);
  };

  const handleConfirmAction = () => {
    if (!actionTarget || !confirmAction) return;
    applyAction(actionTarget.event, confirmAction);
    setConfirmAction(null);
    setActionTarget(null);
  };

  const applyAction = (event, action) => {
    let nextStatus = event.status;
    let label = '';

    if (action === 'ack' && event.status === 'OPEN') {
      nextStatus = 'ACKNOWLEDGED';
      label = 'acquitté';
    } else if (action === 'investigate' && (event.status === 'OPEN' || event.status === 'ACKNOWLEDGED')) {
      nextStatus = 'INVESTIGATING';
      label = 'en cours d\'investigation';
    } else if (action === 'resolve' && (event.status === 'OPEN' || event.status === 'ACKNOWLEDGED' || event.status === 'INVESTIGATING')) {
      nextStatus = 'RESOLVED';
      label = 'résolu';
    } else if (action === 'falsePositive' && (event.status === 'OPEN' || event.status === 'ACKNOWLEDGED' || event.status === 'INVESTIGATING')) {
      nextStatus = 'FALSE_POSITIVE';
      label = 'marqué comme faux positif';
    }

    setEvents((prev) => prev.map((e) => (e.id === event.id ? { ...e, status: nextStatus } : e)));
    setDetailEvent((prev) => (prev && prev.id === event.id ? { ...prev, status: nextStatus } : prev));
    showToast(`Événement ${event.id} ${label}`);
  };

  const getActionLabel = (action) => {
    if (action === 'ack') return 'acquitter';
    if (action === 'investigate') return 'mettre en investigation';
    if (action === 'resolve') return 'résoudre';
    if (action === 'falsePositive') return 'marquer comme faux positif';
    return 'confirmer';
  };

  const getAvailableActions = (status) => {
    if (status === 'OPEN') return ['ack', 'investigate', 'resolve', 'falsePositive'];
    if (status === 'ACKNOWLEDGED') return ['investigate', 'resolve', 'falsePositive'];
    if (status === 'INVESTIGATING') return ['resolve', 'falsePositive'];
    return [];
  };

  const columns = useMemo(
    () => [
      { key: 'eventId', label: 'ID', width: '8rem', render: (v) => v },
      { key: 'timestamp', label: 'Horodatage', width: '10rem', render: (v) => formatDate(v) },
      { key: 'eventType', label: 'Type', width: '12rem' },
      {
        key: 'severity',
        label: 'Sévérité',
        width: '8rem',
        render: (v) => <SeverityBadge severity={v} />,
      },
      { key: 'tenantId', label: 'Tenant', width: '6rem' },
      { key: 'userId', label: 'Utilisateur', width: '7rem' },
      { key: 'source', label: 'Source', width: '10rem' },
      { key: 'resource', label: 'Ressource', width: '12rem' },
      { key: 'ipSafe', label: 'IP', width: '10rem' },
      {
        key: 'traceId',
        label: 'Trace ID',
        width: '10rem',
        render: (v) => (
          <button type="button" className="obs-trace-copy" onClick={(e) => { e.stopPropagation(); if (navigator.clipboard) navigator.clipboard.writeText(v); showToast(`Trace ID copié : ${v}`); }} title="Copier le traceId">
            {v}
          </button>
        ),
      },
      {
        key: 'status',
        label: 'Statut',
        width: '9rem',
        render: (v) => <StatusBadge status={v} />,
      },
      { key: 'detailsSafe', label: 'Détails', width: '12rem' },
    ],
    [showToast]
  );

  const renderDetailFields = () => (
    <>
      <div className="obs-detail-field">
        <span className="obs-detail-label">ID</span>
        <span className="obs-detail-value">{detailEvent.id}</span>
      </div>
      <div className="obs-detail-field">
        <span className="obs-detail-label">Horodatage</span>
        <span className="obs-detail-value">{formatDate(detailEvent.timestamp)}</span>
      </div>
      <div className="obs-detail-field">
        <span className="obs-detail-label">Type d'événement</span>
        <span className="obs-detail-value">{detailEvent.eventType}</span>
      </div>
      <div className="obs-detail-field">
        <span className="obs-detail-label">Sévérité</span>
        <SeverityBadge severity={detailEvent.severity} />
      </div>
      <div className="obs-detail-field">
        <span className="obs-detail-label">Statut</span>
        <StatusBadge status={detailEvent.status} />
      </div>
      <div className="obs-detail-field">
        <span className="obs-detail-label">Tenant ID</span>
        <span className="obs-detail-value">{detailEvent.tenantId ?? '—'}</span>
      </div>
      <div className="obs-detail-field">
        <span className="obs-detail-label">Utilisateur ID</span>
        <span className="obs-detail-value">{detailEvent.userId ?? '—'}</span>
      </div>
      <div className="obs-detail-field">
        <span className="obs-detail-label">Source</span>
        <span className="obs-detail-value">{detailEvent.source}</span>
      </div>
      <div className="obs-detail-field">
        <span className="obs-detail-label">Ressource</span>
        <span className="obs-detail-value">{detailEvent.resource}</span>
      </div>
      <div className="obs-detail-field">
        <span className="obs-detail-label">IP</span>
        <span className="obs-detail-value">{detailEvent.ipSafe || '—'}</span>
      </div>
      <div className="obs-detail-field">
        <span className="obs-detail-label">Trace ID</span>
        <span className="obs-detail-value">
          <button type="button" className="obs-copy-btn" onClick={() => { if (navigator.clipboard) navigator.clipboard.writeText(detailEvent.traceId); showToast(`Trace ID copié : ${detailEvent.traceId}`); }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
            </svg>
            {detailEvent.traceId}
          </button>
        </span>
      </div>
      <div className="obs-detail-field">
        <span className="obs-detail-label">Détails</span>
        <span className="obs-detail-value">{detailEvent.detailsSafe}</span>
      </div>
      <div className="obs-detail-actions">
        {getAvailableActions(detailEvent.status).map((action) => (
          <button key={action} type="button" className="obs-btn-primary" onClick={() => handleRequestAction(detailEvent, action)}>
            {action === 'ack' && 'Acquitter'}
            {action === 'investigate' && 'Investiguer'}
            {action === 'resolve' && 'Résoudre'}
            {action === 'falsePositive' && 'Faux positif'}
          </button>
        ))}
      </div>
    </>
  );

  return (
    <div className="obs-page">
      <nav className="obs-breadcrumb">
        <span>Observability & Security</span>
        <span className="obs-breadcrumb-sep">/</span>
        <span className="obs-breadcrumb-current">Security Events</span>
      </nav>

      <div className="obs-header">
        <div className="obs-header-left">
          <div className="obs-title-row">
            <h1 className="obs-title">Security Events</h1>
          </div>
          <p className="obs-subtitle"> Gérez les événements de sécurité.</p>
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
          <SearchBar value={search} onChange={setSearch} placeholder="Rechercher un événement, une source, un traceId…" />
        </div>
        <div className="obs-toolbar-right">
          <FilterBar
            filters={eventTypeOptions.map((e) => ({ key: e, label: e === 'ALL' ? 'Tous types' : e }))}
            activeFilter={eventTypeFilter}
            onFilterChange={setEventTypeFilter}
          />
          <FilterBar
            filters={severityOptions.map((s) => ({ key: s, label: s === 'ALL' ? 'Toutes sév.' : s }))}
            activeFilter={severityFilter}
            onFilterChange={setSeverityFilter}
          />
          <FilterBar
            filters={statusOptions.map((s) => ({ key: s, label: s === 'ALL' ? 'Tous statuts' : s }))}
            activeFilter={statusFilter}
            onFilterChange={setStatusFilter}
          />
          <FilterBar
            filters={tenantIdOptions.map((t) => ({ key: String(t), label: t === 'ALL' ? 'Tous tenants' : `Tenant ${t}` }))}
            activeFilter={tenantIdFilter}
            onFilterChange={setTenantIdFilter}
          />
          <div className="obs-sort-group">
            <span className="obs-sort-label">Trier par</span>
            <select className="obs-select" value={sortKey} onChange={(e) => setSortKey(e.target.value)}>
              <option value="timestamp">Horodatage</option>
              <option value="eventType">Type</option>
              <option value="severity">Sévérité</option>
              <option value="status">Statut</option>
              <option value="tenantId">Tenant</option>
              <option value="source">Source</option>
              <option value="traceId">Trace ID</option>
            </select>
            <select className="obs-select" value={sortDir} onChange={(e) => setSortDir(e.target.value)}>
              <option value="asc">Croissant</option>
              <option value="desc">Décroissant</option>
            </select>
          </div>
        </div>
      </div>

      {loading && <LoadingState message="Chargement des événements…" />}
      {error && !loading && <ErrorState message={error} onRetry={loadEvents} />}
      {!loading && !error && filteredEvents.length === 0 && (
        <EmptyState
          title="Aucun événement trouvé"
          description="Essayez de modifier vos filtres ou votre recherche."
          action={
            <button type="button" className="obs-btn-secondary" onClick={handleResetFilters}>
              Réinitialiser les filtres
            </button>
          }
        />
      )}
      {!loading && !error && filteredEvents.length > 0 && (
        <>
          <div className="obs-table-wrapper">
            <DataTable
              columns={columns}
              rows={pageItems}
              rowKey="id"
              onRowClick={setDetailEvent}
              emptyMessage="Aucun événement à afficher."
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

      {detailEvent && (
        <DetailPanel open={!!detailEvent} title="Détail de l'événement" onClose={() => setDetailEvent(null)}>
          <div className="obs-detail-fields">{renderDetailFields()}</div>
        </DetailPanel>
      )}

      <ConfirmationModal
        open={!!confirmAction && !!actionTarget}
        title={`${getActionLabel(confirmAction)} l'événement`}
        message={`Voulez-vous ${getActionLabel(confirmAction)} cet événement ?`}
        onConfirm={handleConfirmAction}
        onCancel={() => { setConfirmAction(null); setActionTarget(null); }}
        confirmLabel={confirmAction === 'ack' ? 'Acquitter' : confirmAction === 'investigate' ? 'Investiguer' : confirmAction === 'resolve' ? 'Résoudre' : 'Marquer faux positif'}
      />

      {toast && <div className="obs-toast" role="status">{toast}</div>}
    </div>
  );
}

export default SecurityEventsPage;
