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
});
