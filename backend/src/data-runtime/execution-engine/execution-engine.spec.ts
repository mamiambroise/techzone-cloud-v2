import { ExecutionEngine } from './execution-engine';
import { DataAccessManager } from '../data-access/data-access-manager';
import { RuntimeContext, ExecutionRequest } from '../interfaces';

describe('ExecutionEngine', () => {
  let engine: ExecutionEngine;
  let dataAccess: DataAccessManager;
  let ctx: RuntimeContext;

  beforeEach(() => {
    dataAccess = new DataAccessManager();
    const mockProvider = {
      get: jest.fn(async (r, id) => ({ id, name: 'Test' })),
      list: jest.fn(),
      count: jest.fn(),
      exists: jest.fn(),
      metadata: jest.fn(),
      create: jest.fn(async (r, data) => ({ id: 'new-1', ...data })),
      update: jest.fn(async (r, id, data) => ({ id, ...data })),
      remove: jest.fn(async () => {}),
    };
    dataAccess.registerProvider('MOCK', mockProvider as any);
    dataAccess.registerResource({
      resourceCode: 'Product',
      displayName: 'Produit',
      provider: 'MOCK',
      instance: 'main',
      operations: ['READ', 'LIST', 'CREATE', 'UPDATE', 'DELETE'],
      fields: [],
      relations: [],
    });
    engine = new ExecutionEngine(dataAccess);

    ctx = {
      tenantId: 'tenant-1',
      userId: 'user-1',
      requestId: 'req-1',
      traceId: 'trace-1',
      permissions: ['*'],
    };
  });

  describe('execute', () => {
    it('should create a resource', async () => {
      const result = await engine.execute(
        { resource: 'Product', operation: 'CREATE', input: { name: 'Nouveau' } },
        ctx,
      );
      expect(result.success).toBe(true);
      expect(result.data.id).toBe('new-1');
      expect(result.traceId).toBe('trace-1');
    });

    it('should require targetId for UPDATE', async () => {
      const result = await engine.execute(
        { resource: 'Product', operation: 'UPDATE', input: { name: 'Test' } },
        ctx,
      );
      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('DATA_OPERATION_NOT_ALLOWED');
    });

    it('should update a resource', async () => {
      const result = await engine.execute(
        { resource: 'Product', operation: 'UPDATE', targetId: 'p-1', input: { name: 'Modifie' } },
        ctx,
      );
      expect(result.success).toBe(true);
      expect(result.data.name).toBe('Modifie');
    });

    it('should delete a resource', async () => {
      const result = await engine.execute(
        { resource: 'Product', operation: 'DELETE', targetId: 'p-1' },
        ctx,
      );
      expect(result.success).toBe(true);
      expect(result.data.deleted).toBe(true);
    });

    it('should enforce idempotency with same key', async () => {
      const req: ExecutionRequest = {
        resource: 'Product',
        operation: 'CREATE',
        input: { name: 'Test' },
        idempotencyKey: 'key-1',
      };
      const first = await engine.execute(req, ctx);
      const second = await engine.execute(req, ctx);
      expect(first.success).toBe(true);
      expect(second.success).toBe(true);
      expect(second.data).toBe(first.data);
    });

    it('rejects reusing an idempotency key for a different mutation', async () => {
      const create = jest.spyOn(dataAccess.getProvider('MOCK'), 'create');
      const first = await engine.execute({
        resource: 'Product', operation: 'CREATE', input: { name: 'Original' }, idempotencyKey: 'stable-key',
      }, ctx);
      await expect(engine.execute({
        resource: 'Product', operation: 'CREATE', input: { name: 'Different' }, idempotencyKey: 'stable-key',
      }, ctx)).rejects.toThrow('IDEMPOTENCY_KEY_REUSED');
      expect(first.success).toBe(true);
      expect(create).toHaveBeenCalledTimes(1);
    });

    it('serializes concurrent retries with the same idempotency key', async () => {
      const create = jest.spyOn(dataAccess.getProvider('MOCK'), 'create');
      let releaseCreate!: () => void;
      let markStarted!: () => void;
      const createGate = new Promise<void>(resolve => { releaseCreate = resolve; });
      const createStarted = new Promise<void>(resolve => { markStarted = resolve; });
      create.mockImplementation(async () => {
        markStarted();
        await createGate;
        return { id: 'single-create' };
      });
      const request = {
        resource: 'Product', operation: 'CREATE' as const, input: { name: 'Same' }, idempotencyKey: 'concurrent-key',
      };
      const first = engine.execute(request, ctx);
      const second = engine.execute(request, ctx);
      await createStarted;
      releaseCreate();
      const [firstResult, secondResult] = await Promise.all([first, second]);
      expect(firstResult).toEqual(secondResult);
      expect(create).toHaveBeenCalledTimes(1);
    });
  });

  describe('executeBatch', () => {
    it('should execute multiple items', async () => {
      const result = await engine.executeBatch(
        {
          resource: 'Product',
          operation: 'CREATE',
          items: [
            { input: { name: 'A' } },
            { input: { name: 'B' } },
          ],
        },
        ctx,
      );
      expect(result.totalItems).toBe(2);
      expect(result.succeeded).toBe(2);
      expect(result.failed).toBe(0);
    });

    it('should reject empty batch', async () => {
      await expect(
        engine.executeBatch(
          { resource: 'Product', operation: 'CREATE', items: [] },
          ctx,
        ),
      ).rejects.toThrow('items');
    });
  });
});
