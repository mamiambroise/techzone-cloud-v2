import { RedactionService } from './redaction.service';

describe('RedactionService', () => {
  const service = new RedactionService();

  it('redacts nested secrets and connection-string passwords', () => {
    const result = service.redact({ authorization: 'Bearer very-secret', nested: { apiKey: 'key', databaseUrl: 'postgres://user:password@db/app' } });
    expect(result).toEqual({ authorization: '[REDACTED]', nested: { apiKey: '[REDACTED]', databaseUrl: '[REDACTED]' } });
  });

  it('redacts a bearer token embedded in an error message', () => {
    expect(service.redact('upstream rejected Bearer abc.def.ghi')).toBe('upstream rejected Bearer [REDACTED]');
  });
});
