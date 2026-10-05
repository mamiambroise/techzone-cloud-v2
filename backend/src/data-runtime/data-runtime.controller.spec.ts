import { describe, it, expect } from '@jest/globals';
import { DataRuntimeController } from './data-runtime.controller';
import { ROLES } from '../iam/iam.constants';

describe('Data Runtime authenticated BM context', () => {
  const controller = new DataRuntimeController(null as any, null as any, null as any, null as any, null as any, null as any);
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
