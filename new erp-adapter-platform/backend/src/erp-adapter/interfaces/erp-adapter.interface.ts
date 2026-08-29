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

  // Sante
  healthCheck(): Promise<HealthCheckResult>;
}
