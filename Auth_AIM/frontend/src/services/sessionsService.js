import { listSessions as listSessionsApi, revokeSession as revokeSessionApi } from '../api/sessions';
import { revokeMyOtherSessions as revokeMyOtherSessionsApi } from '../api/me';

function unwrap(result) {
  if (result && result.success && result.data !== undefined) {
    return result.data;
  }
  return result;
}

export async function listSessions() {
  return unwrap(await listSessionsApi({})) || [];
}

export async function revokeSession(id, reason) {
  return unwrap(await revokeSessionApi(id, reason));
}

export async function revokeAllForCurrentUser(reason) {
  return unwrap(await revokeMyOtherSessionsApi(reason));
}
