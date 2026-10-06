import { ErpCommandService } from './erp-command.service';

describe('ErpCommandService read contracts', () => {
  const adapter: any = {
    getClients: jest.fn().mockResolvedValue([]),
    getProducts: jest.fn().mockResolvedValue([]),
    getOrders: jest.fn().mockResolvedValue([]),
  };
  const service = new ErpCommandService({} as any, {} as any, {} as any);

  beforeEach(() => jest.clearAllMocks());

  it.each([
    ['customer.read@1', 'getClients'],
    ['product.read@1', 'getProducts'],
    ['order.read@1', 'getOrders'],
  ])('dispatches %s to the adapter', async (key, method) => {
    await expect((service as any).invoke(adapter, { key }, { limit: 7 })).resolves.toEqual([]);
    expect(adapter[method]).toHaveBeenCalledWith({ limit: 7 });
  });
});
