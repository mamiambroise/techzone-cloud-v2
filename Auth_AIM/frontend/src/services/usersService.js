import {
  listUsers as listUsersApi,
  getUser as getUserApi,
  updateUser as updateUserApi,
  activateUser,
  suspendUser,
  lockUser,
  unlockUser,
  disableUser,
  archiveUser,
} from '../api/users';

import { createUser as createUserMock, deleteUser as deleteUserMock } from '../services/usersMockService';

function unwrap(result) {
  if (result && result.success && result.data !== undefined) {
    return result.data;
  }
  return result;
}

export async function listUsers() {
  try {
    const result = await listUsersApi({});
    const data = unwrap(result);
    if (Array.isArray(data)) return data;
  } catch {
    // ignore API errors and fall back to mock
  }
  return createUserMock.listUsers ? [] : [];
}

export async function getUser(id) {
  try {
    const result = await getUserApi(id);
    return unwrap(result);
  } catch {
    return null;
  }
}

export async function createUser(payload) {
  return createUserMock(payload);
}

export async function updateUser(id, patch) {
  try {
    const result = await updateUserApi(id, patch);
    return unwrap(result);
  } catch {
    return null;
  }
}

export async function setUserStatus(id, status) {
  const map = {
    active: activateUser,
    suspended: suspendUser,
    locked: lockUser,
    unlocked: unlockUser,
    disabled: disableUser,
    archived: archiveUser,
  };
  const fn = map[status] || activateUser;
  try {
    const result = await fn(id);
    return unwrap(result);
  } catch {
    return null;
  }
}

export async function deleteUser(id) {
  return deleteUserMock(id);
}

export async function resetStore() {
  // no-op for real API
}
