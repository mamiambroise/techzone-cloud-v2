import { apiRequest } from './client';

export async function listSessions({ userId = '', status = '' } = {}) {
  const params = new URLSearchParams();
  if (userId) params.set('userId', String(userId));
  if (status) params.set('status', status);

  const query = params.toString();
  const result = await apiRequest(`/api/iam/sessions${query ? `?${query}` : ''}`, {
    method: 'GET',
  });

  return result;
}

export async function getSession(id) {
  const result = await apiRequest(`/api/iam/sessions/${id}`, {
    method: 'GET',
  });

  return result;
}

export async function revokeSession(id, reason) {
  const result = await apiRequest(`/api/iam/sessions/${id}/revoke`, {
    method: 'POST',
    body: JSON.stringify({ reason: reason || 'ADMIN_REVOKE' }),
  });

  return result;
}

export async function revokeAllForUser(userId, reason) {
  const result = await apiRequest(`/api/iam/users/${userId}/sessions/revoke-all`, {
    method: 'POST',
    body: JSON.stringify({ reason: reason || 'ADMIN_REVOKE_ALL' }),
  });

  return result;
}

export async function revokeByDevice(deviceId, reason) {
  const result = await apiRequest(`/api/iam/devices/${deviceId}/sessions/revoke`, {
    method: 'POST',
    body: JSON.stringify({ reason: reason || 'DEVICE_REVOKE' }),
  });

  return result;
}
