import { describe, expect, it } from 'vitest';
import { can, canAny } from './permissions.js';

describe('automation permissions', () => {
  it('checks exact permissions and wildcard grants', () => {
    expect(can(['automation:read'], 'automation:read')).toBe(true);
    expect(can(['automation:read'], 'automation.simulate')).toBe(false);
    expect(can(['*'], 'automation.simulate')).toBe(true);
  });

  it('allows when any requested permission is present', () => {
    expect(canAny(['automation:read'], ['automation:write', 'automation:read'])).toBe(true);
    expect(canAny([], ['automation:read'])).toBe(false);
  });
});
