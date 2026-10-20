import { useEffect, useState } from 'react';
import { useAuth } from '../../auth/AuthProvider.jsx';
import { billingService } from '../../services/apiClient.js';
import {
  ActionButton,
  BillingEmpty,
  BillingError,
  BillingLoading,
  BillingPanel,
  useBillingResource,
} from './BillingUi.jsx';

const emptyAccount = {
  customerName: '',
  legalName: '',
  billingEmail: '',
  billingContact: '',
  currency: '',
  taxIdentifier: '',
};

/**
 * Compte de facturation du tenant courant.
 *
 * La lecture reste tenant-scopee. L'enregistrement demeure soumis a
 * `billing:invoice:manage` par l'API; l'interface ne le remplace pas.
 */
export default function BillingSettingsPage({ title = 'Paramètres de facturation' }) {
  const { user } = useAuth();
  const account = useBillingResource(() => billingService.billingAccount(), []);
  const [form, setForm] = useState(emptyAccount);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const [saved, setSaved] = useState(false);
  const permissions = user?.permissions ?? [];
  const canManage = user?.isSuperAdmin || permissions.includes('*') || permissions.includes('billing:invoice:manage');

  useEffect(() => {
    if (!account.data) return;
    setForm({
      id: account.data.id,
      customerName: account.data.customerName ?? '',
      legalName: account.data.legalName ?? '',
      billingEmail: account.data.billingEmail ?? '',
      billingContact: account.data.billingContact ?? '',
      currency: account.data.currency ?? '',
      taxIdentifier: account.data.taxIdentifier ?? '',
    });
  }, [account.data]);

  const update = (field) => (event) => {
    setSaved(false);
    setForm((current) => ({ ...current, [field]: event.target.value }));
  };

  const save = async (event) => {
    event.preventDefault();
    setSaving(true);
    setSaveError(null);
    setSaved(false);
    try {
      await billingService.saveBillingAccount({
        ...form,
        legalName: form.legalName || null,
        billingContact: form.billingContact || null,
        taxIdentifier: form.taxIdentifier || null,
        currency: form.currency || undefined,
      });
      setSaved(true);
      await account.reload();
    } catch (raised) {
      setSaveError(raised?.normalized ?? { message: raised?.message ?? 'Erreur inconnue' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-5">
      <header>
        <h1 className="text-lg font-semibold text-slate-900">{title}</h1>
        <p className="mt-1 text-sm text-slate-600">
          Coordonnées légales utilisées pour la facturation du tenant courant.
        </p>
      </header>

      {account.error?.statusCode !== 404 ? <BillingError error={account.error} title="Compte de facturation indisponible" /> : null}
      <BillingError error={saveError} title="Enregistrement refusé" />

      <BillingPanel
        title="Compte de facturation"
        description="Les modifications sont journalisées par le service Billing."
        actions={<ActionButton onClick={() => account.reload()}>Actualiser</ActionButton>}
      >
        {account.loading ? <BillingLoading /> : null}
        {!account.loading && account.error?.statusCode === 404 ? (
          <BillingEmpty
            label="Aucun compte de facturation n’est encore configuré."
            hint={canManage ? 'Renseignez les informations ci-dessous pour en créer un.' : 'Un utilisateur autorisé peut le configurer.'}
          />
        ) : null}

        {!account.loading ? (
          <form onSubmit={save} className="mt-4 grid gap-4 md:grid-cols-2">
            <Field label="Nom client" id="billing-customer-name" value={form.customerName} onChange={update('customerName')} required disabled={!canManage} />
            <Field label="Email de facturation" id="billing-email" type="email" value={form.billingEmail} onChange={update('billingEmail')} required disabled={!canManage} />
            <Field label="Raison sociale" id="billing-legal-name" value={form.legalName} onChange={update('legalName')} disabled={!canManage} />
            <Field label="Contact facturation" id="billing-contact" value={form.billingContact} onChange={update('billingContact')} disabled={!canManage} />
            <Field label="Devise" id="billing-currency" value={form.currency} onChange={update('currency')} placeholder="Ex. EUR" disabled={!canManage} />
            <Field label="Identifiant fiscal" id="billing-tax-identifier" value={form.taxIdentifier} onChange={update('taxIdentifier')} disabled={!canManage} />
            <div className="md:col-span-2 flex flex-wrap items-center gap-3">
              <ActionButton tone="primary" type="submit" disabled={!canManage || saving || !form.customerName || !form.billingEmail}>
                {saving ? 'Enregistrement…' : account.data ? 'Enregistrer les modifications' : 'Créer le compte'}
              </ActionButton>
              {!canManage ? <p className="text-xs text-slate-500">Lecture seule : permission `billing:invoice:manage` requise pour modifier.</p> : null}
              {saved ? <p role="status" className="text-xs text-emerald-700">Informations enregistrées.</p> : null}
            </div>
          </form>
        ) : null}
      </BillingPanel>
    </div>
  );
}

function Field({ label, id, type = 'text', value, onChange, required, disabled, placeholder }) {
  return (
    <div>
      <label className="mb-1 block text-xs font-medium text-slate-600" htmlFor={id}>{label}</label>
      <input
        id={id}
        type={type}
        value={value}
        onChange={onChange}
        required={required}
        disabled={disabled}
        placeholder={placeholder}
        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500"
      />
    </div>
  );
}
