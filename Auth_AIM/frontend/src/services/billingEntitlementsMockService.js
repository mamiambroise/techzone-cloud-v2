import { billingEntitlements as initialEntitlements, billingQuotas as initialQuotas } from '../data/mock';

let entitlementsStore = initialEntitlements.map((e) => ({ ...e }));
let quotasStore = initialQuotas.map((q) => ({ ...q }));
let _nextId = Math.max(...initialEntitlements.map((e) => e.id), ...initialQuotas.map((q) => q.id)) + 1;

export function listEntitlements() {
  return entitlementsStore.map((e) => ({ ...e }));
}

export function listQuotas() {
  return quotasStore.map((q) => ({ ...q }));
}

export function getEntitlementsByTenant(tenantId) {
  return entitlementsStore.filter((e) => e.tenantId === tenantId).map((e) => ({ ...e }));
}

export function getQuotasByTenant(tenantId) {
  return quotasStore.filter((q) => q.tenantId === tenantId).map((q) => ({ ...q }));
}

export function resetStore() {
  entitlementsStore = initialEntitlements.map((e) => ({ ...e }));
  quotasStore = initialQuotas.map((q) => ({ ...q }));
  _nextId = Math.max(...initialEntitlements.map((e) => e.id), ...initialQuotas.map((q) => q.id)) + 1;
}
