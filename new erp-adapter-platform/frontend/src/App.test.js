import {
  erpRegistryService,
  clientService,
  productService,
  orderService,
  stockService,
  healthService,
} from './services/api';

describe('ERP Adapter Platform - API Services', () => {
  test('tous les services sont definis', () => {
    expect(typeof erpRegistryService.getAll).toBe('function');
    expect(typeof clientService.getAll).toBe('function');
    expect(typeof productService.getAll).toBe('function');
    expect(typeof orderService.getAll).toBe('function');
    expect(typeof stockService.get).toBe('function');
    expect(typeof healthService.check).toBe('function');
  });
});