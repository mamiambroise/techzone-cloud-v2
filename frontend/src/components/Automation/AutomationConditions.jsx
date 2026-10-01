import React, { useState } from 'react';
import { FunnelIcon, SparklesIcon, CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';
import { automationService } from '../services/apiClient.js';
import {
  PageHeader,
  Card,
  CloseButton,
  JsonField,
  JsonResult,
  useAction,
  parseJson,
  getErrorMessage,
} from '../components/automation/shared/index.js';

const DEFAULT_CONDITION = `{
  "logic": "AND",
  "conditions": [
    { "field": "invoice.total", "operator": "GT", "value": 100000 },
    { "field": "invoice.status", "operator": "EQ", "value": "VALIDATED" }
  ]
}`;

const DEFAULT_CONTEXT = `{
  "invoice": { "total": 150000, "status": "VALIDATED" }
}`;

function AutomationConditions() {
  const [condition, setCondition] = useState(DEFAULT_CONDITION);
  const [context, setContext] = useState(DEFAULT_CONTEXT);
  const [conditionError, setConditionError] = useState('');
  const [contextError, setContextError] = useState('');
  const [evalResult, setEvalResult] = useState(null);
  const [simResult, setSimResult] = useState(null);

  const parseBoth = () => {
    const cond = parseJson(condition, 'Condition JSON');
    const ctx = parseJson(context, 'Contexte JSON');
    setConditionError(cond.ok ? '' : cond.error);
    setContextError(ctx.ok ? '' : ctx.error);
    return cond.ok && ctx.ok ? { cond: cond.value, ctx: ctx.value } : null;
  };

  const evaluate = useAction(async () => {
    const p = parseBoth();
    if (!p) return;
    try {
      const res = await automationService.evaluateCondition(p.cond, p.ctx);
      setEvalResult(res.data);
    } catch (err) {
      setEvalResult({ error: getErrorMessage(err) });
    }
  });

  const simulate = useAction(async () => {
    const p = parseBoth();
    if (!p) return;
    try {
      const res = await automationService.simulateCondition(p.cond, p.ctx);
      setSimResult(res.data);
    } catch (err) {
      setSimResult({ error: getErrorMessage(err) });
    }
  });

  const busy = evaluate.loading || simulate.loading;
  const passed = Boolean(evalResult && !evalResult.error && evalResult.result);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Conditions & Formules"
        subtitle="Évaluez et simulez des conditions métier en temps réel"
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card icon={FunnelIcon} title="Condition (AST)">
          <div className="space-y-5">
            <JsonField
              id="condition-json"
              label="Expression de condition"
              rows={9}
              value={condition}
              onChange={(v) => {
                setCondition(v);
                setConditionError('');
              }}
              error={conditionError}
            />
            <JsonField
              id="condition-context"
              label="Contexte"
              rows={5}
              value={context}
              onChange={(v) => {
                setContext(v);
                setContextError('');
              }}
              error={contextError}
            />
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => evaluate.run()}
                disabled={busy}
                className="flex-1 inline-flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-xl hover:bg-blue-700 font-medium transition-colors text-sm disabled:opacity-60 disabled:cursor-wait focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
              >
                <CheckCircleIcon aria-hidden="true" className="w-4 h-4" />
                {evaluate.loading ? 'Évaluation…' : 'Évaluer'}
              </button>
              <button
                type="button"
                onClick={() => simulate.run()}
                disabled={busy}
                className="flex-1 inline-flex items-center justify-center gap-2 bg-violet-600 text-white px-4 py-2.5 rounded-xl hover:bg-violet-700 font-medium transition-colors text-sm disabled:opacity-60 disabled:cursor-wait focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-600"
              >
                <SparklesIcon aria-hidden="true" className="w-4 h-4" />
                {simulate.loading ? 'Simulation…' : 'Simuler'}
              </button>
            </div>
          </div>
        </Card>

        <div className="space-y-6">
          {evalResult && (
            <Card
              icon={passed ? CheckCircleIcon : XCircleIcon}
              gradient={passed ? 'from-emerald-500 to-teal-600' : 'from-red-500 to-red-600'}
              title="Résultat"
              action={<CloseButton onClick={() => setEvalResult(null)} />}
            >
              {evalResult.error ? (
                <JsonResult data={evalResult} className="" />
              ) : (
                <div role="status" className="flex items-center gap-3">
                  {passed ? (
                    <CheckCircleIcon aria-hidden="true" className="w-8 h-8 text-emerald-500" />
                  ) : (
                    <XCircleIcon aria-hidden="true" className="w-8 h-8 text-red-500" />
                  )}
                  <p className={`text-2xl font-bold ${passed ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                    {passed ? 'VRAI (true)' : 'FAUX (false)'}
                  </p>
                </div>
              )}
            </Card>
          )}

          {simResult && (
            <Card
              icon={SparklesIcon}
              gradient="from-violet-500 to-purple-600"
              title="Trace de simulation"
              action={<CloseButton onClick={() => setSimResult(null)} />}
            >
              <JsonResult data={simResult} maxHeight="max-h-96" className="" />
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

export default AutomationConditions;
