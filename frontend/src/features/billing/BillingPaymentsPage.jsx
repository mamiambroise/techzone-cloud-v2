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
  dateTime,
  useBillingResource,
} from './BillingUi.jsx';

/**
 * Paiements et providers (CDC 15/16/84).
 *
 * La plateforme n'embarque aucun provider de paiement : tant qu'aucun n'est
 * configure, le seul moyen de paiement réel est le paiement manuel saisi par la
 * plateforme. La page affiche ce constat tel quel, sans simuler de transaction.
 */
export default function BillingPaymentsPage({ title = 'Paiements' }) {
  const payments = useBillingResource(() => billingService.payments(), []);
  const providers = useBillingResource(() => billingService.providers(), []);
  const [method, setMethod] = useState('BANK_TRANSFER');
  const [référence, setReference] = useState('');
  const [invoiceId, setInvoiceId] = useState('');
  const [amountValue, setAmountValue] = useState('');
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState(null);
  const [notice, setNotice] = useState(null);

  const rows = payments.data ?? [];
  const list = providers.data?.providers ?? providers.data ?? [];

  const record = async () => {
    setBusy(true);
    setActionError(null);
    setNotice(null);
    try {
      const created = await billingService.recordManualPayment({
        invoiceId,
        method,
        référence,
        ...(amountValue ? { amount: amountValue } : {}),
      });
      setNotice(`Paiement ${created?.id ?? ''} enregistre (statut ${created?.status ?? 'inconnu'}).`);
      setReference('');
      setAmountValue('');
      setInvoiceId('');
      await payments.reload();
    } catch (raised) {
      setActionError(raised?.normalized ?? { message: raised?.message ?? 'Erreur inconnue' });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-5">
      <header>
        <h1 className="text-lg font-semibold text-slate-900">{title}</h1>
        <p className="mt-1 text-sm text-slate-600">
          Règlements saisis sur les factures du tenant et état réel des providers de paiement.
        </p>
      </header>

      <BillingError error={actionError} title="Paiement refusé" />
      {notice ? (
        <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
          {notice}
        </p>
      ) : null}

      <BillingPanel title="Providers configures" description="Aucun provider n'est ajoute implicitement.">
        {providers.loading ? <BillingLoading /> : null}
        <BillingError error={providers.error} title="Providers indisponibles" />
        {!providers.loading && (Array.isArray(list) ? list.length : 0) === 0 ? (
          <BillingEmpty
            label="Aucun provider de paiement externe configure."
            hint="Sans provider, seul le paiement manuel est operationnel."
          />
        ) : null}
        {Array.isArray(list) && list.length > 0 ? (
          <ul className="divide-y divide-slate-100">
            {list.map((provider) => (
              <li key={provider.id} className="flex items-center justify-between gap-3 py-2">
                <div>
                  <p className="text-sm text-slate-800">{provider.code ?? provider.provider}</p>
                  <p className="text-xs text-slate-500">{provider.mode ?? '—'}</p>
                </div>
                <StatusBadge value={provider.status} />
              </li>
            ))}
          </ul>
        ) : null}
        {providers.data?.policy ? (
          <p className="mt-3 rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-600">
            {providers.data.policy}
          </p>
        ) : null}
      </BillingPanel>

      <BillingPanel title="Saisir un paiement manuel" description="Action reservee a la plateforme (permission billing.payment.record).">
        <div className="grid gap-3 md:grid-cols-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600" htmlFor="payment-invoice">
              Facture
            </label>
            <input
              id="payment-invoice"
              value={invoiceId}
              onChange={(event) => setInvoiceId(event.target.value)}
              placeholder="UUID de facture"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600" htmlFor="payment-method">
              Méthode
            </label>
            <select
              id="payment-method"
              value={method}
              onChange={(event) => setMethod(event.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            >
              {['BANK_TRANSFER', 'CASH', 'CHECK', 'OTHER'].map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600" htmlFor="payment-référence">
              Référence
            </label>
            <input
              id="payment-référence"
              value={référence}
              onChange={(event) => setReference(event.target.value)}
              placeholder="Référence de l opération"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600" htmlFor="payment-amount">
              Montant (optionnel)
            </label>
            <input
              id="payment-amount"
              value={amountValue}
              onChange={(event) => setAmountValue(event.target.value)}
              placeholder="Montant exact"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
          </div>
        </div>
        <div className="mt-3">
          <ActionButton tone="primary" disabled={busy || !invoiceId || !référence} onClick={record}>
            {busy ? 'Enregistrement…' : 'Enregistrer le paiement'}
          </ActionButton>
        </div>
        <p className="mt-2 text-xs text-slate-500">
          Si la permission est absente, l'API renvoie le code d'erreur correspondant : le bouton
          n'invente pas de succès.
        </p>
      </BillingPanel>

      <BillingPanel title="Paiements" description="Règlements rattaches aux factures du tenant.">
        {payments.loading ? <BillingLoading /> : null}
        <BillingError error={payments.error} title="Paiements indisponibles" />
        {!payments.loading && rows.length === 0 ? (
          <BillingEmpty label="Aucun paiement enregistre." />
        ) : null}
        {rows.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="py-2">Identifiant</th>
                  <th className="py-2">Facture</th>
                  <th className="py-2">Montant</th>
                  <th className="py-2">Méthode</th>
                  <th className="py-2">Date</th>
                  <th className="py-2">Statut</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.map((payment) => (
                  <tr key={payment.id}>
                    <td className="py-2 font-mono text-xs text-slate-700">{payment.id}</td>
                    <td className="py-2 font-mono text-xs text-slate-500">{payment.invoiceId}</td>
                    <td className="py-2 text-slate-700">{amount(payment.amount, payment.currency)}</td>
                    <td className="py-2 text-slate-600">{payment.method}</td>
                    <td className="py-2 text-slate-600">{dateTime(payment.paidAt)}</td>
                    <td className="py-2"><StatusBadge value={payment.status} /></td>
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