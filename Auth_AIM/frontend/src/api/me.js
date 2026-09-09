import { apiRequest } from './client';

export async function getMe() {
  const result = await apiRequest('/api/iam/me', {
    method: 'GET',
  });

  return result;
}

export async function listMySessions() {
  const result = await apiRequest('/api/iam/me/sessions', {
    method: 'GET',
  });

  return result;
}

export async function revokeMySession(id, reason) {
  const result = await apiRequest(`/api/iam/me/sessions/${id}/revoke`, {
    method: 'POST',
    body: JSON.stringify({ reason: reason || 'USER_REVOKE' }),
  });

  return result;
}

export async function revokeMyOtherSessions() {
  const result = await apiRequest('/api/iam/me/sessions/revoke-others', {
    method: 'POST',
  });

  return result;
}
