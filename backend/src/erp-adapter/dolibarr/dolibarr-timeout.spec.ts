import { createServer, Server } from 'node:http';
import { AddressInfo } from 'node:net';
import { DolibarrAdapter } from './dolibarr.adapter';

describe('Dolibarr real transport timeout and retry policy', () => {
  let server: Server;
  let baseUrl: string;
  let calls: number;
  let mode: 'pending' | 'forbidden' | 'unavailable' | 'stock' | 'missing-stock';
  const previous = process.env.DOLIBARR_ALLOWED_PRIVATE_ORIGINS;
  beforeAll(async () => {
    server = createServer((_req, res) => {
      calls++;
      if (mode === 'pending') return;
      if (mode === 'stock' || mode === 'missing-stock') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify([{ id: 42, ...(mode === 'stock' ? { stock_reel: 0 } : {}) }]));
        return;
      }
      res.writeHead(mode === 'forbidden' ? 403 : 503, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: { message: 'Forbidden' } }));
    });
    await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve));
    baseUrl = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
    process.env.DOLIBARR_ALLOWED_PRIVATE_ORIGINS = baseUrl;
  });
  beforeEach(() => { calls = 0; });
  afterAll(async () => {
    server.closeAllConnections();
    await new Promise<void>(resolve => server.close(() => resolve()));
    if (previous === undefined) delete process.env.DOLIBARR_ALLOWED_PRIVATE_ORIGINS; else process.env.DOLIBARR_ALLOWED_PRIVATE_ORIGINS = previous;
  });
  function adapter() {
    const value = new DolibarrAdapter();
    value.configure({ baseUrl, apiKey: 'test-only-key', timeout: 100, retryAttempts: 1, retryDelay: 0 });
    return value;
  }
  it.each(['getClients', 'getProducts', 'getOrders', 'getInvoices', 'getStocks'] as const)('%s terminates when the provider never responds', async method => {
    mode = 'pending'; const started = Date.now();
    await expect(adapter()[method]()).rejects.toMatchObject({ code: 'TIMEOUT' });
    expect(Date.now() - started).toBeLessThan(2500);
    expect(calls).toBeLessThanOrEqual(2);
  });
  it('never retries a provider permission refusal', async () => {
    mode = 'forbidden';
    await expect(adapter().getOrders()).rejects.toMatchObject({ code: 'FORBIDDEN', httpStatus: 403 });
    expect(calls).toBe(1);
  });
  it('preserves a real zero stock without manufacturing a timestamp', async () => {
    mode = 'stock';
    await expect(adapter().getStocks()).resolves.toEqual([{ productId: '42', currentStock: 0 }]);
  });
  it('does not manufacture zero when the provider omits stock', async () => {
    mode = 'missing-stock';
    await expect(adapter().getStocks()).rejects.toMatchObject({ code: 'INTEGRATION_PAYLOAD_INVALID' });
  });
  it('never retries a non-idempotent creation on 503', async () => {
    mode = 'unavailable';
    await expect(adapter().createClient({ nom: 'Test', email: 'test@example.invalid' })).rejects.toBeDefined();
    expect(calls).toBe(1);
  });
});
