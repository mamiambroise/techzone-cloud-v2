import { Test, TestingModule } from '@nestjs/testing';
import { SynchronizationService } from './synchronization.service';
import { PrismaService } from '../../../prisma/prisma.service';
import {
  SynchronizationDirectionEnum,
  SynchronizationModeEnum,
} from './dto/create-synchronization.dto';

import { Prisma } from '../../../generated/prisma/client';

describe('SynchronizationService (API-CDC-06)', () => {
  let service: SynchronizationService;
  let prisma: PrismaService;
  let connectorId: string;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SynchronizationService, PrismaService],
    }).compile();

    service = module.get<SynchronizationService>(SynchronizationService);
    prisma = module.get<PrismaService>(PrismaService);

    const connector = await prisma.connector.create({
      data: {
        code: 'sync-test-connector',
        name: 'Sync Test Connector',
        providerType: 'REST',
        status: 'ACTIVE',
        health: 'HEALTHY',
        capabilities: ['READ', 'WRITE'] as Prisma.InputJsonValue,
        contractVersion: '1.0.0',
      },
    });
    connectorId = connector.id;
  });

  it('should create and configure a synchronization', async () => {
    const sync = await service.create({
      code: 'user-sync-flow',
      connectorId,
      source: 'local.users',
      target: 'remote.contacts',
      direction: SynchronizationDirectionEnum.PUSH,
      mode: SynchronizationModeEnum.INCREMENTAL,
      batchSize: 50,
      conflictPolicy: {
        strategy: 'SOURCE_WINS',
      },
    });

    expect(sync).toBeDefined();
    expect(sync.status).toBe('PENDING');
    expect(sync.connectorId).toBe(connectorId);
  });

  it('should run full synchronization pipeline and produce checkpoint summary', async () => {
    const sync = await service.create({
      code: 'full-sync-test',
      connectorId,
      source: 'local.invoices',
      target: 'remote.ledger',
      direction: SynchronizationDirectionEnum.PUSH,
      mode: SynchronizationModeEnum.FULL,
      batchSize: 20,
    });

    const runResult = await service.run(sync.id);

    expect(runResult.status).toBe('SUCCEEDED');
    expect(runResult.checkpoint).toBeDefined();
    expect(runResult.checkpoint.recordsWritten).toBeGreaterThan(0);
    expect(runResult.pipelineSteps.length).toBeGreaterThanOrEqual(6);

    const history = await service.getHistory(sync.id);
    expect(history.runs.length).toBe(1);
    expect(history.runs[0].runId).toBe(runResult.runId);
  });
});
