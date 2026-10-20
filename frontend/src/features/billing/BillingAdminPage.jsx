import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { billingAdminService, billingService } from '../../services/apiClient.js';
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
 * Console plateforme Billing cross-tenant (CDC 13/70/71/72/84).
 *
 * Les appels sont des endpoints `/billing/admin/*` : en l'absence de permission
 * Billing globale, l'API renvoie le code d'erreur du contrat global et la page
 * l'affiche au lieu de masquer la restriction.
 */
export default function BillingAdminPage({ title = 'Billing Admin' }) {
  const { pathname } = useLocation();
  const tabForPath = {
    '/billing/admin/catalog': 'catalog',
    '/billing/admin/subscriptions': 'subscriptions',
    '/billing/admin/operations': 'operations',
    '/billing/admin/diagnostics': 'diagnostics',
  };
  const routeTab = tabForPath[pathname] ?? 'subscriptions';
  const [tab, setTab] = useState(routeTab);
  const [actionError, setActionError] = useState(null);
  const [sweepReport, setSweepReport] = useState(null);
  const [busy, setBusy] = useState(false);

  const subscriptions = useBillingResource(
    () => (tab === 'subscriptions' ? billingAdminService.subscriptions() : Promise.resolve(null)),
    [tab],
  );
  const invoices = useBillingResource(
    () => (tab === 'operations' ? billingAdminService.invoices() : Promise.resolve(null)),
    [tab],
  );
  const payments = useBillingResource(
    () => (tab === 'operations' ? billingAdminService.payments() : Promise.resolve(null)),
    [tab],
  );
  const products = useBillingResource(
    () => (tab === 'catalog' ? billingAdminService.products() : Promise.resolve(null)),
    [tab],
  );
  const features = useBillingResource(
    () => (tab === 'catalog' ? billingAdminService.features() : Promise.resolve(null)),
    [tab],
  );
  const activePlans = useBillingResource(
    () => (tab === 'catalog' ? billingService.plans() : Promise.resolve(null)),
    [tab],
  );
  const diagnostics = useBillingResource(
    () => (tab === 'diagnostics' ? billingAdminService.diagnostics() : Promise.resolve(null)),
    [tab],
  );
  const health = useBillingResource(
    () => (tab === 'diagnostics' ? billingAdminService.health() : Promise.resolve(null)),
    [tab],
  );
  useEffect(() => {
    setTab(routeTab);
    setSweepReport(null);
  }, [routeTab]);

  const runSweeps = async () => {
    setBusy(true);
    setActionError(null);
    try {
      const report = await billingAdminService.runSweeps();
      setSweepReport(report?.data ?? report ?? null);
    } catch (raised) {
      setActionError(raised?.normalized ?? { message: raised?.message ?? 'Erreur inconnue' });
    } finally {
      setBusy(false);
    }
  };

  const tabs = [
    { id: 'catalog', label: 'Offres & tarifs' },
    { id: 'subscriptions', label: 'Abonnements' },
    { id: 'operations', label: 'Opérations financières' },
    { id: 'diagnostics', label: 'Diagnostics' },
  ];

  const currentResource = {
    catalog: products,
    subscriptions,
    operations: invoices,
    diagnostics,
  }[tab];

  return (
    <div className="space-y-5">
      <header>
        <h1 className="text-lg font-semibold text-slate-900">{title}</h1>
        <p className="mt-1 text-sm text-slate-600">
          Vue plateforme transverse : tous les tenants. Réservée aux permissions Billing globales.
        </p>
      </header>

      <div className="flex flex-wrap gap-2 border-b border-slate-200">
        {tabs.map((entry) => (
          <button
            key={entry.id}
            type="button"
            onClick={() => { setTab(entry.id); setSweepReport(null); }}
            className={`-mb-px border-b-2 px-3 py-2 text-xs font-medium ${
              tab === entry.id
                ? 'border-slate-900 text-slate-900'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            {entry.label}
          </button>
        ))}
      </div>

      <BillingError error={actionError} title="Opération plateforme refusée" />
      <BillingError error={currentResource.error} title="Endpoint plateforme indisponible" />

      {currentResource.loading ? <BillingLoading /> : null}

      {tab === 'subscriptions' ? (
        <BillingPanel
          title="Abonnements tous tenants"
          actions={<ActionButton onClick={() => subscriptions.reload()}>Actualiser</ActionButton>}
        >
          {(subscriptions.data ?? []).length === 0 ? (
            <BillingEmpty label="Aucun abonnement sur la plateforme." />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[820px] text-left text-sm">
                <thead className="text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="py-2">Tenant</th>
                    <th className="py-2">Plan</th>
                    <th className="py-2">Statut</th>
                    <th className="py-2">Prix</th>
                    <th className="py-2">Fin de période</th>
                    <th className="py-2">Grâce</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {(subscriptions.data ?? []).map((row) => (
                    <tr key={row.id}>
                      <td className="py-2 font-mono text-xs text-slate-700">{row.tenantId}</td>
                      <td className="py-2 text-slate-700">{row.plan?.name ?? row.planId}</td>
                      <td className="py-2"><StatusBadge value={row.status} /></td>
                      <td className="py-2 text-slate-700">
                        {row.price
                          ? `${amount(row.price.amount, row.price.currency)} / ${String(
                              row.price.interval,
                            ).toLowerCase()}`
                          : '—'}
                      </td>
                      <td className="py-2 text-slate-600">{dateOnly(row.currentPeriodEnd)}</td>
                      <td className="py-2 text-slate-600">
                        {row.graceEndsAt ? dateTime(row.graceEndsAt) : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </BillingPanel>
      ) : null}

      {tab === 'catalog' ? (
        <div className="grid gap-5 xl:grid-cols-2">
          <BillingPanel title="Produits" description="Référentiel plateforme utilisé par les offres." actions={<ActionButton onClick={() => products.reload()}>Actualiser</ActionButton>}>
            {(products.data ?? []).length === 0 ? <BillingEmpty label="Aucun produit retourné par le catalogue." /> : (
              <ul className="divide-y divide-slate-100">{(products.data ?? []).map((product) => <li key={product.id} className="flex items-center justify-between gap-3 py-2"><div><p className="text-sm font-medium text-slate-800">{product.name}</p><p className="text-xs text-slate-500">{product.key ?? product.id}</p></div><StatusBadge value={product.status} /></li>)}</ul>
            )}
          </BillingPanel>
          <BillingPanel title="Offres actives et tarifs" description="Seuls les plans et prix publiés sont lisibles par le catalogue client." actions={<ActionButton onClick={() => activePlans.reload()}>Actualiser</ActionButton>}>
            {(activePlans.data ?? []).length === 0 ? <BillingEmpty label="Aucun plan actif retourné." /> : (
              <ul className="divide-y divide-slate-100">{(activePlans.data ?? []).map((plan) => <li key={plan.id} className="py-2"><div className="flex items-center justify-between gap-3"><span className="text-sm font-medium text-slate-800">{plan.name}</span><StatusBadge value={plan.status} /></div><p className="mt-1 text-xs text-slate-500">{(plan.prices ?? []).map((price) => `${amount(price.amount, price.currency)} / ${String(price.interval).toLowerCase()}`).join(' · ') || 'Aucun prix actif'}</p></li>)}</ul>
            )}
          </BillingPanel>
          <BillingPanel title="Clés d’entitlement" description="Référentiel commercial, distinct des permissions IAM." actions={<ActionButton onClick={() => features.reload()}>Actualiser</ActionButton>}>
            {(features.data ?? []).length === 0 ? <BillingEmpty label="Aucune clé d’entitlement retournée." /> : (
              <ul className="divide-y divide-slate-100">{(features.data ?? []).map((feature) => <li key={feature.id ?? feature.code} className="py-2 text-sm text-slate-700">{feature.code ?? feature.key ?? feature.id}</li>)}</ul>
            )}
          </BillingPanel>
          <BillingPanel title="Périmètre de cette version" description="Le backend ne fournit pas encore de liste administrative des brouillons ni d’éditeur complet des tarifs.">
            <p className="text-sm text-slate-600">Aucune donnée commerciale n’est simulée : cette vue n’affiche que les réponses actuelles des services catalogue.</p>
          </BillingPanel>
        </div>
      ) : null}

      {tab === 'operations' ? (
        <div className="space-y-5">
        <BillingPanel
          title="Factures tous tenants"
          actions={<ActionButton onClick={() => invoices.reload()}>Actualiser</ActionButton>}
        >
          {(invoices.data ?? []).length === 0 ? (
            <BillingEmpty label="Aucune facture sur la plateforme." />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[820px] text-left text-sm">
                <thead className="text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="py-2">Numéro</th>
                    <th className="py-2">Tenant</th>
                    <th className="py-2">Total</th>
                    <th className="py-2">Reste du</th>
                    <th className="py-2">Échéance</th>
                    <th className="py-2">Statut</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {(invoices.data ?? []).map((row) => (
                    <tr key={row.id}>
                      <td className="py-2 font-medium text-slate-800">{row.invoiceNumber}</td>
                      <td className="py-2 font-mono text-xs text-slate-500">{row.tenantId}</td>
                      <td className="py-2 text-slate-700">{amount(row.amountTotal, row.currency)}</td>
                      <td className="py-2 text-slate-700">{amount(row.amountDue, row.currency)}</td>
                      <td className="py-2 text-slate-600">{dateOnly(row.dueAt)}</td>
                      <td className="py-2"><StatusBadge value={row.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </BillingPanel>
        <BillingPanel
          title="Paiements tous tenants"
          actions={<ActionButton onClick={() => payments.reload()}>Actualiser</ActionButton>}
        >
          {(payments.data ?? []).length === 0 ? (
            <BillingEmpty label="Aucun paiement sur la plateforme." />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-left text-sm">
                <thead className="text-xs uppercase tracking-wide text-slate-500"><tr><th className="py-2">Tenant</th><th className="py-2">Facture</th><th className="py-2">Montant</th><th className="py-2">Méthode</th><th className="py-2">Statut</th></tr></thead>
                <tbody className="divide-y divide-slate-100">
                  {(payments.data ?? []).map((row) => <tr key={row.id}><td className="py-2 font-mono text-xs text-slate-500">{row.tenantId}</td><td className="py-2 font-mono text-xs text-slate-500">{row.invoiceId}</td><td className="py-2 text-slate-700">{amount(row.amount, row.currency)}</td><td className="py-2 text-slate-600">{row.method}</td><td className="py-2"><StatusBadge value={row.status} /></td></tr>)}
                </tbody>
              </table>
            </div>
          )}
        </BillingPanel>
        </div>
      ) : null}

      {tab === 'diagnostics' ? (
        <BillingPanel
          title="Diagnostics plateforme"
          actions={<ActionButton onClick={() => diagnostics.reload()}>Actualiser</ActionButton>}
        >
          {diagnostics.data ? (
            <div>
              <DataRow label="Santé"><StatusBadge value={diagnostics.data.health} /></DataRow>
              <DataRow label="Évalué le">{dateTime(diagnostics.data.evaluatedAt)}</DataRow>
              <DataRow label="Suspendus">{diagnostics.data.suspended ?? '—'}</DataRow>
              <DataRow label="Délinquents">{diagnostics.data.pastDue ?? '—'}</DataRow>
              <DataRow label="Périodes de grâce">{diagnostics.data.gracePeriods ?? '—'}</DataRow>
              <DataRow label="Factures échouées">{diagnostics.data.overdueInvoices ?? '—'}</DataRow>
              <DataRow label="Abonnements à relancer">
                {diagnostics.data.dueForRenewal ?? '—'}
              </DataRow>
              {(diagnostics.data.signals ?? []).length > 0 ? (
                <div className="mt-3">
                  <h3 className="text-sm font-semibold text-slate-900">Signaux</h3>
                  <ul className="mt-1 divide-y divide-slate-100">
                    {(diagnostics.data.signals ?? []).map((signal) => (
                      <li
                        key={`${signal.code}-${signal.tenantId ?? 'platform'}`}
                        className="flex items-center justify-between gap-3 py-2"
                      >
                        <span className="text-sm text-slate-700">{signal.code}</span>
                        <StatusBadge value={signal.severity} />
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </div>
          ) : (
            <BillingEmpty label="Aucun diagnostic renvoyé." />
          )}
        </BillingPanel>
      ) : null}

      {tab === 'diagnostics' ? (
        <BillingPanel
          title="Balayages périodiques"
          description="Renouvellement, fin d'essai, échéances de facture, grâce et résiliations programmées."
          actions={
            <>
              <ActionButton onClick={() => health.reload()}>Actualiser l'état</ActionButton>
              <ActionButton tone="primary" onClick={runSweeps} disabled={busy}>
                {busy ? 'Exécution…' : 'Lancer les balayages'}
              </ActionButton>
            </>
          }
        >
          {health.data ? (
            <div>
              <DataRow label="Santé"><StatusBadge value={health.data.health ?? health.data.status} /></DataRow>
              <DataRow label="Vérifié le">
                {dateTime(health.data.checkedAt ?? health.data.evaluatedAt)}
              </DataRow>
            </div>
          ) : (
            <BillingLoading label="État Billing en cours de lecture…" />
          )}

          {sweepReport ? (
            <div className="mt-4">
              <h3 className="text-sm font-semibold text-slate-900">Rapport du balayage</h3>
              <div className="mt-1">
                {Object.entries(sweepReport).map(([key, value]) => (
                  <DataRow key={key} label={key}>
                    {typeof value === 'object' && value !== null ? (
                      <code className="text-[11px]">{JSON.stringify(value)}</code>
                    ) : key === 'at' ? (
                      dateTime(value)
                    ) : (
                      String(value)
                    )}
                  </DataRow>
                ))}
              </div>
            </div>
          ) : (
            <p className="mt-3 text-xs text-slate-500">
              Aucun rapport de balayage dans cette session. Le rapport ci-dessus est celui renvoyé
              par le dernier appel : rien n'est reconstitué localement.
            </p>
          )}
        </BillingPanel>
      ) : null}
    </div>
  );
}
