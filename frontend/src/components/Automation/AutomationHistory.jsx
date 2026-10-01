import React from 'react';
import {
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  CircleStackIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import { automationService } from '../services/apiClient.js';
import { ModernSpinner } from '../components/Loaders.jsx';
import {
  PageHeader,
  Card,
  ErrorBanner,
  StatusBadge,
  useAsync,
  toArray,
  describeError,
  formatDateTime,
  formatNumber,
} from '../components/automation/shared/index.js';

const loadHistory = async () => {
  const [h, m] = await Promise.all([automationService.history(), automationService.metrics()]);
  return { records: toArray(h.data), metrics: m.data };
};

function AutomationHistory() {
  const { data, loading, error, reload } = useAsync(loadHistory);
  const records = data?.records ?? [];
  const metrics = data?.metrics ?? null;

  const metricCards = [
    { label: 'Exécutions', value: metrics?.totalCount ?? metrics?.total, gradient: 'from-blue-500 to-indigo-600', icon: CircleStackIcon },
    { label: 'Succès', value: metrics?.successCount, gradient: 'from-emerald-500 to-teal-600', icon: CheckCircleIcon },
    { label: 'Échecs', value: metrics?.failedCount, gradient: 'from-red-500 to-red-600', icon: XCircleIcon },
    { label: 'Timeouts', value: metrics?.timeoutCount, gradient: 'from-amber-500 to-orange-600', icon: ExclamationTriangleIcon },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Historique Automation"
        subtitle="Suivi des exécutions et métriques du moteur"
        onRefresh={reload}
        refreshing={loading}
      />

      {error && <ErrorBanner message={describeError("Impossible de charger l'historique", error)} onRetry={reload} />}

      {metrics && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {metricCards.map((c) => {
            const Icon = c.icon;
            return (
              <div key={c.label} className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${c.gradient} flex items-center justify-center shadow-md`}>
                    <Icon aria-hidden="true" className="w-5 h-5 text-white" />
                  </div>
                  <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">{c.label}</p>
                </div>
                <p className="text-3xl font-bold text-slate-800 dark:text-slate-100">{formatNumber(c.value)}</p>
              </div>
            );
          })}
        </div>
      )}

      <Card icon={ClockIcon} gradient="from-slate-500 to-slate-600" title="Exécutions" meta={`(${records.length})`} padded={false}>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-700/40 text-slate-500 dark:text-slate-400 uppercase text-xs tracking-wider">
                <th scope="col" className="px-6 py-3 text-left font-semibold">ExecutionId</th>
                <th scope="col" className="px-6 py-3 text-left font-semibold">Workflow</th>
                <th scope="col" className="px-6 py-3 text-left font-semibold">Statut</th>
                <th scope="col" className="px-6 py-3 text-left font-semibold">Version</th>
                <th scope="col" className="px-6 py-3 text-left font-semibold">Début</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
              {loading && records.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center">
                    <ModernSpinner label="Chargement..." />
                  </td>
                </tr>
              ) : records.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center text-slate-500 dark:text-slate-400 text-sm">Aucune exécution</td>
                </tr>
              ) : (
                records.map((r, i) => (
                  <tr key={r.executionId ?? r.id ?? i} className="hover:bg-slate-50/50 dark:hover:bg-slate-700/40 transition-colors">
                    <td className="px-6 py-3 font-mono text-xs text-slate-700 dark:text-slate-200">{r.executionId || r.id || '—'}</td>
                    <td className="px-6 py-3 text-sm text-slate-700 dark:text-slate-200">{r.workflowCode || r.code || '—'}</td>
                    <td className="px-6 py-3"><StatusBadge status={r.status} /></td>
                    <td className="px-6 py-3 text-sm text-slate-500 dark:text-slate-400">{r.version || '—'}</td>
                    <td className="px-6 py-3 text-sm text-slate-500 dark:text-slate-400">{formatDateTime(r.startedAt)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

export default AutomationHistory;
