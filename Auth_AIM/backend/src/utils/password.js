const bcrypt = require('bcrypt');
const crypto = require('crypto');

const SALT_ROUNDS = Number(process.env.BCRYPT_SALT_ROUNDS) || 12;

async function hashPassword(plainPassword) {
  if (!plainPassword || typeof plainPassword !== 'string') {
    throw new Error('Mot de passe invalide pour le hachage');
  }
  return bcrypt.hash(plainPassword, SALT_ROUNDS);
}

async function verifyPassword(plainPassword, hash) {
  if (!plainPassword || !hash) return false;
  return bcrypt.compare(plainPassword, hash);
}

/** Hash déterministe (SHA-256) pour tokens opaques (refresh JWT, recovery codes). */
function hashToken(rawToken) {
  if (!rawToken) throw new Error('Token vide, hachage impossible');
  return crypto.createHash('sha256').update(rawToken).digest('hex');
}

function generateSecureToken(byteLength = 32) {
  return crypto.randomBytes(byteLength).toString('hex');
}

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