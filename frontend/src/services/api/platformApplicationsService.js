import { api } from '../apiClient.js';

const unwrap = (res) => res.data;

export function getApplications() {
  return api.get('/business-manager/applications').then(unwrap);
}
export function createApplication(body) {
  return api.post('/business-manager/applications', body).then(unwrap);
}
export function updateApplication(id, body) {
  return api.patch(`/business-manager/applications/${id}`, body).then(unwrap);
}
export function archiveApplication(id) {
  return api.post(`/business-manager/applications/${id}/archive`).then(unwrap);
}
/** Repasse une application archivée en service. */
export function restoreApplication(id) {
  return api.post(`/business-manager/applications/${id}/restore`).then(unwrap);
}
/**
 * Duplique une application (et, par défaut, sa définition métier).
 * `copyDefinition: false` ne duplique que la coquille applicative.
 */
export function duplicateApplication(id, body = {}) {
  return api.post(`/business-manager/applications/${id}/duplicate`, body).then(unwrap);
}
