import { ErpResourceCatalogService } from './erp-resource-catalog.service';

const tenantId = '00000000-0000-0000-0000-000000000001';

function build() {
  const prisma: any = {
    configuration: { findFirst: jest.fn().mockResolvedValue(null) },
    $transaction: jest.fn(),
  };
  const registry: any = {
    getActiveForTenant: jest.fn().mockResolvedValue({
      id: 'connector-a', tenantId, code: 'dolibarr_wifi', type: 'DOLIBARR', status: 'active', healthStatus: 'AVAILABLE',
      capabilities: {
        capabilities: { 'customer.read': 'AVAILABLE', 'invoice.read': 'MODULE_DISABLED', 'payment.create': 'NOT_SUPPORTED' },
        capabilityEvidence: { 'invoice.read': 'HTTP 403' }, lastCapabilityCheck: '2026-10-06T00:00:00.000Z', providerVersion: '23.0.3', encryptedApiKey: 'masked',
      },
    }),
  };
  return { service: new ErpResourceCatalogService(prisma, registry), prisma, registry };
}

describe('ErpResourceCatalogService', () => {
  it('resolves the current tenant connector without leaking secrets or connector ids', async () => {
    const { service, registry } = build();
    const catalog = await service.getCatalog({ tenantId, actorId: 'actor-a' });
    expect(registry.getActiveForTenant).toHaveBeenCalledWith({ tenantId, actorId: 'actor-a' });
    expect(catalog.connector).toEqual(expect.objectContaining({ code: 'dolibarr_wifi', credentialStatus: 'CONFIGURED' }));
    expect(JSON.stringify(catalog)).not.toContain('connector-a');
    expect(JSON.stringify(catalog)).not.toContain('encryptedApiKey');
    expect(catalog.resources.find((resource) => resource.key === 'customer')).toEqual(expect.objectContaining({ platformAllowed: true, providerStatus: 'AVAILABLE', effectiveStatus: 'AVAILABLE' }));
    expect(catalog.resources.find((resource) => resource.key === 'invoice')).toEqual(expect.objectContaining({ providerStatus: 'MODULE_DISABLED', effectiveStatus: 'MODULE_DISABLED' }));
    expect(catalog.resources.find((resource) => resource.key === 'category')).toEqual(expect.objectContaining({ effectiveStatus: 'NOT_IMPLEMENTED', platformAllowed: true }));
  });

  it('persists a platform policy change and emits an audit event', async () => {
    const { service, prisma } = build();
    const tx: any = {
      configuration: { create: jest.fn().mockResolvedValue({ id: 'policy', updatedAt: new Date('2026-10-06T00:00:00.000Z') }) },
      auditEvent: { create: jest.fn().mockResolvedValue({}) },
    };
    prisma.$transaction.mockImplementation((callback: any) => callback(tx));
    await expect(service.setPlatformAllowed('customer', false, 'platform-admin')).resolves.toEqual(expect.objectContaining({ key: 'customer', platformAllowed: false }));
    expect(tx.auditEvent.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ action: 'ERP_RESOURCE_POLICY_CHANGED', actorId: 'platform-admin', before: { platformAllowed: true }, after: { platformAllowed: false } }) }));
  });

  it.each([
    ['AVAILABLE', true, 'ERP_OPERATION_AVAILABLE'],
    ['PERMISSION_DENIED', false, 'ERP_PERMISSION_DENIED'],
    ['MODULE_DISABLED', false, 'ERP_PROVIDER_MODULE_DISABLED'],
    ['NOT_SUPPORTED', false, 'ERP_OPERATION_NOT_SUPPORTED'],
    ['UNKNOWN', false, 'ERP_CAPABILITY_UNKNOWN'],
    ['ERROR', false, 'ERP_PROVIDER_UNAVAILABLE'],
    ['UNAVAILABLE', false, 'ERP_PROVIDER_UNAVAILABLE'],
  ] as const)('fails closed for provider status %s', async (providerStatus, allowed, code) => {
    const { service, registry } = build();
    registry.getActiveForTenant.mockResolvedValueOnce({
      id: 'connector-a', tenantId, code: 'dolibarr_wifi', type: 'DOLIBARR', status: 'active', healthStatus: 'AVAILABLE',
      capabilities: { capabilities: { 'customer.read': providerStatus } },
    });
    await expect(service.getOperationDecision({ tenantId, actorId: 'actor-a', permissions: ['erp:read'], resourceKey: 'customer', operation: 'read' }))
      .resolves.toEqual(expect.objectContaining({ allowed, code, providerStatus }));
  });

  it('blocks an unavailable IAM permission, platform policy and non-implemented operation', async () => {
    const { service, prisma } = build();
    await expect(service.getOperationDecision({ tenantId, resourceKey: 'customer', operation: 'read', permissions: [] }))
      .resolves.toEqual(expect.objectContaining({ allowed: false, statusCode: 403, code: 'ERP_PERMISSION_DENIED' }));
    prisma.configuration.findFirst.mockResolvedValueOnce({ value: { resources: { customer: false } } });
    await expect(service.getOperationDecision({ tenantId, resourceKey: 'customer', operation: 'read', permissions: ['erp:read'] }))
      .resolves.toEqual(expect.objectContaining({ allowed: false, code: 'ERP_PLATFORM_DISABLED' }));
    await expect(service.getOperationDecision({ tenantId, resourceKey: 'category', operation: 'read', permissions: ['erp:read'] }))
      .resolves.toEqual(expect.objectContaining({ allowed: false, code: 'ERP_OPERATION_NOT_IMPLEMENTED' }));
  });

  it('preserves the real payment.create 501 as NOT_SUPPORTED before adapter dispatch', async () => {
    const { service } = build();
    await expect(service.getOperationDecision({ tenantId, resourceKey: 'payment', operation: 'create', permissions: ['erp:write'] }))
      .resolves.toEqual(expect.objectContaining({ allowed: false, code: 'ERP_OPERATION_NOT_SUPPORTED', providerStatus: 'NOT_SUPPORTED' }));
  });
});
