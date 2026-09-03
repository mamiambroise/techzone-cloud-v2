const MOCK_USERS = [
  { id: 1, username: 'admin@gmail.com', password: 'admin123', displayName: 'Administrateur' },
  { id: 2, username: 'user', password: 'user123', displayName: 'Utilisateur' },
];

const SESSION_KEY = 'iam_auth_session';

function delay(ms = 500) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function login(username, password) {
  await delay(500);

  if (!username || !password) {
    const error = new Error('Identifiants requis');
    error.status = 400;
    throw error;
  }

  const user = MOCK_USERS.find(
    (u) => u.username === username && u.password === password
  );

  if (!user) {
    const error = new Error('Identifiants invalides');
    error.status = 401;
    throw error;
  }

  const token = `mock-token-${user.id}-${Date.now()}`;

  const session = {
    user: { id: user.id, username: user.username, displayName: user.displayName },
    token,
    expiresAt: Date.now() + 24 * 60 * 60 * 1000,
  };

  try {
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  } catch {
    // ignore storage errors
  }

  return { user: session.user, token: session.token };
}

export async function logout() {
  await delay(200);
  try {
    localStorage.removeItem(SESSION_KEY);
  } catch {
    // ignore storage errors
  }
}

export async function getSession() {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const session = JSON.parse(raw);
    if (session.expiresAt && Date.now() > session.expiresAt) {
      localStorage.removeItem(SESSION_KEY);
      return null;
    }
    return session;
  } catch {
    return null;
  }
}

export default { login, logout, getSession };
