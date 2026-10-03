import { billingService } from '../../services/apiClient.js';
import {
  ActionButton,
  BillingEmpty,
  BillingError,
  BillingLoading,
  BillingPanel,
  DataRow,
  StatusBadge,
  useBillingResource,
} from './BillingUi.jsx';

/**
 * Quotas et événements de consommation (CDC 84).
 *
 * Les compteurs proviennent des agrégats backend. Aucun excédent n'est estimé
 * côté front : le dépassement est signalé par le statut et par
 * `overageAllowed` renvoyés par l'API.
 */
export default function BillingUsagePage({ title = 'Quotas' }) {
  const usage = useBillingResource(() => billingService.usage(), []);
  const events = useBillingResource(() => billingService.usageEvents({ limit: 20 }), []);

  const metrics = usage.data?.metrics ?? [];

  return (
    <div className="space-y-5">
      <header>
        <h1 className="text-lg font-semibold text-slate-900">{title}</h1>
        <p className="mt-1 text-sm text-slate-600">
          Consommation mesurée du tenant sur la période de facturation en cours.
        </p>
      </header>

      <BillingError error={usage.error} title="Consommation indisponible" />

      <BillingPanel
        title="Période de mesure"
        actions={
          <ActionButton onClick={() => { usage.reload(); events.reload(); }}>Actualiser</ActionButton>
        }
      >
        {usage.loading ? <BillingLoading /> : null}
        {!usage.loading ? (
          <div>
            <DataRow label="Début">{usage.data?.periodStart ?? '—'}</DataRow>
            <DataRow label="Fin">{usage.data?.periodEnd ?? '—'}</DataRow>
          </div>
        ) : null}
      </BillingPanel>

      <BillingPanel title="Compteurs" description="Un compteur par meter du plan.">
        {usage.loading ? <BillingLoading /> : null}
        {!usage.loading && metrics.length === 0 ? (
          <BillingEmpty label="Aucun compteur défini pour le plan courant." />
        ) : null}
        {metrics.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="py-2">Meter</th>
                  <th className="py-2">Consommé</th>
                  <th className="py-2">Inclus</th>
                  <th className="py-2">Restant</th>
                  <th className="py-2">Dépassement</th>
                  <th className="py-2">État</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {metrics.map((metric) => (
                  <tr key={metric.meterKey}>
                    <td className="py-2 font-medium text-slate-800">{metric.meterKey}</td>
                    <td className="py-2">{metric.used}{metric.unit ? ` ${metric.unit}` : ''}</td>
                    <td className="py-2">{metric.included ?? '∞'}</td>
                    <td className="py-2">{metric.remaining ?? '∞'}</td>
                    <td className="py-2">{metric.overageAllowed ? 'Autorisé' : 'Bloqué'}</td>
                    <td className="py-2"><StatusBadge value={metric.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </BillingPanel>

      <BillingPanel title="Événements récents" description="Journal de consommation transmis par le runtime.">
        {events.loading ? <BillingLoading /> : null}
        <BillingError error={events.error} title="Événements indisponibles" />
        {!events.loading && (events.data ?? []).length === 0 ? (
          <BillingEmpty label="Aucun événement de consommation." />
        ) : null}
        {(events.data ?? []).length > 0 ? (
          <ul className="divide-y divide-slate-100">
            {(events.data ?? []).map((event) => (
              <li key={event.id} className="flex items-center justify-between gap-3 py-2">
                <div>
                  <p className="text-sm text-slate-800">{event.meterKey}</p>
                  <p className="font-mono text-[11px] text-slate-500">{event.id}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-slate-700">
                    {event.quantity}{event.unit ? ` ${event.unit}` : ''}
                  </span>
                  <span className="text-xs text-slate-500">{String(event.occurredAt).slice(0, 19).replace('T', ' ')}</span>
                </div>
              </li>
            ))}
          </ul>
        ) : null}
      </BillingPanel>
    </div>
  );
}