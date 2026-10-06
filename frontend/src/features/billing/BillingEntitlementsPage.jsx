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
 * Droits commerciaux effectifs (CDC 14/16/84).
 *
 * Affiche l'état résolu par le backend (plan, overrides, grâce) et relit la
 * résolution à la demande. Aucune règle n'est réimplémentée ici : la page ne
 * recalcule ni limite, ni statut, ni fenêtre de grâce.
 */
export default function BillingEntitlementsPage({ title = 'Entitlements' }) {
  const entitlements = useBillingResource(() => billingService.entitlements(), []);

  const state = entitlements.data?.state ?? null;
  const rows = entitlements.data?.entitlements ?? [];
  const restricted = entitlements.data?.restricted ?? [];

  return (
    <div className="space-y-5">
      <header>
        <h1 className="text-lg font-semibold text-slate-900">{title}</h1>
        <p className="mt-1 text-sm text-slate-600">
          Droits commerciaux appliqués à ce tenant, distincts des permissions IAM.
        </p>
      </header>

      <BillingError error={entitlements.error} title="Entitlements indisponibles" />

      <BillingPanel
        title="État de la résolution"
        actions={
          <>
            <StatusBadge value={state} />
            <ActionButton onClick={() => entitlements.reload()}>Relire</ActionButton>
          </>
        }
      >
        {entitlements.loading ? <BillingLoading /> : null}
        {!entitlements.loading ? (
          <div>
            <DataRow label="Abonnement">{(entitlements.data?.subscriptionId ?? 'Aucun')}</DataRow>
            <DataRow label="Résolu le">{entitlements.data?.resolvedAt ?? '—'}</DataRow>
            <DataRow label="Droits restreints">
              {restricted.length === 0 ? 'Aucun' : restricted.join(', ')}
            </DataRow>
          </div>
        ) : null}
      </BillingPanel>

      <BillingPanel title="Droits effectifs" description="Une ligne par droit appliqué.">
        {entitlements.loading ? <BillingLoading /> : null}
        {!entitlements.loading && rows.length === 0 ? (
          <BillingEmpty
            label="Aucun entitlement."
            hint="L'abonnement doit être actif et le plan porter des capabilities."
          />
        ) : null}
        {rows.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="py-2">Clé</th>
                  <th className="py-2">Nature</th>
                  <th className="py-2">Application</th>
                  <th className="py-2">Limite</th>
                  <th className="py-2">Utilisé</th>
                  <th className="py-2">Source</th>
                  <th className="py-2">État</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.map((row) => (
                  <tr key={row.key}>
                    <td className="py-2 font-medium text-slate-800">{row.key}</td>
                    <td className="py-2 text-slate-600">{row.kind}</td>
                    <td className="py-2 text-slate-600">{row.enforcement}</td>
                    <td className="py-2 text-slate-700">
                      {row.limit ?? '∞'}
                      {row.unit ? ` ${row.unit}` : ''}
                    </td>
                    <td className="py-2 text-slate-700">
                      {row.used ?? 0}
                      {row.remaining !== null && row.remaining !== undefined
                        ? ` (restant ${row.remaining})`
                        : ''}
                    </td>
                    <td className="py-2 text-slate-600">{row.source ?? '—'}</td>
                    <td className="py-2"><StatusBadge value={row.status} /></td>
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