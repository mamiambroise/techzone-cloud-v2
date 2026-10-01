# À reporter dans `services/apiClient.js` (automationService)

`history` doit maintenant transmettre les paramètres (page, pageSize, q, status, workflowCode),
et `historyDetail` est nouveau. Remplacez `api` par le nom réel de votre instance axios.

```js
history: (params) => api.get('/api/automation/history', { params }),
historyDetail: (executionId) =>
  api.get(`/api/automation/history/${encodeURIComponent(executionId)}`),
```
