import React, { useCallback, useEffect, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { iamObservabilityService } from '../../../services/apiClient.js';
import { ModernSpinner } from '../../../components/Loaders.jsx';

const definition = {
  'observability-metrics': { title: 'Métriques', load: () => iamObservabilityService.metrics({ rangeMinutes: 60 }), empty: 'Aucune mesure n’a encore été collectée dans cette instance.' },
  'observability-traces': { title: 'Traces', load: () => iamObservabilityService.traces({ limit: 100 }), empty: 'Aucune trace n’a encore été collectée dans cette instance.' },
  'observability-diagnostics': { title: 'Diagnostics', load: () => iamObservabilityService.diagnostics(), empty: 'Aucun diagnostic persistant n’est disponible.' },
  'observability-incidents': { title: 'Incidents', load: () => iamObservabilityService.incidents({ limit: 100 }), empty: 'Aucun incident ouvert ou historique.' },
};

function date(value) { return value ? new Date(value).toLocaleString('fr-FR') : '—'; }

function TraceTable({ items }) {
  return <table className="w-full text-sm"><thead className="bg-slate-50 text-left text-slate-500"><tr><th className="px-4 py-2">Trace ID</th><th className="px-4 py-2">Services</th><th className="px-4 py-2">Événements</th><th className="px-4 py-2">Erreurs</th><th className="px-4 py-2">Durée max.</th><th className="px-4 py-2">Statut</th><th className="px-4 py-2">Dernière activité</th></tr></thead><tbody>{items.map((trace) => <tr key={trace.traceId} className="border-t border-slate-100"><td className="px-4 py-3 font-mono text-xs text-slate-800 break-all">{trace.traceId}</td><td className="px-4 py-3 text-slate-600">{(trace.services || []).join(', ') || '—'}</td><td className="px-4 py-3 text-slate-600">{trace.events}</td><td className="px-4 py-3 text-slate-600">{trace.errors}</td><td className="px-4 py-3 text-slate-600">{trace.durationMs === null || trace.durationMs === undefined ? '—' : `${trace.durationMs} ms`}</td><td className="px-4 py-3"><span className={`rounded-full px-2 py-1 text-xs font-medium ${trace.status === 'ERROR' ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>{trace.status}</span></td><td className="px-4 py-3 text-slate-600">{date(trace.timestamp)}</td></tr>)}</tbody></table>;
}

function GenericTable({ items }) {
  return <table className="w-full text-sm"><thead className="bg-slate-50 text-left text-slate-500"><tr><th className="px-4 py-2">Horodatage</th><th className="px-4 py-2">Signal</th><th className="px-4 py-2">Statut</th><th className="px-4 py-2">Détail</th></tr></thead><tbody>{items.map((item, index) => <tr key={item.id ?? `${item.name ?? item.service}-${index}`} className="border-t border-slate-100"><td className="px-4 py-3 text-slate-600">{date(item.timestamp || item.createdAt || item.checkedAt || item.openedAt)}</td><td className="px-4 py-3 font-medium text-slate-800">{item.name || item.service || item.title || item.component || item.traceId || 'Signal'}</td><td className="px-4 py-3 text-slate-700">{item.status || item.type || '—'}</td><td className="px-4 py-3 text-slate-600 break-all">{item.message || item.summary || item.value || item.traceId || '—'}</td></tr>)}</tbody></table>;
}

export default function ObservabilityDataPage({ pageId }) {
  const config = definition[pageId] ?? definition['observability-metrics'];
  const [data, setData] = useState(null); const [error, setError] = useState(null); const [loading, setLoading] = useState(true);
  const load = useCallback(async () => { setLoading(true); setError(null); try { setData((await config.load()).data); } catch (err) { setError(err.normalized?.message || 'La source est indisponible.'); } finally { setLoading(false); } }, [config]);
  useEffect(() => { load(); }, [load]);
  if (loading) return <div className="p-8 flex justify-center min-h-[320px]"><ModernSpinner /></div>;
  const items = Array.isArray(data) ? data : data?.items ?? data?.diagnostics ?? data?.health ?? [];
  return <main className="tz-page p-4 sm:p-6 space-y-5"><header className="flex justify-between gap-3"><div><h1 className="text-xl font-semibold text-slate-900">{config.title}</h1><p className="text-sm text-slate-500 mt-1">Données issues des sources opérationnelles disponibles.</p></div><button type="button" aria-label="Actualiser" onClick={load} className="p-2 border border-slate-200 rounded-lg"><RefreshCw className="w-4 h-4" /></button></header>{error ? <div role="alert" className="tz-surface p-5 text-red-700">{error}</div> : !items.length ? <div className="tz-surface p-8 text-center text-slate-500">{config.empty}</div> : <section className="tz-surface overflow-hidden"><div className="tz-scroll-x">{pageId === 'observability-traces' ? <TraceTable items={items} /> : <GenericTable items={items} />}</div></section>}</main>;
}
