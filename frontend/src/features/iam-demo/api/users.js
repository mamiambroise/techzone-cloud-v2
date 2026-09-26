import { apiRequest } from './client';

export async function listUsers({ status = '', search = '' } = {}) {
  const params = new URLSearchParams();
  if (status) params.set('status', status);
  if (search) params.set('search', search);

  const query = params.toString();
  const result = await apiRequest(`/api/iam/users${query ? `?${query}` : ''}`, {
    method: 'GET',
  });

  return result;
}

export async function getUser(id) {
  const result = await apiRequest(`/api/iam/users/${id}`, {
    method: 'GET',
  });

  return result;
}

export async function updateUser(id, patch) {
  const result = await apiRequest(`/api/iam/users/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(patch),
  });

  return result;
}

async function statusAction(id, action, reason) {
  const result = await apiRequest(`/api/iam/users/${id}/${action}`, {
    method: 'POST',
    body: JSON.stringify({ reason: reason || null }),
  });

  return result;
}

export async function activateUser(id, reason) {
  return statusAction(id, 'activate', reason);
}

export async function suspendUser(id, reason) {
  return statusAction(id, 'suspend', reason);
}

export async function lockUser(id, reason) {
  return statusAction(id, 'lock', reason);
}

export async function unlockUser(id, reason) {
  return statusAction(id, 'unlock', reason);
}

export async function disableUser(id, reason) {
  return statusAction(id, 'disable', reason);
}

export async function archiveUser(id, reason) {
  return statusAction(id, 'archive', reason);
}
