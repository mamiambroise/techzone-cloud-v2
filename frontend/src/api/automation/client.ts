import { api } from '../../services/apiClient.js';

const base = '/automation';

export const automationClient = {
  cockpit: () => api.get(`${base}/cockpit`),
  contract: () => api.get(`${base}/contract`),
  actions: () => api.get(`${base}/actions`),
  rules: () => api.get(`${base}/rules`),
  activeRules: () => api.get(`${base}/rules/active`),
  rule: (code: string) => api.get(`${base}/rules/${encodeURIComponent(code)}`),
  evaluateRules: (context: Record<string, unknown>) => api.post(`${base}/rules/evaluate`, { context }),
  simulateRule: (ruleCode: string, context: Record<string, unknown>) =>
    api.post(`${base}/rules/simulate`, { ruleCode, context }),
  workflows: () => api.get(`${base}/workflows`),
  executions: () => api.get(`${base}/workflows/executions`),
  history: () => api.get(`${base}/history`),
  metrics: () => api.get(`${base}/history/metrics`),
  triggers: () => api.get(`${base}/triggers`),
  schedules: () => api.get(`${base}/schedules`),
  scheduleStatus: () => api.get(`${base}/schedules/status`),
};
