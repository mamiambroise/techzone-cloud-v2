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
} from '../interfaces/erp-adapter.interface';
import { DolibarrConfig, DEFAULT_DOLIBARR_CONFIG } from './dolibarr.config';
import { DolibarrMapper } from './dolibarr.mapper';
import { DolibarrError } from './dolibarr.error';
import { DolibarrClient, DolibarrProduct, DolibarrOrder } from './dolibarr.dto';

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

        config.__retryCount = config.__retryCount || 0;
        if (config.__retryCount < this.config.retryAttempts) {
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
    this.logger.log('GET /thirdparts');
    const { data } = await this.http.get('/thirdparts', {
      params: { entity: this.config.entity, limit: 100 },
    });
    const clients: DolibarrClient[] = Array.isArray(data) ? data : data.thirdparts || [];
    this.logger.log(`${clients.length} clients recus`);
    return clients.map(DolibarrMapper.mapFromDolibarrClient);
  }

  async getClientById(id: string): Promise<ErpClient> {
    this.logger.log(`GET /thirdparts/${id}`);
    const { data } = await this.http.get(`/thirdparts/${id}`);
    return DolibarrMapper.mapFromDolibarrClient(data);
  }

  async createClient(data: Omit<ErpClient, 'id'>): Promise<ErpClient> {
    this.logger.log('POST /thirdparts');
    const dolibarrData = DolibarrMapper.mapToDolibarrClient(data, this.config.entity);
    const { data: created } = await this.http.post('/thirdparts', dolibarrData);
    return DolibarrMapper.mapFromDolibarrClient({ ...dolibarrData, id: created.id || created });
  }

  async updateClient(id: string, data: Partial<ErpClient>): Promise<ErpClient> {
    this.logger.log(`PUT /thirdparts/${id}`);
    const dolibarrData = DolibarrMapper.mapToDolibarrClient(data as ErpClient, this.config.entity);
    await this.http.put(`/thirdparts/${id}`, dolibarrData);
    return this.getClientById(id);
  }

  async deleteClient(id: string): Promise<void> {
    this.logger.log(`DELETE /thirdparts/${id}`);
    await this.http.delete(`/thirdparts/${id}`);
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
    this.logger.log('GET /commandes');
    const { data } = await this.http.get('/commandes', {
      params: { entity: this.config.entity, limit: 100 },
    });
    const orders: DolibarrOrder[] = Array.isArray(data) ? data : data.commandes || [];
    this.logger.log(`${orders.length} commandes recues`);
    return orders.map(DolibarrMapper.mapFromDolibarrOrder);
  }

  async getOrderById(id: string): Promise<ErpOrder> {
    this.logger.log(`GET /commandes/${id}`);
    const { data } = await this.http.get(`/commandes/${id}`);
    return DolibarrMapper.mapFromDolibarrOrder(data);
  }

  async createOrder(data: { clientId: string; lines: ErpOrderLine[] }): Promise<ErpOrder> {
    this.logger.log('POST /commandes');
    const dolibarrData = DolibarrMapper.mapToDolibarrOrder(data, this.config.entity);
    const { data: created } = await this.http.post('/commandes', dolibarrData);
    return DolibarrMapper.mapFromDolibarrOrder({ ...dolibarrData, id: created.id || created, ref: created.ref });
  }

  async updateOrder(id: string, data: Partial<ErpOrder>): Promise<ErpOrder> {
    this.logger.log(`PUT /commandes/${id}`);
    if (data.clientId && data.lines) {
      const dolibarrData = DolibarrMapper.mapToDolibarrOrder(
        { clientId: data.clientId, lines: data.lines },
        this.config.entity,
      );
      await this.http.put(`/commandes/${id}`, dolibarrData);
    }
    return this.getOrderById(id);
  }

  async deleteOrder(id: string): Promise<void> {
    this.logger.log(`DELETE /commandes/${id}`);
    await this.http.delete(`/commandes/${id}`);
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
      await this.http.get('', { timeout: 5000 });
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
