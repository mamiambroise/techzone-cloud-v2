import React, { useState, useEffect } from 'react';
import {
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  ArrowPathRoundedSquareIcon,
  CircleStackIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import { automationService } from '../services/apiClient.js';
import { ModernSpinner } from '../components/Loaders.jsx';

function AutomationHistory() {
  const [records, setRecords] = useState([]);
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [h, m] = await Promise.all([automationService.history(), automationService.metrics()]);
      setRecords(Array.isArray(h.data) ? h.data : (h.data?.records || []));
      setMetrics(m.data);
    } catch (err) {
      setError('Impossible de charger l\'historique');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const metricCards = [
    { label: 'Exécutions', value: metrics?.totalCount ?? metrics?.total, gradient: 'from-blue-500 to-indigo-600', icon: CircleStackIcon, bg: 'bg-blue-50 dark:bg-blue-900/30', text: 'text-blue-700' },
    { label: 'Succès', value: metrics?.successCount, gradient: 'from-emerald-500 to-teal-600', icon: CheckCircleIcon, bg: 'bg-emerald-50 dark:bg-emerald-900/30', text: 'text-emerald-700' },
    { label: 'Échecs', value: metrics?.failedCount, gradient: 'from-red-500 to-red-600', icon: XCircleIcon, bg: 'bg-red-50 dark:bg-red-900/30', text: 'text-red-700' },
    { label: 'Timeouts', value: metrics?.timeoutCount, gradient: 'from-amber-500 to-orange-600', icon: ExclamationTriangleIcon, bg: 'bg-amber-50 dark:bg-amber-900/30', text: 'text-amber-700' },
  ];

  const badge = (s) => {
    const str = String(s).toUpperCase();
    let cls, dotCls;
    if (str === 'SUCCEEDED' || str === 'SUCCESS') {
      cls = 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300';
      dotCls = 'bg-emerald-500';
    } else if (str.includes('FAIL') || str === 'FAILED') {
      cls = 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300';
      dotCls = 'bg-red-500';
    } else if (str.includes('RUN')) {
      cls = 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300';
      dotCls = 'bg-blue-500';
    } else {
      cls = 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400';
      dotCls = 'bg-slate-400';
    }
    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-full font-medium ${cls}`}>
        <span className={`w-1.5 h-1.5 rounded-full ${dotCls}`} />
        {s}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Historique Automation</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Suivi des exécutions et métriques du moteur</p>
        </div>
        <button onClick={fetchData} className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 rounded-xl hover:bg-blue-100 transition-colors">
          <ArrowPathRoundedSquareIcon className="w-4 h-4" />
          Rafraîchir
        </button>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 rounded-xl p-4 flex items-center gap-3">
          <XCircleIcon className="w-5 h-5 text-red-500 shrink-0" />
          <p className="text-red-600 dark:text-red-400 font-medium text-sm">{error}</p>
        </div>
      )}

      {metrics && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {metricCards.map((c) => {
            const Icon = c.icon;
            return (
              <div key={c.label} className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${c.gradient} flex items-center justify-center shadow-md`}>
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">{c.label}</p>
                </div>
                <p className="text-3xl font-bold text-slate-800 dark:text-slate-100">{(c.value ?? 0).toLocaleString()}</p>
              </div>
            );
          })}
        </div>
      )}

      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
        <div className="flex items-center gap-3 px-6 py-4 border-b border-slate-100 dark:border-slate-700/60">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-slate-500 to-slate-600 flex items-center justify-center shadow-md">
            <ClockIcon className="w-5 h-5 text-white" />
          </div>
          <h3 className="font-semibold text-slate-800 dark:text-slate-100">Exécutions</h3>
          <span className="text-xs text-slate-400 dark:text-slate-500 font-medium ml-1">({records.length})</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-700/40 text-slate-500 dark:text-slate-400 uppercase text-xs tracking-wider">
                <th className="px-6 py-3 text-left font-semibold">ExecutionId</th>
                <th className="px-6 py-3 text-left font-semibold">Workflow</th>
                <th className="px-6 py-3 text-left font-semibold">Statut</th>
                <th className="px-6 py-3 text-left font-semibold">Version</th>
                <th className="px-6 py-3 text-left font-semibold">Début</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
              {loading ? (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center">
                    <ModernSpinner label="Chargement..." />
                  </td>
                </tr>
              ) : records.length === 0 ? (
                <tr><td colSpan="5" className="px-6 py-12 text-center text-slate-400 dark:text-slate-500 text-sm">Aucune exécution</td></tr>
              ) : records.map((r) => (
                <tr key={r.executionId || r.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-700/40 transition-colors">
                  <td className="px-6 py-3 font-mono text-xs text-slate-700 dark:text-slate-200">{r.executionId || r.id}</td>
                  <td className="px-6 py-3 text-sm text-slate-700 dark:text-slate-200">{r.workflowCode || r.code || '—'}</td>
                  <td className="px-6 py-3">{badge(r.status)}</td>
                  <td className="px-6 py-3 text-sm text-slate-500 dark:text-slate-400">{r.version || '—'}</td>
                  <td className="px-6 py-3 text-sm text-slate-500 dark:text-slate-400">{r.startedAt ? new Date(r.startedAt).toLocaleString() : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default AutomationHistory;
