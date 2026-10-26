import { describe, expect, it, jest } from '@jest/globals';
import { RuntimeExecutionService } from './runtime-execution.service';
import { contractHash } from '../pack-manager/pack-contract';

function fixture() {
  const snapshot = { example: 'immutable' };
  const source = { snapshotHash: contractHash(snapshot) };
  const content = {
    status: 'EXECUTABLE', executable: true,
    scope: { tenantId: 'a', applicationId: 'app', businessVersionId: 'v1', environment: 'dev' },
    source: { manifestHash: contractHash(source) },
    ui: { applicationVersionId: 'v1', definition: { applicationVersionId: 'v1', businessContext: { applicationVersionId: 'v1', entities: [{ code: 'Product' }] } } },
  };
  const item: any = { id: '11111111-1111-4111-a111-111111111111', tenantId: 'a', applicationId: 'app', environment: 'dev', packVersionId: 'p1', status: 'EXECUTABLE', result: { expiresAt: new Date(Date.now()+60_000).toISOString(), runtimeContext: { status: 'ACTIVE', readiness: 'READY' } }, effectiveManifest: { executable: true, content, functionalHash: contractHash(content), manifestHash: contractHash(content) } };
  const publication: any = { applicationVersionId: 'v1', snapshotHash: contractHash(snapshot), manifestHash: contractHash(source), snapshot: { content: snapshot, snapshotHash: contractHash(snapshot) }, manifest: { status: 'PUBLISHED', content: source, manifestHash: contractHash(source) } };
  const db: any = { environment: { findFirst: jest.fn<any>().mockResolvedValue({ id: 'env-a' }) }, runtimeResolution: { findFirst: jest.fn<any>().mockResolvedValue(item) }, packVersion: { findFirst: jest.fn<any>().mockResolvedValue(publication) } };
  return { item, publication, db, service: new RuntimeExecutionService(db) };
}

describe('Pack Runtime execution boundary', () => {
  it('allows a valid, active, intact tenant-owned resolution', async () => {
    const { service, item } = fixture();
    await expect(service.assertExecutable({ resolutionId: '11111111-1111-4111-a111-111111111111', tenantId: 'a', applicationVersionId: 'v1' })).resolves.toBe(item);
  });
  it('SEC-PR-001 does not look up a resolution outside the authenticated tenant', async () => {
    const { service, db } = fixture(); db.runtimeResolution.findFirst.mockResolvedValue(null);
    await expect(service.assertExecutable({ resolutionId: '22222222-2222-4222-a222-222222222222', tenantId: 'a' })).rejects.toThrow('RUNTIME_RESOLUTION_NOT_FOUND');
    expect(db.runtimeResolution.findFirst).toHaveBeenCalledWith(expect.objectContaining({ where: { id: '22222222-2222-4222-a222-222222222222', tenantId: 'a' } }));
  });
  it.each(['BLOCKED','RESOLVED','ERROR','EXPIRED'])('SEC-PR-010 rejects status %s without legacy promotion', async status => {
    const { service, item, db } = fixture(); item.status = status;
    await expect(service.assertExecutable({ resolutionId: '11111111-1111-4111-a111-111111111111', tenantId: 'a' })).rejects.toThrow('RUNTIME_RESOLUTION_BLOCKED');
    expect(db.packVersion.findFirst).not.toHaveBeenCalled();
  });
  it('SEC-PR-020 rejects a missing resolution ID', async () => {
    await expect(fixture().service.assertExecutable({ resolutionId: '', tenantId: 'a' })).rejects.toThrow('RUNTIME_RESOLUTION_ID_REQUIRED');
  });
  it('rejects malformed IDs before accessing PostgreSQL', async () => {
    const { service, db } = fixture();
    await expect(service.assertExecutable({ resolutionId: 'invalid', tenantId: 'a' })).rejects.toThrow('RUNTIME_RESOLUTION_ID_INVALID');
    expect(db.runtimeResolution.findFirst).not.toHaveBeenCalled();
  });
  it('SEC-PR-060 rejects expired resolutions', async () => {
    const { service, item } = fixture(); item.result.expiresAt = '2000-01-01';
    await expect(service.assertExecutable({ resolutionId: '11111111-1111-4111-a111-111111111111', tenantId: 'a' })).rejects.toThrow('RUNTIME_RESOLUTION_EXPIRED');
  });
  it('SEC-PR-050 rejects tampered effective content', async () => {
    const { service, item } = fixture(); item.effectiveManifest.content.scope.businessVersionId = 'forged';
    await expect(service.assertExecutable({ resolutionId: '11111111-1111-4111-a111-111111111111', tenantId: 'a' })).rejects.toThrow('RUNTIME_HASH_MISMATCH');
  });
  it('SEC-PR-050 rechecks publication integrity at execution', async () => {
    const { service, publication } = fixture(); publication.snapshot.content.example='tampered';
    await expect(service.assertExecutable({ resolutionId: '11111111-1111-4111-a111-111111111111', tenantId: 'a' })).rejects.toThrow('RUNTIME_HASH_MISMATCH');
  });
  it('SEC-PR-040 refuses the pack application version mismatch', async () => {
    const { service, publication } = fixture(); publication.applicationVersionId='v2';
    await expect(service.assertExecutable({ resolutionId: '11111111-1111-4111-a111-111111111111', tenantId: 'a' })).rejects.toThrow('RUNTIME_APPLICATION_VERSION_MISMATCH');
  });
  it('SEC-PR-080 refuses a different environment', async () => {
    await expect(fixture().service.assertExecutable({ resolutionId: '11111111-1111-4111-a111-111111111111', tenantId: 'a', environmentId: 'production' })).rejects.toThrow('RUNTIME_ENVIRONMENT_MISMATCH');
  });
  it('rejects execution when its environment is no longer active', async () => {
    const { service, db } = fixture(); db.environment.findFirst.mockResolvedValue(null);
    await expect(service.assertExecutable({ resolutionId: '11111111-1111-4111-a111-111111111111', tenantId: 'a' })).rejects.toThrow('RUNTIME_READINESS_FAILED');
  });
  it.each(['INACTIVE','DEACTIVATING'])('SEC-PR-090 refuses context %s', async status => {
    const { service, item } = fixture(); item.result.runtimeContext.status=status;
    await expect(service.assertExecutable({ resolutionId: '11111111-1111-4111-a111-111111111111', tenantId: 'a' })).rejects.toThrow('RUNTIME_CONTEXT_NOT_ACTIVE');
    await expect(service.assertExecutable({ resolutionId: '11111111-1111-4111-a111-111111111111', tenantId: 'a' }, false)).resolves.toBe(item);
  });
});
