import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Activity, AlertCircle, RefreshCw, Search } from 'lucide-react';
import { automationService } from '../services/apiClient.js';
import { mapErrorToAction, mapErrorToMessage } from '../lib/automation/errors.js';
import { formatDate, formatDuration } from '../lib/automation/format.js';

const EXECUTION_STATUSES = [
  'PENDING',
  'RUNNING',
  'SUCCEEDED',
  'FAILED',
  'RETRYING',
  'CANCELLED',
  'TIMEOUT',
  'BLOCKED',
];

const inputClass = 'w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100';

function isRecord(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function getRecords(data) {
  const records = Array.isArray(data) ? data : data?.records;
  if (!Array.isArray(records)) {
    throw new Error('Réponse Automation invalide : historique des exécutions indisponible.');
  }
  return records;
}

function statusClass(status) {
  const styles = {
    SUCCEEDED: 'bg-emerald-50 text-emerald-700',
    FAILED: 'bg-rose-50 text-rose-700',
    TIMEOUT: 'bg-rose-50 text-rose-700',
    RUNNING: 'bg-blue-50 text-blue-700',
    RETRYING: 'bg-amber-50 text-amber-800',
    BLOCKED: 'bg-orange-50 text-orange-800',
    CANCELLED: 'bg-slate-100 text-slate-600',
    PENDING: 'bg-slate-100 text-slate-600',
  };
  return styles[status] || 'bg-slate-100 text-slate-600';
}

function isInPeriod(value, period, now = Date.now()) {
  if (period === 'all') return true;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return false;
  const days = period === 'today' ? 1 : Number(period);
  return now - date.getTime() <= days * 24 * 60 * 60 * 1000 && date.getTime() <= now;
}

function MetricCard({ label, value }) {
  return (
    <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-xs font-semibold text-slate-500">{label}</p>
      <p className="mt-3 text-2xl font-bold text-slate-900">
        {Number.isFinite(value) ? value.toLocaleString('fr-FR') : '—'}
      </p>
    </article>
  );
}

export default function AutomationHistory() {
  const [records, setRecords] = useState([]);
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [workflowFilter, setWorkflowFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [periodFilter, setPeriodFilter] = useState('all');
  const [traceFilter, setTraceFilter] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [historyResponse, metricsResponse] = await Promise.all([
        automationService.history(),
        automationService.metrics(),
      ]);
      if (!isRecord(metricsResponse.data)) {
        throw new Error('Réponse Automation invalide : métriques indisponibles.');
      }
      setRecords(getRecords(historyResponse.data));
      setMetrics(metricsResponse.data);
    } catch (loadError) {
      setError(loadError);
      setRecords([]);
      setMetrics(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const workflowOptions = useMemo(
    () => [...new Set(records.map((record) => record.workflowCode).filter(Boolean))].sort(),
    [records],
  );
  const filteredRecords = useMemo(() => {
    const traceQuery = traceFilter.trim().toLowerCase();
    return records.filter((record) => (
      (!workflowFilter || record.workflowCode === workflowFilter)
      && (!statusFilter || record.status === statusFilter)
      && isInPeriod(record.startedAt, periodFilter)
      && (!traceQuery || String(record.traceId || '').toLowerCase().includes(traceQuery))
    ));
  }, [periodFilter, records, statusFilter, traceFilter, workflowFilter]);

  const metricCards = [
    { label: 'Exécutions', value: metrics?.executionsCount },
    { label: 'Succès', value: metrics?.succeededCount },
    { label: 'Échecs', value: metrics?.failedCount },
    { label: 'Timeouts', value: metrics?.timeoutCount },
  ];

  return (
    <main className="mx-auto w-full max-w-6xl space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-amber-600">Automatisation</p>
          <h1 className="mt-1 text-2xl font-bold text-slate-900">Exécutions</h1>
          <p className="mt-1 text-sm text-slate-500">Historique et suivi des exécutions retournés par le moteur.</p>
        </div>
        <button type="button" onClick={() => void load()} disabled={loading} className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50">
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> Actualiser
        </button>
      </header>

      {error && (
        <div role="alert" className="flex flex-wrap items-start justify-between gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4">
          <div className="flex items-start gap-2 text-sm text-rose-700">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <div><p className="font-semibold">{mapErrorToMessage(error)}</p><p className="mt-1">{mapErrorToAction(error)}</p></div>
          </div>
          <button type="button" onClick={() => void load()} className="rounded-lg bg-rose-700 px-3 py-2 text-xs font-semibold text-white hover:bg-rose-800">Réessayer</button>
        </div>
      )}

      {!error && metrics && (
        <section aria-label="Métriques des exécutions" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {metricCards.map((card) => <MetricCard key={card.label} {...card} />)}
        </section>
      )}

      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-4 py-4 sm:px-5">
          <div className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-amber-600" />
            <h2 className="font-semibold text-slate-900">Historique</h2>
            {!loading && <span className="text-xs text-slate-500">({filteredRecords.length})</span>}
          </div>
          <div className="grid w-full gap-2 sm:grid-cols-2 xl:w-auto xl:grid-cols-4">
            <label className="sr-only" htmlFor="automation-workflow-filter">Filtrer par workflow</label>
            <select id="automation-workflow-filter" className={inputClass} value={workflowFilter} onChange={(event) => setWorkflowFilter(event.target.value)}>
              <option value="">Tous les workflows</option>
              {workflowOptions.map((workflow) => <option key={workflow} value={workflow}>{workflow}</option>)}
            </select>
            <label className="sr-only" htmlFor="automation-status-filter">Filtrer par statut</label>
            <select id="automation-status-filter" className={inputClass} value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
              <option value="">Tous les statuts</option>
              {EXECUTION_STATUSES.map((status) => <option key={status} value={status}>{status}</option>)}
            </select>
            <label className="sr-only" htmlFor="automation-period-filter">Filtrer par période</label>
            <select id="automation-period-filter" className={inputClass} value={periodFilter} onChange={(event) => setPeriodFilter(event.target.value)}>
              <option value="all">Toutes les périodes</option>
              <option value="today">Dernières 24 heures</option>
              <option value="7">7 derniers jours</option>
              <option value="30">30 derniers jours</option>
            </select>
            <label className="relative">
              <span className="sr-only">Filtrer par trace ID</span>
              <Search aria-hidden="true" className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input className={`${inputClass} pl-9`} value={traceFilter} onChange={(event) => setTraceFilter(event.target.value)} placeholder="Trace ID" />
            </label>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px]">
            <thead>
              <tr className="bg-slate-50 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                <th className="px-4 py-3">Exécution</th>
                <th className="px-4 py-3">Workflow</th>
                <th className="px-4 py-3">Déclencheur</th>
                <th className="px-4 py-3">Statut</th>
                <th className="px-4 py-3">Démarrée</th>
                <th className="px-4 py-3">Durée</th>
                <th className="px-4 py-3">Tentative</th>
                <th className="px-4 py-3">Trace ID</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan="8" className="px-4 py-12 text-center text-sm text-slate-500">Chargement des exécutions…</td></tr>
              ) : error ? (
                <tr><td colSpan="8" className="px-4 py-12 text-center text-sm text-slate-500">L’historique n’est pas disponible.</td></tr>
              ) : filteredRecords.length === 0 ? (
                <tr><td colSpan="8" className="px-4 py-12 text-center text-sm text-slate-500">{records.length ? 'Aucune exécution ne correspond aux filtres.' : 'Aucune exécution retournée par le moteur.'}</td></tr>
              ) : filteredRecords.map((record) => (
                <tr key={record.executionId} className="text-sm hover:bg-slate-50/70">
                  <td className="px-4 py-3 font-mono text-xs text-slate-700">{record.executionId || '—'}</td>
                  <td className="px-4 py-3 text-slate-700">{record.workflowCode || '—'}</td>
                  <td className="px-4 py-3 text-slate-600">{record.triggerCode || '—'}</td>
                  <td className="px-4 py-3"><span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ${statusClass(record.status)}`}>{record.status || '—'}</span></td>
                  <td className="px-4 py-3 text-slate-600">{formatDate(record.startedAt)}</td>
                  <td className="px-4 py-3 text-slate-600">{formatDuration(record.duration)}</td>
                  <td className="px-4 py-3 text-slate-600">{Number.isFinite(record.retryCount) ? record.retryCount + 1 : '—'}</td>
                  <td className="px-4 py-3 font-mono text-xs text-slate-600">{record.traceId || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
