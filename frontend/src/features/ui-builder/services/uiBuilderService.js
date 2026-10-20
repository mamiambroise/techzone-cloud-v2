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

// Data Runtime is the sole gateway for records rendered by a UI definition.
// Keeping this here makes preview and the eventual runtime use the same API contract.
const runtimeHeaders = proof => proof?.resolutionId ? { 'X-Runtime-Resolution-Id': proof.resolutionId, 'X-Runtime-Origin': 'published' } : {};

export function queryRuntime(resource, query = {}, proof) {
  return api.post('/data-runtime/query', { resource, page: 1, pageSize: 20, ...query }, { headers: runtimeHeaders(proof) }).then(unwrap);
}

export function executeRuntime(request, proof) {
  return api.post('/data-runtime/execute', request, { preserveEnvelope: true, headers: runtimeHeaders(proof) }).then(unwrap);
}

export function getRuntimeRecord(resource, id, proof) {
  return api.get(`/data-runtime/resources/${encodeURIComponent(resource)}/${encodeURIComponent(id)}`, { preserveEnvelope: true, headers: runtimeHeaders(proof) }).then(unwrap);
}
