import React, { useState, useEffect, useCallback } from 'react';
import { dataRuntimeService } from '../services/apiClient.js';
import { ModernSpinner } from '../components/Loaders.jsx';
import {
  FolderOpenIcon,
  TableCellsIcon,
  MagnifyingGlassIcon,
  CubeTransparentIcon,
  ArrowPathIcon,
  ExclamationTriangleIcon,
  ServerStackIcon,
  ArrowTopRightOnSquareIcon,
} from '@heroicons/react/24/outline';

function apiMessage(error) {
  return error?.response?.data?.message || error?.response?.data?.error || error?.message || 'La requête a échoué.';
}

function isErpUnavailable(error) {
  return String(apiMessage(error)).includes('ERP_INSTANCE_NOT_CONFIGURED');
}

function DataRuntime() {
  const [resources, setResources] = useState([]);
  const [contract, setContract] = useState(null);
  const [metrics, setMetrics] = useState(null);
  const [selected, setSelected] = useState('Product');
  const [rows, setRows] = useState([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [total, setTotal] = useState(null);
  const [sortField, setSortField] = useState('');
  const [sortDirection, setSortDirection] = useState('ASC');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [erpUnavailable, setErpUnavailable] = useState(false);
  const [queryOutput, setQueryOutput] = useState(null);
  const [mutationForm, setMutationForm] = useState({ operation: 'CREATE', targetId: '', json: '{\n  "ref": "PRD-X",\n  "label": "Produit test"\n}' });
  const [mutationOutput, setMutationOutput] = useState(null);
  const [mutationLoading, setMutationLoading] = useState(false);

  const [queryForm, setQueryForm] = useState({ fields: '', filterField: '', filterOp: 'EQ', filterValue: '' });
  const [validateForm, setValidateForm] = useState({ json: '{\n  "ref": "PRD-X",\n  "label": "Produit test",\n  "price": 42\n}' });
  const [validateOutput, setValidateOutput] = useState(null);

  const fetchResources = useCallback(async () => {
    try {
      setLoading(true);
      const [resourceResult, contractResult, metricsResult] = await Promise.allSettled([
        dataRuntimeService.resources(),
        dataRuntimeService.contract(),
        dataRuntimeService.metrics(),
      ]);
      if (resourceResult.status === 'rejected') throw resourceResult.reason;
      const available = Array.isArray(resourceResult.value.data) ? resourceResult.value.data : [];
      if (contractResult.status === 'fulfilled') setContract(contractResult.value.data);
      if (metricsResult.status === 'fulfilled') setMetrics(metricsResult.value.data);
      setResources(available);
      setSelected((prev) => (
        available.some((resource) => resource.resourceCode === prev)
          ? prev
          : (available[0]?.resourceCode || '')
      ));
    } catch (err) {
      setError('Impossible de charger les ressources');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  const listRows = useCallback(async (resource, requestedPage = page, requestedPageSize = pageSize) => {
    try {
      setError(null);
      setErpUnavailable(false);
      const body = { resource, page: requestedPage, pageSize: requestedPageSize };
      if (sortField) body.sort = [{ field: sortField, direction: sortDirection }];
      const res = await dataRuntimeService.query(body);
      setRows(res.data.items || []);
      setTotal(typeof res.data.total === 'number' ? res.data.total : null);
    } catch (err) {
      setRows([]);
      setTotal(0);
      if (isErpUnavailable(err)) {
        setErpUnavailable(true);
        setError('La source ERP de ce tenant doit être configurée avant de charger les enregistrements.');
      } else {
        setError(apiMessage(err));
      }
      console.error(err);
    }
  }, [page, pageSize, sortDirection, sortField]);

  useEffect(() => { fetchResources(); }, [fetchResources]);
  useEffect(() => { if (selected) listRows(selected, page, pageSize); }, [selected, page, pageSize, listRows]);

  const changeResource = (resource) => {
    setSelected(resource);
    setPage(1);
    setTotal(null);
  };

  const changeSort = (field) => {
    setPage(1);
    if (sortField === field) {
      setSortDirection((direction) => (direction === 'ASC' ? 'DESC' : 'ASC'));
    } else {
      setSortField(field);
      setSortDirection('ASC');
    }
  };

  const runQuery = async (e) => {
    e.preventDefault();
    setQueryOutput(null);
    try {
      const filter = queryForm.filterField
        ? {
          logic: 'AND',
          conditions: [{ field: queryForm.filterField, operator: queryForm.filterOp, value: queryForm.filterValue }],
        }
        : undefined;
      const body = { resource: selected };
      if (queryForm.fields) body.select = queryForm.fields.split(',').map((s) => s.trim()).filter(Boolean);
      if (filter) body.filter = filter;
      const res = await dataRuntimeService.query(body);
      setQueryOutput(res.data);
    } catch (err) {
      setQueryOutput({ error: err.response?.data?.message || err.message });
    }
  };

  const runValidate = async (e) => {
    e.preventDefault();
    setValidateOutput(null);
    try {
      const data = JSON.parse(validateForm.json);
      const res = await dataRuntimeService.validate(selected, data);
      setValidateOutput(res.data);
    } catch (err) {
      const parseErr = err instanceof SyntaxError;
      setValidateOutput({ error: parseErr ? 'JSON invalide' : (err.response?.data?.message || err.message) });
    }
  };

  const runMutation = async (e) => {
    e.preventDefault();
    setMutationOutput(null);
    if (mutationForm.operation === 'DELETE' && !mutationForm.targetId.trim()) {
      setMutationOutput({ error: 'Un identifiant est requis pour supprimer un enregistrement.' });
      return;
    }
    if (mutationForm.operation !== 'DELETE' && !mutationForm.json.trim()) {
      setMutationOutput({ error: 'Le payload JSON est requis pour cette opération.' });
      return;
    }
    const actionLabel = mutationForm.operation === 'DELETE' ? 'supprimer cet enregistrement' : `${mutationForm.operation.toLowerCase()} cet enregistrement`;
    if (!window.confirm(`Confirmer : ${actionLabel} dans ${selected} ?`)) return;
    try {
      const input = mutationForm.operation === 'DELETE' ? undefined : JSON.parse(mutationForm.json);
      setMutationLoading(true);
      const response = await dataRuntimeService.execute({
        resource: selected,
        operation: mutationForm.operation,
        ...(mutationForm.targetId.trim() ? { targetId: mutationForm.targetId.trim() } : {}),
        ...(input !== undefined ? { input } : {}),
        idempotencyKey: `ui-${selected}-${mutationForm.operation}-${Date.now()}`,
      });
      setMutationOutput(response.data);
      if (response.data?.success) await listRows(selected);
    } catch (err) {
      const parseErr = err instanceof SyntaxError;
      setMutationOutput({ error: parseErr ? 'JSON invalide' : (err.response?.data?.message || err.message) });
    } finally {
      setMutationLoading(false);
    }
  };

  const renderValue = (v) => {
    if (v === null || v === undefined) return <span className="text-slate-400 dark:text-slate-500">—</span>;
    if (typeof v === 'object') return <span className="font-mono text-xs">{JSON.stringify(v)}</span>;
    return String(v);
  };

  if (loading) {
    return <ModernSpinner label="Chargement des ressources..." />;
  }

  const columns = rows.length > 0 ? Object.keys(rows[0]) : [];

  return (
    <main className="tz-page space-y-6">
      <header className="overflow-hidden rounded-2xl bg-slate-950 px-6 py-7 text-white shadow-lg sm:px-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <div className="mb-3 flex items-center gap-2 text-sm text-cyan-300"><CubeTransparentIcon className="h-5 w-5" /> Espace données métier</div>
            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Explorez vos enregistrements avec contrôle.</h1>
            <p className="mt-3 max-w-xl text-sm leading-6 text-slate-300">Consultez les modèles publiés par Business Manager, vérifiez les relations et exécutez les opérations autorisées par votre tenant.</p>
          </div>
          <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-200"><span className="h-2.5 w-2.5 rounded-full bg-amber-400" /> Tenant courant <span className="font-mono text-xs text-slate-400">00000000…0000</span></div>
        </div>
      </header>

      <section className="grid grid-cols-2 gap-4 lg:grid-cols-4" aria-label="Vue d’ensemble Data Runtime">
        {[
          ['Ressources', resources.length, 'Contrats disponibles'],
          ['Provider', contract?.health?.status || 'Non vérifié', 'État retourné par le contrat'],
          ['Opérations', metrics?.executionCount ?? metrics?.queryCount ?? '—', 'Tenant courant'],
          ['Taux de succès', typeof metrics?.successRate === 'number' ? `${metrics.successRate.toFixed(1)}%` : '—', 'Historique autorisé'],
        ].map(([label, value, hint]) => (
          <article key={label} className="tz-surface p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
            <p className="mt-2 text-xl font-bold text-slate-900">{value}</p>
            <p className="mt-1 text-xs text-slate-500">{hint}</p>
          </article>
        ))}
      </section>

      {error && (
        <div className={`rounded-xl border p-4 ${erpUnavailable ? 'border-amber-200 bg-amber-50' : 'border-red-200 bg-red-50'}`} role="alert">
          {erpUnavailable ? <ServerStackIcon className="mr-3 inline h-5 w-5 text-amber-600" /> : <ExclamationTriangleIcon className="mr-3 inline h-5 w-5 text-red-500" />}
          <span className={`font-medium ${erpUnavailable ? 'text-amber-900' : 'text-red-700'}`}>{error}</span>
          {erpUnavailable && <a href="/erp" className="ml-4 inline-flex items-center gap-1 text-sm font-semibold text-amber-800 underline underline-offset-2">Configurer une source <ArrowTopRightOnSquareIcon className="h-4 w-4" /></a>}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Ressources */}
        <div className="lg:col-span-1">
          <div className="tz-surface overflow-hidden">
            <div className="flex items-center gap-3 border-b border-slate-100 px-6 py-4">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-cyan-500 shadow-md">
                <FolderOpenIcon className="w-5 h-5 text-white" />
              </div>
              <h3 className="font-semibold text-slate-800 dark:text-slate-100">Ressources canoniques</h3>
            </div>
            <ul className="divide-y divide-slate-100">
              {resources.map((r) => (
                <li key={r.resourceCode}>
                  <button
                    onClick={() => changeResource(r.resourceCode)}
                    className={`w-full text-left px-6 py-3 transition-colors hover:bg-cyan-50/50 ${
                      selected === r.resourceCode ? 'bg-blue-50/60 border-l-4 border-blue-500' : 'border-l-4 border-transparent'
                    }`}
                  >
                    <div className="text-sm font-medium text-slate-800 dark:text-slate-100">{r.displayName} ({r.resourceCode})</div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      Provider: {r.provider} · {r.operations?.join(', ')}
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Données */}
        <div className="space-y-6 lg:col-span-3">
          <div className="tz-surface overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700/60 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-md">
                  <TableCellsIcon className="w-5 h-5 text-white" />
                </div>
                <h3 className="font-semibold text-slate-800 dark:text-slate-100">Données — {selected}</h3>
              </div>
              <button
                onClick={() => listRows(selected, page, pageSize)}
                className="inline-flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-800 font-medium"
              >
                <ArrowPathIcon className="w-4 h-4" />
                Rafraîchir
              </button>
            </div>
            <div className="flex flex-wrap items-center gap-3 border-b border-slate-100 px-6 py-3 text-sm dark:border-slate-700/60">
              <label className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                Lignes
                <select value={pageSize} onChange={(event) => { setPageSize(Number(event.target.value)); setPage(1); }} className="rounded-lg border border-slate-200 bg-white px-2 py-1 dark:border-slate-600 dark:bg-slate-700">
                  {[10, 20, 50, 100].map((size) => <option key={size} value={size}>{size}</option>)}
                </select>
              </label>
              <span className="text-slate-500 dark:text-slate-400" aria-live="polite">
                {total == null ? `${rows.length} résultat(s)` : `${total} résultat(s)`}
              </span>
              <div className="ml-auto flex items-center gap-2">
                <button type="button" disabled={page <= 1} onClick={() => setPage((current) => Math.max(1, current - 1))} className="rounded-lg border border-slate-200 px-3 py-1 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-600">Précédent</button>
                <span className="min-w-16 text-center text-slate-600 dark:text-slate-300">Page {page}</span>
                <button type="button" disabled={total != null ? page * pageSize >= total : rows.length < pageSize} onClick={() => setPage((current) => current + 1)} className="rounded-lg border border-slate-200 px-3 py-1 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-600">Suivant</button>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 dark:bg-slate-700/40 text-slate-500 dark:text-slate-400 uppercase text-xs tracking-wider">
                  <tr>
                    {columns.map((c) => (
                      <th key={c} className="px-4 py-2 text-left font-semibold">
                        <button type="button" onClick={() => changeSort(c)} className="inline-flex items-center gap-1 hover:text-slate-900 dark:hover:text-white" aria-label={`Trier par ${c}`}>
                          {c}{sortField === c && <span aria-hidden="true">{sortDirection === 'ASC' ? ' ↑' : ' ↓'}</span>}
                        </button>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
                  {rows.length === 0 ? (
                    <tr><td colSpan={columns.length || 1} className="px-6 py-12 text-center text-slate-500 dark:text-slate-400">Aucune donnée</td></tr>
                  ) : rows.map((row, i) => (
                    <tr key={i} className="hover:bg-slate-50/50">
                      {columns.map((c) => (
                        <td key={c} className="px-4 py-3 text-sm text-slate-700 dark:text-slate-200">{renderValue(row[c])}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-amber-200 dark:border-amber-800/60 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-amber-100 dark:border-amber-800/50 flex items-center justify-between gap-3">
              <div>
                <h3 className="font-semibold text-slate-800 dark:text-slate-100">Mutation Tester</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Les permissions IAM et les règles métier sont vérifiées par le serveur.</p>
              </div>
              <span className="text-xs font-semibold uppercase tracking-wide text-amber-700 dark:text-amber-300">Action sensible</span>
            </div>
            <form onSubmit={runMutation} className="p-6 space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                <select
                  value={mutationForm.operation}
                  onChange={(e) => setMutationForm({ ...mutationForm, operation: e.target.value })}
                  className="border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 text-sm dark:bg-slate-900 dark:text-slate-100"
                  aria-label="Opération de mutation"
                >
                  {['CREATE', 'UPDATE', 'DELETE'].map((operation) => <option key={operation} value={operation}>{operation}</option>)}
                </select>
                <input
                  value={mutationForm.targetId}
                  onChange={(e) => setMutationForm({ ...mutationForm, targetId: e.target.value })}
                  placeholder={mutationForm.operation === 'CREATE' ? 'ID cible (optionnel)' : 'ID cible'}
                  className="md:col-span-2 border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 text-sm dark:bg-slate-900 dark:text-slate-100"
                  aria-label="Identifiant cible"
                />
              </div>
              {mutationForm.operation !== 'DELETE' && (
                <textarea
                  rows="5"
                  value={mutationForm.json}
                  onChange={(e) => setMutationForm({ ...mutationForm, json: e.target.value })}
                  className="w-full border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 text-sm font-mono dark:bg-slate-900 dark:text-slate-100"
                  aria-label="Payload JSON de mutation"
                />
              )}
              <button type="submit" disabled={mutationLoading} className="w-full bg-amber-600 text-white px-4 py-2 rounded-lg hover:bg-amber-700 disabled:opacity-60 font-medium">
                {mutationLoading ? 'Exécution…' : 'Exécuter après confirmation'}
              </button>
              {mutationOutput && (
                <pre className={`rounded-lg p-4 text-xs overflow-x-auto max-h-64 ${mutationOutput.success ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
                  {JSON.stringify(mutationOutput, null, 2)}
                </pre>
              )}
            </form>
          </div>

          {/* Query + Validation */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700/60 flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-md">
                  <MagnifyingGlassIcon className="w-5 h-5 text-white" />
                </div>
                <h3 className="font-semibold text-slate-800 dark:text-slate-100">Requête déclarative</h3>
              </div>
              <div className="p-6">
                <form id="query" onSubmit={runQuery} className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Champs (séparés par virgules)</label>
                    <input
                      value={queryForm.fields}
                      onChange={(e) => setQueryForm({ ...queryForm, fields: e.target.value })}
                      placeholder="label, price, stock"
                      className="w-full border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500"
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <input
                      value={queryForm.filterField}
                      onChange={(e) => setQueryForm({ ...queryForm, filterField: e.target.value })}
                      placeholder="champ filtre"
                      className="border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 text-sm col-span-1 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500"
                    />
                    <select
                      value={queryForm.filterOp}
                      onChange={(e) => setQueryForm({ ...queryForm, filterOp: e.target.value })}
                      className="border border-slate-300 dark:border-slate-600 rounded-lg px-2 py-2 text-sm col-span-1 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500"
                    >
                      {['EQ','NE','GT','GTE','LT','LTE','IN','NOT_IN','CONTAINS'].map((op) => <option key={op} value={op}>{op}</option>)}
                    </select>
                    <input
                      value={queryForm.filterValue}
                      onChange={(e) => setQueryForm({ ...queryForm, filterValue: e.target.value })}
                      placeholder="valeur"
                      className="border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 text-sm col-span-1 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500"
                    />
                  </div>
                  <button type="submit" className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 font-medium">
                    Exécuter
                  </button>
                </form>
                {queryOutput && (
                  <pre className="mt-4 bg-slate-900 text-green-400 rounded-lg p-4 text-xs overflow-x-auto max-h-64">
                    {JSON.stringify(queryOutput, null, 2)}
                  </pre>
                )}
              </div>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700/60 flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-md">
                  <CubeTransparentIcon className="w-5 h-5 text-white" />
                </div>
                <h3 className="font-semibold text-slate-800 dark:text-slate-100">Validation de données</h3>
              </div>
              <div className="p-6">
                <form onSubmit={runValidate} className="space-y-3">
                  <textarea
                    rows="6"
                    value={validateForm.json}
                    onChange={(e) => setValidateForm({ json: e.target.value })}
                    className="w-full border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500"
                  />
                  <button type="submit" className="w-full bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 font-medium">
                    Valider
                  </button>
                </form>
                {validateOutput && (
                  <pre className={`mt-4 rounded-lg p-4 text-xs overflow-x-auto max-h-64 ${validateOutput.valid ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300' : 'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300'}`}>
                    {JSON.stringify(validateOutput, null, 2)}
                  </pre>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

export default DataRuntime;
