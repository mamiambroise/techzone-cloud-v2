import { isPrivateDestination, validateDolibarrUrl, dolibarrAgents } from './dolibarr-destination';

describe('Dolibarr destination policy', () => {
  const previous = process.env.DOLIBARR_ALLOWED_PRIVATE_ORIGINS;
  beforeEach(() => { delete process.env.DOLIBARR_ALLOWED_PRIVATE_ORIGINS; });
  afterAll(() => { if (previous === undefined) delete process.env.DOLIBARR_ALLOWED_PRIVATE_ORIGINS; else process.env.DOLIBARR_ALLOWED_PRIVATE_ORIGINS = previous; });
  it.each(['http://localhost', 'http://127.0.0.1', 'http://10.1.2.3', 'http://172.16.0.1', 'http://192.168.1.1', 'http://169.254.169.254', 'http://[::1]', 'http://[::ffff:127.0.0.1]', 'file:///etc/passwd', 'https://user:password@example.com', 'https://example.com?key=secret'])('rejects %s', url => {
    expect(() => validateDolibarrUrl(url)).toThrow();
  });
  it('allows only an explicitly configured private origin', () => {
    process.env.DOLIBARR_ALLOWED_PRIVATE_ORIGINS = 'http://127.0.0.1:8080';
    expect(validateDolibarrUrl('http://127.0.0.1:8080/dolibarr').origin).toBe('http://127.0.0.1:8080');
    expect(() => validateDolibarrUrl('http://127.0.0.1:8081')).toThrow();
  });
  it('blocks a hostname resolving to loopback at connection time', async () => {
    const agents = dolibarrAgents(new URL('https://public.example.com'));
    await new Promise<void>(resolve => {
      (agents.httpsAgent.options.lookup as any)('localhost', {}, (error: Error) => { expect(error).toBeDefined(); resolve(); });
    });
    agents.httpAgent.destroy(); agents.httpsAgent.destroy();
  });
  it('classifies public addresses without blocking them', () => { expect(isPrivateDestination('8.8.8.8')).toBe(false); });
});
