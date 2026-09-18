import React, { useState, useEffect } from 'react';
import {
  ArrowPathRoundedSquareIcon,
  PlayIcon,
  XCircleIcon,
  ListBulletIcon,
  BoltIcon,
} from '@heroicons/react/24/outline';
import { automationService } from '../services/api';
import { ModernSpinner } from '../components/Loaders';

function AutomationWorkflows() {
  const [workflows, setWorkflows] = useState([]);
  const [executions, setExecutions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selected, setSelected] = useState('');
  const [variables, setVariables] = useState('{\n  "approved": true\n}');
  const [startResult, setStartResult] = useState(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [w, e] = await Promise.all([
        automationService.workflows(),
        automationService.executions(),
      ]);
      setWorkflows(w.data);
      setExecutions(e.data || []);
    } catch (err) {
      setError('Impossible de charger les workflows');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const runStart = async (e) => {
    e.preventDefault();
    setStartResult(null);
    let vars = {};
    try { vars = JSON.parse(variables); } catch { alert('JSON de variables invalide'); return; }
    try {
      const res = await automationService.startWorkflow(selected, vars);
      setStartResult(res.data);
      fetchData();
    } catch (err) {
      setStartResult({ error: err.response?.data?.message || err.message });
    }
  };

  const lifecycleBadge = (s) => {
    const map = {
      ACTIVE: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
      READY: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
      PAUSED: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
      ARCHIVED: 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400',
    };
    const dotColor = {
      ACTIVE: 'bg-emerald-500',
      READY: 'bg-blue-500',
      PAUSED: 'bg-amber-500',
      ARCHIVED: 'bg-slate-400',
    };
    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-full font-medium ${map[s] || 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400'}`}>
        <span className={`w-1.5 h-1.5 rounded-full ${dotColor[s] || 'bg-slate-400'}`} />
        {s}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Workflows</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Définitions et exécutions des workflows d'automatisation</p>
        </div>
        <button onClick={fetchData} className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 rounded-xl hover:bg-blue-100 transition-colors">
          <ArrowPathRoundedSquareIcon className="w-4 h-4" />
          Rafraîchir
        </button>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 rounded-xl p-4 flex items-center gap-3">
          <XCircleIcon className="w-5 h-5 text-red-500 shrink-0" />
          <p className="text-red-600 dark:text-red-400 font-medium text-sm">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-700/60">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-md">
                  <ArrowPathRoundedSquareIcon className="w-5 h-5 text-white" />
                </div>
                <h3 className="font-semibold text-slate-800 dark:text-slate-100">Définitions</h3>
              </div>
              <span className="text-xs text-slate-400 dark:text-slate-500 font-medium">{workflows.length} workflow(s)</span>
            </div>
            <div className="divide-y divide-slate-100 dark:divide-slate-700/60">
              {loading ? (
              <div className="px-6 py-14 flex items-center justify-center">
                <ModernSpinner label="Chargement..." />
              </div>
            ) : workflows.length === 0 ? (
                <div className="px-6 py-12 text-center text-slate-400 dark:text-slate-500 text-sm">Aucun workflow</div>
              ) : workflows.map((wf) => (
                <div key={wf.code} className="px-6 py-4 hover:bg-slate-50/50 dark:hover:bg-slate-700/40 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-sm font-semibold text-slate-800 dark:text-slate-100">{wf.code}</span>
                      <span className="text-sm text-slate-500 dark:text-slate-400">{wf.nom}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      {lifecycleBadge(wf.lifecycle)}
                      <span className="text-xs text-slate-400 dark:text-slate-500">v{wf.version} · {wf.steps?.length} étapes</span>
                    </div>
                  </div>
                  {(wf.steps || []).length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {wf.steps.map((st, i) => (
                        <span key={i} className="inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-medium">
                          <BoltIcon className="w-3 h-3" />
                          {st.type}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
            <div className="flex items-center gap-3 px-6 py-4 border-b border-slate-100 dark:border-slate-700/60">
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-md">
                <ListBulletIcon className="w-5 h-5 text-white" />
              </div>
              <h3 className="font-semibold text-slate-800 dark:text-slate-100">Exécutions</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-700/40 text-slate-500 dark:text-slate-400 uppercase text-xs tracking-wider">
                    <th className="px-6 py-3 text-left font-semibold">ExecutionId</th>
                    <th className="px-6 py-3 text-left font-semibold">Workflow</th>
                    <th className="px-6 py-3 text-left font-semibold">Statut</th>
                    <th className="px-6 py-3 text-left font-semibold">Étapes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
                  {executions.length === 0 ? (
                    <tr><td colSpan="4" className="px-6 py-10 text-center text-slate-400 dark:text-slate-500 text-sm">Aucune exécution</td></tr>
                  ) : executions.map((ex) => (
                    <tr key={ex.executionId} className="hover:bg-slate-50/50 dark:hover:bg-slate-700/40 transition-colors">
                      <td className="px-6 py-3 font-mono text-xs text-slate-700 dark:text-slate-200">{ex.executionId}</td>
                      <td className="px-6 py-3 text-sm text-slate-700 dark:text-slate-200">{ex.workflowCode}</td>
                      <td className="px-6 py-3">{lifecycleBadge(ex.status)}</td>
                      <td className="px-6 py-3 text-sm text-slate-500 dark:text-slate-400">{ex.timeline?.length ?? 0}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden h-fit">
          <div className="flex items-center gap-3 px-6 py-4 border-b border-slate-100 dark:border-slate-700/60">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-md">
              <PlayIcon className="w-5 h-5 text-white" />
            </div>
            <h3 className="font-semibold text-slate-800 dark:text-slate-100">Démarrer un workflow</h3>
          </div>
          <div className="p-6">
            <form onSubmit={runStart} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5">Workflow</label>
                <select value={selected} onChange={(e) => setSelected(e.target.value)} className="w-full border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-slate-50 dark:bg-slate-700/40 text-slate-700 dark:text-slate-200">
                  <option value="">— Sélectionner —</option>
                  {workflows.map((wf) => <option key={wf.code} value={wf.code}>{wf.code} — {wf.nom}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5">Variables (JSON)</label>
                <textarea rows="6" value={variables} onChange={(e) => setVariables(e.target.value)} className="w-full border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-slate-50 dark:bg-slate-700/40 text-slate-700 dark:text-slate-200" />
              </div>
              <button type="submit" disabled={!selected} className="w-full bg-blue-600 text-white px-4 py-2.5 rounded-xl hover:bg-blue-700 font-medium disabled:opacity-50 transition-colors text-sm">
                Démarrer
              </button>
            </form>
            {startResult && (
              <pre className={`mt-4 rounded-xl p-4 text-xs overflow-x-auto max-h-72 ${startResult.error ? 'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 border border-red-200' : 'bg-slate-900 text-emerald-400'}`}>
                {JSON.stringify(startResult, null, 2)}
              </pre>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default AutomationWorkflows;
