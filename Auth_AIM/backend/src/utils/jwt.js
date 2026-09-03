const jwt = require('jsonwebtoken');
const config = require('../config/env');

function signAccessToken(payload) {
  return jwt.sign(payload, config.jwt.accessSecret, {
    expiresIn: config.jwt.accessTtl,
    issuer: 'techzone-cloud-iam',
  });
}

function verifyAccessToken(token) {
  return jwt.verify(token, config.jwt.accessSecret, {
    issuer: 'techzone-cloud-iam',
  });
}

function signRefreshToken(payload) {
  return jwt.sign(payload, config.jwt.refreshSecret, {
    expiresIn: config.jwt.refreshTtl,
    issuer: 'techzone-cloud-iam',
  });
}

function verifyRefreshToken(token) {
  return jwt.verify(token, config.jwt.refreshSecret, {
    issuer: 'techzone-cloud-iam',
  });
}

function signMfaChallengeToken(payload) {
  return jwt.sign({ ...payload, purpose: 'mfa_challenge' }, config.jwt.accessSecret, {
    expiresIn: '5m',
    issuer: 'techzone-cloud-iam',
  });
}

function verifyMfaChallengeToken(token) {
  const decoded = jwt.verify(token, config.jwt.accessSecret, { issuer: 'techzone-cloud-iam' });
  if (decoded.purpose !== 'mfa_challenge') {
    throw new Error('Token de challenge invalide');
  }
  return decoded;
}

function decodeToken(token) {
  return jwt.decode(token);
}

module.exports = {
  signAccessToken,
  verifyAccessToken,
  signRefreshToken,
  verifyRefreshToken,
  signMfaChallengeToken,
  verifyMfaChallengeToken,
  decodeToken,
};