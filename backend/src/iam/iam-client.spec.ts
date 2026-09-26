import { ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { resolveIamPrincipal } from './iam-client';

describe('IAM authority contract', () => {
  const originalFetch = global.fetch;
  afterEach(() => { global.fetch = originalFetch; });
  it('refuses an unresolved context even when a route has no permission metadata', async () => {
    global.fetch = jest.fn()
      .mockResolvedValueOnce({ ok: true, json: async () => ({ data: { valid: true, session: { id: 'session', userId: 'user' } } }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ data: { status: 'PARTIAL' } }) });
    await expect(resolveIamPrincipal('test-token')).rejects.toBeInstanceOf(ForbiddenException);
  });
  it('refuses revoked sessions before context resolution', async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => ({ data: { valid: false } }) });
    await expect(resolveIamPrincipal('test-token')).rejects.toBeInstanceOf(UnauthorizedException);
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });
});
