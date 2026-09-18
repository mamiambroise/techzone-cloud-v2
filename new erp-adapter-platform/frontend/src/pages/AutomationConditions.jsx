import React, { useState } from 'react';
import {
  FunnelIcon,
  SparklesIcon,
  CheckCircleIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline';
import { automationService } from '../services/api';

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
  const [evalResult, setEvalResult] = useState(null);
  const [simResult, setSimResult] = useState(null);

  const parse = () => {
    let cond, ctx;
    try { cond = JSON.parse(condition); } catch { alert('Condition JSON invalide'); return null; }
    try { ctx = JSON.parse(context); } catch { alert('Contexte JSON invalide'); return null; }
    return { cond, ctx };
  };

  const runEvaluate = async (e) => {
    e.preventDefault();
    const p = parse();
    if (!p) return;
    try {
      const res = await automationService.evaluateCondition(p.cond, p.ctx);
      setEvalResult(res.data);
    } catch (err) {
      setEvalResult({ error: err.response?.data?.message || err.message });
    }
  };

  const runSimulate = async (e) => {
    e.preventDefault();
    const p = parse();
    if (!p) return;
    try {
      const res = await automationService.simulateCondition(p.cond, p.ctx);
      setSimResult(res.data);
    } catch (err) {
      setSimResult({ error: err.response?.data?.message || err.message });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Conditions & Formules</h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Évaluez et simulez des conditions métier en temps réel</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
          <div className="flex items-center gap-3 px-6 py-4 border-b border-slate-100 dark:border-slate-700/60">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-md">
              <FunnelIcon className="w-5 h-5 text-white" />
            </div>
            <h3 className="font-semibold text-slate-800 dark:text-slate-100">Condition (AST)</h3>
          </div>
          <div className="p-6 space-y-5">
            <div>
              <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5">Expression de condition</label>
              <textarea rows="9" value={condition} onChange={(e) => setCondition(e.target.value)} className="w-full border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-slate-50 dark:bg-slate-700/40 text-slate-700 dark:text-slate-200" />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5">Contexte</label>
              <textarea rows="5" value={context} onChange={(e) => setContext(e.target.value)} className="w-full border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-slate-50 dark:bg-slate-700/40 text-slate-700 dark:text-slate-200" />
            </div>

            <div className="flex gap-3">
              <button onClick={runEvaluate} className="flex-1 inline-flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-xl hover:bg-blue-700 font-medium transition-colors text-sm">
                <CheckCircleIcon className="w-4 h-4" />
                Évaluer
              </button>
              <button onClick={runSimulate} className="flex-1 inline-flex items-center justify-center gap-2 bg-violet-600 text-white px-4 py-2.5 rounded-xl hover:bg-violet-700 font-medium transition-colors text-sm">
                <SparklesIcon className="w-4 h-4" />
                Simuler
              </button>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {evalResult && (
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-700/60">
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center shadow-md ${evalResult.error ? 'bg-gradient-to-br from-red-500 to-red-600' : evalResult.result ? 'bg-gradient-to-br from-emerald-500 to-teal-600' : 'bg-gradient-to-br from-red-500 to-red-600'}`}>
                    {evalResult.error ? (
                      <XCircleIcon className="w-5 h-5 text-white" />
                    ) : evalResult.result ? (
                      <CheckCircleIcon className="w-5 h-5 text-white" />
                    ) : (
                      <XCircleIcon className="w-5 h-5 text-white" />
                    )}
                  </div>
                  <h3 className="font-semibold text-slate-800 dark:text-slate-100">Résultat</h3>
                </div>
                <button onClick={() => setEvalResult(null)} className="text-sm text-slate-400 dark:text-slate-500 hover:text-slate-600 transition-colors">Fermer</button>
              </div>
              <div className="p-6">
                {evalResult.error ? (
                  <p className="text-red-600 dark:text-red-400 text-sm">{evalResult.error}</p>
                ) : (
                  <div className="flex items-center gap-3">
                    {evalResult.result ? (
                      <CheckCircleIcon className="w-8 h-8 text-emerald-500" />
                    ) : (
                      <XCircleIcon className="w-8 h-8 text-red-500" />
                    )}
                    <p className={`text-2xl font-bold ${evalResult.result ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                      {evalResult.result ? 'VRAI (true)' : 'FAUX (false)'}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {simResult && (
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-700/60">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-md">
                    <SparklesIcon className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="font-semibold text-slate-800 dark:text-slate-100">Trace de simulation</h3>
                </div>
                <button onClick={() => setSimResult(null)} className="text-sm text-slate-400 dark:text-slate-500 hover:text-slate-600 transition-colors">Fermer</button>
              </div>
              <div className="p-6">
                <pre className="bg-slate-900 text-emerald-400 rounded-xl p-4 text-xs overflow-x-auto max-h-96">
                  {JSON.stringify(simResult, null, 2)}
                </pre>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default AutomationConditions;
