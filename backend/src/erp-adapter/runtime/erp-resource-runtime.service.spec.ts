import { ErpResourceRuntimeService } from './erp-resource-runtime.service';

describe('ErpResourceRuntimeService', () => {
  const input = { tenantId: 'tenant-a', actorId: 'actor-a', permissions: ['erp:read'], resourceKey: 'customer', operation: 'read' as const };

  it('stops before adapter dispatch when the canonical decision refuses execution', async () => {
    const catalog: any = { getOperationDecision: jest.fn().mockResolvedValue({ allowed: false, statusCode: 409, code: 'ERP_PROVIDER_MODULE_DISABLED', message: 'module requis', providerStatus: 'MODULE_DISABLED', requiredPermission: 'erp:read' }) };
    const runtime = new ErpResourceRuntimeService(catalog);
    const adapter: any = { getClients: jest.fn() };
    const guarded = runtime.guardAdapter(adapter, input);
    await expect(guarded.getClients({})).rejects.toMatchObject({ code: 'ERP_PROVIDER_MODULE_DISABLED', statusCode: 409 });
    expect(adapter.getClients).not.toHaveBeenCalled();
  });

  it('dispatches only after an AVAILABLE canonical decision', async () => {
    const catalog: any = { getOperationDecision: jest.fn().mockResolvedValue({ allowed: true, statusCode: 200, code: 'ERP_OPERATION_AVAILABLE', message: 'ok', providerStatus: 'AVAILABLE', requiredPermission: 'erp:read' }) };
    const runtime = new ErpResourceRuntimeService(catalog);
    const adapter: any = { getAgenda: jest.fn().mockResolvedValue([{ id: 'agenda-1' }]) };
    const guarded = runtime.guardAdapter(adapter, { ...input, resourceKey: 'agenda' });
    await expect(guarded.getAgenda()).resolves.toEqual([{ id: 'agenda-1' }]);
    expect(catalog.getOperationDecision).toHaveBeenCalledWith(expect.objectContaining({ resourceKey: 'agenda', operation: 'read' }));
  });

  it('refuses a contract not declared by the canonical resource', async () => {
    const runtime = new ErpResourceRuntimeService({ getOperationDecision: jest.fn() } as any);
    await expect(runtime.assertContractAllowed({ tenantId: 'tenant-a', permissions: ['erp:read'], contractOperation: 'payment.create' }))
      .rejects.toMatchObject({ code: 'ERP_CONTRACT_UNAVAILABLE' });
  });
});
