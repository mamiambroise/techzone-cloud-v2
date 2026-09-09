import { apiRequest } from './client';

export async function listDevices() {
  const result = await apiRequest('/api/iam/devices', {
    method: 'GET',
  });

  return result;
}

export async function getDevice(id) {
  const result = await apiRequest(`/api/iam/devices/${id}`, {
    method: 'GET',
  });

  return result;
}

export async function trustDevice(id) {
  const result = await apiRequest(`/api/iam/devices/${id}/trust`, {
    method: 'POST',
  });

  return result;
}

export async function untrustDevice(id) {
  const result = await apiRequest(`/api/iam/devices/${id}/untrust`, {
    method: 'POST',
  });

  return result;
}

export async function blockDevice(id, reason) {
  const result = await apiRequest(`/api/iam/devices/${id}/block`, {
    method: 'POST',
    body: JSON.stringify({ reason: reason || 'USER_BLOCKED' }),
  });

  return result;
}
