import { describe, it, expect } from '@jest/globals';
import { DataRuntimeController } from './data-runtime.controller';
import { ROLES } from '../iam/iam.constants';

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
  it('SEC-PR-011/012 never executes reads or mutations when the shared gate refuses', async () => {
    const { controller, query, execution, gate } = setup();
    gate.assertExecutable.mockRejectedValue(new Error('RUNTIME_RESOLUTION_BLOCKED'));
    const req: any = { headers: { 'x-runtime-resolution-id': 'blocked' } };
    await expect(controller.executeQuery(req, principal, { resource })).rejects.toThrow('RUNTIME_RESOLUTION_BLOCKED');
    await expect(controller.executeOperation(req, principal, { resource, operation: 'CREATE', input: {} })).rejects.toThrow('RUNTIME_RESOLUTION_BLOCKED');
    expect(query.execute).not.toHaveBeenCalled(); expect(execution.execute).not.toHaveBeenCalled();
  });
});
