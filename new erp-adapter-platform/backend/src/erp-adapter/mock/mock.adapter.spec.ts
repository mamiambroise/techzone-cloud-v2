import { Test, TestingModule } from '@nestjs/testing';
import { MockAdapter } from './mock.adapter';

describe('MockAdapter', () => {
  let adapter: MockAdapter;

  beforeEach(() => {
    adapter = new MockAdapter();
  });

  // === TESTS CLIENTS ===

  describe('Clients', () => {
    it('devrait retourner 5 clients par defaut', async () => {
      const clients = await adapter.getClients();
      expect(clients).toHaveLength(5);
    });

    it('devrait recuperer un client par ID', async () => {
      const client = await adapter.getClientById('client-1');
      expect(client).toBeDefined();
      expect(client.nom).toBe('Rakoto Jean');
    });

    it('devrait creer un client', async () => {
      const newClient = await adapter.createClient({
        nom: 'Test Client',
        email: 'test@example.com',
      });
      expect(newClient.id).toBeDefined();
      expect(newClient.nom).toBe('Test Client');
    });

    it('devrait modifier un client', async () => {
      const updated = await adapter.updateClient('client-1', { nom: 'Nouveau Nom' });
      expect(updated.nom).toBe('Nouveau Nom');
    });

    it('devrait supprimer un client', async () => {
      await adapter.deleteClient('client-1');
      const clients = await adapter.getClients();
      expect(clients.find((c) => c.id === 'client-1')).toBeUndefined();
    });

    it('devrait lever une erreur pour un client inexistant', async () => {
      await expect(adapter.getClientById('inexistant')).rejects.toThrow();
    });
  });

  // === TESTS PRODUITS ===

  describe('Produits', () => {
    it('devrait retourner 5 produits par defaut', async () => {
      const products = await adapter.getProducts();
      expect(products).toHaveLength(5);
    });

    it('devrait recuperer un produit par ID', async () => {
      const product = await adapter.getProductById('prod-1');
      expect(product).toBeDefined();
      expect(product.ref).toBe('PRD-001');
    });

    it('devrait creer un produit', async () => {
      const newProduct = await adapter.createProduct({
        ref: 'PRD-TEST',
        label: 'Produit Test',
        price: 49.99,
        stock: 10,
      });
      expect(newProduct.id).toBeDefined();
      expect(newProduct.ref).toBe('PRD-TEST');
    });

    it('devrait modifier un produit', async () => {
      const updated = await adapter.updateProduct('prod-1', { price: 799.99 });
      expect(updated.price).toBe(799.99);
    });

    it('devrait supprimer un produit', async () => {
      await adapter.deleteProduct('prod-1');
      const products = await adapter.getProducts();
      expect(products.find((p) => p.id === 'prod-1')).toBeUndefined();
    });
  });

  // === TESTS COMMANDES ===

  describe('Commandes', () => {
    it('devrait retourner 3 commandes par defaut', async () => {
      const orders = await adapter.getOrders();
      expect(orders).toHaveLength(3);
    });

    it('devrait recuperer une commande par ID', async () => {
      const order = await adapter.getOrderById('order-1');
      expect(order).toBeDefined();
      expect(order.ref).toBe('CMD-2024-001');
    });

    it('devrait creer une commande', async () => {
      const newOrder = await adapter.createOrder({
        clientId: 'client-1',
        lines: [{ productId: 'prod-1', quantity: 2, price: 999.99 }],
      });
      expect(newOrder.id).toBeDefined();
      expect(newOrder.total).toBe(1999.98);
    });

    it('devrait calculer le total correctement', async () => {
      const order = await adapter.createOrder({
        clientId: 'client-1',
        lines: [
          { productId: 'prod-1', quantity: 2, price: 100 },
          { productId: 'prod-2', quantity: 3, price: 50 },
        ],
      });
      expect(order.total).toBe(350);
    });
  });

  // === TESTS STOCK ===

  describe('Stock', () => {
    it('devrait retourner le stock d un produit', async () => {
      const stock = await adapter.getStock('prod-1');
      expect(stock.productId).toBe('prod-1');
      expect(stock.currentStock).toBe(25);
    });

    it('devrait mettre a jour le stock', async () => {
      const stock = await adapter.updateStock('prod-1', 100);
      expect(stock.currentStock).toBe(100);
    });
  });

  // === TESTS SANTE ===

  describe('Health', () => {
    it('devrait retourner HEALTHY', async () => {
      const health = await adapter.healthCheck();
      expect(health.status).toBe('HEALTHY');
      expect(health.mode).toBe('MOCK');
    });
  });
});
