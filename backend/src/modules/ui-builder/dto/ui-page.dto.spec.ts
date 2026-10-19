import { describe, expect, it } from '@jest/globals';
import { ValidationPipe } from '@nestjs/common';
import { CreateUiPageDto, UpdateUiPageDto } from './ui-page.dto';
const pipe = new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true });
describe('UI page DTO boundary', () => {
  it.each(['tenantId', 'createdBy', 'updatedBy', 'validationStatus', 'snapshotHash', 'applicationVersionId', 'status', 'updatedBy'])('rejects protected update field %s', async (field) => {
    await expect(pipe.transform({ title: 'Clients', [field]: 'forged' }, { type: 'body', metatype: UpdateUiPageDto })).rejects.toThrow();
  });
  it.each(['', 'not-a-date'])('rejects invalid optimistic revision %s', async (expectedUpdatedAt) => {
    await expect(pipe.transform({ expectedUpdatedAt }, { type: 'body', metatype: UpdateUiPageDto })).rejects.toThrow();
  });
  it('accepts a server revision without exposing privileged fields', async () => {
    await expect(pipe.transform({ title: 'Clients', expectedUpdatedAt: '2026-10-16T10:00:00.000Z' }, { type: 'body', metatype: UpdateUiPageDto })).resolves.toMatchObject({ title: 'Clients' });
  });
  it('rejects an empty update title', async () => {
    await expect(pipe.transform({ title: '' }, { type: 'body', metatype: UpdateUiPageDto })).rejects.toThrow();
  });
  it('rejects tenant injection during creation', async () => {
    await expect(pipe.transform({ applicationVersionId: '33333333-3333-4333-8333-333333333333', key: 'clients', route: '/clients', title: 'Clients', tenantId: 'forged' }, { type: 'body', metatype: CreateUiPageDto })).rejects.toThrow();
  });
});
