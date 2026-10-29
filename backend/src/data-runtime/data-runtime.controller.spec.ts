import { describe, it, expect } from '@jest/globals';
import { DataRuntimeController } from './data-runtime.controller';
import { ROLES } from '../iam/iam.constants';
import { Reflector } from '@nestjs/core';
import { IamPermissionsGuard } from '../iam/iam-permissions.guard';

describe('Data Runtime authenticated BM context', () => {
  const controller = new DataRuntimeController(null as any, null as any, null as any, null as any, null as any, null as any, { runtimeResolution: { findFirst: jest.fn() } } as any);
  it('supports dynamic capabilities for authenticated IAM administrators', () => {
    const ctx = (controller as any).buildContext('bm:version:record', { tenantId:'a',userId:'admin',roles:[ROLES.ADMIN],permissions:['data-runtime:query'] });
    expect(ctx.tenantId).toBe('a');
    expect(ctx.permissions).toContain('*');
  });
  it('never grants wildcard permissions to an ordinary principal or request body', () => {
    const ctx = (controller as any).buildContext('bm:version:record', { tenantId:'b',userId:'reader',roles:[ROLES.USER],permissions:['record.read'] }, { body:{roles:[ROLES.ADMIN],permissions:['*'],tenantId:'a'} });
    expect(ctx.tenantId).toBe('b');
    expect(ctx.permissions).toEqual(['record.read']);
  });
});


describe('Published data execution boundary', () => {
  const principal: any = { tenantId: 'a', userId: 'reader', roles: [], permissions: ['data-runtime:query'] };
  const resource = 'bm:11111111-1111-4111-a111-111111111111:Product';
  function setup() {
    const query = { execute: jest.fn() };
    const execution = { execute: jest.fn() };
    const gate = { assertExecutable: jest.fn() };
    const db = { applicationVersion: { findFirst: jest.fn().mockResolvedValue({ id: resource.split(':')[1], applicationId: 'app-a', status: 'PUBLISHED' }) } };
    const controller = new DataRuntimeController(query as any, execution as any, null as any, null as any, null as any, null as any, db as any, gate as any);
    return { query, execution, gate, controller };
  }
  it('SEC-PR-020 refuses published reads without a resolution even without a browser-origin header', async () => {
    const { controller, query } = setup();
    await expect(controller.executeQuery({ headers: {} } as any, principal, { resource })).rejects.toThrow('RUNTIME_RESOLUTION_ID_REQUIRED');
    expect(query.execute).not.toHaveBeenCalled();
  });
  it('accepts a resolution proof in the published request contract', async () => {
    const { controller, query, gate } = setup();
    gate.assertExecutable.mockResolvedValue({ applicationId: 'app-a', effectiveManifest: { content: { ui: { definition: { businessContext: { entities: [{ code: 'Product' }] } } } } } });
    query.execute.mockResolvedValue({ items: [] });
    await controller.executeQuery({ headers: {} } as any, principal, { resource, resolutionId: 'r1' } as any);
    expect(gate.assertExecutable).toHaveBeenCalledWith(expect.objectContaining({ resolutionId: 'r1', tenantId: 'a' }));
    expect(query.execute).toHaveBeenCalled();
  });
  it('SEC-DATA-001 refuses published runtime reads without a resolution proof', async () => {
    const { controller, query } = setup();
    await expect(controller.executePublishedQuery({ headers: {} } as any, principal, { resource: 'Product' } as any))
      .rejects.toThrow('RUNTIME_RESOLUTION_ID_REQUIRED');
    expect(query.execute).not.toHaveBeenCalled();
  });
  it('SEC-DATA-003 only allows resources bound to the executable application version', async () => {
    const { controller, query, gate } = setup();
    const versionId = resource.split(':')[1];
    gate.assertExecutable.mockResolvedValue({
      applicationId: 'app-a',
      effectiveManifest: {
        content: {
          scope: { businessVersionId: versionId },
          ui: {
            definition: {
              businessContext: {
                applicationVersionId: versionId,
                entities: [{ code: 'Product' }],
              },
            },
          },
        },
      },
    });
    query.execute.mockResolvedValue({ items: [] });
    await controller.executePublishedQuery({ headers: {} } as any, principal, { resource, resolutionId: 'r1' } as any);
    expect(query.execute).toHaveBeenCalled();
  });
  it('SEC-DATA-032 refuses a resource not declared in the effective manifest', async () => {
    const { controller, query, gate } = setup();
    const versionId = resource.split(':')[1];
    gate.assertExecutable.mockResolvedValue({
      effectiveManifest: {
        content: {
          scope: { businessVersionId: versionId },
          ui: {
            definition: {
              businessContext: { applicationVersionId: versionId, entities: [{ code: 'Customer' }] },
            },
          },
        },
      },
    });
    await expect(controller.executePublishedQuery(
      { headers: {} } as any,
      principal,
      { resource, resolutionId: 'r1' } as any,
    )).rejects.toThrow('RUNTIME_DATA_BINDING_UNAVAILABLE');
    expect(query.execute).not.toHaveBeenCalled();
  });
  it('SEC-PR-011/012 never executes reads or mutations when the shared gate refuses', async () => {
    const { controller, query, execution, gate } = setup();
    gate.assertExecutable.mockRejectedValue(new Error('RUNTIME_RESOLUTION_BLOCKED'));
    const req: any = { headers: { 'x-runtime-resolution-id': 'blocked' } };
    await expect(controller.executeQuery(req, principal, { resource })).rejects.toThrow('RUNTIME_RESOLUTION_BLOCKED');
    await expect(controller.executeOperation(req, principal, { resource, operation: 'CREATE', input: {} })).rejects.toThrow('RUNTIME_RESOLUTION_BLOCKED');
    expect(query.execute).not.toHaveBeenCalled(); expect(execution.execute).not.toHaveBeenCalled();
  });
  it('SEC-DATA-002 refuses published runtime mutations without a resolution proof', async () => {
    const { controller, execution } = setup();
    await expect(controller.executePublishedOperation(
      { headers: {} } as any,
      principal,
      { resource: 'Product', operation: 'CREATE', input: {} } as any,
    )).rejects.toThrow('RUNTIME_RESOLUTION_ID_REQUIRED');
    expect(execution.execute).not.toHaveBeenCalled();
  });

  it('SEC-PR-100 keeps Data Runtime IAM mandatory even with a resolution proof', () => {
    const guard = new IamPermissionsGuard(new Reflector());
    const context: any = {
      getHandler: () => DataRuntimeController.prototype.executePublishedQuery,
      getClass: () => DataRuntimeController,
      switchToHttp: () => ({ getRequest: () => ({
        iamAuth: { tenantId: 'a', userId: 'reader', permissions: [] },
        body: { resource, resolutionId: 'valid-resolution' },
      }) }),
    };
    expect(() => guard.canActivate(context)).toThrow('Permission insuffisante');
    context.switchToHttp = () => ({ getRequest: () => ({
      iamAuth: { tenantId: 'a', userId: 'reader', permissions: ['data-runtime:query'] },
      body: { resource, resolutionId: 'valid-resolution' },
    }) });
    expect(guard.canActivate(context)).toBe(true);
  });
});

describe('Tenant-scoped diagnostics', () => {
  it('requires an authenticated tenant before exposing metrics', async () => {
    const history = { getMetrics: jest.fn() };
    const controller = new DataRuntimeController(null as any, null as any, null as any, null as any, history as any, null as any, null as any, null as any);
    await expect(controller.getMetrics({ tenantId: '', userId: 'user' } as any)).rejects.toThrow('TENANT_REQUIRED');
    expect(history.getMetrics).not.toHaveBeenCalled();
  });

  it('passes only the authenticated tenant to metrics', async () => {
    const history = { getMetrics: jest.fn().mockReturnValue({ queryCount: 1 }) };
    const controller = new DataRuntimeController(null as any, null as any, null as any, null as any, history as any, null as any, null as any, null as any);
    await expect(controller.getMetrics({ tenantId: 'tenant-a', userId: 'user' } as any)).resolves.toEqual({ queryCount: 1 });
    expect(history.getMetrics).toHaveBeenCalledWith('tenant-a');
  });
});

describe('Data Runtime provider readiness', () => {
  it('returns a degraded ERP state instead of throwing when no tenant ERP is active', async () => {
    const erpRegistry = { getActiveForTenant: jest.fn().mockRejectedValue(new Error('ERP_INSTANCE_NOT_CONFIGURED')) };
    const controller = new DataRuntimeController(null as any, null as any, null as any, null as any, null as any, null as any, null as any, null as any, erpRegistry as any);
    await expect(controller.getReadiness({ tenantId: 'tenant-a', userId: 'user' } as any)).resolves.toEqual(expect.objectContaining({
      tenantId: 'tenant-a',
      providers: expect.arrayContaining([expect.objectContaining({ provider: 'ERP_ADAPTER', status: 'DEGRADED', code: 'ERP_INSTANCE_NOT_CONFIGURED' })]),
    }));
  });
});
