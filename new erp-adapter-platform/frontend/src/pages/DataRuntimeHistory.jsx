import React, { useState, useEffect } from 'react';
import { dataRuntimeService } from '../services/api';
import { ModernSpinner } from '../components/Loaders';
import {
  ClockIcon,
  ArrowPathIcon,
  DocumentTextIcon,
  CheckBadgeIcon,
  ExclamationTriangleIcon,
  CircleStackIcon,
} from '@heroicons/react/24/outline';

function DataRuntimeHistory() {
  const [records, setRecords] = useState([]);
  const [metrics, setMetrics] = useState(null);
  const [traceId, setTraceId] = useState('');
  const [traceDetail, setTraceDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [h, m] = await Promise.all([
        dataRuntimeService.history(),
        dataRuntimeService.metrics(),
      ]);
      setRecords(h.data);
      setMetrics(m.data);
    } catch (err) {
      setError('Impossible de charger l\'historique');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const viewTrace = async (id) => {
    if (!id) return;
    try {
      const res = await dataRuntimeService.historyByTrace(id);
      setTraceId(id);
      setTraceDetail(res.data);
    } catch (err) {
      alert('Introuvable');
    }
  };

  const metricCards = metrics ? [
    { label: 'Opérations', value: metrics.totalOperations ?? metrics.total ?? 0, icon: CircleStackIcon, gradient: 'from-blue-500 to-indigo-600' },
    { label: 'Réussies', value: metrics.successCount ?? metrics.total, icon: CheckBadgeIcon, gradient: 'from-emerald-500 to-teal-600' },
    { label: 'Échecs', value: metrics.failureCount ?? 0, icon: ExclamationTriangleIcon, gradient: 'from-red-500 to-rose-600' },
    { label: 'Temps moy. (ms)', value: metrics.avgDurationMs ?? metrics.averageDuration ?? 0, icon: ClockIcon, gradient: 'from-violet-500 to-purple-600' },
  ] : [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Historique Data Runtime</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Journal des opérations et métriques de performance</p>
        </div>
        <button
          onClick={fetchData}
          className="inline-flex items-center gap-1.5 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 font-medium"
        >
          <ArrowPathIcon className="w-4 h-4" />
          Rafraîchir
        </button>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 rounded-xl p-4 flex items-center gap-3">
          <ExclamationTriangleIcon className="w-5 h-5 text-red-500 shrink-0" />
          <p className="text-red-600 dark:text-red-400 font-medium">{error}</p>
        </div>
      )}

      {metrics && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {metricCards.map((c, idx) => {
            const Icon = c.icon;
            return (
              <div key={c.label} className={`bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-5`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-500 dark:text-slate-400">{c.label}</p>
                    <p className="text-3xl font-bold text-slate-800 dark:text-slate-100 mt-2">{typeof c.value === 'number' ? c.value.toLocaleString() : c.value}</p>
                  </div>
                  <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${c.gradient} flex items-center justify-center shadow-md shrink-0`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700/60 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-md">
            <DocumentTextIcon className="w-5 h-5 text-white" />
          </div>
          <h3 className="font-semibold text-slate-800 dark:text-slate-100">Opérations récentes</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 dark:bg-slate-700/40 text-slate-500 dark:text-slate-400 uppercase text-xs tracking-wider">
              <tr>
                <th className="px-4 py-2 text-left font-semibold">TraceId</th>
                <th className="px-4 py-2 text-left font-semibold">Ressource</th>
                <th className="px-4 py-2 text-left font-semibold">Opération</th>
                <th className="px-4 py-2 text-left font-semibold">Statut</th>
                <th className="px-4 py-2 text-left font-semibold">Durée</th>
                <th className="px-4 py-2 text-left font-semibold">Date</th>
                <th className="px-4 py-2 text-left font-semibold">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
              {loading ? (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center">
                    <ModernSpinner label="Chargement..." />
                  </td>
                </tr>
              ) : records.length === 0 ? (
                <tr><td colSpan="7" className="px-6 py-12 text-center text-slate-500 dark:text-slate-400">Aucune opération</td></tr>
              ) : records.map((r) => (
                <tr key={r.traceId || r.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-700/40">
                  <td className="px-4 py-3 font-mono text-xs text-slate-700 dark:text-slate-200">{r.traceId}</td>
                  <td className="px-4 py-3 text-sm text-slate-700 dark:text-slate-200">{r.resource}</td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-1 text-xs rounded-full bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-medium">{r.operation}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 text-xs rounded-full font-medium ${
                      String(r.status).toUpperCase() === 'SUCCEEDED' || r.status === 'SUCCESS'
                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
                        : String(r.status).toUpperCase().includes('FAIL')
                        ? 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300'
                        : 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300'
                    }`}>{r.status}</span>
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-700 dark:text-slate-200">{r.durationMs ?? r.duration ?? '—'}</td>
                  <td className="px-4 py-3 text-sm text-slate-500 dark:text-slate-400">{r.startedAt ? new Date(r.startedAt).toLocaleString() : '—'}</td>
                  <td className="px-4 py-3">
                    {r.traceId && (
                      <button onClick={() => viewTrace(r.traceId)} className="text-blue-600 dark:text-blue-400 hover:text-blue-800 font-medium text-sm">
                        Voir
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {traceDetail && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700/60 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-md">
                <DocumentTextIcon className="w-5 h-5 text-white" />
              </div>
              <h3 className="font-semibold text-slate-800 dark:text-slate-100">Trace {traceId}</h3>
            </div>
            <button onClick={() => setTraceDetail(null)} className="text-sm text-slate-500 dark:text-slate-400 hover:text-slate-700 font-medium">
              Fermer
            </button>
          </div>
          <div className="p-6">
            <pre className="bg-slate-900 text-green-400 rounded-lg p-4 text-xs overflow-x-auto max-h-96">
              {JSON.stringify(traceDetail, null, 2)}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}

export default DataRuntimeHistory;
