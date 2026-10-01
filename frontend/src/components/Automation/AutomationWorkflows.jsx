import React, { useState } from 'react';
import { ArrowPathRoundedSquareIcon, PlayIcon, ListBulletIcon, BoltIcon } from '@heroicons/react/24/outline';
import { automationService } from '../services/apiClient.js';
import { ModernSpinner } from '../components/Loaders.jsx';
import {
  PageHeader,
  Card,
  ErrorBanner,
  JsonField,
  JsonResult,
  StatusBadge,
  useAsync,
  useAction,
  toArray,
  parseJson,
  getErrorMessage,
  describeError,
} from '../components/automation/shared/index.js';

const loadWorkflows = async () => {
  const [w, e] = await Promise.all([automationService.workflows(), automationService.executions()]);
  return { workflows: toArray(w.data), executions: toArray(e.data) };
};

function AutomationWorkflows() {
  const { data, loading, error, reload } = useAsync(loadWorkflows);
  const workflows = data?.workflows ?? [];
  const executions = data?.executions ?? [];

  const [selected, setSelected] = useState('');
  const [variables, setVariables] = useState('{\n  "approved": true\n}');
  const [variablesError, setVariablesError] = useState('');
  const [startResult, setStartResult] = useState(null);

  const start = useAction(async () => {
    setStartResult(null);
    const parsed = parseJson(variables, 'Variables JSON');
    setVariablesError(parsed.ok ? '' : parsed.error);
    if (!parsed.ok) return;
    try {
      const res = await automationService.startWorkflow(selected, parsed.value);
      setStartResult(res.data);
      reload();
    } catch (err) {
      setStartResult({ error: getErrorMessage(err) });
    }
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Workflows"
        subtitle="Définitions et exécutions des workflows d'automatisation"
        onRefresh={reload}
        refreshing={loading}
      />

      {error && <ErrorBanner message={describeError('Impossible de charger les workflows', error)} onRetry={reload} />}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card
            icon={ArrowPathRoundedSquareIcon}
            gradient="from-violet-500 to-purple-600"
            title="Définitions"
            meta={`${workflows.length} workflow(s)`}
            padded={false}
          >
            <div className="divide-y divide-slate-100 dark:divide-slate-700/60">
              {loading && workflows.length === 0 ? (
                <div className="px-6 py-14 flex items-center justify-center">
                  <ModernSpinner label="Chargement..." />
                </div>
              ) : workflows.length === 0 ? (
                <div className="px-6 py-12 text-center text-slate-500 dark:text-slate-400 text-sm">Aucun workflow</div>
              ) : (
                workflows.map((wf) => {
                  const steps = wf.steps || [];
                  return (
                    <div key={wf.code} className="px-6 py-4 hover:bg-slate-50/50 dark:hover:bg-slate-700/40 transition-colors">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-3">
                          <span className="font-mono text-sm font-semibold text-slate-800 dark:text-slate-100">{wf.code}</span>
                          <span className="text-sm text-slate-500 dark:text-slate-400">{wf.nom}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <StatusBadge status={wf.lifecycle} />
                          <span className="text-xs text-slate-500 dark:text-slate-400">
                            v{wf.version} · {steps.length} étape(s)
                          </span>
                        </div>
                      </div>
                      {steps.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-1.5">
                          {steps.map((st, i) => (
                            <span
                              key={`${st.type}-${i}`}
                              className="inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-medium"
                            >
                              <BoltIcon aria-hidden="true" className="w-3 h-3" />
                              {st.type}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </Card>

          <Card icon={ListBulletIcon} gradient="from-amber-500 to-orange-600" title="Exécutions" padded={false}>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-700/40 text-slate-500 dark:text-slate-400 uppercase text-xs tracking-wider">
                    <th scope="col" className="px-6 py-3 text-left font-semibold">ExecutionId</th>
                    <th scope="col" className="px-6 py-3 text-left font-semibold">Workflow</th>
                    <th scope="col" className="px-6 py-3 text-left font-semibold">Statut</th>
                    <th scope="col" className="px-6 py-3 text-left font-semibold">Étapes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
                  {executions.length === 0 ? (
                    <tr>
                      <td colSpan="4" className="px-6 py-10 text-center text-slate-500 dark:text-slate-400 text-sm">Aucune exécution</td>
                    </tr>
                  ) : (
                    executions.map((ex, i) => (
                      <tr key={ex.executionId ?? i} className="hover:bg-slate-50/50 dark:hover:bg-slate-700/40 transition-colors">
                        <td className="px-6 py-3 font-mono text-xs text-slate-700 dark:text-slate-200">{ex.executionId}</td>
                        <td className="px-6 py-3 text-sm text-slate-700 dark:text-slate-200">{ex.workflowCode}</td>
                        <td className="px-6 py-3"><StatusBadge status={ex.status} /></td>
                        <td className="px-6 py-3 text-sm text-slate-500 dark:text-slate-400">{ex.timeline?.length ?? 0}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        <Card icon={PlayIcon} gradient="from-emerald-500 to-teal-600" title="Démarrer un workflow" className="h-fit">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              start.run();
            }}
            className="space-y-4"
            aria-busy={start.loading}
          >
            <div>
              <label htmlFor="start-workflow" className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5">
                Workflow
              </label>
              <select
                id="start-workflow"
                value={selected}
                onChange={(e) => setSelected(e.target.value)}
                className="w-full border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-slate-50 dark:bg-slate-700/40 text-slate-700 dark:text-slate-200"
              >
                <option value="">— Sélectionner —</option>
                {workflows.map((wf) => (
                  <option key={wf.code} value={wf.code}>{wf.code} — {wf.nom}</option>
                ))}
              </select>
            </div>
            <JsonField
              id="start-variables"
              label="Variables (JSON)"
              rows={6}
              value={variables}
              onChange={(v) => {
                setVariables(v);
                setVariablesError('');
              }}
              error={variablesError}
            />
            <button
              type="submit"
              disabled={!selected || start.loading}
              className="w-full bg-blue-600 text-white px-4 py-2.5 rounded-xl hover:bg-blue-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
            >
              {start.loading ? 'Démarrage…' : 'Démarrer'}
            </button>
          </form>
          <JsonResult data={startResult} />
        </Card>
      </div>
    </div>
  );
}

export default AutomationWorkflows;
