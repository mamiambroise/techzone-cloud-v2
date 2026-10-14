import {
  createCipheriv,
  createDecipheriv,
  createHmac,
  randomBytes,
  scryptSync,
  timingSafeEqual,
} from 'node:crypto';

/**
 * TOTP RFC 6238 (HMAC-SHA1, 30 s, 6 chiffres, fenêtre ±1 pas).
 *
 * Le secret est encodé en Base32 (RFC 4648, sans padding) — format attendu
 * par Google Authenticator / 1Password / Aegis. Le code est vérifié en
 * temps constant et la rejouabilité est contrôlée par l'appelant via
 * `totpStepAt` (un pas déjà consommé ou passé est refusé : anti-replay).
 */

export const TOTP_PERIOD_SECONDS = 30;
export const TOTP_DIGITS = 6;
export const TOTP_ALLOWED_DRIFT = 1;

// ================= Base32 =================

const BASE32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

export function generateTotpSecret(bytes = 20): string {
  const raw = randomBytes(bytes);
  let bits = '';
  for (const byte of raw) {
    bits += byte.toString(2).padStart(8, '0');
  }
  let out = '';
  for (let i = 0; i + 5 <= bits.length; i += 5) {
    out += BASE32_ALPHABET[parseInt(bits.slice(i, i + 5), 2)];
  }
  const rest = bits.length % 5;
  if (rest > 0) {
    out += BASE32_ALPHABET[parseInt(bits.slice(bits.length - rest).padEnd(5, '0'), 2)];
  }
  return out;
}

export function base32Decode(encoded: string): Buffer {
  const clean = encoded.toUpperCase().replace(/[^A-Z2-7]/g, '');
  let bits = '';
  for (const char of clean) {
    const index = BASE32_ALPHABET.indexOf(char);
    if (index < 0) throw new Error('Secret TOTP invalide (base32)');
    bits += index.toString(2).padStart(5, '0');
  }
  const bytes: number[] = [];
  for (let i = 0; i + 8 <= bits.length; i += 8) {
    bytes.push(parseInt(bits.slice(i, i + 8), 2));
  }
  return Buffer.from(bytes);
}

// ================= TOTP =================

export function currentTotpStep(nowSeconds?: number): number {
  const now = nowSeconds ?? Math.floor(Date.now() / 1000);
  return Math.floor(now / TOTP_PERIOD_SECONDS);
}

function hotp(secret: Buffer, counter: number): string {
  const buf = Buffer.alloc(8);
  buf.writeBigUInt64BE(BigInt(counter));
  const digest = createHmac('sha1', secret).update(buf).digest();
  const offset = digest[digest.length - 1] & 0x0f;
  const bin =
    ((digest[offset] & 0x7f) << 24) |
    (digest[offset + 1] << 16) |
    (digest[offset + 2] << 8) |
    digest[offset + 3];
  const mod = 10 ** TOTP_DIGITS;
  return (bin % mod).toString().padStart(TOTP_DIGITS, '0');
}

/** Code TOTP attendu à un pas donné (utile pour les tests et les seeds). */
export function totpAtStep(secret: string, step: number): string {
  return hotp(base32Decode(secret), step);
}

export function currentTotpCode(secret: string, nowSeconds?: number): string {
  return totpAtStep(secret, currentTotpStep(nowSeconds));
}

/**
 * Vérifie un code TOTP avec une fenêtre de dérive ±1 pas.
 * @returns le pas agréé (0, -1 ou +1 par rapport à now) si valide, sinon null.
 * L'appelant persiste ce pas pour interdire le replay du même timestep.
 */
export function totpVerify(
  secret: string,
  code: string,
  nowSeconds?: number,
): { stepDelta: 0 | -1 | 1 } | null {
  if (!secret || typeof code !== 'string') return null;
  const normalized = code.replace(/\s/g, '');
  if (!/^\d{6}$/.test(normalized)) return null;
  const expectedCounter = currentTotpStep(nowSeconds);
  const key = base32Decode(secret);
  const candidate = Buffer.from(normalized, 'utf8');
  for (const delta of [0, -1, 1] as const) {
    const counter = expectedCounter + delta;
    const expected = Buffer.from(hotp(key, counter), 'utf8');
    if (candidate.length === expected.length && timingSafeEqual(candidate, expected)) {
      return { stepDelta: delta };
    }
  }
  return null;
}

/**
 * Garde anti-replay : un pas `step` est refusé s'il est inférieur ou égal au
 * dernier pas consommé (le pas courant peut être rejoué pendant la fenêtre
 * réelle uniquement si aucun vérification n'a eu lieu, mais l'appelant
 * persiste systématiquement le pas consommé, ce qui rend la rejouabilité
 * caduque après la première vérification réussie).
 */
export function totpStepConsumable(step: number, lastUsedStep: number | null): boolean {
  return lastUsedStep === null || step > lastUsedStep;
}

// ================= Chiffrement du secret MFA (at-rest) =================

let cachedKey: Buffer | null = null;

function mfaKey(): Buffer {
  if (cachedKey) return cachedKey;
  const material =
    process.env.MFA_ENCRYPTION_KEY || process.env.JWT_ACCESS_SECRET;
  if (!material) {
    throw new Error(
      'MFA_ENCRYPTION_KEY (ou JWT_ACCESS_SECRET) est requis pour chiffrer les secrets MFA',
    );
  }
  cachedKey = scryptSync(material, 'techzone-iam-mfa-salt', 32);
  return cachedKey;
}

/** Chiffre un secret MFA avec AES-256-GCM. Format: v1:iv:tag:ciphertext (base64url). */
export function encryptSecret(plain: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', mfaKey(), iv);
  const ciphertext = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `v1:${iv.toString('base64url')}:${tag.toString('base64url')}:${ciphertext.toString('base64url')}`;
}

export function decryptSecret(payload: string): string | null {
  try {
    const [version, ivB64, tagB64, dataB64] = payload.split(':');
    if (version !== 'v1' || !ivB64 || !tagB64 || !dataB64) return null;
    const decipher = createDecipheriv(
      'aes-256-gcm',
      mfaKey(),
      Buffer.from(ivB64, 'base64url'),
    );
    decipher.setAuthTag(Buffer.from(tagB64, 'base64url'));
    const plain = Buffer.concat([
      decipher.update(Buffer.from(dataB64, 'base64url')),
      decipher.final(),
    ]);
    return plain.toString('utf8');
  } catch {
    return null;
  }
}

// ================= Challenge MFA opaques =================

/** Token opaque, one-time, jamais dérivable d'un identifiant utilisateur. */
export function generateChallengeToken(): { token: string; tokenHash: string } {
  const token = randomBytes(32).toString('base64url');
  return { token, tokenHash: hashChallengeToken(token) };
}

export function hashChallengeToken(token: string): string {
  return createHmac('sha256', mfaKey()).update(token).digest('hex');
}
