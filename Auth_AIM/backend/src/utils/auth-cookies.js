const jwt = require('jsonwebtoken');

const options = (path) => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict',
  path,
});

function setAuthCookies(res, result) {
  const { accessToken, refreshToken, ...publicResult } = result;
  for (const [name, token, path] of [
    ['iam_access_token', accessToken, '/api'],
    ['iam_refresh_token', refreshToken, '/api/iam/auth'],
  ]) {
    if (token) {
      const expires = new Date(jwt.decode(token).exp * 1000);
      res.cookie(name, token, { ...options(path), expires });
    }
  }
  return publicResult;
}

function clearAuthCookies(res) {
  res.clearCookie('iam_access_token', options('/api'));
  res.clearCookie('iam_refresh_token', options('/api/iam/auth'));
}

module.exports = { setAuthCookies, clearAuthCookies };
