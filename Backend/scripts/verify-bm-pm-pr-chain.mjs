const base = process.env.API_BASE_URL ?? 'http://localhost:3002';

async function call(path, method = 'GET', body, token) {
  const response = await fetch(`${base}${path}`, {
    method,
    headers: {
      Accept: 'application/json',
      ...(body ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const payload = await response.json();
  if (!response.ok) throw new Error(`${method} ${path}: ${response.status} ${JSON.stringify(payload)}`);
  return payload.data ?? payload;
}

const suffix = Date.now().toString(36);
const session = await call('/api/v1/auth/session', 'POST', { email: 'admin@techzone.io' });
const token = session.accessToken;

const application = await call('/api/v1/business-manager/applications', 'POST', {
  code: `chain-${suffix}`,
  name: `BM PM PR chain ${suffix}`,
}, token);
const businessVersion = await call(`/api/v1/business-manager/applications/${application.id}/versions`, 'POST', {
  versionNumber: '1.0.0',
  comment: 'Contract input for the automated BM → PM → PR chain',
}, token);

const pack = await call('/api/pack-manager/packs', 'POST', { code: `chain-${suffix}`, name: `Chain pack ${suffix}` }, token);
const version = await call(`/api/pack-manager/packs/${pack.id}/versions`, 'POST', { versionNumber: '1.0.0', label: 'Chain release' }, token);
const module = await call(`/api/pack-manager/versions/${version.id}/modules`, 'POST', { code: 'inventory', name: 'Inventory', displayOrder: 1 }, token);
const feature = await call(`/api/pack-manager/versions/${version.id}/features`, 'POST', { code: 'stock-view', name: 'Stock view', moduleId: module.id }, token);
const capability = await call('/api/pack-manager/capabilities', 'POST', { code: `stock.read.${suffix}`, name: 'Read stock' }, token);
await call(`/api/pack-manager/features/${feature.id}/capabilities`, 'POST', { capabilityId: capability.id, relationType: 'PROVIDES' }, token);
await call(`/api/pack-manager/versions/${version.id}/dependencies`, 'POST', { sourceType: 'MODULE', sourceId: module.id, targetType: 'FEATURE', targetRef: 'stock-view', required: true }, token);
await call(`/api/pack-manager/versions/${version.id}/rules`, 'POST', { code: 'pro-stock', name: 'PRO stock', targetType: 'FEATURE', targetId: feature.id, effect: 'ENABLE', priority: 10, expression: { field: 'subscription.plan', operator: 'EQ', value: 'PRO' } }, token);

const validation = await call(`/api/pack-manager/versions/${version.id}/validate`, 'POST', undefined, token);
const manifest = await call(`/api/pack-manager/versions/${version.id}/manifest`, 'POST', undefined, token);
const publication = await call(`/api/pack-manager/versions/${version.id}/publish`, 'POST', undefined, token);
const resolution = await call('/api/runtime/resolve', 'POST', {
  applicationId: application.id,
  businessVersionId: businessVersion.id,
  packCode: pack.code,
  packVersion: version.versionNumber,
  environment: 'PROD',
  context: { subscription: { plan: 'PRO', status: 'ACTIVE' } },
}, token);
const effective = await call(`/api/runtime/resolutions/${resolution.resolutionId}/effective-manifest`, 'GET', undefined, token);

const checks = {
  validation: validation.status === 'VALID',
  manifest: manifest.status === 'VALID',
  publication: publication.status === 'PUBLISHED',
  resolution: resolution.status === 'RESOLVED',
  effective: effective.status === 'VALID' && effective.executable === true,
  businessComposition: effective.content?.businessConfiguration?.applicationId === application.id,
};
if (Object.values(checks).some((value) => !value)) throw new Error(`Chain verification failed: ${JSON.stringify(checks)}`);

console.log(JSON.stringify({ checks, applicationId: application.id, businessVersionId: businessVersion.id, packId: pack.id, packVersionId: version.id, resolutionId: resolution.resolutionId, effectiveManifestId: effective.id, effectiveManifestHash: effective.manifestHash }, null, 2));
