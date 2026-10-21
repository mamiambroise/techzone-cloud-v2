import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Activity, AlertTriangle, CheckCircle2, Clock3, RefreshCw, ShieldAlert } from 'lucide-react';
import { iamObservabilityService } from '../../../services/apiClient.js';
import { ModernSpinner } from '../../../components/Loaders.jsx';

const statusClass = { HEALTHY: 'text-green-700 bg-green-50', DEGRADED: 'text-amber-700 bg-amber-50', UNHEALTHY: 'text-red-700 bg-red-50', MAINTENANCE: 'text-blue-700 bg-blue-50', UNKNOWN: 'text-slate-600 bg-slate-100' };
const kpis = [['healthyServices', 'Services sains', CheckCircle2, 'text-green-700'], ['degradedServices', 'Services dégradés', AlertTriangle, 'text-amber-700'], ['activeAlerts', 'Alertes actives', ShieldAlert, 'text-red-700'], ['requestsPerMinute', 'Requêtes / min', Activity, 'text-blue-700'], ['errorRate', 'Taux d’erreur', AlertTriangle, 'text-amber-700'], ['p95LatencyMs', 'Latence P95', Clock3, 'text-violet-700'], ['openIncidents', 'Incidents ouverts', ShieldAlert, 'text-red-700'], ['securityEvents24h', 'Événements sécurité (24 h)', ShieldAlert, 'text-slate-700']];

function display(key, value) {
  if (value === null || value === undefined) return '—';
  if (key === 'errorRate') return `${value} %`;
  if (key === 'p95LatencyMs') return `${value} ms`;
  return new Intl.NumberFormat('fr-FR').format(value);
}

export default function ObservabilityOverview() {
  const [data, setData] = useState(null); const [error, setError] = useState(null); const [loading, setLoading] = useState(true);
  const load = useCallback(async () => { setLoading(true); setError(null); try { setData((await iamObservabilityService.overview()).data); } catch (err) { setError(err.normalized?.message || 'La source d’observabilité est indisponible.'); } finally { setLoading(false); } }, []);
  useEffect(() => { load(); }, [load]);
  if (loading) return <div className="p-8 flex justify-center min-h-[320px]"><ModernSpinner /></div>;
  if (error) return <div className="tz-page p-6"><div role="alert" className="tz-surface p-5 text-red-700">{error}</div></div>;
  const health = data?.health ?? [];
  return <main className="tz-page p-4 sm:p-6 space-y-5">
    <header className="flex items-start justify-between gap-4"><div><h1 className="text-xl font-semibold text-slate-900">Observabilité</h1><p className="text-sm text-slate-500 mt-1">Signaux réellement collectés par la plateforme.</p></div><div className="flex items-center gap-2"><Link to="/observability/settings" className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50">Paramètres</Link><button type="button" aria-label="Actualiser l’observabilité" onClick={load} className="p-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50"><RefreshCw className="w-4 h-4" /></button></div></header>
    <section className="grid grid-cols-2 lg:grid-cols-4 gap-3">{kpis.map(([key, label, Icon, color]) => <article key={key} className="tz-surface p-4"><div className="flex justify-between gap-2"><span className="text-xs uppercase tracking-wide text-slate-500">{label}</span><Icon className={`w-4 h-4 ${color}`} /></div><p className="mt-2 text-2xl font-semibold text-slate-900">{display(key, data?.kpis?.[key])}</p></article>)}</section>
    <section className="tz-surface overflow-hidden"><div className="px-4 py-3 border-b border-slate-200"><h2 className="font-medium text-slate-900">Santé et readiness</h2></div><div className="tz-scroll-x"><table className="w-full text-sm"><thead className="bg-slate-50 text-left text-slate-500"><tr><th className="px-4 py-2">Service</th><th className="px-4 py-2">Santé</th><th className="px-4 py-2">Readiness</th><th className="px-4 py-2">Dernière vérification</th><th className="px-4 py-2">Détail</th></tr></thead><tbody>{health.map((item) => <tr key={item.service} className="border-t border-slate-100"><td className="px-4 py-3 font-medium text-slate-800">{item.service}</td><td className="px-4 py-3"><span className={`rounded-full px-2 py-1 text-xs font-medium ${statusClass[item.status] || statusClass.UNKNOWN}`}>{item.status}</span></td><td className="px-4 py-3 text-slate-600">{item.readiness}</td><td className="px-4 py-3 text-slate-600">{item.checkedAt ? new Date(item.checkedAt).toLocaleString('fr-FR') : 'Non vérifiée'}</td><td className="px-4 py-3 text-slate-600">{item.message}</td></tr>)}{!health.length && <tr><td colSpan="5" className="px-4 py-8 text-center text-slate-500">Aucune vérification disponible.</td></tr>}</tbody></table></div></section>
  </main>;
}
