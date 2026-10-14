import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Activity,
  Bell,
  AlertCircle,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  CircleHelp,
  Clock3,
  GitBranch,
  LoaderCircle,
  Plus,
  Play,
  RefreshCw,
  Save,
  Send,
  Settings2,
  Sparkles,
  Square,
  Trash2,
  Workflow,
  Zap,
} from 'lucide-react';
import { automationService } from '../services/apiClient.js';

const createWorkflow = () => ({
  code: 'workflow.nouveau',
  nom: 'Nouveau workflow',
  lifecycle: 'DRAFT',
  version: '1.0',
  maxSteps: 20,
  steps: [
    { id: 'start', type: 'START', name: 'Début', next: 'action-1' },
    { id: 'action-1', type: 'ACTION', name: 'Envoyer une notification', actionRef: 'send.notification', next: 'end' },
    { id: 'end', type: 'END', name: 'Fin' },
  ],
});

const fieldClass = 'w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100';
const labelClass = 'mb-1.5 block text-xs font-semibold text-slate-500';

function getErrorMessage(error) {
  const message = error?.response?.data?.message || error?.normalized?.message || error?.message;
  return Array.isArray(message) ? message.join(', ') : message || 'Une erreur inattendue est survenue.';
}

function StatusBadge({ status }) {
  const style = {
    ACTIVE: 'bg-emerald-50 text-emerald-700 ring-emerald-600/15',
    READY: 'bg-blue-50 text-blue-700 ring-blue-600/15',
    PAUSED: 'bg-amber-50 text-amber-700 ring-amber-600/15',
    FAILED: 'bg-rose-50 text-rose-700 ring-rose-600/15',
    SUCCEEDED: 'bg-emerald-50 text-emerald-700 ring-emerald-600/15',
    RUNNING: 'bg-sky-50 text-sky-700 ring-sky-600/15',
    DRAFT: 'bg-slate-100 text-slate-600 ring-slate-500/15',
  };
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1 ring-inset ${style[status] || style.DRAFT}`}>
      <span className="mr-1.5 h-1.5 w-1.5 rounded-full bg-current" />
      {status || 'DRAFT'}
    </span>
  );
}

function StepIcon({ type }) {
  const classes = 'h-4 w-4';
  if (type === 'START') return <Play className={classes} />;
  if (type === 'END') return <Square className={classes} />;
  if (type === 'CONDITION') return <GitBranch className={classes} />;
  if (type === 'ACTION') return <Zap className={classes} />;
  return <Workflow className={classes} />;
}

function MetricCard({ label, value, detail, icon: Icon, tone }) {
  const tones = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-emerald-50 text-emerald-600',
    orange: 'bg-orange-50 text-orange-600',
    violet: 'bg-violet-50 text-violet-600',
  };
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-slate-500">{label}</span>
        <span className={`flex h-8 w-8 items-center justify-center rounded-lg ${tones[tone]}`}>
          <Icon className="h-4 w-4" />
        </span>
      </div>
      <div className="mt-3 flex items-end justify-between">
        <strong className="text-2xl font-bold tracking-tight text-slate-900">{value}</strong>
        <span className="text-[11px] text-slate-400">{detail}</span>
      </div>
    </div>
  );
}

function WorkflowEditor({ initialWorkflow, actions, onCancel, onSaved }) {
  const [definition, setDefinition] = useState(() => structuredClone(initialWorkflow || createWorkflow()));
  const [savedDefinition, setSavedDefinition] = useState(() => initialWorkflow ? structuredClone(initialWorkflow) : null);
  const [isNewWorkflow, setIsNewWorkflow] = useState(!initialWorkflow);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [validation, setValidation] = useState(null);
  const [variables, setVariables] = useState('{\n  "approved": true,\n  "invoice": { "total": 120000 }\n}');
  const [runResult, setRunResult] = useState(null);
  const [error, setError] = useState('');

  const actionOptions = useMemo(
    () => actions.map((action) => ({ value: action.code, label: action.code, category: action.category })),
    [actions],
  );

  const updateStep = (stepId, changes) => {
    setDefinition((current) => ({
      ...current,
      steps: current.steps.map((step) => step.id === stepId ? { ...step, ...changes } : step),
    }));
    setValidation(null);
  };

  const addStep = (type) => {
    const id = `${type.toLowerCase()}-${Date.now().toString(36)}`;
    const terminal = definition.steps.find((step) => step.type === 'END');
    const beforeEnd = definition.steps.filter((step) => step.type !== 'END');
    const newStep = type === 'CONDITION'
      ? {
          id,
          type,
          name: 'Nouvelle condition',
          condition: { field: 'invoice.total', operator: 'GT', value: 50000 },
          transitions: { YES: terminal?.id || 'end', NO: terminal?.id || 'end' },
        }
      : {
          id,
          type,
          name: type === 'ACTION' ? 'Nouvelle action' : 'Nouvelle étape',
          ...(type === 'ACTION' ? { actionRef: actionOptions[0]?.value || 'send.notification' } : {}),
          next: terminal?.id || 'end',
        };

    const previous = beforeEnd[beforeEnd.length - 1];
    const steps = definition.steps.map((step) => {
      if (step.id !== previous?.id) return step;
      if (step.type === 'CONDITION') {
        return { ...step, transitions: { ...step.transitions, YES: id } };
      }
      return { ...step, next: id };
    });
    const endIndex = steps.findIndex((step) => step.type === 'END');
    steps.splice(endIndex < 0 ? steps.length : endIndex, 0, newStep);
    setDefinition((current) => ({ ...current, steps }));
    setValidation(null);
  };

  const removeStep = (stepId) => {
    const removed = definition.steps.find((step) => step.id === stepId);
    if (!removed || removed.type === 'START' || removed.type === 'END') return;
    const fallback = removed.type === 'CONDITION'
      ? removed.transitions?.YES || removed.transitions?.NO
      : removed.next;
    setDefinition((current) => ({
      ...current,
      steps: current.steps
        .filter((step) => step.id !== stepId)
        .map((step) => ({
          ...step,
          ...(step.next === stepId ? { next: fallback || 'end' } : {}),
          ...(step.transitions ? {
            transitions: Object.fromEntries(
              Object.entries(step.transitions).map(([key, target]) => [key, target === stepId ? fallback || 'end' : target]),
            ),
          } : {}),
        })),
    }));
    setValidation(null);
  };

  const save = async (event) => {
    event?.preventDefault();
    setError('');
    setValidation(null);
    setSaving(true);
    try {
      const payload = { ...definition, lifecycle: 'DRAFT', version: definition.version || '1.0' };
      const response = isNewWorkflow
        ? await automationService.createWorkflow(payload)
        : await automationService.updateWorkflow(definition.code, payload);
      const saved = response.data;
      setDefinition(saved);
      setSavedDefinition(structuredClone(saved));
      setIsNewWorkflow(false);
      onSaved(saved);
      return saved;
    } catch (saveError) {
      setError(getErrorMessage(saveError));
      return null;
    } finally {
      setSaving(false);
    }
  };

  const validate = async () => {
    const saved = await save();
    if (!saved) return false;
    try {
      const response = await automationService.validateWorkflow(saved.code);
      setValidation(response.data);
      if (!response.data.valid) setError(response.data.errors.join(' · '));
      else setError('');
      return response.data.valid;
    } catch (validateError) {
      setError(getErrorMessage(validateError));
      return false;
    }
  };

  const publish = async () => {
    setPublishing(true);
    setError('');
    try {
      if (!(await validate())) return;
      const response = await automationService.setWorkflowLifecycle(definition.code, 'ACTIVE');
      setDefinition(response.data);
      setSavedDefinition(structuredClone(response.data));
      onSaved(response.data);
      setValidation({ valid: true, errors: [] });
    } catch (publishError) {
      setError(getErrorMessage(publishError));
    } finally {
      setPublishing(false);
    }
  };

  const testWorkflow = async () => {
    setTesting(true);
    setRunResult(null);
    setError('');
    if (!savedDefinition || !['ACTIVE', 'READY'].includes(savedDefinition.lifecycle)) {
      setRunResult({ error: 'Enregistrez et publiez ce workflow avant de le tester.' });
      setTesting(false);
      return;
    }
    if (JSON.stringify(definition) !== JSON.stringify(savedDefinition)) {
      setRunResult({ error: 'Enregistrez vos modifications et republiez le workflow avant de le tester.' });
      setTesting(false);
      return;
    }
    let parsedVariables;
    try {
      parsedVariables = JSON.parse(variables);
      if (!parsedVariables || Array.isArray(parsedVariables) || typeof parsedVariables !== 'object') {
        throw new Error('Les variables doivent être un objet JSON.');
      }
    } catch (parseError) {
      setRunResult({ error: parseError.message || 'Variables JSON invalides.' });
      setTesting(false);
      return;
    }
    try {
      const result = await automationService.startWorkflow(savedDefinition.code, parsedVariables);
      setRunResult(result.data);
      onSaved(savedDefinition, true);
    } catch (testError) {
      setRunResult({ error: getErrorMessage(testError) });
    } finally {
      setTesting(false);
    }
  };

  const stepTargets = definition.steps.map((step) => ({ value: step.id, label: step.name || step.id }));
  const setCode = (value) => value.trim().toLowerCase().replace(/[^a-z0-9._-]+/g, '-');

  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-5 py-4">
        <div className="flex items-center gap-3">
          <button type="button" onClick={onCancel} className="rounded-lg border border-slate-200 p-2 text-slate-500 hover:bg-slate-50" aria-label="Retour aux workflows">
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-blue-600">{initialWorkflow ? 'Éditeur de workflow' : 'Nouveau workflow'}</p>
            <h2 className="mt-0.5 text-lg font-bold text-slate-900">Construisez votre automatisation</h2>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={validate} disabled={saving || publishing} className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50">
            <CheckCircle2 className="h-4 w-4" /> Valider
          </button>
          <button type="button" onClick={save} disabled={saving || publishing} className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50">
            {saving ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Enregistrer
          </button>
          <button type="button" onClick={publish} disabled={saving || publishing} className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50">
            {publishing ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />} Publier
          </button>
        </div>
      </div>

      <form onSubmit={save} className="grid gap-0 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-5 border-b border-slate-100 p-5 xl:border-b-0 xl:border-r">
          <div className="grid gap-4 sm:grid-cols-2">
            <label>
              <span className={labelClass}>Nom du workflow</span>
              <input className={fieldClass} value={definition.nom} onChange={(event) => setDefinition((current) => ({ ...current, nom: event.target.value }))} required />
            </label>
            <label>
              <span className={labelClass}>Code unique</span>
              <input className={`${fieldClass} font-mono`} value={definition.code} disabled={Boolean(initialWorkflow)} onChange={(event) => setDefinition((current) => ({ ...current, code: setCode(event.target.value) }))} required />
            </label>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-slate-800">Éditeur visuel</h3>
              <p className="mt-1 text-xs text-slate-500">Ajoutez des étapes puis reliez-les pour définir le parcours d’exécution.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={() => addStep('ACTION')} className="inline-flex items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-700 hover:bg-blue-100"><Plus className="h-3.5 w-3.5" /> Action</button>
              <button type="button" onClick={() => addStep('CONDITION')} className="inline-flex items-center gap-1.5 rounded-lg border border-violet-200 bg-violet-50 px-3 py-2 text-xs font-semibold text-violet-700 hover:bg-violet-100"><Plus className="h-3.5 w-3.5" /> Condition</button>
              <button type="button" onClick={() => addStep('STEP')} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"><Plus className="h-3.5 w-3.5" /> Étape</button>
            </div>
          </div>

          <div className="relative space-y-3">
            {definition.steps.map((step, index) => {
              const isStart = step.type === 'START';
              const isEnd = step.type === 'END';
              const accent = step.type === 'ACTION' ? 'border-blue-200 bg-blue-50/60' : step.type === 'CONDITION' ? 'border-violet-200 bg-violet-50/50' : isStart || isEnd ? 'border-emerald-200 bg-emerald-50/50' : 'border-slate-200 bg-white';
              const iconTone = step.type === 'ACTION' ? 'bg-blue-600 text-white' : step.type === 'CONDITION' ? 'bg-violet-600 text-white' : 'bg-emerald-600 text-white';
              return (
                <React.Fragment key={step.id}>
                  <article className={`relative rounded-xl border p-4 ${accent}`}>
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-3">
                        <span className={`flex h-8 w-8 items-center justify-center rounded-lg ${iconTone}`}><StepIcon type={step.type} /></span>
                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Étape {index + 1} · {step.type}</p>
                          <input aria-label={`Nom de l'étape ${index + 1}`} value={step.name || ''} onChange={(event) => updateStep(step.id, { name: event.target.value })} className="mt-0.5 w-full border-0 bg-transparent p-0 text-sm font-semibold text-slate-800 outline-none" />
                        </div>
                      </div>
                      {!isStart && !isEnd && (
                        <button type="button" onClick={() => removeStep(step.id)} className="rounded-md p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600" aria-label={`Supprimer ${step.name || 'étape'}`}><Trash2 className="h-4 w-4" /></button>
                      )}
                    </div>
                    {step.type === 'ACTION' && (
                      <div className="mt-4 grid gap-3 sm:grid-cols-2">
                        <label>
                          <span className={labelClass}>Action</span>
                          <select className={fieldClass} value={step.actionRef || ''} onChange={(event) => updateStep(step.id, { actionRef: event.target.value })} required>
                            <option value="">Sélectionner une action</option>
                            {actionOptions.map((action) => <option key={action.value} value={action.value}>{action.label} · {action.category}</option>)}
                          </select>
                        </label>
                        <label>
                          <span className={labelClass}>Étape suivante</span>
                          <select className={fieldClass} value={step.next || ''} onChange={(event) => updateStep(step.id, { next: event.target.value })}>
                            <option value="">Choisir une étape</option>
                            {stepTargets.filter((target) => target.value !== step.id).map((target) => <option key={target.value} value={target.value}>{target.label}</option>)}
                          </select>
                        </label>
                      </div>
                    )}
                    {step.type === 'CONDITION' && (
                      <div className="mt-4 space-y-3">
                        <div className="grid gap-3 sm:grid-cols-[1fr_140px_1fr]">
                          <label>
                            <span className={labelClass}>Champ</span>
                            <input className={fieldClass} value={step.condition?.field || ''} onChange={(event) => updateStep(step.id, { condition: { ...step.condition, field: event.target.value } })} placeholder="invoice.total" />
                          </label>
                          <label>
                            <span className={labelClass}>Opérateur</span>
                            <select className={fieldClass} value={step.condition?.operator || 'GT'} onChange={(event) => updateStep(step.id, { condition: { ...step.condition, operator: event.target.value } })}>
                              {['EQ', 'NE', 'GT', 'GTE', 'LT', 'LTE', 'CONTAINS'].map((operator) => <option key={operator} value={operator}>{operator}</option>)}
                            </select>
                          </label>
                          <label>
                            <span className={labelClass}>Valeur</span>
                            <input className={fieldClass} value={step.condition?.value ?? ''} onChange={(event) => {
                              const value = event.target.value;
                              updateStep(step.id, { condition: { ...step.condition, value: value.trim() !== '' && !Number.isNaN(Number(value)) ? Number(value) : value } });
                            }} />
                          </label>
                        </div>
                        <div className="grid gap-3 sm:grid-cols-2">
                          {['YES', 'NO'].map((branch) => (
                            <label key={branch}>
                              <span className={labelClass}>Si {branch === 'YES' ? 'vrai' : 'faux'}, aller à</span>
                              <select className={fieldClass} value={step.transitions?.[branch] || ''} onChange={(event) => updateStep(step.id, { transitions: { ...step.transitions, [branch]: event.target.value } })}>
                                <option value="">Choisir une étape</option>
                                {stepTargets.filter((target) => target.value !== step.id).map((target) => <option key={target.value} value={target.value}>{target.label}</option>)}
                              </select>
                            </label>
                          ))}
                        </div>
                      </div>
                    )}
                    {step.type === 'STEP' && !isStart && !isEnd && (
                      <label className="mt-4 block">
                        <span className={labelClass}>Étape suivante</span>
                        <select className={fieldClass} value={step.next || ''} onChange={(event) => updateStep(step.id, { next: event.target.value })}>
                          <option value="">Choisir une étape</option>
                          {stepTargets.filter((target) => target.value !== step.id).map((target) => <option key={target.value} value={target.value}>{target.label}</option>)}
                        </select>
                      </label>
                    )}
                    {(isStart || isEnd) && <p className="mt-2 text-xs text-slate-500">{isStart ? 'Point de départ du workflow' : 'Fin du parcours'}</p>}
                  </article>
                  {index < definition.steps.length - 1 && (
                    <div className="flex justify-center text-slate-300"><ArrowDown className="h-4 w-4" /></div>
                  )}
                </React.Fragment>
              );
            })}
          </div>
          {validation && (
            <div className={`flex items-start gap-2 rounded-lg p-3 text-sm ${validation.valid ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
              {validation.valid ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" /> : <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />}
              <span>{validation.valid ? 'Workflow valide : les étapes, actions et transitions sont configurées.' : validation.errors.join(' · ')}</span>
            </div>
          )}
          {error && <p role="alert" className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">{error}</p>}
        </div>

        <aside className="space-y-5 bg-slate-50/70 p-5">
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <div className="flex items-center gap-2 text-sm font-bold text-slate-800"><Settings2 className="h-4 w-4 text-slate-500" /> Paramètres</div>
            <label className="mt-4 block">
              <span className={labelClass}>Nombre maximal d’étapes</span>
              <input className={fieldClass} type="number" min="1" max="100" value={definition.maxSteps || 20} onChange={(event) => setDefinition((current) => ({ ...current, maxSteps: Number(event.target.value) }))} />
            </label>
            <div className="mt-3 flex items-start gap-2 rounded-lg bg-blue-50 p-3 text-xs leading-relaxed text-blue-800">
              <CircleHelp className="mt-0.5 h-4 w-4 shrink-0" />
              Une exécution ne dépassera pas cette limite, ce qui protège contre les boucles.
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <div className="flex items-center gap-2 text-sm font-bold text-slate-800"><Play className="h-4 w-4 text-emerald-600" /> Test manuel</div>
            <p className="mt-1 text-xs text-slate-500">Lancez un workflow publié et inspectez le résultat de chaque étape.</p>
            <label className="mt-4 block">
              <span className={labelClass}>Variables d’entrée (JSON)</span>
              <textarea rows="6" className={`${fieldClass} font-mono text-xs`} value={variables} onChange={(event) => setVariables(event.target.value)} spellCheck="false" />
            </label>
            <button type="button" onClick={testWorkflow} disabled={testing || saving} className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 px-3 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50">
              {testing ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />} Tester le workflow
            </button>
            {runResult && (
              <pre className={`mt-3 max-h-64 overflow-auto rounded-lg p-3 text-[11px] ${runResult.error ? 'bg-rose-50 text-rose-700' : 'bg-slate-900 text-emerald-300'}`}>
                {JSON.stringify(runResult, null, 2)}
              </pre>
            )}
          </div>
        </aside>
      </form>
    </section>
  );
}

function AutomationWorkflows() {
  const [workflows, setWorkflows] = useState([]);
  const [executions, setExecutions] = useState([]);
  const [actions, setActions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editor, setEditor] = useState(null);
  const [selectedExecution, setSelectedExecution] = useState(null);
  const [search, setSearch] = useState('');

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [workflowResponse, executionResponse, actionResponse] = await Promise.all([
        automationService.workflows(),
        automationService.executions(),
        automationService.actions(),
      ]);
      setWorkflows(Array.isArray(workflowResponse.data) ? workflowResponse.data : []);
      setExecutions(Array.isArray(executionResponse.data) ? executionResponse.data : []);
      setActions(Array.isArray(actionResponse.data) ? actionResponse.data : []);
    } catch (fetchError) {
      setError(`Impossible de charger les données Automation : ${getErrorMessage(fetchError)}`);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const filteredWorkflows = workflows.filter((workflow) =>
    `${workflow.nom} ${workflow.code} ${workflow.lifecycle}`.toLowerCase().includes(search.toLowerCase()),
  );
  const activeCount = workflows.filter((workflow) => workflow.lifecycle === 'ACTIVE').length;
  const succeededCount = executions.filter((execution) => execution.status === 'SUCCEEDED').length;
  const failedCount = executions.filter((execution) => execution.status === 'FAILED' || execution.status === 'TIMEOUT').length;
  const successRate = executions.length ? Math.round((succeededCount / executions.length) * 100) : 0;

  const saveWorkflow = (workflow, refresh = false) => {
    setWorkflows((current) => {
      const exists = current.some((item) => item.code === workflow.code);
      return exists ? current.map((item) => item.code === workflow.code ? workflow : item) : [workflow, ...current];
    });
    if (refresh) fetchData();
  };

  const changeLifecycle = async (workflow, lifecycle) => {
    setError('');
    try {
      const result = await automationService.setWorkflowLifecycle(workflow.code, lifecycle);
      saveWorkflow(result.data);
    } catch (lifecycleError) {
      setError(getErrorMessage(lifecycleError));
    }
  };

  if (editor) {
    return (
      <div className="mx-auto max-w-[1500px] space-y-4 p-4 md:p-6">
        <WorkflowEditor
          key={editor.code || 'new-workflow'}
          initialWorkflow={editor.isNew ? null : editor}
          actions={actions}
          onCancel={() => setEditor(null)}
          onSaved={(workflow, refresh) => saveWorkflow(workflow, refresh)}
        />
      </div>
    );
  }

  return (
    <main className="mx-auto max-w-[1500px] space-y-6 p-4 md:p-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-blue-600"><Workflow className="h-4 w-4" /> Techzone Cloud · Automation</div>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 md:text-3xl">Workflows</h1>
          <p className="mt-1 text-sm text-slate-500">Concevez, publiez et suivez vos automatisations sans code.</p>
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={fetchData} disabled={loading} className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 disabled:opacity-50">
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> Actualiser
          </button>
          <button type="button" onClick={() => setEditor({ ...createWorkflow(), isNew: true })} className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700">
            <Plus className="h-4 w-4" /> Nouveau workflow
          </button>
        </div>
      </header>

      {error && <div role="alert" className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700"><AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />{error}</div>}

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Workflows" value={workflows.length} detail="tous statuts" icon={Workflow} tone="blue" />
        <MetricCard label="Actifs" value={activeCount} detail="en production" icon={Zap} tone="green" />
        <MetricCard label="Exécutions" value={executions.length} detail="historique disponible" icon={Activity} tone="violet" />
        <MetricCard label="Taux de réussite" value={`${successRate}%`} detail={`${failedCount} en échec`} icon={CheckCircle2} tone="orange" />
      </section>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.35fr)_minmax(350px,0.9fr)]">
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-5 py-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Bibliothèque de workflows</h2>
              <p className="mt-1 text-xs text-slate-500">{workflows.length} définition(s) · {actions.length} action(s) disponible(s)</p>
            </div>
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Rechercher…" aria-label="Rechercher un workflow" className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-400 sm:w-52" />
          </div>
          {loading ? (
            <div className="flex items-center justify-center gap-2 px-6 py-16 text-sm text-slate-500"><LoaderCircle className="h-4 w-4 animate-spin" /> Chargement des workflows…</div>
          ) : filteredWorkflows.length === 0 ? (
            <div className="px-6 py-14 text-center">
              <Workflow className="mx-auto h-9 w-9 text-slate-300" />
              <p className="mt-3 text-sm font-semibold text-slate-700">{search ? 'Aucun résultat' : 'Aucun workflow pour le moment'}</p>
              {!search && <p className="mt-1 text-xs text-slate-500">Créez votre première automatisation ou partez d’un modèle.</p>}
              {!search && <button type="button" onClick={() => setEditor({ ...createWorkflow(), isNew: true })} className="mt-4 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white"><Plus className="h-4 w-4" /> Créer un workflow</button>}
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {filteredWorkflows.map((workflow) => (
                <article key={workflow.code} className="p-4 transition hover:bg-slate-50/70 md:px-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-semibold text-slate-900">{workflow.nom}</h3>
                        <StatusBadge status={workflow.lifecycle} />
                      </div>
                      <p className="mt-1 font-mono text-xs text-slate-400">{workflow.code} · v{workflow.version}</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-1.5">
                      <button type="button" onClick={() => setEditor(workflow)} className="rounded-md border border-slate-200 px-2.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-white">Modifier</button>
                      {workflow.lifecycle === 'ACTIVE' ? (
                        <button type="button" onClick={() => changeLifecycle(workflow, 'PAUSED')} className="rounded-md border border-amber-200 bg-amber-50 px-2.5 py-1.5 text-xs font-semibold text-amber-700 hover:bg-amber-100">Mettre en pause</button>
                      ) : (
                        <button type="button" onClick={() => changeLifecycle(workflow, 'ACTIVE')} className="rounded-md border border-emerald-200 bg-emerald-50 px-2.5 py-1.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-100">Publier</button>
                      )}
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap items-center gap-1.5">
                    {(workflow.steps || []).map((step) => (
                      <React.Fragment key={step.id}>
                        <span className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-2 py-1 text-[11px] font-medium text-slate-600">
                          <StepIcon type={step.type} />{step.name || step.type}
                        </span>
                        {step.type !== 'END' && <ArrowRight className="h-3 w-3 text-slate-300" />}
                      </React.Fragment>
                    ))}
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Historique d’exécution</h2>
              <p className="mt-1 text-xs text-slate-500">Résultats récents et détail des étapes.</p>
            </div>
            <Clock3 className="h-4 w-4 text-slate-400" />
          </div>
          {executions.length === 0 ? (
            <div className="px-6 py-12 text-center text-sm text-slate-400">Aucune exécution enregistrée.</div>
          ) : (
            <div className="divide-y divide-slate-100">
              {executions.slice(0, 7).map((execution) => (
                <button type="button" key={execution.executionId} onClick={() => setSelectedExecution(selectedExecution === execution.executionId ? null : execution.executionId)} className="block w-full px-5 py-3 text-left transition hover:bg-slate-50">
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate font-mono text-xs font-semibold text-slate-700">{execution.workflowCode}</span>
                    <StatusBadge status={execution.status} />
                  </div>
                  <div className="mt-1 flex items-center justify-between gap-2 text-[11px] text-slate-400">
                    <span className="truncate">{execution.executionId}</span>
                    <span>{execution.startedAt ? new Date(execution.startedAt).toLocaleString() : '—'}</span>
                  </div>
                  {selectedExecution === execution.executionId && (
                    <pre className="mt-3 max-h-52 overflow-auto rounded-lg bg-slate-900 p-3 text-[10px] leading-relaxed text-emerald-300">{JSON.stringify(execution.timeline || execution, null, 2)}</pre>
                  )}
                </button>
              ))}
            </div>
          )}
        </section>
      </div>

      <section className="rounded-2xl border border-blue-100 bg-gradient-to-r from-blue-50 to-indigo-50 p-4 md:p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-white text-blue-600 shadow-sm"><Sparkles className="h-5 w-5" /></span>
            <div>
              <h2 className="text-sm font-bold text-slate-900">Démarrer rapidement</h2>
              <p className="mt-1 text-xs text-slate-600">Créez une automatisation visuelle puis validez-la avant publication.</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => setEditor({ ...createWorkflow(), nom: 'Notification de commande', code: 'workflow.notification-commande', isNew: true })} className="inline-flex items-center gap-2 rounded-lg border border-blue-200 bg-white px-3 py-2 text-xs font-semibold text-blue-700 hover:bg-blue-50"><Bell className="h-3.5 w-3.5" /> Notification</button>
            <button type="button" onClick={() => setEditor({ ...createWorkflow(), nom: 'Validation de commande', code: 'workflow.validation-commande', steps: [
              { id: 'start', type: 'START', name: 'Commande créée', next: 'condition-1' },
              { id: 'condition-1', type: 'CONDITION', name: 'Montant supérieur à 50 000', condition: { field: 'invoice.total', operator: 'GT', value: 50000 }, transitions: { YES: 'action-1', NO: 'end' } },
              { id: 'action-1', type: 'ACTION', name: 'Envoyer une notification', actionRef: actions[0]?.code || 'send.notification', next: 'end' },
              { id: 'end', type: 'END', name: 'Fin' },
            ], isNew: true })} className="inline-flex items-center gap-2 rounded-lg border border-blue-200 bg-white px-3 py-2 text-xs font-semibold text-blue-700 hover:bg-blue-50"><GitBranch className="h-3.5 w-3.5" /> Validation par condition</button>
          </div>
        </div>
      </section>

      {actions.length === 0 && !loading && <p className="flex items-center gap-2 text-xs text-amber-700"><AlertCircle className="h-4 w-4" /> Aucune action n’est enregistrée côté moteur ; configurez-en une avant d’ajouter des étapes d’action.</p>}
    </main>
  );
}

export default AutomationWorkflows;
