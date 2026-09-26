import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Search,
  RefreshCw,
  Shield,
  Copy,
  ChevronLeft,
  ChevronRight,
  SortAsc,
  SortDesc,
} from 'lucide-react';
import { iamObservabilityService } from '../../../services/apiClient.js';
import { obsSecurityEvents, obsSecurityEventTypes, obsSecuritySeverities, obsSecurityStatuses } from './mockData.js';
import { ModernSpinner } from '../../../components/Loaders.jsx';
import ConfirmModal from '../../../components/ui/ConfirmModal.jsx';
import { useToast } from '../../../hooks/useToast.js';

const PAGE_SIZE = 8;

function formatDates(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleString('fr-FR', { dateStyle: 'medium', timeStyle: 'short' });
}

function SeverityBadge({ severity }) {
  const cfg = {
    CRITICAL: { bg: 'bg-red-100', text: 'text-red-700' },
    HIGH: { bg: 'bg-orange-100', text: 'text-orange-700' },
    MEDIUM: { bg: 'bg-amber-100', text: 'text-amber-700' },
    LOW: { bg: 'bg-blue-100', text: 'text-blue-700' },
    INFO: { bg: 'bg-gray-100', text: 'text-gray-700' },
  };
  const c = cfg[severity] || cfg.LOW;
  return <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${c.bg} ${c.text}`}>{severity}</span>;
}

function StatusBadge({ status }) {
  const cfg = {
    OPEN: { bg: 'bg-red-100', text: 'text-red-700' },
    ACKNOWLEDGED: { bg: 'bg-yellow-100', text: 'text-yellow-700' },
    INVESTIGATING: { bg: 'bg-blue-100', text: 'text-blue-700' },
    RESOLVED: { bg: 'bg-green-100', text: 'text-green-700' },
    FALSE_POSITIVE: { bg: 'bg-gray-100', text: 'text-gray-700' },
  };
  const c = cfg[status] || cfg.OPEN;
  return <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${c.bg} ${c.text}`}>{status}</span>;
}

function SecurityEventsPage() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
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
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);

  const eventTypeOptions = ['ALL', ...obsSecurityEventTypes];
  const severityOptions = ['ALL', ...obsSecuritySeverities];
  const statusOptions = ['ALL', ...obsSecurityStatuses];
  const tenantIdOptions = ['ALL', ...Array.from(new Set(events.map((e) => e.tenantId).filter(Boolean))).sort((a, b) => a - b)];

  const loadEvents = useCallback(async () => {
    setLoading(true);
    try {
      const response = await iamObservabilityService.securityEvents();
      const data = response.data;
      setEvents(Array.isArray(data) ? data : (data?.events ?? data?.data ?? []));
    } catch {
      {
        toast.error('Erreur lors du chargement des événements de sécurité.');
        setEvents([]);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

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

    if (eventTypeFilter !== 'ALL') list = list.filter((e) => e.eventType === eventTypeFilter);
    if (severityFilter !== 'ALL') list = list.filter((e) => e.severity === severityFilter);
    if (statusFilter !== 'ALL') list = list.filter((e) => e.status === statusFilter);
    if (tenantIdFilter !== 'ALL') list = list.filter((e) => String(e.tenantId) === tenantIdFilter);

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
    loadEvents();
    toast.success('Événements actualisés.');
  };

  const handleResetFilters = () => {
    setSearch('');
    setEventTypeFilter('ALL');
    setSeverityFilter('ALL');
    setStatusFilter('ALL');
    setTenantIdFilter('ALL');
    setSortKey('timestamp');
    setSortDir('desc');
    toast.success('Filtres réinitialisés.');
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

  const handleRequestAction = (event, action) => {
    setConfirmAction({ event, action });
    setConfirmOpen(true);
  };

  const handleConfirmAction = async () => {
    if (!confirmAction) return;
    const { event, action } = confirmAction;
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

    try {
      await iamObservabilityService.updateSecurityEvent(event.id, { status: nextStatus });
      setEvents((prev) => prev.map((e) => (e.id === event.id ? { ...e, status: nextStatus } : e)));
      setDetailEvent((prev) => (prev && prev.id === event.id ? { ...prev, status: nextStatus } : prev));
      toast.success(`Événement ${event.id} ${label}`);
    } catch {
      {
        toast.error('Erreur lors de la mise à jour de l\'événement.');
      }
    }
    setConfirmOpen(false);
    setConfirmAction(null);
  };

  const copyTraceId = (traceId) => {
    if (navigator.clipboard) navigator.clipboard.writeText(traceId);
    toast.info(`Trace ID copié : ${traceId}`);
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[400px]">
        <ModernSpinner />
      </div>
    );
  }

  return (
    <div className="p-6">
      <nav className="text-xs text-slate-500 mb-4">
        <span>Observability & Security</span> <span className="mx-1">/</span>
        <span className="text-slate-900 font-medium">Security Events</span>
      </nav>

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Security Events</h1>
        <p className="text-sm text-slate-500 mt-1">Gérez les événements de sécurité.</p>
      </div>

      <div className="flex items-center gap-3 mb-5 flex-wrap">
        <div className="relative flex-1 min-w-64">
          <input
            type="text"
            placeholder="Rechercher un événement, une source, un traceId..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-3 py-2 border border-slate-300 rounded-lg text-sm"
          />
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
        </div>
        <button onClick={handleRefresh} disabled={loading} className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 border border-slate-300 rounded-lg">
          <RefreshCw className="w-4 h-4 inline mr-1" />Actualiser
        </button>
        <button onClick={handleResetFilters} className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 border border-slate-300 rounded-lg">Réinitialiser les filtres</button>
      </div>

      <div className="overflow-x-auto rounded-lg border border-slate-200">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-slate-700">ID</th>
              <th className="text-left px-4 py-3 font-medium text-slate-700 cursor-pointer" onClick={() => { setSortKey('timestamp'); setSortDir(sortDir === 'asc' ? 'desc' : 'asc'); }}>Horodatage {sortKey === 'timestamp' && (sortDir === 'asc' ? <SortAsc className="w-3 h-3 inline" /> : <SortDesc className="w-3 h-3 inline" />)}</th>
              <th className="text-left px-4 py-3 font-medium text-slate-700">Type</th>
              <th className="text-left px-4 py-3 font-medium text-slate-700">Sévérité</th>
              <th className="text-left px-4 py-3 font-medium text-slate-700">Tenant</th>
              <th className="text-left px-4 py-3 font-medium text-slate-700">Utilisateur</th>
              <th className="text-left px-4 py-3 font-medium text-slate-700">Source</th>
              <th className="text-left px-4 py-3 font-medium text-slate-700">Ressource</th>
              <th className="text-left px-4 py-3 font-medium text-slate-700">IP</th>
              <th className="text-left px-4 py-3 font-medium text-slate-700">Trace ID</th>
              <th className="text-left px-4 py-3 font-medium text-slate-700">Statut</th>
              <th className="text-left px-4 py-3 font-medium text-slate-700">Détails</th>
            </tr>
          </thead>
          <tbody>
            {filteredEvents.length === 0 && (
              <tr><td colSpan={12} className="px-4 py-8 text-center text-slate-500">Aucun événement ne correspond aux filtres.</td></tr>
            )}
            {pageItems.map((event) => (
              <tr key={event.id} className="border-b border-slate-100 hover:bg-slate-50 cursor-pointer" onClick={() => setDetailEvent(event)}>
                <td className="px-4 py-3 text-slate-600 font-mono text-xs">{event.id}</td>
                <td className="px-4 py-3 text-slate-600">{formatDates(event.timestamp)}</td>
                <td className="px-4 py-3 text-slate-600">{event.eventType}</td>
                <td className="px-4 py-3"><SeverityBadge severity={event.severity} /></td>
                <td className="px-4 py-3 text-slate-600">{event.tenantId ?? '—'}</td>
                <td className="px-4 py-3 text-slate-600">{event.userId ?? '—'}</td>
                <td className="px-4 py-3 text-slate-600">{event.source}</td>
                <td className="px-4 py-3 text-slate-600">{event.resource}</td>
                <td className="px-4 py-3 text-slate-600 font-mono text-xs">{event.ipSafe || '—'}</td>
                <td className="px-4 py-3">
                  <button type="button" className="text-blue-600 hover:text-blue-800 font-mono text-xs" onClick={(e) => { e.stopPropagation(); copyTraceId(event.traceId); }}>{event.traceId}</button>
                </td>
                <td className="px-4 py-3"><StatusBadge status={event.status} /></td>
                <td className="px-4 py-3 text-slate-600">{event.detailsSafe}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filteredEvents.length > 0 && (
        <div className="flex items-center justify-between mt-4 px-4 py-3 text-sm text-slate-600">
          <span>Page {page} / {totalPages}</span>
          <div className="flex items-center gap-2">
            <button type="button" className="p-1 text-slate-500 hover:bg-slate-100 rounded disabled:opacity-50" disabled={page <= 1} onClick={() => setPage(page - 1)}><ChevronLeft className="w-4 h-4" /></button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <button key={p} type="button" className={`px-3 py-1 rounded-lg text-sm font-medium ${p === page ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-100'}`} onClick={() => setPage(p)}>{p}</button>
            ))}
            <button type="button" className="p-1 text-slate-500 hover:bg-slate-100 rounded disabled:opacity-50" disabled={page >= totalPages} onClick={() => setPage(page + 1)}><ChevronRight className="w-4 h-4" /></button>
          </div>
        </div>
      )}

      {detailEvent && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center" onClick={() => setDetailEvent(null)}>
          <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl mx-4" onClick={(e) => e.stopPropagation()}>
            <div className="p-5 border-b border-slate-200 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900">Détail de l'événement</h2>
              <button onClick={() => setDetailEvent(null)} className="text-slate-400 hover:text-slate-600 text-xl">×</button>
            </div>
            <div className="p-5 space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div><span className="text-xs font-medium text-slate-500">ID</span><p className="text-sm text-slate-900 mt-0.5">{detailEvent.id}</p></div>
                <div><span className="text-xs font-medium text-slate-500">Horodatage</span><p className="text-sm text-slate-900 mt-0.5">{formatDates(detailEvent.timestamp)}</p></div>
                <div><span className="text-xs font-medium text-slate-500">Type d'événement</span><p className="text-sm text-slate-900 mt-0.5">{detailEvent.eventType}</p></div>
                <div><span className="text-xs font-medium text-slate-500">Sévérité</span><div className="mt-0.5"><SeverityBadge severity={detailEvent.severity} /></div></div>
                <div><span className="text-xs font-medium text-slate-500">Statut</span><div className="mt-0.5"><StatusBadge status={detailEvent.status} /></div></div>
                <div><span className="text-xs font-medium text-slate-500">Tenant ID</span><p className="text-sm text-slate-900 mt-0.5">{detailEvent.tenantId ?? '—'}</p></div>
                <div><span className="text-xs font-medium text-slate-500">Utilisateur ID</span><p className="text-sm text-slate-900 mt-0.5">{detailEvent.userId ?? '—'}</p></div>
                <div><span className="text-xs font-medium text-slate-500">Source</span><p className="text-sm text-slate-900 mt-0.5">{detailEvent.source}</p></div>
                <div><span className="text-xs font-medium text-slate-500">Ressource</span><p className="text-sm text-slate-900 mt-0.5">{detailEvent.resource}</p></div>
                <div><span className="text-xs font-medium text-slate-500">IP</span><p className="text-sm text-slate-900 mt-0.5">{detailEvent.ipSafe || '—'}</p></div>
                <div><span className="text-xs font-medium text-slate-500">Trace ID</span><p className="text-sm text-slate-900 mt-0.5 font-mono">{detailEvent.traceId}</p></div>
                <div className="col-span-2"><span className="text-xs font-medium text-slate-500">Détails</span><p className="text-sm text-slate-900 mt-0.5">{detailEvent.detailsSafe}</p></div>
                <div className="col-span-2 flex gap-2 pt-2">
                  {getAvailableActions(detailEvent.status).map((action) => (
                    <button key={action} type="button" className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700" onClick={() => { setDetailEvent(null); handleRequestAction(detailEvent, action); }}>
                      {action === 'ack' && 'Acquitter'}
                      {action === 'investigate' && 'Investiguer'}
                      {action === 'resolve' && 'Résoudre'}
                      {action === 'falsePositive' && 'Faux positif'}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal
        open={confirmOpen}
        title="Confirmation"
        message={confirmAction ? `Voulez-vous ${getActionLabel(confirmAction.action)} cet événement ?` : ''}
        confirmLabel="Confirmer"
        onCancel={() => { setConfirmOpen(false); setConfirmAction(null); }}
        onConfirm={handleConfirmAction}
      />
    </div>
  );
}

export default SecurityEventsPage;
