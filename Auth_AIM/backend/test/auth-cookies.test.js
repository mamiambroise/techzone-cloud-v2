const { test } = require('node:test');
const assert = require('node:assert/strict');
const jwt = require('jsonwebtoken');
const { setAuthCookies, clearAuthCookies } = require('../src/utils/auth-cookies');

test('browser tokens are HttpOnly, scoped and absent from response data', () => {
  const cookies = [];
  const accessToken = jwt.sign({ userId: 'test', sessionId: 'session' }, 'test-only-secret', { expiresIn: 60 });
  const refreshToken = jwt.sign({ sessionId: 'session' }, 'test-only-refresh', { expiresIn: 600 });
  const result = setAuthCookies({ cookie: (...args) => cookies.push(args) }, { accessToken, refreshToken, user: { id: 'test' } });
  assert.deepEqual(result, { user: { id: 'test' } });
  assert.equal(cookies.length, 2);
  assert.equal(cookies[0][0], 'iam_access_token');
  assert.equal(cookies[0][2].path, '/api');
  assert.equal(cookies[1][2].path, '/api/iam/auth');
  for (const [, , options] of cookies) {
    assert.equal(options.httpOnly, true);
    assert.equal(options.sameSite, 'strict');
    assert.ok(options.expires > new Date());
  }
});

test('MFA challenge does not issue a session cookie', () => {
  const result = setAuthCookies({ cookie: () => assert.fail('cookie issued before MFA') }, { mfaRequired: true, challengeToken: 'challenge' });
  assert.equal(result.mfaRequired, true);
});

test('logout clears both cookies at their original paths', () => {
  const cleared = [];
  clearAuthCookies({ clearCookie: (...args) => cleared.push(args) });
  assert.deepEqual(cleared.map(([name, options]) => [name, options.path]), [['iam_access_token', '/api'], ['iam_refresh_token', '/api/iam/auth']]);
});
