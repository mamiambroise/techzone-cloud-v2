import React, { useEffect, useState } from 'react';
import {
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  CircleStackIcon,
  ExclamationTriangleIcon,
  DocumentMagnifyingGlassIcon,
} from '@heroicons/react/24/outline';
import { automationService } from '../services/apiClient.js';
import { ModernSpinner } from '../components/Loaders.jsx';
import {
  PageHeader,
  Card,
  CloseButton,
  ErrorBanner,
  StatusBadge,
  useAsync,
  toArray,
  describeError,
  formatDateTime,
  formatDuration,
  formatNumber,
} from '../components/automation/shared/index.js';

const PAGE_SIZE = 20;
const STATUS_OPTIONS = ['SUCCEEDED', 'FAILED', 'TIMEOUT', 'RUNNING'];
const EMPTY_FILTERS = { q: '', status: '', workflowCode: '' };

const compact = (obj) => Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== '' && v != null));

// Accepte { items, total } (backend actuel) ou un simple tableau (ancien format).
function normalizePage(data) {
  const items = toArray(data);
  const total = Number.isFinite(data?.total) ? data.total : items.length;
  return { items, total };
}

const inputClass =
  'w-full border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-slate-50 dark:bg-slate-700/40 text-slate-700 dark:text-slate-200';

function DetailRow({ label, children }) {
  return (
    <div className="flex justify-between gap-4 py-2 text-sm">
      <dt className="text-slate-500 dark:text-slate-400 shrink-0">{label}</dt>
      <dd className="text-right font-medium text-slate-800 dark:text-slate-100 break-all">{children}</dd>
    </div>
  );
}

function ExecutionDetail({ detail, loading, error, onRetry, onClose }) {
  const record = detail?.record;
  const timeline = toArray(detail?.timeline);
  return (
    <Card
      icon={DocumentMagnifyingGlassIcon}
      gradient="from-slate-500 to-slate-600"
      title="Détail de l'exécution"
      action={<CloseButton onClick={onClose} />}
      className="xl:col-span-1 h-fit"
    >
      {loading ? (
        <ModernSpinner label="Chargement..." />
      ) : error ? (
        <ErrorBanner message={describeError("Impossible de charger l'exécution", error)} onRetry={onRetry} />
      ) : record ? (
        <>
          <dl className="divide-y divide-slate-100 dark:divide-slate-700/60">
            <DetailRow label="Exécution"><span className="font-mono text-xs">{record.executionId}</span></DetailRow>
            <DetailRow label="Trace ID"><span className="font-mono text-xs">{record.traceId || '—'}</span></DetailRow>
            <DetailRow label="Statut"><StatusBadge status={record.status} /></DetailRow>
            <DetailRow label="Workflow">{record.workflowCode || '—'}</DetailRow>
            {record.ruleCode && <DetailRow label="Règle">{record.ruleCode}</DetailRow>}
            {record.triggerCode && <DetailRow label="Trigger">{record.triggerCode}</DetailRow>}
            <DetailRow label="Version">{record.version || '—'}</DetailRow>
            <DetailRow label="Début">{formatDateTime(record.startedAt)}</DetailRow>
            <DetailRow label="Fin">{formatDateTime(record.finishedAt)}</DetailRow>
            <DetailRow label="Durée">{formatDuration(record.duration)}</DetailRow>
            <DetailRow label="Tentatives">{record.retryCount ?? 0}</DetailRow>
            {record.errorCode && (
              <DetailRow label="Code d'erreur"><span className="font-mono text-xs text-red-600 dark:text-red-400">{record.errorCode}</span></DetailRow>
            )}
          </dl>

          {timeline.length > 0 && (
            <div className="mt-5">
              <h3 className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2">Chronologie</h3>
              <ol className="space-y-2">
                {timeline.map((t, i) => (
                  <li key={`${t.event}-${i}`} className="flex items-center justify-between gap-3 text-xs">
                    <span className="font-mono text-slate-700 dark:text-slate-200">{t.event}</span>
                    <span className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                      {formatDateTime(t.timestamp)}
                      {t.status && <StatusBadge status={t.status} />}
                    </span>
                  </li>
                ))}
              </ol>
            </div>
          )}
        </>
      ) : null}
    </Card>
  );
}

function AutomationHistory() {
  const [page, setPage] = useState(1);
  const [draft, setDraft] = useState(EMPTY_FILTERS);
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [selectedId, setSelectedId] = useState(null);

  const list = useAsync(
    async () => {
      const res = await automationService.history(compact({ ...filters, page, pageSize: PAGE_SIZE }));
      return normalizePage(res.data);
    },
    { immediate: false },
  );
  const metricsReq = useAsync(async () => (await automationService.metrics()).data);
  const detail = useAsync(async () => (await automationService.historyDetail(selectedId)).data, { immediate: false });

  useEffect(() => {
    list.reload();
  }, [list.reload, page, filters]);

  useEffect(() => {
    if (selectedId) detail.reload();
  }, [detail.reload, selectedId]);

  const records = list.data?.items ?? [];
  const total = list.data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const firstLoad = !list.data && !list.error;
  const metrics = metricsReq.data ?? null;

  const applyFilters = (next) => {
    setFilters(next);
    setPage(1);
    setSelectedId(null);
  };

  const refresh = () => {
    list.reload();
    metricsReq.reload();
    if (selectedId) detail.reload();
  };

  const metricCards = [
    { label: 'Exécutions', value: metrics?.executionsCount ?? metrics?.totalCount ?? metrics?.total, gradient: 'from-blue-500 to-indigo-600', icon: CircleStackIcon },
    { label: 'Succès', value: metrics?.succeededCount ?? metrics?.successCount, gradient: 'from-emerald-500 to-teal-600', icon: CheckCircleIcon },
    { label: 'Échecs', value: metrics?.failedCount, gradient: 'from-red-500 to-red-600', icon: XCircleIcon },
    { label: 'Timeouts', value: metrics?.timeoutCount, gradient: 'from-amber-500 to-orange-600', icon: ExclamationTriangleIcon },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Historique Automation"
        subtitle="Suivi des exécutions et métriques du moteur"
        onRefresh={refresh}
        refreshing={list.loading || metricsReq.loading}
      />

      {list.error && <ErrorBanner message={describeError("Impossible de charger l'historique", list.error)} onRetry={list.reload} />}

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

      <form
        role="search"
        aria-label="Filtrer les exécutions"
        onSubmit={(e) => {
          e.preventDefault();
          applyFilters({ ...draft, q: draft.q.trim(), workflowCode: draft.workflowCode.trim() });
        }}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 items-end"
      >
        <div className="lg:col-span-2">
          <label htmlFor="hist-q" className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5">
            Recherche (exécution, trace, workflow)
          </label>
          <input id="hist-q" type="search" value={draft.q} onChange={(e) => setDraft({ ...draft, q: e.target.value })} className={inputClass} />
        </div>
        <div>
          <label htmlFor="hist-workflow" className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5">
            Code workflow
          </label>
          <input id="hist-workflow" value={draft.workflowCode} onChange={(e) => setDraft({ ...draft, workflowCode: e.target.value })} className={inputClass} />
        </div>
        <div>
          <label htmlFor="hist-status" className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5">
            Statut
          </label>
          <select
            id="hist-status"
            value={draft.status}
            onChange={(e) => {
              const next = { ...draft, status: e.target.value };
              setDraft(next);
              applyFilters(next);
            }}
            className={inputClass}
          >
            <option value="">Tous</option>
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
        <div className="flex gap-2">
          <button type="submit" className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-xl hover:bg-blue-700 font-medium text-sm transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600">
            Filtrer
          </button>
          <button
            type="button"
            onClick={() => {
              setDraft(EMPTY_FILTERS);
              applyFilters(EMPTY_FILTERS);
            }}
            className="px-3 py-2 rounded-xl text-sm font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors focus-visible:outline-2 focus-visible:outline-blue-600"
          >
            Effacer
          </button>
        </div>
      </form>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <Card
          icon={ClockIcon}
          gradient="from-slate-500 to-slate-600"
          title="Exécutions"
          meta={`${formatNumber(total)} résultat(s)`}
          padded={false}
          className={selectedId ? 'xl:col-span-2' : 'xl:col-span-3'}
        >
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-700/40 text-slate-500 dark:text-slate-400 uppercase text-xs tracking-wider">
                  <th scope="col" className="px-6 py-3 text-left font-semibold">Exécution</th>
                  <th scope="col" className="px-6 py-3 text-left font-semibold">Workflow</th>
                  <th scope="col" className="px-6 py-3 text-left font-semibold">Statut</th>
                  <th scope="col" className="px-6 py-3 text-left font-semibold">Durée</th>
                  <th scope="col" className="px-6 py-3 text-left font-semibold">Début</th>
                  <th scope="col" className="px-6 py-3 text-left font-semibold"><span className="sr-only">Actions</span></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
                {(firstLoad || (list.loading && records.length === 0)) ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-12 text-center"><ModernSpinner label="Chargement..." /></td>
                  </tr>
                ) : records.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-12 text-center text-slate-500 dark:text-slate-400 text-sm">Aucune exécution</td>
                  </tr>
                ) : (
                  records.map((r, i) => {
                    const id = r.executionId ?? r.id;
                    return (
                      <tr key={id ?? i} className={`hover:bg-slate-50/50 dark:hover:bg-slate-700/40 transition-colors ${selectedId && selectedId === id ? 'bg-blue-50/60 dark:bg-blue-900/20' : ''}`}>
                        <td className="px-6 py-3 font-mono text-xs text-slate-700 dark:text-slate-200">{id || '—'}</td>
                        <td className="px-6 py-3 text-sm text-slate-700 dark:text-slate-200">{r.workflowCode || r.ruleCode || r.triggerCode || '—'}</td>
                        <td className="px-6 py-3"><StatusBadge status={r.status} /></td>
                        <td className="px-6 py-3 text-sm text-slate-500 dark:text-slate-400">{formatDuration(r.duration)}</td>
                        <td className="px-6 py-3 text-sm text-slate-500 dark:text-slate-400">{formatDateTime(r.startedAt)}</td>
                        <td className="px-6 py-3 text-right">
                          <button
                            type="button"
                            disabled={!id}
                            aria-pressed={selectedId === id}
                            onClick={() => setSelectedId(id)}
                            className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-blue-600 rounded"
                          >
                            Détails
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          <nav aria-label="Pagination" className="flex items-center justify-between gap-3 px-6 py-3 border-t border-slate-100 dark:border-slate-700/60 text-sm">
            <span className="text-slate-500 dark:text-slate-400">Page {page} / {totalPages}</span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1 || list.loading}
                className="px-3 py-1.5 rounded-lg font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Précédent
              </button>
              <button
                type="button"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages || list.loading}
                className="px-3 py-1.5 rounded-lg font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Suivant
              </button>
            </div>
          </nav>
        </Card>

        {selectedId && (
          <ExecutionDetail
            detail={detail.data}
            loading={detail.loading}
            error={detail.error}
            onRetry={detail.reload}
            onClose={() => setSelectedId(null)}
          />
        )}
      </div>
    </div>
  );
}

export default AutomationHistory;
