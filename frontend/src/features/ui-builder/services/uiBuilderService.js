/**
 * UI Builder — service API frontend (contrats backend réels /api/ui-builder/*).
 */
import { api } from '../../../services/apiClient.js';

const unwrap = (res) => res.data;
const root = '/ui-builder';

export function getOverview(applicationVersionId) {
  return api.get(`${root}/overview/${applicationVersionId}`).then(unwrap);
}

export function listPages(applicationVersionId) {
  return api.get(`${root}/pages/${applicationVersionId}`).then(unwrap);
}

export function createPage(body) {
  return api.post(`${root}/pages`, body).then(unwrap);
}

export function updatePage(pageId, body) {
  return api.patch(`${root}/pages/${pageId}`, body).then(unwrap);
}

export function deletePage(pageId) {
  return api.delete(`${root}/pages/${pageId}`).then(unwrap);
}

export function reorderPages(applicationVersionId, pageIds) {
  return api.post(`${root}/pages/${applicationVersionId}/reorder`, { pageIds }).then(unwrap);
}

export function getUiDefinition(applicationVersionId) {
  return api.get(`${root}/uidefinition/${applicationVersionId}`).then(unwrap);
}

export function validateDefinition(applicationVersionId) {
  return api.post(`${root}/validate/${applicationVersionId}`, {}).then(unwrap);
}

export function getTheme(applicationVersionId) {
  return api.get(`${root}/theme/${applicationVersionId}`).then(unwrap);
}

export function saveTheme(applicationVersionId, tokens) {
  return api.put(`${root}/theme`, { applicationVersionId, tokens }).then(unwrap);
}

export function getBusinessContext(applicationVersionId) {
  return api.get(`${root}/business-context/${applicationVersionId}`).then(unwrap);
}
