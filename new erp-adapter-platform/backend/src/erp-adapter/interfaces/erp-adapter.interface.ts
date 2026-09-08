// Interfaces pour les entites ERP

export interface ErpClient {
  id: string;
  nom: string;
  email: string;
  telephone?: string;
}

export interface ErpProduct {
  id: string;
  ref: string;
  label: string;
  price: number;
  stock: number;
}

export interface ErpOrderLine {
  productId: string;
  quantity: number;
  price: number;
}

export interface ErpOrder {
  id: string;
  ref: string;
  clientId: string;
  lines: ErpOrderLine[];
  total: number;
  status: string;
  createdAt: string;
}

export interface StockInfo {
  productId: string;
  currentStock: number;
  lastUpdated: string;
}

export interface HealthCheckResult {
  status: 'HEALTHY' | 'UNHEALTHY';
  mode: string;
  timestamp: string;
}

// === ENTITES ERP COMPLETES (cahier des charges - Partie IV) ===

export interface ErpSupplier {
  id: string;
  ref: string;
  nom: string;
  email?: string;
  telephone?: string;
  adresse?: string;
  ville?: string;
}

export interface QuoteLine {
  productId: string;
  label?: string;
  quantity: number;
  price: number;
}

export interface ErpQuote {
  id: string;
  ref: string;
  clientId: string;
  lines: QuoteLine[];
  total: number;
  status: string;
  validUntil: string;
  createdAt: string;
}

export interface InvoiceLine {
  productId: string;
  label?: string;
  quantity: number;
  price: number;
}

export interface ErpInvoice {
  id: string;
  ref: string;
  clientId: string;
  lines: InvoiceLine[];
  total: number;
  paid: number;
  status: string;
  dueDate: string;
  createdAt: string;
}

export interface ErpPayment {
  id: string;
  ref: string;
  invoiceId: string;
  amount: number;
  method: string;
  status: string;
  paidAt: string;
}

export interface ErpWarehouse {
  id: string;
  ref: string;
  nom: string;
  ville?: string;
  adresse?: string;
  capacite?: number;
  utilisation?: number;
}

export interface ErpShipment {
  id: string;
  ref: string;
  orderId: string;
  carrier: string;
  status: string;
  trackingNumber?: string;
  shippedAt?: string;
}

export interface ErpDocument {
  id: string;
  ref: string;
  type: string;
  title: string;
  relatedTo?: string;
  size?: number;
  createdAt: string;
}

// === ENTITES ERP (capacites complements - cahier §12 et §33 Pack Boutique) ===

export interface ErpProductVariant {
  id: string;
  productId: string;
  ref: string;
  attribute: string;
  value: string;
  price?: number;
  stock?: number;
  barcode?: string;
}

export interface ErpService {
  id: string;
  ref: string;
  label: string;
  price: number;
  duration?: number;
  description?: string;
}

export interface StockMovement {
  id: string;
  ref: string;
  productId: string;
  type: 'ENTREE' | 'SORTIE' | 'TRANSFERT' | 'AJUSTEMENT' | 'RETOUR' | 'INVENTAIRE';
  quantity: number;
  reason: string;
  warehouseId?: string;
  date: string;
}

export interface StockTransfer {
  id: string;
  ref: string;
  productId: string;
  quantity: number;
  fromWarehouseId: string;
  toWarehouseId: string;
  status: string;
  date: string;
}

export interface Inventory {
  id: string;
  ref: string;
  label: string;
  type: 'PARTIEL' | 'GLOBAL';
  status: string;
  items: { productId: string; expected: number; counted: number }[];
  date: string;
}

export interface StockAlert {
  id: string;
  productId: string;
  level: 'LOW' | 'OUT' | 'CRITICAL';
  current: number;
  threshold: number;
  date: string;
}

export interface ErpReturn {
  id: string;
  ref: string;
  orderId: string;
  clientId: string;
  reason: string;
  lines: { productId: string; quantity: number; amount: number }[];
  type: 'RETOUR' | 'ECHANGE';
  status: string;
  createdAt: string;
}

export interface Promotion {
  id: string;
  ref: string;
  label: string;
  type: 'PERCENTAGE' | 'FIXE' | 'BUY_X_GET_Y';
  value: number;
  appliesTo: string;
  productIds?: string[];
  startDate: string;
  endDate: string;
  status: string;
}

export interface PurchaseOrderLine {
  productId: string;
  quantity: number;
  price: number;
}

export interface PurchaseOrder {
  id: string;
  ref: string;
  supplierId: string;
  lines: PurchaseOrderLine[];
  total: number;
  status: string;
  createdAt: string;
}

export interface ErpCashRegister {
  id: string;
  ref: string;
  label: string;
  openingCash: number;
  closingCash?: number;
  status: string;
  openedAt: string;
  closedAt?: string;
}

export interface ErpExpense {
  id: string;
  ref: string;
  label: string;
  amount: number;
  category: string;
  supplierId?: string;
  date: string;
}

export interface ErpReservation {
  id: string;
  ref: string;
  clientId: string;
  productIds: string[];
  startAt: string;
  endAt: string;
  status: string;
}

export interface ErpAgendaEvent {
  id: string;
  title: string;
  startAt: string;
  endAt: string;
  type: string;
  relatedTo?: string;
}

export interface ErpProject {
  id: string;
  ref: string;
  label: string;
  clientId?: string;
  status: string;
  startDate: string;
  endDate?: string;
}

export interface ErpUser {
  id: string;
  login: string;
  name: string;
  firstname: string;
  email: string;
  admin: boolean;
  active: boolean;
  lastLogin: string;
}

export interface ErpStats {
  clients: { total: number; actifs: number };
  products: { total: number; stockTotal: number; valeurStock: number };
  orders: { total: number; enCours: number; totalVentes: number };
  suppliers: { total: number };
  quotes: { total: number; enAttente: number };
  invoices: { total: number; totalFacture: number; totalPaye: number; enRetard: number };
  payments: { total: number; totalRecu: number };
  warehouses: { total: number };
  shipments: { total: number; enLivraison: number };
  variants: { total: number };
  services: { total: number };
  movements: { total: number };
  transfers: { total: number };
  inventory: { total: number };
  alerts: { total: number; actives: number };
  returns: { total: number };
  promotions: { total: number; actives: number };
  purchases: { total: number; enAttente: number };
  registers: { total: number; ouverts: number };
  expenses: { total: number; totalDepenses: number };
  reservations: { total: number; actives: number };
  agenda: { total: number };
  projects: { total: number };
}

// Interface principale pour tous les adaptateurs ERP
export interface IErpAdapter {
  // Clients
  getClients(): Promise<ErpClient[]>;
  getClientById(id: string): Promise<ErpClient>;
  createClient(data: Omit<ErpClient, 'id'>): Promise<ErpClient>;
  updateClient(id: string, data: Partial<ErpClient>): Promise<ErpClient>;
  deleteClient(id: string): Promise<void>;

  // Produits
  getProducts(): Promise<ErpProduct[]>;
  getProductById(id: string): Promise<ErpProduct>;
  createProduct(data: Omit<ErpProduct, 'id'>): Promise<ErpProduct>;
  updateProduct(id: string, data: Partial<ErpProduct>): Promise<ErpProduct>;
  deleteProduct(id: string): Promise<void>;

  // Commandes
  getOrders(): Promise<ErpOrder[]>;
  getOrderById(id: string): Promise<ErpOrder>;
  createOrder(data: { clientId: string; lines: ErpOrderLine[] }): Promise<ErpOrder>;
  updateOrder(id: string, data: Partial<ErpOrder>): Promise<ErpOrder>;
  deleteOrder(id: string): Promise<void>;

  // Stock
  getStock(productId: string): Promise<StockInfo>;
  updateStock(productId: string, quantity: number): Promise<StockInfo>;
  getStocks(): Promise<StockInfo[]>;

  // Fournisseurs
  getSuppliers(): Promise<ErpSupplier[]>;
  getSupplierById(id: string): Promise<ErpSupplier>;
  createSupplier(data: Omit<ErpSupplier, 'id' | 'ref'>): Promise<ErpSupplier>;
  updateSupplier(id: string, data: Partial<ErpSupplier>): Promise<ErpSupplier>;
  deleteSupplier(id: string): Promise<void>;

  // Devis
  getQuotes(): Promise<ErpQuote[]>;
  getQuoteById(id: string): Promise<ErpQuote>;
  createQuote(data: { clientId: string; lines: QuoteLine[]; status?: string; validUntil?: string }): Promise<ErpQuote>;
  updateQuote(id: string, data: Partial<ErpQuote>): Promise<ErpQuote>;
  deleteQuote(id: string): Promise<void>;

  // Factures
  getInvoices(): Promise<ErpInvoice[]>;
  getInvoiceById(id: string): Promise<ErpInvoice>;
  createInvoice(data: { clientId: string; lines: InvoiceLine[]; status?: string; dueDate?: string }): Promise<ErpInvoice>;
  updateInvoice(id: string, data: Partial<ErpInvoice>): Promise<ErpInvoice>;
  deleteInvoice(id: string): Promise<void>;

  // Paiements
  getPayments(): Promise<ErpPayment[]>;
  getPaymentById(id: string): Promise<ErpPayment>;
  createPayment(data: { invoiceId: string; amount: number; method: string; status?: string }): Promise<ErpPayment>;

  // Entrepots
  getWarehouses(): Promise<ErpWarehouse[]>;
  getWarehouseById(id: string): Promise<ErpWarehouse>;
  createWarehouse(data: Omit<ErpWarehouse, 'id' | 'ref'>): Promise<ErpWarehouse>;
  updateWarehouse(id: string, data: Partial<ErpWarehouse>): Promise<ErpWarehouse>;
  deleteWarehouse(id: string): Promise<void>;

  // Expeditions
  getShipments(): Promise<ErpShipment[]>;
  getShipmentById(id: string): Promise<ErpShipment>;
  createShipment(data: { orderId: string; carrier: string; status?: string; trackingNumber?: string }): Promise<ErpShipment>;
  updateShipment(id: string, data: Partial<ErpShipment>): Promise<ErpShipment>;

  // Documents
  getDocuments(): Promise<ErpDocument[]>;
  getDocumentById(id: string): Promise<ErpDocument>;
  createDocument(data: { type: string; title: string; relatedTo?: string; size?: number }): Promise<ErpDocument>;
  deleteDocument(id: string): Promise<void>;

  // Variantes produits
  getProductVariants(): Promise<ErpProductVariant[]>;
  getProductVariantsByProduct(productId: string): Promise<ErpProductVariant[]>;
  createProductVariant(data: { productId: string; ref?: string; attribute: string; value: string; price?: number; stock?: number; barcode?: string }): Promise<ErpProductVariant>;
  updateProductVariant(id: string, data: Partial<ErpProductVariant>): Promise<ErpProductVariant>;
  deleteProductVariant(id: string): Promise<void>;

  // Services
  getServices(): Promise<ErpService[]>;
  getServiceById(id: string): Promise<ErpService>;
  createService(data: { label: string; price: number; duration?: number; description?: string }): Promise<ErpService>;
  updateService(id: string, data: Partial<ErpService>): Promise<ErpService>;
  deleteService(id: string): Promise<void>;

  // Mouvements de stock
  getStockMovements(): Promise<StockMovement[]>;
  createStockMovement(data: { productId: string; type: StockMovement['type']; quantity: number; reason: string }): Promise<StockMovement>;

  // Transferts entre entrepots
  getStockTransfers(): Promise<StockTransfer[]>;
  createStockTransfer(data: { productId: string; quantity: number; fromWarehouseId: string; toWarehouseId: string }): Promise<StockTransfer>;
  updateStockTransfer(id: string, data: Partial<StockTransfer>): Promise<StockTransfer>;

  // Inventaires
  getInventories(): Promise<Inventory[]>;
  getInventoryById(id: string): Promise<Inventory>;
  createInventory(data: { label: string; type: Inventory['type'] }): Promise<Inventory>;
  updateInventory(id: string, data: Partial<Inventory>): Promise<Inventory>;

  // Alertes de stock
  getStockAlerts(): Promise<StockAlert[]>;
  createStockAlert(data: { productId: string; level: StockAlert['level']; current: number; threshold: number }): Promise<StockAlert>;

  // Retours & echanges
  getReturns(): Promise<ErpReturn[]>;
  getReturnById(id: string): Promise<ErpReturn>;
  createReturn(data: { orderId: string; clientId: string; reason: string; type: ErpReturn['type']; lines: ErpReturn['lines'] }): Promise<ErpReturn>;
  updateReturn(id: string, data: Partial<ErpReturn>): Promise<ErpReturn>;

  // Promotions & remises
  getPromotions(): Promise<Promotion[]>;
  getPromotionById(id: string): Promise<Promotion>;
  createPromotion(data: { label: string; type: Promotion['type']; value: number; appliesTo: string; startDate: string; endDate: string }): Promise<Promotion>;
  updatePromotion(id: string, data: Partial<Promotion>): Promise<Promotion>;
  deletePromotion(id: string): Promise<void>;

  // Achats (bons de commande fournisseurs)
  getPurchaseOrders(): Promise<PurchaseOrder[]>;
  getPurchaseOrderById(id: string): Promise<PurchaseOrder>;
  createPurchaseOrder(data: { supplierId: string; lines: PurchaseOrderLine[] }): Promise<PurchaseOrder>;
  updatePurchaseOrder(id: string, data: Partial<PurchaseOrder>): Promise<PurchaseOrder>;

  // Caisse
  getCashRegisters(): Promise<ErpCashRegister[]>;
  getCashRegisterById(id: string): Promise<ErpCashRegister>;
  createCashRegister(data: { label: string; openingCash: number }): Promise<ErpCashRegister>;
  updateCashRegister(id: string, data: Partial<ErpCashRegister>): Promise<ErpCashRegister>;

  // Depenses
  getExpenses(): Promise<ErpExpense[]>;
  getExpenseById(id: string): Promise<ErpExpense>;
  createExpense(data: { label: string; amount: number; category: string; supplierId?: string }): Promise<ErpExpense>;
  deleteExpense(id: string): Promise<void>;

  // Reservations
  getReservations(): Promise<ErpReservation[]>;
  getReservationById(id: string): Promise<ErpReservation>;
  createReservation(data: { clientId: string; productIds?: string[]; startAt: string; endAt: string }): Promise<ErpReservation>;
  updateReservation(id: string, data: Partial<ErpReservation>): Promise<ErpReservation>;

  // Agenda
  getAgenda(): Promise<ErpAgendaEvent[]>;
  createAgendaEvent(data: { title: string; startAt: string; endAt: string; type: string; relatedTo?: string }): Promise<ErpAgendaEvent>;
  updateAgendaEvent(id: string, data: Partial<{ title: string; startAt: string; endAt: string; type: string; relatedTo?: string }>): Promise<ErpAgendaEvent>;
  deleteAgendaEvent(id: string): Promise<void>;

  // Projets
  getProjects(): Promise<ErpProject[]>;
  getProjectById(id: string): Promise<ErpProject>;
  createProject(data: { label: string; clientId?: string; status?: string; startDate?: string }): Promise<ErpProject>;
  updateProject(id: string, data: Partial<ErpProject>): Promise<ErpProject>;

  // Statistiques
  getStats(): Promise<ErpStats>;

  // Utilisateurs
  getUsers(): Promise<ErpUser[]>;
  getUserById(id: string): Promise<ErpUser | undefined>;
  getCurrentUser(): Promise<ErpUser | undefined>;

  // Sante
  healthCheck(): Promise<HealthCheckResult>;
}
