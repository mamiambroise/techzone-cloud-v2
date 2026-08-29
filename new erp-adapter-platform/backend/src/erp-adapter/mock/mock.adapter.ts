import { Logger, NotFoundException } from '@nestjs/common';
import {
  IErpAdapter,
  ErpClient,
  ErpProduct,
  ErpOrder,
  ErpOrderLine,
  StockInfo,
  HealthCheckResult,
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
  ];

  private nextClientId = 6;
  private nextProductId = 6;
  private nextOrderId = 4;

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

  // === SANTE ===

  async healthCheck(): Promise<HealthCheckResult> {
    return {
      status: 'HEALTHY',
      mode: 'MOCK',
      timestamp: new Date().toISOString(),
    };
  }
}
