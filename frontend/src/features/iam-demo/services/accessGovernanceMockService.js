import { accessGovernance as initialAccessGovernance } from '../data/mock';

let store = initialAccessGovernance;
let _reviewIdCounter = store.reviews.length + 1;

export function listRoles() {
  return store.roles.map((r) => ({ ...r }));
}

export function listReviews() {
  return store.reviews.map((r) => ({ ...r }));
}

export function approveReview(id) {
  store = {
    ...store,
    reviews: store.reviews.map((r) => (r.id === id ? { ...r, status: 'approved' } : r)),
  };
  const updated = store.reviews.find((r) => r.id === id);
  return updated ? { ...updated } : null;
}

export function revokeReview(id, reason) {
  if (!reason || !reason.trim()) throw new Error('La raison est obligatoire');
  store = {
    ...store,
    reviews: store.reviews.map((r) => (r.id === id ? { ...r, status: 'revoked', reason } : r)),
  };
  const updated = store.reviews.find((r) => r.id === id);
  return updated ? { ...updated } : null;
}

export function resetStore() {
  store = initialAccessGovernance;
  reviewIdCounter = store.reviews.length + 1;
}
