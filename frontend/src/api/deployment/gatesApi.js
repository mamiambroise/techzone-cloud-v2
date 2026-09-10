import apiClient from '../client.js';

export function getGates(deploymentId) {
  return apiClient.get(`/api/deployments/${deploymentId}/gates`);
}

export function evaluateGate(deploymentId, body) {
  return apiClient.post(`/api/deployments/${deploymentId}/gates/evaluate`, {
    actor: body.actor,
  });
}

export function approveGate(deploymentId, gateId, body) {
  return apiClient.post(`/api/deployments/${deploymentId}/gates/${gateId}/approve`, {
    approvedBy: body.approvedBy,
    comment: body.comment,
  });
}

export function bypassGate(deploymentId, gateId, body) {
  return apiClient.post(`/api/deployments/${deploymentId}/gates/${gateId}/bypass`, {
    bypassedBy: body.bypassedBy,
    justification: body.justification,
  });
}
