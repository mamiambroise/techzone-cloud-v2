import { jest } from '@jest/globals';
import { QualityEngineService } from './quality-engine.service';
import { BmqStatus, BmqGateResult, BmqSeverity } from '../../../generated/prisma/enums';

function createMockPrisma() {
  return {
    applicationVersion: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
    },
    bmqValidationCampaign: {
      create: jest.fn(),
      update: jest.fn(),
    },
    bmqValidationRun: {
      create: jest.fn(),
      update: jest.fn(),
    },
    bmRelation: { count: async () => 0, findMany: async () => [] },
    bmVersionFeature: { findMany: async () => [] },
    bmVersionCapability: { findMany: async () => [] },
    configuration: { findMany: async () => [] },
    bmEntity: {
      findMany: jest.fn(),
    },
    bmFeature: {
      findMany: jest.fn(),
    },
    bmMenu: {
      findMany: jest.fn(),
    },
    bmBusinessContract: {
      findMany: jest.fn(),
    },
    bmqQualityReport: {
      create: jest.fn(),
    },
    bmqQualityIssue: {
      create: jest.fn(),
      createMany: jest.fn(),
    },
    bmqQualityMetric: {
      create: jest.fn(),
    },
    bmqQualityGate: {
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
  };
}

describe('QualityEngineService (TENANT-ISOLATION)', () => {
  let service: QualityEngineService;
  let prisma: ReturnType<typeof createMockPrisma>;

  beforeEach(() => {
    prisma = createMockPrisma();
    service = new QualityEngineService(prisma as any);
  });

  describe('runValidation', () => {
    it('should run validation with tenantId', async () => {
      prisma.applicationVersion.findFirst.mockResolvedValue({ id: 'av-1', applicationId: 'app-1' });
      prisma.bmqValidationCampaign.create.mockResolvedValue({ id: 'camp-1', code: 'validation-123', name: 'Campaign', startedAt: new Date() });
      prisma.bmEntity.findMany.mockResolvedValue([]);
      prisma.bmFeature.findMany.mockResolvedValue([]);
      prisma.bmMenu.findMany.mockResolvedValue([]);
      prisma.bmBusinessContract.findMany.mockResolvedValue([{ status: 'LOCKED' }]);
      prisma.bmqValidationRun.create.mockResolvedValue({ id: 'run-1' });
      prisma.bmqValidationRun.update.mockResolvedValue({ id: 'run-1' });
      prisma.bmqQualityReport.create.mockResolvedValue({ id: 'report-1', status: BmqStatus.PASSED, gateResult: BmqGateResult.PASS, score: 100 });
      prisma.bmqValidationCampaign.update.mockResolvedValue({ id: 'camp-1' });
      prisma.applicationVersion.findUnique.mockResolvedValue({ applicationId: 'app-1' });

      const result = await service.runValidation('av-1', { profileCodes: ['default'] } as any, 'tenant-123');

      expect(prisma.applicationVersion.findFirst).toHaveBeenCalledWith({
        where: { id: 'av-1', tenantId: 'tenant-123' },
      });
      expect(prisma.bmqValidationCampaign.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          applicationVersionId: 'av-1',
          tenantId: 'tenant-123',
          status: BmqStatus.RUNNING,
        }),
      });
      expect(result).toHaveProperty('campaignId', 'camp-1');
    });

    it('should run validation with undefined tenantId when null', async () => {
      prisma.applicationVersion.findFirst.mockResolvedValue({ id: 'av-1', applicationId: 'app-1' });
      prisma.bmqValidationCampaign.create.mockResolvedValue({ id: 'camp-1', code: 'validation-123', name: 'Campaign', startedAt: new Date() });
      prisma.bmEntity.findMany.mockResolvedValue([]);
      prisma.bmFeature.findMany.mockResolvedValue([]);
      prisma.bmMenu.findMany.mockResolvedValue([]);
      prisma.bmBusinessContract.findMany.mockResolvedValue([{ status: 'LOCKED' }]);
      prisma.bmqValidationRun.create.mockResolvedValue({ id: 'run-1' });
      prisma.bmqValidationRun.update.mockResolvedValue({ id: 'run-1' });
      prisma.bmqQualityReport.create.mockResolvedValue({ id: 'report-1', status: BmqStatus.PASSED, gateResult: BmqGateResult.PASS, score: 100 });
      prisma.bmqValidationCampaign.update.mockResolvedValue({ id: 'camp-1' });
      prisma.applicationVersion.findUnique.mockResolvedValue({ applicationId: 'app-1' });

      const result = await service.runValidation('av-1', { profileCodes: ['default'] } as any, null);

      expect(prisma.bmqValidationCampaign.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ tenantId: undefined }),
        }),
      );
      expect(result).toHaveProperty('campaignId', 'camp-1');
    });
  });

  describe('createOrUpdateGate', () => {
    it('should create quality gate with tenantId', async () => {
      prisma.applicationVersion.findFirst.mockResolvedValue({ id: 'av-1', applicationId: 'app-1' });
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
