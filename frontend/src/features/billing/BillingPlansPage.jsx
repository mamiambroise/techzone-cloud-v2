import { useState } from 'react';
import { billingService } from '../../services/apiClient.js';
import {
  ActionButton,
  BillingEmpty,
  BillingError,
  BillingLoading,
  BillingPanel,
  StatusBadge,
  amount,
  useBillingResource,
} from './BillingUi.jsx';

/**
 * Catalogue commercial et souscription (CDC 7/8/9/14).
 *
 * Le catalogue est PLATFORM GLOBAL : la page lit `/api/billing/catalog/plans`,
 * qui ne renvoie que les plans ACTIFS et leurs prix ACTIFS. Aucun tarif n'est
 * presente cote front : si l'API ne le renvoie pas, il n'est pas affiche.
 */
export default function BillingPlansPage({ title = 'Plans' }) {
  const plans = useBillingResource(() => billingService.plans(), []);
  const current = useBillingResource(() => billingService.subscription(), []);
  const [selected, setSelected] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [actionError, setActionError] = useState(null);

  const currentPlanId = current.data?.planId ?? null;

  const subscribe = async () => {
    if (!selected) return;
    setSubmitting(true);
    setActionError(null);
    try {
      await billingService.subscribe({
        planId: selected.id,
        priceId: selected.priceId || undefined,
      });
      setSelected(null);
      await Promise.all([plans.reload(), current.reload()]);
    } catch (raised) {
      setActionError(raised?.normalized ?? { message: raised?.message ?? 'Erreur inconnue' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-5">
      <header>
        <h1 className="text-lg font-semibold text-slate-900">{title}</h1>
        <p className="mt-1 text-sm text-slate-600">
          Offres souscriptibles et tarifs en vigueur. Un changement de plan passe ensuite par la page
          Abonnements.
        </p>
      </header>

      <BillingError error={actionError} title="Souscription impossible" />
      <BillingError error={plans.error} title="Catalogue indisponible" />

      {plans.loading ? <BillingLoading /> : null}

      {!plans.loading && (plans.data ?? []).length === 0 ? (
        <BillingEmpty
          label="Aucun plan actif publié."
          hint="Un plan doit être ACTIF et posséder au moins un prix ACTIF pour être souscriptible."
        />
      ) : null}

      <div className="grid gap-4 lg:grid-cols-2">
        {(plans.data ?? []).map((plan) => {
          const prices = (plan.prices ?? []).filter((price) => price.status === 'ACTIVE');
          const isCurrent = currentPlanId === plan.id;
          return (
            <BillingPanel
              key={plan.id}
              title={plan.name}
              description={`${plan.code}${plan.description ? ` · ${plan.description}` : ''}`}
              actions={<StatusBadge value={plan.status} />}
            >
              <div className="space-y-2">
                <p className="text-xs text-slate-500">
                  Cycle : {String(plan.billingInterval ?? '—').toLowerCase()}
                  {plan.intervalCount && plan.intervalCount > 1 ? ` × ${plan.intervalCount}` : ''}
                  {plan.trialDays ? ` · essai ${plan.trialDays} j` : ''}
                </p>
                {prices.length === 0 ? (
                  <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">
                    Aucun prix actif : ce plan n'est pas vendable en l'état.
                  </p>
                ) : (
                  <ul className="divide-y divide-slate-100">
                    {prices.map((price) => (
                      <li key={price.id} className="flex items-center justify-between gap-3 py-2">
                        <span className="text-sm text-slate-700">
                          {amount(price.amount, price.currency)}{' '}
                          <span className="text-xs text-slate-500">
                            / {String(price.interval).toLowerCase()}
                          </span>
                        </span>
                        <ActionButton
                          tone={isCurrent ? 'slate' : 'primary'}
                          disabled={isCurrent || submitting}
                          onClick={() => setSelected({ id: plan.id, priceId: price.id, label: `${plan.name} — ${amount(price.amount, price.currency)}` })}
                        >
                          {isCurrent ? 'Plan courant' : 'Souscrire'}
                        </ActionButton>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </BillingPanel>
          );
        })}
      </div>

      {selected ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-5 shadow-xl">
            <h2 className="text-base font-semibold text-slate-900">Confirmer la souscription</h2>
            <p className="mt-2 text-sm text-slate-600">
              Vous êtes sur le point de souscrire « {selected.label} ». La période de facturation et le
              prix appliqué proviennent du Price choisi, pas du client.
            </p>
            <div className="mt-4 flex justify-end gap-2">
              <ActionButton onClick={() => setSelected(null)} disabled={submitting}>
                Annuler
              </ActionButton>
              <ActionButton tone="primary" onClick={subscribe} disabled={submitting}>
                {submitting ? 'Envoi…' : 'Confirmer'}
              </ActionButton>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
