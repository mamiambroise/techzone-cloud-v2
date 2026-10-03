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
import { ErpError } from '../erp-error';
import { validateDolibarrUrl, dolibarrAgents } from './dolibarr-destination';
import { integrationRequestContext } from '../../common/integration-request-context';
import { DolibarrClient, DolibarrProduct, DolibarrOrder, DolibarrUser, DolibarrVariant, DolibarrService, DolibarrStockMovement, DolibarrStockTransfer, DolibarrInventory, DolibarrStockAlert, DolibarrReturn, DolibarrPromotion, DolibarrPurchaseOrder, DolibarrCashRegister, DolibarrExpense, DolibarrReservation, DolibarrAgendaEvent, DolibarrProject, DolibarrQuote, DolibarrInvoice, DolibarrPayment, DolibarrWarehouse, DolibarrShipment, DolibarrDocument } from './dolibarr.dto';

@Injectable()
export class DolibarrAdapter implements IErpAdapter {
  private readonly logger = new Logger(DolibarrAdapter.name);
  private http: AxiosInstance;
  private config: DolibarrConfig;

  constructor() {
    this.config = { ...DEFAULT_DOLIBARR_CONFIG, baseUrl: '', apiKey: '' };
    this.http = this.createHttpClient();
    this.logger.log('DolibarrAdapter configure');
  }

  private createHttpClient(): AxiosInstance {
    const url = this.config.baseUrl ? validateDolibarrUrl(this.config.baseUrl) : null;
    const base = this.config.baseUrl.replace(/\/+$/, '').replace(/\/api\/index\.php$/, '');
    const http = axios.create({
      maxRedirects: 0, maxContentLength: 5 * 1024 * 1024, maxBodyLength: 5 * 1024 * 1024,
      proxy: false,
      ...(url ? dolibarrAgents(url) : {}),
      baseURL: `${base}/api/index.php`,
      timeout: this.config.timeout,
      headers: {
        DOLAPIKEY: this.config.apiKey,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
    });

    http.interceptors.request.use((request) => {
      if (!this.config.baseUrl || !this.config.apiKey) throw ErpError.notConfigured();
      if (/^[a-z]+:|^\/\/|(?:^|\/)\.{1,2}(?:\/|$)/i.test(request.url || '')) throw DolibarrError.BAD_REQUEST();
      const tracked = request as typeof request & { __startedAt?: number; __deadline?: number; __traceId?: string };
      if (!tracked.__startedAt) {
        tracked.__startedAt = Date.now();
        tracked.__deadline = tracked.__startedAt + 10000;
        tracked.__traceId = integrationRequestContext.getStore()?.traceId;
        // Absolute wall-clock budget includes DNS, connect, response and retries.
        request.signal = AbortSignal.timeout(10000);
      }
      const remaining = tracked.__deadline! - Date.now();
      if (remaining <= 0) throw DolibarrError.TIMEOUT();
      request.timeout = Math.min(request.timeout || this.config.timeout, remaining);
      return request;
    });
    // Intercepteur de retry avec backoff exponentiel
    http.interceptors.response.use(
      (response) => {
        this.logUpstream(response.config, response.status);
        return response;
      },
      async (error: AxiosError) => {
        if (error instanceof ErpError || error instanceof DolibarrError) throw error;
        const config = error.config as any;
        if (!config) throw this.handleError(error);
        this.logUpstream(config, error.response?.status, error.code);
        if (config.signal?.aborted || (config.__deadline && Date.now() >= config.__deadline)) throw DolibarrError.TIMEOUT();

        const status = error.response?.status || 0;
        const safeRead = ['get', 'head'].includes(String(config.method || 'get').toLowerCase());
        const retryable = safeRead && (status === 0 || [408, 429, 502, 503, 504].includes(status));
        config.__retryCount = config.__retryCount || 0;
        if (retryable && config.__retryCount < this.config.retryAttempts) {
          config.__retryCount += 1;
          const retryAfter = error.response?.headers?.['retry-after'];
          const requestedDelay = retryAfter == null ? 0 : /^\d+$/.test(String(retryAfter)) ? Number(retryAfter) * 1000 : Math.max(0, Date.parse(String(retryAfter)) - Date.now());
          // A longer provider backoff is handed back to the caller, never shortened.
          if (requestedDelay > 2000) throw this.handleError(error);
          const delay = Math.max(requestedDelay || 0, Math.min(2000, this.config.retryDelay * Math.pow(2, config.__retryCount - 1)));
          if (config.__deadline && Date.now() + delay >= config.__deadline) throw DolibarrError.TIMEOUT();
          this.logger.warn(`Retry ${config.__retryCount}/${this.config.retryAttempts} dans ${delay}ms`);
          await new Promise((r) => setTimeout(r, delay));
          return http.request(config);
        }

        throw this.handleError(error);
      },
    );

    return http;
  }

  private logUpstream(config: any, status?: number, code?: string) {
    this.logger.log(JSON.stringify({ event: 'ERP_UPSTREAM_RESPONSE', traceId: config.__traceId,
      endpoint: String(config.url || '').split('?')[0], httpStatus: status ?? null,
      durationMs: Date.now() - (config.__startedAt || Date.now()), attempt: (config.__retryCount || 0) + 1,
      ...(code ? { transportCode: code } : {}),
    }));
  }

  private readList(data: unknown, key: string): any[] {
    const list = Array.isArray(data) ? data : data && typeof data === 'object' ? (data as Record<string, unknown>)[key] : undefined;
    if (!Array.isArray(list) || list.some(item => !item || typeof item !== 'object' || item.id == null)) throw DolibarrError.ERP_ERROR('Invalid ERP list response');
    return list;
  }

  // === CONFIGURATION ===

  /**
   * Reconfigure l'adapter avec de nouveaux parametres
   */
  configure(config: Partial<DolibarrConfig>): void {
    this.config = { ...this.config, ...config };
    this.config.timeout = Math.max(100, Math.min(10000, Number(this.config.timeout) || 10000));
    this.config.retryAttempts = Math.max(0, Math.min(2, Number(this.config.retryAttempts) || 0));
    this.config.retryDelay = Math.max(0, Math.min(2000, Number(this.config.retryDelay) || 0));
    this.http = this.createHttpClient();
    this.logger.log('DolibarrAdapter configure');
  }

  // === CLIENTS (ThirdParty) ===

  async getClients(options: { page?: number; limit?: number } = {}): Promise<ErpClient[]> {
    this.logger.log('GET /thirdparties');
    const { data, status } = await this.http.get('/thirdparties', {
      params: { entity: this.config.entity, limit: options.limit ?? 100, page: options.page ?? 0 },
      validateStatus: status => (status >= 200 && status < 300) || status === 404,
    });
    // Dolibarr 23 returns this specific 404 for a genuinely empty collection.
    // Other 404 responses (including a missing route) remain errors.
    if (status === 404) {
      if (data?.error?.code === 404 && data.error.message === 'Not Found: No third parties found') return [];
      throw DolibarrError.fromHttpError(status, data);
    }
    const clients: DolibarrClient[] = this.readList(data, 'thirdparties');
    this.logger.log(`${clients.length} clients recus`);
    return clients.map(DolibarrMapper.mapFromDolibarrClient);
  }

  async getClientById(id: string): Promise<ErpClient> {
    this.logger.log(`GET /thirdparties/${encodeURIComponent(id)}`);
    const { data } = await this.http.get(`/thirdparties/${encodeURIComponent(id)}`);
    return DolibarrMapper.mapFromDolibarrClient(data);
  }

  async createClient(data: Omit<ErpClient, 'id'>): Promise<ErpClient> {
    this.logger.log('POST /thirdparties');
    const dolibarrData = DolibarrMapper.mapToDolibarrClient(data, this.config.entity);
    const { data: created } = await this.http.post('/thirdparties', dolibarrData);
    return DolibarrMapper.mapFromDolibarrClient({ ...dolibarrData, id: created.id || created });
  }

  async updateClient(id: string, data: Partial<ErpClient>): Promise<ErpClient> {
    this.logger.log(`PUT /thirdparties/${encodeURIComponent(id)}`);
    const dolibarrData = DolibarrMapper.mapToDolibarrClient(data as ErpClient, this.config.entity);
    await this.http.put(`/thirdparties/${encodeURIComponent(id)}`, dolibarrData);
    return this.getClientById(id);
  }

  async deleteClient(id: string): Promise<void> {
    this.logger.log(`DELETE /thirdparties/${encodeURIComponent(id)}`);
    await this.http.delete(`/thirdparties/${encodeURIComponent(id)}`);
  }

  // === PRODUITS (Products) ===

  // === PRODUITS (Products) ===

  async getProducts(options: { page?: number; limit?: number } = {}): Promise<ErpProduct[]> {
    this.logger.log('GET /products');
    const { data, headers } = await this.http.get('/products', {
      params: { entity: this.config.entity, limit: options.limit ?? 100, page: options.page ?? 0 },
    });
    const contentType = (headers['content-type'] as string) || '';
    if (!contentType.includes('application/json')) {
      throw DolibarrError.ERP_ERROR(`Reponse invalide: content-type ${contentType}`);
    }
    if (typeof data === 'string') {
      throw DolibarrError.ERP_ERROR('Reponse invalide: JSON attendu, HTML recu');
    }
    const products: DolibarrProduct[] = this.readList(data, 'products');
    this.logger.log(`${products.length} produits recus`);
    return products.map(DolibarrMapper.mapFromDolibarrProduct);
  }

  async getProductById(id: string): Promise<ErpProduct> {
    this.logger.log(`GET /products/${encodeURIComponent(id)}`);
    const { data } = await this.http.get(`/products/${encodeURIComponent(id)}`);
    return DolibarrMapper.mapFromDolibarrProduct(data);
  }

  async createProduct(data: Omit<ErpProduct, 'id'>): Promise<ErpProduct> {
    this.logger.log('POST /products');
    const dolibarrData = DolibarrMapper.mapToDolibarrProduct(data, this.config.entity);
    const { data: created } = await this.http.post('/products', dolibarrData);
    return DolibarrMapper.mapFromDolibarrProduct({ ...dolibarrData, id: created.id || created });
  }

  async updateProduct(id: string, data: Partial<ErpProduct>): Promise<ErpProduct> {
    this.logger.log(`PUT /products/${encodeURIComponent(id)}`);
    const dolibarrData = DolibarrMapper.mapToDolibarrProduct(data as ErpProduct, this.config.entity);
    await this.http.put(`/products/${encodeURIComponent(id)}`, dolibarrData);
    return this.getProductById(id);
  }

  async deleteProduct(id: string): Promise<void> {
    this.logger.log(`DELETE /products/${encodeURIComponent(id)}`);
    await this.http.delete(`/products/${encodeURIComponent(id)}`);
  }

  // === COMMANDES (Orders) ===

  async getOrders(options: { page?: number; limit?: number } = {}): Promise<ErpOrder[]> {
    this.logger.log('GET /orders');
    const { data } = await this.http.get('/orders', {
      params: { entity: this.config.entity, limit: options.limit ?? 100, page: options.page ?? 0 },
    });
    const orders: DolibarrOrder[] = this.readList(data, 'orders');
    this.logger.log(`${orders.length} commandes recues`);
    return orders.map(DolibarrMapper.mapFromDolibarrOrder);
  }

  async getOrderById(id: string): Promise<ErpOrder> {
    this.logger.log(`GET /orders/${encodeURIComponent(id)}`);
    const { data } = await this.http.get(`/orders/${encodeURIComponent(id)}`);
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
      await this.http.post(`/orders/${encodeURIComponent(id)}/lines`, {
        fk_product: Number(l.productId),
        qty: l.quantity,
        subprice: l.price || 0,
      });
    }
    return this.getOrderById(id);
  }

  async updateOrder(id: string, data: Partial<ErpOrder>): Promise<ErpOrder> {
    this.logger.log(`PUT /orders/${encodeURIComponent(id)}`);
    if (data.clientId && data.lines) {
      for (const l of data.lines) {
        await this.http.post(`/orders/${encodeURIComponent(id)}/lines`, {
          fk_product: Number(l.productId),
          qty: l.quantity,
          subprice: l.price || 0,
        });
      }
    }
    return this.getOrderById(id);
  }

  async deleteOrder(id: string): Promise<void> {
    this.logger.log(`DELETE /orders/${encodeURIComponent(id)}`);
    await this.http.delete(`/orders/${encodeURIComponent(id)}`);
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
    const timestamp = new Date().toISOString();
    if (!this.config.apiKey || !this.config.baseUrl) return { status: 'NOT_CONFIGURED', mode: 'DOLIBARR', timestamp };
    try {
      const response = await this.http.get('/status', { timeout: 5000 });
      if (!response.data || typeof response.data !== 'object') throw DolibarrError.ERP_ERROR();
      return { status: 'CONNECTED', mode: 'DOLIBARR', timestamp };
    } catch (error) {
      const normalized = error instanceof DolibarrError ? ErpError.fromDolibarr(error) : error instanceof ErpError ? error : ErpError.unavailable();
      return { status: normalized.statusCode === 503 || normalized.statusCode === 504 ? 'UNAVAILABLE' : 'DEGRADED', mode: 'DOLIBARR', timestamp, code: normalized.code, message: normalized.message };
    }
  }

  // === STOCK (tous) ===

  async getStocks(): Promise<StockInfo[]> {
    this.logger.log('GET /products (tous les stocks)');
    const { data } = await this.http.get('/products', {
      params: { entity: this.config.entity, limit: 100, includestockdata: 1 },
    });
    return this.readList(data, 'products').map(p => {
      const quantity = p.stock_reel ?? p.stock;
      if (quantity == null || quantity === '' || !Number.isFinite(Number(quantity))) {
        throw new ErpError('Quantite de stock absente de la reponse Dolibarr.', 502, 'INTEGRATION_PAYLOAD_INVALID');
      }
      return { productId: String(p.id), currentStock: Number(quantity) };
    });
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
    this.logger.log(`GET /thirdparties/${encodeURIComponent(id)} (fournisseur)`);
    const { data } = await this.http.get(`/thirdparties/${encodeURIComponent(id)}`);
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
    this.logger.log(`PUT /thirdparties/${encodeURIComponent(id)} (fournisseur)`);
    await this.http.put(`/thirdparties/${encodeURIComponent(id)}`, {
      name: data.nom,
      email: data.email,
      phone: data.telephone,
      address: data.adresse,
      town: data.ville,
    });
    return this.getSupplierById(id);
  }

  async deleteSupplier(id: string): Promise<void> {
    this.logger.log(`DELETE /thirdparties/${encodeURIComponent(id)}`);
    await this.http.delete(`/thirdparties/${encodeURIComponent(id)}`);
  }

  // === DEVIS / FACTURES / PAIEMENTS / ENTREPOTS / EXPEDITIONS / DOCUMENTS (in-memory) ===

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
    this.logger.log(`GET /proposals/${encodeURIComponent(id)}`);
    const { data } = await this.http.get(`/proposals/${encodeURIComponent(id)}`);
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
      await this.http.post(`/proposals/${encodeURIComponent(id)}/line`, DolibarrMapper.mapToDolibarrQuoteLine(l));
    }
    if (data.status && data.status.toUpperCase() === 'VALIDE') {
      await this.http.post(`/proposals/${encodeURIComponent(id)}/validate`, { notrigger: 0 });
    }
    return this.getQuoteById(id);
  }

  async updateQuote(id: string, data: Partial<ErpQuote>): Promise<ErpQuote> {
    this.logger.log(`PUT /proposals/${encodeURIComponent(id)}`);
    if (data.validUntil) {
      await this.http.put(`/proposals/${encodeURIComponent(id)}`, { date_limite: mapToDolibarrDate(data.validUntil) });
    }
    if (data.status && data.status.toUpperCase() === 'VALIDE') {
      await this.http.post(`/proposals/${encodeURIComponent(id)}/validate`, { notrigger: 0 });
    }
    return this.getQuoteById(id);
  }

  async deleteQuote(id: string): Promise<void> {
    this.logger.log(`DELETE /proposals/${encodeURIComponent(id)}`);
    await this.http.delete(`/proposals/${encodeURIComponent(id)}`);
  }

  // === FACTURES (Invoices - reelles) ===

  async getInvoices(options: { page?: number; limit?: number } = {}): Promise<ErpInvoice[]> {
    this.logger.log('GET /invoices');
    const { data } = await this.http.get('/invoices', {
      params: { entity: this.config.entity, limit: options.limit ?? 100, page: options.page ?? 0 },
    });
    const invoices: DolibarrInvoice[] = this.readList(data, 'invoices');
    this.logger.log(`${invoices.length} factures recues`);
    return invoices.map(DolibarrMapper.mapFromDolibarrInvoice);
  }

  async getInvoiceById(id: string): Promise<ErpInvoice> {
    this.logger.log(`GET /invoices/${encodeURIComponent(id)}`);
    const { data } = await this.http.get(`/invoices/${encodeURIComponent(id)}`);
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
      await this.http.post(`/invoices/${encodeURIComponent(id)}/lines`, DolibarrMapper.mapToDolibarrInvoiceLine(l));
    }
    if (data.status && data.status.toUpperCase() === 'VALIDE') {
      await this.http.post(`/invoices/${encodeURIComponent(id)}/validate`, { notrigger: 0 });
    }
    return this.getInvoiceById(id);
  }

  async updateInvoice(id: string, data: Partial<ErpInvoice>): Promise<ErpInvoice> {
    this.logger.log(`PUT /invoices/${encodeURIComponent(id)}`);
    if (data.dueDate) {
      await this.http.put(`/invoices/${encodeURIComponent(id)}`, { due_date: mapToDolibarrDate(data.dueDate) });
    }
    return this.getInvoiceById(id);
  }

  async deleteInvoice(id: string): Promise<void> {
    this.logger.log(`DELETE /invoices/${encodeURIComponent(id)}`);
    await this.http.delete(`/invoices/${encodeURIComponent(id)}`);
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
    this.logger.log(`GET /paiements/${encodeURIComponent(id)}`);
    const { data } = await this.http.get(`/paiements/${encodeURIComponent(id)}`);
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
    this.logger.log(`GET /warehouses/${encodeURIComponent(id)}`);
    const { data } = await this.http.get(`/warehouses/${encodeURIComponent(id)}`);
    return DolibarrMapper.mapFromDolibarrWarehouse(data);
  }

  async createWarehouse(data: Omit<ErpWarehouse, 'id' | 'ref'>): Promise<ErpWarehouse> {
    this.logger.log('POST /warehouses');
    const body = DolibarrMapper.mapToDolibarrWarehouse(data, this.config.entity);
    const { data: created } = await this.http.post('/warehouses', body);
    return this.getWarehouseById(String(created.id || created));
  }

  async updateWarehouse(id: string, data: Partial<ErpWarehouse>): Promise<ErpWarehouse> {
    this.logger.log(`PUT /warehouses/${encodeURIComponent(id)}`);
    await this.http.put(`/warehouses/${encodeURIComponent(id)}`, {
      label: data.nom,
      description: data.adresse,
      address: data.adresse,
      town: data.ville,
    });
    return this.getWarehouseById(id);
  }

  async deleteWarehouse(id: string): Promise<void> {
    this.logger.log(`DELETE /warehouses/${encodeURIComponent(id)}`);
    await this.http.delete(`/warehouses/${encodeURIComponent(id)}`);
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
    this.logger.log(`GET /shipments/${encodeURIComponent(id)}`);
    const { data } = await this.http.get(`/shipments/${encodeURIComponent(id)}`);
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
    this.logger.log(`PUT /shipments/${encodeURIComponent(id)}`);
    await this.http.put(`/shipments/${encodeURIComponent(id)}`, {
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
      } catch (error) { throw error; }
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
        } catch (error) { throw error; }
      }
    }
    this.documentsCache = { at: Date.now(), data: docs };
    this.logger.log(`${docs.length} documents recus`);
    return docs;
  }

  async getDocumentById(id: string): Promise<ErpDocument> {
    const docs = await this.getDocuments();
    const d = docs.find((x) => x.id === id);
    if (!d) throw DolibarrError.NOT_FOUND(`Document "${encodeURIComponent(id)}" non trouve`);
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
    if (!d) throw DolibarrError.NOT_FOUND(`Document "${encodeURIComponent(id)}" non trouve`);
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
    } catch (error) { throw error; }
  }
  async getProductVariantsByProduct(productId: string): Promise<ErpProductVariant[]> { throw new ErpError('Cette operation ERP n?est pas implementee par le connecteur.', 501, 'CAPABILITY_UNAVAILABLE'); }
  async createProductVariant(data: {
    productId: string; ref?: string; attribute: string; value: string;
    price?: number; stock?: number; barcode?: string;
  }): Promise<ErpProductVariant> { throw new ErpError('Cette operation ERP n?est pas implementee par le connecteur.', 501, 'CAPABILITY_UNAVAILABLE'); }
  async updateProductVariant(id: string, data: Partial<ErpProductVariant>): Promise<ErpProductVariant> { throw new ErpError('Cette operation ERP n?est pas implementee par le connecteur.', 501, 'CAPABILITY_UNAVAILABLE'); }
  async deleteProductVariant(id: string): Promise<void> { throw new ErpError('Cette operation ERP n?est pas implementee par le connecteur.', 501, 'CAPABILITY_UNAVAILABLE'); }

  async getServices(): Promise<ErpService[]> {
    this.logger.log('GET /products (services)');
    try {
      const { data } = await this.http.get('/products', {
        params: { entity: this.config.entity, type: 'service', limit: 100 },
      });
      const services: DolibarrService[] = Array.isArray(data) ? data : data.products || [];
      return services.map(DolibarrMapper.mapFromDolibarrService);
    } catch (error) { throw error; }
  }
  async getServiceById(id: string): Promise<ErpService> {
    this.logger.log(`GET /products/${encodeURIComponent(id)} (service)`);
    try {
      const { data } = await this.http.get(`/products/${encodeURIComponent(id)}`);
      return DolibarrMapper.mapFromDolibarrService(data);
    } catch (error) { throw error; }
  }
  async createService(data: { label: string; price: number; duration?: number; description?: string }): Promise<ErpService> {
    this.logger.log('POST /products (service)');
    try {
      const dolibarrData = DolibarrMapper.mapToDolibarrService(data, this.config.entity);
      const { data: created } = await this.http.post('/products', dolibarrData);
      return DolibarrMapper.mapFromDolibarrService({ ...dolibarrData, id: created.id || created });
    } catch (error) { throw error; }
  }
  async updateService(id: string, data: Partial<ErpService>): Promise<ErpService> { throw new ErpError('Cette operation ERP n?est pas implementee par le connecteur.', 501, 'CAPABILITY_UNAVAILABLE'); }
  async deleteService(id: string): Promise<void> { throw new ErpError('Cette operation ERP n?est pas implementee par le connecteur.', 501, 'CAPABILITY_UNAVAILABLE'); }

  async getStockMovements(): Promise<StockMovement[]> {
    this.logger.log('GET /stockmovements');
    try {
      const { data } = await this.http.get('/stockmovements', {
        params: { entity: this.config.entity, limit: 100 },
      });
      const movements: DolibarrStockMovement[] = Array.isArray(data) ? data : data.movements || [];
      return movements.map(DolibarrMapper.mapFromDolibarrStockMovement);
    } catch (error) { throw error; }
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
    } catch (error) { throw error; }
  }
  async createStockTransfer(data: {
    productId: string; quantity: number; fromWarehouseId: string; toWarehouseId: string;
  }): Promise<StockTransfer> {
    this.logger.log('POST /stock/transferts (transfert)');
    try {
      const dolibarrData = DolibarrMapper.mapToDolibarrStockTransfer(data, this.config.entity);
      const { data: created } = await this.http.post('/stock/transferts', dolibarrData);
      return DolibarrMapper.mapFromDolibarrStockTransfer({ ...dolibarrData, id: created.id || created });
    } catch (error) { throw error; }
  }
  async updateStockTransfer(id: string, data: Partial<StockTransfer>): Promise<StockTransfer> { throw new ErpError('Cette operation ERP n?est pas implementee par le connecteur.', 501, 'CAPABILITY_UNAVAILABLE'); }

  async getInventories(): Promise<Inventory[]> {
    this.logger.log('GET /inventories (inventaires)');
    try {
      const { data } = await this.http.get('/inventories', {
        params: { entity: this.config.entity, limit: 100 },
      });
      const inventories: DolibarrInventory[] = Array.isArray(data) ? data : data.inventories || [];
      return inventories.map(DolibarrMapper.mapFromDolibarrInventory);
    } catch (error) { throw error; }
  }
  async getInventoryById(id: string): Promise<Inventory> {
    this.logger.log(`GET /inventories/${encodeURIComponent(id)}`);
    try {
      const { data } = await this.http.get(`/inventories/${encodeURIComponent(id)}`);
      return DolibarrMapper.mapFromDolibarrInventory(data);
    } catch (error) { throw error; }
  }
  async createInventory(data: { label: string; type: Inventory['type'] }): Promise<Inventory> {
    this.logger.log('POST /inventories');
    try {
      const dolibarrData = DolibarrMapper.mapToDolibarrInventory(data, this.config.entity);
      const { data: created } = await this.http.post('/inventories', dolibarrData);
      return DolibarrMapper.mapFromDolibarrInventory({ ...dolibarrData, id: created.id || created });
    } catch (error) { throw error; }
  }
  async updateInventory(id: string, data: Partial<Inventory>): Promise<Inventory> { throw new ErpError('Cette operation ERP n?est pas implementee par le connecteur.', 501, 'CAPABILITY_UNAVAILABLE'); }

  async getStockAlerts(): Promise<StockAlert[]> { throw new ErpError('Cette operation ERP n?est pas implementee par le connecteur.', 501, 'CAPABILITY_UNAVAILABLE'); }
  async createStockAlert(data: { productId: string; level: StockAlert['level']; current: number; threshold: number }): Promise<StockAlert> { throw new ErpError('Cette operation ERP n?est pas implementee par le connecteur.', 501, 'CAPABILITY_UNAVAILABLE'); }

  async getReturns(): Promise<ErpReturn[]> {
    this.logger.log('GET /powererp/returns (retours)');
    try {
      const { data } = await this.http.get('/powererp/returns', {
        params: { entity: this.config.entity, limit: 100 },
      });
      const returns: DolibarrReturn[] = Array.isArray(data) ? data : data.returns || [];
      return returns.map((r) => DolibarrMapper.mapFromDolibarrReturn(r));
    } catch (error) { throw error; }
  }
  async getReturnById(id: string): Promise<ErpReturn> {
    this.logger.log(`GET /returns/${encodeURIComponent(id)}`);
    try {
      const { data } = await this.http.get(`/returns/${encodeURIComponent(id)}`);
      return DolibarrMapper.mapFromDolibarrReturn(data);
    } catch (error) { throw error; }
  }
  async createReturn(data: { orderId: string; clientId: string; reason: string; type: ErpReturn['type']; lines: ErpReturn['lines'] }): Promise<ErpReturn> {
    this.logger.log('POST /powererp/returns (retour)');
    try {
      const dolibarrData = DolibarrMapper.mapToDolibarrReturn(data, this.config.entity);
      const { data: created } = await this.http.post('/powererp/returns', dolibarrData);
      return DolibarrMapper.mapFromDolibarrReturn({ ...dolibarrData, id: created.id || created }, data.lines);
    } catch (error) { throw error; }
  }
  async updateReturn(id: string, data: Partial<ErpReturn>): Promise<ErpReturn> { throw new ErpError('Cette operation ERP n?est pas implementee par le connecteur.', 501, 'CAPABILITY_UNAVAILABLE'); }

  async getPromotions(): Promise<Promotion[]> {
    this.logger.log('GET /promotions');
    try {
      const { data } = await this.http.get('/promotions', {
        params: { entity: this.config.entity, limit: 100 },
      });
      const promos: DolibarrPromotion[] = Array.isArray(data) ? data : data.promotions || [];
      return promos.map(DolibarrMapper.mapFromDolibarrPromotion);
    } catch (error) { throw error; }
  }
  async getPromotionById(id: string): Promise<Promotion> {
    this.logger.log(`GET /promotions/${encodeURIComponent(id)}`);
    try {
      const { data } = await this.http.get(`/promotions/${encodeURIComponent(id)}`);
      return DolibarrMapper.mapFromDolibarrPromotion(data);
    } catch (error) { throw error; }
  }
  async createPromotion(data: { label: string; type: Promotion['type']; value: number; appliesTo: string; startDate: string; endDate: string }): Promise<Promotion> {
    this.logger.log('POST /promotions');
    try {
      const dolibarrData = DolibarrMapper.mapToDolibarrPromotion(data, this.config.entity);
      const { data: created } = await this.http.post('/promotions', dolibarrData);
      return DolibarrMapper.mapFromDolibarrPromotion({ ...dolibarrData, id: created.id || created });
    } catch (error) { throw error; }
  }
  async updatePromotion(id: string, data: Partial<Promotion>): Promise<Promotion> { throw new ErpError('Cette operation ERP n?est pas implementee par le connecteur.', 501, 'CAPABILITY_UNAVAILABLE'); }
  async deletePromotion(id: string): Promise<void> { throw new ErpError('Cette operation ERP n?est pas implementee par le connecteur.', 501, 'CAPABILITY_UNAVAILABLE'); }

  async getPurchaseOrders(): Promise<PurchaseOrder[]> {
    this.logger.log('GET /supplierorders (achats)');
    try {
      const { data } = await this.http.get('/supplierorders', {
        params: { entity: this.config.entity, limit: 100 },
      });
      const orders: DolibarrPurchaseOrder[] = this.readList(data, 'orders');
      return orders.map(DolibarrMapper.mapFromDolibarrPurchaseOrder);
    } catch (error) { throw error; }
  }
  async getPurchaseOrderById(id: string): Promise<PurchaseOrder> {
    this.logger.log(`GET /supplierorders/${encodeURIComponent(id)}`);
    try {
      const { data } = await this.http.get(`/supplierorders/${encodeURIComponent(id)}`);
      return DolibarrMapper.mapFromDolibarrPurchaseOrder(data);
    } catch (error) { throw error; }
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
        await this.http.post(`/supplierorders/${encodeURIComponent(id)}/lines`, {
          fk_product: Number(l.productId),
          qty: l.quantity,
          subprice: l.price || 0,
        });
      }
      return this.getPurchaseOrderById(id);
    } catch (error) { throw error; }
  }
  async updatePurchaseOrder(id: string, data: Partial<PurchaseOrder>): Promise<PurchaseOrder> { throw new ErpError('Cette operation ERP n?est pas implementee par le connecteur.', 501, 'CAPABILITY_UNAVAILABLE'); }

  async getCashRegisters(): Promise<ErpCashRegister[]> {
    this.logger.log('GET /pos/registers (caisses)');
    try {
      const { data } = await this.http.get('/pos/registers', { params: { entity: this.config.entity, limit: 100 } });
      const registers: DolibarrCashRegister[] = Array.isArray(data) ? data : data.registers || [];
      return registers.map(DolibarrMapper.mapFromDolibarrCashRegister);
    } catch (error) { throw error; }
  }
  async getCashRegisterById(id: string): Promise<ErpCashRegister> {
    this.logger.log(`GET /pos/registers/${encodeURIComponent(id)}`);
    try {
      const { data } = await this.http.get(`/pos/registers/${encodeURIComponent(id)}`);
      return DolibarrMapper.mapFromDolibarrCashRegister(data);
    } catch (error) { throw error; }
  }
  async createCashRegister(data: { label: string; openingCash: number }): Promise<ErpCashRegister> {
    this.logger.log('POST /pos/registers (caisse)');
    try {
      const body = { ...DolibarrMapper.mapToDolibarrCashRegister(data, this.config.entity), status: 1 };
      const { data: created } = await this.http.post('/pos/registers', body);
      return DolibarrMapper.mapFromDolibarrCashRegister({ ...body, id: created.id || created });
    } catch (error) { throw error; }
  }
  async updateCashRegister(id: string, data: Partial<ErpCashRegister>): Promise<ErpCashRegister> { throw new ErpError('Cette operation ERP n?est pas implementee par le connecteur.', 501, 'CAPABILITY_UNAVAILABLE'); }

  async getExpenses(): Promise<ErpExpense[]> { throw new ErpError('Cette operation ERP n?est pas implementee par le connecteur.', 501, 'CAPABILITY_UNAVAILABLE'); }
  async getExpenseById(id: string): Promise<ErpExpense> { throw new ErpError('Cette operation ERP n?est pas implementee par le connecteur.', 501, 'CAPABILITY_UNAVAILABLE'); }
  async createExpense(data: { label: string; amount: number; category: string; supplierId?: string }): Promise<ErpExpense> { throw new ErpError('Cette operation ERP n?est pas implementee par le connecteur.', 501, 'CAPABILITY_UNAVAILABLE'); }
  async deleteExpense(id: string): Promise<void> { throw new ErpError('Cette operation ERP n?est pas implementee par le connecteur.', 501, 'CAPABILITY_UNAVAILABLE'); }

  async getReservations(): Promise<ErpReservation[]> { throw new ErpError('Cette operation ERP n?est pas implementee par le connecteur.', 501, 'CAPABILITY_UNAVAILABLE'); }
  async getReservationById(id: string): Promise<ErpReservation> { throw new ErpError('Cette operation ERP n?est pas implementee par le connecteur.', 501, 'CAPABILITY_UNAVAILABLE'); }
  async createReservation(data: { clientId: string; productIds?: string[]; startAt: string; endAt: string }): Promise<ErpReservation> { throw new ErpError('Cette operation ERP n?est pas implementee par le connecteur.', 501, 'CAPABILITY_UNAVAILABLE'); }
  async updateReservation(id: string, data: Partial<ErpReservation>): Promise<ErpReservation> { throw new ErpError('Cette operation ERP n?est pas implementee par le connecteur.', 501, 'CAPABILITY_UNAVAILABLE'); }

  async getAgenda(): Promise<ErpAgendaEvent[]> {
    this.logger.log('GET /agendaevents');
    try {
      const { data } = await this.http.get('/agendaevents', {
        params: { entity: this.config.entity, limit: 100 },
      });
      const events: DolibarrAgendaEvent[] = Array.isArray(data) ? data : data.events || [];
      return events.map(DolibarrMapper.mapFromDolibarrAgendaEvent);
    } catch (error) { throw error; }
  }
  async createAgendaEvent(data: { title: string; startAt: string; endAt: string; type: string; relatedTo?: string }): Promise<ErpAgendaEvent> {
    this.logger.log('POST /agendaevents');
    try {
      const body = DolibarrMapper.mapToDolibarrAgendaEvent(data, this.config.entity);
      const { data: created } = await this.http.post('/agendaevents', body);
      return DolibarrMapper.mapFromDolibarrAgendaEvent({ ...body, id: created.id || created });
    } catch (error) { throw error; }
  }

  async updateAgendaEvent(id: string, data: Partial<{ title: string; startAt: string; endAt: string; type: string; relatedTo?: string }>): Promise<ErpAgendaEvent> {
    this.logger.log(`PUT /agendaevents/${encodeURIComponent(id)}`);
    try {
      const body: Partial<DolibarrAgendaEvent> = {};
      if (data.title !== undefined) body.label = data.title;
      if (data.startAt !== undefined) body.datep = mapToDolibarrDate(data.startAt);
      if (data.endAt !== undefined) body.datef = mapToDolibarrDate(data.endAt);
      if (data.type !== undefined) body.type_code = data.type;
      await this.http.put(`/agendaevents/${encodeURIComponent(id)}`, body);
      return this.getAgendaEventById(id);
    } catch (error) { throw error; }
  }

  async deleteAgendaEvent(id: string): Promise<void> {
    this.logger.log(`DELETE /agendaevents/${encodeURIComponent(id)}`);
    try {
      await this.http.delete(`/agendaevents/${encodeURIComponent(id)}`);
    } catch (error) { throw error; }
  }

  private async getAgendaEventById(id: string): Promise<ErpAgendaEvent> {
    try {
      const { data } = await this.http.get(`/agendaevents/${encodeURIComponent(id)}`);
      return DolibarrMapper.mapFromDolibarrAgendaEvent(data);
    } catch (error) { throw error; }
  }

  async getProjects(): Promise<ErpProject[]> {
    this.logger.log('GET /projects');
    try {
      const { data } = await this.http.get('/projects', {
        params: { entity: this.config.entity, limit: 100 },
      });
      const projects: DolibarrProject[] = Array.isArray(data) ? data : data.projects || [];
      return projects.map(DolibarrMapper.mapFromDolibarrProject);
    } catch (error) { throw error; }
  }
  async getProjectById(id: string): Promise<ErpProject> {
    this.logger.log(`GET /projects/${encodeURIComponent(id)}`);
    try {
      const { data } = await this.http.get(`/projects/${encodeURIComponent(id)}`);
      return DolibarrMapper.mapFromDolibarrProject(data);
    } catch (error) { throw error; }
  }
  async createProject(data: { label: string; clientId?: string; status?: string; startDate?: string }): Promise<ErpProject> {
    this.logger.log('POST /projects');
    try {
      const body = DolibarrMapper.mapToDolibarrProject(data, this.config.entity);
      const { data: created } = await this.http.post('/projects', body);
      return this.getProjectById(String(created.id || created));
    } catch (error) { throw error; }
  }
  async updateProject(id: string, data: Partial<ErpProject>): Promise<ErpProject> {
    this.logger.log(`PUT /projects/${encodeURIComponent(id)}`);
    try {
      const body: Record<string, any> = {};
      if (data.label) body.title = data.label;
      if (data.startDate) body.date_start = mapToDolibarrDate(data.startDate);
      if (data.status) body.fk_statut = data.status === 'TERMINE' ? 2 : 1;
      await this.http.put(`/projects/${encodeURIComponent(id)}`, body);
      return this.getProjectById(id);
    } catch (error) { throw error; }
  }

  // === STATISTIQUES (degraded) ===

  async getStats(): Promise<ErpStats> { throw new ErpError('Les totaux ERP exhaustifs ne sont pas disponibles via ce connecteur.', 501, 'CAPABILITY_UNAVAILABLE'); }

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
    this.logger.log(`GET /users/${encodeURIComponent(id)}`);
    const { data } = await this.http.get(`/users/${encodeURIComponent(id)}`);
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
    return DolibarrError.CONNECTION_ERROR();
  }
}
