import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { useTenant } from '../contexts/TenantProvider.jsx';
import { ERP_STATUS_LABELS, useErpCatalog } from '../erp/useErpResources.js';
import { ROUTES } from '../app/routes.js';
import { BmPage, BmBreadcrumb, BmPageHeader, BmCard } from '../components/business-manager/bm/ui.jsx';

export default function ErpResourcesNav() {
  const { activeTenant } = useTenant();
  const { status, catalog, error, retry } = useErpCatalog(activeTenant?.id);
  return <BmPage>
    <BmBreadcrumb items={[{ label: 'ERP / Dolibarr', to: ROUTES.erp }, { label: 'Ressources' }]} />
    <BmPageHeader title="Ressources ERP" subtitle="Catalogue effectif du connecteur du tenant courant. Les statuts Dolibarr ne sont jamais déduits de cette navigation." />
    {status === 'LOADING' && <div aria-busy="true" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{Array.from({ length: 6 }, (_, index) => <div key={index} className="h-20 animate-pulse rounded-lg bg-slate-100" />)}</div>}
    {status === 'ERROR' && <section role="alert" className="rounded-lg border border-rose-200 bg-rose-50 p-4"><p className="text-sm text-rose-900">{error?.response?.data?.message || error?.message || 'Catalogue ERP indisponible.'}</p><button type="button" onClick={retry} className="mt-2 text-sm font-medium text-rose-900 underline">Réessayer</button></section>}
    {catalog && <><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{catalog.resources.map((resource) => {
      const readable = resource.operations.find((operation) => operation.key === 'read');
      const canOpen = Boolean(resource.routeKey && readable?.executable);
      return <BmCard key={resource.key}>{canOpen ? <Link to={`/erp/${resource.routeKey}`} className="flex items-center justify-between gap-3 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"><span><span className="block font-medium text-slate-800">{resource.label}</span><span className="mt-1 block text-xs text-slate-500">{ERP_STATUS_LABELS[resource.effectiveStatus] || resource.effectiveStatus}</span></span><ArrowRight size={14} className="shrink-0 text-blue-600" aria-hidden="true" /></Link> : <div><span className="block font-medium text-slate-800">{resource.label}</span><span className="mt-1 block text-xs text-slate-500">{ERP_STATUS_LABELS[resource.effectiveStatus] || resource.effectiveStatus} · Action bloquée</span></div>}</BmCard>;
    })}</div><p className="text-sm text-slate-500">Les écrans existants conservent leur configuration de présentation locale ; le catalogue backend reste l’autorité pour les capacités et disponibilités.</p></>}
  </BmPage>;
}
