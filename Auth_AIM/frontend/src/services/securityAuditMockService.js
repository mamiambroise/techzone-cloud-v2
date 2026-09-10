import { securityAudit as initialSecurityAudit } from '../data/mock';

let store = {
  events: initialSecurityAudit.events.map((e) => ({ ...e })),
  auditTrail: initialSecurityAudit.auditTrail.map((a) => ({ ...a })),
};

export function listSecurityEvents() {
  return store.events.map((e) => ({ ...e }));
}

export function listAuditTrail() {
  return store.auditTrail.map((a) => ({ ...a }));
}

export function markUnderInvestigation(id) {
  store = {
    ...store,
    events: store.events.map((e) => (e.id === id ? { ...e, investigation: true } : e)),
  };
  const updated = store.events.find((e) => e.id === id);
  return updated ? { ...updated } : null;
}

export function resetStore() {
  store = {
    events: initialSecurityAudit.events.map((e) => ({ ...e })),
    auditTrail: initialSecurityAudit.auditTrail.map((a) => ({ ...a })),
  };
}
