import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTenant } from '../contexts/TenantProvider.jsx';
import { ERP_RESOURCES, useErpResources } from '../erp/useErpResources.js';
import ErpErrorPanel from '../erp/ErpErrorPanel.jsx';

const labels = { LOADING: 'Chargement...', LOADED: 'Donnees recues', EMPTY: 'Aucune donnee', UNCONFIGURED: 'Non configure', ERROR: 'Erreur', FORBIDDEN: 'Acces refuse', UNAVAILABLE: 'Indisponible' };
function DashboardContent() {
  const { activeTenant } = useTenant();
  const { states, retry, retryAll } = useErpResources(activeTenant?.id);
  const [dismissed, setDismissed] = useState(null);
  const errors = Object.entries(states).filter(([,value]) => value.error).map(([resource,value]) => ({ resource, label: ERP_RESOURCES[resource], error: value.error }));
  return <div className="space-y-6 max-w-7xl mx-auto">
    <header className="flex flex-wrap items-center justify-between gap-4"><div><h1 className="text-2xl font-semibold text-slate-900">ERP / Dolibarr</h1><p className="mt-1 text-slate-600">Integration et synchronisation avec votre systeme ERP</p></div><Link className="rounded-lg bg-blue-600 px-4 py-2 text-white" to="/settings/erp">Connexion ERP</Link></header>
    <nav aria-label="Espaces ERP" className="flex flex-wrap gap-4 text-sm text-blue-700"><Link to="/erp" aria-current="page">Vue d'ensemble</Link><Link to="/erps">Connexions</Link><Link to="/erp/mappings">Mappings</Link><Link to="/settings/erp">Parametres et diagnostics</Link></nav>
    {dismissed !== states && <ErpErrorPanel errors={errors} onRetry={retry} onRetryAll={retryAll} onDismiss={() => setDismissed(states)} />}
    <section aria-label="Ressources ERP" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">{Object.entries(ERP_RESOURCES).map(([key,label]) => {
      const state = states[key] || { status: 'LOADING' };
      return <article key={key} data-erp-resource={key} data-state={state.status} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm" aria-busy={state.status === 'LOADING'}>
        <h2 className="font-medium text-slate-700">{label}</h2><p className="mt-3 text-3xl font-semibold text-slate-900">{state.data ? state.data.length : '—'}</p>
        <p className="mt-1 text-xs text-slate-500">{state.data ? 'Elements recus (100 maximum)' : labels[state.status]}</p>
        <Link to={'/erp/' + key} className="mt-4 inline-block text-sm text-blue-700">Consulter {label.toLowerCase()}</Link>
      </article>;
    })}</section>
    <p className="text-sm text-slate-500">Les compteurs indiquent les elements recus, pas le total ERP ni le nombre synchronise. Chaque ressource se charge independamment.</p>
    <div className="grid gap-5 lg:grid-cols-2">{['orders','invoices'].map(key => {
      const state = states[key] || { status: 'LOADING' };
      return <section key={key} className="rounded-xl border border-slate-200 bg-white p-5"><h2 className="font-semibold mb-4">{ERP_RESOURCES[key]}</h2>
        {state.data?.length ? <div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="text-left text-slate-500"><th className="py-2">Reference</th><th>Statut</th><th>Total</th></tr></thead><tbody>{state.data.slice(0,5).map(row => <tr key={row.id} className="border-t"><td className="py-3">{row.ref || row.id}</td><td>{row.status || '?'}</td><td>{row.total ?? '?'}</td></tr>)}</tbody></table></div> : <p className="text-sm text-slate-500">{labels[state.status]}</p>}
      </section>;
    })}</div>
  </div>;
}

export default function ERPDashboard() {
  const { activeTenant } = useTenant();
  return <DashboardContent key={activeTenant?.id} />;
}
