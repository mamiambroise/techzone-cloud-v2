/**
 * Canonical ERP resource catalogue.
 *
 * This file deliberately contains technical facts only. Provider availability
 * is resolved per tenant from ERPRegistry capability probes; UI presentation
 * and platform policy must not turn an unproven capability into AVAILABLE.
 */

export type ErpResourceCategory =
  | 'commercial'
  | 'finance'
  | 'stock-logistics'
  | 'collaboration'
  | 'other';

export type ErpOperation = 'read' | 'create' | 'update' | 'delete';

export interface ErpResourceOperationDefinition {
  readonly key: ErpOperation;
  readonly adapterImplemented: boolean;
  readonly capability?: string;
}

export interface ErpResourceDefinition {
  readonly key: string;
  readonly label: string;
  readonly category: ErpResourceCategory;
  readonly provider: 'dolibarr';
  /** API path segment, when the ERP controller exposes a resource endpoint. */
  readonly routeKey?: string;
  readonly adapterImplemented: boolean;
  readonly operations: readonly ErpResourceOperationDefinition[];
  readonly mappingSupport: 'FULL' | 'PARTIAL' | 'NONE';
  readonly probeSupported: boolean;
  readonly contractOperations: readonly string[];
}

export interface ErpCapabilityProbeDefinition {
  readonly capability: string;
  readonly method: 'GET' | 'POST' | 'PUT';
  readonly path: string;
  readonly kind: 'read' | 'write';
  /** A 403 is known to include a disabled Dolibarr module for these probes. */
  readonly moduleDisabledOn403?: boolean;
  /** Human-readable safety guarantee included in diagnostic evidence. */
  readonly strategy: string;
}

const ops = (...operations: ErpResourceOperationDefinition[]) => operations;
const read = (capability?: string, implemented = true): ErpResourceOperationDefinition => ({ key: 'read', capability, adapterImplemented: implemented });
const create = (capability?: string, implemented = true): ErpResourceOperationDefinition => ({ key: 'create', capability, adapterImplemented: implemented });
const update = (capability?: string, implemented = true): ErpResourceOperationDefinition => ({ key: 'update', capability, adapterImplemented: implemented });
const remove = (capability?: string, implemented = true): ErpResourceOperationDefinition => ({ key: 'delete', capability, adapterImplemented: implemented });

/**
 * The 29 definitions below correspond to the complete Phase 11.1 inventory.
 * The original brief calls it "28 surfaces" while enumerating Category and
 * ERP Stats as well; keeping both makes the catalogue complete and explicit.
 */
export const ERP_RESOURCE_CATALOG: readonly ErpResourceDefinition[] = [
  { key: 'customer', label: 'Clients', category: 'commercial', provider: 'dolibarr', routeKey: 'clients', adapterImplemented: true, operations: ops(read('customer.read'), create('customer.create'), update('customer.update'), remove()), mappingSupport: 'FULL', probeSupported: true, contractOperations: ['customer.read', 'customer.list', 'customer.get', 'customer.create', 'customer.update'] },
  { key: 'supplier', label: 'Fournisseurs', category: 'commercial', provider: 'dolibarr', routeKey: 'suppliers', adapterImplemented: true, operations: ops(read('supplier.read'), create(), update(), remove()), mappingSupport: 'PARTIAL', probeSupported: true, contractOperations: [] },
  { key: 'product', label: 'Produits', category: 'commercial', provider: 'dolibarr', routeKey: 'products', adapterImplemented: true, operations: ops(read('product.read'), create('product.create'), update('product.update'), remove()), mappingSupport: 'FULL', probeSupported: true, contractOperations: ['product.read', 'product.list', 'product.get', 'product.create', 'product.update'] },
  { key: 'service', label: 'Services', category: 'commercial', provider: 'dolibarr', routeKey: 'services', adapterImplemented: true, operations: ops(read('service.read'), create('service.create'), update(undefined, false), remove(undefined, false)), mappingSupport: 'FULL', probeSupported: true, contractOperations: [] },
  { key: 'productVariant', label: 'Variantes de produits', category: 'commercial', provider: 'dolibarr', routeKey: 'product-variants', adapterImplemented: true, operations: ops(read('productVariant.read'), create(undefined, false), update(undefined, false), remove(undefined, false)), mappingSupport: 'FULL', probeSupported: true, contractOperations: [] },
  { key: 'order', label: 'Commandes clients', category: 'commercial', provider: 'dolibarr', routeKey: 'orders', adapterImplemented: true, operations: ops(read('order.read'), create('order.create'), update('order.update'), remove()), mappingSupport: 'FULL', probeSupported: true, contractOperations: ['order.read', 'order.list', 'order.get', 'order.create'] },
  { key: 'supplierOrder', label: 'Commandes fournisseurs', category: 'commercial', provider: 'dolibarr', routeKey: 'purchases', adapterImplemented: true, operations: ops(read('supplierOrder.read'), create(), update(undefined, false), remove(undefined, false)), mappingSupport: 'FULL', probeSupported: true, contractOperations: [] },
  { key: 'quote', label: 'Devis', category: 'commercial', provider: 'dolibarr', routeKey: 'quotes', adapterImplemented: true, operations: ops(read('quote.read'), create(), update(), remove()), mappingSupport: 'FULL', probeSupported: true, contractOperations: [] },
  { key: 'invoice', label: 'Factures', category: 'finance', provider: 'dolibarr', routeKey: 'invoices', adapterImplemented: true, operations: ops(read('invoice.read'), create('invoice.create'), update(), remove()), mappingSupport: 'FULL', probeSupported: true, contractOperations: [] },
  { key: 'payment', label: 'Paiements', category: 'finance', provider: 'dolibarr', routeKey: 'payments', adapterImplemented: true, operations: ops(read('payment.read'), create('payment.create', false), update(undefined, false), remove(undefined, false)), mappingSupport: 'PARTIAL', probeSupported: true, contractOperations: [] },
  { key: 'stock', label: 'Stocks', category: 'stock-logistics', provider: 'dolibarr', routeKey: 'stocks', adapterImplemented: true, operations: ops(read('stock.read'), update('stock.update')), mappingSupport: 'FULL', probeSupported: false, contractOperations: [] },
  { key: 'warehouse', label: 'Entrepôts', category: 'stock-logistics', provider: 'dolibarr', routeKey: 'warehouses', adapterImplemented: true, operations: ops(read('warehouse.read'), create(), update(), remove()), mappingSupport: 'FULL', probeSupported: true, contractOperations: [] },
  { key: 'stockMovement', label: 'Mouvements de stock', category: 'stock-logistics', provider: 'dolibarr', routeKey: 'stock-movements', adapterImplemented: true, operations: ops(read('stockMovement.read'), create()), mappingSupport: 'FULL', probeSupported: true, contractOperations: [] },
  { key: 'stockTransfer', label: 'Transferts de stock', category: 'stock-logistics', provider: 'dolibarr', routeKey: 'stock-transfers', adapterImplemented: true, operations: ops(read('stockTransfer.read'), create(), update(undefined, false)), mappingSupport: 'FULL', probeSupported: true, contractOperations: [] },
  { key: 'inventory', label: 'Inventaires', category: 'stock-logistics', provider: 'dolibarr', routeKey: 'inventories', adapterImplemented: true, operations: ops(read('inventory.read'), create(), update(undefined, false)), mappingSupport: 'FULL', probeSupported: true, contractOperations: [] },
  { key: 'stockAlert', label: 'Alertes de stock', category: 'stock-logistics', provider: 'dolibarr', routeKey: 'stock-alerts', adapterImplemented: false, operations: ops(read(undefined, false), create(undefined, false)), mappingSupport: 'PARTIAL', probeSupported: false, contractOperations: [] },
  { key: 'shipment', label: 'Expéditions', category: 'stock-logistics', provider: 'dolibarr', routeKey: 'shipments', adapterImplemented: true, operations: ops(read('shipment.read'), create(), update()), mappingSupport: 'FULL', probeSupported: true, contractOperations: [] },
  { key: 'document', label: 'Documents', category: 'collaboration', provider: 'dolibarr', routeKey: 'documents', adapterImplemented: true, operations: ops(read(), create(), remove()), mappingSupport: 'FULL', probeSupported: false, contractOperations: [] },
  { key: 'return', label: 'Retours', category: 'stock-logistics', provider: 'dolibarr', routeKey: 'returns', adapterImplemented: true, operations: ops(read('return.read'), create(), update(undefined, false)), mappingSupport: 'FULL', probeSupported: true, contractOperations: [] },
  { key: 'promotion', label: 'Promotions', category: 'other', provider: 'dolibarr', routeKey: 'promotions', adapterImplemented: true, operations: ops(read('promotion.read'), create(), update(undefined, false), remove(undefined, false)), mappingSupport: 'FULL', probeSupported: true, contractOperations: [] },
  { key: 'purchase', label: 'Achats', category: 'commercial', provider: 'dolibarr', routeKey: 'purchases', adapterImplemented: true, operations: ops(read('supplierOrder.read'), create(), update(undefined, false)), mappingSupport: 'FULL', probeSupported: true, contractOperations: [] },
  { key: 'cashRegister', label: 'Caisses', category: 'finance', provider: 'dolibarr', routeKey: 'cash-registers', adapterImplemented: true, operations: ops(read('cashRegister.read'), create(), update(undefined, false)), mappingSupport: 'FULL', probeSupported: true, contractOperations: [] },
  { key: 'expense', label: 'Dépenses', category: 'finance', provider: 'dolibarr', routeKey: 'expenses', adapterImplemented: false, operations: ops(read(undefined, false), create(undefined, false), remove(undefined, false)), mappingSupport: 'NONE', probeSupported: false, contractOperations: [] },
  { key: 'reservation', label: 'Réservations', category: 'other', provider: 'dolibarr', routeKey: 'reservations', adapterImplemented: false, operations: ops(read(undefined, false), create(undefined, false), update(undefined, false)), mappingSupport: 'NONE', probeSupported: false, contractOperations: [] },
  { key: 'agenda', label: 'Agenda', category: 'collaboration', provider: 'dolibarr', routeKey: 'agenda', adapterImplemented: true, operations: ops(read('agenda.read'), create('agenda.create'), update(), remove()), mappingSupport: 'FULL', probeSupported: true, contractOperations: ['agenda.read'] },
  { key: 'project', label: 'Projets', category: 'collaboration', provider: 'dolibarr', routeKey: 'projects', adapterImplemented: true, operations: ops(read('project.read'), create(), update()), mappingSupport: 'FULL', probeSupported: true, contractOperations: [] },
  { key: 'user', label: 'Utilisateurs', category: 'collaboration', provider: 'dolibarr', routeKey: 'users', adapterImplemented: true, operations: ops(read('user.read')), mappingSupport: 'PARTIAL', probeSupported: true, contractOperations: [] },
  { key: 'category', label: 'Catégories', category: 'other', provider: 'dolibarr', adapterImplemented: false, operations: ops(read(undefined, false), create(undefined, false), update(undefined, false), remove(undefined, false)), mappingSupport: 'NONE', probeSupported: false, contractOperations: [] },
  { key: 'erpStats', label: 'Statistiques ERP', category: 'other', provider: 'dolibarr', routeKey: 'stats', adapterImplemented: false, operations: ops(read(undefined, false)), mappingSupport: 'NONE', probeSupported: false, contractOperations: [] },
];

/** Safe probes only: no valid business payload is ever sent. */
export const ERP_CAPABILITY_PROBES: readonly ErpCapabilityProbeDefinition[] = [
  { capability: 'customer.read', method: 'GET', path: '/thirdparties', kind: 'read', strategy: 'collection limitée' },
  { capability: 'customer.create', method: 'POST', path: '/thirdparties', kind: 'write', strategy: 'payload volontairement invalide' },
  { capability: 'customer.update', method: 'PUT', path: '/thirdparties/0', kind: 'write', strategy: 'identifiant fictif, sans donnée métier' },
  { capability: 'supplier.read', method: 'GET', path: '/thirdparties', kind: 'read', strategy: 'collection limitée, même route que les tiers' },
  { capability: 'product.read', method: 'GET', path: '/products', kind: 'read', strategy: 'collection limitée' },
  { capability: 'product.create', method: 'POST', path: '/products', kind: 'write', strategy: 'payload volontairement invalide' },
  { capability: 'product.update', method: 'PUT', path: '/products/0', kind: 'write', strategy: 'identifiant fictif, sans donnée métier' },
  { capability: 'service.read', method: 'GET', path: '/products', kind: 'read', strategy: 'collection limitée avec filtre service' },
  { capability: 'productVariant.read', method: 'GET', path: '/products/attributes', kind: 'read', strategy: 'collection limitée' },
  { capability: 'order.read', method: 'GET', path: '/orders', kind: 'read', strategy: 'collection limitée' },
  { capability: 'order.create', method: 'POST', path: '/orders', kind: 'write', strategy: 'payload volontairement invalide' },
  { capability: 'order.update', method: 'PUT', path: '/orders/0', kind: 'write', strategy: 'identifiant fictif, sans donnée métier' },
  { capability: 'supplierOrder.read', method: 'GET', path: '/supplierorders', kind: 'read', strategy: 'collection limitée' },
  { capability: 'quote.read', method: 'GET', path: '/proposals', kind: 'read', strategy: 'collection limitée' },
  { capability: 'invoice.read', method: 'GET', path: '/invoices', kind: 'read', moduleDisabledOn403: true, strategy: 'collection limitée' },
  { capability: 'invoice.create', method: 'POST', path: '/invoices', kind: 'write', moduleDisabledOn403: true, strategy: 'payload volontairement invalide' },
  { capability: 'payment.read', method: 'GET', path: '/paiements', kind: 'read', strategy: 'collection limitée, route adapter réelle' },
  { capability: 'payment.create', method: 'POST', path: '/payments', kind: 'write', strategy: 'payload volontairement invalide' },
  { capability: 'warehouse.read', method: 'GET', path: '/warehouses', kind: 'read', moduleDisabledOn403: true, strategy: 'collection limitée' },
  { capability: 'stockMovement.read', method: 'GET', path: '/stockmovements', kind: 'read', moduleDisabledOn403: true, strategy: 'collection limitée' },
  { capability: 'stockTransfer.read', method: 'GET', path: '/stock/transferts', kind: 'read', moduleDisabledOn403: true, strategy: 'collection limitée' },
  { capability: 'inventory.read', method: 'GET', path: '/inventories', kind: 'read', moduleDisabledOn403: true, strategy: 'collection limitée' },
  { capability: 'shipment.read', method: 'GET', path: '/shipments', kind: 'read', strategy: 'collection limitée' },
  { capability: 'return.read', method: 'GET', path: '/powererp/returns', kind: 'read', strategy: 'collection limitée' },
  { capability: 'promotion.read', method: 'GET', path: '/promotions', kind: 'read', strategy: 'collection limitée' },
  { capability: 'cashRegister.read', method: 'GET', path: '/pos/registers', kind: 'read', strategy: 'collection limitée' },
  { capability: 'agenda.read', method: 'GET', path: '/agendaevents', kind: 'read', strategy: 'collection limitée, route adapter réelle' },
  { capability: 'agenda.create', method: 'POST', path: '/agendaevents', kind: 'write', strategy: 'payload volontairement invalide' },
  { capability: 'project.read', method: 'GET', path: '/projects', kind: 'read', strategy: 'collection limitée' },
  { capability: 'user.read', method: 'GET', path: '/users', kind: 'read', strategy: 'collection limitée' },
];

export function getErpResourceDefinition(key: string): ErpResourceDefinition | undefined {
  return ERP_RESOURCE_CATALOG.find((resource) => resource.key === key);
}
