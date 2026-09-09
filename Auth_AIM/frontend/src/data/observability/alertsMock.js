export const obsAlertRules = [
  { id: 'rule-001', code: 'ALERT-HIGH-LATENCY', sourceType: 'METRIC', condition: 'latency > 2000ms', severity: 'HIGH', window: '5m', threshold: 2000, cooldown: '10m', scope: 'api-gateway', enabled: true, notificationPolicyRef: 'np-001' },
  { id: 'rule-002', code: 'ALERT-AUTH-FAILURES', sourceType: 'LOG_PATTERN', condition: 'count(auth_failure) > 10', severity: 'CRITICAL', window: '2m', threshold: 10, cooldown: '5m', scope: 'global', enabled: true, notificationPolicyRef: 'np-001' },
  { id: 'rule-003', code: 'ALERT-SESSION-ANOMALY', sourceType: 'SECURITY_EVENT', condition: 'suspicious_session == true', severity: 'HIGH', window: '1m', threshold: 1, cooldown: '15m', scope: 'global', enabled: true, notificationPolicyRef: 'np-002' },
  { id: 'rule-004', code: 'ALERT-ERROR-RATE', sourceType: 'ERROR_RATE', condition: 'error_rate > 1%', severity: 'MEDIUM', window: '5m', threshold: 1, cooldown: '10m', scope: 'api-gateway', enabled: true, notificationPolicyRef: 'np-001' },
  { id: 'rule-005', code: 'ALERT-TIMEOUT-RATE', sourceType: 'TIMEOUT_RATE', condition: 'timeout_count > 5', severity: 'MEDIUM', window: '5m', threshold: 5, cooldown: '10m', scope: 'api-gateway', enabled: false, notificationPolicyRef: 'np-001' },
  { id: 'rule-006', code: 'ALERT-CUSTOM-SIGNAL', sourceType: 'CUSTOM_REGISTERED_SIGNAL', condition: 'custom_signal == true', severity: 'LOW', window: '1h', threshold: 1, cooldown: '1h', scope: 'tenant:Boutique A', enabled: true, notificationPolicyRef: 'np-003' },
];

export const obsAlertInstances = [
  { id: 'alert-001', ruleId: 'rule-001', code: 'ALERT-HIGH-LATENCY', sourceType: 'METRIC', severity: 'HIGH', status: 'OPEN', condition: 'latency > 2000ms', currentValue: '2300ms', threshold: '2000ms', window: '5m', scope: 'api-gateway', triggeredAt: '2026-09-08 20:30:00Z', acknowledgedAt: null, resolvedAt: null },
  { id: 'alert-002', ruleId: 'rule-002', code: 'ALERT-AUTH-FAILURES', sourceType: 'LOG_PATTERN', severity: 'CRITICAL', status: 'ACKNOWLEDGED', condition: 'count(auth_failure) > 10', currentValue: '15', threshold: '10', window: '2m', scope: 'global', triggeredAt: '2026-09-08 20:01:00Z', acknowledgedAt: '2026-09-08 20:05:00Z', resolvedAt: null },
  { id: 'alert-003', ruleId: 'rule-003', code: 'ALERT-SESSION-ANOMALY', sourceType: 'SECURITY_EVENT', severity: 'HIGH', status: 'OPEN', condition: 'suspicious_session == true', currentValue: '1', threshold: '1', window: '1m', scope: 'global', triggeredAt: '2026-09-08 18:48:00Z', acknowledgedAt: null, resolvedAt: null },
  { id: 'alert-004', ruleId: 'rule-004', code: 'ALERT-ERROR-RATE', sourceType: 'ERROR_RATE', severity: 'MEDIUM', status: 'RESOLVED', condition: 'error_rate > 1%', currentValue: '0.6%', threshold: '1%', window: '5m', scope: 'api-gateway', triggeredAt: '2026-09-08 14:00:00Z', acknowledgedAt: '2026-09-08 14:10:00Z', resolvedAt: '2026-09-08 14:25:00Z' },
  { id: 'alert-005', ruleId: 'rule-005', code: 'ALERT-TIMEOUT-RATE', sourceType: 'TIMEOUT_RATE', severity: 'MEDIUM', status: 'SUPPRESSED', condition: 'timeout_count > 5', currentValue: '0', threshold: '5', window: '5m', scope: 'api-gateway', triggeredAt: '2026-09-08 10:00:00Z', acknowledgedAt: null, resolvedAt: null },
  { id: 'alert-006', ruleId: 'rule-006', code: 'ALERT-CUSTOM-SIGNAL', sourceType: 'CUSTOM_REGISTERED_SIGNAL', severity: 'LOW', status: 'OPEN', condition: 'custom_signal == true', currentValue: '1', threshold: '1', window: '1h', scope: 'tenant:Boutique A', triggeredAt: '2026-09-08 16:00:00Z', acknowledgedAt: null, resolvedAt: null },
];

export const obsAlertStatuses = ['OPEN', 'ACKNOWLEDGED', 'RESOLVED', 'SUPPRESSED'];
export const obsAlertSources = ['METRIC', 'HEALTH', 'LOG_PATTERN', 'SECURITY_EVENT', 'ERROR_RATE', 'TIMEOUT_RATE', 'CUSTOM_REGISTERED_SIGNAL'];
