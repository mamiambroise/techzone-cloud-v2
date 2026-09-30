import React, { useState } from 'react';
import {
  BoltIcon,
  PlayIcon,
  RssIcon,
  ArrowPathRoundedSquareIcon,
  FunnelIcon,
  SignalIcon,
} from '@heroicons/react/24/outline';
import { automationService } from '../services/apiClient.js';
import { ModernSpinner } from '../components/Loaders.jsx';
import {
  PageHeader,
  Card,
  ErrorBanner,
  JsonField,
  JsonResult,
  StatusBadge,
  TRIGGER_TYPES,
  useAsync,
  useAction,
  toArray,
  parseJson,
  getErrorMessage,
  describeError,
} from '../components/automation/shared/index.js';

const DEFAULT_EVENT = '{\n  "eventType": "invoice.created",\n  "source": "erp",\n  "data": {}\n}';

const loadTriggers = async () => toArray((await automationService.triggers()).data);

function Meta({ icon: Icon, label, children }) {
  return (
    <span className="flex items-center gap-1">
      <Icon aria-hidden="true" className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
      <span>
        {label} : <span className="font-mono text-slate-700 dark:text-slate-200">{children}</span>
      </span>
    </span>
  );
}

function AutomationTriggers() {
  const { data, loading, error, reload } = useAsync(loadTriggers);
  const triggers = data ?? [];

  const [fireCode, setFireCode] = useState('');
  const [fireVars, setFireVars] = useState('{}');
  const [fireVarsError, setFireVarsError] = useState('');
  const [fireResult, setFireResult] = useState(null);

  const [eventPayload, setEventPayload] = useState(DEFAULT_EVENT);
  const [eventError, setEventError] = useState('');
  const [eventResult, setEventResult] = useState(null);

  const fire = useAction(async () => {
    setFireResult(null);
    const parsed = parseJson(fireVars, 'Variables JSON');
    setFireVarsError(parsed.ok ? '' : parsed.error);
    if (!parsed.ok) return;
    try {
      const res = await automationService.fireTrigger(fireCode, parsed.value);
      setFireResult(res.data);
    } catch (err) {
      setFireResult({ error: getErrorMessage(err) });
    }
  });

  const processEvent = useAction(async () => {
    setEventResult(null);
    const parsed = parseJson(eventPayload, 'Événement JSON');
    setEventError(parsed.ok ? '' : parsed.error);
    if (!parsed.ok) return;
    try {
      const res = await automationService.processEvent(parsed.value);
      setEventResult(res.data);
    } catch (err) {
      setEventResult({ error: getErrorMessage(err) });
    }
  });

  const manualTriggers = triggers.filter((t) => t.type === 'MANUAL');

  return (
    <div className="space-y-6">
      <PageHeader
        title="Triggers"
        subtitle="Déclencheurs d'événements et actions manuelles"
        onRefresh={reload}
        refreshing={loading}
      />

      {error && <ErrorBanner message={describeError('Impossible de charger les triggers', error)} onRetry={reload} />}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card
          icon={BoltIcon}
          gradient="from-amber-500 to-orange-600"
          title="Triggers enregistrés"
          meta={`${triggers.length} trigger(s)`}
          padded={false}
          className="lg:col-span-2"
        >
          <div className="divide-y divide-slate-100 dark:divide-slate-700/60">
            {loading && triggers.length === 0 ? (
              <div className="px-6 py-14 flex items-center justify-center">
                <ModernSpinner label="Chargement..." />
              </div>
            ) : triggers.length === 0 ? (
              <div className="px-6 py-12 text-center text-slate-500 dark:text-slate-400 text-sm">Aucun trigger</div>
            ) : (
              triggers.map((t) => (
                <div key={t.code} className="px-6 py-4 hover:bg-slate-50/50 dark:hover:bg-slate-700/40 transition-colors">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-sm font-semibold text-slate-800 dark:text-slate-100">{t.code}</span>
                      <span className="text-xs text-slate-500 dark:text-slate-400">v{t.version}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <StatusBadge status={t.type} catalog={TRIGGER_TYPES} />
                      <StatusBadge status={t.enabled ? 'ENABLED' : 'DISABLED'} />
                    </div>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-3 text-xs text-slate-500 dark:text-slate-400">
                    {t.event && <Meta icon={RssIcon} label="Événement">{t.event}</Meta>}
                    {t.targetWorkflow && <Meta icon={ArrowPathRoundedSquareIcon} label="Cible">{t.targetWorkflow}</Meta>}
                    {t.targetRule && <Meta icon={FunnelIcon} label="Règle">{t.targetRule}</Meta>}
                    {t.filters && <Meta icon={SignalIcon} label="Filtres">{JSON.stringify(t.filters)}</Meta>}
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>

        <div className="space-y-6">
          <Card icon={PlayIcon} gradient="from-emerald-500 to-teal-600" title="Déclencher manuellement">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                fire.run();
              }}
              className="space-y-4"
              aria-busy={fire.loading}
            >
              <div>
                <label htmlFor="fire-code" className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5">
                  Trigger manuel
                </label>
                <select
                  id="fire-code"
                  value={fireCode}
                  onChange={(e) => setFireCode(e.target.value)}
                  className="w-full border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-slate-50 dark:bg-slate-700/40 text-slate-700 dark:text-slate-200"
                >
                  <option value="">— Sélectionner (MANUAL) —</option>
                  {manualTriggers.map((t) => (
                    <option key={t.code} value={t.code}>{t.code}</option>
                  ))}
                </select>
              </div>
              <JsonField
                id="fire-vars"
                label="Variables (JSON)"
                rows={3}
                value={fireVars}
                onChange={(v) => {
                  setFireVars(v);
                  setFireVarsError('');
                }}
                error={fireVarsError}
              />
              <button
                type="submit"
                disabled={!fireCode || fire.loading}
                className="w-full bg-emerald-600 text-white px-4 py-2.5 rounded-xl hover:bg-emerald-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600"
              >
                {fire.loading ? 'Déclenchement…' : 'Déclencher'}
              </button>
            </form>
            <JsonResult data={fireResult} maxHeight="max-h-64" />
          </Card>

          <Card icon={SignalIcon} title="Événement entrant">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                processEvent.run();
              }}
              className="space-y-4"
              aria-busy={processEvent.loading}
            >
              <JsonField
                id="event-payload"
                label="Événement (JSON)"
                rows={5}
                value={eventPayload}
                onChange={(v) => {
                  setEventPayload(v);
                  setEventError('');
                }}
                error={eventError}
              />
              <button
                type="submit"
                disabled={processEvent.loading}
                className="w-full bg-blue-600 text-white px-4 py-2.5 rounded-xl hover:bg-blue-700 font-medium transition-colors text-sm disabled:opacity-60 disabled:cursor-wait focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
              >
                {processEvent.loading ? 'Traitement…' : 'Traiter'}
              </button>
            </form>
            <JsonResult data={eventResult} maxHeight="max-h-64" />
          </Card>
        </div>
      </div>
    </div>
  );
}

export default AutomationTriggers;
