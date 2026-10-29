import React, { useEffect, useMemo, useState } from 'react';
import { dataRuntimeService } from '../services/apiClient.js';
import { ModernSpinner } from '../components/Loaders.jsx';
import { ArrowPathIcon, CheckCircleIcon, CircleStackIcon, ShieldCheckIcon, WrenchScrewdriverIcon, ChevronRightIcon, LockClosedIcon } from '@heroicons/react/24/outline';
import { SourceDetailTabs } from '../features/data-runtime/components/SourceDetailTabs.jsx';
import { AddDataSourceForm } from '../features/data-runtime/components/AddDataSourceForm.jsx';
import { RepositoryRegistry } from '../features/data-runtime/components/RepositoryRegistry.jsx';
import { FieldAccessScreen, RowPolicyScreen } from '../features/data-runtime/components/GovernanceScreens.jsx';
import { RuntimeContextCard, DataAccessBlocked, TransactionalDiagnostics } from '../features/data-runtime/components/RuntimeDiagnostics.jsx';

const views = {
  sources: { title: 'Sources de données', description: 'Les ressources exposées au tenant courant.' },
  contrats: { title: 'Modèles & contrats', description: 'Le contrat qui relie Business Manager aux providers.' },
  politiques: { title: 'Politiques', description: 'Les opérations autorisées par ressource et par capability.' },
  diagnostics: { title: 'Diagnostics', description: 'Santé, performance et événements du runtime.' },
};

function StatusPill({ children, tone = 'neutral' }) {
  const colors = { good: 'bg-emerald-50 text-emerald-700', warn: 'bg-amber-50 text-amber-700', neutral: 'bg-slate-100 text-slate-600' };
  return <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${colors[tone]}`}>{children}</span>;
}

function DataRuntimeGovernance() {
  const key = window.location.pathname.split('/').filter(Boolean).pop() || 'sources';
  const view = views[key] || views.sources;
  const [contract, setContract] = useState(null);
  const [resources, setResources] = useState([]);
  const [metrics, setMetrics] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedResource, setSelectedResource] = useState(null);
  const [showAddSource, setShowAddSource] = useState(false);
  const [sourceNotice, setSourceNotice] = useState(null);

  const load = () => {
    setLoading(true); setError(null);
    Promise.allSettled([dataRuntimeService.contract(), dataRuntimeService.resources(), dataRuntimeService.metrics(), dataRuntimeService.history()])
      .then(([contractResult, resourcesResult, metricsResult, historyResult]) => {
        if (contractResult.status === 'fulfilled') setContract(contractResult.value.data);
        if (resourcesResult.status === 'fulfilled') setResources(Array.isArray(resourcesResult.value.data) ? resourcesResult.value.data : []);
        if (metricsResult.status === 'fulfilled') setMetrics(metricsResult.value.data);
        if (historyResult.status === 'fulfilled') setHistory(Array.isArray(historyResult.value.data) ? historyResult.value.data : []);
        if ([contractResult, resourcesResult, metricsResult, historyResult].every((item) => item.status === 'rejected')) setError('Le catalogue Data Runtime est indisponible. Vérifiez votre session et le backend.');
      }).finally(() => setLoading(false));
  };
  useEffect(load, []);
  const operations = useMemo(() => resources.reduce((total, item) => total + (item.operations?.length || 0), 0), [resources]);
  if (loading) return <ModernSpinner label="Chargement du catalogue Data Platform…" />;

  return <main className="tz-page space-y-6">
    <header className="tz-data-hero px-6 py-6 text-white sm:px-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div><p className="tz-data-kicker">Données & intégrations</p><h1 className="mt-2 text-3xl font-semibold tracking-tight">{view.title}</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">{view.description}</p></div>
        <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-slate-300"><LockClosedIcon className="h-4 w-4 text-cyan-300" /> Tenant isolé · résolution serveur</div>
      </div>
    </header>
    <nav className="tz-surface flex flex-wrap items-center gap-2 p-2" aria-label="Navigation Data Runtime">
      {[['sources','Sources'],['contrats','Modèles & contrats'],['politiques','Politiques'],['diagnostics','Diagnostics']].map(([id,label]) => <a key={id} href={`/data-runtime/${id}`} className={`inline-flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-semibold transition ${key === id ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:bg-cyan-50 hover:text-cyan-700'}`}>{label}{key === id && <ChevronRightIcon className="h-4 w-4" />}</a>)}
    </nav>

    {error && <div className="tz-surface border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700" role="alert">{error}</div>}
    <section className="grid gap-3 sm:grid-cols-3"><article className="tz-surface p-4"><p className="text-xs font-semibold text-slate-500">Ressources</p><p className="mt-2 text-2xl font-semibold text-slate-950">{resources.length}</p><StatusPill tone="good"><CheckCircleIcon className="h-3.5 w-3.5" /> Catalogue chargé</StatusPill></article><article className="tz-surface p-4"><p className="text-xs font-semibold text-slate-500">Opérations déclarées</p><p className="mt-2 text-2xl font-semibold text-slate-950">{operations}</p><StatusPill><CircleStackIcon className="h-3.5 w-3.5" /> Contrat canonique</StatusPill></article><article className="tz-surface p-4"><p className="text-xs font-semibold text-slate-500">Exécutions suivies</p><p className="mt-2 text-2xl font-semibold text-slate-950">{metrics?.executionCount ?? metrics?.totalOperations ?? '—'}</p><StatusPill tone={metrics ? 'good' : 'warn'}><ShieldCheckIcon className="h-3.5 w-3.5" /> Tenant courant</StatusPill></article></section>
    {key === 'sources' && <><section className="tz-surface overflow-hidden"><div className="flex items-center justify-between border-b border-slate-100 px-5 py-4"><div><h2 className="font-semibold text-slate-950">Ressources disponibles</h2><p className="mt-1 text-sm text-slate-500">Chaque ligne décrit le provider et ses capacités déclarées.</p></div><button type="button" onClick={() => setShowAddSource(true)} className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700">Ajouter une source</button></div><div className="tz-scroll-x"><table className="tz-data-table w-full min-w-[860px] text-left text-sm"><thead><tr><th className="px-5 py-3">Source</th><th className="px-5 py-3">Type / provider</th><th className="px-5 py-3">Capacités</th><th className="px-5 py-3">Environnement</th><th className="px-5 py-3">Dernier contrôle</th><th className="px-5 py-3">État</th></tr></thead><tbody className="divide-y divide-slate-100">{resources.map((resource) => <tr key={resource.resourceCode} onClick={() => setSelectedResource(resource)} className="cursor-pointer hover:bg-cyan-50/30"><td className="px-5 py-4"><strong className="text-slate-900">{resource.displayName || resource.resourceCode}</strong><span className="ml-2 font-mono text-xs text-slate-400">{resource.resourceCode}</span></td><td className="px-5 py-4 text-slate-600">{resource.type || 'API'} · {resource.provider || '—'}</td><td className="px-5 py-4"><div className="flex flex-wrap gap-1">{(resource.operations || []).map((op) => <span key={op} className="rounded bg-cyan-50 px-2 py-1 text-[11px] font-semibold text-cyan-700">{op}</span>)}</div></td><td className="px-5 py-4 text-slate-600">{resource.environment || 'Tenant'}</td><td className="px-5 py-4 font-mono text-xs text-slate-500">{resource.lastCheck ? new Date(resource.lastCheck).toLocaleString() : '—'}</td><td className="px-5 py-4"><StatusPill tone="good">Disponible</StatusPill></td></tr>)}{!resources.length && <tr><td colSpan="6" className="px-5 py-12 text-center text-slate-500">Aucune source configurée pour ce tenant.</td></tr>}</tbody></table></div></section>{selectedResource && <SourceDetailTabs resource={selectedResource} />}{showAddSource && <AddDataSourceForm onCancel={() => setShowAddSource(false)} onSubmit={(payload) => { setShowAddSource(false); setSourceNotice(`La source ${payload.name || payload.code} a été préparée. La persistance nécessite l’API Registry.`); }} />}{sourceNotice && <div className="tz-surface border-cyan-200 bg-cyan-50 p-4 text-sm text-cyan-800">{sourceNotice}</div>}</>}
    {key === 'contrats' && <><section className="tz-surface overflow-hidden"><div className="border-b border-slate-100 px-5 py-4"><h2 className="font-semibold text-slate-950">Contrat Data Runtime</h2><p className="mt-1 text-sm text-slate-500">Entités, opérations, champs, relations et exigences runtime.</p></div><div className="grid gap-4 p-5 sm:grid-cols-2"><div className="rounded-xl bg-slate-950 p-5 text-slate-100"><p className="text-xs font-semibold text-cyan-300">Identité</p><p className="mt-2 font-mono text-sm">{contract?.contract || 'techzone.data-runtime'}</p><p className="mt-2 text-xs text-slate-400">Version {contract?.version || '1.0'}</p></div><div className="rounded-xl border border-slate-200 p-5"><p className="text-xs font-semibold text-slate-500">Capacités</p><div className="mt-3 flex flex-wrap gap-2">{(contract?.capabilities || ['READ', 'CREATE', 'UPDATE', 'DELETE', 'FILTER', 'SORT', 'PAGINATE']).map((capability) => <StatusPill key={capability} tone="good">{capability}</StatusPill>)}</div></div></div><div className="grid gap-4 p-5 md:grid-cols-2">{resources.map((resource) => <article key={resource.resourceCode} className="rounded-xl border border-slate-200 p-4"><p className="text-xs font-semibold text-cyan-700">Entité</p><h3 className="mt-1 font-semibold text-slate-900">{resource.displayName || resource.resourceCode}</h3><p className="mt-2 text-xs text-slate-500">Repository : {resource.repository || 'Résolution serveur'}</p><div className="mt-3 flex flex-wrap gap-1">{(resource.operations || []).map((op) => <span key={op} className="rounded bg-slate-100 px-2 py-1 text-[11px] font-semibold text-slate-600">{op}</span>)}</div><p className="mt-3 text-xs text-slate-500">Filtres, tri, pagination et policies évalués par le contrat.</p></article>)}</div></section><RepositoryRegistry /></>}
    {key === 'politiques' && <><section className="tz-surface overflow-hidden"><div className="border-b border-slate-100 px-5 py-4"><h2 className="font-semibold text-slate-950">Matrice des permissions</h2></div><div className="tz-scroll-x"><table className="tz-data-table w-full min-w-[860px] text-left text-sm"><thead><tr><th className="px-5 py-3">Ressource</th>{['READ', 'CREATE', 'UPDATE', 'DELETE'].map((operation) => <th key={operation} className="px-5 py-3">{operation}</th>)}</tr></thead><tbody className="divide-y divide-slate-100">{resources.map((resource) => <tr key={resource.resourceCode}><td className="px-5 py-4 font-semibold text-slate-900">{resource.displayName || resource.resourceCode}</td>{['READ', 'CREATE', 'UPDATE', 'DELETE'].map((operation) => <td key={operation} className="px-5 py-4">{resource.operations?.some((item) => item.toUpperCase() === operation) ? <StatusPill tone="good">Exposé</StatusPill> : <StatusPill>Non exposé</StatusPill>}</td>)}</tr>)}</tbody></table></div></section><FieldAccessScreen resourceCode={resources[0]?.resourceCode || '—'} /><RowPolicyScreen /></>}
    {key === 'diagnostics' && <section className="space-y-4"><div className="grid gap-3 sm:grid-cols-3"><article className="tz-surface p-4"><p className="text-xs text-slate-500">Taux de succès</p><p className="mt-2 text-2xl font-semibold">{metrics?.successRate != null ? `${metrics.successRate.toFixed(1)}%` : '—'}</p></article><article className="tz-surface p-4"><p className="text-xs text-slate-500">Taux d’erreur</p><p className="mt-2 text-2xl font-semibold">{metrics?.errorRate != null ? `${metrics.errorRate.toFixed(1)}%` : '—'}</p></article><article className="tz-surface p-4"><p className="text-xs text-slate-500">Latence moyenne</p><p className="mt-2 text-2xl font-semibold">{metrics?.averageLatency != null ? `${metrics.averageLatency} ms` : '—'}</p></article></div><RuntimeContextCard context={metrics?.runtimeContext} />{error && <DataAccessBlocked code={String(error)} correlationId={metrics?.correlationId} />}<TransactionalDiagnostics traceDetail={history[0]} /><div className="tz-surface p-5"><div className="flex items-center gap-2"><WrenchScrewdriverIcon className="h-5 w-5 text-cyan-600" /><h2 className="font-semibold">Diagnostics et audit</h2></div><div className="mt-4 space-y-2">{history.slice(0, 20).map((item, index) => <div key={item.traceId || index} className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-slate-50 px-4 py-3 text-sm"><span className="font-medium text-slate-800">{item.operation} · {item.resource}</span><span className="text-slate-500">{item.status} · {item.duration ?? item.durationMs ?? '—'} ms · {item.traceId || 'sans trace'}</span></div>)}{!history.length && <p className="py-8 text-center text-sm text-slate-500">Aucun diagnostic ou événement pour le tenant courant.</p>}</div></div><div className="tz-surface p-5"><h2 className="font-semibold text-slate-900">Limites de requête</h2><div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{[['Page maximale','100'],['Timeout','5 000 ms'],['Profondeur relation','Contrat'],['Agrégation','Contrat']].map(([label,value]) => <div key={label} className="rounded-lg bg-slate-50 p-3"><p className="text-xs text-slate-500">{label}</p><p className="mt-1 font-mono text-sm font-semibold text-slate-800">{value}</p></div>)}</div></div></section>}
  </main>;
}

export default DataRuntimeGovernance;
