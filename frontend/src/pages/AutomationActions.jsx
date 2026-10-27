import React, { useCallback, useEffect, useState } from 'react';
import { Activity, AlertCircle, CheckCircle2, RefreshCw, Zap } from 'lucide-react';
import { automationService } from '../services/apiClient.js';
import { mapErrorToAction, mapErrorToMessage } from '../lib/automation/errors.js';
import { PageHeader } from '../components/ui/PageHeader.jsx';

function errorMessage(error) {
  return { message: mapErrorToMessage(error), action: mapErrorToAction(error) };
}

export default function AutomationActions() {
  const [actions, setActions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadActions = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await automationService.actions();
      if (!Array.isArray(response.data)) throw new Error('Réponse du catalogue Automation invalide.');
      setActions(response.data);
    } catch (loadError) {
      setError(errorMessage(loadError));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void loadActions(); }, [loadActions]);

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6">
      <PageHeader
        title="Actions"
        subtitle="Catalogue des actions enregistrées côté serveur. Leur code et leurs handlers restent administrés par le backend."
        actions={(
          <button type="button" onClick={() => void loadActions()} disabled={loading} className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-amber-600">
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> Actualiser
          </button>
        )}
      />

      {error && <div role="alert" className="flex items-start gap-2 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700"><AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /><div><p>{error.message}</p><p className="mt-1 text-xs">{error.action}</p></div></div>}
      {loading ? (
        <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">Chargement du catalogue…</div>
      ) : actions.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center">
          <Zap className="mx-auto h-8 w-8 text-slate-400" />
          <p className="mt-3 font-semibold text-slate-800">Aucune action enregistrée</p>
          <p className="mt-1 text-sm text-slate-500">Les actions apparaîtront ici après leur enregistrement par le backend.</p>
        </div>
      ) : (
        <section aria-label="Catalogue des actions" className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {actions.map((action) => (
            <article key={action.code} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-50 text-amber-600"><Zap className="h-5 w-5" /></span>
                  <div className="min-w-0">
                    <h2 className="truncate font-semibold text-slate-900">{action.code}</h2>
                    <p className="text-xs text-slate-500">{action.category}</p>
                  </div>
                </div>
                <span className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-1 text-[11px] font-semibold ${action.executable ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
                  {action.executable ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Activity className="h-3.5 w-3.5" />}
                  {action.executable ? 'Opérationnelle' : 'Handler indisponible'}
                </span>
              </div>
              <dl className="mt-5 grid grid-cols-2 gap-3 text-xs">
                <div><dt className="text-slate-500">Version</dt><dd className="mt-1 font-medium text-slate-800">{action.version}</dd></div>
                <div><dt className="text-slate-500">Délai maximal</dt><dd className="mt-1 font-medium text-slate-800">{action.timeout} ms</dd></div>
                <div><dt className="text-slate-500">Réessayable</dt><dd className="mt-1 font-medium text-slate-800">{action.retryable ? 'Oui' : 'Non'}</dd></div>
                <div><dt className="text-slate-500">Idempotente</dt><dd className="mt-1 font-medium text-slate-800">{action.idempotent ? 'Oui' : 'Non'}</dd></div>
              </dl>
              {!action.executable && <p className="mt-4 rounded-lg bg-amber-50 p-3 text-xs leading-relaxed text-amber-800">Cette action est déclarée mais aucun handler serveur n’est enregistré ; toute exécution est refusée.</p>}
            </article>
          ))}
        </section>
      )}
    </div>
  );
}
