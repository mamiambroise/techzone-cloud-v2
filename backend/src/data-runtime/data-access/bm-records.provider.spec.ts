import { describe, it, expect, jest } from '@jest/globals';
import { BmRecordsProvider } from './bm-records.provider';
import { DATA_RUNTIME_EXECUTE } from '../../iam/iam.constants';

describe('BM records query safety', () => {
  const provider = new BmRecordsProvider({} as any);
  const definition = { entity: { fields: [{ code: 'name' }, { code: 'price' }] } };
  it('binds hostile values instead of inserting SQL', () => {
    const value = "'; DROP TABLE business_records; --";
    const sql = (provider as any).filterSql(definition, { logic: 'AND', conditions: [{ field: 'name', operator: 'EQ', value }] });
    expect(sql.text).not.toContain(value);
    expect(sql.values).toContain(JSON.stringify(value));
  });
  it('rejects undeclared identifiers and operators', () => {
    expect(() => (provider as any).fieldExpression(definition, 'tenantId')).toThrow('FIELD_NOT_FOUND');
    expect(() => (provider as any).filterSql(definition, { logic: 'AND', conditions: [{ field: 'name', operator: 'SQL', value: 'x' }] })).toThrow('INVALID_FILTER');
  });
  it('denies missing authenticated context before any query', async () => {
    await expect(provider.metadata('bm:any:any', {} as any)).rejects.toThrow('TENANT_REQUIRED');
  });
  it('does not turn authorization or database errors into exists=false', async () => {
    jest.spyOn(provider, 'get').mockRejectedValueOnce(new Error('DATABASE_UNAVAILABLE'));
    await expect(provider.exists('bm:any:any', 'id', {} as any)).rejects.toThrow('DATABASE_UNAVAILABLE');
  });
  it('enforces declarative transition capabilities even when generic update is granted', async () => {
    const db = { bmFeatureCapability: { findMany: jest.fn().mockResolvedValue([{code:'request.approve',configuration:{transition:{entity:'request',field:'state',value:'APPROVED'}}}]) } };
    const definition = {version:{id:'version'},entity:{code:'request'}};
    const context = {tenantId:'tenant',permissions:['request.update']};
    await expect((provider as any).authorizeFieldChanges(definition,{state:'DRAFT'},{state:'APPROVED'},context,db)).rejects.toThrow('request.approve');
    await expect((provider as any).authorizeFieldChanges(definition,{state:'DRAFT'},{state:'APPROVED'},{...context,permissions:['request.update','request.approve']},db)).resolves.toBeUndefined();
    await expect((provider as any).authorizeFieldChanges(definition,{state:'APPROVED'},{state:'APPROVED'},context,db)).resolves.toBeUndefined();
  });
  it('allows an application manager to operate declared dynamic BM capabilities', async () => {
    const prisma = {
      applicationVersion: { findFirst: jest.fn().mockResolvedValue({ id: '11111111-1111-1111-1111-111111111111', applicationId: 'app', version: '1.0.0' }) },
      bmEntity: { findFirst: jest.fn().mockResolvedValue({ code: 'customer', fields: [] }) },
      bmFeatureCapability: { count: jest.fn().mockResolvedValue(1) },
    };
    const scopedProvider = new BmRecordsProvider(prisma as any);
    const resource = 'bm:11111111-1111-1111-1111-111111111111:customer';
    const context = { tenantId: 'tenant', userId: 'user', permissions: [DATA_RUNTIME_EXECUTE] };
    await expect((scopedProvider as any).check(resource, 'read', context)).resolves.toBeDefined();
    await expect((scopedProvider as any).check(resource, 'read', { ...context, permissions: ['data-runtime:query'] })).rejects.toThrow('customer.read');
  });
});
