import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Search,
  RefreshCw,
  FileText,
  Copy,
  AlertCircle,
  CheckCircle,
  Info,
  ChevronLeft,
  ChevronRight,
  SortAsc,
  SortDesc,
} from 'lucide-react';
import { iamObservabilityService } from '../../../services/apiClient.js';
import { obsLogs, obsLogFilters } from './mockData.js';
import { ModernSpinner } from '../../../components/Loaders.jsx';
import ConfirmModal from '../../../components/ui/ConfirmModal.jsx';
import { useToast } from '../../../hooks/useToast.js';

const PAGE_SIZE = 8;

function formatDate(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleString('fr-FR', { dateStyle: 'medium', timeStyle: 'short' });
}

function LevelBadge({ level }) {
  const cfg = {
    ERROR: { bg: 'bg-red-100', text: 'text-red-700' },
    WARN: { bg: 'bg-amber-100', text: 'text-amber-700' },
    INFO: { bg: 'bg-blue-100', text: 'text-blue-700' },
    DEBUG: { bg: 'bg-gray-100', text: 'text-gray-700' },
  };
  const c = cfg[level] || cfg.INFO;
  return <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${c.bg} ${c.text}`}>{level}</span>;
}

function LogsPage() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
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
  const serviceOptions = ['ALL', ...Array.from(new Set(logs.map((l) => l.service)))];
  const componentOptions = ['ALL', ...Array.from(new Set(logs.map((l) => l.component)))];
  const environmentOptions = ['ALL', ...obsLogFilters.environments];
  const tenantOptions = ['ALL', ...Array.from(new Set(logs.map((l) => l.tenantId).filter(Boolean))).sort((a, b) => a - b)];
  const errorCodeOptions = ['ALL', ...Array.from(new Set(logs.map((l) => l.errorCode).filter(Boolean))).sort()];
  const traceIdOptions = ['ALL', ...Array.from(new Set(logs.map((l) => l.traceId))).sort()];

  const loadLogs = useCallback(async () => {
    setLoading(true);
    try {
      const response = await iamObservabilityService.logs();
      const data = response.data;
      setLogs(Array.isArray(data) ? data : (data?.logs ?? data?.data ?? []));
    } catch {
      {
        toast.error('Erreur lors du chargement des logs.');
        setLogs([]);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadLogs();
  }, [loadLogs]);

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

    if (levelFilter !== 'ALL') list = list.filter((l) => l.level === levelFilter);
    if (serviceFilter !== 'ALL') list = list.filter((l) => l.service === serviceFilter);
    if (componentFilter !== 'ALL') list = list.filter((l) => l.component === componentFilter);
    if (environmentFilter !== 'ALL') list = list.filter((l) => l.environmentId === environmentFilter);
    if (tenantFilter !== 'ALL') list = list.filter((l) => String(l.tenantId) === tenantFilter);
    if (errorCodeFilter !== 'ALL') list = list.filter((l) => l.errorCode === errorCodeFilter);
    if (traceIdFilter !== 'ALL') list = list.filter((l) => l.traceId === traceIdFilter);

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

  const handleRefresh = () => {
    loadLogs();
    toast.success('Logs actualisés.');
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
        <span className="text-slate-900 font-medium">Logs Manager</span>
      </nav>

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Logs Manager</h1>
        <p className="text-sm text-slate-500 mt-1">Consultez et filtrez les journaux d'activité.</p>
      </div>

      <div className="flex items-center gap-3 mb-5 flex-wrap">
        <div className="relative flex-1 min-w-64">
          <input
            type="text"
            placeholder="Rechercher un message, un service, un traceId..."
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
              <th className="text-left px-4 py-3 font-medium text-slate-700 cursor-pointer" onClick={() => { setSortKey('timestamp'); setSortDir(sortDir === 'asc' ? 'desc' : 'asc'); }}>
                Horodatage {sortKey === 'timestamp' && (sortDir === 'asc' ? <SortAsc className="w-3 h-3 inline" /> : <SortDesc className="w-3 h-3 inline" />)}
              </th>
              <th className="text-left px-4 py-3 font-medium text-slate-700">Niveau</th>
              <th className="text-left px-4 py-3 font-medium text-slate-700">Service</th>
              <th className="text-left px-4 py-3 font-medium text-slate-700">Composant</th>
              <th className="text-left px-4 py-3 font-medium text-slate-700">Message</th>
              <th className="text-left px-4 py-3 font-medium text-slate-700">Trace ID</th>
              <th className="text-left px-4 py-3 font-medium text-slate-700">Request ID</th>
              <th className="text-left px-4 py-3 font-medium text-slate-700">Tenant</th>
              <th className="text-left px-4 py-3 font-medium text-slate-700">User</th>
              <th className="text-left px-4 py-3 font-medium text-slate-700">Env</th>
              <th className="text-left px-4 py-3 font-medium text-slate-700">Code erreur</th>
              <th className="text-left px-4 py-3 font-medium text-slate-700">Détails</th>
            </tr>
          </thead>
          <tbody>
            {filteredLogs.length === 0 && (
              <tr><td colSpan={12} className="px-4 py-8 text-center text-slate-500">Aucun log ne correspond aux filtres.</td></tr>
            )}
            {pageItems.map((log) => (
              <tr key={log.id} className="border-b border-slate-100 hover:bg-slate-50 cursor-pointer" onClick={() => setDetailLog(log)}>
                <td className="px-4 py-3 text-slate-600">{formatDate(log.timestamp)}</td>
                <td className="px-4 py-3"><LevelBadge level={log.level} /></td>
                <td className="px-4 py-3 text-slate-600">{log.service}</td>
                <td className="px-4 py-3 text-slate-600">{log.component}</td>
                <td className="px-4 py-3 text-slate-600">{log.message}</td>
                <td className="px-4 py-3">
                  <button type="button" className="text-blue-600 hover:text-blue-800 font-mono text-xs" onClick={(e) => { e.stopPropagation(); copyTraceId(log.traceId); }}>
                    {log.traceId}
                  </button>
                </td>
                <td className="px-4 py-3 text-slate-600 font-mono text-xs">{log.requestId || '—'}</td>
                <td className="px-4 py-3 text-slate-600">{log.tenantId ?? '—'}</td>
                <td className="px-4 py-3 text-slate-600">{log.userId ?? '—'}</td>
                <td className="px-4 py-3 text-slate-600">{log.environmentId}</td>
                <td className="px-4 py-3 text-slate-600">{log.errorCode || '—'}</td>
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
              <h2 className="text-lg font-semibold text-slate-900">Détail du log</h2>
              <button onClick={() => setDetailLog(null)} className="text-slate-400 hover:text-slate-600 text-xl">×</button>
            </div>
            <div className="p-5 space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div><span className="text-xs font-medium text-slate-500">ID</span><p className="text-sm text-slate-900 mt-0.5">{detailLog.id}</p></div>
                <div><span className="text-xs font-medium text-slate-500">Horodatage</span><p className="text-sm text-slate-900 mt-0.5">{formatDate(detailLog.timestamp)}</p></div>
                <div><span className="text-xs font-medium text-slate-500">Niveau</span><div className="mt-0.5"><LevelBadge level={detailLog.level} /></div></div>
                <div><span className="text-xs font-medium text-slate-500">Service</span><p className="text-sm text-slate-900 mt-0.5">{detailLog.service}</p></div>
                <div><span className="text-xs font-medium text-slate-500">Composant</span><p className="text-sm text-slate-900 mt-0.5">{detailLog.component}</p></div>
                <div><span className="text-xs font-medium text-slate-500">Trace ID</span><p className="text-sm text-slate-900 mt-0.5 font-mono">{detailLog.traceId}</p></div>
                <div><span className="text-xs font-medium text-slate-500">Request ID</span><p className="text-sm text-slate-900 mt-0.5 font-mono">{detailLog.requestId || '—'}</p></div>
                <div><span className="text-xs font-medium text-slate-500">Tenant ID</span><p className="text-sm text-slate-900 mt-0.5">{detailLog.tenantId ?? '—'}</p></div>
                <div><span className="text-xs font-medium text-slate-500">User ID</span><p className="text-sm text-slate-900 mt-0.5">{detailLog.userId ?? '—'}</p></div>
                <div><span className="text-xs font-medium text-slate-500">Environment ID</span><p className="text-sm text-slate-900 mt-0.5">{detailLog.environmentId}</p></div>
                <div><span className="text-xs font-medium text-slate-500">Code erreur</span><p className="text-sm text-slate-900 mt-0.5">{detailLog.errorCode || '—'}</p></div>
                <div className="col-span-2"><span className="text-xs font-medium text-slate-500">Message</span><p className="text-sm text-slate-900 mt-0.5">{detailLog.message}</p></div>
                <div className="col-span-2"><span className="text-xs font-medium text-slate-500">Métadonnées</span><p className="text-sm text-slate-900 mt-0.5 font-mono bg-slate-100 px-3 py-2 rounded">{JSON.stringify(detailLog.metadataSafe)}</p></div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default LogsPage;
