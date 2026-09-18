import { Logger, Injectable } from '@nestjs/common';
import axios, { AxiosInstance, AxiosError } from 'axios';
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
import { DolibarrConfig, DEFAULT_DOLIBARR_CONFIG } from './dolibarr.config';
import { DolibarrMapper, mapToDolibarrDate } from './dolibarr.mapper';
import { DolibarrError } from './dolibarr.error';
import { DolibarrClient, DolibarrProduct, DolibarrOrder, DolibarrUser, DolibarrVariant, DolibarrService, DolibarrStockMovement, DolibarrStockTransfer, DolibarrInventory, DolibarrStockAlert, DolibarrReturn, DolibarrPromotion, DolibarrPurchaseOrder, DolibarrCashRegister, DolibarrExpense, DolibarrReservation, DolibarrAgendaEvent, DolibarrProject, DolibarrQuote, DolibarrInvoice, DolibarrPayment, DolibarrWarehouse, DolibarrShipment, DolibarrDocument } from './dolibarr.dto';

@Injectable()
export class DolibarrAdapter implements IErpAdapter {
  private readonly logger = new Logger(DolibarrAdapter.name);
  private readonly http: AxiosInstance;
  private config: DolibarrConfig;

  constructor() {
    this.config = { ...DEFAULT_DOLIBARR_CONFIG };

    this.http = axios.create({
      baseURL: `${this.config.baseUrl}/api/index.php`,
      timeout: this.config.timeout,
      headers: {
        DOLAPIKEY: this.config.apiKey,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
    });

    // Intercepteur de retry avec backoff exponentiel
    this.http.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        const config = error.config as any;
        if (!config) throw this.handleError(error);

        const status = error.response?.status || 0;
        const retryable = status === 0 || status >= 500 || status === 408 || status === 429;
        config.__retryCount = config.__retryCount || 0;
        if (retryable && config.__retryCount < this.config.retryAttempts) {
          config.__retryCount += 1;
          const delay = this.config.retryDelay * Math.pow(2, config.__retryCount - 1);
          this.logger.warn(`Retry ${config.__retryCount}/${this.config.retryAttempts} dans ${delay}ms`);
          await new Promise((r) => setTimeout(r, delay));
          return this.http.request(config);
        }

        throw this.handleError(error);
      },
    );

    this.logger.log(`DolibarrAdapter cree - URL: ${this.config.baseUrl}`);
  }

  // === CONFIGURATION ===

  /**
   * Reconfigure l'adapter avec de nouveaux parametres
   */
  configure(config: Partial<DolibarrConfig>): void {
    this.config = { ...this.config, ...config };
    this.logger.log(`DolibarrAdapter reconfigure - URL: ${this.config.baseUrl}`);
  }

  // === CLIENTS (ThirdParty) ===

  async getClients(): Promise<ErpClient[]> {
    this.logger.log('GET /thirdparties');
    const { data } = await this.http.get('/thirdparties', {
      params: { entity: this.config.entity, limit: 100 },
    });
    const clients: DolibarrClient[] = Array.isArray(data) ? data : data.thirdparties || [];
    this.logger.log(`${clients.length} clients recus`);
    return clients.map(DolibarrMapper.mapFromDolibarrClient);
  }

  async getClientById(id: string): Promise<ErpClient> {
    this.logger.log(`GET /thirdparties/${id}`);
    const { data } = await this.http.get(`/thirdparties/${id}`);
    return DolibarrMapper.mapFromDolibarrClient(data);
  }

  async createClient(data: Omit<ErpClient, 'id'>): Promise<ErpClient> {
    this.logger.log('POST /thirdparties');
    const dolibarrData = DolibarrMapper.mapToDolibarrClient(data, this.config.entity);
    const { data: created } = await this.http.post('/thirdparties', dolibarrData);
    return DolibarrMapper.mapFromDolibarrClient({ ...dolibarrData, id: created.id || created });
  }

  async updateClient(id: string, data: Partial<ErpClient>): Promise<ErpClient> {
    this.logger.log(`PUT /thirdparties/${id}`);
    const dolibarrData = DolibarrMapper.mapToDolibarrClient(data as ErpClient, this.config.entity);
    await this.http.put(`/thirdparties/${id}`, dolibarrData);
    return this.getClientById(id);
  }

  async deleteClient(id: string): Promise<void> {
    this.logger.log(`DELETE /thirdparties/${id}`);
    await this.http.delete(`/thirdparties/${id}`);
  }

  // === PRODUITS (Products) ===

  async getProducts(): Promise<ErpProduct[]> {
    this.logger.log('GET /products');
    const { data } = await this.http.get('/products', {
      params: { entity: this.config.entity, limit: 100 },
    });
    const products: DolibarrProduct[] = Array.isArray(data) ? data : data.products || [];
    this.logger.log(`${products.length} produits recus`);
    return products.map(DolibarrMapper.mapFromDolibarrProduct);
  }

  async getProductById(id: string): Promise<ErpProduct> {
    this.logger.log(`GET /products/${id}`);
    const { data } = await this.http.get(`/products/${id}`);
    return DolibarrMapper.mapFromDolibarrProduct(data);
  }

  async createProduct(data: Omit<ErpProduct, 'id'>): Promise<ErpProduct> {
    this.logger.log('POST /products');
    const dolibarrData = DolibarrMapper.mapToDolibarrProduct(data, this.config.entity);
    const { data: created } = await this.http.post('/products', dolibarrData);
    return DolibarrMapper.mapFromDolibarrProduct({ ...dolibarrData, id: created.id || created });
  }

  async updateProduct(id: string, data: Partial<ErpProduct>): Promise<ErpProduct> {
    this.logger.log(`PUT /products/${id}`);
    const dolibarrData = DolibarrMapper.mapToDolibarrProduct(data as ErpProduct, this.config.entity);
    await this.http.put(`/products/${id}`, dolibarrData);
    return this.getProductById(id);
  }

  async deleteProduct(id: string): Promise<void> {
    this.logger.log(`DELETE /products/${id}`);
    await this.http.delete(`/products/${id}`);
  }

  // === COMMANDES (Orders) ===

  async getOrders(): Promise<ErpOrder[]> {
    this.logger.log('GET /orders');
    const { data } = await this.http.get('/orders', {
      params: { entity: this.config.entity, limit: 100 },
    });
    const orders: DolibarrOrder[] = Array.isArray(data) ? data : data.orders || [];
    this.logger.log(`${orders.length} commandes recues`);
    return orders.map(DolibarrMapper.mapFromDolibarrOrder);
  }

  async getOrderById(id: string): Promise<ErpOrder> {
    this.logger.log(`GET /orders/${id}`);
    const { data } = await this.http.get(`/orders/${id}`);
    return DolibarrMapper.mapFromDolibarrOrder(data);
  }

  async createOrder(data: { clientId: string; lines: ErpOrderLine[] }): Promise<ErpOrder> {
    this.logger.log('POST /orders');
    const dolibarrData = DolibarrMapper.mapToDolibarrOrder(data, this.config.entity);
    const { data: created } = await this.http.post('/orders', {
      socid: dolibarrData.socid,
      date: mapToDolibarrDate(new Date().toISOString()),
      entity: this.config.entity,
    });
    const id = String(created.id || created);
    for (const l of data.lines) {
      await this.http.post(`/orders/${id}/lines`, {
        fk_product: Number(l.productId),
        qty: l.quantity,
        subprice: l.price || 0,
      });
    }
    return this.getOrderById(id);
  }

  async updateOrder(id: string, data: Partial<ErpOrder>): Promise<ErpOrder> {
    this.logger.log(`PUT /orders/${id}`);
    if (data.clientId && data.lines) {
      for (const l of data.lines) {
        await this.http.post(`/orders/${id}/lines`, {
          fk_product: Number(l.productId),
          qty: l.quantity,
          subprice: l.price || 0,
        });
      }
    }
    return this.getOrderById(id);
  }

  async deleteOrder(id: string): Promise<void> {
    this.logger.log(`DELETE /orders/${id}`);
    await this.http.delete(`/orders/${id}`);
  }

  // === STOCK ===

  async getStock(productId: string): Promise<StockInfo> {
    this.logger.log(`GET /products/${productId} (stock)`);
    const product = await this.getProductById(productId);
    return DolibarrMapper.mapFromDolibarrStock(productId, product.stock);
  }

  async updateStock(productId: string, quantity: number): Promise<StockInfo> {
    this.logger.log(`PUT /products/${productId} (stock -> ${quantity})`);
    await this.http.put(`/products/${productId}`, { stock: quantity });
    return DolibarrMapper.mapFromDolibarrStock(productId, quantity);
  }

  // === HEALTH CHECK ===

  async healthCheck(): Promise<HealthCheckResult> {
    try {
      this.logger.log('Health check Dolibarr');
      await this.http.get('/status', { timeout: 5000 });
      return {
        status: 'HEALTHY',
        mode: 'DOLIBARR',
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error(`Health check echoue: ${error.message}`);
      return {
        status: 'UNHEALTHY',
        mode: 'DOLIBARR',
        timestamp: new Date().toISOString(),
      };
    }
  }

  // === STOCK (tous) ===

  async getStocks(): Promise<StockInfo[]> {
    this.logger.log('GET /products (tous les stocks)');
    const products = await this.getProducts();
    return products.map((p) => ({
      productId: p.id,
      currentStock: p.stock,
      lastUpdated: new Date().toISOString(),
    }));
  }

  // === FOURNISSEURS ===

  async getSuppliers(): Promise<ErpSupplier[]> {
    this.logger.log('GET /thirdparties (fournisseurs)');
    const { data } = await this.http.get('/thirdparties', {
      params: { entity: this.config.entity, limit: 100 },
    });
    const list: DolibarrClient[] = Array.isArray(data) ? data : data.thirdparties || [];
    const suppliers = list
      .filter((t) => Number(t.fournisseur) === 1)
      .map((t) => ({
        id: String(t.id),
        ref: t.code_fournisseur || `FRS-${t.id}`,
        nom: t.name || '',
        email: t.email,
        telephone: t.phone,
        adresse: t.address,
        ville: t.town,
      }));
    this.logger.log(`${suppliers.length} fournisseurs recus`);
    return suppliers;
  }

  async getSupplierById(id: string): Promise<ErpSupplier> {
    this.logger.log(`GET /thirdparties/${id} (fournisseur)`);
    const { data } = await this.http.get(`/thirdparties/${id}`);
    return {
      id: String(data.id),
      ref: data.code_fournisseur || `FRS-${data.id}`,
      nom: data.name || '',
      email: data.email,
      telephone: data.phone,
      adresse: data.address,
      ville: data.town,
    };
  }

  async createSupplier(data: Omit<ErpSupplier, 'id' | 'ref'>): Promise<ErpSupplier> {
    this.logger.log('POST /thirdparties (fournisseur)');
    const { data: created } = await this.http.post('/thirdparties', {
      name: data.nom,
      email: data.email || '',
      phone: data.telephone || '',
      address: data.adresse || '',
      town: data.ville || '',
      fournisseur: 1,
      entity: this.config.entity,
    });
    return this.getSupplierById(String(created.id || created));
  }

  async updateSupplier(id: string, data: Partial<ErpSupplier>): Promise<ErpSupplier> {
    this.logger.log(`PUT /thirdparties/${id} (fournisseur)`);
    await this.http.put(`/thirdparties/${id}`, {
      name: data.nom,
      email: data.email,
      phone: data.telephone,
      address: data.adresse,
      town: data.ville,
    });
    return this.getSupplierById(id);
  }

  async deleteSupplier(id: string): Promise<void> {
    this.logger.log(`DELETE /thirdparties/${id}`);
    await this.http.delete(`/thirdparties/${id}`);
  }

  // === DEVIS / FACTURES / PAIEMENTS / ENTREPOTS / EXPEDITIONS / DOCUMENTS (in-memory) ===

  private fallbackQuotes: ErpQuote[] = [];
  private fallbackInvoices: ErpInvoice[] = [];
  private fallbackPayments: ErpPayment[] = [];
  private fallbackWarehouses: ErpWarehouse[] = [];
  private fallbackShipments: ErpShipment[] = [];
  private fallbackDocuments: ErpDocument[] = [];

  private fallbackVariants: ErpProductVariant[] = [];
  private fallbackServices: ErpService[] = [];
  private fallbackMovements: StockMovement[] = [];
  private fallbackTransfers: StockTransfer[] = [];
  private fallbackInventories: Inventory[] = [];
  private fallbackAlerts: StockAlert[] = [];
  private fallbackReturns: ErpReturn[] = [];
  private fallbackPromotions: Promotion[] = [];
  private fallbackPurchases: PurchaseOrder[] = [];
  private fallbackRegisters: ErpCashRegister[] = [];
  private fallbackExpenses: ErpExpense[] = [];
  private fallbackReservations: ErpReservation[] = [];
  private fallbackAgenda: ErpAgendaEvent[] = [];
  private fallbackProjects: ErpProject[] = [];
  private docCounter = 1000;

  // === DEVIS (Proposals - reels) ===

  async getQuotes(): Promise<ErpQuote[]> {
    this.logger.log('GET /proposals');
    const { data } = await this.http.get('/proposals', {
      params: { entity: this.config.entity, limit: 100 },
    });
    const quotes: DolibarrQuote[] = Array.isArray(data) ? data : data.proposals || [];
    this.logger.log(`${quotes.length} devis recus`);
    return quotes.map(DolibarrMapper.mapFromDolibarrQuote);
  }

  async getQuoteById(id: string): Promise<ErpQuote> {
    this.logger.log(`GET /proposals/${id}`);
    const { data } = await this.http.get(`/proposals/${id}`);
    return DolibarrMapper.mapFromDolibarrQuote(data);
  }

  async createQuote(data: { clientId: string; lines: QuoteLine[]; status?: string; validUntil?: string }): Promise<ErpQuote> {
    this.logger.log('POST /proposals');
    const body = DolibarrMapper.mapToDolibarrQuote(
      { clientId: data.clientId, validUntil: data.validUntil },
      this.config.entity,
    );
    const { data: created } = await this.http.post('/proposals', body);
    const id = String(created.id || created);
    for (const l of data.lines) {
      await this.http.post(`/proposals/${id}/line`, DolibarrMapper.mapToDolibarrQuoteLine(l));
    }
    if (data.status && data.status.toUpperCase() === 'VALIDE') {
      await this.http.post(`/proposals/${id}/validate`, { notrigger: 0 });
    }
    return this.getQuoteById(id);
  }

  async updateQuote(id: string, data: Partial<ErpQuote>): Promise<ErpQuote> {
    this.logger.log(`PUT /proposals/${id}`);
    if (data.validUntil) {
      await this.http.put(`/proposals/${id}`, { date_limite: mapToDolibarrDate(data.validUntil) });
    }
    if (data.status && data.status.toUpperCase() === 'VALIDE') {
      await this.http.post(`/proposals/${id}/validate`, { notrigger: 0 });
    }
    return this.getQuoteById(id);
  }

  async deleteQuote(id: string): Promise<void> {
    this.logger.log(`DELETE /proposals/${id}`);
    await this.http.delete(`/proposals/${id}`);
  }

  // === FACTURES (Invoices - reelles) ===

  async getInvoices(): Promise<ErpInvoice[]> {
    this.logger.log('GET /invoices');
    const { data } = await this.http.get('/invoices', {
      params: { entity: this.config.entity, limit: 100 },
    });
    const invoices: DolibarrInvoice[] = Array.isArray(data) ? data : data.invoices || [];
    this.logger.log(`${invoices.length} factures recues`);
    return invoices.map(DolibarrMapper.mapFromDolibarrInvoice);
  }

  async getInvoiceById(id: string): Promise<ErpInvoice> {
    this.logger.log(`GET /invoices/${id}`);
    const { data } = await this.http.get(`/invoices/${id}`);
    return DolibarrMapper.mapFromDolibarrInvoice(data);
  }

  async createInvoice(data: { clientId: string; lines: InvoiceLine[]; status?: string; dueDate?: string }): Promise<ErpInvoice> {
    this.logger.log('POST /invoices');
    const body = DolibarrMapper.mapToDolibarrInvoice(
      { clientId: data.clientId, dueDate: data.dueDate },
      this.config.entity,
    );
    const { data: created } = await this.http.post('/invoices', body);
    const id = String(created.id || created);
    for (const l of data.lines) {
      await this.http.post(`/invoices/${id}/lines`, DolibarrMapper.mapToDolibarrInvoiceLine(l));
    }
    if (data.status && data.status.toUpperCase() === 'VALIDE') {
      await this.http.post(`/invoices/${id}/validate`, { notrigger: 0 });
    }
    return this.getInvoiceById(id);
  }

  async updateInvoice(id: string, data: Partial<ErpInvoice>): Promise<ErpInvoice> {
    this.logger.log(`PUT /invoices/${id}`);
    if (data.dueDate) {
      await this.http.put(`/invoices/${id}`, { due_date: mapToDolibarrDate(data.dueDate) });
    }
    return this.getInvoiceById(id);
  }

  async deleteInvoice(id: string): Promise<void> {
    this.logger.log(`DELETE /invoices/${id}`);
    await this.http.delete(`/invoices/${id}`);
  }

  // === PAIEMENTS (Payments - reels, API REST en lecture seule) ===

  async getPayments(): Promise<ErpPayment[]> {
    this.logger.log('GET /paiements');
    const { data } = await this.http.get('/paiements', {
      params: { entity: this.config.entity, limit: 100 },
    });
    const payments: DolibarrPayment[] = Array.isArray(data) ? data : data.payments || [];
    this.logger.log(`${payments.length} paiements recus`);
    return payments.map(DolibarrMapper.mapFromDolibarrPayment);
  }

  async getPaymentById(id: string): Promise<ErpPayment> {
    this.logger.log(`GET /paiements/${id}`);
    const { data } = await this.http.get(`/paiements/${id}`);
    return DolibarrMapper.mapFromDolibarrPayment(data);
  }

  async createPayment(data: { invoiceId: string; amount: number; method: string; status?: string }): Promise<ErpPayment> {
    throw DolibarrError.BAD_REQUEST(
      'La creation de paiement n\'est pas exposee par l\'API REST Dolibarr 23.0.3 (no POST /payments). Creer le paiement directement dans Dolibarr.',
    );
  }

  // === ENTREPOTS (Warehouses - reels) ===

  async getWarehouses(): Promise<ErpWarehouse[]> {
    this.logger.log('GET /warehouses');
    const { data } = await this.http.get('/warehouses', {
      params: { entity: this.config.entity, limit: 100 },
    });
    const warehouses: DolibarrWarehouse[] = Array.isArray(data) ? data : data.warehouses || [];
    this.logger.log(`${warehouses.length} entrepots recus`);
    return warehouses.map(DolibarrMapper.mapFromDolibarrWarehouse);
  }

  async getWarehouseById(id: string): Promise<ErpWarehouse> {
    this.logger.log(`GET /warehouses/${id}`);
    const { data } = await this.http.get(`/warehouses/${id}`);
    return DolibarrMapper.mapFromDolibarrWarehouse(data);
  }

  async createWarehouse(data: Omit<ErpWarehouse, 'id' | 'ref'>): Promise<ErpWarehouse> {
    this.logger.log('POST /warehouses');
    const body = DolibarrMapper.mapToDolibarrWarehouse(data, this.config.entity);
    const { data: created } = await this.http.post('/warehouses', body);
    return this.getWarehouseById(String(created.id || created));
  }

  async updateWarehouse(id: string, data: Partial<ErpWarehouse>): Promise<ErpWarehouse> {
    this.logger.log(`PUT /warehouses/${id}`);
    await this.http.put(`/warehouses/${id}`, {
      label: data.nom,
      description: data.adresse,
      address: data.adresse,
      town: data.ville,
    });
    return this.getWarehouseById(id);
  }

  async deleteWarehouse(id: string): Promise<void> {
    this.logger.log(`DELETE /warehouses/${id}`);
    await this.http.delete(`/warehouses/${id}`);
  }

  // === EXPEDITIONS (Shipments - reelles) ===

  async getShipments(): Promise<ErpShipment[]> {
    this.logger.log('GET /shipments');
    const { data } = await this.http.get('/shipments', {
      params: { entity: this.config.entity, limit: 100 },
    });
    const shipments: DolibarrShipment[] = Array.isArray(data) ? data : data.shipments || [];
    this.logger.log(`${shipments.length} expeditions recues`);
    return shipments.map(DolibarrMapper.mapFromDolibarrShipment);
  }

  async getShipmentById(id: string): Promise<ErpShipment> {
    this.logger.log(`GET /shipments/${id}`);
    const { data } = await this.http.get(`/shipments/${id}`);
    return DolibarrMapper.mapFromDolibarrShipment(data);
  }

  async createShipment(data: { orderId: string; carrier: string; status?: string; trackingNumber?: string }): Promise<ErpShipment> {
    this.logger.log('POST /shipments');
    const body = DolibarrMapper.mapToDolibarrShipment(
      { orderId: data.orderId, trackingNumber: data.trackingNumber },
      this.config.entity,
    );
    const { data: created } = await this.http.post('/shipments', body);
    return this.getShipmentById(String(created.id || created));
  }

  async updateShipment(id: string, data: Partial<ErpShipment>): Promise<ErpShipment> {
    this.logger.log(`PUT /shipments/${id}`);
    await this.http.put(`/shipments/${id}`, {
      ref_int: data.orderId,
      tracking_number: data.trackingNumber,
    });
    return this.getShipmentById(id);
  }

  // === DOCUMENTS (fichiers reels Dolibarr, agregation par objet) ===

  private documentsCache: { at: number; data: ErpDocument[] } | null = null;

  async getDocuments(): Promise<ErpDocument[]> {
    if (this.documentsCache && Date.now() - this.documentsCache.at < 60000) {
      return this.documentsCache.data;
    }
    this.logger.log('GET /documents (agregation des fichiers lies)');
    const docs: ErpDocument[] = [];
    const sources: { part: string; getter: () => Promise<{ id: string; ref: string }[]> }[] = [
      { part: 'invoice', getter: async () => (await this.getInvoices()).map((x) => ({ id: x.id, ref: x.ref })) },
      { part: 'proposal', getter: async () => (await this.getQuotes()).map((x) => ({ id: x.id, ref: x.ref })) },
      { part: 'commande', getter: async () => (await this.getOrders()).map((x) => ({ id: x.id, ref: x.ref })) },
      { part: 'thirdparty', getter: async () => (await this.getClients()).map((x) => ({ id: x.id, ref: x.nom })) },
      { part: 'product', getter: async () => (await this.getProducts()).map((x) => ({ id: x.id, ref: x.ref })) },
    ];
    for (const src of sources) {
      let items: { id: string; ref: string }[] = [];
      try {
        items = await src.getter();
      } catch {
        items = [];
      }
      for (const item of items.slice(0, 10)) {
        try {
          const { data } = await this.http.get('/documents', {
            params: { modulepart: src.part, ref: item.ref, limit: 50 },
          });
          const files: DolibarrDocument[] = Array.isArray(data) ? data : [];
          for (const f of files) {
            if (f.type !== 'file') continue;
            docs.push(DolibarrMapper.mapFromDolibarrDocument({ ...f, id: undefined }, src.part));
          }
        } catch {
          // aucun document pour cet objet -> on ignore
        }
      }
    }
    this.documentsCache = { at: Date.now(), data: docs };
    this.logger.log(`${docs.length} documents recus`);
    return docs;
  }

  async getDocumentById(id: string): Promise<ErpDocument> {
    const docs = await this.getDocuments();
    const d = docs.find((x) => x.id === id);
    if (!d) throw DolibarrError.NOT_FOUND(`Document "${id}" non trouve`);
    return { ...d };
  }

  async createDocument(data: { type: string; title: string; relatedTo?: string; size?: number }): Promise<ErpDocument> {
    this.logger.log('POST /documents/upload');
    const modulepart = String(data.type || 'invoice')
      .toLowerCase()
      .replace(/^d?evis?$/, 'proposal')
      .replace(/^facture?$/, 'invoice')
      .replace(/^commande$/, 'commande')
      .replace(/^client$/, 'thirdparty')
      .replace(/^produit$/, 'product');
    if (!data.relatedTo) {
      throw DolibarrError.BAD_REQUEST('Un document doit etre lie a une reference existante (relatedTo).');
    }
    const filecontent = Buffer.from(`Document "${data.title}" cree depuis la plateforme ERP Adapter`).toString('base64');
    await this.http.post('documents/upload', null, {
      params: {
        modulepart,
        ref: data.relatedTo,
        filename: `${data.title.trim().replace(/[^A-Za-z0-9_-]/g, '_')}.txt`,
        filecontent,
        overwriteifexists: 0,
      },
    });
    this.documentsCache = null;
    const created = await this.getDocuments();
    const last = created[created.length - 1] || {
      id: `doc-${Date.now()}`,
      ref: `${modulepart} ${data.relatedTo}`,
      type: modulepart,
      title: data.title,
      size: filecontent.length,
      createdAt: new Date().toISOString(),
    };
    return { ...last };
  }

  async deleteDocument(id: string): Promise<void> {
    const docs = await this.getDocuments();
    const d = docs.find((x) => x.id === id);
    if (!d) throw DolibarrError.NOT_FOUND(`Document "${id}" non trouve`);
    const modulepart = String(d.type).toLowerCase();
    await this.http.delete('/documents', {
      params: { modulepart, original_file: d.ref },
    });
    this.documentsCache = null;
  }

  // === VARIANTS / SERVICES / STOCK / RETOURS / PROMOTIONS / ACHATS / CAISSE / DEPENSES / RESERVATIONS / AGENDA / PROJETS (degraded in-memory) ===

  async getProductVariants(): Promise<ErpProductVariant[]> {
    this.logger.log('GET /products/attributes (variants)');
    try {
      const { data } = await this.http.get('/products/attributes', {
        params: { entity: this.config.entity, limit: 100 },
      });
      const variants: DolibarrVariant[] = Array.isArray(data) ? data : data.attributes || [];
      return variants.map(DolibarrMapper.mapFromDolibarrVariant);
    } catch {
      return [...this.fallbackVariants];
    }
  }
  async getProductVariantsByProduct(productId: string): Promise<ErpProductVariant[]> {
    return this.fallbackVariants.filter((v) => v.productId === productId).map((v) => ({ ...v }));
  }
  async createProductVariant(data: {
    productId: string; ref?: string; attribute: string; value: string;
    price?: number; stock?: number; barcode?: string;
  }): Promise<ErpProductVariant> {
    const v: ErpProductVariant = { ...data, id: `var-${Date.now()}-${this.docCounter++}` } as ErpProductVariant;
    this.fallbackVariants.push(v);
    return { ...v };
  }
  async updateProductVariant(id: string, data: Partial<ErpProductVariant>): Promise<ErpProductVariant> {
    const i = this.fallbackVariants.findIndex((x) => x.id === id);
    if (i === -1) throw DolibarrError.NOT_FOUND(`Variante "${id}" non trouvee`);
    this.fallbackVariants[i] = { ...this.fallbackVariants[i], ...data };
    return { ...this.fallbackVariants[i] };
  }
  async deleteProductVariant(id: string): Promise<void> {
    const i = this.fallbackVariants.findIndex((x) => x.id === id);
    if (i === -1) throw DolibarrError.NOT_FOUND(`Variante "${id}" non trouvee`);
    this.fallbackVariants.splice(i, 1);
  }

  async getServices(): Promise<ErpService[]> {
    this.logger.log('GET /products (services)');
    try {
      const { data } = await this.http.get('/products', {
        params: { entity: this.config.entity, type: 'service', limit: 100 },
      });
      const services: DolibarrService[] = Array.isArray(data) ? data : data.products || [];
      return services.map(DolibarrMapper.mapFromDolibarrService);
    } catch {
      return [...this.fallbackServices];
    }
  }
  async getServiceById(id: string): Promise<ErpService> {
    this.logger.log(`GET /products/${id} (service)`);
    try {
      const { data } = await this.http.get(`/products/${id}`);
      return DolibarrMapper.mapFromDolibarrService(data);
    } catch {
      const s = this.fallbackServices.find((x) => x.id === id);
      if (!s) throw DolibarrError.NOT_FOUND(`Service "${id}" non trouve`);
      return { ...s };
    }
  }
  async createService(data: { label: string; price: number; duration?: number; description?: string }): Promise<ErpService> {
    this.logger.log('POST /products (service)');
    try {
      const dolibarrData = DolibarrMapper.mapToDolibarrService(data, this.config.entity);
      const { data: created } = await this.http.post('/products', dolibarrData);
      return DolibarrMapper.mapFromDolibarrService({ ...dolibarrData, id: created.id || created });
    } catch {
      const sv: ErpService = { ...data, id: `srv-${Date.now()}-${this.docCounter++}`, ref: `SRV-${Date.now()}` } as ErpService;
      this.fallbackServices.push(sv);
      return { ...sv };
    }
  }
  async updateService(id: string, data: Partial<ErpService>): Promise<ErpService> {
    const i = this.fallbackServices.findIndex((x) => x.id === id);
    if (i === -1) throw DolibarrError.NOT_FOUND(`Service "${id}" non trouve`);
    this.fallbackServices[i] = { ...this.fallbackServices[i], ...data };
    return { ...this.fallbackServices[i] };
  }
  async deleteService(id: string): Promise<void> {
    const i = this.fallbackServices.findIndex((x) => x.id === id);
    if (i === -1) throw DolibarrError.NOT_FOUND(`Service "${id}" non trouve`);
    this.fallbackServices.splice(i, 1);
  }

  async getStockMovements(): Promise<StockMovement[]> {
    this.logger.log('GET /stockmovements');
    try {
      const { data } = await this.http.get('/stockmovements', {
        params: { entity: this.config.entity, limit: 100 },
      });
      const movements: DolibarrStockMovement[] = Array.isArray(data) ? data : data.movements || [];
      return movements.map(DolibarrMapper.mapFromDolibarrStockMovement);
    } catch {
      return [...this.fallbackMovements];
    }
  }
  async createStockMovement(data: {
    productId: string; type: StockMovement['type']; quantity: number; reason: string;
  }): Promise<StockMovement> {
    this.logger.log('POST /stockmovements');
    // type Dolibarr: 0=input (transfert), 1=output (transfert), 2=output, 3=input
    const isSortie = data.type === 'SORTIE' || data.type === 'TRANSFERT';
    const dolibarrData = {
      product_id: Number(data.productId),
      warehouse_id: 1,
      qty: isSortie ? -Math.abs(data.quantity) : Math.abs(data.quantity),
      type: isSortie ? 2 : 3,
      movementcode: `ERP-${Date.now()}`,
      label: data.reason,
      entity: this.config.entity,
    };
    const { data: created } = await this.http.post('/stockmovements', dolibarrData);
    return DolibarrMapper.mapFromDolibarrStockMovement({
      id: created.id || created,
      fk_product: Number(data.productId),
      type: isSortie ? '>' : '<',
      qty: Math.abs(data.quantity),
      label: data.reason,
      date: new Date().toISOString(),
    } as DolibarrStockMovement);
  }

  async getStockTransfers(): Promise<StockTransfer[]> {
    this.logger.log('GET /stock/transferts (transferts)');
    try {
      const { data } = await this.http.get('/stock/transferts', {
        params: { entity: this.config.entity, limit: 100 },
      });
      const transfers: DolibarrStockTransfer[] = Array.isArray(data) ? data : data.transferts || [];
      return transfers.map(DolibarrMapper.mapFromDolibarrStockTransfer);
    } catch {
      return [...this.fallbackTransfers];
    }
  }
  async createStockTransfer(data: {
    productId: string; quantity: number; fromWarehouseId: string; toWarehouseId: string;
  }): Promise<StockTransfer> {
    this.logger.log('POST /stock/transferts (transfert)');
    try {
      const dolibarrData = DolibarrMapper.mapToDolibarrStockTransfer(data, this.config.entity);
      const { data: created } = await this.http.post('/stock/transferts', dolibarrData);
      return DolibarrMapper.mapFromDolibarrStockTransfer({ ...dolibarrData, id: created.id || created });
    } catch {
      const t: StockTransfer = {
        ...data, id: `tr-${Date.now()}-${this.docCounter++}`,
        ref: `TRF-${Date.now()}`, status: 'EN_TRANSIT', date: new Date().toISOString(),
      };
      this.fallbackTransfers.push(t);
      return { ...t };
    }
  }
  async updateStockTransfer(id: string, data: Partial<StockTransfer>): Promise<StockTransfer> {
    const i = this.fallbackTransfers.findIndex((x) => x.id === id);
    if (i === -1) throw DolibarrError.NOT_FOUND(`Transfert "${id}" non trouve`);
    this.fallbackTransfers[i] = { ...this.fallbackTransfers[i], ...data };
    return { ...this.fallbackTransfers[i] };
  }

  async getInventories(): Promise<Inventory[]> {
    this.logger.log('GET /inventories (inventaires)');
    try {
      const { data } = await this.http.get('/inventories', {
        params: { entity: this.config.entity, limit: 100 },
      });
      const inventories: DolibarrInventory[] = Array.isArray(data) ? data : data.inventories || [];
      return inventories.map(DolibarrMapper.mapFromDolibarrInventory);
    } catch {
      return [...this.fallbackInventories];
    }
  }
  async getInventoryById(id: string): Promise<Inventory> {
    this.logger.log(`GET /inventories/${id}`);
    try {
      const { data } = await this.http.get(`/inventories/${id}`);
      return DolibarrMapper.mapFromDolibarrInventory(data);
    } catch {
      const inv = this.fallbackInventories.find((x) => x.id === id);
      if (!inv) throw DolibarrError.NOT_FOUND(`Inventaire "${id}" non trouve`);
      return { ...inv };
    }
  }
  async createInventory(data: { label: string; type: Inventory['type'] }): Promise<Inventory> {
    this.logger.log('POST /inventories');
    try {
      const dolibarrData = DolibarrMapper.mapToDolibarrInventory(data, this.config.entity);
      const { data: created } = await this.http.post('/inventories', dolibarrData);
      return DolibarrMapper.mapFromDolibarrInventory({ ...dolibarrData, id: created.id || created });
    } catch {
      const inv: Inventory = {
        ...data, id: `inv-${Date.now()}-${this.docCounter++}`,
        ref: `INV-${Date.now()}`, status: 'EN_COURS', items: [], date: new Date().toISOString(),
      };
      this.fallbackInventories.push(inv);
      return { ...inv };
    }
  }
  async updateInventory(id: string, data: Partial<Inventory>): Promise<Inventory> {
    const i = this.fallbackInventories.findIndex((x) => x.id === id);
    if (i === -1) throw DolibarrError.NOT_FOUND(`Inventaire "${id}" non trouve`);
    this.fallbackInventories[i] = { ...this.fallbackInventories[i], ...data };
    return { ...this.fallbackInventories[i] };
  }

  async getStockAlerts(): Promise<StockAlert[]> { return [...this.fallbackAlerts]; }
  async createStockAlert(data: { productId: string; level: StockAlert['level']; current: number; threshold: number }): Promise<StockAlert> {
    const a: StockAlert = {
      ...data, id: `alert-${Date.now()}-${this.docCounter++}`, date: new Date().toISOString(),
    };
    this.fallbackAlerts.push(a);
    return { ...a };
  }

  async getReturns(): Promise<ErpReturn[]> {
    this.logger.log('GET /powererp/returns (retours)');
    try {
      const { data } = await this.http.get('/powererp/returns', {
        params: { entity: this.config.entity, limit: 100 },
      });
      const returns: DolibarrReturn[] = Array.isArray(data) ? data : data.returns || [];
      return returns.map((r) => DolibarrMapper.mapFromDolibarrReturn(r));
    } catch {
      return [...this.fallbackReturns];
    }
  }
  async getReturnById(id: string): Promise<ErpReturn> {
    this.logger.log(`GET /returns/${id}`);
    try {
      const { data } = await this.http.get(`/returns/${id}`);
      return DolibarrMapper.mapFromDolibarrReturn(data);
    } catch {
      const r = this.fallbackReturns.find((x) => x.id === id);
      if (!r) throw DolibarrError.NOT_FOUND(`Retour "${id}" non trouve`);
      return { ...r };
    }
  }
  async createReturn(data: { orderId: string; clientId: string; reason: string; type: ErpReturn['type']; lines: ErpReturn['lines'] }): Promise<ErpReturn> {
    this.logger.log('POST /powererp/returns (retour)');
    try {
      const dolibarrData = DolibarrMapper.mapToDolibarrReturn(data, this.config.entity);
      const { data: created } = await this.http.post('/powererp/returns', dolibarrData);
      return DolibarrMapper.mapFromDolibarrReturn({ ...dolibarrData, id: created.id || created }, data.lines);
    } catch {
      const r: ErpReturn = {
        ...data, id: `return-${Date.now()}-${this.docCounter++}`,
        ref: `RET-${Date.now()}`, status: 'EN_COURS', createdAt: new Date().toISOString(),
      };
      this.fallbackReturns.push(r);
      return { ...r };
    }
  }
  async updateReturn(id: string, data: Partial<ErpReturn>): Promise<ErpReturn> {
    const i = this.fallbackReturns.findIndex((x) => x.id === id);
    if (i === -1) throw DolibarrError.NOT_FOUND(`Retour "${id}" non trouve`);
    this.fallbackReturns[i] = { ...this.fallbackReturns[i], ...data };
    return { ...this.fallbackReturns[i] };
  }

  async getPromotions(): Promise<Promotion[]> {
    this.logger.log('GET /promotions');
    try {
      const { data } = await this.http.get('/promotions', {
        params: { entity: this.config.entity, limit: 100 },
      });
      const promos: DolibarrPromotion[] = Array.isArray(data) ? data : data.promotions || [];
      return promos.map(DolibarrMapper.mapFromDolibarrPromotion);
    } catch {
      return [...this.fallbackPromotions];
    }
  }
  async getPromotionById(id: string): Promise<Promotion> {
    this.logger.log(`GET /promotions/${id}`);
    try {
      const { data } = await this.http.get(`/promotions/${id}`);
      return DolibarrMapper.mapFromDolibarrPromotion(data);
    } catch {
      const p = this.fallbackPromotions.find((x) => x.id === id);
      if (!p) throw DolibarrError.NOT_FOUND(`Promotion "${id}" non trouvee`);
      return { ...p };
    }
  }
  async createPromotion(data: { label: string; type: Promotion['type']; value: number; appliesTo: string; startDate: string; endDate: string }): Promise<Promotion> {
    this.logger.log('POST /promotions');
    try {
      const dolibarrData = DolibarrMapper.mapToDolibarrPromotion(data, this.config.entity);
      const { data: created } = await this.http.post('/promotions', dolibarrData);
      return DolibarrMapper.mapFromDolibarrPromotion({ ...dolibarrData, id: created.id || created });
    } catch {
      const p: Promotion = {
        ...data, id: `promo-${Date.now()}-${this.docCounter++}`,
        ref: `PROM-${Date.now()}`, status: 'ACTIVE',
      };
      this.fallbackPromotions.push(p);
      return { ...p };
    }
  }
  async updatePromotion(id: string, data: Partial<Promotion>): Promise<Promotion> {
    const i = this.fallbackPromotions.findIndex((x) => x.id === id);
    if (i === -1) throw DolibarrError.NOT_FOUND(`Promotion "${id}" non trouvee`);
    this.fallbackPromotions[i] = { ...this.fallbackPromotions[i], ...data };
    return { ...this.fallbackPromotions[i] };
  }
  async deletePromotion(id: string): Promise<void> {
    const i = this.fallbackPromotions.findIndex((x) => x.id === id);
    if (i === -1) throw DolibarrError.NOT_FOUND(`Promotion "${id}" non trouvee`);
    this.fallbackPromotions.splice(i, 1);
  }

  async getPurchaseOrders(): Promise<PurchaseOrder[]> {
    this.logger.log('GET /supplierorders (achats)');
    try {
      const { data } = await this.http.get('/supplierorders', {
        params: { entity: this.config.entity, limit: 100 },
      });
      const orders: DolibarrPurchaseOrder[] = Array.isArray(data) ? data : data.orders || [];
      return orders.map(DolibarrMapper.mapFromDolibarrPurchaseOrder);
    } catch {
      return [...this.fallbackPurchases];
    }
  }
  async getPurchaseOrderById(id: string): Promise<PurchaseOrder> {
    this.logger.log(`GET /supplierorders/${id}`);
    try {
      const { data } = await this.http.get(`/supplierorders/${id}`);
      return DolibarrMapper.mapFromDolibarrPurchaseOrder(data);
    } catch {
      const po = this.fallbackPurchases.find((x) => x.id === id);
      if (!po) throw DolibarrError.NOT_FOUND(`Achat "${id}" non trouve`);
      return { ...po };
    }
  }
  async createPurchaseOrder(data: { supplierId: string; lines: PurchaseOrderLine[] }): Promise<PurchaseOrder> {
    this.logger.log('POST /supplierorders (achat)');
    try {
      const { data: created } = await this.http.post('/supplierorders', {
        socid: Number(data.supplierId),
        date: mapToDolibarrDate(new Date().toISOString()),
        status: 1,
        entity: this.config.entity,
      });
      const id = String(created.id || created);
      for (const l of data.lines) {
        await this.http.post(`/supplierorders/${id}/lines`, {
          fk_product: Number(l.productId),
          qty: l.quantity,
          subprice: l.price || 0,
        });
      }
      return this.getPurchaseOrderById(id);
    } catch {
      const total = data.lines.reduce((s, l) => s + l.price * l.quantity, 0);
      const po: PurchaseOrder = {
        ...data, id: `po-${Date.now()}-${this.docCounter++}`,
        ref: `ACH-${Date.now()}`, total, status: 'EN_ATTENTE', createdAt: new Date().toISOString(),
      };
      this.fallbackPurchases.push(po);
      return { ...po };
    }
  }
  async updatePurchaseOrder(id: string, data: Partial<PurchaseOrder>): Promise<PurchaseOrder> {
    const i = this.fallbackPurchases.findIndex((x) => x.id === id);
    if (i === -1) throw DolibarrError.NOT_FOUND(`Achat "${id}" non trouve`);
    this.fallbackPurchases[i] = { ...this.fallbackPurchases[i], ...data };
    return { ...this.fallbackPurchases[i] };
  }

  async getCashRegisters(): Promise<ErpCashRegister[]> {
    this.logger.log('GET /pos/registers (caisses)');
    try {
      const { data } = await this.http.get('/pos/registers', { params: { entity: this.config.entity, limit: 100 } });
      const registers: DolibarrCashRegister[] = Array.isArray(data) ? data : data.registers || [];
      return registers.map(DolibarrMapper.mapFromDolibarrCashRegister);
    } catch {
      return [...this.fallbackRegisters];
    }
  }
  async getCashRegisterById(id: string): Promise<ErpCashRegister> {
    this.logger.log(`GET /pos/registers/${id}`);
    try {
      const { data } = await this.http.get(`/pos/registers/${id}`);
      return DolibarrMapper.mapFromDolibarrCashRegister(data);
    } catch {
      const r = this.fallbackRegisters.find((x) => x.id === id);
      if (!r) throw DolibarrError.NOT_FOUND(`Caisse "${id}" non trouvee`);
      return { ...r };
    }
  }
  async createCashRegister(data: { label: string; openingCash: number }): Promise<ErpCashRegister> {
    this.logger.log('POST /pos/registers (caisse)');
    try {
      const body = { ...DolibarrMapper.mapToDolibarrCashRegister(data, this.config.entity), status: 1 };
      const { data: created } = await this.http.post('/pos/registers', body);
      return DolibarrMapper.mapFromDolibarrCashRegister({ ...body, id: created.id || created });
    } catch {
      const r: ErpCashRegister = {
        ...data, id: `reg-${Date.now()}-${this.docCounter++}`,
        ref: `CAISSE-${Date.now()}`, status: 'OUVERT', openedAt: new Date().toISOString(),
      };
      this.fallbackRegisters.push(r);
      return { ...r };
    }
  }
  async updateCashRegister(id: string, data: Partial<ErpCashRegister>): Promise<ErpCashRegister> {
    const i = this.fallbackRegisters.findIndex((x) => x.id === id);
    if (i === -1) throw DolibarrError.NOT_FOUND(`Caisse "${id}" non trouvee`);
    this.fallbackRegisters[i] = { ...this.fallbackRegisters[i], ...data };
    return { ...this.fallbackRegisters[i] };
  }

  async getExpenses(): Promise<ErpExpense[]> { return [...this.fallbackExpenses]; }
  async getExpenseById(id: string): Promise<ErpExpense> {
    const e = this.fallbackExpenses.find((x) => x.id === id);
    if (!e) throw DolibarrError.NOT_FOUND(`Depense "${id}" non trouvee`);
    return { ...e };
  }
  async createExpense(data: { label: string; amount: number; category: string; supplierId?: string }): Promise<ErpExpense> {
    const e: ErpExpense = {
      ...data, id: `exp-${Date.now()}-${this.docCounter++}`,
      ref: `DEP-${Date.now()}`, date: new Date().toISOString(),
    };
    this.fallbackExpenses.push(e);
    return { ...e };
  }
  async deleteExpense(id: string): Promise<void> {
    const i = this.fallbackExpenses.findIndex((x) => x.id === id);
    if (i === -1) throw DolibarrError.NOT_FOUND(`Depense "${id}" non trouvee`);
    this.fallbackExpenses.splice(i, 1);
  }

  async getReservations(): Promise<ErpReservation[]> { return [...this.fallbackReservations]; }
  async getReservationById(id: string): Promise<ErpReservation> {
    const r = this.fallbackReservations.find((x) => x.id === id);
    if (!r) throw DolibarrError.NOT_FOUND(`Reservation "${id}" non trouvee`);
    return { ...r };
  }
  async createReservation(data: { clientId: string; productIds?: string[]; startAt: string; endAt: string }): Promise<ErpReservation> {
    const r: ErpReservation = {
      ...data, productIds: data.productIds || [], id: `reso-${Date.now()}-${this.docCounter++}`,
      ref: `RES-${Date.now()}`, status: 'EN_ATTENTE',
    };
    this.fallbackReservations.push(r);
    return { ...r };
  }
  async updateReservation(id: string, data: Partial<ErpReservation>): Promise<ErpReservation> {
    const i = this.fallbackReservations.findIndex((x) => x.id === id);
    if (i === -1) throw DolibarrError.NOT_FOUND(`Reservation "${id}" non trouvee`);
    this.fallbackReservations[i] = { ...this.fallbackReservations[i], ...data };
    return { ...this.fallbackReservations[i] };
  }

  async getAgenda(): Promise<ErpAgendaEvent[]> {
    this.logger.log('GET /agendaevents');
    try {
      const { data } = await this.http.get('/agendaevents', {
        params: { entity: this.config.entity, limit: 100 },
      });
      const events: DolibarrAgendaEvent[] = Array.isArray(data) ? data : data.events || [];
      return events.map(DolibarrMapper.mapFromDolibarrAgendaEvent);
    } catch {
      return [...this.fallbackAgenda];
    }
  }
  async createAgendaEvent(data: { title: string; startAt: string; endAt: string; type: string; relatedTo?: string }): Promise<ErpAgendaEvent> {
    this.logger.log('POST /agendaevents');
    try {
      const body = DolibarrMapper.mapToDolibarrAgendaEvent(data, this.config.entity);
      const { data: created } = await this.http.post('/agendaevents', body);
      return DolibarrMapper.mapFromDolibarrAgendaEvent({ ...body, id: created.id || created });
    } catch {
      const ev: ErpAgendaEvent = { ...data, id: `ev-${Date.now()}-${this.docCounter++}` };
      this.fallbackAgenda.push(ev);
      return { ...ev };
    }
  }

  async updateAgendaEvent(id: string, data: Partial<{ title: string; startAt: string; endAt: string; type: string; relatedTo?: string }>): Promise<ErpAgendaEvent> {
    this.logger.log(`PUT /agendaevents/${id}`);
    try {
      const body: Partial<DolibarrAgendaEvent> = {};
      if (data.title !== undefined) body.label = data.title;
      if (data.startAt !== undefined) body.datep = mapToDolibarrDate(data.startAt);
      if (data.endAt !== undefined) body.datef = mapToDolibarrDate(data.endAt);
      if (data.type !== undefined) body.type_code = data.type;
      await this.http.put(`/agendaevents/${id}`, body);
      return this.getAgendaEventById(id);
    } catch {
      const i = this.fallbackAgenda.findIndex((x) => x.id === id);
      if (i === -1) throw DolibarrError.NOT_FOUND(`Evenement d agenda "${id}" non trouve`);
      this.fallbackAgenda[i] = { ...this.fallbackAgenda[i], ...data } as ErpAgendaEvent;
      return { ...this.fallbackAgenda[i] };
    }
  }

  async deleteAgendaEvent(id: string): Promise<void> {
    this.logger.log(`DELETE /agendaevents/${id}`);
    try {
      await this.http.delete(`/agendaevents/${id}`);
    } catch {
      const i = this.fallbackAgenda.findIndex((x) => x.id === id);
      if (i === -1) throw DolibarrError.NOT_FOUND(`Evenement d agenda "${id}" non trouve`);
      this.fallbackAgenda.splice(i, 1);
    }
  }

  private async getAgendaEventById(id: string): Promise<ErpAgendaEvent> {
    try {
      const { data } = await this.http.get(`/agendaevents/${id}`);
      return DolibarrMapper.mapFromDolibarrAgendaEvent(data);
    } catch {
      const ev = this.fallbackAgenda.find((x) => x.id === id);
      if (!ev) throw DolibarrError.NOT_FOUND(`Evenement d agenda "${id}" non trouve`);
      return { ...ev };
    }
  }

  async getProjects(): Promise<ErpProject[]> {
    this.logger.log('GET /projects');
    try {
      const { data } = await this.http.get('/projects', {
        params: { entity: this.config.entity, limit: 100 },
      });
      const projects: DolibarrProject[] = Array.isArray(data) ? data : data.projects || [];
      return projects.map(DolibarrMapper.mapFromDolibarrProject);
    } catch {
      return [...this.fallbackProjects];
    }
  }
  async getProjectById(id: string): Promise<ErpProject> {
    this.logger.log(`GET /projects/${id}`);
    try {
      const { data } = await this.http.get(`/projects/${id}`);
      return DolibarrMapper.mapFromDolibarrProject(data);
    } catch {
      const p = this.fallbackProjects.find((x) => x.id === id);
      if (!p) throw DolibarrError.NOT_FOUND(`Projet "${id}" non trouve`);
      return { ...p };
    }
  }
  async createProject(data: { label: string; clientId?: string; status?: string; startDate?: string }): Promise<ErpProject> {
    this.logger.log('POST /projects');
    try {
      const body = DolibarrMapper.mapToDolibarrProject(data, this.config.entity);
      const { data: created } = await this.http.post('/projects', body);
      return this.getProjectById(String(created.id || created));
    } catch {
      const p: ErpProject = {
        ...data, id: `proj-${Date.now()}-${this.docCounter++}`,
        ref: `PROJ-${Date.now()}`, status: data.status || 'EN_COURS',
        startDate: data.startDate || new Date().toISOString().slice(0, 10),
      };
      this.fallbackProjects.push(p);
      return { ...p };
    }
  }
  async updateProject(id: string, data: Partial<ErpProject>): Promise<ErpProject> {
    this.logger.log(`PUT /projects/${id}`);
    try {
      const body: Record<string, any> = {};
      if (data.label) body.title = data.label;
      if (data.startDate) body.date_start = mapToDolibarrDate(data.startDate);
      if (data.status) body.fk_statut = data.status === 'TERMINE' ? 2 : 1;
      await this.http.put(`/projects/${id}`, body);
      return this.getProjectById(id);
    } catch {
      const i = this.fallbackProjects.findIndex((x) => x.id === id);
      if (i === -1) throw DolibarrError.NOT_FOUND(`Projet "${id}" non trouve`);
      this.fallbackProjects[i] = { ...this.fallbackProjects[i], ...data };
      return { ...this.fallbackProjects[i] };
    }
  }

  // === STATISTIQUES (degraded) ===

  async getStats(): Promise<ErpStats> {
    const empty = <T>(): Promise<T[]> => Promise.resolve([]);
    const [products, clients, orders, suppliers, quotes, invoices, payments, warehouses, shipments, purchases] =
      await Promise.all([
        this.getProducts().catch(empty<ErpProduct>),
        this.getClients().catch(empty<ErpClient>),
        this.getOrders().catch(empty<ErpOrder>),
        this.getSuppliers().catch(empty<ErpSupplier>),
        this.getQuotes().catch(empty<ErpQuote>),
        this.getInvoices().catch(empty<ErpInvoice>),
        this.getPayments().catch(empty<ErpPayment>),
        this.getWarehouses().catch(empty<ErpWarehouse>),
        this.getShipments().catch(empty<ErpShipment>),
        this.getPurchaseOrders().catch(empty<PurchaseOrder>),
      ]);
    const stockTotal = products.reduce((s, p) => s + (p.stock || 0), 0);
    const valeurStock = products.reduce((s, p) => s + (p.stock || 0) * (p.price || 0), 0);
    const totalVentes = orders.reduce((s, o) => s + (o.total || 0), 0);
    const totalFacture = invoices.reduce((s, i) => s + (i.total || 0), 0);
    const totalPaye = invoices.filter((i) => Number(i.paid) === 1).reduce((s, i) => s + (i.total || 0), 0);
    const totalRecu = payments.reduce((s, p) => s + (p.amount || 0), 0);
    const enLivraison = shipments.filter((s) => s.status === 'EXPEDIEE' || s.status === 'PREPARATION').length;
    return {
      clients: { total: clients.length, actifs: clients.length },
      products: { total: products.length, stockTotal, valeurStock },
      orders: { total: orders.length, enCours: orders.filter((o) => o.status === 'VALIDATED' || o.status === 'PROCESSING').length, totalVentes },
      suppliers: { total: suppliers.length },
      quotes: { total: quotes.length, enAttente: quotes.filter((q) => q.status === 'BROUILLON' || q.status === 'EN_ATTENTE').length },
      invoices: { total: invoices.length, totalFacture, totalPaye, enRetard: 0 },
      payments: { total: payments.length, totalRecu },
      warehouses: { total: warehouses.length },
      shipments: { total: shipments.length, enLivraison },
      variants: { total: this.fallbackVariants.length },
      services: { total: (await this.getServices().catch(() => [])).length },
      movements: { total: (await this.getStockMovements().catch(() => [])).length },
      transfers: { total: this.fallbackTransfers.length },
      inventory: { total: this.fallbackInventories.length },
      alerts: { total: this.fallbackAlerts.length, actives: this.fallbackAlerts.filter((a) => a.level === 'CRITICAL').length },
      returns: { total: this.fallbackReturns.length },
      promotions: { total: this.fallbackPromotions.length, actives: this.fallbackPromotions.filter((p) => p.status === 'ACTIVE').length },
      purchases: { total: purchases.length, enAttente: purchases.filter((p) => p.status === 'EN_ATTENTE').length },
      registers: { total: this.fallbackRegisters.length, ouverts: this.fallbackRegisters.filter((r) => r.status === 'OUVERT').length },
      expenses: { total: this.fallbackExpenses.length, totalDepenses: this.fallbackExpenses.reduce((s, e) => s + e.amount, 0) },
      reservations: { total: this.fallbackReservations.length, actives: this.fallbackReservations.filter((r) => r.status !== 'ANNULEE').length },
      agenda: { total: (await this.getAgenda().catch(() => [])).length },
      projects: { total: (await this.getProjects().catch(() => [])).length },
    };
  }

  // === UTILISATEURS (Users) ===

  async getUsers(): Promise<ErpUser[]> {
    this.logger.log('GET /users');
    const { data } = await this.http.get('/users', {
      params: { entity: this.config.entity, limit: 100 },
    });
    const users: DolibarrUser[] = Array.isArray(data) ? data : data.users || [];
    this.logger.log(`${users.length} utilisateurs recus`);
    return users.map((u) => ({
      id: String(u.id),
      login: u.login || '',
      name: u.lastname || '',
      firstname: u.firstname || '',
      email: u.email || '',
      admin: Number(u.admin) === 1 || u.admin === true,
      active: u.statut === 1,
      lastLogin: DolibarrMapper.mapDolibarrDate(u.datelastlogin),
    }));
  }

  async getUserById(id: string): Promise<ErpUser | undefined> {
    this.logger.log(`GET /users/${id}`);
    const { data } = await this.http.get(`/users/${id}`);
    return {
      id: String(data.id),
      login: data.login || '',
      name: data.lastname || '',
      firstname: data.firstname || '',
      email: data.email || '',
      admin: Number(data.admin) === 1 || data.admin === true,
      active: data.statut === 1,
      lastLogin: DolibarrMapper.mapDolibarrDate(data.datelastlogin),
    };
  }

  async getCurrentUser(): Promise<ErpUser | undefined> {
    this.logger.log('GET /users/info (utilisateur courant)');
    const { data } = await this.http.get('/users/info');
    return {
      id: String(data.id),
      login: data.login || '',
      name: data.lastname || '',
      firstname: data.firstname || '',
      email: data.email || '',
      admin: Number(data.admin) === 1 || data.admin === true,
      active: data.statut === 1,
      lastLogin: DolibarrMapper.mapDolibarrDate(data.datelastlogin),
    };
  }

  // === GESTION DES ERREURS ===

  private handleError(error: AxiosError): DolibarrError {
    if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
      return DolibarrError.TIMEOUT();
    }
    if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
      return DolibarrError.CONNECTION_ERROR();
    }
    if (error.response) {
      return DolibarrMapper.mapDolibarrError(error.response.status, error.response.data);
    }
    return DolibarrError.CONNECTION_ERROR(error.message);
  }
}
