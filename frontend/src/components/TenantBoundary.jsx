import React, { useState } from 'react';
import { useTenant } from '../contexts/TenantProvider.jsx';
export default function TenantBoundary({ children }) {
  const { tenants, activeTenant, loading, error, switchTenant, refreshTenants } = useTenant();
  const [switchError, setSwitchError] = useState('');
  if (loading) return <p role="status" className="p-6">Chargement du contexte tenant…</p>;
  if (error) return <section role="alert" className="rounded-xl border border-amber-200 bg-amber-50 p-6"><h1 className="text-xl font-semibold">Contexte tenant indisponible</h1><p>Impossible de charger ou d’activer votre tenant.</p><button className="mt-4 rounded bg-white px-4 py-2" onClick={refreshTenants}>Réessayer</button></section>;
  if (!activeTenant) return <section className="rounded-xl border border-slate-200 bg-white p-6" data-testid="tenant-required">
    <h1 className="text-xl font-semibold">{tenants.length ? 'Sélectionnez un tenant' : 'Aucun tenant autorisé'}</h1>
    <p className="mt-2 text-slate-600">{tenants.length ? 'Choisissez votre espace de travail pour continuer.' : 'Votre compte est connecté. Un administrateur doit vous rattacher à un tenant pour accéder aux données métier.'}</p>
    {tenants.length > 0 && <label className="mt-4 block">Tenant<select aria-label="Tenant actif" defaultValue="" className="ml-3 rounded border p-2" onChange={async event => { try { await switchTenant(event.target.value); } catch { setSwitchError('Sélection impossible'); } }}><option value="" disabled>Choisir…</option>{tenants.map(tenant => <option key={tenant.id} value={tenant.id}>{tenant.name || tenant.code}</option>)}</select></label>}
    {switchError && <p role="alert">{switchError}</p>}
  </section>;
  return children;
}
