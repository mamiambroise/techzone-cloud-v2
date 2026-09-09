const SESSION_KEY = 'iam_auth_session';

function getAccessToken() {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const sessionData = JSON.parse(raw);
    if (sessionData.expiresAt && Date.now() > sessionData.expiresAt) {
      localStorage.removeItem(SESSION_KEY);
      return null;
    }
    return sessionData.accessToken || null;
  } catch {
    return null;
  }
}

function clearSession() {
  try {
    localStorage.removeItem(SESSION_KEY);
  } catch {
    // ignore
  }
}

function redirectToLogin() {
  clearSession();
  if (typeof window !== 'undefined') {
    window.location.href = '/login';
  }
}

export async function apiRequest(path, options = {}) {
  const url = `${path.startsWith('/') ? '' : '/'}${path}`;
  const token = getAccessToken();

  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const response = await fetch(url, {
    ...options,
    headers,
    credentials: 'omit',
  });

  let data;
  try {
    data = await response.json();
  } catch {
    data = {};
  }

  if (!response.ok) {
    const error = new Error(data?.message || 'Requête impossible');
    error.status = response.status;
    error.code = data?.code;
    error.details = data?.details;
    error.data = data?.data;

    if (response.status === 401 && error.code && ['TOKEN_REUSE_DETECTED', 'SESSION_REVOKED', 'SESSION_EXPIRED', 'SESSION_IDLE_EXPIRED', 'UNAUTHENTICATED'].includes(error.code)) {
      redirectToLogin();
    }

    throw error;
  }

  return data;
}

export { getAccessToken, clearSession };
