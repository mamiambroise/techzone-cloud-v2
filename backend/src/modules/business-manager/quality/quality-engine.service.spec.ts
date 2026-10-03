import { jest } from '@jest/globals';
import { QualityEngineService } from './quality-engine.service';
import { BmqStatus, BmqGateResult } from '../../../generated/prisma/enums';

function createMockPrisma() {
  return {
    applicationVersion: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
    },
    bmqValidationCampaign: {
      create: jest.fn(),
      update: jest.fn(),
      upsert: jest.fn(),
    },
    bmqValidationRun: {
      create: jest.fn(),
      update: jest.fn(),
      upsert: jest.fn(),
    },
    bmRelation: { count: async () => 0, findMany: async () => [] },
    bmVersionFeature: { findMany: async () => [] },
    bmVersionCapability: { findMany: async () => [] },
    configuration: { findMany: async () => [] },
    bmEntity: { findMany: jest.fn() },
    bmField: { findMany: async () => [] },
    bmFeature: { findMany: jest.fn() },
    bmMenu: { findMany: jest.fn() },
    bmNavigationItem: { findMany: async () => [] },
    bmBusinessContract: { findMany: jest.fn() },
    bmqQualityReport: { create: jest.fn(), upsert: jest.fn(), findMany: async () => [], findFirst: async () => null },
    bmqQualityIssue: { create: jest.fn(), createMany: jest.fn(), deleteMany: jest.fn(), findMany: async () => [] },
    bmqQualityMetric: { create: jest.fn(), createMany: jest.fn(), deleteMany: jest.fn() },
    bmqQualityGate: { findFirst: jest.fn(), create: jest.fn(), update: jest.fn(), findMany: async () => [] },
  };
}

const version = { id: 'av-1', applicationId: 'app-1', status: 'CONFIGURING', version: '1.0.0' };

/** Définition valide et minimale : aucun problème attendu. */
function validDefinition(db: ReturnType<typeof createMockPrisma>) {
  db.bmEntity.findMany.mockResolvedValue([
    {
      id: 'e1',
      code: 'product',
      name: 'Produit',
      description: 'Un produit',
      status: 'ACTIVE',
      fields: [{ id: 'f1', code: 'price', label: 'Prix', description: 'Prix unitaire', type: 'DECIMAL', required: true, unique: false }],
      constraints: [],
    },
  ]);
  db.bmFeature.findMany.mockResolvedValue([
    {
      id: 'ft1',
      code: 'catalogue',
      name: 'Catalogue',
      description: 'Gestion du catalogue',
      status: 'ACTIVE',
      capabilities: [
        {
          id: 'c1',
          code: 'product.read',
          name: 'Consulter produit',
          description: 'Lire un produit',
          requiredEntities: ['product'],
          dependencies: [],
        },
      ],
    },
  ]);
  db.bmMenu.findMany.mockResolvedValue([
    { id: 'm1', code: 'main', name: 'Principal', status: 'ACTIVE', items: [{ id: 'i1', code: 'products', label: 'Produits', itemType: 'LINK', parentItemId: null, requiredCapabilities: ['product.read'] }] },
  ]);
  db.bmBusinessContract.findMany.mockResolvedValue([{ id: 'ct1', code: 'main', status: 'LOCKED' }]);
  // Une version « prête » doit aussi porter sa configuration métier.
  db.configuration.findMany = jest.fn(async () => [
    { id: 'cfg1', key: 'shop.name', status: 'READY', required: true },
  ]) as never;
}

describe('QualityEngineService (TENANT-ISOLATION)', () => {
  let service: QualityEngineService;
  let prisma: ReturnType<typeof createMockPrisma>;

  beforeEach(() => {
    prisma = createMockPrisma();
    service = new QualityEngineService(prisma as any);
    prisma.applicationVersion.findFirst.mockResolvedValue(version);
    prisma.bmqValidationCampaign.upsert.mockResolvedValue({ id: 'camp-1', code: 'validation-x', startedAt: new Date() });
    prisma.bmqValidationRun.upsert.mockResolvedValue({ id: 'run-1' });
    prisma.bmqQualityReport.upsert.mockResolvedValue({ id: 'report-1' });
    prisma.bmqValidationCampaign.update.mockResolvedValue({ id: 'camp-1' });
    validDefinition(prisma);
  });

  describe('runValidation', () => {
    it('should scope the version lookup to the principal tenant', async () => {
      await service.runValidation('av-1', { profileCodes: ['default'] } as any, 'tenant-123');

      expect(prisma.applicationVersion.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 'av-1', tenantId: 'tenant-123' } }),
      );
    });

    it('should persist the campaign scoped to the tenant', async () => {
      const result = await service.runValidation('av-1', { profileCodes: ['default'] } as any, 'tenant-123');

      expect(prisma.bmqValidationCampaign.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          create: expect.objectContaining({
            applicationVersionId: 'av-1',
            tenantId: 'tenant-123',
          }),
        }),
      );
      expect(result.campaignId).toBe('camp-1');
    });

    it('should leave tenantId undefined when the principal has none', async () => {
      await service.runValidation('av-1', { profileCodes: ['default'] } as any, null);

      expect(prisma.bmqValidationCampaign.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          create: expect.objectContaining({ tenantId: undefined }),
        }),
      );
    });

    it('should PASS a complete definition with no issue', async () => {
      const result = await service.runValidation('av-1', {} as any, 'tenant-123');

      expect(result.status).toBe(BmqStatus.PASSED);
      expect(result.gateResult).toBe(BmqGateResult.PASS);
      expect(result.issues).toHaveLength(0);
      expect(result.summary.entities).toBe(1);
    });

    it('should detect a BROKEN_RELATION when an endpoint entity is missing', async () => {
      prisma.bmRelation.findMany = jest.fn(async () => [
        { id: 'r1', code: 'order_customer', relationType: 'ONE_TO_MANY', sourceEntityId: 'e1', targetEntityId: 'ghost', required: false },
      ]) as never;

      const result = await service.runValidation('av-1', {} as any, 'tenant-123');

      const broken = result.issues.find((issue) => issue.code === 'BROKEN_RELATION');
      expect(broken).toBeDefined();
      expect(broken!.severity).toBe('ERROR');
      expect(broken!.resourceType).toBe('BmRelation');
      expect(broken!.resourceId).toBe('r1');
      expect(result.gateResult).toBe(BmqGateResult.FAIL);
    });

    it('should warn MISSING_DESCRIPTION on an entity without description', async () => {
      prisma.bmEntity.findMany.mockResolvedValue([
        { id: 'e1', code: 'product', name: 'Produit', description: null, status: 'ACTIVE', fields: [], constraints: [] },
      ]);

      const result = await service.runValidation('av-1', {} as any, 'tenant-123');

      const codes = result.issues.map((issue) => issue.code);
      expect(codes).toContain('MISSING_DESCRIPTION');
      expect(codes).toContain('ENTITY_WITHOUT_FIELD');
    });

    it('should BLOCK publication when no contract is publishable', async () => {
      prisma.bmBusinessContract.findMany.mockResolvedValue([]);

      const result = await service.runValidation('av-1', {} as any, 'tenant-123');

      expect(result.gateResult).toBe(BmqGateResult.BLOCKED);
      expect(result.issues.some((issue) => issue.code === 'NO_PUBLISHABLE_CONTRACT')).toBe(true);
    });

    it('should report a navigation entry requiring an unknown business permission', async () => {
      prisma.bmMenu.findMany.mockResolvedValue([
        { id: 'm1', code: 'main', name: 'Principal', status: 'ACTIVE', items: [{ id: 'i1', code: 'products', label: 'Produits', itemType: 'LINK', parentItemId: null, requiredCapabilities: ['product.delete'] }] },
      ]);

      const result = await service.runValidation('av-1', {} as any, 'tenant-123');

      const issue = result.issues.find((entry) => entry.code === 'BROKEN_NAVIGATION_PERMISSION');
      expect(issue).toBeDefined();
      expect(issue!.message).toContain('product.delete');
    });

    it('should store resource locator in the persisted issue details', async () => {
      prisma.bmRelation.findMany = jest.fn(async () => [
        { id: 'r1', code: 'bad', relationType: 'ONE_TO_MANY', sourceEntityId: 'ghost', targetEntityId: 'ghost2', required: false },
      ]) as never;

      await service.runValidation('av-1', {} as any, 'tenant-123');

      expect(prisma.bmqQualityIssue.createMany).toHaveBeenCalledWith({
        data: expect.arrayContaining([
          expect.objectContaining({
            code: 'BROKEN_RELATION',
            details: expect.objectContaining({ resourceId: 'r1', resourceType: 'BmRelation' }),
          }),
        ]),
      });
    });

    it('should be deterministic: two runs on the same definition reuse the same code', async () => {
      const first = await service.runValidation('av-1', {} as any, 'tenant-123');
      const second = await service.runValidation('av-1', {} as any, 'tenant-123');

      expect(second.code).toBe(first.code);
      expect(prisma.bmqQualityReport.upsert).toHaveBeenCalledTimes(2);
      expect(prisma.bmqQualityReport.upsert.mock.calls[1][0].where).toEqual(
        prisma.bmqQualityReport.upsert.mock.calls[0][0].where,
      );
    });
  });

  describe('createOrUpdateGate', () => {
    it('should create quality gate with tenantId', async () => {
      prisma.bmqQualityGate.findFirst.mockResolvedValue(null);
      prisma.bmqQualityGate.create.mockResolvedValue({ id: 'gate-1', code: 'gate1', name: 'Gate 1', rules: {}, result: BmqGateResult.PASS });

      const result = await service.createOrUpdateGate('av-1', { code: 'GATE1', name: 'Gate 1', blockOnFailure: true } as any, 'tenant-123');

      expect(prisma.bmqQualityGate.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          applicationVersionId: 'av-1',
          code: 'gate1',
          result: BmqGateResult.PASS,
          tenantId: 'tenant-123',
        }),
      });
      expect(result.id).toBe('gate-1');
    });
  });
});