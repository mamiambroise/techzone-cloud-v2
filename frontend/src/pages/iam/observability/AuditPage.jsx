import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Search,
  RefreshCw,
  FileText,
  Copy,
  CheckCircle,
  XCircle,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  SortAsc,
  SortDesc,
} from 'lucide-react';
import { iamObservabilityService } from '../../../services/apiClient.js';
import { obsAuditLogs, obsAuditFilters } from './mockData.js';
import { ModernSpinner } from '../../../components/Loaders.jsx';
import { useToast } from '../../../hooks/useToast.js';

const PAGE_SIZE = 8;

function formatDates(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleString('fr-FR', { dateStyle: 'medium', timeStyle: 'short' });
}

function ActorBadge({ actorType }) {
  const cfg = {
    USER: { bg: 'bg-blue-100', text: 'text-blue-700' },
    SYSTEM: { bg: 'bg-purple-100', text: 'text-purple-700' },
    SERVICE: { bg: 'bg-green-100', text: 'text-green-700' },
  };
  const c = cfg[actorType] || cfg.SERVICE;
  return <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${c.bg} ${c.text}`}>{actorType}</span>;
}

function ResultBadge({ result }) {
  const cfg = {
    SUCCESS: { bg: 'bg-green-100', text: 'text-green-700' },
    FAILURE: { bg: 'bg-red-100', text: 'text-red-700' },
    PARTIAL: { bg: 'bg-amber-100', text: 'text-amber-700' },
  };
  const c = cfg[result] || cfg.FAILURE;
  return <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${c.bg} ${c.text}`}>{result}</span>;
}

function AuditPage() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
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

  const tenantIdOptions = ['ALL', ...Array.from(new Set(logs.map((l) => l.tenantId).filter(Boolean))).sort((a, b) => a - b)];
  const traceIdOptions = ['ALL', ...Array.from(new Set(logs.map((l) => l.traceId))).sort()];

  const loadAuditLogs = useCallback(async () => {
    setLoading(true);
    try {
      const response = await iamObservabilityService.auditLogs();
      const data = response.data;
      setAuditLogs(Array.isArray(data) ? data : (data?.auditLogs ?? data?.data ?? []));
    } catch {
      {
        toast.error('Erreur lors du chargement des audits.');
        setAuditLogs([]);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAuditLogs();
  }, [loadAuditLogs]);

  useEffect(() => {
    setPage(1);
  }, [search, actorTypeFilter, actionFilter, resourceTypeFilter, resultFilter, tenantIdFilter, traceIdFilter, sortKey, sortDir]);

  const filteredLogs = useMemo(() => {
    let list = auditLogs.map((l) => ({ ...l }));

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter((l) =>
        [l.id, l.action, l.resourceType, String(l.resourceId), l.reason, l.traceId, l.applicationId, String(l.actorId), String(l.tenantId)]
          .some((v) => String(v).toLowerCase().includes(q))
      );
    }

    if (actorTypeFilter !== 'ALL') list = list.filter((l) => l.actorType === actorTypeFilter);
    if (actionFilter !== 'ALL') list = list.filter((l) => l.action === actionFilter);
    if (resourceTypeFilter !== 'ALL') list = list.filter((l) => l.resourceType === resourceTypeFilter);
    if (resultFilter !== 'ALL') list = list.filter((l) => l.result === resultFilter);
    if (tenantIdFilter !== 'ALL') list = list.filter((l) => String(l.tenantId) === tenantIdFilter);
    if (traceIdFilter !== 'ALL') list = list.filter((l) => l.traceId === traceIdFilter);

    list.sort((a, b) => {
      const getValue = (item) => {
        if (sortKey === 'timestamp') return new Date(item.timestamp).getTime();
        if (sortKey === 'actorType') return item.actorType.toLowerCase();
        if (sortKey === 'action') return item.action.toLowerCase();
        if (sortKey === 'resourceType') return item.resourceType.toLowerCase();
        if (sortKey === 'result') return item.result.toLowerCase();
        if (sortKey === 'tenantId') return item.tenantId ?? 0;
        if (sortKey === 'actorId') return item.actorId ?? 0;
        if (sortKey === 'applicationId') return item.applicationId.toLowerCase();
        if (sortKey === 'auditId') return item.id.toLowerCase();
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
  }, [auditLogs, search, actorTypeFilter, actionFilter, resourceTypeFilter, resultFilter, tenantIdFilter, traceIdFilter, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(filteredLogs.length / PAGE_SIZE));
  const pageItems = filteredLogs.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleRefresh = () => {
    loadAuditLogs();
    toast.success('Audits actualisés.');
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
    toast.success('Filtres réinitialisés.');
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
        <span className="text-slate-900 font-medium">Audit Manager</span>
      </nav>

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Audit Manager</h1>
        <p className="text-sm text-slate-500 mt-1">Consultez et filtrez les journaux d'audit.</p>
      </div>

      <div className="flex items-center gap-3 mb-5 flex-wrap">
        <div className="relative flex-1 min-w-64">
          <input
            type="text"
            placeholder="Rechercher un ID, une action, un traceId..."
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
              <th className="text-left px-4 py-3 font-medium text-slate-700">ID Audit</th>
              <th className="text-left px-4 py-3 font-medium text-slate-700 cursor-pointer" onClick={() => { setSortKey('timestamp'); setSortDir(sortDir === 'asc' ? 'desc' : 'asc'); }}>Horodatage {sortKey === 'timestamp' && (sortDir === 'asc' ? <SortAsc className="w-3 h-3 inline" /> : <SortDesc className="w-3 h-3 inline" />)}</th>
              <th className="text-left px-4 py-3 font-medium text-slate-700">Type Acteur</th>
              <th className="text-left px-4 py-3 font-medium text-slate-700">Acteur ID</th>
              <th className="text-left px-4 py-3 font-medium text-slate-700">Tenant</th>
              <th className="text-left px-4 py-3 font-medium text-slate-700">Application</th>
              <th className="text-left px-4 py-3 font-medium text-slate-700">Action</th>
              <th className="text-left px-4 py-3 font-medium text-slate-700">Type Ressource</th>
              <th className="text-left px-4 py-3 font-medium text-slate-700">Ressource ID</th>
              <th className="text-left px-4 py-3 font-medium text-slate-700">Résultat</th>
              <th className="text-left px-4 py-3 font-medium text-slate-700">Raison</th>
              <th className="text-left px-4 py-3 font-medium text-slate-700">Trace ID</th>
              <th className="text-left px-4 py-3 font-medium text-slate-700">Métadonnées</th>
            </tr>
          </thead>
          <tbody>
            {filteredLogs.length === 0 && (
              <tr><td colSpan={13} className="px-4 py-8 text-center text-slate-500">Aucun audit ne correspond aux filtres.</td></tr>
            )}
            {pageItems.map((log) => (
              <tr key={log.id} className="border-b border-slate-100 hover:bg-slate-50 cursor-pointer" onClick={() => setDetailLog(log)}>
                <td className="px-4 py-3 text-slate-600 font-mono text-xs">{log.id}</td>
                <td className="px-4 py-3 text-slate-600">{formatDates(log.timestamp)}</td>
                <td className="px-4 py-3"><ActorBadge actorType={log.actorType} /></td>
                <td className="px-4 py-3 text-slate-600">{log.actorId ?? '—'}</td>
                <td className="px-4 py-3 text-slate-600">{log.tenantId ?? '—'}</td>
                <td className="px-4 py-3 text-slate-600">{log.applicationId}</td>
                <td className="px-4 py-3 text-slate-600">{log.action}</td>
                <td className="px-4 py-3 text-slate-600">{log.resourceType}</td>
                <td className="px-4 py-3 text-slate-600 font-mono text-xs">{log.resourceId ?? '—'}</td>
                <td className="px-4 py-3"><ResultBadge result={log.result} /></td>
                <td className="px-4 py-3 text-slate-600">{log.reason || '—'}</td>
                <td className="px-4 py-3">
                  <button type="button" className="text-blue-600 hover:text-blue-800 font-mono text-xs" onClick={(e) => { e.stopPropagation(); copyTraceId(log.traceId); }}>{log.traceId}</button>
                </td>
                <td className="px-4 py-3 text-slate-600 font-mono text-xs">{JSON.stringify(log.metadataSafe)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filteredLogs.length > 0 && (
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

      {detailLog && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center" onClick={() => setDetailLog(null)}>
          <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl mx-4" onClick={(e) => e.stopPropagation()}>
            <div className="p-5 border-b border-slate-200 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900">Détail de l'audit</h2>
              <button onClick={() => setDetailLog(null)} className="text-slate-400 hover:text-slate-600 text-xl">×</button>
            </div>
            <div className="p-5 space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div><span className="text-xs font-medium text-slate-500">ID Audit</span><p className="text-sm text-slate-900 mt-0.5 font-mono">{detailLog.id}</p></div>
                <div><span className="text-xs font-medium text-slate-500">Horodatage</span><p className="text-sm text-slate-900 mt-0.5">{formatDates(detailLog.timestamp)}</p></div>
                <div><span className="text-xs font-medium text-slate-500">Type Acteur</span><div className="mt-0.5"><ActorBadge actorType={detailLog.actorType} /></div></div>
                <div><span className="text-xs font-medium text-slate-500">Acteur ID</span><p className="text-sm text-slate-900 mt-0.5">{detailLog.actorId ?? '—'}</p></div>
                <div><span className="text-xs font-medium text-slate-500">Tenant ID</span><p className="text-sm text-slate-900 mt-0.5">{detailLog.tenantId ?? '—'}</p></div>
                <div><span className="text-xs font-medium text-slate-500">Application ID</span><p className="text-sm text-slate-900 mt-0.5">{detailLog.applicationId}</p></div>
                <div><span className="text-xs font-medium text-slate-500">Action</span><p className="text-sm text-slate-900 mt-0.5">{detailLog.action}</p></div>
                <div><span className="text-xs font-medium text-slate-500">Type Ressource</span><p className="text-sm text-slate-900 mt-0.5">{detailLog.resourceType}</p></div>
                <div><span className="text-xs font-medium text-slate-500">Ressource ID</span><p className="text-sm text-slate-900 mt-0.5 font-mono">{detailLog.resourceId ?? '—'}</p></div>
                <div><span className="text-xs font-medium text-slate-500">Résultat</span><div className="mt-0.5"><ResultBadge result={detailLog.result} /></div></div>
                <div><span className="text-xs font-medium text-slate-500">Raison</span><p className="text-sm text-slate-900 mt-0.5">{detailLog.reason || '—'}</p></div>
                <div className="col-span-2"><span className="text-xs font-medium text-slate-500">Trace ID</span><p className="text-sm text-slate-900 mt-0.5 font-mono">{detailLog.traceId}</p></div>
                <div className="col-span-2"><span className="text-xs font-medium text-slate-500">Métadonnées sécurisées</span><p className="text-sm text-slate-900 mt-0.5 font-mono bg-slate-100 px-3 py-2 rounded">{JSON.stringify(detailLog.metadataSafe)}</p></div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AuditPage;
