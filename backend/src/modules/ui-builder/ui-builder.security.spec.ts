import { describe, expect, it, jest } from '@jest/globals';
import { Reflector } from '@nestjs/core';
import { IamPermissionGuard } from '../../iam/iam-permission.guard';
import { UiBuilderController } from './ui-builder.controller';
import { UiBuilderService } from './ui-builder.service';
import { UI_BUILDER_READ, UI_BUILDER_WRITE } from '../../iam/iam.constants';
import { validateUiTree, validateUiTheme, unsafeUiJson } from './ui-validation';

const tree = (patch: Record<string, unknown> = {}) => ({ root: 'root', nodes: { root: { id: 'root', type: 'Button', props: {}, children: [], ...patch } } });
describe('SEC-UI-020/021/080 server permission enforcement', () => {
  it.each(['updatePage', 'upsertTheme', 'createPage', 'deletePage'] as const)('denies direct %s for a read-only principal with HTTP 403', async method => {
    const guard = new IamPermissionGuard(new Reflector());
    const request = { iamPrincipal: { tenantId: 'tenant-a', userId: 'reader', permissions: [UI_BUILDER_READ] }, headers: {} };
    const context = { getHandler: () => UiBuilderController.prototype[method], getClass: () => UiBuilderController, switchToHttp: () => ({ getRequest: () => request }) } as any;
    await expect(guard.canActivate(context)).rejects.toMatchObject({ status: 403 });
  });
  it('allows the explicit write permission on page update', async () => {
    const context = { getHandler: () => UiBuilderController.prototype.updatePage, getClass: () => UiBuilderController, switchToHttp: () => ({ getRequest: () => ({ iamPrincipal: { permissions: [UI_BUILDER_WRITE] } }) }) } as any;
    await expect(new IamPermissionGuard(new Reflector()).canActivate(context)).resolves.toBe(true);
  });
});
describe('SEC-UI-030/031/040/060/061/130 declarative boundary', () => {
  it.each(['Unknown', '../../evil.js', 'https://evil.test/module.js', '__proto__'])('rejects unregistered type %s', type => {
    expect(validateUiTree(tree({ type }))).toContainEqual(expect.objectContaining({ code: 'COMPONENT_UNKNOWN' }));
  });
  it.each(['onClick', 'onerror', 'dangerouslySetInnerHTML'])('rejects executable prop %s', prop => {
    expect(validateUiTree(tree({ props: { [prop]: 'alert(1)' } })).length).toBeGreaterThan(0);
  });
  it('rejects CALL_API before storage', () => {
    expect(validateUiTree(tree({ actions: [{ type: 'CALL_API', config: { url: 'https://evil.test' } }] }))).toContainEqual(expect.objectContaining({ code: 'ACTION_INVALID' }));
  });
  it.each(['Authorization', 'headers', 'apiKey', 'password', 'clientSecret', 'databaseUrl'])('rejects secret-bearing %s in actions, metadata and theme', key => {
    const data = { [key]: 'synthetic-secret' };
    expect(unsafeUiJson(data)).toBe(true);
    expect(validateUiTree(tree({ actions: [{ type: 'SHOW_NOTIFICATION', config: data }] })).length).toBeGreaterThan(0);
    expect(validateUiTheme({ typography: data })).toHaveLength(1);
  });
});
describe('SEC-UI-001/002/003/010/090 tenant-scoped resources', () => {
  const db = () => ({ applicationVersion: { findFirst: jest.fn<any>().mockResolvedValue(null) }, uiPage: { findFirst: jest.fn<any>().mockResolvedValue(null), findMany: jest.fn(), update: jest.fn(), create: jest.fn() } });
  it.each(['getUiDefinition', 'listPages', 'getBusinessContext'] as const)('denies foreign version via %s before reading contents', async method => {
    const prisma = db();
    await expect(new UiBuilderService(prisma as any)[method]('version-b', 'tenant-a')).rejects.toMatchObject({ status: 404 });
    expect(prisma.applicationVersion.findFirst).toHaveBeenCalledWith({ where: { id: 'version-b', tenantId: 'tenant-a' } });
    expect(prisma.uiPage.findMany).not.toHaveBeenCalled();
  });
  it('denies editing a foreign page before any write', async () => {
    const prisma = db();
    await expect(new UiBuilderService(prisma as any).updatePage('page-b', { title: 'Forged' }, 'tenant-a', 'user-a')).rejects.toMatchObject({ status: 404 });
    expect(prisma.uiPage.update).not.toHaveBeenCalled();
  });
  it('denies reading the foreign form used as a clone source', async () => {
    const prisma = db();
    await expect(new UiBuilderService(prisma as any).getPage('form-b', 'tenant-a')).rejects.toMatchObject({ status: 404 });
    expect(prisma.uiPage.findFirst).toHaveBeenCalledWith({ where: { id: 'form-b', tenantId: 'tenant-a' } });
    expect(prisma.uiPage.create).not.toHaveBeenCalled();
  });
});
