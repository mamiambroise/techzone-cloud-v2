import { useState } from 'react';
import { billingAdminService } from '../../services/apiClient.js';
import {
  ActionButton,
  BillingEmpty,
  BillingError,
  BillingLoading,
  BillingPanel,
  dateTime,
  useBillingResource,
} from './BillingUi.jsx';

/**
 * Événements webhook de facturation reçus (CDC 84).
 *
 * Surface plateforme (`/billing/admin/webhooks`, permission
 * `billing:diagnostic:read`) : le payload stocké est déjà expurgé par le
 * backend, la page ne réaffiche que les champs de traçabilité renvoyés.
 */
export default function BillingWebhooksPage({ title = 'Webhooks' }) {
  const [provider, setProvider] = useState('');
  const events = useBillingResource(
    () => billingAdminService.webhooks({ ...(provider ? { provider } : {}), limit: 50 }),
    [provider],
  );

  const rows = events.data ?? [];

  return (
    <div className="space-y-5">
      <header>
        <h1 className="text-lg font-semibold text-slate-900">{title}</h1>
        <p className="mt-1 text-sm text-slate-600">
          Notifications de paiement reçues des providers, avec leur état de traitement et la
          validité de leur signature.
        </p>
      </header>

      <BillingError error={events.error} title="Événements indisponibles" />

      <BillingPanel
        title="Événements reçus"
        description="Lecture plateforme : aucun provider n'est supposé par l'interface."
        actions={
          <div className="flex items-center gap-2">
            <label className="sr-only" htmlFor="webhook-provider">
              Filtrer par provider
            </label>
            <input
              id="webhook-provider"
              value={provider}
              onChange={(event) => setProvider(event.target.value)}
              placeholder="Code provider"
              className="w-40 rounded-lg border border-slate-300 px-2 py-1.5 text-xs"
            />
            <ActionButton onClick={() => events.reload()}>Actualiser</ActionButton>
          </div>
        }
      >
        {events.loading ? <BillingLoading /> : null}
        {!events.loading && rows.length === 0 ? (
          <BillingEmpty
            label="Aucun événement webhook reçu."
            hint="Sans provider configuré, aucune notification ne peut être reçue."
          />
        ) : null}
        {rows.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="py-2">Reçu le</th>
                  <th className="py-2">Provider</th>
                  <th className="py-2">Événement provider</th>
                  <th className="py-2">Signature</th>
                  <th className="py-2">Traitement</th>
                  <th className="py-2">Traité le</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.map((row) => (
                  <tr key={row.id}>
                    <td className="py-2 text-slate-600">{dateTime(row.receivedAt)}</td>
                    <td className="py-2 text-slate-700">{row.provider ?? '—'}</td>
                    <td className="py-2 font-mono text-xs text-slate-600">{row.providerEventId ?? '—'}</td>
                    <td className="py-2 text-slate-600">
                      {row.signatureValid === null || row.signatureValid === undefined
                        ? '—'
                        : row.signatureValid
                          ? 'Signature valide'
                          : 'Signature invalide'}
                    </td>
                    <td className="py-2 text-slate-600">{row.processed ? 'Traité' : 'Non traité'}</td>
                    <td className="py-2 text-slate-600">{row.processedAt ? dateTime(row.processedAt) : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </BillingPanel>
    </div>
  );
}