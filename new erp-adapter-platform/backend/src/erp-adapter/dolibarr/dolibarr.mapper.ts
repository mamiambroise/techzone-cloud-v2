import { ErpClient, ErpProduct, ErpOrder, ErpOrderLine, StockInfo } from '../interfaces/erp-adapter.interface';
import { DolibarrClient, DolibarrProduct, DolibarrOrder, DolibarrOrderLine, DOLIBARR_ORDER_STATUS, TECHZONE_ORDER_STATUS } from './dolibarr.dto';
import { DolibarrError } from './dolibarr.error';

/**
 * Mapping entre les DTOs Techzone et les formats Dolibarr
 */
export class DolibarrMapper {
  // === CLIENTS ===

  /**
   * Convertit un client Techzone en format Dolibarr
   */
  static mapToDolibarrClient(data: Partial<ErpClient>, entity = 1): DolibarrClient {
    const parts = (data.nom || '').split(' ');
    return {
      name: parts.slice(1).join(' ') || parts[0] || '',
      firstname: parts[0] || '',
      email: data.email || '',
      phone: data.telephone || '',
      status: 1,
      entity,
    };
  }

  /**
   * Convertit un client Dolibarr en format Techzone
   */
  static mapFromDolibarrClient(data: DolibarrClient): ErpClient {
    const prenom = data.firstname || '';
    const nom = data.name || '';
    return {
      id: String(data.id),
      nom: prenom ? `${prenom} ${nom}` : nom,
      email: data.email,
      telephone: data.phone,
    };
  }

  // === PRODUITS ===

  /**
   * Convertit un produit Techzone en format Dolibarr
   */
  static mapToDolibarrProduct(data: Partial<ErpProduct>, entity = 1): DolibarrProduct {
    return {
      ref: data.ref || '',
      label: data.label || '',
      price: data.price || 0,
      stock: data.stock ?? 0,
      status: 1,
      entity,
    };
  }

  /**
   * Convertit un produit Dolibarr en format Techzone
   */
  static mapFromDolibarrProduct(data: DolibarrProduct): ErpProduct {
    return {
      id: String(data.id),
      ref: data.ref,
      label: data.label,
      price: data.price,
      stock: data.stock ?? 0,
    };
  }

  // === COMMANDES ===

  /**
   * Convertit une commande Techzone en format Dolibarr
   */
  static mapToDolibarrOrder(data: { clientId: string; lines: ErpOrderLine[] }, entity = 1): DolibarrOrder {
    return {
      socid: Number(data.clientId),
      lines: data.lines.map((l) => ({
        fk_product: Number(l.productId),
        qty: l.quantity,
        price: l.price,
      })),
      entity,
    };
  }

  /**
   * Convertit une commande Dolibarr en format Techzone
   */
  static mapFromDolibarrOrder(data: DolibarrOrder): ErpOrder {
    return {
      id: String(data.id),
      ref: data.ref || `DOL-${data.id}`,
      clientId: String(data.socid),
      lines: (data.lines || []).map((l) => ({
        productId: String(l.fk_product),
        quantity: l.qty,
        price: l.price,
      })),
      total: data.total_ht ?? 0,
      status: this.mapDolibarrStatus(data.status ?? 0),
      createdAt: data.date || new Date().toISOString(),
    };
  }

  // === STOCK ===

  /**
   * Convertit les donnees de stock Dolibarr en format Techzone
   */
  static mapFromDolibarrStock(productId: string, quantity: number): StockInfo {
    return {
      productId,
      currentStock: quantity,
      lastUpdated: new Date().toISOString(),
    };
  }

  // === STATUTS ===

  /**
   * Convertit un statut numerique Dolibarr en statut Techzone
   */
  static mapDolibarrStatus(status: number): string {
    return DOLIBARR_ORDER_STATUS[status] || 'UNKNOWN';
  }

  /**
   * Convertit un statut Techzone en statut numerique Dolibarr
   */
  static mapTechzoneStatus(status: string): number {
    return TECHZONE_ORDER_STATUS[status.toUpperCase()] ?? 0;
  }

  // === ERREURS ===

  /**
   * Convertit une erreur HTTP en DolibarrError
   */
  static mapDolibarrError(status: number, data?: any): DolibarrError {
    return DolibarrError.fromHttpError(status, data);
  }
}
