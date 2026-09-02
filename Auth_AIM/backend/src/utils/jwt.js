const jwt = require('jsonwebtoken');
const { config } = require('../config/env');

const ACCESS_SECRET = config.JWT_SECRET;
const ACCESS_EXPIRES_IN = config.JWT_ACCESS_EXPIRES_IN || '15m';

if (!ACCESS_SECRET) {
  throw new Error('JWT_SECRET manquant dans la configuration');
}

/**
 * Signe un access token JWT court-vécu.
 * Le payload doit rester minimal : identité + contexte de session,
 * jamais de données métier sensibles (cf. IAM-CDC-06 §156 fail-closed).
 *
 * @param {{ userId: string, sessionId: string, tenantId?: string,
 *           contextVersion?: number, assuranceLevel?: string }} payload
 */
function signAccessToken(payload) {
  return jwt.sign(payload, ACCESS_SECRET, {
    expiresIn: ACCESS_EXPIRES_IN,
    issuer: 'techzone-cloud-iam',
  });
}

/**
 * Vérifie et décode un access token.
 * Lève une erreur si signature invalide ou token expiré
 * (le middleware auth.middleware.js doit traduire ça en 401).
 */
function verifyAccessToken(token) {
  return jwt.verify(token, ACCESS_SECRET, {
    issuer: 'techzone-cloud-iam',
  });
}

/**
 * Décode sans vérifier la signature — usage diagnostic uniquement,
 * jamais pour une décision d'autorisation.
 */
function decodeToken(token) {
  return jwt.decode(token);
}

module.exports = {
  signAccessToken,
  verifyAccessToken,
  decodeToken,
};