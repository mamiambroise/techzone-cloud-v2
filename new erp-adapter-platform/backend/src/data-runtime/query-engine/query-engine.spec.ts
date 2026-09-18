import { QueryEngine } from './query-engine';
import { DataAccessManager } from '../data-access/data-access-manager';
import { RuntimeContext } from '../interfaces';

describe('QueryEngine', () => {
  let queryEngine: QueryEngine;
  let dataAccess: DataAccessManager;
  let ctx: RuntimeContext;

  const sampleItems = [
    { id: '1', name: 'Alpha', price: 100, active: true },
    { id: '2', name: 'Beta', price: 200, active: false },
    { id: '3', name: 'Gamma', price: 300, active: true },
    { id: '4', name: 'Delta', price: 400, active: true },
  ];

  beforeEach(() => {
    dataAccess = new DataAccessManager();
    const mockProvider = {
      get: jest.fn(),
      list: jest.fn(async (resource, c, options) => {
        return {
          items: sampleItems,
          page: 1,
          pageSize: options?.pageSize || 20,
          total: sampleItems.length,
          totalPages: 1,
        };
      }),
      count: jest.fn(),
      exists: jest.fn(),
      metadata: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
    };
    dataAccess.registerProvider('MOCK', mockProvider as any);
    dataAccess.registerResource({
      resourceCode: 'Product',
      displayName: 'Produit',
      provider: 'MOCK',
      instance: 'main',
      operations: ['READ', 'LIST'],
      fields: [],
      relations: [],
    });
    queryEngine = new QueryEngine(dataAccess);

    ctx = {
      tenantId: 'tenant-1',
      userId: 'user-1',
      requestId: 'req-1',
      traceId: 'trace-1',
      permissions: ['*'],
    };
  });

  describe('execute', () => {
    it('should execute a valid query', async () => {
      const result = await queryEngine.execute(
        { resource: 'Product', page: 1, pageSize: 10 },
        ctx,
      );
      expect(result.items).toHaveLength(4);
      expect(result.total).toBe(4);
    });

    it('should reject missing resource', async () => {
      await expect(
        queryEngine.execute({} as any, ctx),
      ).rejects.toThrow('resource est requis');
    });

    it('should reject invalid filter operator', async () => {
      await expect(
        queryEngine.execute(
          {
            resource: 'Product',
            filter: {
              logic: 'AND',
              conditions: [{ field: 'name', operator: 'LIKE' as any, value: 'test' }],
            },
          },
          ctx,
        ),
      ).rejects.toThrow('non autorise');
    });

    it('should reject pageSize over max', async () => {
      await expect(
        queryEngine.execute({ resource: 'Product', pageSize: 999 }, ctx),
      ).rejects.toThrow('pageSize');
    });

    it('should validate IN operator requires array', async () => {
      await expect(
        queryEngine.execute(
          {
            resource: 'Product',
            filter: {
              logic: 'AND',
              conditions: [{ field: 'id', operator: 'IN', value: 'not-array' }],
            },
          },
          ctx,
        ),
      ).rejects.toThrow('tableau');
    });
  });

  describe('local filter', () => {
    it('should filter and sort locally', () => {
      const filtered = queryEngine.applyLocalFilter(sampleItems, {
        resource: 'Product',
        filter: {
          logic: 'AND',
          conditions: [{ field: 'active', operator: 'EQ', value: true }],
        },
        sort: [{ field: 'price', direction: 'DESC' }],
        page: 1,
        pageSize: 100,
      });
      expect(filtered).toHaveLength(3);
      expect(filtered[0].price).toBe(400);
    });

    it('should handle OR logic in filters', () => {
      const filtered = queryEngine.applyLocalFilter(sampleItems, {
        resource: 'Product',
        filter: {
          logic: 'OR',
          conditions: [
            { field: 'name', operator: 'EQ', value: 'Alpha' },
            { field: 'name', operator: 'EQ', value: 'Beta' },
          ],
        },
      });
      expect(filtered).toHaveLength(2);
    });

    it('should handle CONTAINS operator', () => {
      const filtered = queryEngine.applyLocalFilter(sampleItems, {
        resource: 'Product',
        filter: {
          logic: 'AND',
          conditions: [{ field: 'name', operator: 'CONTAINS', value: 'am' }],
        },
      });
      expect(filtered).toHaveLength(1);
      expect(filtered[0].name).toBe('Gamma');
    });

    it('should handle IS_NULL operator', () => {
      const items = [
        { id: '1', name: 'A', note: null },
        { id: '2', name: 'B', note: 'exists' },
      ];
      const filtered = queryEngine.applyLocalFilter(items, {
        resource: 'Product',
        filter: {
          logic: 'AND',
          conditions: [{ field: 'note', operator: 'IS_NULL' }],
        },
      });
      expect(filtered).toHaveLength(1);
      expect(filtered[0].name).toBe('A');
    });
  });
});
