import { describe, it, expect, jest } from '@jest/globals';
import { BmRecordsProvider } from './bm-records.provider';

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
});
