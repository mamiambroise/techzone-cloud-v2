// DTO specifiques a Dolibarr 23.0.3

export interface DolibarrUser {
  id?: number;
  login?: string;
  lastname?: string;
  firstname?: string;
  email?: string;
  admin?: number | boolean;
  statut?: number;
  datelastlogin?: string | number | null;
}

export interface DolibarrClient {
  id?: number;
  name: string;
  firstname?: string;
  email: string;
  phone?: string;
  address?: string;
  zip?: string;
  town?: string;
  country?: string;
  status: number; // 1=actif, 0=inactif
  entity: number; // 1 par defaut
  client?: number; // bitmask roles client (0,1,2)
  fournisseur?: number; // 1=fournisseur
  code_client?: string;
  code_fournisseur?: string;
}

export interface DolibarrProduct {
  id?: number;
  ref: string;
  label: string;
  description?: string;
  price: number;
  price_ttc?: number;
  stock?: number;
  unit?: string;
  category_label?: string;
  status: number; // 1=actif, 0=inactif
  entity: number;
}

export interface DolibarrOrderLine {
  fk_product: number;
  qty: number;
  price: number;
  remise_percent?: number;
  date_start?: string;
}

export interface DolibarrOrder {
  id?: number;
  ref?: string;
  socid: number;
  client_name?: string;
  date?: string;
  total_ht?: number;
  total_ttc?: number;
  status?: number; // 0=Brouillon, 1=Validee, 2=En cours, 3=Expediee, 4=Livree, 5=Annulee, 6=Payee
  lines: DolibarrOrderLine[];
  entity: number;
}

export interface DolibarrStock {
  productId: number;
  stock: number;
  warehouse?: string;
}

export interface DolibarrHealthResponse {
  success?: boolean;
  error?: string;
  [key: string]: any;
}

// Statuts Dolibarr pour les commandes
export const DOLIBARR_ORDER_STATUS: Record<number, string> = {
  0: 'DRAFT',
  1: 'VALIDATED',
  2: 'PROCESSING',
  3: 'SHIPPED',
  4: 'DELIVERED',
  5: 'CANCELLED',
  6: 'PAID',
};

// Statuts inverses pour creation/maj
export const TECHZONE_ORDER_STATUS: Record<string, number> = {
  DRAFT: 0,
  VALIDATED: 1,
  PROCESSING: 2,
  SHIPPED: 3,
  DELIVERED: 4,
  CANCELLED: 5,
  PAID: 6,
};

// === ENTITES ETENDUES (ERP complet) ===

export interface DolibarrVariant {
  id?: number;
  fk_product: number;
  ref: string;
  attribute: string;
  attribute_label?: string;
  value: string;
  value_label?: string;
  price?: number;
  stock?: number;
  barcode?: string;
  entity?: number;
  status?: number;
}

export interface DolibarrService {
  id?: number;
  ref: string;
  label: string;
  price: number; // NT (hors taxe)
  duration?: number;
  description?: string;
  type: string; // 'service'
  entity?: number;
  status?: number;
}

export interface DolibarrStockMovement {
  id?: number;
  fk_product: number;
  type: string; // '<' entree, '>' sortie, etc.
  qty: number;
  label: string; // raison
  date?: string;
  entity?: number;
}

export interface DolibarrStockTransfer {
  id?: number;
  ref: string;
  fk_product: number;
  qty: number;
  warehouse_from: number;
  warehouse_to: number;
  status?: number;
  date?: string;
  entity?: number;
}

export interface DolibarrInventory {
  id?: number;
  ref: string;
  label: string;
  type: string;
  status?: number;
  date?: string;
  entity?: number;
}

export interface DolibarrStockAlert {
  id?: number;
  fk_product: number;
  level: string; // LOW / OUT / CRITICAL
  current: number;
  threshold: number;
  date?: string;
  entity?: number;
}

export interface DolibarrReturn {
  id?: number;
  ref: string;
  fk_order: number;
  fk_soc: number;
  reason: string;
  type: string; // RETURN / EXCHANGE
  status?: number;
  date_creation?: string;
  entity?: number;
}

export interface DolibarrPromotion {
  id?: number;
  ref: string;
  label: string;
  type: string; // PERCENT / FIXE / BUYXGETY
  value: number;
  applies_to: string;
  date_start: string;
  date_end: string;
  status?: number;
  entity?: number;
}

export interface DolibarrPurchaseOrderLine {
  fk_product: number;
  qty: number;
  price: number;
}

export interface DolibarrPurchaseOrder {
  id?: number;
  ref: string;
  fk_supplier?: number;
  socid?: number;
  lines: DolibarrPurchaseOrderLine[];
  total_ht?: number;
  status?: number;
  date?: string;
  entity?: number;
}

export interface DolibarrCashRegister {
  id?: number;
  ref: string;
  label: string;
  opening_cash: number;
  closing_cash?: number;
  status?: number;
  date_opened?: string;
  date_closed?: string;
  entity?: number;
}

export interface DolibarrExpense {
  id?: number;
  ref: string;
  label: string;
  amount: number;
  category: string;
  fk_supplier?: number;
  date?: string;
  entity?: number;
}

export interface DolibarrReservation {
  id?: number;
  ref: string;
  fk_soc: number;
  date_start: string;
  date_end: string;
  status?: number;
  entity?: number;
}

export interface DolibarrAgendaEvent {
  id?: number;
  label: string;
  userownerid?: number;
  type_code?: string;
  datep: number; // debut
  datef: number; // fin
  type?: string;
  entity?: number;
}

export interface DolibarrProject {
  id?: number;
  ref: string;
  title: string;
  fk_soc?: number;
  socid?: number;
  status?: number | string;
  statut?: number | string;
  date_start?: string | number;
  date_end?: string | number;
  entity?: number;
}

export interface DolibarrQuote {
  id?: number;
  ref?: string;
  socid: number;
  date?: string | number;
  date_limite?: string | number;
  total_ht?: number;
  total_ttc?: number;
  statut?: number;
  paid?: number;
  entity?: number;
  lines?: any[];
}

export interface DolibarrQuoteLine {
  id?: number;
  fk_product: number;
  label?: string;
  qty: number;
  subprice: number;
}

export interface DolibarrInvoice {
  id?: number;
  ref?: string;
  socid: number;
  date?: string | number;
  due_date?: string | number;
  total_ht?: number;
  total_ttc?: number;
  paye?: number;
  statut?: number;
  type?: number;
  entity?: number;
  lines?: any[];
}

export interface DolibarrInvoiceLine {
  id?: number;
  fk_product: number;
  label?: string;
  qty: number;
  subprice: number;
}

export interface DolibarrPayment {
  id?: number;
  ref?: string;
  datepaye?: string | number;
  amount?: number;
  num_payment?: string;
  statut?: number;
  type?: string;
  paiementtype?: string;
  entity?: number;
}

export interface DolibarrWarehouse {
  id?: number;
  ref?: string;
  label: string;
  description?: string;
  address?: string;
  town?: string;
  statut?: number;
  entity?: number;
}

export interface DolibarrShipment {
  id?: number;
  ref?: string;
  ref_int?: string;
  fk_soc?: number;
  date_creation?: string | number;
  statut?: number;
  tracking_number?: string;
  total_ht?: number;
  entity?: number;
}

export interface DolibarrDocument {
  id?: number;
  name?: string;
  path?: string;
  relativepath?: string;
  relativename?: string;
  fullname?: string;
  modulepart?: string;
  size?: number;
  date?: string | number;
  type?: string;
  entity?: number;
}

// Statuts Dolibarr generiques (0=ferme/inactif, 1=actif)
export const DOLIBARR_GENERIC_ACTIVE = 1;
