import {
  ErpClient, ErpProduct, ErpOrder, ErpOrderLine, StockInfo,
  ErpProductVariant, ErpService, StockMovement, StockTransfer, Inventory,
  StockAlert, ErpReturn, Promotion, PurchaseOrder, PurchaseOrderLine,
  ErpCashRegister, ErpExpense, ErpReservation, ErpAgendaEvent, ErpProject,
  ErpQuote, QuoteLine, ErpInvoice, InvoiceLine, ErpPayment, ErpWarehouse,
  ErpShipment, ErpDocument,
} from '../interfaces/erp-adapter.interface';
import {
  DolibarrClient, DolibarrProduct, DolibarrOrder, DolibarrOrderLine,
  DOLIBARR_ORDER_STATUS, TECHZONE_ORDER_STATUS,
  DolibarrVariant, DolibarrService, DolibarrStockMovement, DolibarrStockTransfer,
  DolibarrInventory, DolibarrStockAlert, DolibarrReturn, DolibarrPromotion,
  DolibarrPurchaseOrder, DolibarrPurchaseOrderLine, DolibarrCashRegister,
  DolibarrExpense, DolibarrReservation, DolibarrAgendaEvent, DolibarrProject,
  DolibarrQuote, DolibarrQuoteLine, DolibarrInvoice, DolibarrInvoiceLine,
  DolibarrPayment, DolibarrWarehouse, DolibarrShipment, DolibarrDocument,
} from './dolibarr.dto';
import { DolibarrError } from './dolibarr.error';

/**
 * Convertit une valeur de date en timestamp unix pour Dolibarr
 * (l'API REST et le create() exigent des dates numeriques en PHP 8.4)
 */
export function mapToDolibarrDate(value?: string | number): number {
  if (value === undefined || value === null || value === '') return 0;
  if (typeof value === 'number') return value;
  const ts = Date.parse(value);
  return Number.isNaN(ts) ? 0 : Math.floor(ts / 1000);
}

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
    const stockNum = Number(data.stock);
    return {
      id: String(data.id),
      ref: data.ref,
      label: data.label,
      price: Number(data.price),
      stock: Number.isNaN(stockNum) ? 0 : stockNum,
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
        quantity: Number(l.qty),
        price: Number(l.price),
      })),
      total: Number(data.total_ht ?? 0),
      status: DolibarrMapper.mapDolibarrStatus(data.status ?? 0),
      createdAt: data.date || new Date().toISOString(),
    };
  }

  // === DEVIS (Proposals) ===

  /**
   * Convertit une ligne ErpQuote en format Dolibarr (posting POST {id}/line)
   */
  static mapToDolibarrQuoteLine(l: QuoteLine): DolibarrQuoteLine {
    return {
      fk_product: Number(l.productId),
      label: l.label || '',
      qty: l.quantity,
      subprice: l.price || 0,
    };
  }

  static mapToDolibarrQuote(data: { clientId: string; validUntil?: string }, entity = 1): DolibarrQuote {
    return {
      socid: Number(data.clientId),
      date: mapToDolibarrDate(new Date().toISOString()),
      date_limite: mapToDolibarrDate(data.validUntil) || '',
      entity,
    };
  }

  static mapFromDolibarrQuote(data: DolibarrQuote): ErpQuote {
    const lines: QuoteLine[] = (data.lines || []).map((l: DolibarrQuoteLine) => ({
      productId: String(l.fk_product ?? ''),
      label: l.label,
      quantity: Number(l.qty),
      price: Number(l.subprice ?? 0),
    }));
    return {
      id: String(data.id),
      ref: data.ref || `PR-${data.id}`,
      clientId: String(data.socid),
      lines,
      total: Number(data.total_ht ?? lines.reduce((s, l) => s + l.price * l.quantity, 0)),
      status: DolibarrMapper.mapDolibarrQuoteStatus(data.statut ?? 0),
      validUntil: DolibarrMapper.mapDolibarrDate(data.date_limite),
      createdAt: DolibarrMapper.mapDolibarrDate(data.date),
    };
  }

  // === FACTURES (Invoices) ===

  static mapToDolibarrInvoiceLine(l: InvoiceLine): DolibarrInvoiceLine {
    return {
      fk_product: Number(l.productId),
      label: l.label || '',
      qty: l.quantity,
      subprice: l.price || 0,
    };
  }

  static mapToDolibarrInvoice(data: { clientId: string; dueDate?: string }, entity = 1): DolibarrInvoice {
    return {
      socid: Number(data.clientId),
      date: mapToDolibarrDate(new Date().toISOString()),
      due_date: mapToDolibarrDate(data.dueDate) || '',
      type: 0,
      entity,
    };
  }

  static mapFromDolibarrInvoice(data: DolibarrInvoice): ErpInvoice {
    const lines: InvoiceLine[] = (data.lines || []).map((l: DolibarrInvoiceLine) => ({
      productId: String(l.fk_product ?? ''),
      label: l.label,
      quantity: Number(l.qty),
      price: Number(l.subprice ?? 0),
    }));
    return {
      id: String(data.id),
      ref: data.ref || `FA-${data.id}`,
      clientId: String(data.socid),
      lines,
      total: Number(data.total_ht ?? lines.reduce((s, l) => s + l.price * l.quantity, 0)),
      paid: Math.round(Number(data.paye ?? 0)),
      status: DolibarrMapper.mapDolibarrInvoiceStatus(data.statut ?? 0),
      dueDate: DolibarrMapper.mapDolibarrDate(data.due_date),
      createdAt: DolibarrMapper.mapDolibarrDate(data.date),
    };
  }

  // === PAIEMENTS (Payments, lecture seule via API REST) ===

  static mapFromDolibarrPayment(data: DolibarrPayment): ErpPayment {
    return {
      id: String(data.id),
      ref: data.ref || String(data.id),
      invoiceId: '',
      amount: Number(data.amount ?? 0),
      method: data.type || data.paiementtype || '',
      status: Number(data.statut ?? 0) >= 2 ? 'EN_ATTENTE' : 'EFFECTUE',
      paidAt: DolibarrMapper.mapDolibarrDate(data.datepaye),
    };
  }

  // === ENTREPOTS (Warehouses) ===

  static mapToDolibarrWarehouse(data: Partial<ErpWarehouse>, entity = 1): DolibarrWarehouse {
    return {
      label: data.nom || '',
      description: data.adresse || '',
      address: data.adresse || '',
      town: data.ville || '',
      statut: 1,
      entity,
    };
  }

  static mapFromDolibarrWarehouse(data: DolibarrWarehouse): ErpWarehouse {
    return {
      id: String(data.id),
      ref: data.ref || `${data.label}-${data.id}`,
      nom: data.label || '',
      ville: data.town || '',
      adresse: data.address || data.description || '',
    };
  }

  // === EXPEDITIONS (Shipments) ===

  static mapToDolibarrShipment(data: { orderId: string; trackingNumber?: string }, entity = 1): DolibarrShipment {
    return {
      ref_int: data.orderId || '',
      tracking_number: data.trackingNumber || '',
      statut: 0,
      entity,
    };
  }

  static mapFromDolibarrShipment(data: DolibarrShipment): ErpShipment {
    const mapping: Record<number, string> = { 0: 'BROUILLON', 1: 'PREPARATION', 2: 'EXPEDIEE', 3: 'RECUE' };
    return {
      id: String(data.id),
      ref: data.ref || `SH-${data.id}`,
      orderId: data.ref_int ? String(data.ref_int) : '',
      carrier: data.tracking_number || '',
      status: mapping[Number(data.statut ?? 0)] || 'BROUILLON',
      trackingNumber: data.tracking_number || undefined,
      shippedAt: DolibarrMapper.mapDolibarrDate(data.date_creation),
    };
  }

  // === DOCUMENTS ===

  static mapFromDolibarrDocument(data: DolibarrDocument, modulepart: string): ErpDocument {
    return {
      id: data.id ? String(data.id) : `${modulepart}-${data.relativename || data.name || data.path || Math.random()}`,
      ref: data.relativename || data.name || data.path || '',
      type: modulepart,
      title: data.relativename || data.name || data.path || '',
      size: data.size,
      createdAt: DolibarrMapper.mapDolibarrDate(data.date),
    };
  }

  // === DATES / STATUTS ===

  /**
   * Convertit une date Dolibarr (timestamp unix, ISO ou null) en ISO string
   */
  static mapDolibarrDate(value?: string | number | null): string {
    if (!value) return '';
    const ts = typeof value === 'number' ? value : Number(value);
    if (!Number.isNaN(ts) && ts > 0 && String(value).length >= 9) {
      return new Date(ts * 1000).toISOString();
    }
    const str = String(value);
    if (/^\d{10}$/.test(str)) return new Date(Number(str) * 1000).toISOString();
    return str;
  }

  static mapDolibarrQuoteStatus(status: number): string {
    const mapping: Record<number, string> = { 0: 'BROUILLON', 1: 'VALIDE', 2: 'SIGNEE', 3: 'ENVOYEE' };
    return mapping[status] || (status === 1 ? 'VALIDE' : 'EN_ATTENTE');
  }

  static mapDolibarrInvoiceStatus(status: number): string {
    const mapping: Record<number, string> = { 0: 'BROUILLON', 1: 'EN_ATTENTE', 2: 'PAYEE', 3: 'ABANDONNEE', 4: 'ANNULEE' };
    return mapping[status] || 'EN_ATTENTE';
  }

  // === STOCK ===

  /**
   * Convertit les donnees de stock Dolibarr en format Techzone
   */
  static mapFromDolibarrStock(productId: string, quantity: number): StockInfo {
    const stockVal = Number(quantity);
    return {
      productId,
      currentStock: Number.isNaN(stockVal) ? 0 : stockVal,
      lastUpdated: new Date().toISOString(),
    };
  }

  // === VARIANTS ===

  static mapToDolibarrVariant(data: Partial<ErpProductVariant>, entity = 1): DolibarrVariant {
    return {
      fk_product: Number(data.productId),
      ref: data.ref || '',
      attribute: data.attribute || '',
      value: data.value || '',
      price: data.price || 0,
      stock: data.stock ?? 0,
      barcode: data.barcode,
      entity,
      status: 1,
    };
  }

  static mapFromDolibarrVariant(data: DolibarrVariant): ErpProductVariant {
    const stockVal = Number(data.stock);
    return {
      id: String(data.id),
      productId: String(data.fk_product),
      ref: data.ref,
      attribute: data.attribute,
      value: data.value,
      price: data.price,
      stock: Number.isNaN(stockVal) ? 0 : stockVal,
      barcode: data.barcode,
    };
  }

  // === SERVICES ===

  static mapToDolibarrService(data: Partial<ErpService>, entity = 1): DolibarrService {
    return {
      ref: data.ref || '',
      label: data.label || '',
      price: data.price || 0,
      duration: data.duration || 0,
      description: data.description,
      type: 'service',
      entity,
      status: 1,
    };
  }

  static mapFromDolibarrService(data: DolibarrService): ErpService {
    return {
      id: String(data.id),
      ref: data.ref,
      label: data.label,
      price: data.price,
      duration: data.duration || 0,
      description: data.description,
    };
  }

  // === MOUVEMENTS DE STOCK ===

  static mapToDolibarrStockMovement(data: { productId: string; type: string; quantity: number; reason: string }, entity = 1): DolibarrStockMovement {
    return {
      fk_product: Number(data.productId),
      type: data.type === 'SORTIE' ? '>' : '<',
      qty: Math.abs(data.quantity),
      label: data.reason,
      entity,
    };
  }

  static mapFromDolibarrStockMovement(data: DolibarrStockMovement): StockMovement {
    return {
      id: String(data.id),
      ref: `MV-${data.id}`,
      productId: String(data.fk_product),
      type: data.type === '>' ? 'SORTIE' : 'ENTREE',
      quantity: Math.abs(data.qty),
      reason: data.label,
      date: data.date || new Date().toISOString(),
    };
  }

  // === TRANSFERTS STOCK ===

  static mapToDolibarrStockTransfer(data: { productId: string; quantity: number; fromWarehouseId: string; toWarehouseId: string }, entity = 1): DolibarrStockTransfer {
    return {
      ref: `TRF-${Date.now()}`,
      fk_product: Number(data.productId),
      qty: data.quantity,
      warehouse_from: Number(data.fromWarehouseId),
      warehouse_to: Number(data.toWarehouseId),
      status: 1,
      entity,
    };
  }

  static mapFromDolibarrStockTransfer(data: DolibarrStockTransfer): StockTransfer {
    return {
      id: String(data.id),
      ref: data.ref,
      productId: String(data.fk_product),
      quantity: data.qty,
      fromWarehouseId: String(data.warehouse_from),
      toWarehouseId: String(data.warehouse_to),
      status: data.status === 2 ? 'TERMINE' : 'EN_TRANSIT',
      date: data.date || new Date().toISOString(),
    };
  }

  // === INVENTAIRES ===

  static mapToDolibarrInventory(data: { label: string; type: string }, entity = 1): DolibarrInventory {
    return {
      ref: `INV-${Date.now()}`,
      label: data.label,
      type: data.type === 'PARTIEL' ? 'partial' : 'full',
      status: 1,
      entity,
    };
  }

  static mapFromDolibarrInventory(data: DolibarrInventory): Inventory {
    return {
      id: String(data.id),
      ref: data.ref,
      label: data.label,
      type: data.type === 'partial' ? 'PARTIEL' : 'GLOBAL',
      status: data.status === 2 ? 'TERMINE' : 'EN_COURS',
      items: [],
      date: data.date || new Date().toISOString(),
    };
  }

  // === ALERTES STOCK ===

  static mapFromDolibarrStockAlert(data: DolibarrStockAlert): StockAlert {
    const levels = ['LOW', 'OUT', 'CRITICAL'];
    return {
      id: String(data.id),
      productId: String(data.fk_product),
      level: (levels.includes(data.level) ? data.level : 'LOW') as StockAlert['level'],
      current: data.current,
      threshold: data.threshold,
      date: data.date || new Date().toISOString(),
    };
  }

  // === RETOURS ===

  static mapToDolibarrReturn(data: { orderId: string; clientId: string; reason: string; type: string }, entity = 1): DolibarrReturn {
    return {
      ref: `RET-${Date.now()}`,
      fk_order: Number(data.orderId),
      fk_soc: Number(data.clientId),
      reason: data.reason,
      type: data.type === 'ECHANGE' ? 'EXCHANGE' : 'RETURN',
      status: 1,
      entity,
    };
  }

  static mapFromDolibarrReturn(data: DolibarrReturn, lines: ErpReturn['lines'] = []): ErpReturn {
    return {
      id: String(data.id),
      ref: data.ref,
      orderId: String(data.fk_order),
      clientId: String(data.fk_soc),
      reason: data.reason,
      type: data.type === 'EXCHANGE' ? 'ECHANGE' : 'RETOUR',
      lines,
      status: data.status === 2 ? 'ACCEPTE' : 'EN_COURS',
      createdAt: data.date_creation || new Date().toISOString(),
    };
  }

  // === PROMOTIONS ===

  static mapToDolibarrPromotion(data: { label: string; type: string; value: number; appliesTo: string; startDate: string; endDate: string }, entity = 1): DolibarrPromotion {
    const typeMap: Record<string, string> = { PERCENTAGE: 'PERCENT', FIXE: 'FIXE', BUY_X_GET_Y: 'BUYXGETY' };
    return {
      ref: `PROM-${Date.now()}`,
      label: data.label,
      type: typeMap[data.type] || 'PERCENT',
      value: data.value,
      applies_to: data.appliesTo,
      date_start: data.startDate,
      date_end: data.endDate,
      status: 1,
      entity,
    };
  }

  static mapFromDolibarrPromotion(data: DolibarrPromotion): Promotion {
    const typeMap: Record<string, Promotion['type']> = { PERCENT: 'PERCENTAGE', FIXE: 'FIXE', BUYXGETY: 'BUY_X_GET_Y' };
    return {
      id: String(data.id),
      ref: data.ref,
      label: data.label,
      type: typeMap[data.type] || 'PERCENTAGE',
      value: data.value,
      appliesTo: data.applies_to,
      startDate: data.date_start,
      endDate: data.date_end,
      status: data.status === 2 ? 'PAUSEE' : 'ACTIVE',
    };
  }

  // === ACHATS ===

  static mapToDolibarrPurchaseOrder(data: { supplierId: string; lines: PurchaseOrderLine[] }, entity = 1): DolibarrPurchaseOrder {
    return {
      ref: `ACH-${Date.now()}`,
      fk_supplier: Number(data.supplierId),
      lines: data.lines.map((l) => ({
        fk_product: Number(l.productId),
        qty: l.quantity,
        price: l.price,
      })),
      status: 1,
      entity,
    };
  }

  static mapFromDolibarrPurchaseOrder(data: DolibarrPurchaseOrder): PurchaseOrder {
    const lines: PurchaseOrderLine[] = (data.lines || []).map((l: DolibarrPurchaseOrderLine) => ({
      productId: String(l.fk_product),
      quantity: l.qty,
      price: l.price,
    }));
    return {
      id: String(data.id),
      ref: data.ref,
      supplierId: String(data.socid ?? data.fk_supplier ?? ''),
      lines,
      total: data.total_ht ?? lines.reduce((s, l) => s + l.price * l.quantity, 0),
      status: data.status === 2 ? 'RECUE' : 'EN_ATTENTE',
      createdAt: data.date || new Date().toISOString(),
    };
  }

  // === CAISSE ===

  static mapToDolibarrCashRegister(data: { label: string; openingCash: number }, entity = 1): Omit<DolibarrCashRegister, 'status'> {
    return {
      ref: `CAISSE-${Date.now()}`,
      label: data.label,
      opening_cash: data.openingCash,
      entity,
    };
  }

  static mapFromDolibarrCashRegister(data: DolibarrCashRegister): ErpCashRegister {
    return {
      id: String(data.id),
      ref: data.ref,
      label: data.label,
      openingCash: data.opening_cash,
      closingCash: data.closing_cash,
      status: data.status === 2 ? 'FERME' : 'OUVERT',
      openedAt: data.date_opened || new Date().toISOString(),
      closedAt: data.date_closed,
    };
  }

  // === DEPENSES ===

  static mapToDolibarrExpense(data: { label: string; amount: number; category: string; supplierId?: string }, entity = 1): DolibarrExpense {
    return {
      ref: `DEP-${Date.now()}`,
      label: data.label,
      amount: data.amount,
      category: data.category,
      fk_supplier: data.supplierId ? Number(data.supplierId) : undefined,
      entity,
    };
  }

  static mapFromDolibarrExpense(data: DolibarrExpense): ErpExpense {
    return {
      id: String(data.id),
      ref: data.ref,
      label: data.label,
      amount: data.amount,
      category: data.category,
      supplierId: data.fk_supplier ? String(data.fk_supplier) : undefined,
      date: data.date || new Date().toISOString(),
    };
  }

  // === RESERVATIONS ===

  static mapToDolibarrReservation(data: { clientId: string; startAt: string; endAt: string }, entity = 1): DolibarrReservation {
    return {
      ref: `RES-${Date.now()}`,
      fk_soc: Number(data.clientId),
      date_start: data.startAt,
      date_end: data.endAt,
      status: 1,
      entity,
    };
  }

  static mapFromDolibarrReservation(data: DolibarrReservation, productIds: string[] = []): ErpReservation {
    return {
      id: String(data.id),
      ref: data.ref,
      clientId: String(data.fk_soc),
      productIds,
      startAt: data.date_start,
      endAt: data.date_end,
      status: data.status === 2 ? 'CONFIRMEE' : 'EN_ATTENTE',
    };
  }

  // === AGENDA ===

  static mapToDolibarrAgendaEvent(data: { title: string; startAt: string; endAt: string; type: string }, entity = 1): DolibarrAgendaEvent {
    return {
      label: data.title,
      userownerid: 1,
      type_code: data.type || 'AC_OTH_AUTO',
      datep: mapToDolibarrDate(data.startAt),
      datef: mapToDolibarrDate(data.endAt),
      entity,
    };
  }

  static mapFromDolibarrAgendaEvent(data: DolibarrAgendaEvent): ErpAgendaEvent {
    return {
      id: String(data.id),
      title: data.label,
      startAt: DolibarrMapper.mapDolibarrDate(data.datep),
      endAt: DolibarrMapper.mapDolibarrDate(data.datef),
      type: data.type_code || data.type || '',
    };
  }

  // === PROJETS ===

  static mapToDolibarrProject(data: { label: string; clientId?: string; status?: string; startDate?: string }, entity = 1): DolibarrProject {
    return {
      ref: `PROJ-${Date.now()}`,
      title: data.label,
      socid: data.clientId ? Number(data.clientId) : undefined,
      status: data.status === 'TERMINE' ? 2 : 1,
      date_start: mapToDolibarrDate(data.startDate) || 0,
      entity,
    };
  }

  static mapFromDolibarrProject(data: DolibarrProject): ErpProject {
    return {
      id: String(data.id),
      ref: data.ref,
      label: data.title,
      clientId: data.socid ? String(data.socid) : data.fk_soc ? String(data.fk_soc) : undefined,
      status: Number(data.status ?? data.statut) === 2 ? 'TERMINE' : 'EN_COURS',
      startDate: DolibarrMapper.mapDolibarrDate(data.date_start) || new Date().toISOString().slice(0, 10),
      endDate: DolibarrMapper.mapDolibarrDate(data.date_end),
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
