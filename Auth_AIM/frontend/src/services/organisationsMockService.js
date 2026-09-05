import { organisations as initialOrgs, tenants as initialTenants } from '../data/mock';

let orgStore = initialOrgs.map((o) => ({ ...o }));
let tenantStore = initialTenants.map((t) => ({ ...t }));
let orgNextId = orgStore.reduce((max, o) => Math.max(max, o.id), 0) + 1;
let tenantNextId = tenantStore.reduce((max, t) => Math.max(max, t.id), 0) + 1;

function nowDate() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function listOrganisations() {
  return orgStore.map((o) => ({ ...o }));
}

export function getOrganisation(id) {
  const found = orgStore.find((o) => o.id === id);
  return found ? { ...found } : null;
}

export function createOrganisation(payload) {
  const created = {
    id: orgNextId++,
    name: (payload.name || '').trim(),
    legalName: (payload.legalName || payload.name || '').trim(),
    code: (payload.code || '').trim() || `ORG-${String(orgNextId).padStart(3, '0')}`,
    type: payload.type || 'SARL',
    country: payload.country || 'France',
    timezone: payload.timezone || 'Europe/Paris',
    status: 'active',
    createdAt: nowDate(),
    tenantCount: 0,
  };

  orgStore = [created, ...orgStore];
  return { ...created };
}

export function updateOrganisation(id, patch) {
  let updated = null;
  orgStore = orgStore.map((o) => {
    if (o.id !== id) return o;
    const merged = { ...o, ...patch };
    updated = merged;
    return merged;
  });
  return updated ? { ...updated } : null;
}

export function setOrganisationStatus(id, status) {
  const next = status === 'active' ? 'active' : status === 'suspended' ? 'suspended' : 'archived';
  return updateOrganisation(id, { status: next });
}

export function deleteOrganisation(id) {
  const before = orgStore.length;
  orgStore = orgStore.filter((o) => o.id !== id);
  tenantStore = tenantStore.filter((t) => t.organisationId !== id);
  return orgStore.length < before;
}

export function listTenants() {
  return tenantStore.map((t) => ({ ...t }));
}

export function getTenantsByOrganisation(organisationId) {
  return tenantStore.filter((t) => t.organisationId === organisationId).map((t) => ({ ...t }));
}

export function getTenant(id) {
  const found = tenantStore.find((t) => t.id === id);
  return found ? { ...found } : null;
}

export function createTenant(payload) {
  const created = {
    id: tenantNextId++,
    name: (payload.name || '').trim(),
    organisationId: payload.organisationId,
    ownerId: payload.ownerId || null,
    ownerName: payload.ownerName || '',
    status: 'ACTIVE',
    plan: payload.plan || 'Standard',
    region: payload.region || 'EU-West',
    createdAt: nowDate(),
  };

  tenantStore = [created, ...tenantStore];

  const org = orgStore.find((o) => o.id === payload.organisationId);
  if (org) {
    orgStore = orgStore.map((o) => (o.id === org.id ? { ...o, tenantCount: (o.tenantCount || 0) + 1 } : o));
  }

  return { ...created };
}

export function updateTenant(id, patch) {
  let updated = null;
  tenantStore = tenantStore.map((t) => {
    if (t.id !== id) return t;
    const merged = { ...t, ...patch };
    updated = merged;
    return merged;
  });
  return updated ? { ...updated } : null;
}

export function setTenantStatus(id, status) {
  const next = status === 'ACTIVE' ? 'ACTIVE' : status === 'SUSPENDED' ? 'SUSPENDED' : 'ARCHIVED';
  return updateTenant(id, { status: next });
}

export function deleteTenant(id) {
  const before = tenantStore.length;
  const tenant = tenantStore.find((t) => t.id === id);
  tenantStore = tenantStore.filter((t) => t.id !== id);

  if (tenant) {
    const org = orgStore.find((o) => o.id === tenant.organisationId);
    if (org && org.tenantCount > 0) {
      orgStore = orgStore.map((o) => (o.id === org.id ? { ...o, tenantCount: Math.max(0, (o.tenantCount || 0) - 1) } : o));
    }
  }

  return tenantStore.length < before;
}

export function getOrganisationTenantCount(organisationId) {
  return tenantStore.filter((t) => t.organisationId === organisationId).length;
}

export function hasActiveOwner(organisationId) {
  return tenantStore.some((t) => t.organisationId === organisationId && t.status === 'ACTIVE');
}

export function resetStore() {
  orgStore = initialOrgs.map((o) => ({ ...o }));
  tenantStore = initialTenants.map((t) => ({ ...t }));
  orgNextId = orgStore.reduce((max, o) => Math.max(max, o.id), 0) + 1;
  tenantNextId = tenantStore.reduce((max, t) => Math.max(max, t.id), 0) + 1;
}
