const bcrypt = require('bcrypt');
const crypto = require('crypto');
const { config } = require('../config/env');

const SALT_ROUNDS = config.BCRYPT_SALT_ROUNDS || 12;

/**
 * Hash un mot de passe en clair avec bcrypt.
 * Utilisé pour Credential.secretHash (type PASSWORD).
 */
async function hashPassword(plainPassword) {
  if (!plainPassword || typeof plainPassword !== 'string') {
    throw new Error('Mot de passe invalide pour le hachage');
  }
  return bcrypt.hash(plainPassword, SALT_ROUNDS);
}

/**
 * Vérifie un mot de passe en clair contre un hash bcrypt existant.
 */
async function verifyPassword(plainPassword, hash) {
  if (!plainPassword || !hash) return false;
  return bcrypt.compare(plainPassword, hash);
}

/**
 * Hash déterministe (SHA-256) pour les tokens opaques
 * (refresh tokens, recovery codes) : on ne stocke jamais
 * le token en clair, mais on doit pouvoir le retrouver par
 * égalité de hash lors de la vérification (contrairement à bcrypt).
 */
function hashToken(rawToken) {
  if (!rawToken) throw new Error('Token vide, hachage impossible');
  return crypto.createHash('sha256').update(rawToken).digest('hex');
}

/**
 * Génère un token opaque cryptographiquement sûr
 * (utilisé pour refresh tokens et recovery codes).
 * @param {number} byteLength - défaut 32 octets => 64 caractères hex
 */
function generateSecureToken(byteLength = 32) {
  return crypto.randomBytes(byteLength).toString('hex');
}

/**
 * Génère un code de récupération lisible par un humain
 * (ex: MFA recovery codes), format groupé type "ABCD-EFGH-IJKL".
 */
function generateRecoveryCode() {
  const raw = crypto.randomBytes(10).toString('hex').toUpperCase();
  return raw.match(/.{1,4}/g).join('-');
}

module.exports = {
  hashPassword,
  verifyPassword,
  hashToken,
  generateSecureToken,
  generateRecoveryCode,
};