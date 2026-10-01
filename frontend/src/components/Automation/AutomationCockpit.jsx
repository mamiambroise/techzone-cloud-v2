import React from 'react';
import {
  ScaleIcon,
  ArrowPathRoundedSquareIcon,
  BoltIcon,
  PlayIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import { automationService } from '../services/apiClient.js';
import { ModernSpinner } from '../components/Loaders.jsx';
import { PageHeader, ErrorBanner, useAsync, describeError } from '../components/automation/shared/index.js';

const TILE_TONES = {
  blue: 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300',
  green: 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300',
  red: 'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300',
  yellow: 'bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300',
  purple: 'bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300',
};

function buildGroups(c) {
  return [
    {
      title: 'Règles',
      icon: ScaleIcon,
      gradient: 'from-blue-500 to-indigo-600',
      items: [
        { label: 'Total', value: c.rules?.total, color: 'blue' },
        { label: 'Actives', value: c.rules?.active, color: 'green' },
        { label: 'Inactives', value: c.rules?.inactive, color: 'red' },
        { label: 'Brouillons', value: c.rules?.draft, color: 'yellow' },
      ],
    },
    {
      title: 'Workflows',
      icon: ArrowPathRoundedSquareIcon,
      gradient: 'from-violet-500 to-purple-600',
      items: [
        { label: 'Total', value: c.workflows?.total, color: 'blue' },
        { label: 'Actifs', value: c.workflows?.active, color: 'green' },
        { label: 'Prêts', value: c.workflows?.ready, color: 'purple' },
        { label: 'En pause', value: c.workflows?.paused, color: 'yellow' },
      ],
    },
    {
      title: 'Triggers',
      icon: BoltIcon,
      gradient: 'from-amber-500 to-orange-600',
      items: [
        { label: 'Total', value: c.triggers?.total, color: 'blue' },
        { label: 'Activés', value: c.triggers?.enabled, color: 'green' },
      ],
    },
    {
      title: 'Exécutions',
      icon: PlayIcon,
      gradient: 'from-emerald-500 to-teal-600',
      items: [
        { label: 'Total', value: c.executions?.totalCount ?? c.executions?.total, color: 'blue' },
        { label: 'Succès', value: c.executions?.successCount, color: 'green' },
        { label: 'Échecs', value: c.executions?.failedCount, color: 'red' },
        { label: 'Timeouts', value: c.executions?.timeoutCount, color: 'yellow' },
      ],
    },
  ];
}

function EnginePill({ status }) {
  const known = Boolean(status);
  const up = status === 'UP';
  const pill = !known
    ? 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300'
    : up
      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
      : 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300';
  const dot = !known ? 'bg-slate-400' : up ? 'bg-emerald-500' : 'bg-red-500';
  return (
    <span role="status" className={`inline-flex items-center gap-2 px-3 py-1.5 text-sm rounded-full font-medium ${pill}`}>
      <span aria-hidden="true" className={`w-2 h-2 rounded-full ${dot}`} />
      Moteur : {known ? status : 'inconnu'}
    </span>
  );
}

const loadCockpit = async () => (await automationService.cockpit()).data;

function AutomationCockpit() {
  const { data: cockpit, loading, error, reload } = useAsync(loadCockpit);

  if (loading && !cockpit) return <ModernSpinner label="Chargement du cockpit..." />;
  if (error && !cockpit) {
    return <ErrorBanner message={describeError('Impossible de charger le cockpit', error)} onRetry={reload} />;
  }
  if (!cockpit) return null;

  const groups = buildGroups(cockpit);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Automation Cockpit"
        subtitle="Vue d'ensemble du moteur d'automatisation"
        onRefresh={reload}
        refreshing={loading}
        actions={<EnginePill status={cockpit.engine?.status} />}
      />

      {error && <ErrorBanner message={describeError('Actualisation impossible', error)} onRetry={reload} />}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
        {groups.map((g) => {
          const Icon = g.icon;
          return (
            <section key={g.title} className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-5">
              <div className="flex items-center gap-3 mb-4">
                <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${g.gradient} flex items-center justify-center shadow-md`}>
                  <Icon aria-hidden="true" className="w-5 h-5 text-white" />
                </div>
                <h2 className="font-semibold text-slate-800 dark:text-slate-100">{g.title}</h2>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {g.items.map((it) => (
                  <div key={it.label} className={`rounded-xl p-3 ${TILE_TONES[it.color]}`}>
                    <p className="text-xs font-medium opacity-80">{it.label}</p>
                    <p className="text-2xl font-bold mt-1">{it.value ?? '—'}</p>
                  </div>
                ))}
              </div>
            </section>
          );
        })}
      </div>

      {cockpit.attention > 0 && (
        <div role="status" className="flex items-center gap-3 bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800/60 rounded-xl p-4">
          <ExclamationTriangleIcon aria-hidden="true" className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0" />
          <p className="text-amber-700 dark:text-amber-300 font-medium">
            {cockpit.attention} exécution(s) nécessitant votre attention (échecs + timeouts)
          </p>
        </div>
      )}
    </div>
  );
}

export default AutomationCockpit;
