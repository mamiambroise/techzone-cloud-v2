import { ErpRegistryService } from './erp-registry.service';
import { ErpRegistryController } from './erp-registry.controller';
import { PERMISSIONS_KEY } from '../iam/iam-permissions.guard';

describe('ERP registry tenant/permissions boundary', () => {
  it('rejects forged connector ids before update, delete or history', async () => {
    const prisma: any = { eRPRegistry: { findUnique: jest.fn().mockResolvedValue({ id: 'connector-b', tenantId: 'tenant-b' }) }, $transaction: jest.fn(), auditEvent: { findMany: jest.fn() } };
    const service = new ErpRegistryService(prisma);
    for (const operation of [() => service.getOne('connector-b', { tenantId: 'tenant-a' }), () => service.update('connector-b', { nom: 'forged' }, { tenantId: 'tenant-a' }), () => service.remove('connector-b', { tenantId: 'tenant-a' }), () => service.history('connector-b', { tenantId: 'tenant-a' })]) await expect(operation()).rejects.toMatchObject({ statusCode: 404 });
    expect(prisma.$transaction).not.toHaveBeenCalled();
    expect(prisma.auditEvent.findMany).not.toHaveBeenCalled();
  });
  it('requires ERP write permission for all configuration mutations', () => {
    for (const method of ['create', 'update', 'remove'] as const) expect(Reflect.getMetadata(PERMISSIONS_KEY, ErpRegistryController.prototype[method])).toEqual(['erp:write']);
  });
  it('cannot list another tenant without an authenticated tenant context', async () => {
    const service = new ErpRegistryService({} as any);
    await expect(service.getAll()).rejects.toMatchObject({ code: 'TENANT_REQUIRED' });
  });
});
