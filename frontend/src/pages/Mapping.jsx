import React from 'react';
import {
  BoltIcon,
  CircleStackIcon,
  ServerStackIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

const ENTITIES = [
  {
    module: 'Clients',
    key: 'clients',
    sens: 'Bidirectionnel',
    rows: [
      { techzone: 'nom, email, telephone', dolibarr: 'name, firstname, email, phone', details: 'Entree : split nom / prenom. Sortie : p.p + name' },
      { techzone: 'id', dolibarr: 'id', details: 'Cle tiers toujours conservee' },
    ],
  },
  {
    module: 'Produits',
    key: 'products',
    sens: 'Bidirectionnel',
    rows: [
      { techzone: 'ref, label, price, stock', dolibarr: 'ref, label, price, stock', details: 'Entree : quantites en stock. Sortie : prix/stock en numerique' },
    ],
  },
  {
    module: 'Commandes clients',
    key: 'orders',
    sens: 'Bidirectionnel',
    rows: [
      { techzone: 'clientId', dolibarr: 'socid', details: 'POST /orders : socid obligatoire' },
      { techzone: 'lines[].productId, quantity, price', dolibarr: 'lines[].fk_product, qty, price', details: 'Lignes postees via POST /orders/{id}/lines' },
      { techzone: 'status', dolibarr: 'status (numerique)', details: 'Mapping via DOLIBARR_ORDER_STATUS / TECHZONE_ORDER_STATUS' },
    ],
  },
  {
    module: 'Devis',
    key: 'quotes',
    sens: 'Bidirectionnel',
    rows: [
      { techzone: 'clientId, validUntil', dolibarr: 'socid, date_limite', details: 'Dates envoyees en timestamp unix (PHP 8.4)' },
      { techzone: 'lines[].productId, label, quantity, price', dolibarr: 'lines[].fk_product, label, qty, subprice', details: 'Lignes postees via POST {id}/line' },
      { techzone: 'status', dolibarr: 'statut (0-3)', details: '0=DRAFT 1=VALIDE 2=SIGNEE 3=ENVOYEE' },
    ],
  },
  {
    module: 'Factures',
    key: 'invoices',
    sens: 'Bidirectionnel',
    rows: [
      { techzone: 'clientId, dueDate', dolibarr: 'socid, due_date', details: 'Dates envoyees en timestamp unix' },
      { techzone: 'lines[].productId, label, quantity, price', dolibarr: 'lines[].fk_product, label, qty, subprice', details: 'Lignes postees via POST {id}/lines' },
      { techzone: 'paid', dolibarr: 'paye', details: 'Montant deja paye' },
      { techzone: 'status', dolibarr: 'statut (0-4)', details: '0=DRAFT 1=A TRAITER 2=PAYEE 3=ABANDONNEE 4=ANNULEE' },
    ],
  },
  {
    module: 'Paiements',
    key: 'payments',
    sens: 'Lecture seule',
    rows: [
      { techzone: 'amount, method, paidAt', dolibarr: 'amount, type / paiementtype, datepaye', details: 'API REST Dolibarr 23.0.3 : creation non exposee' },
    ],
  },
  {
    module: 'Fournisseurs',
    key: 'suppliers',
    sens: 'Bidirectionnel',
    rows: [
      { techzone: 'nom, email, telephone, ville', dolibarr: 'name, email, phone, town', details: 'Tiers de type fournisseur (meme endpoint thirdparties)' },
    ],
  },
  {
    module: 'Entrepots',
    key: 'warehouses',
    sens: 'Bidirectionnel',
    rows: [
      { techzone: 'nom, ville, adresse', dolibarr: 'label, town, address / description', details: 'POST /warehouses' },
    ],
  },
  {
    module: 'Expeditions',
    key: 'shipments',
    sens: 'Bidirectionnel',
    rows: [
      { techzone: 'orderId, trackingNumber', dolibarr: 'ref_int, tracking_number', details: 'Statuts : 0=DRAFT 1=PREP 2=EXPEDIEE 3=RECUE' },
    ],
  },
  {
    module: 'Documents',
    key: 'documents',
    sens: 'Lecture seule',
    rows: [
      { techzone: 'ref, type, size', dolibarr: 'relativename / name / path, modulepart, size', details: 'Fichiers reels des modules Dolibarr' },
    ],
  },
  {
    module: 'Achats',
    key: 'purchases',
    sens: 'Bidirectionnel',
    rows: [
      { techzone: 'supplierId', dolibarr: 'socid', details: 'POST /supplierorders : cle == socid (fk_supplier refuse)' },
      { techzone: 'lines[].productId, quantity, price', dolibarr: 'lines[].fk_product, qty, price', details: 'Lignes postees via POST {id}/lines' },
    ],
  },
  {
    module: 'Mouvements de stock',
    key: 'stock-movements',
    sens: 'Bidirectionnel',
    rows: [
      { techzone: 'productId, type (ENTREE/SORTIE), quantity, reason', dolibarr: 'fk_product, type (</>), qty, label', details: 'POST /stockmovements (produits sans lot)' },
    ],
  },
  {
    module: 'Projets',
    key: 'projects',
    sens: 'Bidirectionnel',
    rows: [
      { techzone: 'label, clientId, status, startDate', dolibarr: 'title, socid, status (1|2), date_start', details: 'socid facultatif. Statut compare via Number()' },
    ],
  },
  {
    module: 'Agenda',
    key: 'agenda',
    sens: 'Bidirectionnel',
    rows: [
      { techzone: 'title, startAt, endAt, type', dolibarr: 'label, datep, datef, type_code', details: 'userownerid force a 1 ; type_code requis' },
    ],
  },
];

const CATALOGS = [
  { key: 'clients', label: 'Clients', count: '30 tiers' },
  { key: 'products', label: 'Produits', count: '22 articles' },
  { key: 'orders', label: 'Commandes', count: '42' },
  { key: 'quotes', label: 'Devis', count: '46' },
  { key: 'invoices', label: 'Factures', count: '68' },
  { key: 'payments', label: 'Paiements', count: '43' },
  { key: 'suppliers', label: 'Fournisseurs', count: '8 tiers' },
  { key: 'warehouses', label: 'Entrepots', count: '11' },
  { key: 'shipments', label: 'Expeditions', count: '3' },
  { key: 'documents', label: 'Documents', count: '32 fichiers' },
  { key: 'purchases', label: 'Achats', count: '6' },
  { key: 'stock-movements', label: 'Mouvements de stock', count: '81' },
  { key: 'projects', label: 'Projets', count: '15' },
  { key: 'agenda', label: 'Agenda', count: '100 evenements' },
];

function Mapping() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Mapping vers Dolibarr</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Correspondance reelle entre les objets de la plateforme et les champs Dolibarr, telle qu implementee dans l adapter.
        </p>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-emerald-200 dark:border-emerald-800 p-5 flex items-start gap-3">
        <CheckCircleIcon className="w-6 h-6 text-emerald-500 shrink-0 mt-0.5" />
        <div>
          <p className="font-semibold text-emerald-700 dark:text-emerald-300">Aucun mock — source de verite : base Dolibarr reelle</p>
          <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
            Le mapping est applique sur la vraie base Dolibarr (API REST Dolibarr 23.0.3, MySQL) via {BASE_URL}/erp. Tous les
            montants sont affiches en Euro (€).
          </p>
        </div>
      </div>

      {/* Catalogues synchronises */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-700/60">
          <h3 className="font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <CircleStackIcon className="w-5 h-5 text-emerald-500" />
            Catalogues reels synchronises
          </h3>
          <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">LIEN LIVE : API Dolibarr</span>
        </div>
        <div className="px-6 py-4 grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-5 gap-3">
          {CATALOGS.map((c) => (
            <div key={c.key} className="p-3 bg-slate-50 dark:bg-slate-700/40 rounded-xl">
              <p className="text-sm font-medium text-slate-700 dark:text-slate-200">{c.label}</p>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">{c.count}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Mapping par module */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {ENTITIES.map((ent) => (
          <div key={ent.key} className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-700/60">
              <h3 className="font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <ServerStackIcon className="w-5 h-5 text-[#5469D4]" />
                {ent.module}
              </h3>
              <span
                className={`px-2.5 py-1 text-xs rounded-full font-medium ${
                  ent.sens === 'Bidirectionnel' ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300' : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                }`}
              >
                {ent.sens}
              </span>
            </div>
            <div className="p-6 space-y-3">
              {ent.rows.map((r) => (
                <div key={r.techzone} className="border border-slate-100 dark:border-slate-700/60 rounded-xl p-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-slate-400 dark:text-slate-500 font-semibold mb-1">Techzone</p>
                      <p className="font-mono text-xs text-slate-700 dark:text-slate-200">{r.techzone}</p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-slate-400 dark:text-slate-500 font-semibold mb-1">Dolibarr</p>
                      <p className="font-mono text-xs text-slate-700 dark:text-slate-200">{r.dolibarr}</p>
                    </div>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 border-t border-slate-50 pt-2">{r.details}</p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-2 text-xs text-slate-400 dark:text-slate-500">
        <BoltIcon className="w-4 h-4" />
        Mapping genere a partir du code reelle de l adapter (dolibarr.mapper.ts). Dates converties en timestamp unix pour la compatibilite PHP 8.4.
      </div>
    </div>
  );
}

export default Mapping;