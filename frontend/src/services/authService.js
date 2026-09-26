import { api, authApi } from './apiClient.js';

export const iamAuthService = {
  login: (body) => authApi.post('/auth/login', body),
  verifyMfa: (body) => authApi.post('/auth/login/mfa', body),
  refresh: () => authApi.post('/auth/refresh'),
  logout: () => authApi.post('/auth/logout'),
  logoutAll: (body) => authApi.post('/auth/logout-all', body),
  me: () => authApi.get('/me'),
  register: (body) => authApi.post('/auth/register', body),
  forgotPassword: (body) => authApi.post('/auth/forgot-password', body),
  resetPassword: (body) => authApi.post('/auth/reset-password', body),
  changePassword: (body) => authApi.post('/auth/change-password', body),
  getPublicConfig: () => api.get('/config/public'),
};

export async function getDeviceFingerprint() {
  try {
    const stored = localStorage.getItem('iam_device_fingerprint');
    if (stored) return stored;
    const raw = `${navigator.userAgent}-${screen.width}x${screen.height}-${Date.now()}`;
    let hash = 0;
    for (let i = 0; i < raw.length; i++) {
      const chr = raw.charCodeAt(i);
      hash = (hash << 5) - hash + chr;
      hash = hash & hash;
    }
    const fingerprint = `web-${Math.abs(hash).toString(36)}-${Math.random()
      .toString(36)
      .slice(2, 8)}`;
    localStorage.setItem('iam_device_fingerprint', fingerprint);
    return fingerprint;
  } catch {
    return `web-emergency-${Date.now().toString(36)}`;
  }
}

export const healthService = {
  check: () => api.get('/').catch(() => api.get('/config/public')),
};
