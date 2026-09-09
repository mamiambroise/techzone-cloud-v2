const SESSION_KEY = 'iam_auth_session';

function generateDeviceFingerprint() {
  const stored = localStorage.getItem('iam_device_fingerprint');
  if (stored) return stored;
  const raw = `${navigator.userAgent}-${screen.width}x${screen.height}-${new Date().getTime()}`;
  let hash = 0;
  for (let i = 0; i < raw.length; i++) {
    const chr = raw.charCodeAt(i);
    hash = (hash << 5) - hash + chr;
    hash = hash & hash;
  }
  const fingerprint = `web-${Math.abs(hash).toString(16)}-${Math.random().toString(36).slice(2, 8)}`;
  try {
    localStorage.setItem('iam_device_fingerprint', fingerprint);
  } catch {
    // ignore storage errors
  }
  return fingerprint;
}

export function getDeviceFingerprint() {
  return generateDeviceFingerprint();
}

async function request(path, options = {}) {
  const url = `/api/iam/auth${path.startsWith('/') ? path : `/${path}`}`;
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  const response = await fetch(url, {
    ...options,
    headers,
    credentials: 'omit',
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message = data?.message || 'Requête impossible';
    const error = new Error(message);
    error.status = response.status;
    error.code = data?.code;
    error.details = data?.details;
    throw error;
  }

  return data;
}

export async function login(identifier, password) {
  const payload = {
    identifier,
    password,
    deviceFingerprint: getDeviceFingerprint(),
  };

  const result = await request('/login', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

  const sessionData = {
    user: result.data.user,
    accessToken: result.data.accessToken,
    refreshToken: result.data.refreshToken,
    session: result.data.session,
    expiresAt: Date.now() + (result.data.expiresIn || 900) * 1000,
    mfaRequired: result.data.mfaRequired || false,
    challengeToken: result.data.challengeToken || null,
  };

  try {
    localStorage.setItem(SESSION_KEY, JSON.stringify(sessionData));
  } catch {
    // ignore storage errors
  }

  return sessionData;
}

export async function refreshToken() {
  const raw = localStorage.getItem(SESSION_KEY);
  if (!raw) {
    throw new Error('Session expirée');
  }

  let sessionData;
  try {
    sessionData = JSON.parse(raw);
  } catch {
    throw new Error('Session invalide');
  }

  if (!sessionData.refreshToken) {
    throw new Error('Refresh token manquant');
  }

  const result = await request('/refresh', {
    method: 'POST',
    body: JSON.stringify({ refreshToken: sessionData.refreshToken }),
  });

  const updated = {
    ...sessionData,
    accessToken: result.data.accessToken,
    refreshToken: result.data.refreshToken,
    expiresAt: Date.now() + (result.data.expiresIn || 900) * 1000,
  };

  try {
    localStorage.setItem(SESSION_KEY, JSON.stringify(updated));
  } catch {
    // ignore storage errors
  }

  return updated;
}

export async function logout() {
  const raw = localStorage.getItem(SESSION_KEY);
  if (raw) {
    try {
      const sessionData = JSON.parse(raw);
      if (sessionData.session?.id) {
        await request('/logout', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${sessionData.accessToken}`,
          },
          body: JSON.stringify({ sessionId: sessionData.session.id }),
        });
      }
    } catch {
      // ignore logout errors
    }
  }

  try {
    localStorage.removeItem(SESSION_KEY);
  } catch {
    // ignore storage errors
  }
}

export async function logoutAll() {
  const raw = localStorage.getItem(SESSION_KEY);
  if (raw) {
    try {
      const sessionData = JSON.parse(raw);
      if (sessionData.session?.id) {
        await request('/logout-all', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${sessionData.accessToken}`,
          },
          body: JSON.stringify({ keepCurrentSession: false }),
        });
      }
    } catch {
      // ignore logout-all errors
    }
  }

  try {
    localStorage.removeItem(SESSION_KEY);
  } catch {
    // ignore storage errors
  }
}

export async function changePassword(currentPassword, newPassword) {
  const raw = localStorage.getItem(SESSION_KEY);
  if (!raw) {
    throw new Error('Session expirée');
  }

  let sessionData;
  try {
    sessionData = JSON.parse(raw);
  } catch {
    throw new Error('Session invalide');
  }

  const result = await request('/change-password', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${sessionData.accessToken}`,
    },
    body: JSON.stringify({ currentPassword, newPassword }),
  });

  return result;
}

export async function getSession() {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const sessionData = JSON.parse(raw);
    if (sessionData.expiresAt && Date.now() > sessionData.expiresAt) {
      localStorage.removeItem(SESSION_KEY);
      return null;
    }
    return sessionData;
  } catch {
    return null;
  }
}

export async function verifyMfaChallenge(challengeToken, mfaMethodId, code) {
  return request('/login/mfa', {
    method: 'POST',
    body: JSON.stringify({ challengeToken, mfaMethodId, code }),
  });
}

export default { login, logout, getSession, refreshToken, verifyMfaChallenge, logoutAll, changePassword };
