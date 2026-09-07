import { Test, TestingModule } from '@nestjs/testing';
import { CockpitService } from './cockpit.service';
import { PrismaService } from '../../../prisma/prisma.service';

describe('CockpitService (DEP-CDC-01)', () => {
  let service: CockpitService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CockpitService, PrismaService],
    }).compile();

    service = module.get<CockpitService>(CockpitService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should return complete cockpit dashboard with KPIs and sections', async () => {
    const dashboard = await service.getDashboard();

    expect(dashboard).toHaveProperty('kpis');
    expect(dashboard.kpis).toHaveProperty('releasesReady');
    expect(dashboard.kpis).toHaveProperty('deploymentsRunning');
    expect(dashboard.kpis).toHaveProperty('deploymentsToday');
    expect(dashboard.kpis).toHaveProperty('successRate');
    expect(dashboard.kpis).toHaveProperty('productionStatus');
    expect(dashboard.kpis).toHaveProperty('attentionRequired');

    expect(dashboard).toHaveProperty('recentReleases');
    expect(dashboard).toHaveProperty('environments');
    expect(dashboard).toHaveProperty('gatesSummary');
    expect(dashboard).toHaveProperty('productionHealth');
    expect(dashboard).toHaveProperty('activity');
  });

  it('should return environment health checklist', async () => {
    const health = await service.getHealth();
    expect(health).toHaveProperty('status');
    expect(health).toHaveProperty('environments');
    expect(Array.isArray(health.environments)).toBe(true);
  });
});
