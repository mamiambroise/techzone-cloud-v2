import { jest } from '@jest/globals';
import { RuntimeBridgeService } from './runtime-bridge.service';

describe('RuntimeBridgeService', () => {
    const buildService = (overrides: Record<string, any> = {}) => {
        const version = {
            id: 'version-1',
            applicationId: 'app-1',
            versionNumber: '1.0.0',
            status: 'READY',
            ...overrides.version,
        };

        const repositories = {
            ApplicationVersion: {
                findOne: jest.fn(async ({ where }: any) => (where.id === version.id ? version : null)),
            },
            DataModelDefinition: {
                find: jest.fn(async () => [
                    { id: 'model-1', name: 'Customer', schemaVersion: 2, fields: [{ name: 'id', type: 'uuid' }] },
                ]),
            },
            VersionFeature: {
                find: jest.fn(async () => [
                    { state: 'ENABLED', feature: { code: 'orders' } },
                    { state: 'DISABLED', feature: { code: 'legacy' } },
                ]),
            },
            VersionCapability: {
                find: jest.fn(async () => [
                    { enabled: true, capability: { code: 'sales.read' } },
                ]),
            },
            VersionMenu: {
                find: jest.fn(async () => [
                    { menuId: 'sales-dashboard', enabled: true },
                    { menuId: 'admin-tools', enabled: false },
                ]),
            },
            IntegrationBinding: {
                find: jest.fn(async () => [
                    { id: 'binding-1', applicationVersionId: 'version-1', environment: 'DEV', required: true, status: 'DISABLED', targetId: 'erp-target' },
                    { id: 'binding-2', applicationVersionId: 'version-1', environment: 'DEV', required: false, status: 'DISABLED', targetId: 'sms-target' },
                ]),
            },
            ContractArtifact: {
                findOne: jest.fn(async () => null),
                find: jest.fn(async () => []),
                create: jest.fn((value) => value),
                save: jest.fn(async (value) => value),
            },
            RuntimeSnapshot: {
                findOne: jest.fn(async () => null),
                find: jest.fn(async () => []),
                create: jest.fn((value) => value),
                save: jest.fn(async (value) => value),
            },
            IntegrationDefinition: {
                findOne: jest.fn(async () => ({ id: 'integration-1' })),
            },
        };

        const db: any = {
            getRepository: jest.fn((entity) => repositories[entity.name] ?? {
                find: jest.fn(async () => []),
                findOne: jest.fn(async () => null),
                create: jest.fn((value) => value),
                save: jest.fn(async (value) => value),
            }),
        };

        return new RuntimeBridgeService(db);
    };

    it('builds a manifest without exposing secrets and keeps a deterministic hash', async () => {
        const service = buildService();
        const manifest = await service.manifest('version-1', 'DEV', 'WEB');

        expect(manifest.applicationVersion.id).toBe('version-1');
        expect(manifest.applicationId).toBe('app-1');
        expect(manifest.configuration.values).not.toHaveProperty('apiKey');
        expect(manifest.manifestHash).toEqual(expect.any(String));
        expect(manifest.manifestHash.length).toBeGreaterThan(20);
    });

    it('marks required integration failures as blocking readiness issues', async () => {
        const service = buildService();
        const readiness = await service.readiness('version-1', 'DEV');

        expect(readiness.ready).toBe(false);
        expect(readiness.blockingIssues.some((issue: any) => issue.code === 'INTEGRATION_BINDING_INVALID')).toBe(true);
        expect(readiness.contractStatus).toBe('VALID');
    });
});
