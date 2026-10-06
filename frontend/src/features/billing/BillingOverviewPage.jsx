import { billingService } from '../../services/apiClient.js';
import {
  ActionButton,
  BillingEmpty,
  BillingError,
  BillingLoading,
  BillingPanel,
  DataRow,
  StatusBadge,
  amount,
  dateOnly,
  dateTime,
  useBillingResource,
} from './BillingUi.jsx';

/**
 * Vue d'ensemble Billing du tenant courant (CDC 13/16/84).
 *
 * Données : uniquement `GET /api/billing/context`. Aucun indicateur chiffre
 * n'est calcule ni estime cote front : si l'API ne le renvoie pas, il
 * n'apparait pas.
 */
export default function BillingOverviewPage({ title = 'Billing' }) {
  const context = useBillingResource(() => billingService.context(), []);
  const invoices = useBillingResource(() => billingService.invoices({ limit: 5 }), []);
  const usage = useBillingResource(() => billingService.usage(), []);

  const subscription = context.data?.subscription ?? null;
  const entitlements = context.data?.entitlements ?? null;
  const providers = context.data?.providers ?? null;

  const openInvoices = (invoices.data ?? []).filter((invoice) =>
    ['OPEN', 'PARTIALLY_PAID', 'OVERDUE'].includes(invoice.status),
  );
  const dueTotal = openInvoices.reduce(
    (total, invoice) => total + Number(String(invoice.amountDue ?? 0)),
    0,
  );
  const currency = subscription?.price?.currency ?? openInvoices[0]?.currency ?? '';

  return (
    <div className="space-y-5">
      <header>
        <h1 className="text-lg font-semibold text-slate-900">{title}</h1>
        <p className="mt-1 text-sm text-slate-600">
          Abonnement, droits commerciaux, factures et consommation du tenant courant.
        </p>
      </header>

      <BillingError error={context.error} title="Contexte Billing indisponible" />

      <div className="grid gap-5 lg:grid-cols-2">
        <BillingPanel
          title="Abonnement"
          description="Contrat commercial en cours pour ce tenant."
          actions={
            <ActionButton onClick={() => { context.reload(); }}>Actualiser</ActionButton>
          }
        >
          {context.loading ? <BillingLoading /> : null}
          {!context.loading && !subscription ? (
            <BillingEmpty
              label="Aucun abonnement actif pour ce tenant."
              hint="La souscription se fait depuis la page Plans."
            />
          ) : null}
          {subscription ? (
            <div>
              <DataRow label="Plan">{subscription.plan?.name ?? subscription.planId}</DataRow>
              <DataRow label="Statut"><StatusBadge value={subscription.status} /></DataRow>
              <DataRow label="Prix">
                {subscription.price
                  ? `${amount(subscription.price.amount, subscription.price.currency)} / ${String(
                      subscription.price.interval,
                    ).toLowerCase()}`
                  : 'Aucun prix associé'}
              </DataRow>
              <DataRow label="Période">
                {dateOnly(subscription.currentPeriodStart)} → {dateOnly(subscription.currentPeriodEnd)}
              </DataRow>
              <DataRow label="Renouvellement">{dateTime(subscription.renewalAt)}</DataRow>
              <DataRow label="Auto-renouvellement">
                {subscription.autoRenew ? 'Oui' : 'Non'}
              </DataRow>
              {subscription.graceEndsAt ? (
                <DataRow label="Fin de grâce">{dateTime(subscription.graceEndsAt)}</DataRow>
              ) : null}
            </div>
          ) : null}
        </BillingPanel>

        <BillingPanel
          title="Droits commerciaux effectifs"
          description="Entitlements résolus (distincts des permissions IAM)."
          actions={<StatusBadge value={entitlements?.state} />}
        >
          {context.loading ? <BillingLoading /> : null}
          {!context.loading && (entitlements?.entitlements ?? []).length === 0 ? (
            <BillingEmpty
              label="Aucun entitlement applicable."
              hint="Un abonnement suspendu ou sans plan ne sert aucun droit."
            />
          ) : null}
          {(entitlements?.entitlements ?? []).length > 0 ? (
            <ul className="divide-y divide-slate-100">
              {(entitlements?.entitlements ?? []).slice(0, 8).map((entitlement) => (
                <li key={entitlement.key} className="flex items-center justify-between gap-3 py-2">
                  <div>
                    <p className="text-sm font-medium text-slate-800">{entitlement.key}</p>
                    <p className="text-xs text-slate-500">
                      {entitlement.kind} · {entitlement.enforcement}
                      {entitlement.source === 'OVERRIDE' ? ' · override' : ''}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {entitlement.limit !== null && entitlement.limit !== undefined ? (
                      <span className="text-xs text-slate-600">
                        {entitlement.used ?? 0} / {entitlement.limit}
                        {entitlement.unit ? ` ${entitlement.unit}` : ''}
                      </span>
                    ) : null}
                    <StatusBadge value={entitlement.status} />
                  </div>
                </li>
              ))}
            </ul>
          ) : null}
        </BillingPanel>

        <BillingPanel title="Factures" description="Dernières factures du tenant.">
          {invoices.loading ? <BillingLoading /> : null}
          {!invoices.loading && (invoices.data ?? []).length === 0 ? (
            <BillingEmpty label="Aucune facture." />
          ) : null}
          {(invoices.data ?? []).length > 0 ? (
            <>
              <div className="rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-700">
                Reste à payer : <strong>{amount(dueTotal, currency)}</strong> sur {openInvoices.length} facture(s)
                ouverte(s).
              </div>
              <ul className="mt-3 divide-y divide-slate-100">
                {(invoices.data ?? []).map((invoice) => (
                  <li key={invoice.id} className="flex items-center justify-between gap-3 py-2">
                    <div>
                      <p className="text-sm font-medium text-slate-800">{invoice.invoiceNumber}</p>
                      <p className="text-xs text-slate-500">Échéance {dateOnly(invoice.dueAt)}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-slate-800">
                        {amount(invoice.amountDue, invoice.currency)}
                      </span>
                      <StatusBadge value={invoice.status} />
                    </div>
                  </li>
                ))}
              </ul>
            </>
          ) : null}
        </BillingPanel>

        <BillingPanel title="Moyens de paiement" description="Ce que la plateforme accepte réellement.">
          <DataRow label="Enregistrés">
            {providers && providers.count > 0 ? providers.count : 'Aucun provider externe'}
          </DataRow>
          <DataRow label="Méthodes effectives">{(context.data?.paymentMethods ?? []).join(', ') || '—'}</DataRow>
          <DataRow label="Devises">{(context.data?.currencies ?? []).join(', ')}</DataRow>
          <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">
            {providers?.policy ??
              'Aucun provider de paiement externe n est configuré : seul le paiement manuel est opérationnel.'}
          </p>
        </BillingPanel>
      </div>

      <BillingPanel title="Consommation" description="Agrégats de la période de facturation en cours.">
        {usage.loading ? <BillingLoading /> : null}
        <BillingError error={usage.error} title="Consommation indisponible" />
        {!usage.loading && (usage.data?.metrics ?? []).length === 0 ? (
          <BillingEmpty label="Aucun événement de consommation enregistré." />
        ) : null}
        {(usage.data?.metrics ?? []).length > 0 ? (
          <table className="w-full text-left text-sm">
            <thead className="text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="py-2">Métrique</th>
                <th className="py-2">Consommé</th>
                <th className="py-2">Inclus</th>
                <th className="py-2">Restant</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {(usage.data?.metrics ?? []).map((metric) => (
                <tr key={metric.meterKey}>
                  <td className="py-2 font-medium text-slate-800">{metric.meterKey}</td>
                  <td className="py-2">{metric.used}{metric.unit ? ` ${metric.unit}` : ''}</td>
                  <td className="py-2">{metric.included ?? '—'}</td>
                  <td className="py-2">{metric.remaining ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : null}
      </BillingPanel>
    </div>
  );
}
