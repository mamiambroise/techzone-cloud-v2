// Techzone Cloud — Client-side JWT (HS256) signer.
// Used to obtain a Bearer token accepted by the backend AuthGuard when the
// backend does not expose a /auth/login endpoint. The shared secret MUST match
// the one configured on the backend (default: super-secret-key-change-me).

const DEFAULT_SHARED_SECRET = 'super-secret-key-change-me';
const DEFAULT_TTL_SECONDS = 60 * 60 * 24 * 7; // 7 days

function base64UrlEncode(input) {
  const bytes = typeof input === 'string' ? new TextEncoder().encode(input) : new Uint8Array(input);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  const b64 = btoa(binary);
  return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

async function hmacSha256(secret, data) {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(data));
  return new Uint8Array(sig);
}

export async function signJwt(payload, { secret = DEFAULT_SHARED_SECRET, ttlSeconds = DEFAULT_TTL_SECONDS } = {}) {
  const now = Math.floor(Date.now() / 1000);
  const claims = {
    iat: now,
    exp: now + ttlSeconds,
    ...payload,
  };
  const header = { alg: 'HS256', typ: 'JWT' };
  const headerEncoded = base64UrlEncode(JSON.stringify(header));
  const payloadEncoded = base64UrlEncode(JSON.stringify(claims));
  const signingInput = `${headerEncoded}.${payloadEncoded}`;
  const signature = await hmacSha256(secret, signingInput);
  const signatureEncoded = base64UrlEncode(signature);
  return `${signingInput}.${signatureEncoded}`;
}

export function getSharedSecret() {
  try {
    return import.meta.env.VITE_JWT_SECRET || DEFAULT_SHARED_SECRET;
  } catch {
    return DEFAULT_SHARED_SECRET;
  }
}

export function decodeJwt(token) {
  if (!token) return null;
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  try {
    const padded = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const pad = padded + '='.repeat((4 - (padded.length % 4)) % 4);
    const json = atob(pad);
    return JSON.parse(json);
  } catch {
    return null;
  }
}

export function isJwtExpired(token) {
  const claims = decodeJwt(token);
  if (!claims?.exp) return false;
  return Math.floor(Date.now() / 1000) >= claims.exp;
}