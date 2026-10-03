import { encryptErpKey, resolveErpKey, safeErpRegistry } from './erp-credentials';

describe('ERP credential isolation and public serialization', () => {
  const previous = process.env.ERP_CREDENTIAL_ENCRYPTION_KEY;
  beforeEach(() => { process.env.ERP_CREDENTIAL_ENCRYPTION_KEY = 'ab'.repeat(32); });
  afterAll(() => { if (previous === undefined) delete process.env.ERP_CREDENTIAL_ENCRYPTION_KEY; else process.env.ERP_CREDENTIAL_ENCRYPTION_KEY = previous; });
  it('encrypts with tenant authenticated data and rejects another tenant', () => {
    const encryptedApiKey = encryptErpKey('test-secret', 'tenant-a');
    expect(encryptedApiKey).not.toContain('test-secret');
    expect(resolveErpKey({ encryptedApiKey }, 'tenant-a')).toBe('test-secret');
    expect(() => resolveErpKey({ encryptedApiKey }, 'tenant-b')).toThrow();
  });
  it('does not return legacy secrets or ciphertext in registry capabilities', () => {
    const view = safeErpRegistry({ id: '1', capabilities: { apiKey: 'test-secret', encryptedApiKey: 'ciphertext', password: 'private', token: 'private', entity: 2 } });
    expect(view.capabilities).toMatchObject({ entity: 2, credentialStatus: 'CONFIGURED' });
    expect(JSON.stringify(view)).not.toMatch(/test-secret|ciphertext|private/);
  });
  it('rejects storage when the server encryption key is missing', () => {
    delete process.env.ERP_CREDENTIAL_ENCRYPTION_KEY;
    expect(() => encryptErpKey('test-secret', 'tenant-a')).toThrow();
  });
});
