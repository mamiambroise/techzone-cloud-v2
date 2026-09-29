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
} from '@heroicons/react/24/outline';

function DataRuntime() {
  const [resources, setResources] = useState([]);
  const [selected, setSelected] = useState('Product');
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [queryOutput, setQueryOutput] = useState(null);

  const [queryForm, setQueryForm] = useState({ fields: '', filterField: '', filterOp: 'EQ', filterValue: '' });
  const [validateForm, setValidateForm] = useState({ json: '{\n  "ref": "PRD-X",\n  "label": "Produit test",\n  "price": 42\n}' });
  const [validateOutput, setValidateOutput] = useState(null);

  const fetchResources = useCallback(async () => {
    try {
      setLoading(true);
      const res = await dataRuntimeService.resources();
      setResources(res.data);
      setSelected((prev) => (res.data.length > 0 && !prev ? res.data[0].resourceCode : prev));
    } catch (err) {
      setError('Impossible de charger les ressources');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  const listRows = useCallback(async (resource) => {
    try {
      const res = await dataRuntimeService.listResource(resource);
      setRows(res.data.items || []);
    } catch (err) {
      setError(`Impossible de lister ${resource}`);
      console.error(err);
    }
  }, []);

  useEffect(() => { fetchResources(); }, [fetchResources]);
  useEffect(() => { if (selected) listRows(selected); }, [selected, listRows]);

  const runQuery = async (e) => {
    e.preventDefault();
    setQueryOutput(null);
    try {
      const filter = queryForm.filterField
        ? { field: queryForm.filterField, operator: queryForm.filterOp, value: queryForm.filterValue }
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
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Data Runtime</h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Exploration et validation des ressources de données</p>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 rounded-xl p-4 flex items-center gap-3">
          <ExclamationTriangleIcon className="w-5 h-5 text-red-500 shrink-0" />
          <p className="text-red-600 dark:text-red-400 font-medium">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Ressources */}
        <div className="lg:col-span-1">
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700/60 flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-md">
                <FolderOpenIcon className="w-5 h-5 text-white" />
              </div>
              <h3 className="font-semibold text-slate-800 dark:text-slate-100">Ressources canoniques</h3>
            </div>
            <ul className="divide-y divide-slate-100 dark:divide-slate-700/60">
              {resources.map((r) => (
                <li key={r.resourceCode}>
                  <button
                    onClick={() => setSelected(r.resourceCode)}
                    className={`w-full text-left px-6 py-3 hover:bg-slate-50/50 transition-colors ${
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
        <div className="lg:col-span-3 space-y-6">
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700/60 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-md">
                  <TableCellsIcon className="w-5 h-5 text-white" />
                </div>
                <h3 className="font-semibold text-slate-800 dark:text-slate-100">Données — {selected}</h3>
              </div>
              <button
                onClick={() => listRows(selected)}
                className="inline-flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-800 font-medium"
              >
                <ArrowPathIcon className="w-4 h-4" />
                Rafraîchir
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 dark:bg-slate-700/40 text-slate-500 dark:text-slate-400 uppercase text-xs tracking-wider">
                  <tr>
                    {columns.map((c) => (
                      <th key={c} className="px-4 py-2 text-left font-semibold">{c}</th>
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
    </div>
  );
}

export default DataRuntime;
