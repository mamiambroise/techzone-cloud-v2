// DTO specifiques a Dolibarr 23.0.3

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
