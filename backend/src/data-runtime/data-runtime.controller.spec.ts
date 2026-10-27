import { describe, it, expect, jest } from '@jest/globals';
import { DataRuntimeController } from './data-runtime.controller';
import { ROLES } from '../iam/iam.constants';
import { Reflector } from '@nestjs/core';
import { IamPermissionsGuard } from '../iam/iam-permissions.guard';

const principal = { tenantId: 'tenant-a', userId: 'reader', roles: [ROLES.USER], permissions: ['data-runtime:query'] } as any;
const resolutionId = '123e4567-e89b-42d3-a456-426614174000';

function runtimeResolution(overrides: Record<string, any> = {}) {
  return {
    id: resolutionId,
    tenantId: 'tenant-a',
    applicationId: 'application-a',
    environment: 'production',
    status: 'EXECUTABLE',
    effectiveManifest: {
      tenantId: 'tenant-a',
      applicationId: 'application-a',
      environment: 'production',
      status: 'VALID',
      executable: true,
      content: {
        scope: {
          tenantId: 'tenant-a',
          applicationId: 'application-a',
          businessVersionId: 'version-a',
          environment: 'production',
        },
      },
    },
    ...overrides,
  };
}

function controllerWith(findFirst = jest.fn(), findVersion = jest.fn().mockResolvedValue({ applicationId: 'application-a' })) {
  const runtimeExecution = {
    assertExecutable: ({ resolutionId: id, tenantId }: { resolutionId: string; tenantId: string }) =>
      findFirst({ where: { id, tenantId }, include: { effectiveManifest: true } }),
  };
  const controller = new DataRuntimeController(null as any, null as any, null as any, null as any, null as any, null as any, {
    runtimeResolution: { findFirst },
    applicationVersion: { findFirst: findVersion },
  } as any, runtimeExecution as any);
  return { controller, findFirst, findVersion };
}

describe('Data Runtime authenticated BM context', () => {
  const { controller } = controllerWith();
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

describe('Data Runtime published BM execution gate', () => {
  it('denies BM reads and writes when the resolution proof is missing', async () => {
    const { controller, findFirst } = controllerWith();
    await expect((controller as any).assertPublishedRuntimeGuard(undefined, principal, { resource: 'bm:version-a:customer' }))
      .rejects.toThrow('RUNTIME_RESOLUTION_REQUIRED');
    expect(findFirst).not.toHaveBeenCalled();
  });

  it('preserves Data Runtime access to canonical resources outside published applications', async () => {
    const { controller, findFirst } = controllerWith();
    await expect((controller as any).assertPublishedRuntimeGuard(undefined, principal, { resource: 'Product' })).resolves.toBeUndefined();
    expect(findFirst).not.toHaveBeenCalled();
  });

  it('accepts only a tenant-scoped executable resolution matching the BM version', async () => {
    const resolution = runtimeResolution();
    const findFirst = jest.fn().mockResolvedValue(resolution);
    const { controller, findVersion } = controllerWith(findFirst);

    await expect((controller as any).assertPublishedRuntimeGuard(
      { headers: { 'x-runtime-resolution-id': resolutionId } },
      principal,
      { resource: 'bm:version-a:customer' },
    )).resolves.toBe(resolution);
    expect(findFirst).toHaveBeenCalledWith({
      where: { id: resolutionId, tenantId: 'tenant-a' },
      include: { effectiveManifest: true },
    });
    expect(findVersion).toHaveBeenCalledWith({
      where: { id: 'version-a', tenantId: 'tenant-a' },
      select: { applicationId: true },
    });
  });

  it.each([
    ['foreign or missing resolution', null, 'RUNTIME_RESOLUTION_NOT_FOUND', 'version-a'],
    ['blocked resolution', runtimeResolution({ status: 'BLOCKED' }), 'RUNTIME_RESOLUTION_BLOCKED', 'version-a'],
    ['invalid effective manifest', runtimeResolution({ effectiveManifest: { ...runtimeResolution().effectiveManifest, executable: false } }), 'RUNTIME_RESOLUTION_BLOCKED', 'version-a'],
    ['different application version', runtimeResolution(), 'RUNTIME_APPLICATION_VERSION_MISMATCH', 'version-b'],
    ['unverifiable application version', runtimeResolution({ effectiveManifest: { ...runtimeResolution().effectiveManifest, content: { scope: { tenantId: 'tenant-a', applicationId: 'application-a', environment: 'production' } } } }), 'RUNTIME_APPLICATION_VERSION_UNVERIFIABLE', 'version-a'],
  ])('denies %s', async (_case, resolution, error, requestedVersion) => {
    const { controller } = controllerWith(jest.fn().mockResolvedValue(resolution));
    await expect((controller as any).assertPublishedRuntimeGuard(
      undefined,
      principal,
      { resource: `bm:${requestedVersion}:customer`, resolutionId },
    )).rejects.toThrow(error);
  });
});
