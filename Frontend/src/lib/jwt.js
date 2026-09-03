// Client-side JWT inspection only. Token issuance and signing are exclusively
// owned by the backend; no signing key is embedded in the browser bundle.

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
