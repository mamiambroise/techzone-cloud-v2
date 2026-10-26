import { describe, expect, it } from 'vitest';
import { maskSecrets } from './masking.js';

describe('maskSecrets', () => {
  it('masks sensitive fields recursively without changing other values', () => {
    expect(maskSecrets({
      name: 'Workflow',
      credentials: { password: 'private', accessToken: 'private', region: 'eu' },
      steps: [{ authorization: 'Bearer private', retries: 2 }],
    })).toEqual({
      name: 'Workflow',
      credentials: { password: '[MASQUÉ]', accessToken: '[MASQUÉ]', region: 'eu' },
      steps: [{ authorization: '[MASQUÉ]', retries: 2 }],
    });
  });

  it('preserves nulls and primitive values', () => {
    expect(maskSecrets(null)).toBeNull();
    expect(maskSecrets('value')).toBe('value');
  });
});
