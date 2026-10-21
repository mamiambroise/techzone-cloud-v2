import React, { useEffect, useMemo, useState } from 'react';
import { dataRuntimeService } from '../services/apiClient.js';
import { ModernSpinner } from '../components/Loaders.jsx';

const views = {
  sources: { title: 'Sources de données', description: 'Providers et ressources déclarés par le contrat Data Runtime.' },
  contrats: { title: 'Modèles & Contrats', description: 'Entités, opérations et capacités exposées par le contrat canonique.' },
  politiques: { title: 'Politiques', description: 'Opérations autorisées par ressource. La décision IAM reste côté serveur.' },
  diagnostics: { title: 'Diagnostics', description: 'Métriques et historique filtrés par le tenant authentifié.' },
};

function DataRuntimeGovernance() {
  const key = window.location.pathname.split('/').filter(Boolean).pop() || 'sources';
  const view = views[key] || views.sources;
  const [contract, setContract] = useState(null);
  const [resources, setResources] = useState([]);
  const [metrics, setMetrics] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    Promise.allSettled([
      dataRuntimeService.contract(),
      dataRuntimeService.resources(),
      dataRuntimeService.metrics(),
      dataRuntimeService.history(),
    ]).then(([contractResult, resourcesResult, metricsResult, historyResult]) => {
      if (!active) return;
      if (contractResult.status === 'fulfilled') setContract(contractResult.value.data);
      if (resourcesResult.status === 'fulfilled') setResources(Array.isArray(resourcesResult.value.data) ? resourcesResult.value.data : []);
      if (metricsResult.status === 'fulfilled') setMetrics(metricsResult.value.data);
      if (historyResult.status === 'fulfilled') setHistory(Array.isArray(historyResult.value.data) ? historyResult.value.data : []);
      if ([contractResult, resourcesResult, metricsResult, historyResult].every((result) => result.status === 'rejected')) {
        setError('Les données Data Runtime sont momentanément indisponibles.');
      }
    }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const providerRows = useMemo(() => resources.map((resource) => ({
    code: resource.resourceCode,
    name: resource.displayName || resource.resourceCode,
    provider: resource.provider || '—',
    operations: resource.operations?.join(', ') || '—',
  })), [resources]);

  if (loading) return <ModernSpinner label="Chargement du catalogue Data Platform…" />;

  return (
    <main className="tz-page space-y-6">
      <header>
        <p className="text-xs font-semibold uppercase tracking-wide text-cyan-700">Données & intégrations</p>
        <h1 className="mt-1 text-2xl font-bold text-slate-900 dark:text-slate-100">{view.title}</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{view.description}</p>
      </header>
      {error && <div className="tz-surface border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>}

      {key === 'sources' && (
        <section className="tz-surface overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 text-xs uppercase text-slate-500"><tr><th className="px-4 py-3">Ressource</th><th className="px-4 py-3">Provider</th><th className="px-4 py-3">Opérations</th></tr></thead>
            <tbody className="divide-y divide-slate-100">{providerRows.map((row) => <tr key={row.code}><td className="px-4 py-3 font-medium">{row.name} <span className="text-xs text-slate-400">({row.code})</span></td><td className="px-4 py-3">{row.provider}</td><td className="px-4 py-3">{row.operations}</td></tr>)}{providerRows.length === 0 && <tr><td colSpan="3" className="px-4 py-8 text-center text-slate-500">Aucune ressource retournée par l’API.</td></tr>}</tbody>
          </table>
        </section>
      )}

      {key === 'contrats' && <section className="tz-surface p-5"><pre className="max-h-[32rem] overflow-auto text-xs text-slate-700">{JSON.stringify(contract || { message: 'Contrat indisponible' }, null, 2)}</pre></section>}

      {key === 'politiques' && <section className="tz-surface overflow-x-auto"><table className="w-full text-left text-sm"><thead className="border-b border-slate-200 text-xs uppercase text-slate-500"><tr><th className="px-4 py-3">Ressource</th><th className="px-4 py-3">READ</th><th className="px-4 py-3">CREATE</th><th className="px-4 py-3">UPDATE</th><th className="px-4 py-3">DELETE</th></tr></thead><tbody className="divide-y divide-slate-100">{resources.map((resource) => <tr key={resource.resourceCode}><td className="px-4 py-3 font-medium">{resource.displayName || resource.resourceCode}</td>{['READ', 'CREATE', 'UPDATE', 'DELETE'].map((operation) => <td key={operation} className="px-4 py-3">{resource.operations?.some((item) => item.toUpperCase() === operation) ? 'Autorisé par contrat' : 'Non exposé'}</td>)}</tr>)}</tbody></table></section>}

      {key === 'diagnostics' && <section className="space-y-4"><div className="grid grid-cols-2 gap-4 lg:grid-cols-4">{[['Exécutions', metrics?.executionCount], ['Succès', metrics?.successRate != null ? `${metrics.successRate.toFixed(1)}%` : '—'], ['Erreurs', metrics?.errorRate != null ? `${metrics.errorRate.toFixed(1)}%` : '—'], ['Latence moyenne', metrics?.averageLatency != null ? `${metrics.averageLatency} ms` : '—']].map(([label, value]) => <article key={label} className="tz-surface p-4"><p className="text-xs uppercase text-slate-500">{label}</p><p className="mt-2 text-xl font-bold text-slate-900">{value ?? '—'}</p></article>)}</div><div className="tz-surface overflow-x-auto"><table className="w-full text-left text-sm"><thead className="border-b border-slate-200 text-xs uppercase text-slate-500"><tr><th className="px-4 py-3">Opération</th><th className="px-4 py-3">Ressource</th><th className="px-4 py-3">Statut</th><th className="px-4 py-3">Durée</th></tr></thead><tbody className="divide-y divide-slate-100">{history.slice(0, 50).map((item, index) => <tr key={item.traceId || index}><td className="px-4 py-3">{item.operation}</td><td className="px-4 py-3">{item.resource}</td><td className="px-4 py-3">{item.status}</td><td className="px-4 py-3">{item.duration} ms</td></tr>)}{history.length === 0 && <tr><td colSpan="4" className="px-4 py-8 text-center text-slate-500">Aucun événement pour le tenant courant.</td></tr>}</tbody></table></div></section>}
    </main>
  );
}

export default DataRuntimeGovernance;
