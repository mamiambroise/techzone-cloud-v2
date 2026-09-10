import { adminActions as initialAdminActions } from '../data/mock';

let store = {
  actions: initialAdminActions.actions.map((a) => ({ ...a })),
  history: initialAdminActions.history.map((h) => ({ ...h })),
};
let _nextHistoryId = store.history.length + 1;

export function listActions() {
  return store.actions.map((a) => ({ ...a }));
}

export function listHistory() {
  return store.history.map((h) => ({ ...h }));
}

export function executeAction(actionId, reason) {
  const action = store.actions.find((a) => a.id === actionId);
  if (!action) throw new Error('Action introuvable');
  if (action.critical && (!reason || !reason.trim())) {
    throw new Error('La raison est obligatoire pour cette action critique');
  }

  const _entry = {
    id: `ah-${String(_nextHistoryId).padStart(2, '0')}`,
    action: action.label,
    actor: 'Alice Admin',
    result: 'SUCCESS',
    timestamp: new Date().toISOString().slice(0, 16).replace('T', ' '),
    reason: reason || '',
  };

  store = {
    ...store,
    history: [_entry, ...store.history],
  };
  _nextHistoryId += 1;
  return { ..._entry };
}

export function resetStore() {
  store = {
    actions: initialAdminActions.actions.map((a) => ({ ...a })),
    history: initialAdminActions.history.map((h) => ({ ...h })),
  };
  _nextHistoryId = store.history.length + 1;
}
