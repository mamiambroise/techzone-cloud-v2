import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { AlertCircle, ArrowUpRight, CircleCheck, Clock3, RefreshCw } from 'lucide-react';
import { Link } from 'react-router-dom';
import { automationClient } from '../api/automation/client.ts';
import { mapErrorToAction, mapErrorToMessage } from '../lib/automation/errors.js';
import { formatDuration } from '../lib/automation/format.js';

const STATUSES = [
  { key: 'SUCCEEDED', label: 'Succès', color: '#059669' },
  { key: 'FAILED', label: 'Échecs', color: '#e11d48' },
  { key: 'RUNNING', label: 'En cours', color: '#2563eb' },
  { key: 'RETRYING', label: 'En reprise', color: '#d97706' },
  { key: 'TIMEOUT', label: 'Timeouts', color: '#7c3aed' },
  { key: 'CANCELLED', label: 'Annulées', color: '#64748b' },
  { key: 'BLOCKED', label: 'Bloquées', color: '#be123c' },
];

function finiteNumber(value) {
  return Number.isFinite(value) ? value : null;
}

function localDayKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function buildSeries(records, now = new Date()) {
  const days = Array.from({ length: 7 }, (_, offset) => {
    const date = new Date(now);
    date.setDate(now.getDate() - (6 - offset));
    return { key: localDayKey(date), label: new Intl.DateTimeFormat('fr-FR', { weekday: 'short' }).format(date), value: 0 };
  });
  const byDate = new Map(days.map((day) => [day.key, day]));
  records.forEach((record) => {
    const date = new Date(record.startedAt);
    if (Number.isNaN(date.getTime())) return;
    const day = byDate.get(localDayKey(date));
    if (day) day.value += 1;
  });
  return days;
}

function hasNoActivity(cockpit, metrics) {
  const totals = [
    finiteNumber(cockpit.rules?.total),
    finiteNumber(cockpit.workflows?.total),
    finiteNumber(cockpit.triggers?.total),
    finiteNumber(metrics.executionsCount ?? metrics.totalCount ?? metrics.total),
  ];
  return totals.every((value) => value === 0);
}

function Skeleton() {
  return (
    <div role="status" aria-label="Chargement du cockpit" className="space-y-6">
      <div className="h-20 animate-pulse rounded-xl bg-white" />
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">{Array.from({ length: 10 }, (_, i) => <div key={i} className="h-28 animate-pulse rounded-xl bg-white" />)}</div>
      <div className="grid gap-4 lg:grid-cols-2"><div className="h-64 animate-pulse rounded-xl bg-white" /><div className="h-64 animate-pulse rounded-xl bg-white" /></div>
    </div>
  );
}

function ActivityChart({ records }) {
  const series = useMemo(() => buildSeries(records), [records]);
  const max = Math.max(1, ...series.map((point) => point.value));
  const points = series.map((point, index) => `${40 + index * 83},${172 - (point.value / max) * 130}`).join(' ');

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5">
      <div className="flex items-start justify-between gap-3">
        <div><h2 className="font-semibold text-slate-900">Exécutions dans le temps</h2><p className="mt-1 text-xs text-slate-500">7 derniers jours · historique retourné par l’API</p></div>
        <Clock3 className="h-5 w-5 text-amber-600" />
      </div>
      {records.length === 0 ? (
        <p className="mt-10 text-center text-sm text-slate-500">Aucune exécution à représenter.</p>
      ) : (
        <div className="mt-5">
          <svg role="img" aria-label="Nombre d’exécutions par jour sur les sept derniers jours" viewBox="0 0 540 210" className="h-48 w-full">
            <line x1="32" y1="172" x2="520" y2="172" stroke="#e2e8f0" />
            <line x1="32" y1="107" x2="520" y2="107" stroke="#f1f5f9" />
            <line x1="32" y1="42" x2="520" y2="42" stroke="#f1f5f9" />
            <polyline points={points} fill="none" stroke="#d97706" strokeWidth="3" strokeLinejoin="round" strokeLinecap="round" />
            {series.map((point, index) => {
              const x = 40 + index * 83;
              const y = 172 - (point.value / max) * 130;
              return <g key={point.key}><circle cx={x} cy={y} r="4" fill="#d97706" /><text x={x} y="198" textAnchor="middle" fill="#64748b" fontSize="11">{point.label}</text></g>;
            })}
          </svg>
        </div>
      )}
    </section>
  );
}

function StatusChart({ records }) {
  const counts = STATUSES.map((status) => ({ ...status, value: records.filter((record) => record.status === status.key).length }));
  const total = counts.reduce((sum, status) => sum + status.value, 0);
  let offset = 0;
  const gradient = counts.filter((status) => status.value > 0).map((status) => {
    const start = offset;
    offset += (status.value / total) * 100;
    return `${status.color} ${start}% ${offset}%`;
  }).join(', ');

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5">
      <div className="flex items-start justify-between gap-3">
        <div><h2 className="font-semibold text-slate-900">Répartition des statuts</h2><p className="mt-1 text-xs text-slate-500">Calculée depuis l’historique reçu</p></div>
        <CircleCheck className="h-5 w-5 text-amber-600" />
      </div>
      {total === 0 ? (
        <p className="mt-10 text-center text-sm text-slate-500">Aucune exécution à répartir.</p>
      ) : (
        <div className="mt-5 flex flex-wrap items-center justify-center gap-8">
          <div role="img" aria-label={`Répartition des statuts pour ${total} exécutions`} className="flex h-36 w-36 items-center justify-center rounded-full" style={{ background: `conic-gradient(${gradient})` }}>
            <div className="flex h-24 w-24 flex-col items-center justify-center rounded-full bg-white"><strong className="text-2xl text-slate-900">{total}</strong><span className="text-[10px] text-slate-500">exécutions</span></div>
          </div>
          <ul className="grid grid-cols-2 gap-x-5 gap-y-2 text-xs">
            {counts.filter((status) => status.value > 0).map((status) => <li key={status.key} className="flex items-center gap-2 text-slate-600"><span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: status.color }} />{status.label}<strong className="text-slate-900">{status.value}</strong></li>)}
          </ul>
        </div>
      )}
    </section>
  );
}

export default function AutomationCockpit() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [cockpitResponse, historyResponse, metricsResponse] = await Promise.all([
        automationClient.cockpit(),
        automationClient.history(),
        automationClient.metrics(),
      ]);
      const history = Array.isArray(historyResponse.data) ? historyResponse.data : historyResponse.data?.records;
      if (!cockpitResponse.data || !Array.isArray(history) || !metricsResponse.data) {
        throw new Error('Réponse Automation incomplète : cockpit, historique ou métriques indisponibles.');
      }
      setData({ cockpit: cockpitResponse.data, records: history, metrics: metricsResponse.data });
    } catch (loadError) {
      setError(loadError);
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  if (loading) return <Skeleton />;

  if (error) {
    return (
      <main className="mx-auto w-full max-w-6xl space-y-5">
        <PageHeading onRefresh={load} loading={loading} />
        <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-5">
          <div className="flex items-start gap-3">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-rose-600" />
            <div><p className="font-semibold text-rose-800">{mapErrorToMessage(error)}</p><p className="mt-1 text-sm text-rose-700">{mapErrorToAction(error)}</p></div>
          </div>
          <button type="button" onClick={() => void load()} className="mt-4 rounded-lg bg-rose-700 px-3 py-2 text-sm font-semibold text-white hover:bg-rose-800">Réessayer</button>
        </div>
      </main>
    );
  }

  const { cockpit, records, metrics } = data;
  if (hasNoActivity(cockpit, metrics)) {
    return (
      <main className="mx-auto w-full max-w-6xl space-y-5">
        <PageHeading onRefresh={load} loading={loading} />
        <section className="rounded-xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center">
          <CircleCheck className="mx-auto h-9 w-9 text-slate-400" />
          <h2 className="mt-3 font-semibold text-slate-900">Aucune donnée Automation disponible</h2>
          <p className="mx-auto mt-1 max-w-lg text-sm text-slate-500">Le moteur n’a retourné ni règle, workflow, déclencheur ni exécution. Les indicateurs apparaîtront à réception de données réelles.</p>
          <Link to="/automation/workflows" className="mt-5 inline-flex items-center gap-2 rounded-lg bg-amber-600 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-700">Créer un workflow <ArrowUpRight className="h-4 w-4" /></Link>
        </section>
      </main>
    );
  }

  const todayKey = localDayKey(new Date());
  const today = records.filter((record) => {
    const date = new Date(record.startedAt);
    return !Number.isNaN(date.getTime()) && localDayKey(date) === todayKey;
  }).length;
  const retrying = records.filter((record) => record.status === 'RETRYING').length;
  const cards = [
    { label: 'Rules Active', value: finiteNumber(cockpit.rules?.active) },
    { label: 'Workflows Active', value: finiteNumber(cockpit.workflows?.active) },
    { label: 'Triggers Active', value: finiteNumber(cockpit.triggers?.enabled) },
    { label: 'Executions Today', value: today, detail: 'parmi les enregistrements retournés' },
    { label: 'Success', value: finiteNumber(metrics.succeededCount) },
    { label: 'Failed', value: finiteNumber(metrics.failedCount) },
    { label: 'Running', value: finiteNumber(metrics.runningCount) },
    { label: 'Retrying', value: retrying, detail: 'statuts présents dans l’historique' },
    { label: 'Average Duration', value: finiteNumber(metrics.averageDuration), format: formatDuration },
    { label: 'Attention Required', value: finiteNumber(cockpit.attention) },
  ];

  return (
    <main className="mx-auto w-full max-w-6xl space-y-6">
      <PageHeading onRefresh={load} loading={loading} />
      <section aria-label="Indicateurs Automation" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {cards.map((card) => (
          <article key={card.label} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-semibold text-slate-500">{card.label}</p>
            <p className="mt-3 text-2xl font-bold text-slate-900">{card.value === null ? '—' : card.format ? card.format(card.value) : card.value.toLocaleString('fr-FR')}</p>
            {card.detail && <p className="mt-1 text-[10px] leading-relaxed text-slate-400">{card.detail}</p>}
          </article>
        ))}
      </section>
      <div className="grid gap-4 lg:grid-cols-2">
        <ActivityChart records={records} />
        <StatusChart records={records} />
      </div>
    </main>
  );
}

function PageHeading({ onRefresh, loading }) {
  return (
    <header className="flex flex-wrap items-start justify-between gap-4">
      <div><p className="text-xs font-bold uppercase tracking-wider text-amber-700">Espace Automation</p><h1 className="mt-1 text-2xl font-bold text-slate-900">Vue d’ensemble</h1><p className="mt-1 text-sm text-slate-500">Indicateurs issus du moteur et de son historique disponible.</p></div>
      <button type="button" onClick={() => void onRefresh()} disabled={loading} className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50">
        <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> Actualiser
      </button>
    </header>
  );
}
