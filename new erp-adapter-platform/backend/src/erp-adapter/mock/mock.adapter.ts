import { Logger, NotFoundException } from '@nestjs/common';
import {
  IErpAdapter,
  ErpClient,
  ErpProduct,
  ErpOrder,
  ErpOrderLine,
  StockInfo,
  HealthCheckResult,
  ErpSupplier,
  ErpQuote,
  QuoteLine,
  ErpInvoice,
  InvoiceLine,
  ErpPayment,
  ErpWarehouse,
  ErpShipment,
  ErpDocument,
  ErpStats,
  ErpProductVariant,
  ErpService,
  StockMovement,
  StockTransfer,
  Inventory,
  StockAlert,
  ErpReturn,
  Promotion,
  PurchaseOrder,
  PurchaseOrderLine,
  ErpCashRegister,
  ErpExpense,
  ErpReservation,
  ErpAgendaEvent,
  ErpProject,
  ErpUser,
} from '../interfaces/erp-adapter.interface';

export class MockAdapter implements IErpAdapter {
  private readonly logger = new Logger(MockAdapter.name);
  private clients: ErpClient[] = [
    { id: 'client-1', nom: 'Rakoto Jean', email: 'rakoto@example.com', telephone: '+261 34 11 222 33' },
    { id: 'client-2', nom: 'Rasoa Marie', email: 'rasoa@example.com', telephone: '+261 33 44 555 66' },
    { id: 'client-3', nom: 'Andry Rajoelina', email: 'andry@example.com' },
    { id: 'client-4', nom: 'Hery Rajaonarimampianina', email: 'hery@example.com', telephone: '+261 32 77 888 99' },
    { id: 'client-5', nom: 'Fanja Ratsiraka', email: 'fanja@example.com' },
  ];

  private products: ErpProduct[] = [
    { id: 'prod-1', ref: 'PRD-001', label: 'Ordinateur portable', price: 999.99, stock: 25 },
    { id: 'prod-2', ref: 'PRD-002', label: 'Souris sans fil', price: 29.99, stock: 150 },
    { id: 'prod-3', ref: 'PRD-003', label: 'Clavier mecanique', price: 79.99, stock: 80 },
    { id: 'prod-4', ref: 'PRD-004', label: 'Ecran 27 pouces', price: 349.99, stock: 15 },
    { id: 'prod-5', ref: 'PRD-005', label: 'Casque audio', price: 59.99, stock: 60 },
    { id: 'prod-6', ref: 'PRD-006', label: 'Imprimante laser', price: 189.99, stock: 10 },
    { id: 'prod-7', ref: 'PRD-007', label: 'Disque dur externe 1To', price: 79.99, stock: 45 },
    { id: 'prod-8', ref: 'PRD-008', label: 'Camera de securite', price: 129.99, stock: 30 },
  ];

  private orders: ErpOrder[] = [
    {
      id: 'order-1',
      ref: 'CMD-2024-001',
      clientId: 'client-1',
      lines: [{ productId: 'prod-1', quantity: 1, price: 999.99 }],
      total: 999.99,
      status: 'CONFIRMEE',
      createdAt: '2024-01-15T10:30:00Z',
    },
    {
      id: 'order-2',
      ref: 'CMD-2024-002',
      clientId: 'client-2',
      lines: [
        { productId: 'prod-2', quantity: 3, price: 29.99 },
        { productId: 'prod-3', quantity: 1, price: 79.99 },
      ],
      total: 169.96,
      status: 'EN_COURS',
      createdAt: '2024-01-20T14:15:00Z',
    },
    {
      id: 'order-3',
      ref: 'CMD-2024-003',
      clientId: 'client-3',
      lines: [{ productId: 'prod-4', quantity: 2, price: 349.99 }],
      total: 699.98,
      status: 'LIVREE',
      createdAt: '2024-02-01T09:00:00Z',
    },
    {
      id: 'order-4',
      ref: 'CMD-2024-004',
      clientId: 'client-4',
      lines: [{ productId: 'prod-5', quantity: 4, price: 59.99 }],
      total: 239.96,
      status: 'ANNULEE',
      createdAt: '2024-02-10T16:45:00Z',
    },
    {
      id: 'order-5',
      ref: 'CMD-2024-005',
      clientId: 'client-5',
      lines: [
        { productId: 'prod-2', quantity: 10, price: 29.99 },
        { productId: 'prod-3', quantity: 5, price: 79.99 },
      ],
      total: 699.85,
      status: 'EN_ATTENTE',
      createdAt: '2024-03-01T11:00:00Z',
    },
  ];

  private suppliers: ErpSupplier[] = [
    { id: 'sup-1', ref: 'FRS-001', nom: 'Tech Import SA', email: 'vente@techimport.mg', telephone: '+261 20 22 111 11', adresse: 'Zone franche', ville: 'Antananarivo' },
    { id: 'sup-2', ref: 'FRS-002', nom: 'Makro Madagascar', email: 'contact@makro.mg', telephone: '+261 20 23 222 22', ville: 'Toamasina' },
    { id: 'sup-3', ref: 'FRS-003', nom: 'Bureau Plus', email: 'commandes@bureauplus.mg', telephone: '+261 33 12 333 33', adresse: 'Rue du Commerce', ville: 'Antananarivo' },
    { id: 'sup-4', ref: 'FRS-004', nom: 'Informatech', email: 'info@informatech.mg', telephone: '+261 32 44 444 44', ville: 'Antsirabe' },
  ];

  private quotes: ErpQuote[] = [
    {
      id: 'quote-1',
      ref: 'DEV-2024-001',
      clientId: 'client-1',
      lines: [{ productId: 'prod-1', label: 'Ordinateur portable', quantity: 2, price: 999.99 }],
      total: 1999.98,
      status: 'ACCEPTE',
      validUntil: '2024-04-30',
      createdAt: '2024-02-01T08:00:00Z',
    },
    {
      id: 'quote-2',
      ref: 'DEV-2024-002',
      clientId: 'client-2',
      lines: [{ productId: 'prod-4', label: 'Ecran 27 pouces', quantity: 3, price: 349.99 }],
      total: 1049.97,
      status: 'EN_ATTENTE',
      validUntil: '2024-05-15',
      createdAt: '2024-02-20T09:30:00Z',
    },
    {
      id: 'quote-3',
      ref: 'DEV-2024-003',
      clientId: 'client-3',
      lines: [{ productId: 'prod-7', label: 'Disque dur externe 1To', quantity: 5, price: 79.99 }],
      total: 399.95,
      status: 'REFUSE',
      validUntil: '2024-03-31',
      createdAt: '2024-02-25T14:00:00Z',
    },
  ];

  private invoices: ErpInvoice[] = [
    {
      id: 'inv-1',
      ref: 'FAC-2024-001',
      clientId: 'client-1',
      lines: [{ productId: 'prod-1', label: 'Ordinateur portable', quantity: 1, price: 999.99 }],
      total: 999.99,
      paid: 999.99,
      status: 'PAYEE',
      dueDate: '2024-02-15',
      createdAt: '2024-01-16T10:00:00Z',
    },
    {
      id: 'inv-2',
      ref: 'FAC-2024-002',
      clientId: 'client-2',
      lines: [{ productId: 'prod-2', label: 'Souris sans fil', quantity: 3, price: 29.99 }],
      total: 89.97,
      paid: 0,
      status: 'EN_RETARD',
      dueDate: '2024-01-20',
      createdAt: '2024-01-21T11:00:00Z',
    },
    {
      id: 'inv-3',
      ref: 'FAC-2024-003',
      clientId: 'client-3',
      lines: [{ productId: 'prod-4', label: 'Ecran 27 pouces', quantity: 2, price: 349.99 }],
      total: 699.98,
      paid: 349.99,
      status: 'PARTIELLE',
      dueDate: '2024-03-01',
      createdAt: '2024-02-02T09:00:00Z',
    },
    {
      id: 'inv-4',
      ref: 'FAC-2024-004',
      clientId: 'client-4',
      lines: [{ productId: 'prod-5', label: 'Casque audio', quantity: 4, price: 59.99 }],
      total: 239.96,
      paid: 0,
      status: 'EN_ATTENTE',
      dueDate: '2024-04-10',
      createdAt: '2024-02-11T15:00:00Z',
    },
  ];

  private payments: ErpPayment[] = [
    { id: 'pay-1', ref: 'PAY-2024-001', invoiceId: 'inv-1', amount: 999.99, method: 'VIREMENT', status: 'EFFECTUE', paidAt: '2024-01-30T10:00:00Z' },
    { id: 'pay-2', ref: 'PAY-2024-002', invoiceId: 'inv-3', amount: 349.99, method: 'CB', status: 'EFFECTUE', paidAt: '2024-02-10T14:00:00Z' },
  ];

  private warehouses: ErpWarehouse[] = [
    { id: 'wh-1', ref: 'ENT-001', nom: 'Entrepot central', ville: 'Antananarivo', adresse: 'Zone industrielle', capacite: 1000, utilisation: 420 },
    { id: 'wh-2', ref: 'ENT-002', nom: 'Entrepot portuaire', ville: 'Toamasina', adresse: 'Quai 3', capacite: 2000, utilisation: 1250 },
    { id: 'wh-3', ref: 'ENT-003', nom: 'Depot sud', ville: 'Toliara', capacite: 500, utilisation: 130 },
  ];

  private shipments: ErpShipment[] = [
    { id: 'ship-1', ref: 'EXP-2024-001', orderId: 'order-1', carrier: 'DHL Express', status: 'LIVREE', trackingNumber: 'JD0123456789', shippedAt: '2024-01-20T08:00:00Z' },
    { id: 'ship-2', ref: 'EXP-2024-002', orderId: 'order-2', carrier: 'Colis Express', status: 'EN_TRANSIT', trackingNumber: 'CE9876543210', shippedAt: '2024-01-25T09:00:00Z' },
    { id: 'ship-3', ref: 'EXP-2024-003', orderId: 'order-3', carrier: 'MadaLog', status: 'PREPARATION' },
  ];

  private documents: ErpDocument[] = [
    { id: 'doc-1', ref: 'DOC-001', type: 'CONTRAT', title: 'Contrat de maintenance', relatedTo: 'client-1', size: 204800, createdAt: '2024-01-05T09:00:00Z' },
    { id: 'doc-2', ref: 'DOC-002', type: 'DEVIS', title: 'Devis pack bureautique', relatedTo: 'quote-2', size: 153600, createdAt: '2024-02-20T10:00:00Z' },
    { id: 'doc-3', ref: 'DOC-003', type: 'FACTURE', title: 'Facture mars 2024', relatedTo: 'inv-3', size: 98304, createdAt: '2024-02-02T11:00:00Z' },
  ];

  private variants: ErpProductVariant[] = [
    { id: 'var-1', productId: 'prod-1', ref: 'PRD-001-A', attribute: 'modele', value: 'Boutique', price: 999.99, stock: 10 },
    { id: 'var-2', productId: 'prod-5', ref: 'PRD-005-N', attribute: 'couleur', value: 'Noir', stock: 30 },
    { id: 'var-3', productId: 'prod-5', ref: 'PRD-005-B', attribute: 'couleur', value: 'Bleu', stock: 30 },
    { id: 'var-4', productId: 'prod-3', ref: 'PRD-003-40', attribute: 'pointure', value: '40', stock: 20 },
    { id: 'var-5', productId: 'prod-3', ref: 'PRD-003-42', attribute: 'pointure', value: '42', stock: 15 },
  ];

  private services: ErpService[] = [
    { id: 'srv-1', ref: 'SRV-001', label: 'Installation reseau', price: 150.0, duration: 60, description: 'Installation et configuration' },
    { id: 'srv-2', ref: 'SRV-002', label: 'Maintenance annuelle', price: 300.0, duration: 0, description: 'Contrat annuel' },
    { id: 'srv-3', ref: 'SRV-003', label: 'Depannage urgent', price: 80.0, duration: 30 },
  ];

  private movements: StockMovement[] = [
    { id: 'mv-1', ref: 'MV-001', productId: 'prod-1', type: 'ENTREE', quantity: 20, reason: 'Reception fournisseur', date: '2024-01-10T09:00:00Z' },
    { id: 'mv-2', ref: 'MV-002', productId: 'prod-2', type: 'SORTIE', quantity: 10, reason: 'Vente 0012', date: '2024-01-12T10:00:00Z' },
    { id: 'mv-3', ref: 'MV-003', productId: 'prod-4', type: 'AJUSTEMENT', quantity: 2, reason: 'Correction inventaire', date: '2024-02-05T11:00:00Z' },
  ];

  private transfers: StockTransfer[] = [
    { id: 'tr-1', ref: 'TRF-001', productId: 'prod-2', quantity: 25, fromWarehouseId: 'wh-1', toWarehouseId: 'wh-2', status: 'TERMINE', date: '2024-01-18T09:00:00Z' },
    { id: 'tr-2', ref: 'TRF-002', productId: 'prod-5', quantity: 15, fromWarehouseId: 'wh-2', toWarehouseId: 'wh-3', status: 'EN_TRANSIT', date: '2024-02-22T10:00:00Z' },
  ];

  private inventoriesData: Inventory[] = [
    { id: 'inv-data-1', ref: 'INV-001', label: 'Inventaire mensuel decembre', type: 'GLOBAL', status: 'TERMINE', items: [{ productId: 'prod-1', expected: 25, counted: 25 }], date: '2023-12-31T00:00:00Z' },
    { id: 'inv-data-2', ref: 'INV-002', label: 'Inventaire partiel Box 23', type: 'PARTIEL', status: 'EN_COURS', items: [{ productId: 'prod-5', expected: 60, counted: 58 }], date: '2024-02-28T00:00:00Z' },
  ];

  private stockAlerts: StockAlert[] = [
    { id: 'alert-1', productId: 'prod-4', level: 'LOW', current: 15, threshold: 20, date: '2024-02-20T00:00:00Z' },
    { id: 'alert-2', productId: 'prod-6', level: 'CRITICAL', current: 10, threshold: 15, date: '2024-02-25T00:00:00Z' },
  ];

  private returnsData: ErpReturn[] = [
    { id: 'return-1', ref: 'RET-001', orderId: 'order-3', clientId: 'client-3', reason: 'Article defectueux', type: 'RETOUR', lines: [{ productId: 'prod-4', quantity: 1, amount: 349.99 }], status: 'EN_COURS', createdAt: '2024-02-10T10:00:00Z' },
  ];

  private promotions: Promotion[] = [
    { id: 'promo-1', ref: 'PROM-001', label: 'Promo ete 20%', type: 'PERCENTAGE', value: 20, appliesTo: 'PRODUIT', productIds: ['prod-2', 'prod-5'], startDate: '2024-06-01', endDate: '2024-06-30', status: 'ACTIVE' },
    { id: 'promo-2', ref: 'PROM-002', label: 'Offre speciale ecran', type: 'FIXE', value: 50, appliesTo: 'PRODUIT', productIds: ['prod-4'], startDate: '2024-03-01', endDate: '2024-03-31', status: 'ACTIVE' },
  ];

  private purchases: PurchaseOrder[] = [
    { id: 'po-1', ref: 'ACH-001', supplierId: 'sup-1', lines: [{ productId: 'prod-1', quantity: 10, price: 650.0 }], total: 6500.0, status: 'EN_ATTENTE', createdAt: '2024-01-05T09:00:00Z' },
    { id: 'po-2', ref: 'ACH-002', supplierId: 'sup-2', lines: [{ productId: 'prod-2', quantity: 100, price: 10.0 }], total: 1000.0, status: 'RECUE', createdAt: '2024-01-08T10:00:00Z' },
  ];

  private registers: ErpCashRegister[] = [
    { id: 'reg-1', ref: 'CAISSE-001', label: 'Caisse Box 23', openingCash: 200000, status: 'OUVERT', openedAt: '2024-02-28T08:00:00Z' },
    { id: 'reg-2', ref: 'CAISSE-002', label: 'Caisse Box 24', openingCash: 150000, closingCash: 210000, status: 'FERME', openedAt: '2024-02-27T08:00:00Z', closedAt: '2024-02-27T19:00:00Z' },
  ];

  private expenses: ErpExpense[] = [
    { id: 'exp-1', ref: 'DEP-001', label: 'Loyer Box 23', amount: 150000, category: 'LOYER', date: '2024-01-02T00:00:00Z' },
    { id: 'exp-2', ref: 'DEP-002', label: 'Electricite', amount: 45000, category: 'ENERGIE', date: '2024-01-15T00:00:00Z' },
  ];

  private reservations: ErpReservation[] = [
    { id: 'reso-1', ref: 'RES-001', clientId: 'client-1', productIds: ['prod-2', 'prod-3'], startAt: '2024-03-05T10:00:00Z', endAt: '2024-03-07T10:00:00Z', status: 'CONFIRMEE' },
    { id: 'reso-2', ref: 'RES-002', clientId: 'client-2', productIds: ['prod-5'], startAt: '2024-03-10T09:00:00Z', endAt: '2024-03-12T09:00:00Z', status: 'EN_ATTENTE' },
  ];

  private agenda: ErpAgendaEvent[] = [
    { id: 'ev-1', title: 'Reunion fournisseur', startAt: '2024-03-08T09:00:00Z', endAt: '2024-03-08T10:00:00Z', type: 'REUNION', relatedTo: 'sup-1' },
    { id: 'ev-2', title: 'Livraison Box 23', startAt: '2024-03-12T14:00:00Z', endAt: '2024-03-12T15:00:00Z', type: 'LIVRAISON', relatedTo: 'wh-1' },
  ];

  private projects: ErpProject[] = [
    { id: 'proj-1', ref: 'PROJ-001', label: 'Amenagement Box 23', clientId: 'client-1', status: 'EN_COURS', startDate: '2024-01-15' },
    { id: 'proj-2', ref: 'PROJ-002', label: 'Migration serveur', clientId: 'client-3', status: 'TERMINE', startDate: '2023-12-01', endDate: '2024-01-10' },
  ];

  private nextClientId = 6;
  private nextProductId = 9;
  private nextOrderId = 6;
  private nextSupplierId = 5;
  private nextQuoteId = 4;
  private nextInvoiceId = 5;
  private nextPaymentId = 3;
  private nextWarehouseId = 4;
  private nextShipmentId = 4;
  private nextDocumentId = 4;
  private nextVariantId = 6;
  private nextServiceId = 4;
  private nextMovementId = 4;
  private nextTransferId = 3;
  private nextInventoryId = 3;
  private nextAlertId = 3;
  private nextReturnId = 2;
  private nextPromotionId = 3;
  private nextPurchaseId = 3;
  private nextRegisterId = 3;
  private nextExpenseId = 3;
  private nextReservationId = 3;
  private nextAgendaId = 3;
  private nextProjectId = 3;

  // === CLIENTS ===

  async getClients(): Promise<ErpClient[]> {
    this.logger.log(`Recuperation de ${this.clients.length} clients`);
    return [...this.clients];
  }

  async getClientById(id: string): Promise<ErpClient> {
    const client = this.clients.find((c) => c.id === id);
    if (!client) throw new NotFoundException(`Client "${id}" non trouve`);
    return { ...client };
  }

  async createClient(data: Omit<ErpClient, 'id'>): Promise<ErpClient> {
    const client: ErpClient = { id: `client-${this.nextClientId++}`, ...data };
    this.clients.push(client);
    this.logger.log(`Client cree: ${client.id}`);
    return { ...client };
  }

  async updateClient(id: string, data: Partial<ErpClient>): Promise<ErpClient> {
    const index = this.clients.findIndex((c) => c.id === id);
    if (index === -1) throw new NotFoundException(`Client "${id}" non trouve`);
    this.clients[index] = { ...this.clients[index], ...data };
    this.logger.log(`Client mis a jour: ${id}`);
    return { ...this.clients[index] };
  }

  async deleteClient(id: string): Promise<void> {
    const index = this.clients.findIndex((c) => c.id === id);
    if (index === -1) throw new NotFoundException(`Client "${id}" non trouve`);
    this.clients.splice(index, 1);
    this.logger.log(`Client supprime: ${id}`);
  }

  // === PRODUITS ===

  async getProducts(): Promise<ErpProduct[]> {
    this.logger.log(`Recuperation de ${this.products.length} produits`);
    return [...this.products];
  }

  async getProductById(id: string): Promise<ErpProduct> {
    const product = this.products.find((p) => p.id === id);
    if (!product) throw new NotFoundException(`Produit "${id}" non trouve`);
    return { ...product };
  }

  async createProduct(data: Omit<ErpProduct, 'id'>): Promise<ErpProduct> {
    const product: ErpProduct = { id: `prod-${this.nextProductId++}`, ...data };
    this.products.push(product);
    this.logger.log(`Produit cree: ${product.id}`);
    return { ...product };
  }

  async updateProduct(id: string, data: Partial<ErpProduct>): Promise<ErpProduct> {
    const index = this.products.findIndex((p) => p.id === id);
    if (index === -1) throw new NotFoundException(`Produit "${id}" non trouve`);
    this.products[index] = { ...this.products[index], ...data };
    this.logger.log(`Produit mis a jour: ${id}`);
    return { ...this.products[index] };
  }

  async deleteProduct(id: string): Promise<void> {
    const index = this.products.findIndex((p) => p.id === id);
    if (index === -1) throw new NotFoundException(`Produit "${id}" non trouve`);
    this.products.splice(index, 1);
    this.logger.log(`Produit supprime: ${id}`);
  }

  // === COMMANDES ===

  async getOrders(): Promise<ErpOrder[]> {
    this.logger.log(`Recuperation de ${this.orders.length} commandes`);
    return [...this.orders];
  }

  async getOrderById(id: string): Promise<ErpOrder> {
    const order = this.orders.find((o) => o.id === id);
    if (!order) throw new NotFoundException(`Commande "${id}" non trouvee`);
    return { ...order };
  }

  async createOrder(data: { clientId: string; lines: ErpOrderLine[] }): Promise<ErpOrder> {
    const total = data.lines.reduce((sum, l) => sum + l.price * l.quantity, 0);
    const order: ErpOrder = {
      id: `order-${this.nextOrderId++}`,
      ref: `CMD-${new Date().getFullYear()}-${String(this.nextOrderId).padStart(3, '0')}`,
      clientId: data.clientId,
      lines: [...data.lines],
      total,
      status: 'EN_ATTENTE',
      createdAt: new Date().toISOString(),
    };
    this.orders.push(order);
    this.logger.log(`Commande creee: ${order.id}`);
    return { ...order };
  }

  async updateOrder(id: string, data: Partial<ErpOrder>): Promise<ErpOrder> {
    const index = this.orders.findIndex((o) => o.id === id);
    if (index === -1) throw new NotFoundException(`Commande "${id}" non trouvee`);
    this.orders[index] = { ...this.orders[index], ...data };
    this.logger.log(`Commande mise a jour: ${id}`);
    return { ...this.orders[index] };
  }

  async deleteOrder(id: string): Promise<void> {
    const index = this.orders.findIndex((o) => o.id === id);
    if (index === -1) throw new NotFoundException(`Commande "${id}" non trouvee`);
    this.orders.splice(index, 1);
    this.logger.log(`Commande supprimee: ${id}`);
  }

  // === STOCK ===

  async getStock(productId: string): Promise<StockInfo> {
    const product = this.products.find((p) => p.id === productId);
    if (!product) throw new NotFoundException(`Produit "${productId}" non trouve`);
    return {
      productId: product.id,
      currentStock: product.stock,
      lastUpdated: new Date().toISOString(),
    };
  }

  async updateStock(productId: string, quantity: number): Promise<StockInfo> {
    const index = this.products.findIndex((p) => p.id === productId);
    if (index === -1) throw new NotFoundException(`Produit "${productId}" non trouve`);
    this.products[index].stock = quantity;
    this.logger.log(`Stock mis a jour: ${productId} -> ${quantity}`);
    return {
      productId,
      currentStock: quantity,
      lastUpdated: new Date().toISOString(),
    };
  }

  async getStocks(): Promise<StockInfo[]> {
    this.logger.log(`Recuperation du stock de ${this.products.length} produits`);
    return this.products.map((p) => ({
      productId: p.id,
      currentStock: p.stock,
      lastUpdated: new Date().toISOString(),
    }));
  }

  // === FOURNISSEURS ===

  async getSuppliers(): Promise<ErpSupplier[]> {
    this.logger.log(`Recuperation de ${this.suppliers.length} fournisseurs`);
    return [...this.suppliers];
  }

  async getSupplierById(id: string): Promise<ErpSupplier> {
    const supplier = this.suppliers.find((s) => s.id === id);
    if (!supplier) throw new NotFoundException(`Fournisseur "${id}" non trouve`);
    return { ...supplier };
  }

  async createSupplier(data: Omit<ErpSupplier, 'id' | 'ref'>): Promise<ErpSupplier> {
    const supplier: ErpSupplier = {
      id: `sup-${this.nextSupplierId++}`,
      ref: `FRS-${String(this.nextSupplierId).padStart(3, '0')}`,
      ...data,
    };
    this.suppliers.push(supplier);
    this.logger.log(`Fournisseur cree: ${supplier.id}`);
    return { ...supplier };
  }

  async updateSupplier(id: string, data: Partial<ErpSupplier>): Promise<ErpSupplier> {
    const index = this.suppliers.findIndex((s) => s.id === id);
    if (index === -1) throw new NotFoundException(`Fournisseur "${id}" non trouve`);
    this.suppliers[index] = { ...this.suppliers[index], ...data };
    this.logger.log(`Fournisseur mis a jour: ${id}`);
    return { ...this.suppliers[index] };
  }

  async deleteSupplier(id: string): Promise<void> {
    const index = this.suppliers.findIndex((s) => s.id === id);
    if (index === -1) throw new NotFoundException(`Fournisseur "${id}" non trouve`);
    this.suppliers.splice(index, 1);
    this.logger.log(`Fournisseur supprime: ${id}`);
  }

  // === DEVIS ===

  async getQuotes(): Promise<ErpQuote[]> {
    this.logger.log(`Recuperation de ${this.quotes.length} devis`);
    return [...this.quotes];
  }

  async getQuoteById(id: string): Promise<ErpQuote> {
    const quote = this.quotes.find((q) => q.id === id);
    if (!quote) throw new NotFoundException(`Devis "${id}" non trouve`);
    return { ...quote };
  }

  async createQuote(data: { clientId: string; lines: QuoteLine[]; status?: string; validUntil?: string }): Promise<ErpQuote> {
    const total = data.lines.reduce((sum, l) => sum + l.price * l.quantity, 0);
    const quote: Partial<ErpQuote> = { ...data, id: `quote-${this.nextQuoteId++}`, total };
    quote.ref = `DEV-${new Date().getFullYear()}-${String(this.nextQuoteId).padStart(3, '0')}`;
    quote.status = data.status || 'EN_ATTENTE';
    quote.validUntil = data.validUntil || `${new Date().getFullYear()}-12-31`;
    quote.createdAt = new Date().toISOString();
    this.quotes.push(quote as ErpQuote);
    this.logger.log(`Devis cree: ${quote.id}`);
    return { ...quote } as ErpQuote;
  }

  async updateQuote(id: string, data: Partial<ErpQuote>): Promise<ErpQuote> {
    const index = this.quotes.findIndex((q) => q.id === id);
    if (index === -1) throw new NotFoundException(`Devis "${id}" non trouve`);
    const lines = data.lines || this.quotes[index].lines;
    const total = lines.reduce((sum, l) => sum + l.price * l.quantity, 0);
    this.quotes[index] = { ...this.quotes[index], ...data, total, lines: [...lines] };
    this.logger.log(`Devis mis a jour: ${id}`);
    return { ...this.quotes[index] };
  }

  async deleteQuote(id: string): Promise<void> {
    const index = this.quotes.findIndex((q) => q.id === id);
    if (index === -1) throw new NotFoundException(`Devis "${id}" non trouve`);
    this.quotes.splice(index, 1);
    this.logger.log(`Devis supprime: ${id}`);
  }

  // === FACTURES ===

  async getInvoices(): Promise<ErpInvoice[]> {
    this.logger.log(`Recuperation de ${this.invoices.length} factures`);
    return [...this.invoices];
  }

  async getInvoiceById(id: string): Promise<ErpInvoice> {
    const invoice = this.invoices.find((i) => i.id === id);
    if (!invoice) throw new NotFoundException(`Facture "${id}" non trouvee`);
    return { ...invoice };
  }

  async createInvoice(data: { clientId: string; lines: InvoiceLine[]; status?: string; dueDate?: string }): Promise<ErpInvoice> {
    const total = data.lines.reduce((sum, l) => sum + l.price * l.quantity, 0);
    const invoice: Partial<ErpInvoice> = { ...data, id: `inv-${this.nextInvoiceId++}`, total, paid: 0 };
    invoice.ref = `FAC-${new Date().getFullYear()}-${String(this.nextInvoiceId).padStart(3, '0')}`;
    invoice.status = data.status || 'EN_ATTENTE';
    invoice.dueDate = data.dueDate || `${new Date().getFullYear()}-12-31`;
    invoice.createdAt = new Date().toISOString();
    this.invoices.push(invoice as ErpInvoice);
    this.logger.log(`Facture creee: ${invoice.id}`);
    return { ...invoice } as ErpInvoice;
  }

  async updateInvoice(id: string, data: Partial<ErpInvoice>): Promise<ErpInvoice> {
    const index = this.invoices.findIndex((i) => i.id === id);
    if (index === -1) throw new NotFoundException(`Facture "${id}" non trouvee`);
    const lines = data.lines || this.invoices[index].lines;
    const total = lines.reduce((sum, l) => sum + l.price * l.quantity, 0);
    this.invoices[index] = { ...this.invoices[index], ...data, total, lines: [...lines] };
    this.logger.log(`Facture mise a jour: ${id}`);
    return { ...this.invoices[index] };
  }

  async deleteInvoice(id: string): Promise<void> {
    const index = this.invoices.findIndex((i) => i.id === id);
    if (index === -1) throw new NotFoundException(`Facture "${id}" non trouvee`);
    this.invoices.splice(index, 1);
    this.logger.log(`Facture supprimee: ${id}`);
  }

  // === PAIEMENTS ===

  async getPayments(): Promise<ErpPayment[]> {
    this.logger.log(`Recuperation de ${this.payments.length} paiements`);
    return [...this.payments];
  }

  async getPaymentById(id: string): Promise<ErpPayment> {
    const payment = this.payments.find((p) => p.id === id);
    if (!payment) throw new NotFoundException(`Paiement "${id}" non trouve`);
    return { ...payment };
  }

  async createPayment(data: { invoiceId: string; amount: number; method: string; status?: string }): Promise<ErpPayment> {
    const payment: Partial<ErpPayment> = { ...data, id: `pay-${this.nextPaymentId++}` };
    payment.ref = `PAY-${new Date().getFullYear()}-${String(this.nextPaymentId).padStart(3, '0')}`;
    payment.status = data.status || 'EFFECTUE';
    payment.paidAt = new Date().toISOString();
    this.payments.push(payment as ErpPayment);
    const invoice = this.invoices.find((i) => i.id === payment.invoiceId);
    if (invoice) {
      invoice.paid = (invoice.paid || 0) + (payment.amount || 0);
      if (invoice.paid >= invoice.total) invoice.status = 'PAYEE';
      else if (invoice.paid > 0) invoice.status = 'PARTIELLE';
    }
    this.logger.log(`Paiement cree: ${payment.id}`);
    return { ...payment } as ErpPayment;
  }

  // === ENTREPOTS ===

  async getWarehouses(): Promise<ErpWarehouse[]> {
    this.logger.log(`Recuperation de ${this.warehouses.length} entrepots`);
    return [...this.warehouses];
  }

  async getWarehouseById(id: string): Promise<ErpWarehouse> {
    const warehouse = this.warehouses.find((w) => w.id === id);
    if (!warehouse) throw new NotFoundException(`Entrepot "${id}" non trouve`);
    return { ...warehouse };
  }

  async createWarehouse(data: Omit<ErpWarehouse, 'id' | 'ref'>): Promise<ErpWarehouse> {
    const warehouse: Partial<ErpWarehouse> = { ...data, id: `wh-${this.nextWarehouseId++}` };
    warehouse.ref = `ENT-${String(this.nextWarehouseId).padStart(3, '0')}`;
    warehouse.capacite = data.capacite || 500;
    warehouse.utilisation = data.utilisation || 0;
    this.warehouses.push(warehouse as ErpWarehouse);
    this.logger.log(`Entrepot cree: ${warehouse.id}`);
    return { ...warehouse } as ErpWarehouse;
  }

  async updateWarehouse(id: string, data: Partial<ErpWarehouse>): Promise<ErpWarehouse> {
    const index = this.warehouses.findIndex((w) => w.id === id);
    if (index === -1) throw new NotFoundException(`Entrepot "${id}" non trouve`);
    this.warehouses[index] = { ...this.warehouses[index], ...data };
    this.logger.log(`Entrepot mis a jour: ${id}`);
    return { ...this.warehouses[index] };
  }

  async deleteWarehouse(id: string): Promise<void> {
    const index = this.warehouses.findIndex((w) => w.id === id);
    if (index === -1) throw new NotFoundException(`Entrepot "${id}" non trouve`);
    this.warehouses.splice(index, 1);
    this.logger.log(`Entrepot supprime: ${id}`);
  }

  // === EXPEDITIONS ===

  async getShipments(): Promise<ErpShipment[]> {
    this.logger.log(`Recuperation de ${this.shipments.length} expeditions`);
    return [...this.shipments];
  }

  async getShipmentById(id: string): Promise<ErpShipment> {
    const shipment = this.shipments.find((s) => s.id === id);
    if (!shipment) throw new NotFoundException(`Expedition "${id}" non trouvee`);
    return { ...shipment };
  }

  async createShipment(data: { orderId: string; carrier: string; status?: string; trackingNumber?: string }): Promise<ErpShipment> {
    const shipment: Partial<ErpShipment> = { ...data, id: `ship-${this.nextShipmentId++}` };
    shipment.ref = `EXP-${new Date().getFullYear()}-${String(this.nextShipmentId).padStart(3, '0')}`;
    shipment.status = data.status || 'PREPARATION';
    this.shipments.push(shipment as ErpShipment);
    this.logger.log(`Expedition creee: ${shipment.id}`);
    return { ...shipment } as ErpShipment;
  }

  async updateShipment(id: string, data: Partial<ErpShipment>): Promise<ErpShipment> {
    const index = this.shipments.findIndex((s) => s.id === id);
    if (index === -1) throw new NotFoundException(`Expedition "${id}" non trouvee`);
    this.shipments[index] = { ...this.shipments[index], ...data };
    this.logger.log(`Expedition mise a jour: ${id}`);
    return { ...this.shipments[index] };
  }

  // === DOCUMENTS ===

  async getDocuments(): Promise<ErpDocument[]> {
    this.logger.log(`Recuperation de ${this.documents.length} documents`);
    return [...this.documents];
  }

  async getDocumentById(id: string): Promise<ErpDocument> {
    const document = this.documents.find((d) => d.id === id);
    if (!document) throw new NotFoundException(`Document "${id}" non trouve`);
    return { ...document };
  }

  async createDocument(data: { type: string; title: string; relatedTo?: string; size?: number }): Promise<ErpDocument> {
    const document: Partial<ErpDocument> = { ...data, id: `doc-${this.nextDocumentId++}` };
    document.ref = `DOC-${String(this.nextDocumentId).padStart(3, '0')}`;
    document.createdAt = new Date().toISOString();
    this.documents.push(document as ErpDocument);
    this.logger.log(`Document cree: ${document.id}`);
    return { ...document } as ErpDocument;
  }

  async deleteDocument(id: string): Promise<void> {
    const index = this.documents.findIndex((d) => d.id === id);
    if (index === -1) throw new NotFoundException(`Document "${id}" non trouve`);
    this.documents.splice(index, 1);
    this.logger.log(`Document supprime: ${id}`);
  }

  // === VARIANTS PRODUITS ===

  async getProductVariants(): Promise<ErpProductVariant[]> {
    return [...this.variants];
  }

  async getProductVariantsByProduct(productId: string): Promise<ErpProductVariant[]> {
    return this.variants.filter((v) => v.productId === productId).map((v) => ({ ...v }));
  }

  async createProductVariant(data: {
    productId: string; ref?: string; attribute: string; value: string;
    price?: number; stock?: number; barcode?: string;
  }): Promise<ErpProductVariant> {
    const variant: ErpProductVariant = {
      id: `var-${this.nextVariantId++}`,
      productId: data.productId,
      ref: data.ref || `VAR-${this.nextVariantId}`,
      attribute: data.attribute,
      value: data.value,
      price: data.price,
      stock: data.stock,
      barcode: data.barcode,
    };
    this.variants.push(variant);
    this.logger.log(`Variante creee: ${variant.id}`);
    return { ...variant };
  }

  async updateProductVariant(id: string, data: Partial<ErpProductVariant>): Promise<ErpProductVariant> {
    const index = this.variants.findIndex((v) => v.id === id);
    if (index === -1) throw new NotFoundException(`Variante "${id}" non trouvee`);
    this.variants[index] = { ...this.variants[index], ...data };
    return { ...this.variants[index] };
  }

  async deleteProductVariant(id: string): Promise<void> {
    const index = this.variants.findIndex((v) => v.id === id);
    if (index === -1) throw new NotFoundException(`Variante "${id}" non trouvee`);
    this.variants.splice(index, 1);
    this.logger.log(`Variante supprimee: ${id}`);
  }

  // === SERVICES ===

  async getServices(): Promise<ErpService[]> {
    return [...this.services];
  }

  async getServiceById(id: string): Promise<ErpService> {
    const service = this.services.find((s) => s.id === id);
    if (!service) throw new NotFoundException(`Service "${id}" non trouve`);
    return { ...service };
  }

  async createService(data: { label: string; price: number; duration?: number; description?: string }): Promise<ErpService> {
    const service: ErpService = {
      id: `srv-${this.nextServiceId++}`,
      ref: `SRV-${String(this.nextServiceId).padStart(3, '0')}`,
      label: data.label,
      price: data.price,
      duration: data.duration || 0,
      description: data.description,
    };
    this.services.push(service);
    this.logger.log(`Service cree: ${service.id}`);
    return { ...service };
  }

  async updateService(id: string, data: Partial<ErpService>): Promise<ErpService> {
    const index = this.services.findIndex((s) => s.id === id);
    if (index === -1) throw new NotFoundException(`Service "${id}" non trouve`);
    this.services[index] = { ...this.services[index], ...data };
    return { ...this.services[index] };
  }

  async deleteService(id: string): Promise<void> {
    const index = this.services.findIndex((s) => s.id === id);
    if (index === -1) throw new NotFoundException(`Service "${id}" non trouve`);
    this.services.splice(index, 1);
    this.logger.log(`Service supprime: ${id}`);
  }

  // === MOUVEMENTS DE STOCK ===

  async getStockMovements(): Promise<StockMovement[]> {
    return [...this.movements];
  }

  async createStockMovement(data: {
    productId: string; type: StockMovement['type']; quantity: number; reason: string;
  }): Promise<StockMovement> {
    const movement: StockMovement = {
      id: `mv-${this.nextMovementId++}`,
      ref: `MV-${String(this.nextMovementId).padStart(3, '0')}`,
      productId: data.productId,
      type: data.type,
      quantity: data.quantity,
      reason: data.reason,
      date: new Date().toISOString(),
    };
    this.movements.unshift(movement);
    this.logger.log(`Mouvement stock cree: ${movement.id}`);
    return { ...movement };
  }

  // === TRANSFERTS STOCK ===

  async getStockTransfers(): Promise<StockTransfer[]> {
    return [...this.transfers];
  }

  async createStockTransfer(data: {
    productId: string; quantity: number; fromWarehouseId: string; toWarehouseId: string;
  }): Promise<StockTransfer> {
    const transfer: StockTransfer = {
      id: `tr-${this.nextTransferId++}`,
      ref: `TRF-${String(this.nextTransferId).padStart(3, '0')}`,
      productId: data.productId,
      quantity: data.quantity,
      fromWarehouseId: data.fromWarehouseId,
      toWarehouseId: data.toWarehouseId,
      status: 'EN_TRANSIT',
      date: new Date().toISOString(),
    };
    this.transfers.push(transfer);
    this.logger.log(`Transfert cree: ${transfer.id}`);
    return { ...transfer };
  }

  async updateStockTransfer(id: string, data: Partial<StockTransfer>): Promise<StockTransfer> {
    const index = this.transfers.findIndex((t) => t.id === id);
    if (index === -1) throw new NotFoundException(`Transfert "${id}" non trouve`);
    this.transfers[index] = { ...this.transfers[index], ...data };
    return { ...this.transfers[index] };
  }

  // === INVENTAIRES ===

  async getInventories(): Promise<Inventory[]> {
    return [...this.inventoriesData];
  }

  async getInventoryById(id: string): Promise<Inventory> {
    const inventory = this.inventoriesData.find((i) => i.id === id);
    if (!inventory) throw new NotFoundException(`Inventaire "${id}" non trouve`);
    return { ...inventory };
  }

  async createInventory(data: { label: string; type: Inventory['type'] }): Promise<Inventory> {
    const inventory: Inventory = {
      id: `inv-data-${this.nextInventoryId++}`,
      ref: `INV-${String(this.nextInventoryId).padStart(3, '0')}`,
      label: data.label,
      type: data.type,
      status: 'EN_COURS',
      items: [],
      date: new Date().toISOString(),
    };
    this.inventoriesData.push(inventory);
    this.logger.log(`Inventaire cree: ${inventory.id}`);
    return { ...inventory };
  }

  async updateInventory(id: string, data: Partial<Inventory>): Promise<Inventory> {
    const index = this.inventoriesData.findIndex((i) => i.id === id);
    if (index === -1) throw new NotFoundException(`Inventaire "${id}" non trouve`);
    this.inventoriesData[index] = { ...this.inventoriesData[index], ...data };
    return { ...this.inventoriesData[index] };
  }

  // === ALERTES STOCK ===

  async getStockAlerts(): Promise<StockAlert[]> {
    return [...this.stockAlerts];
  }

  async createStockAlert(data: { productId: string; level: StockAlert['level']; current: number; threshold: number }): Promise<StockAlert> {
    const alert: StockAlert = {
      id: `alert-${this.nextAlertId++}`,
      productId: data.productId,
      level: data.level,
      current: data.current,
      threshold: data.threshold,
      date: new Date().toISOString(),
    };
    this.stockAlerts.push(alert);
    this.logger.log(`Alerte stock creee: ${alert.id}`);
    return { ...alert };
  }

  // === RETOURS & ECHANGES ===

  async getReturns(): Promise<ErpReturn[]> {
    return [...this.returnsData];
  }

  async getReturnById(id: string): Promise<ErpReturn> {
    const ret = this.returnsData.find((r) => r.id === id);
    if (!ret) throw new NotFoundException(`Retour "${id}" non trouve`);
    return { ...ret };
  }

  async createReturn(data: { orderId: string; clientId: string; reason: string; type: ErpReturn['type']; lines: ErpReturn['lines'] }): Promise<ErpReturn> {
    const ret: ErpReturn = {
      id: `return-${this.nextReturnId++}`,
      ref: `RET-${String(this.nextReturnId).padStart(3, '0')}`,
      orderId: data.orderId,
      clientId: data.clientId,
      reason: data.reason,
      type: data.type,
      lines: [...data.lines],
      status: 'EN_COURS',
      createdAt: new Date().toISOString(),
    };
    this.returnsData.push(ret);
    this.logger.log(`Retour cree: ${ret.id}`);
    return { ...ret };
  }

  async updateReturn(id: string, data: Partial<ErpReturn>): Promise<ErpReturn> {
    const index = this.returnsData.findIndex((r) => r.id === id);
    if (index === -1) throw new NotFoundException(`Retour "${id}" non trouve`);
    this.returnsData[index] = { ...this.returnsData[index], ...data };
    return { ...this.returnsData[index] };
  }

  // === PROMOTIONS ===

  async getPromotions(): Promise<Promotion[]> {
    return [...this.promotions];
  }

  async getPromotionById(id: string): Promise<Promotion> {
    const promo = this.promotions.find((p) => p.id === id);
    if (!promo) throw new NotFoundException(`Promotion "${id}" non trouvee`);
    return { ...promo };
  }

  async createPromotion(data: { label: string; type: Promotion['type']; value: number; appliesTo: string; startDate: string; endDate: string }): Promise<Promotion> {
    const promo: Promotion = {
      id: `promo-${this.nextPromotionId++}`,
      ref: `PROM-${String(this.nextPromotionId).padStart(3, '0')}`,
      label: data.label,
      type: data.type,
      value: data.value,
      appliesTo: data.appliesTo,
      startDate: data.startDate,
      endDate: data.endDate,
      status: 'ACTIVE',
    };
    this.promotions.push(promo);
    this.logger.log(`Promotion creee: ${promo.id}`);
    return { ...promo };
  }

  async updatePromotion(id: string, data: Partial<Promotion>): Promise<Promotion> {
    const index = this.promotions.findIndex((p) => p.id === id);
    if (index === -1) throw new NotFoundException(`Promotion "${id}" non trouvee`);
    this.promotions[index] = { ...this.promotions[index], ...data };
    return { ...this.promotions[index] };
  }

  async deletePromotion(id: string): Promise<void> {
    const index = this.promotions.findIndex((p) => p.id === id);
    if (index === -1) throw new NotFoundException(`Promotion "${id}" non trouvee`);
    this.promotions.splice(index, 1);
    this.logger.log(`Promotion supprimee: ${id}`);
  }

  // === ACHATS (BONS DE COMMANDE) ===

  async getPurchaseOrders(): Promise<PurchaseOrder[]> {
    return [...this.purchases];
  }

  async getPurchaseOrderById(id: string): Promise<PurchaseOrder> {
    const po = this.purchases.find((p) => p.id === id);
    if (!po) throw new NotFoundException(`Achat "${id}" non trouve`);
    return { ...po };
  }

  async createPurchaseOrder(data: { supplierId: string; lines: PurchaseOrderLine[] }): Promise<PurchaseOrder> {
    const total = data.lines.reduce((sum, l) => sum + l.price * l.quantity, 0);
    const po: PurchaseOrder = {
      id: `po-${this.nextPurchaseId++}`,
      ref: `ACH-${String(this.nextPurchaseId).padStart(3, '0')}`,
      supplierId: data.supplierId,
      lines: [...data.lines],
      total,
      status: 'EN_ATTENTE',
      createdAt: new Date().toISOString(),
    };
    this.purchases.push(po);
    this.logger.log(`Achat cree: ${po.id}`);
    return { ...po };
  }

  async updatePurchaseOrder(id: string, data: Partial<PurchaseOrder>): Promise<PurchaseOrder> {
    const index = this.purchases.findIndex((p) => p.id === id);
    if (index === -1) throw new NotFoundException(`Achat "${id}" non trouve`);
    this.purchases[index] = { ...this.purchases[index], ...data };
    return { ...this.purchases[index] };
  }

  // === CAISSE ===

  async getCashRegisters(): Promise<ErpCashRegister[]> {
    return [...this.registers];
  }

  async getCashRegisterById(id: string): Promise<ErpCashRegister> {
    const reg = this.registers.find((r) => r.id === id);
    if (!reg) throw new NotFoundException(`Caisse "${id}" non trouvee`);
    return { ...reg };
  }

  async createCashRegister(data: { label: string; openingCash: number }): Promise<ErpCashRegister> {
    const reg: ErpCashRegister = {
      id: `reg-${this.nextRegisterId++}`,
      ref: `CAISSE-${String(this.nextRegisterId).padStart(3, '0')}`,
      label: data.label,
      openingCash: data.openingCash,
      status: 'OUVERT',
      openedAt: new Date().toISOString(),
    };
    this.registers.push(reg);
    this.logger.log(`Caisse creee: ${reg.id}`);
    return { ...reg };
  }

  async updateCashRegister(id: string, data: Partial<ErpCashRegister>): Promise<ErpCashRegister> {
    const index = this.registers.findIndex((r) => r.id === id);
    if (index === -1) throw new NotFoundException(`Caisse "${id}" non trouvee`);
    this.registers[index] = { ...this.registers[index], ...data };
    return { ...this.registers[index] };
  }

  // === DEPENSES ===

  async getExpenses(): Promise<ErpExpense[]> {
    return [...this.expenses];
  }

  async getExpenseById(id: string): Promise<ErpExpense> {
    const exp = this.expenses.find((e) => e.id === id);
    if (!exp) throw new NotFoundException(`Depense "${id}" non trouvee`);
    return { ...exp };
  }

  async createExpense(data: { label: string; amount: number; category: string; supplierId?: string }): Promise<ErpExpense> {
    const exp: ErpExpense = {
      id: `exp-${this.nextExpenseId++}`,
      ref: `DEP-${String(this.nextExpenseId).padStart(3, '0')}`,
      label: data.label,
      amount: data.amount,
      category: data.category,
      supplierId: data.supplierId,
      date: new Date().toISOString(),
    };
    this.expenses.push(exp);
    this.logger.log(`Depense creee: ${exp.id}`);
    return { ...exp };
  }

  async deleteExpense(id: string): Promise<void> {
    const index = this.expenses.findIndex((e) => e.id === id);
    if (index === -1) throw new NotFoundException(`Depense "${id}" non trouvee`);
    this.expenses.splice(index, 1);
    this.logger.log(`Depense supprimee: ${id}`);
  }

  // === RESERVATIONS ===

  async getReservations(): Promise<ErpReservation[]> {
    return [...this.reservations];
  }

  async getReservationById(id: string): Promise<ErpReservation> {
    const res = this.reservations.find((r) => r.id === id);
    if (!res) throw new NotFoundException(`Reservation "${id}" non trouvee`);
    return { ...res };
  }

  async createReservation(data: { clientId: string; productIds?: string[]; startAt: string; endAt: string }): Promise<ErpReservation> {
    const res: ErpReservation = {
      id: `reso-${this.nextReservationId++}`,
      ref: `RES-${String(this.nextReservationId).padStart(3, '0')}`,
      clientId: data.clientId,
      productIds: data.productIds || [],
      startAt: data.startAt,
      endAt: data.endAt,
      status: 'EN_ATTENTE',
    };
    this.reservations.push(res);
    this.logger.log(`Reservation creee: ${res.id}`);
    return { ...res };
  }

  async updateReservation(id: string, data: Partial<ErpReservation>): Promise<ErpReservation> {
    const index = this.reservations.findIndex((r) => r.id === id);
    if (index === -1) throw new NotFoundException(`Reservation "${id}" non trouvee`);
    this.reservations[index] = { ...this.reservations[index], ...data };
    return { ...this.reservations[index] };
  }

  // === AGENDA ===

  async getAgenda(): Promise<ErpAgendaEvent[]> {
    return [...this.agenda];
  }

  async createAgendaEvent(data: { title: string; startAt: string; endAt: string; type: string; relatedTo?: string }): Promise<ErpAgendaEvent> {
    const event: ErpAgendaEvent = {
      id: `ev-${this.nextAgendaId++}`,
      title: data.title,
      startAt: data.startAt,
      endAt: data.endAt,
      type: data.type,
      relatedTo: data.relatedTo,
    };
    this.agenda.push(event);
    this.logger.log(`Evenement agenda cree: ${event.id}`);
    return { ...event };
  }

  async updateAgendaEvent(id: string, data: Partial<{ title: string; startAt: string; endAt: string; type: string; relatedTo?: string }>): Promise<ErpAgendaEvent> {
    const i = this.agenda.findIndex((e) => e.id === id);
    if (i === -1) throw new NotFoundException(`Evenement d agenda "${id}" non trouve`);
    this.agenda[i] = { ...this.agenda[i], ...data } as ErpAgendaEvent;
    this.logger.log(`Evenement agenda modifie: ${id}`);
    return { ...this.agenda[i] };
  }

  async deleteAgendaEvent(id: string): Promise<void> {
    const i = this.agenda.findIndex((e) => e.id === id);
    if (i === -1) throw new NotFoundException(`Evenement d agenda "${id}" non trouve`);
    this.agenda.splice(i, 1);
    this.logger.log(`Evenement agenda supprime: ${id}`);
  }

  // === PROJETS ===

  async getProjects(): Promise<ErpProject[]> {
    return [...this.projects];
  }

  async getProjectById(id: string): Promise<ErpProject> {
    const proj = this.projects.find((p) => p.id === id);
    if (!proj) throw new NotFoundException(`Projet "${id}" non trouve`);
    return { ...proj };
  }

  async createProject(data: { label: string; clientId?: string; status?: string; startDate?: string }): Promise<ErpProject> {
    const proj: ErpProject = {
      id: `proj-${this.nextProjectId++}`,
      ref: `PROJ-${String(this.nextProjectId).padStart(3, '0')}`,
      label: data.label,
      clientId: data.clientId,
      status: data.status || 'EN_COURS',
      startDate: data.startDate || new Date().toISOString().slice(0, 10),
    };
    this.projects.push(proj);
    this.logger.log(`Projet cree: ${proj.id}`);
    return { ...proj };
  }

  async updateProject(id: string, data: Partial<ErpProject>): Promise<ErpProject> {
    const index = this.projects.findIndex((p) => p.id === id);
    if (index === -1) throw new NotFoundException(`Projet "${id}" non trouve`);
    this.projects[index] = { ...this.projects[index], ...data };
    return { ...this.projects[index] };
  }

  // === STATISTIQUES ===

  async getStats(): Promise<ErpStats> {
    const stockTotal = this.products.reduce((s, p) => s + p.stock, 0);
    const valeurStock = this.products.reduce((s, p) => s + p.stock * p.price, 0);
    const totalVentes = this.orders.reduce((s, o) => s + o.total, 0);
    const totalFacture = this.invoices.reduce((s, i) => s + i.total, 0);
    const totalPaye = this.invoices.reduce((s, i) => s + i.paid, 0);
    const totalRecu = this.payments.reduce((s, p) => s + p.amount, 0);

    return {
      clients: { total: this.clients.length, actifs: this.clients.filter((c) => c.email).length },
      products: { total: this.products.length, stockTotal, valeurStock },
      orders: {
        total: this.orders.length,
        enCours: this.orders.filter((o) => o.status === 'EN_COURS' || o.status === 'EN_ATTENTE').length,
        totalVentes,
      },
      suppliers: { total: this.suppliers.length },
      quotes: { total: this.quotes.length, enAttente: this.quotes.filter((q) => q.status === 'EN_ATTENTE').length },
      invoices: {
        total: this.invoices.length,
        totalFacture,
        totalPaye,
        enRetard: this.invoices.filter((i) => i.status === 'EN_RETARD').length,
      },
      payments: { total: this.payments.length, totalRecu },
      warehouses: { total: this.warehouses.length },
      shipments: {
        total: this.shipments.length,
        enLivraison: this.shipments.filter((s) => s.status === 'EN_TRANSIT' || s.status === 'PREPARATION').length,
      },
      variants: { total: this.variants.length },
      services: { total: this.services.length },
      movements: { total: this.movements.length },
      transfers: { total: this.transfers.length },
      inventory: { total: this.inventoriesData.length },
      alerts: { total: this.stockAlerts.length, actives: this.stockAlerts.filter((a) => a.level === 'CRITICAL').length },
      returns: { total: this.returnsData.length },
      promotions: { total: this.promotions.length, actives: this.promotions.filter((p) => p.status === 'ACTIVE').length },
      purchases: { total: this.purchases.length, enAttente: this.purchases.filter((p) => p.status === 'EN_ATTENTE').length },
      registers: { total: this.registers.length, ouverts: this.registers.filter((r) => r.status === 'OUVERT').length },
      expenses: { total: this.expenses.length, totalDepenses: this.expenses.reduce((s, e) => s + e.amount, 0) },
      reservations: { total: this.reservations.length, actives: this.reservations.filter((r) => r.status !== 'ANNULEE').length },
      agenda: { total: this.agenda.length },
      projects: { total: this.projects.length },
    };
  }

  // === SANTE ===

  async healthCheck(): Promise<HealthCheckResult> {
    return {
      status: 'CONNECTED',
      mode: 'MOCK',
      timestamp: new Date().toISOString(),
    };
  }

  // === UTILISATEURS ===

  async getUsers(): Promise<ErpUser[]> {
    return [
      { id: '1', login: 'admin', name: 'Admin', firstname: '', email: 'admin@erp.local', admin: true, active: true, lastLogin: new Date().toISOString() },
    ];
  }

  async getUserById(id: string): Promise<ErpUser | undefined> {
    return (await this.getUsers()).find((u) => u.id === id);
  }

  async getCurrentUser(): Promise<ErpUser | undefined> {
    const users = await this.getUsers();
    return users.find((u) => u.admin) || users[0];
  }
}
