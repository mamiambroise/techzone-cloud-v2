import React, { useState } from 'react';
import { ScaleIcon, PlayIcon, SparklesIcon, FunnelIcon } from '@heroicons/react/24/outline';
import { automationService } from '../services/apiClient.js';
import { ModernSpinner } from '../components/Loaders.jsx';
import {
  PageHeader,
  Card,
  CloseButton,
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

const DEFAULT_CONTEXT = '{\n  "invoice": { "total": 150000, "status": "VALIDATED" },\n  "stock": { "current": 3 }\n}';

const loadRules = async () => toArray((await automationService.rules()).data);

function AutomationRules() {
  const { data, loading, error, reload } = useAsync(loadRules);
  const rules = data ?? [];

  const [context, setContext] = useState(DEFAULT_CONTEXT);
  const [contextError, setContextError] = useState('');
  const [selectedRule, setSelectedRule] = useState(null);
  const [simResult, setSimResult] = useState(null);
  const [evalOutput, setEvalOutput] = useState(null);

  const readContext = () => {
    const parsed = parseJson(context, 'Contexte JSON');
    setContextError(parsed.ok ? '' : parsed.error);
    return parsed.ok ? parsed.value : null;
  };

  const simulate = useAction(async (ruleCode) => {
    const ctx = readContext();
    if (ctx === null) return;
    setSelectedRule(ruleCode);
    try {
      const res = await automationService.simulateRule(ruleCode, ctx);
      setSimResult(res.data);
    } catch (err) {
      setSimResult({ error: getErrorMessage(err, 'Erreur de simulation') });
    }
  });

  const evaluate = useAction(async () => {
    const ctx = readContext();
    if (ctx === null) return;
    try {
      const res = await automationService.evaluateRules(ctx);
      setEvalOutput(res.data);
    } catch (err) {
      setEvalOutput({ error: getErrorMessage(err) });
    }
  });

  const busy = simulate.loading || evaluate.loading;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Règles métier"
        subtitle="Gérez et évaluez les règles d'automatisation"
        onRefresh={reload}
        refreshing={loading}
      />

      {error && <ErrorBanner message={describeError('Impossible de charger les règles', error)} onRetry={reload} />}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card
          icon={ScaleIcon}
          title="Règles enregistrées"
          meta={`${rules.length} règle(s)`}
          padded={false}
          className="lg:col-span-2"
        >
          <div className="divide-y divide-slate-100 dark:divide-slate-700/60">
            {loading && rules.length === 0 ? (
              <div className="px-6 py-14 flex items-center justify-center">
                <ModernSpinner label="Chargement..." />
              </div>
            ) : rules.length === 0 ? (
              <div className="px-6 py-12 text-center text-slate-500 dark:text-slate-400 text-sm">Aucune règle</div>
            ) : (
              rules.map((r) => (
                <div key={r.code} className="px-6 py-4 hover:bg-slate-50/50 dark:hover:bg-slate-700/40 transition-colors">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-sm font-semibold text-slate-800 dark:text-slate-100">{r.code}</span>
                      <span className="text-sm text-slate-500 dark:text-slate-400">{r.nom}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <StatusBadge status={r.status} />
                      <span className="text-xs text-slate-500 dark:text-slate-400">v{r.version} · prio {r.priority}</span>
                      <button
                        type="button"
                        onClick={() => simulate.run(r.code)}
                        disabled={busy}
                        className="inline-flex items-center gap-1.5 text-sm text-violet-600 dark:text-violet-400 hover:text-violet-800 dark:hover:text-violet-300 font-medium transition-colors disabled:opacity-60 disabled:cursor-wait focus-visible:outline-2 focus-visible:outline-violet-600 rounded"
                      >
                        <PlayIcon aria-hidden="true" className="w-4 h-4" />
                        Simuler
                      </button>
                    </div>
                  </div>
                  <pre className="mt-3 bg-slate-50 dark:bg-slate-700/40 rounded-xl p-3 text-xs text-slate-600 dark:text-slate-300 overflow-x-auto border border-slate-100 dark:border-slate-700/60">
                    {JSON.stringify(r.conditions, null, 1)}
                  </pre>
                  {(r.effects || []).length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {r.effects.map((ef, i) => (
                        <span
                          key={`${ef}-${i}`}
                          className="inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800/60 font-medium"
                        >
                          <FunnelIcon aria-hidden="true" className="w-3 h-3" />
                          {ef}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </Card>

        <div className="space-y-6">
          <Card icon={SparklesIcon} gradient="from-emerald-500 to-teal-600" title="Évaluer toutes les règles actives">
            <JsonField
              id="rules-context"
              label="Contexte (JSON)"
              rows={6}
              value={context}
              onChange={(v) => {
                setContext(v);
                setContextError('');
              }}
              error={contextError}
            />
            <button
              type="button"
              onClick={() => evaluate.run()}
              disabled={busy}
              className="mt-4 w-full bg-blue-600 text-white px-4 py-2.5 rounded-xl hover:bg-blue-700 font-medium transition-colors text-sm disabled:opacity-60 disabled:cursor-wait focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
            >
              {evaluate.loading ? 'Évaluation…' : 'Évaluer'}
            </button>
            <JsonResult data={evalOutput} />
          </Card>

          {simResult && (
            <Card
              icon={PlayIcon}
              gradient="from-violet-500 to-purple-600"
              title="Simulation"
              subtitle={selectedRule}
              action={<CloseButton onClick={() => setSimResult(null)} />}
            >
              <JsonResult data={simResult} className="" />
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

export default AutomationRules;
