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
 * Factures et lignes de facture (CDC 12/13/84).
 *
 * L'émission et l'annulation d'une facture sont des actes plateforme
 * (cross-tenant) : elles ne sont pas proposees ici, seulement affichees et
 * telechargeables via l'URL de document renvoyee par l'API.
 */
export default function BillingInvoicesPage({ title = 'Factures' }) {
  const [status, setStatus] = useState('');
  const invoices = useBillingResource(
    () => billingService.invoices({ ...(status ? { status } : {}), limit: 100 }),
    [status],
  );
  const [selectedId, setSelectedId] = useState(null);
  const detail = useBillingResource(
    () => (selectedId ? billingService.invoice(selectedId) : Promise.resolve(null)),
    [selectedId],
    { auto: Boolean(selectedId) },
  );

  const rows = invoices.data ?? [];
  const invoice = detail.data ?? null;

  return (
    <div className="space-y-5">
      <header>
        <h1 className="text-lg font-semibold text-slate-900">{title}</h1>
        <p className="mt-1 text-sm text-slate-600">
          Factures émises pour ce tenant, avec le détail des lignes et le lien de document fourni par
          le backend.
        </p>
      </header>

      <BillingError error={invoices.error} title="Factures indisponibles" />

      <BillingPanel
        title="Liste des factures"
        actions={
          <div className="flex items-center gap-2">
            <label className="sr-only" htmlFor="invoice-status">Filtrer par statut</label>
            <select
              id="invoice-status"
              value={status}
              onChange={(event) => setStatus(event.target.value)}
              className="rounded-lg border border-slate-300 px-2 py-1.5 text-xs"
            >
              <option value="">Tous les statuts</option>
              {['DRAFT', 'OPEN', 'PARTIALLY_PAID', 'PAID', 'OVERDUE', 'VOID'].map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
            <ActionButton onClick={() => invoices.reload()}>Actualiser</ActionButton>
          </div>
        }
      >
        {invoices.loading ? <BillingLoading /> : null}
        {!invoices.loading && rows.length === 0 ? (
          <BillingEmpty
            label="Aucune facture pour ce tenant."
            hint="Une facture est creee a l'émission de la période de facturation."
          />
        ) : null}
        {rows.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="py-2">Numéro</th>
                  <th className="py-2">Émise le</th>
                  <th className="py-2">Échéance</th>
                  <th className="py-2">Total</th>
                  <th className="py-2">Reste du</th>
                  <th className="py-2">Statut</th>
                  <th className="py-2" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.map((row) => (
                  <tr key={row.id}>
                    <td className="py-2 font-medium text-slate-800">{row.invoiceNumber}</td>
                    <td className="py-2 text-slate-600">{dateOnly(row.issuedAt)}</td>
                    <td className="py-2 text-slate-600">{dateOnly(row.dueAt)}</td>
                    <td className="py-2 text-slate-700">{amount(row.amountTotal, row.currency)}</td>
                    <td className="py-2 text-slate-700">{amount(row.amountDue, row.currency)}</td>
                    <td className="py-2"><StatusBadge value={row.status} /></td>
                    <td className="py-2 text-right">
                      <ActionButton onClick={() => setSelectedId(row.id)}>Détail</ActionButton>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </BillingPanel>

      {selectedId ? (
        <BillingPanel
          title={`Facture ${invoice?.invoiceNumber ?? ''}`}
          actions={<ActionButton onClick={() => setSelectedId(null)}>Fermer</ActionButton>}
        >
          {detail.loading ? <BillingLoading /> : null}
          <BillingError error={detail.error} title="Détail indisponible" />
          {invoice ? (
            <>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <DataRow label="Statut"><StatusBadge value={invoice.status} /></DataRow>
                  <DataRow label="Période">
                    {dateOnly(invoice.periodStart)} → {dateOnly(invoice.periodEnd)}
                  </DataRow>
                  <DataRow label="Total">{amount(invoice.amountTotal, invoice.currency)}</DataRow>
                  <DataRow label="Paye">{amount(invoice.amountPaid, invoice.currency)}</DataRow>
                  <DataRow label="Reste du">{amount(invoice.amountDue, invoice.currency)}</DataRow>
                </div>
                <div>
                  <DataRow label="Échéance">{dateOnly(invoice.dueAt)}</DataRow>
                  <DataRow label="Émise le">{dateTime(invoice.issuedAt)}</DataRow>
                  <DataRow label="Référence plan">{invoice.planId ?? '—'}</DataRow>
                  <DataRow label="Abonnement">
                    <span className="font-mono text-xs">{invoice.subscriptionId ?? '—'}</span>
                  </DataRow>
                  <DataRow label="Document">
                    {invoice.documentUrl ? (
                      <a
                        href={invoice.documentUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-slate-900 underline"
                      >
                        Ouvrir
                      </a>
                    ) : (
                      'Aucun document'
                    )}
                  </DataRow>
                </div>
              </div>

              <h3 className="mt-4 text-sm font-semibold text-slate-900">Lignes</h3>
              {(invoice.lines ?? []).length === 0 ? (
                <BillingEmpty label="Aucune ligne sur cette facture." />
              ) : (
                <div className="mt-2 overflow-x-auto">
                  <table className="w-full min-w-[620px] text-left text-sm">
                    <thead className="text-xs uppercase tracking-wide text-slate-500">
                      <tr>
                        <th className="py-2">Description</th>
                        <th className="py-2">Quantité</th>
                        <th className="py-2">Prix unitaire</th>
                        <th className="py-2">Montant</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {(invoice.lines ?? []).map((line) => (
                        <tr key={line.id}>
                          <td className="py-2 text-slate-700">{line.description}</td>
                          <td className="py-2 text-slate-700">{line.quantity}</td>
                          <td className="py-2 text-slate-700">
                            {amount(line.unitAmount, invoice.currency)}
                          </td>
                          <td className="py-2 text-slate-700">{amount(line.amount, invoice.currency)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          ) : null}
        </BillingPanel>
      ) : null}
    </div>
  );
}