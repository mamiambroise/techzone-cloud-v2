import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { ERP_RESOURCES } from '../erp/useErpResources.js';
import { ROUTES } from '../app/routes.js';
import { BmPage, BmBreadcrumb, BmPageHeader, BmCard } from '../components/business-manager/bm/ui.jsx';

// Hub de navigation pur : aucune logique ERP, aucun appel API.
// Il expose les écrans ERP existants qui restent dans le workspace du module.
const DETAIL_ROUTES = {
  clients: ROUTES['erp-clients'],
  products: ROUTES['erp-products'],
  orders: ROUTES['erp-orders'],
  invoices: ROUTES['erp-invoices'],
  stocks: ROUTES['erp-stocks'],
};

export default function ErpResourcesNav() {
  return (
    <BmPage>
      <BmBreadcrumb items={[{ label: 'ERP / Dolibarr', to: ROUTES.erp }, { label: 'Ressources' }]} />
      <BmPageHeader
        title="Ressources ERP"
        subtitle="Écrans fonctionnels détaillés du connecteur ERP. Le détail reste dans le workspace du module."
      />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {Object.entries(ERP_RESOURCES).map(([key, label]) => (
          <BmCard key={key}>
            <Link
              to={DETAIL_ROUTES[key]}
              className="flex items-center justify-between gap-3 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
            >
              <span className="font-medium text-slate-800">{label}</span>
              <ArrowRight size={14} className="shrink-0 text-blue-600" aria-hidden="true" />
            </Link>
          </BmCard>
        ))}
      </div>
      <p className="text-sm text-slate-500">
        Les compteurs et états de chaque ressource restent sur la vue d’ensemble du module.
      </p>
    </BmPage>
  );
}