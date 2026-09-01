import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';

describe('Business Manager API E2E Tests', () => {
    let app: INestApplication;
    let moduleFixture: TestingModule;
    let applicationId: string;
    let versionId: string;

    const authUserId = '11111111-1111-4111-8111-111111111111';
    const mockUserHeader = { 'x-user-id': authUserId };

    beforeAll(async () => {
        moduleFixture = await Test.createTestingModule({
            imports: [AppModule],
        }).compile();

        app = moduleFixture.createNestApplication();
        app.useGlobalPipes(new ValidationPipe());
        await app.init();
    });

    afterAll(async () => {
        await app.close();
    });

    // ============ Application CRUD Tests ============
    describe('Applications API', () => {
        it('POST /api/v1/business-manager/applications - should create application', () => {
            return request(app.getHttpServer())
                .post('/api/v1/business-manager/applications')
                .set(mockUserHeader)
                .send({
                    code: 'test-app',
                    name: 'Test Application',
                    description: 'Test app for E2E',
                    category: 'testing',
                    icon: 'test',
                    environment: 'DEVELOPMENT',
                })
                .expect(201)
                .then((res) => {
                    expect(res.body).toHaveProperty('id');
                    applicationId = res.body.id;
                });
        });

        it('GET /api/v1/business-manager/applications - should list applications', () => {
            return request(app.getHttpServer())
                .get('/api/v1/business-manager/applications')
                .set(mockUserHeader)
                .expect(200)
                .then((res) => {
                    expect(Array.isArray(res.body)).toBe(true);
                });
        });

        it('GET /api/v1/business-manager/applications/:id - should get application by id', () => {
            return request(app.getHttpServer())
                .get(`/api/v1/business-manager/applications/${applicationId}`)
                .set(mockUserHeader)
                .expect(200)
                .then((res) => {
                    expect(res.body.id).toBe(applicationId);
                    expect(res.body.code).toBe('test-app');
                });
        });

        it('PATCH /api/v1/business-manager/applications/:id - should update application', () => {
            return request(app.getHttpServer())
                .patch(`/api/v1/business-manager/applications/${applicationId}`)
                .set(mockUserHeader)
                .send({ name: 'Updated Test App' })
                .expect(200)
                .then((res) => {
                    expect(res.body.name).toBe('Updated Test App');
                });
        });
    });

    // ============ Application Version Tests ============
    describe('Application Versions API', () => {
        it('POST /api/v1/business-manager/applications/:id/versions - should create version', () => {
            return request(app.getHttpServer())
                .post(`/api/v1/business-manager/applications/${applicationId}/versions`)
                .set(mockUserHeader)
                .send({
                    versionNumber: '1.0.0',
                    comment: 'First release',
                    snapshot: { modules: ['core', 'auth', 'api'] },
                })
                .expect(201)
                .then((res) => {
                    expect(res.body).toHaveProperty('id');
                    expect(res.body.versionNumber).toBe('1.0.0');
                    versionId = res.body.id;
                });
        });

        it('GET /api/v1/business-manager/applications/:id/versions - should list versions', () => {
            return request(app.getHttpServer())
                .get(`/api/v1/business-manager/applications/${applicationId}/versions`)
                .set(mockUserHeader)
                .expect(200)
                .then((res) => {
                    expect(Array.isArray(res.body)).toBe(true);
                });
        });

        it('GET /api/v1/business-manager/applications/:id/versions/:versionId - should get version', () => {
            return request(app.getHttpServer())
                .get(`/api/v1/business-manager/applications/${applicationId}/versions/${versionId}`)
                .set(mockUserHeader)
                .expect(200)
                .then((res) => {
                    expect(res.body.id).toBe(versionId);
                });
        });
    });

    // ============ Data Model Tests ============
    describe('Data Model API', () => {
        let dataModelId: string;

        it('POST /api/v1/business-manager/data-models - should create data model', () => {
            return request(app.getHttpServer())
                .post('/api/v1/business-manager/data-models')
                .set(mockUserHeader)
                .send({
                    applicationId,
                    versionId,
                    code: 'dm-customer',
                    name: 'Customer Data Model',
                    description: 'Model for customer entity',
                    schema: {
                        entities: ['Customer', 'Address', 'Contact'],
                        relationships: [{ from: 'Customer', to: 'Address' }],
                    },
                })
                .expect(201)
                .then((res) => {
                    expect(res.body).toHaveProperty('id');
                    dataModelId = res.body.id;
                });
        });

        it('GET /api/v1/business-manager/data-models - should list data models', () => {
            return request(app.getHttpServer())
                .get('/api/v1/business-manager/data-models')
                .set(mockUserHeader)
                .query({ applicationId, versionId })
                .expect(200)
                .then((res) => {
                    expect(Array.isArray(res.body)).toBe(true);
                });
        });

        it('GET /api/v1/business-manager/data-models/:id - should get data model', () => {
            return request(app.getHttpServer())
                .get(`/api/v1/business-manager/data-models/${dataModelId}`)
                .set(mockUserHeader)
                .expect(200)
                .then((res) => {
                    expect(res.body.code).toBe('dm-customer');
                });
        });

        it('POST /api/v1/business-manager/data-models/:id/validate - should validate data model', () => {
            return request(app.getHttpServer())
                .post(`/api/v1/business-manager/data-models/${dataModelId}/validate`)
                .set(mockUserHeader)
                .expect(200)
                .then((res) => {
                    expect(res.body).toHaveProperty('valid');
                });
        });
    });

    // ============ Runtime Bridge Tests ============
    describe('Runtime Bridge API', () => {
        it('GET /api/v1/business-manager/applications/:id/versions/:versionId/runtime/manifest - should get runtime manifest', () => {
            return request(app.getHttpServer())
                .get(`/api/v1/business-manager/applications/${applicationId}/versions/${versionId}/runtime/manifest`)
                .set(mockUserHeader)
                .expect(200)
                .then((res) => {
                    expect(res.body).toHaveProperty('version');
                    expect(res.body).toHaveProperty('modules');
                });
        });

        it('GET /api/v1/business-manager/applications/:id/versions/:versionId/runtime/readiness - should get readiness status', () => {
            return request(app.getHttpServer())
                .get(`/api/v1/business-manager/applications/${applicationId}/versions/${versionId}/runtime/readiness`)
                .set(mockUserHeader)
                .expect(200)
                .then((res) => {
                    expect(res.body).toHaveProperty('ready');
                    expect(res.body).toHaveProperty('issues');
                });
        });

        it('POST /api/v1/business-manager/applications/:id/versions/:versionId/runtime/contracts - should generate contracts', () => {
            return request(app.getHttpServer())
                .post(`/api/v1/business-manager/applications/${applicationId}/versions/${versionId}/runtime/contracts`)
                .set(mockUserHeader)
                .send({ types: ['API', 'DATABASE', 'MESSAGE'] })
                .expect(200)
                .then((res) => {
                    expect(res.body).toHaveProperty('contracts');
                });
        });

        it('POST /api/v1/business-manager/applications/:id/versions/:versionId/runtime/snapshot - should create runtime snapshot', () => {
            return request(app.getHttpServer())
                .post(`/api/v1/business-manager/applications/${applicationId}/versions/${versionId}/runtime/snapshot`)
                .set(mockUserHeader)
                .expect(200)
                .then((res) => {
                    expect(res.body).toHaveProperty('id');
                    expect(res.body).toHaveProperty('manifest');
                });
        });
    });

    // ============ Quality & Validation Tests ============
    describe('Quality Validation API', () => {
        let campaignId: string;

        it('POST /api/v1/business-manager/application-versions/:versionId/quality/campaigns - should start quality campaign', () => {
            return request(app.getHttpServer())
                .post(`/api/v1/business-manager/application-versions/${versionId}/quality/campaigns`)
                .set(mockUserHeader)
                .send({ mode: 'STANDARD' })
                .expect(201)
                .then((res) => {
                    expect(res.body).toHaveProperty('campaignId');
                    campaignId = res.body.campaignId;
                });
        });

        it('GET /api/v1/business-manager/application-versions/:versionId/quality/campaigns - should list campaigns', () => {
            return request(app.getHttpServer())
                .get(`/api/v1/business-manager/application-versions/${versionId}/quality/campaigns`)
                .set(mockUserHeader)
                .expect(200)
                .then((res) => {
                    expect(Array.isArray(res.body)).toBe(true);
                });
        });

        it('GET /api/v1/business-manager/quality/campaigns/:id/report - should get campaign report', () => {
            return request(app.getHttpServer())
                .get(`/api/v1/business-manager/quality/campaigns/${campaignId}/report`)
                .set(mockUserHeader)
                .expect(200)
                .then((res) => {
                    expect(res.body).toHaveProperty('campaign');
                    expect(res.body).toHaveProperty('issues');
                });
        });

        it('GET /api/v1/business-manager/application-versions/:versionId/quality/gate - should evaluate quality gate', () => {
            return request(app.getHttpServer())
                .get(`/api/v1/business-manager/application-versions/${versionId}/quality/gate`)
                .set(mockUserHeader)
                .expect(200)
                .then((res) => {
                    expect(res.body).toHaveProperty('decision');
                    expect(['PASS', 'FAIL', 'WARNING']).toContain(res.body.decision);
                });
        });

        it('POST /api/v1/business-manager/application-versions/:versionId/quality/waivers - should request quality waiver', () => {
            return request(app.getHttpServer())
                .post(`/api/v1/business-manager/application-versions/${versionId}/quality/waivers`)
                .set(mockUserHeader)
                .send({
                    issueCode: 'DOCUMENTATION_INCOMPLETE',
                    reason: 'Documentation will be added in next sprint',
                    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
                })
                .expect(201)
                .then((res) => {
                    expect(res.body).toHaveProperty('id');
                });
        });
    });

    // ============ Feature Capability Tests ============
    describe('Feature & Capability API', () => {
        let featureId: string;
        let capabilityId: string;

        it('POST /api/v1/business-manager/features - should create feature', () => {
            return request(app.getHttpServer())
                .post('/api/v1/business-manager/features')
                .set(mockUserHeader)
                .send({
                    applicationId,
                    versionId,
                    code: 'feat-auth',
                    name: 'Authentication',
                    description: 'User authentication feature',
                })
                .expect(201)
                .then((res) => {
                    expect(res.body).toHaveProperty('id');
                    featureId = res.body.id;
                });
        });

        it('POST /api/v1/business-manager/capabilities - should create capability', () => {
            return request(app.getHttpServer())
                .post('/api/v1/business-manager/capabilities')
                .set(mockUserHeader)
                .send({
                    applicationId,
                    versionId,
                    code: 'cap-oauth2',
                    name: 'OAuth 2.0',
                    description: 'OAuth 2.0 authentication capability',
                })
                .expect(201)
                .then((res) => {
                    expect(res.body).toHaveProperty('id');
                    capabilityId = res.body.id;
                });
        });

        it('GET /api/v1/business-manager/features - should list features', () => {
            return request(app.getHttpServer())
                .get('/api/v1/business-manager/features')
                .set(mockUserHeader)
                .query({ applicationId, versionId })
                .expect(200)
                .then((res) => {
                    expect(Array.isArray(res.body)).toBe(true);
                });
        });

        it('GET /api/v1/business-manager/capabilities - should list capabilities', () => {
            return request(app.getHttpServer())
                .get('/api/v1/business-manager/capabilities')
                .set(mockUserHeader)
                .query({ applicationId, versionId })
                .expect(200)
                .then((res) => {
                    expect(Array.isArray(res.body)).toBe(true);
                });
        });

        it('POST /api/v1/business-manager/features/:featureId/capabilities - should link capability to feature', () => {
            return request(app.getHttpServer())
                .post(`/api/v1/business-manager/features/${featureId}/capabilities`)
                .set(mockUserHeader)
                .send({ capabilityId })
                .expect(201)
                .then((res) => {
                    expect(res.body).toHaveProperty('id');
                });
        });
    });

    // ============ Configuration Tests ============
    describe('Configuration API', () => {
        it('POST /api/v1/business-manager/application-versions/:versionId/configuration - should set configuration', () => {
            return request(app.getHttpServer())
                .post(`/api/v1/business-manager/application-versions/${versionId}/configuration`)
                .set(mockUserHeader)
                .send({
                    key: 'app.theme',
                    value: 'dark',
                    type: 'string',
                    environment: 'PRODUCTION',
                })
                .expect(201)
                .then((res) => {
                    expect(res.body).toHaveProperty('id');
                });
        });

        it('GET /api/v1/business-manager/application-versions/:versionId/configuration - should list configuration', () => {
            return request(app.getHttpServer())
                .get(`/api/v1/business-manager/application-versions/${versionId}/configuration`)
                .set(mockUserHeader)
                .expect(200)
                .then((res) => {
                    expect(Array.isArray(res.body)).toBe(true);
                });
        });
    });

    // ============ Menu Tests ============
    describe('Menu API', () => {
        it('POST /api/v1/business-manager/application-versions/:versionId/menus - should create menu', () => {
            return request(app.getHttpServer())
                .post(`/api/v1/business-manager/application-versions/${versionId}/menus`)
                .set(mockUserHeader)
                .send({
                    code: 'menu-main',
                    name: 'Main Navigation',
                    structure: {
                        items: [
                            { label: 'Home', path: '/', icon: 'home' },
                            { label: 'Settings', path: '/settings', icon: 'cog' },
                        ],
                    },
                })
                .expect(201)
                .then((res) => {
                    expect(res.body).toHaveProperty('id');
                });
        });

        it('GET /api/v1/business-manager/application-versions/:versionId/menus - should list menus', () => {
            return request(app.getHttpServer())
                .get(`/api/v1/business-manager/application-versions/${versionId}/menus`)
                .set(mockUserHeader)
                .expect(200)
                .then((res) => {
                    expect(Array.isArray(res.body)).toBe(true);
                });
        });
    });

    // ============ Integration Tests ============
    describe('Integration Definitions API', () => {
        let integrationId: string;

        it('POST /api/v1/business-manager/integrations - should create integration', () => {
            return request(app.getHttpServer())
                .post('/api/v1/business-manager/integrations')
                .set(mockUserHeader)
                .send({
                    applicationId,
                    versionId,
                    code: 'int-payment',
                    name: 'Payment Gateway',
                    type: 'API',
                    protocol: 'REST',
                    endpoints: [{ host: 'api.payment.com', port: 443 }],
                })
                .expect(201)
                .then((res) => {
                    expect(res.body).toHaveProperty('id');
                    integrationId = res.body.id;
                });
        });

        it('GET /api/v1/business-manager/integrations - should list integrations', () => {
            return request(app.getHttpServer())
                .get('/api/v1/business-manager/integrations')
                .set(mockUserHeader)
                .query({ applicationId, versionId })
                .expect(200)
                .then((res) => {
                    expect(Array.isArray(res.body)).toBe(true);
                });
        });

        it('POST /api/v1/business-manager/integrations/:integrationId/bindings - should create binding', () => {
            return request(app.getHttpServer())
                .post(`/api/v1/business-manager/integrations/${integrationId}/bindings`)
                .set(mockUserHeader)
                .send({
                    code: 'bind-payment-prod',
                    name: 'Payment Production Binding',
                    configuration: { apiKey: 'sk-prod-xxxxx' },
                })
                .expect(201)
                .then((res) => {
                    expect(res.body).toHaveProperty('id');
                });
        });

        it('POST /api/v1/business-manager/integrations/:integrationId/bindings/:bindingId/test - should test binding', () => {
            return request(app.getHttpServer())
                .post(`/api/v1/business-manager/integrations/${integrationId}/bindings/:bindingId/test`)
                .set(mockUserHeader)
                .expect(200);
        });
    });

    // ============ Publication Tests ============
    describe('Publication API', () => {
        it('POST /api/v1/business-manager/applications/:id/versions/:versionId/publish - should publish version', () => {
            return request(app.getHttpServer())
                .post(`/api/v1/business-manager/applications/${applicationId}/versions/${versionId}/publish`)
                .set(mockUserHeader)
                .send({ environment: 'PRODUCTION' })
                .expect(201)
                .then((res) => {
                    expect(res.body).toHaveProperty('id');
                    expect(res.body).toHaveProperty('status');
                });
        });

        it('GET /api/v1/business-manager/applications/:id/publications - should list publications', () => {
            return request(app.getHttpServer())
                .get(`/api/v1/business-manager/applications/${applicationId}/publications`)
                .set(mockUserHeader)
                .expect(200)
                .then((res) => {
                    expect(Array.isArray(res.body)).toBe(true);
                });
        });
    });

    // ============ Clone Tests ============
    describe('Clone API', () => {
        it('POST /api/v1/business-manager/applications/:id/clone - should clone application', () => {
            return request(app.getHttpServer())
                .post(`/api/v1/business-manager/applications/${applicationId}/clone`)
                .set(mockUserHeader)
                .send({
                    code: 'test-app-clone',
                    name: 'Test App Clone',
                })
                .expect(201)
                .then((res) => {
                    expect(res.body).toHaveProperty('id');
                    expect(res.body.code).toBe('test-app-clone');
                });
        });
    });

    // ============ Audit Tests ============
    describe('Audit API', () => {
        it('GET /api/v1/business-manager/applications/:id/audit - should get audit trail', () => {
            return request(app.getHttpServer())
                .get(`/api/v1/business-manager/applications/${applicationId}/audit`)
                .set(mockUserHeader)
                .expect(200)
                .then((res) => {
                    expect(Array.isArray(res.body)).toBe(true);
                });
        });
    });
});
