import React, { useCallback, useEffect, useState } from 'react';
import { AlertCircle, CircleCheck, RefreshCw } from 'lucide-react';
import { automationService } from '../services/apiClient.js';
import { mapErrorToAction, mapErrorToMessage } from '../lib/automation/errors.js';
import { maskSecrets } from '../lib/automation/masking.js';
import { formatDate } from '../lib/automation/format.js';
import { PageHeader } from '../components/ui/PageHeader.jsx';
import { useAutomationMode } from '../components/automation/AutomationModeContext.jsx';

export default function AutomationDiagnostics() {
  const { setBanner, reportError } = useAutomationMode();
  const [records, setRecords] = useState([]);
  const [blockedCount, setBlockedCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await automationService.history();
      const history = Array.isArray(response.data) ? response.data : response.data?.records;
      if (!Array.isArray(history)) throw new Error('Réponse d’historique Automation invalide.');
      const incidents = history.filter((record) => ['FAILED', 'TIMEOUT', 'BLOCKED'].includes(record.status));
      setRecords(incidents);
      const blocked = incidents.filter((record) => record.status === 'BLOCKED').length;
      setBlockedCount(blocked);
      if (blocked > 0) {
        const blockedLabel = `${blocked} exécution${blocked > 1 ? 's' : ''}`;
        setBanner({
          kind: 'RUNTIME_BLOCKED',
          message: `${blockedLabel} ${blocked > 1 ? 'sont marquées' : 'est marquée'} BLOCKED dans l’historique chargé.`,
        });
      }
    } catch (loadError) {
      setError(loadError);
      reportError(loadError);
    } finally {
      setLoading(false);
    }
  }, [reportError, setBanner]);

  useEffect(() => { void load(); }, [load]);

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6">
      <PageHeader
        title={(
          <span className="inline-flex items-center gap-2">
            Diagnostics
            {blockedCount > 0 && (
              <span role="status" aria-label={`${blockedCount} exécution${blockedCount > 1 ? 's' : ''} bloquée${blockedCount > 1 ? 's' : ''}`} className="inline-flex min-w-5 items-center justify-center rounded-full bg-rose-600 px-1.5 py-0.5 text-[10px] font-bold leading-none text-white">
                {blockedCount}
              </span>
            )}
          </span>
        )}
        subtitle="Incidents issus de l’historique d’exécution disponible côté serveur."
        actions={(
          <button type="button" onClick={() => void load()} disabled={loading} className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-amber-600">
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> Actualiser
          </button>
        )}
      />

      {error && (
        <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-4">
          <div className="flex items-start gap-3 text-sm text-rose-800">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <div><p className="font-semibold">{mapErrorToMessage(error)}</p><p className="mt-1">{mapErrorToAction(error)}</p></div>
          </div>
        </div>
      )}

      <section aria-label="Incidents Automation" className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        {loading ? (
          <div role="status" className="space-y-3 p-6">
            <div className="h-4 w-40 animate-pulse rounded bg-slate-100" />
            <div className="h-12 animate-pulse rounded bg-slate-100" />
            <div className="h-12 animate-pulse rounded bg-slate-100" />
          </div>
        ) : records.length === 0 && !error ? (
          <div className="p-10 text-center">
            <CircleCheck className="mx-auto h-8 w-8 text-emerald-600" />
            <h2 className="mt-3 font-semibold text-slate-900">Aucun incident dans l’historique reçu</h2>
            <p className="mt-1 text-sm text-slate-500">Cette vue s’appuie sur l’historique Automation, sans état de santé simulé.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {records.map((record, index) => (
              <article key={record.executionId || record.id || index} className="grid gap-3 p-4 sm:grid-cols-[1fr_auto] sm:items-start">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="font-semibold text-slate-900">{record.workflowCode || record.ruleCode || 'Exécution Automation'}</h2>
                    <span className="rounded-full bg-rose-50 px-2 py-0.5 text-xs font-bold text-rose-700">{record.status}</span>
                  </div>
                  <p className="mt-1 break-all font-mono text-xs text-slate-500">{record.executionId || record.id || '—'}</p>
                  {record.errorCode && <p className="mt-2 text-sm font-medium text-rose-700">{record.errorCode}</p>}
                  {record.error && <pre className="mt-2 max-h-40 overflow-auto rounded-lg bg-slate-50 p-3 text-xs text-slate-700">{JSON.stringify(maskSecrets(record.error), null, 2)}</pre>}
                </div>
                <time className="text-xs text-slate-500">{formatDate(record.startedAt)}</time>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
