import { Test, TestingModule } from '@nestjs/testing';
import { DiagnosticsService } from './diagnostics.service';
import { PrismaService } from '../../../prisma/prisma.service';
import {
  IntegrationLogDirectionEnum,
  IntegrationLogStatusEnum,
} from './dto/create-log.dto';

describe('DiagnosticsService (API-CDC-07)', () => {
  let service: DiagnosticsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [DiagnosticsService, PrismaService],
    }).compile();

    service = module.get<DiagnosticsService>(DiagnosticsService);
  });

  it('should redact sensitive tokens and credentials from operations and logs', () => {
    const input = 'Request with Bearer eyJhbGciOiJIUzI1Ni... and secret="super_secret_val"';
    const redacted = service.redactSensitiveData(input);

    expect(redacted).not.toContain('eyJhbGciOiJIUzI1Ni');
    expect(redacted).not.toContain('super_secret_val');
    expect(redacted).toContain('[REDACTED]');
  });

  it('should create log and retrieve trace timeline in chronological sequence', async () => {
    const traceId = 'trc-diagnostics-test-123';

    await service.createLog({
      traceId,
      operation: 'auth.verify',
      direction: IntegrationLogDirectionEnum.OUTBOUND,
      status: IntegrationLogStatusEnum.SUCCEEDED,
      duration: 40,
    });

    await service.createLog({
      traceId,
      operation: 'data.fetch',
      direction: IntegrationLogDirectionEnum.INBOUND,
      status: IntegrationLogStatusEnum.SUCCEEDED,
      duration: 120,
    });

    const timelineResult = await service.getTimeline(traceId);
    expect(timelineResult.traceId).toBe(traceId);
    expect(timelineResult.totalSteps).toBe(2);
    expect(timelineResult.overallStatus).toBe('SUCCEEDED');
  });

  it('should generate diagnostics categorization and metrics', async () => {
    const metrics = await service.getMetrics();
    expect(metrics).toBeDefined();
    expect(metrics.requestCount).toBeGreaterThanOrEqual(1);

    const diagnostics = await service.getDiagnostics();
    expect(diagnostics).toBeDefined();
    expect(diagnostics.categoryBreakdown).toBeDefined();
    expect(diagnostics.recommendedActions).toBeDefined();
  });
});
