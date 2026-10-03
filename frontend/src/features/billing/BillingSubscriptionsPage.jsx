import { useState } from 'react';
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
 * Abonnement du tenant : cycle de vie et changements de plan (CDC 6/7/8/9/10/84).
 *
 * Toutes les transitions affichent le code d'erreur du contrat global quand
 * elles sont refusées (droits insuffisants, plan incompatible, etc.).
 */
export default function BillingSubscriptionsPage({ title = 'Abonnements' }) {
  const subscription = useBillingResource(() => billingService.subscription(), []);
  const plans = useBillingResource(() => billingService.plans(), []);
  const [actionError, setActionError] = useState(null);
  const [notice, setNotice] = useState(null);
  const [busy, setBusy] = useState(false);
  const [pendingPlan, setPendingPlan] = useState('');

  const current = subscription.data ?? null;

  const run = async (opération, successMessage) => {
    setBusy(true);
    setActionError(null);
    try {
      await opération();
      if (successMessage) setNotice(successMessage);
      await subscription.reload();
    } catch (raised) {
      setActionError(raised?.normalized ?? { message: raised?.message ?? 'Erreur inconnue' });
    } finally {
      setBusy(false);
    }
  };

  const changePlan = async () => {
    if (!pendingPlan) return;
    const plan = (plans.data ?? []).find((entry) => entry.id === pendingPlan);
    const price = (plan?.prices ?? []).find((entry) => entry.status === 'ACTIVE');
    await run(
      () =>
        billingService.changePlan({
          planId: pendingPlan,
          priceId: price?.id,
        }),
      'Changement de plan enregistré.',
    );
    setPendingPlan('');
  };

  const status = current?.status;
  const isActive = ['ACTIVE', 'TRIALING', 'GRACE_PERIOD', 'PAST_DUE'].includes(status);
  const isTerminal = ['CANCELLED', 'EXPIRED', 'ENDED'].includes(status);

  return (
    <div className="space-y-5">
      <header>
        <h1 className="text-lg font-semibold text-slate-900">{title}</h1>
        <p className="mt-1 text-sm text-slate-600">
          Contrat commercial du tenant, période en cours, échéances et transitions autorisées.
        </p>
      </header>

      <BillingError error={actionError} title="Opération refusée" />
      {notice ? (
        <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
          {notice}
        </p>
      ) : null}
      <BillingError error={subscription.error} title="Abonnement indisponible" />

      <BillingPanel
        title="Contrat en cours"
        description="Lecture de l'abonnement actif, sans valeur calculée localement."
        actions={<ActionButton onClick={() => { subscription.reload(); }}>Actualiser</ActionButton>}
      >
        {subscription.loading ? <BillingLoading /> : null}
        {!subscription.loading && !current ? (
          <BillingEmpty
            label="Aucun abonnement pour ce tenant."
            hint="Souscrivez un plan pour générer une période de facturation."
          />
        ) : null}
        {current ? (
          <div>
            <DataRow label="Identifiant">
              <span className="font-mono text-xs">{current.id}</span>
            </DataRow>
            <DataRow label="Plan">{current.plan?.name ?? current.planId}</DataRow>
            <DataRow label="Statut"><StatusBadge value={current.status} /></DataRow>
            <DataRow label="Prix">
              {current.price
                ? `${amount(current.price.amount, current.price.currency)} / ${String(
                    current.price.interval,
                  ).toLowerCase()}`
                : 'Aucun prix associé'}
            </DataRow>
            <DataRow label="Début de période">{dateOnly(current.currentPeriodStart)}</DataRow>
            <DataRow label="Fin de période">{dateOnly(current.currentPeriodEnd)}</DataRow>
            <DataRow label="Prochaine échéance">{dateTime(current.renewalAt)}</DataRow>
            <DataRow label="Résilié le">
              {current.cancelledAt ? dateTime(current.cancelledAt) : 'Non résilié'}
            </DataRow>
            <DataRow label="Fin de grâce">
              {current.graceEndsAt ? dateTime(current.graceEndsAt) : '—'}
            </DataRow>
            {current.currentPeriodEnd ? (
              <p className="mt-3 text-xs text-slate-500">
                Aucune reconversion de devise n'est faite ici : la devise affichée est celle du prix
                attaché à l'abonnement.
              </p>
            ) : null}
          </div>
        ) : null}
      </BillingPanel>

      {current ? (
        <BillingPanel
          title="Actions du contrat"
          description="Les transitions refusées par le backend sont refusées aussi ici."
        >
          <div className="flex flex-wrap gap-2">
            <ActionButton
              disabled={busy || !isTerminal}
              onClick={() => run(() => billingService.reactivateSubscription(), 'Abonnement réactivé.')}
            >
              Réactiver
            </ActionButton>
            <ActionButton
              tone="danger"
              disabled={busy || !isActive}
              onClick={() =>
                run(() => billingService.cancelSubscription({ mode: 'AT_PERIOD_END' }), 'Résiliation programmée.')
              }
            >
              Résilier en fin de période
            </ActionButton>
            <ActionButton
              tone="danger"
              disabled={busy || !isActive}
              onClick={() =>
                run(() => billingService.cancelSubscription({ mode: 'IMMEDIATE' }), 'Résiliation immédiate.')
              }
            >
              Résilier immédiatement
            </ActionButton>
          </div>
          <p className="mt-3 text-xs text-slate-500">
            Une suspension pour impayé (PAST_DUE / GRACE_PERIOD) se lève par la plateforme après
            encaissement, pas par ces actions.
          </p>
        </BillingPanel>
      ) : null}

      <BillingPanel
        title="Changer de plan"
        description="Le nouveau plan et son prix sont choisis dans le catalogue actif."
      >
        {plans.loading ? <BillingLoading /> : null}
        <div className="flex flex-wrap items-end gap-3">
          <div className="min-w-[240px] flex-1">
            <label className="mb-1 block text-xs font-medium text-slate-600" htmlFor="plan-change">
              Plan cible
            </label>
            <select
              id="plan-change"
              value={pendingPlan}
              onChange={(event) => setPendingPlan(event.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            >
              <option value="">Sélectionner un plan</option>
              {(plans.data ?? [])
                .filter((plan) => (plan.prices ?? []).some((price) => price.status === 'ACTIVE'))
                .map((plan) => (
                  <option key={plan.id} value={plan.id}>
                    {plan.name}
                  </option>
                ))}
            </select>
          </div>
          <ActionButton
            tone="primary"
            disabled={busy || !pendingPlan || !current}
            onClick={changePlan}
          >
            Appliquer
          </ActionButton>
        </div>
        {current ? null : (
          <p className="mt-2 text-xs text-amber-700">
            Sans abonnement existant, utilisez la page Plans pour créer la première souscription.
          </p>
        )}
      </BillingPanel>
    </div>
  );
}
