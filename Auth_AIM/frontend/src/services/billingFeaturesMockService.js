import { billingFeatures as initialFeatures, billingFeatureOverrides as initialOverrides } from '../data/mock';

let featuresStore = initialFeatures.map((f) => ({ ...f, plans: [...(f.plans || [])] }));
let overridesStore = initialOverrides.map((o) => ({ ...o }));
let _nextId = Math.max(...initialFeatures.map((f) => f.id), ...initialOverrides.map((o) => o.id)) + 1;

export function listFeatures() {
  return featuresStore.map((f) => ({ ...f, plans: [...f.plans] }));
}

export function getFeature(code) {
  const found = featuresStore.find((f) => f.code === code);
  return found ? { ...found, plans: [...found.plans] } : null;
}

export function createFeature(data) {
  const feature = { id: _nextId++, code: data.code, name: data.name, status: data.status || 'ACTIVE', measured: !!data.measured, quotaCode: data.quotaCode || null, plans: [...(data.plans || [])], createdAt: new Date().toISOString().slice(0, 10), updatedAt: new Date().toISOString().slice(0, 10) };
  featuresStore = [...featuresStore, feature];
  return { ...feature };
}

export function updateFeature(code, data) {
  const idx = featuresStore.findIndex((f) => f.code === code);
  if (idx < 0) return null;
  featuresStore = featuresStore.map((f, i) => (i === idx ? { ...f, ...data, updatedAt: new Date().toISOString().slice(0, 10) } : f));
  return getFeature(code);
}

export function listOverrides() {
  return overridesStore.map((o) => ({ ...o }));
}

export function addOverride(data) {
  const override = { id: _nextId++, featureCode: data.featureCode, tenantName: data.tenantName, granted: data.granted, date: data.date || new Date().toISOString().slice(0, 10), reason: data.reason, author: data.author || 'Alice Admin' };
  overridesStore = [...overridesStore, override];
  return { ...override };
}

export function resetStore() {
  featuresStore = initialFeatures.map((f) => ({ ...f, plans: [...f.plans] }));
  overridesStore = initialOverrides.map((o) => ({ ...o }));
  _nextId = Math.max(...initialFeatures.map((f) => f.id), ...initialOverrides.map((o) => o.id)) + 1;
}
