// HTTP contract tests with explicit service doubles; no production database writes.
const { test } = require('node:test');
const assert = require('node:assert/strict');
process.env.DATABASE_URL = 'postgresql://test:test@127.0.0.1:1/test';
process.env.JWT_ACCESS_SECRET = 'http-contract-test-access-secret';
process.env.JWT_REFRESH_SECRET = 'http-contract-test-refresh-secret';
process.env.NODE_ENV = 'test';
const { signAccessToken, signRefreshToken } = require('../src/utils/jwt');
const auth = require('../src/services/auth.service');
const sessions = require('../src/services/session.service');
const identities = require('../src/services/identity.service');
const context = require('../src/services/context.service');
const { AppError } = require('../src/utils/response');
const app = require('../src/app');

test('HTTP cookie login/me/refresh/logout, 401, 403 and CSRF contracts', async () => {
  let revoked = false;
  const session = { id: 'test-session', userId: 'test-user', status: 'ACTIVE' };
  const accessToken = signAccessToken({ userId: session.userId, sessionId: session.id });
  const refreshToken = signRefreshToken({ sessionId: session.id });
  auth.login = async () => ({ accessToken, refreshToken, user: { id: session.userId } });
  auth.refresh = async input => { assert.equal(input.refreshToken, refreshToken); return { accessToken, refreshToken }; };
  auth.logout = async () => { revoked = true; };
  sessions.getSessionById = async () => session;
  sessions.assertSessionUsable = async () => { if (revoked) throw new AppError('Revoked', 401, 'SESSION_REVOKED'); };
  sessions.touchSession = async () => {};
  identities.getUserById = async () => ({ id: session.userId });
  context.getContext = async () => ({ status: 'RESOLVED', permissions: [] });
  const server = app.listen(0, '127.0.0.1');
  await new Promise(resolve => server.once('listening', resolve));
  const base = `http://127.0.0.1:${server.address().port}/api/iam`;
  const request = (route, options = {}) => fetch(base + route, options);
  try {
    assert.equal((await request('/me')).status, 401);
    const login = await request('/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ identifier: 'test', password: 'test', deviceFingerprint: 'contract-test' }) });
    assert.equal(login.status, 200);
    const body = await login.json();
    assert.equal(body.data.accessToken, undefined);
    const cookies = login.headers.getSetCookie();
    assert.equal(cookies.length, 2);
    assert.ok(cookies.every(cookie => cookie.includes('HttpOnly') && cookie.includes('SameSite=Strict')));
    const cookie = cookies.map(value => value.split(';')[0]).join('; ');
    assert.equal((await request('/me', { headers: { Cookie: cookie } })).status, 200);
    const denied = await request('/users', { headers: { Cookie: cookie } });
    assert.equal(denied.status, 403);
    assert.ok(denied.headers.get('x-trace-id'));
    const refresh = await request('/auth/refresh', { method: 'POST', headers: { Cookie: cookie, 'Content-Type': 'application/json' }, body: '{}' });
    assert.equal(refresh.status, 200);
    assert.equal((await request('/auth/logout', { method: 'POST', headers: { Cookie: cookie, 'Sec-Fetch-Site': 'cross-site' } })).status, 403);
    const logout = await request('/auth/logout', { method: 'POST', headers: { Cookie: cookie } });
    assert.equal(logout.status, 200);
    assert.equal(logout.headers.getSetCookie().length, 2);
    assert.equal((await request('/me', { headers: { Cookie: cookie } })).status, 401);
  } finally {
    await new Promise(resolve => server.close(resolve));
    await require('../src/config/database').prisma.$disconnect();
  }
});
