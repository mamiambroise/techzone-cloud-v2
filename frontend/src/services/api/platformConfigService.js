import { api } from '../apiClient.js';

const unwrap = (res) => res.data;

export function getConfigs() {
  return api.get('/business-manager/configurations').then(unwrap);
}
export function createConfig(body) {
  return api.post('/business-manager/configurations', body).then(unwrap);
}
export function updateConfig(id, body) {
  return api.patch(`/business-manager/configurations/${id}`, body).then(unwrap);
}
export function getEffective(params) {
  const { applicationId, applicationVersionId, environmentId } = params;
  return api.get(`/business-manager/configurations/effective/${applicationId}/${applicationVersionId}/${environmentId}`).then(unwrap);
}
