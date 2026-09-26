import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Search,
  RefreshCw,
  Activity,
  ChevronLeft,
  ChevronRight,
  SortAsc,
  SortDesc,
  ExternalLink,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { iamObservabilityService } from '../../../services/apiClient.js';
import { obsMonitoring, obsMonitoringPageMock, obsHealthStatuses } from './mockData.js';
import { ModernSpinner } from '../../../components/Loaders.jsx';
import ConfirmModal from '../../../components/ui/ConfirmModal.jsx';
import { useToast } from '../../../hooks/useToast.js';

const PAGE_SIZE = 8;
const PERIODS = ['1h', '24h', '7d', '30d'];

function formatNumber(value) {
  if (value === null || value === undefined) return '—';
  return new Intl.NumberFormat('fr-FR').format(value);
}

function StatusBadge({ status }) {
  const cfg = {
    HEALTHY: { bg: 'bg-green-100', text: 'text-green-700' },
    DEGRADED: { bg: 'bg-amber-100', text: 'text-amber-700' },
    UNHEALTHY: { bg: 'bg-red-100', text: 'text-red-700' },
    WARNING: { bg: 'bg-yellow-100', text: 'text-yellow-700' },
    UNKNOWN: { bg: 'bg-gray-100', text: 'text-gray-700' },
  };
  const c = cfg[status] || cfg.UNKNOWN;
  return <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${c.bg} ${c.text}`}>{status}</span>;
}

function MonitoringPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [services, setServices] = useState([]);
  const [period, setPeriod] = useState('24h');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState('service');
  const [sortDir, setSortDir] = useState('asc');
  const [page, setPage] = useState(1);
  const [detailService, setDetailService] = useState(null);

  const statusOptions = ['ALL', ...obsHealthStatuses];

  const loadMonitoring = useCallback(async () => {
    setLoading(true);
    try {
      const response = await iamObservabilityService.monitoring();
      const data = response.data;
      const servicesData = Array.isArray(data?.services) ? data.services : [];
      setServices(servicesData);
    } catch {
      {
        toast.error('Erreur lors du chargement du monitoring.');
        setServices([]);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMonitoring();
  }, [loadMonitoring]);

  useEffect(() => {
    setPage(1);
  }, [search, statusFilter, sortKey, sortDir, period]);

  const periodData = { requestCount: '—', errorRate: '—', latency: '—', availability: '—', timeoutCount: '—', cacheHitRate: '—' };

  const filteredServices = useMemo(() => {
    let list = services.map((s) => ({ ...s }));

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter((s) =>
        [s.service, s.component, s.detailsSafe, ...(s.dependencies || [])]
          .some((v) => String(v).toLowerCase().includes(q))
      );
    }

    if (statusFilter !== 'ALL') {
      list = list.filter((s) => s.status === statusFilter);
    }

    list.sort((a, b) => {
      const statusOrder = { HEALTHY: 0, DEGRADED: 1, UNHEALTHY: 2, WARNING: 3, UNKNOWN: 4 };
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
    loadMonitoring();
    // Refresh completion is reported only by the request.
    // toast.success('Monitoring actualisé.');
  };

  const handleResetFilters = () => {
    setSearch('');
    setStatusFilter('ALL');
    setSortKey('service');
    setSortDir('asc');
    setPeriod('24h');
    toast.success('Filtres réinitialisés.');
  };

  const metricClass = (value, good, warn) => {
    return value <= good ? 'text-green-600' : value <= warn ? 'text-amber-600' : 'text-red-600';
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
        <span className="text-slate-900 font-medium">Monitoring</span>
      </nav>

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Monitoring</h1>
        <p className="text-sm text-slate-500 mt-1">Suivi de santé et métriques.</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <span className="text-xs font-medium text-slate-500 uppercase">Requêtes ({period})</span>
          <p className="text-2xl font-bold text-slate-900 mt-1">{formatNumber(periodData.requestCount)}</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <span className="text-xs font-medium text-slate-500 uppercase">Taux d'erreur</span>
          <p className={`text-2xl font-bold mt-1 ${metricClass(periodData.errorRate, 0.5, 1)}`}>{periodData.errorRate}%</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <span className="text-xs font-medium text-slate-500 uppercase">Latence moyenne</span>
          <p className={`text-2xl font-bold mt-1 ${metricClass(periodData.latency, 100, 250)}`}>{periodData.latency} ms</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <span className="text-xs font-medium text-slate-500 uppercase">Timeouts</span>
          <p className={`text-2xl font-bold mt-1 ${metricClass(periodData.timeoutCount, 0, 5)}`}>{formatNumber(periodData.timeoutCount)}</p>
        </div>
      </div>

      <div className="flex items-center gap-3 mb-5 flex-wrap">
        <div className="relative flex-1 min-w-64">
          <input
            type="text"
            placeholder="Rechercher un service ou composant..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-3 py-2 border border-slate-300 rounded-lg text-sm"
          />
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-3 py-1.5 border border-slate-300 rounded-lg text-sm bg-white">
          {statusOptions.map((s) => <option key={s} value={s}>{s === 'ALL' ? 'Tous statuts' : s}</option>)}
        </select>
        <div className="flex gap-1">
          {PERIODS.map((p) => (
            <button
              key={p}
              type="button"
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${period === p ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
              onClick={() => setPeriod(p)}
            >
              {p === '1h' ? '1h' : p === '24h' ? '24h' : p === '7d' ? '7j' : '30j'}
            </button>
          ))}
        </div>
        <button onClick={handleRefresh} disabled={loading} className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 border border-slate-300 rounded-lg">
          <RefreshCw className="w-4 h-4 inline mr-1" />Actualiser
        </button>
        <button onClick={handleResetFilters} className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 border border-slate-300 rounded-lg">Réinitialiser</button>
      </div>

      <div className="overflow-x-auto rounded-lg border border-slate-200">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-slate-700">Service</th>
              <th className="text-left px-4 py-3 font-medium text-slate-700">Statut</th>
              <th className="text-left px-4 py-3 font-medium text-slate-700">Composant</th>
              <th className="text-left px-4 py-3 font-medium text-slate-700">Disponibilité</th>
              <th className="text-left px-4 py-3 font-medium text-slate-700">Requêtes</th>
              <th className="text-left px-4 py-3 font-medium text-slate-700">Erreurs %</th>
              <th className="text-left px-4 py-3 font-medium text-slate-700">Latence ms</th>
              <th className="text-left px-4 py-3 font-medium text-slate-700">Timeouts</th>
              <th className="text-left px-4 py-3 font-medium text-slate-700">Cache Hit</th>
              <th className="text-left px-4 py-3 font-medium text-slate-700">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredServices.length === 0 && (
              <tr><td colSpan={10} className="px-4 py-8 text-center text-slate-500">Aucun service trouvé.</td></tr>
            )}
            {pageItems.map((service) => (
              <tr key={service.service} className="border-b border-slate-100 hover:bg-slate-50">
                <td className="px-4 py-3 font-medium text-slate-900">{service.service}</td>
                <td className="px-4 py-3"><StatusBadge status={service.status} /></td>
                <td className="px-4 py-3 text-slate-600">{service.component}</td>
                <td className="px-4 py-3 text-slate-600">{service.availability}%</td>
                <td className="px-4 py-3 text-slate-600">{formatNumber(service.requestCount)}</td>
                <td className={`px-4 py-3 font-medium ${metricClass(service.errorRate, 0.5, 1)}`}>{service.errorRate}%</td>
                <td className={`px-4 py-3 font-medium ${metricClass(service.latency, 100, 250)}`}>{service.latency}</td>
                <td className={`px-4 py-3 font-medium ${metricClass(service.timeoutCount, 0, 5)}`}>{formatNumber(service.timeoutCount)}</td>
                <td className={`px-4 py-3 font-medium ${metricClass(100 - service.cacheHitRate, 5, 15)}`}>{service.cacheHitRate}%</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1">
                    <button type="button" className="text-blue-600 hover:text-blue-800 text-sm" onClick={() => setDetailService(service)}>Détail</button>
                    <button type="button" className="text-blue-600 hover:text-blue-800 text-sm" title="Voir les logs" onClick={() => navigate('/iam/observability/logs')}>Logs</button>
                    <button type="button" className="text-blue-600 hover:text-blue-800 text-sm" title="Voir les événements" onClick={() => navigate('/iam/observability/security-events')}>Sécurité</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filteredServices.length > 0 && (
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

      {detailService && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center" onClick={() => setDetailService(null)}>
          <div className="bg-white rounded-xl shadow-xl w-full max-2xl mx-4" onClick={(e) => e.stopPropagation()}>
            <div className="p-5 border-b border-slate-200 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900">Détail du service</h2>
              <button onClick={() => setDetailService(null)} className="text-slate-400 hover:text-slate-600 text-xl">×</button>
            </div>
            <div className="p-5 space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div><span className="text-xs font-medium text-slate-500">Service</span><p className="text-sm text-slate-900 mt-0.5">{detailService.service}</p></div>
                <div><span className="text-xs font-medium text-slate-500">Composant</span><p className="text-sm text-slate-900 mt-0.5">{detailService.component}</p></div>
                <div><span className="text-xs font-medium text-slate-500">Statut</span><div className="mt-0.5"><StatusBadge status={detailService.status} /></div></div>
                <div><span className="text-xs font-medium text-slate-500">Vérifié le</span><p className="text-sm text-slate-900 mt-0.5">{detailService.checkedAt}</p></div>
                <div><span className="text-xs font-medium text-slate-500">Latence</span><p className="text-sm text-slate-900 mt-0.5">{detailService.latency} ms</p></div>
                <div><span className="text-xs font-medium text-slate-500">Disponibilité</span><p className="text-sm text-slate-900 mt-0.5">{detailService.availability}%</p></div>
                <div><span className="text-xs font-medium text-slate-500">Taux d'erreur</span><p className="text-sm text-slate-900 mt-0.5">{detailService.errorRate}%</p></div>
                <div><span className="text-xs font-medium text-slate-500">Requêtes</span><p className="text-sm text-slate-900 mt-0.5">{formatNumber(detailService.requestCount)}</p></div>
                <div><span className="text-xs font-medium text-slate-500">Timeouts</span><p className="text-sm text-slate-900 mt-0.5">{formatNumber(detailService.timeoutCount)}</p></div>
                <div><span className="text-xs font-medium text-slate-500">File d'attente</span><p className="text-sm text-slate-900 mt-0.5">{formatNumber(detailService.queueBacklog)}</p></div>
                <div><span className="text-xs font-medium text-slate-500">Cache Hit</span><p className="text-sm text-slate-900 mt-0.5">{detailService.cacheHitRate}%</p></div>
                <div><span className="text-xs font-medium text-slate-500">Dépendances</span><p className="text-sm text-slate-900 mt-0.5">{(detailService.dependencies || []).join(', ')}</p></div>
                <div><span className="text-xs font-medium text-slate-500">Détails</span><p className="text-sm text-slate-900 mt-0.5">{detailService.detailsSafe}</p></div>
              </div>
              <div className="flex gap-2 pt-2">
                <button type="button" className="px-3 py-1.5 border border-slate-300 text-slate-600 rounded-lg text-sm hover:bg-slate-100" onClick={() => navigate('/iam/observability/logs')}>Voir les logs</button>
                <button type="button" className="px-3 py-1.5 border border-slate-300 text-slate-600 rounded-lg text-sm hover:bg-slate-100" onClick={() => navigate('/iam/observability/security-events')}>Voir les événements</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default MonitoringPage;
