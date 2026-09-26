import React, { useState, useEffect } from 'react';
import {
  BoltIcon,
  PlayIcon,
  RssIcon,
  XCircleIcon,
  ArrowPathRoundedSquareIcon,
  FunnelIcon,
  SignalIcon,
} from '@heroicons/react/24/outline';
import { automationService } from '../services/apiClient.js';
import { ModernSpinner } from '../components/Loaders.jsx';

function AutomationTriggers() {
  const [triggers, setTriggers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [fireCode, setFireCode] = useState('');
  const [fireVars, setFireVars] = useState('{}');
  const [fireResult, setFireResult] = useState(null);
  const [eventPayload, setEventPayload] = useState('{\n  "eventType": "invoice.created",\n  "source": "erp",\n  "data": {}\n}');
  const [eventResult, setEventResult] = useState(null);

  const fetchTriggers = async () => {
    try {
      setLoading(true);
      const res = await automationService.triggers();
      setTriggers(res.data);
    } catch (err) {
      setError('Impossible de charger les triggers');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchTriggers(); }, []);

  const runFire = async (e) => {
    e.preventDefault();
    setFireResult(null);
    let vars = {};
    try { vars = JSON.parse(fireVars); } catch { alert('JSON de variables invalide'); return; }
    try {
      const res = await automationService.fireTrigger(fireCode, vars);
      setFireResult(res.data);
    } catch (err) {
      setFireResult({ error: err.response?.data?.message || err.message });
    }
  };

  const runEvent = async (e) => {
    e.preventDefault();
    setEventResult(null);
    let payload = {};
    try { payload = JSON.parse(eventPayload); } catch { alert('JSON invalide'); return; }
    try {
      const res = await automationService.processEvent(payload);
      setEventResult(res.data);
    } catch (err) {
      setEventResult({ error: err.response?.data?.message || err.message });
    }
  };

  const typeBadge = (t) => {
    const map = {
      EVENT: 'bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300',
      DATA_CHANGE: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
      MANUAL: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
      SCHEDULE: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
    };
    const dotColor = {
      EVENT: 'bg-violet-500',
      DATA_CHANGE: 'bg-blue-500',
      MANUAL: 'bg-emerald-500',
      SCHEDULE: 'bg-amber-500',
    };
    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-full font-medium ${map[t] || 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400'}`}>
        <span className={`w-1.5 h-1.5 rounded-full ${dotColor[t] || 'bg-slate-400'}`} />
        {t}
      </span>
    );
  };

  const enabledBadge = (enabled) => (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-full font-medium ${enabled ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300' : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400'}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${enabled ? 'bg-emerald-500' : 'bg-slate-400'}`} />
      {enabled ? 'Activé' : 'Désactivé'}
    </span>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Triggers</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Déclencheurs d'événements et actions manuelles</p>
        </div>
        <button onClick={fetchTriggers} className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 rounded-xl hover:bg-blue-100 transition-colors">
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
        <div className="lg:col-span-2 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-700/60">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-md">
                <BoltIcon className="w-5 h-5 text-white" />
              </div>
              <h3 className="font-semibold text-slate-800 dark:text-slate-100">Triggers enregistrés</h3>
            </div>
            <span className="text-xs text-slate-400 dark:text-slate-500 font-medium">{triggers.length} trigger(s)</span>
          </div>
          <div className="divide-y divide-slate-100 dark:divide-slate-700/60">
            {loading ? (
              <div className="px-6 py-14 flex items-center justify-center">
                <ModernSpinner label="Chargement..." />
              </div>
            ) : triggers.length === 0 ? (
              <div className="px-6 py-12 text-center text-slate-400 dark:text-slate-500 text-sm">Aucun trigger</div>
            ) : triggers.map((t) => (
              <div key={t.code} className="px-6 py-4 hover:bg-slate-50/50 dark:hover:bg-slate-700/40 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-sm font-semibold text-slate-800 dark:text-slate-100">{t.code}</span>
                    <span className="text-xs text-slate-400 dark:text-slate-500">v{t.version}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    {typeBadge(t.type)}
                    {enabledBadge(t.enabled)}
                  </div>
                </div>
                <div className="mt-2 flex flex-wrap gap-3 text-xs text-slate-500 dark:text-slate-400">
                  {t.event && (
                    <span className="flex items-center gap-1">
                      <RssIcon className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                      <span>Événement: <span className="font-mono text-slate-700 dark:text-slate-200">{t.event}</span></span>
                    </span>
                  )}
                  {t.targetWorkflow && (
                    <span className="flex items-center gap-1">
                      <ArrowPathRoundedSquareIcon className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                      <span>Cible: <span className="font-mono text-slate-700 dark:text-slate-200">{t.targetWorkflow}</span></span>
                    </span>
                  )}
                  {t.targetRule && (
                    <span className="flex items-center gap-1">
                      <FunnelIcon className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                      <span>Règle: <span className="font-mono text-slate-700 dark:text-slate-200">{t.targetRule}</span></span>
                    </span>
                  )}
                  {t.filters && (
                    <span className="flex items-center gap-1">
                      <SignalIcon className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                      <span>Filtres: <span className="font-mono text-slate-700 dark:text-slate-200">{JSON.stringify(t.filters)}</span></span>
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
            <div className="flex items-center gap-3 px-6 py-4 border-b border-slate-100 dark:border-slate-700/60">
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-md">
                <PlayIcon className="w-5 h-5 text-white" />
              </div>
              <h3 className="font-semibold text-slate-800 dark:text-slate-100">Déclencher manuellement</h3>
            </div>
            <div className="p-6">
              <form onSubmit={runFire} className="space-y-4">
                <select value={fireCode} onChange={(e) => setFireCode(e.target.value)} className="w-full border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-slate-50 dark:bg-slate-700/40 text-slate-700 dark:text-slate-200">
                  <option value="">— Sélectionner (MANUAL) —</option>
                  {triggers.filter((t) => t.type === 'MANUAL').map((t) => <option key={t.code} value={t.code}>{t.code}</option>)}
                </select>
                <textarea rows="3" value={fireVars} onChange={(e) => setFireVars(e.target.value)} className="w-full border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-slate-50 dark:bg-slate-700/40 text-slate-700 dark:text-slate-200" />
                <button type="submit" disabled={!fireCode} className="w-full bg-emerald-600 text-white px-4 py-2.5 rounded-xl hover:bg-emerald-700 font-medium disabled:opacity-50 transition-colors text-sm">
                  Déclencher
                </button>
              </form>
              {fireResult && (
                <pre className={`mt-4 rounded-xl p-4 text-xs overflow-x-auto max-h-64 ${fireResult.error ? 'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 border border-red-200' : 'bg-slate-900 text-emerald-400'}`}>
                  {JSON.stringify(fireResult, null, 2)}
                </pre>
              )}
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
            <div className="flex items-center gap-3 px-6 py-4 border-b border-slate-100 dark:border-slate-700/60">
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-md">
                <SignalIcon className="w-5 h-5 text-white" />
              </div>
              <h3 className="font-semibold text-slate-800 dark:text-slate-100">Événement entrant</h3>
            </div>
            <div className="p-6">
              <form onSubmit={runEvent} className="space-y-4">
                <textarea rows="5" value={eventPayload} onChange={(e) => setEventPayload(e.target.value)} className="w-full border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-slate-50 dark:bg-slate-700/40 text-slate-700 dark:text-slate-200" />
                <button type="submit" className="w-full bg-blue-600 text-white px-4 py-2.5 rounded-xl hover:bg-blue-700 font-medium transition-colors text-sm">
                  Traiter
                </button>
              </form>
              {eventResult && (
                <pre className={`mt-4 rounded-xl p-4 text-xs overflow-x-auto max-h-64 ${eventResult.error ? 'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 border border-red-200' : 'bg-slate-900 text-emerald-400'}`}>
                  {JSON.stringify(eventResult, null, 2)}
                </pre>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AutomationTriggers;
