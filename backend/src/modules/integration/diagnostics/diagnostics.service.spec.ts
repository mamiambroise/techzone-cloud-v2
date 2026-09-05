import { DiagnosticsService } from './diagnostics.service';

describe('DiagnosticsService - Secret Redaction', () => {
  describe('redactText', () => {
    it('should redact password fields', () => {
      const input = '{"password": "supersecret123"}';
      const result = DiagnosticsService.redactText(input);
      expect(result).not.toContain('supersecret123');
      expect(result).toContain('[REDACTED]');
    });

    it('should redact token fields', () => {
      const input = '{"token": "abc123def456ghi789"}';
      const result = DiagnosticsService.redactText(input);
      expect(result).not.toContain('abc123def456ghi789');
    });

    it('should redact Bearer tokens', () => {
      const input = 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9';
      const result = DiagnosticsService.redactText(input);
      expect(result).not.toContain('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9');
      expect(result).toContain('[REDACTED]');
    });

    it('should redact long hex-like strings (32+ chars)', () => {
      const input = 'api_key=abcdefghijklmnopqrstuvwxyz123456';
      const result = DiagnosticsService.redactText(input);
      expect(result).not.toContain('abcdefghijklmnopqrstuvwxyz123456');
    });

    it('should not modify short strings', () => {
      const input = 'short value';
      const result = DiagnosticsService.redactText(input);
      expect(result).toBe('short value');
    });
  });

  describe('redactDeep', () => {
    it('should redact known secret keys recursively', () => {
      const input = {
        user: 'john',
        password: 'secret123',
        nested: {
          apiKey: 'abc123def456',
          data: 'safe-value',
        },
      };

      const result = DiagnosticsService.redactDeep(input);

      expect(result.password).toBe('[REDACTED]');
      expect(result.nested.apiKey).toBe('[REDACTED]');
      expect(result.nested.data).toBe('safe-value');
      expect(result.user).toBe('john');
    });

    it('should redact secrets in arrays', () => {
      const input = [
        { password: 'secret1' },
        { password: 'secret2' },
      ];

      const result = DiagnosticsService.redactDeep(input);

      expect(result[0].password).toBe('[REDACTED]');
      expect(result[1].password).toBe('[REDACTED]');
    });

    it('should handle null and primitive values', () => {
      expect(DiagnosticsService.redactDeep(null)).toBe(null);
      expect(DiagnosticsService.redactDeep(42)).toBe(42);
      expect(DiagnosticsService.redactDeep('text')).toBe('text');
    });
  });
});
