import React, { useState, useEffect } from 'react';
import {
  ScaleIcon,
  ArrowPathRoundedSquareIcon,
  BoltIcon,
  PlayIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import { automationService } from '../services/api';
import { ModernSpinner } from '../components/Loaders';

function AutomationCockpit() {
  const [cockpit, setCockpit] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const res = await automationService.cockpit();
        setCockpit(res.data);
      } catch (err) {
        setError('Impossible de charger le cockpit');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return <ModernSpinner label="Chargement du cockpit..." />;
  }
  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 rounded-xl p-6 flex items-center gap-3">
        <ExclamationTriangleIcon className="w-6 h-6 text-red-500" />
        <p className="text-red-600 dark:text-red-400 font-medium">{error}</p>
      </div>
    );
  }
  if (!cockpit) return null;

  const groups = [
    {
      title: 'Règles',
      icon: ScaleIcon,
      gradient: 'from-blue-500 to-indigo-600',
      items: [
        { label: 'Total', value: cockpit.rules?.total, color: 'blue' },
        { label: 'Actives', value: cockpit.rules?.active, color: 'green' },
        { label: 'Inactives', value: cockpit.rules?.inactive, color: 'red' },
        { label: 'Brouillons', value: cockpit.rules?.draft, color: 'yellow' },
      ],
    },
    {
      title: 'Workflows',
      icon: ArrowPathRoundedSquareIcon,
      gradient: 'from-violet-500 to-purple-600',
      items: [
        { label: 'Total', value: cockpit.workflows?.total, color: 'blue' },
        { label: 'Actifs', value: cockpit.workflows?.active, color: 'green' },
        { label: 'Prêts', value: cockpit.workflows?.ready, color: 'purple' },
        { label: 'En pause', value: cockpit.workflows?.paused, color: 'yellow' },
      ],
    },
    {
      title: 'Triggers',
      icon: BoltIcon,
      gradient: 'from-amber-500 to-orange-600',
      items: [
        { label: 'Total', value: cockpit.triggers?.total, color: 'blue' },
        { label: 'Activés', value: cockpit.triggers?.enabled, color: 'green' },
      ],
    },
    {
      title: 'Exécutions',
      icon: PlayIcon,
      gradient: 'from-emerald-500 to-teal-600',
      items: [
        { label: 'Total', value: cockpit.executions?.totalCount ?? cockpit.executions?.total, color: 'blue' },
        { label: 'Succès', value: cockpit.executions?.successCount, color: 'green' },
        { label: 'Échecs', value: cockpit.executions?.failedCount, color: 'red' },
        { label: 'Timeouts', value: cockpit.executions?.timeoutCount, color: 'yellow' },
      ],
    },
  ];

  const colorMap = {
    blue: 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300',
    green: 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300',
    red: 'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300',
    yellow: 'bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300',
    purple: 'bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300',
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Automation Cockpit</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Vue d'ensemble du moteur d'automatisation</p>
        </div>
        <span
          className={`inline-flex items-center gap-2 px-3 py-1.5 text-sm rounded-full font-medium ${
            cockpit.engine?.status === 'UP'
              ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
              : 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300'
          }`}
        >
          <span className={`w-2 h-2 rounded-full ${cockpit.engine?.status === 'UP' ? 'bg-emerald-500' : 'bg-red-500'}`} />
          Moteur : {cockpit.engine?.status}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
        {groups.map((g) => {
          const Icon = g.icon;
          return (
            <div key={g.title} className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-5">
              <div className="flex items-center gap-3 mb-4">
                <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${g.gradient} flex items-center justify-center shadow-md`}>
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <h3 className="font-semibold text-slate-800 dark:text-slate-100">{g.title}</h3>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {g.items.map((it) => (
                  <div key={it.label} className={`rounded-xl p-3 ${colorMap[it.color]}`}>
                    <p className="text-xs font-medium opacity-70">{it.label}</p>
                    <p className="text-2xl font-bold mt-1">{it.value ?? '—'}</p>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {cockpit.attention > 0 && (
        <div className="flex items-center gap-3 bg-amber-50 dark:bg-amber-900/30 border border-amber-200 rounded-xl p-4">
          <ExclamationTriangleIcon className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0" />
          <p className="text-amber-700 font-medium">
            {cockpit.attention} exécution(s) nécessitant votre attention (échecs + timeouts)
          </p>
        </div>
      )}
    </div>
  );
}

export default AutomationCockpit;
