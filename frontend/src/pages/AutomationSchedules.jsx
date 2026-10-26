import React, { useCallback, useEffect, useState } from 'react';
import { AlertCircle, CalendarClock, Pause, Play, Plus, RefreshCw, Trash2 } from 'lucide-react';
import { automationService } from '../services/apiClient.js';

const inputClass = 'w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100';

function errorMessage(error) {
  const message = error?.response?.data?.message || error?.normalized?.message || error?.message;
  return Array.isArray(message) ? message.join(', ') : message || 'Une erreur est survenue.';
}

function formatDate(value) {
  return value ? new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value)) : '—';
}

export default function AutomationSchedules() {
  const [schedules, setSchedules] = useState([]);
  const [workflows, setWorkflows] = useState([]);
  const [workerEnabled, setWorkerEnabled] = useState(false);
  const [workflowCode, setWorkflowCode] = useState('');
  const [frequencyMinutes, setFrequencyMinutes] = useState(60);
  const [timezone, setTimezone] = useState(Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [scheduleResponse, workflowResponse, statusResponse] = await Promise.all([
        automationService.schedules(),
        automationService.workflows(),
        automationService.scheduleStatus(),
      ]);
      setSchedules(scheduleResponse.data);
      const runnable = workflowResponse.data.filter((workflow) => ['READY', 'ACTIVE'].includes(workflow.lifecycle));
      setWorkflows(runnable);
      setWorkerEnabled(statusResponse.data.enabled);
      setWorkflowCode((current) => current || runnable[0]?.code || '');
    } catch (loadError) {
      setError(errorMessage(loadError));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const create = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    try {
      await automationService.createSchedule({ workflowCode, frequencyMinutes: Number(frequencyMinutes), timezone });
      await load();
    } catch (createError) {
      setError(errorMessage(createError));
    } finally {
      setSaving(false);
    }
  };

  const setEnabled = async (schedule) => {
    setError('');
    try {
      await automationService.updateSchedule(schedule.id, { enabled: !schedule.enabled });
      await load();
    } catch (updateError) {
      setError(errorMessage(updateError));
    }
  };

  const remove = async (schedule) => {
    setError('');
    try {
      await automationService.deleteSchedule(schedule.id);
      await load();
    } catch (deleteError) {
      setError(errorMessage(deleteError));
    }
  };

  return (
    <main className="mx-auto w-full max-w-6xl space-y-6 p-4 sm:p-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-amber-600">Automatisation</p>
          <h1 className="mt-1 text-2xl font-bold text-slate-900">Planifications</h1>
          <p className="mt-1 max-w-2xl text-sm text-slate-500">Planifiez les workflows READY ou ACTIVE de votre tenant.</p>
        </div>
        <button type="button" onClick={() => void load()} disabled={loading} className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50">
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> Actualiser
        </button>
      </header>

      {!workerEnabled && (
        <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          Les planifications sont persistées, mais le worker serveur est désactivé. Définissez AUTOMATION_SCHEDULER_ENABLED=true sur le backend pour déclencher les exécutions.
        </div>
      )}
      {error && <div role="alert" className="flex items-start gap-2 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700"><AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />{error}</div>}

      <form onSubmit={create} className="grid gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr_auto] lg:items-end">
        <label>
          <span className="mb-1.5 block text-xs font-semibold text-slate-500">Workflow</span>
          <select className={inputClass} value={workflowCode} onChange={(event) => setWorkflowCode(event.target.value)} required disabled={!workflows.length}>
            <option value="">Sélectionner un workflow</option>
            {workflows.map((workflow) => <option key={workflow.code} value={workflow.code}>{workflow.nom} · {workflow.code}</option>)}
          </select>
        </label>
        <label>
          <span className="mb-1.5 block text-xs font-semibold text-slate-500">Fréquence (minutes)</span>
          <input className={inputClass} type="number" min="1" max="10080" value={frequencyMinutes} onChange={(event) => setFrequencyMinutes(event.target.value)} required />
        </label>
        <label>
          <span className="mb-1.5 block text-xs font-semibold text-slate-500">Fuseau horaire</span>
          <input className={inputClass} value={timezone} onChange={(event) => setTimezone(event.target.value)} placeholder="Europe/Paris" required />
        </label>
        <button type="submit" disabled={saving || !workflowCode} className="inline-flex items-center justify-center gap-2 rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-600 disabled:opacity-50">
          <Plus className="h-4 w-4" /> {saving ? 'Création…' : 'Planifier'}
        </button>
      </form>

      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-4 py-3">
          <h2 className="font-semibold text-slate-900">Planifications du tenant</h2>
        </div>
        {loading ? <p className="p-6 text-sm text-slate-500">Chargement…</p> : schedules.length === 0 ? (
          <div className="p-8 text-center">
            <CalendarClock className="mx-auto h-8 w-8 text-slate-400" />
            <p className="mt-3 font-semibold text-slate-800">Aucune planification</p>
            <p className="mt-1 text-sm text-slate-500">Créez une planification pour démarrer.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {schedules.map((schedule) => (
              <article key={schedule.id} className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-semibold text-slate-900">{schedule.workflow.name}</h3>
                    <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${schedule.enabled ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>{schedule.enabled ? 'Active' : 'Suspendue'}</span>
                  </div>
                  <p className="mt-1 text-xs text-slate-500">{schedule.workflow.code} · toutes les {schedule.frequencyMinutes} min · {schedule.timezone}</p>
                  <p className="mt-2 text-xs text-slate-600">Prochaine exécution : {formatDate(schedule.nextRunAt)} · Dernière : {schedule.lastRunStatus || 'Jamais exécutée'}{schedule.lastRunAt ? ` (${formatDate(schedule.lastRunAt)})` : ''}</p>
                  {schedule.lastRunError && <p className="mt-1 text-xs text-rose-700">{schedule.lastRunError}</p>}
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <button type="button" onClick={() => void setEnabled(schedule)} aria-label={schedule.enabled ? 'Suspendre la planification' : 'Activer la planification'} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50">
                    {schedule.enabled ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}{schedule.enabled ? 'Suspendre' : 'Activer'}
                  </button>
                  <button type="button" onClick={() => void remove(schedule)} aria-label="Supprimer la planification" className="rounded-lg border border-rose-100 p-2 text-rose-600 hover:bg-rose-50"><Trash2 className="h-4 w-4" /></button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
