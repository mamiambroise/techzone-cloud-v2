import { WebhookSignatureService } from './webhook-signature.service';

describe('WebhookSignatureService Contract', () => {
  let service: WebhookSignatureService;

  beforeEach(() => {
    service = new WebhookSignatureService();
  });

  it('should expose a signature generation and verification service', () => {
    expect(service).toBeDefined();
  });

  it('should generate and verify a valid signature', () => {
    const payload = JSON.stringify({ event: 'test', data: { id: 1 } });
    const secret = 'my-secret-key';

    const signature = service.generateSignature(payload, secret);
    const result = service.verifySignature(payload, signature, secret);

    expect(result.valid).toBe(true);
  });

  it('should reject invalid signature', () => {
    const payload = JSON.stringify({ event: 'test' });
    const result = service.verifySignature(payload, 'invalid-sig', 'secret');

    expect(result.valid).toBe(false);
  });

  it('should reject missing signature', () => {
    const result = service.verifySignature('payload', '', 'secret');
    expect(result.valid).toBe(false);
  });

  it('should reject empty payload', () => {
    expect(service.validatePayload(null)).toBe(false);
    expect(service.validatePayload(undefined)).toBe(false);
    expect(service.validatePayload('')).toBe(false);
    expect(service.validatePayload({})).toBe(false);
  });

  it('should accept valid payload object', () => {
    expect(service.validatePayload({ key: 'value' })).toBe(true);
  });

  it('should reject replay attacks with old timestamps', () => {
    const payload = 'test-payload';
    const secret = 'secret';
    const oldTimestamp = Math.floor(Date.now() / 1000) - 600;
    const signature = `t=${oldTimestamp},v1=deadbeef`;

    const result = service.verifySignature(payload, signature, secret, 'sha256', 300);
    expect(result.valid).toBe(false);
    expect(result.reason).toContain('replay');
  });
});
