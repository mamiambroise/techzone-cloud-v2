import { HttpStatus, Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { PrismaService } from '../../../prisma/prisma.service';
import { Prisma } from '../../../generated/prisma/client';
import { IntegrationErrorCode } from '../../../common/errors/integration-error-code';
import { IntegrationException } from '../../../common/errors/integration-exception';
import { CreateSynchronizationDto } from './dto/create-synchronization.dto';
import { UpdateSynchronizationDto } from './dto/update-synchronization.dto';
import { RunSynchronizationDto } from './dto/run-synchronization.dto';

export interface SyncExecutionRun {
  runId: string;
  synchronizationId: string;
  traceId: string;
  status: 'SUCCEEDED' | 'PARTIAL' | 'FAILED';
  startedAt: string;
  finishedAt: string;
  durationMs: number;
  mode: string;
  checkpoint: {
    lastProcessedCursor: string;
    recordsRead: number;
    recordsWritten: number;
    conflictsDetected: number;
    conflictsResolved: number;
    failedRecords: number;
  };
  pipelineSteps: Array<{
    name: string;
    status: 'COMPLETED' | 'SKIPPED' | 'FAILED';
    durationMs: number;
  }>;
  summary: string;
}

@Injectable()
export class SynchronizationService {
  // Store runs and checkpoints in memory per synchronization
  private readonly runsHistory = new Map<string, SyncExecutionRun[]>();

  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateSynchronizationDto) {
    // Verify connector exists
    const connector = await this.prisma.connector.findUnique({
      where: { id: dto.connectorId },
    });

    if (!connector) {
      throw new IntegrationException(
        IntegrationErrorCode.INTEGRATION_PROVIDER_UNAVAILABLE,
        `Connector "${dto.connectorId}" not found`,
        HttpStatus.NOT_FOUND,
      );
    }

    const existing = await this.prisma.synchronization.findUnique({
      where: { code: dto.code },
    });

    if (existing) {
      throw new IntegrationException(
        IntegrationErrorCode.INTEGRATION_CONTRACT_UNSUPPORTED,
        `Synchronization with code "${dto.code}" already exists`,
        HttpStatus.CONFLICT,
      );
    }

    return this.prisma.synchronization.create({
      data: {
        code: dto.code,
        connectorId: dto.connectorId,
        source: dto.source,
        target: dto.target,
        direction: dto.direction,
        mode: dto.mode,
        schedule: dto.schedule,
        mappingRef: dto.mappingRef,
        conflictPolicy: (dto.conflictPolicy ?? {
          strategy: 'SOURCE_WINS',
        }) as unknown as Prisma.InputJsonValue,
        batchSize: dto.batchSize ?? 100,
        status: 'PENDING',
      },
      include: {
        connector: true,
      },
    });
  }

  async findAll(query?: {
    connectorId?: string;
    direction?: string;
    mode?: string;
    status?: string;
    page?: number;
    limit?: number;
  }) {
    const page = Math.max(Number(query?.page) || 1, 1);
    const limit = Math.min(Math.max(Number(query?.limit) || 20, 1), 100);
    const skip = (page - 1) * limit;

    const where: Prisma.SynchronizationWhereInput = {};
    if (query?.connectorId) where.connectorId = query.connectorId;
    if (query?.direction) where.direction = query.direction as any;
    if (query?.mode) where.mode = query.mode as any;
    if (query?.status) where.status = query.status as any;

    const [items, total] = await Promise.all([
      this.prisma.synchronization.findMany({
        where,
        include: { connector: true },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.synchronization.count({ where }),
    ]);

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  async findOne(id: string) {
    const sync = await this.prisma.synchronization.findUnique({
      where: { id },
      include: { connector: true },
    });

    if (!sync) {
      throw new IntegrationException(
        IntegrationErrorCode.INTEGRATION_PROVIDER_UNAVAILABLE,
        `Synchronization "${id}" not found`,
        HttpStatus.NOT_FOUND,
      );
    }

    return sync;
  }

  async update(id: string, dto: UpdateSynchronizationDto) {
    await this.findOne(id);

    return this.prisma.synchronization.update({
      where: { id },
      data: {
        ...(dto.source !== undefined ? { source: dto.source } : {}),
        ...(dto.target !== undefined ? { target: dto.target } : {}),
        ...(dto.direction !== undefined ? { direction: dto.direction } : {}),
        ...(dto.mode !== undefined ? { mode: dto.mode } : {}),
        ...(dto.schedule !== undefined ? { schedule: dto.schedule } : {}),
        ...(dto.mappingRef !== undefined ? { mappingRef: dto.mappingRef } : {}),
        ...(dto.conflictPolicy !== undefined
          ? {
              conflictPolicy:
                dto.conflictPolicy as unknown as Prisma.InputJsonValue,
            }
          : {}),
        ...(dto.batchSize !== undefined ? { batchSize: dto.batchSize } : {}),
      },
      include: { connector: true },
    });
  }

  /**
   * API-CDC-06 Full Pipeline Execution:
   * START -> Load Configuration -> Authenticate -> Read Source -> Validate/Transform -> Write Target -> Checkpoint -> Summary
   */
  async run(id: string, dto?: RunSynchronizationDto): Promise<SyncExecutionRun> {
    const sync = await this.findOne(id);

    if (sync.status === 'RUNNING') {
      throw new IntegrationException(
        IntegrationErrorCode.INTEGRATION_INVALID_STATE,
        `Synchronization "${sync.code}" is already running`,
        HttpStatus.CONFLICT,
      );
    }

    if (sync.status === 'PAUSED' && !dto?.resumeFromCheckpoint) {
      throw new IntegrationException(
        IntegrationErrorCode.INTEGRATION_INVALID_STATE,
        `Synchronization "${sync.code}" is PAUSED. Explicitly set resumeFromCheckpoint: true to resume.`,
        HttpStatus.BAD_REQUEST,
      );
    }

    const runId = randomUUID();
    const traceId = randomUUID();
    const startTime = Date.now();

    // Mark status RUNNING
    await this.prisma.synchronization.update({
      where: { id },
      data: { status: 'RUNNING' },
    });

    const pipelineSteps: SyncExecutionRun['pipelineSteps'] = [];

    // Step 1: Load Configuration
    const step1Start = Date.now();
    const batchSize = sync.batchSize ?? 100;
    const conflictPolicy = (sync.conflictPolicy as any) || {
      strategy: 'SOURCE_WINS',
    };
    pipelineSteps.push({
      name: 'LOAD_CONFIGURATION',
      status: 'COMPLETED',
      durationMs: Date.now() - step1Start,
    });

    // Step 2: Authenticate Connector
    const step2Start = Date.now();
    if (sync.connector.status !== 'ACTIVE' && sync.connector.status !== 'READY') {
      await this.prisma.synchronization.update({
        where: { id },
        data: { status: 'FAILED' },
      });

      throw new IntegrationException(
        IntegrationErrorCode.INTEGRATION_AUTH_FAILED,
        `Connector "${sync.connector.code}" is in invalid state: ${sync.connector.status}`,
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
    pipelineSteps.push({
      name: 'AUTHENTICATE',
      status: 'COMPLETED',
      durationMs: Date.now() - step2Start,
    });

    // Step 3: Read Source (Simulated batch reading)
    const step3Start = Date.now();
    const recordsCount = Math.min(batchSize, 50);
    pipelineSteps.push({
      name: 'READ_SOURCE',
      status: 'COMPLETED',
      durationMs: Date.now() - step3Start,
    });

    // Step 4: Validate / Transform
    const step4Start = Date.now();
    const validRecords = recordsCount;
    pipelineSteps.push({
      name: 'VALIDATE_TRANSFORM',
      status: 'COMPLETED',
      durationMs: Date.now() - step4Start,
    });

    // Step 5: Write Target & Conflict Resolution
    const step5Start = Date.now();
    // Simulate minor conflict detection based on conflict policy
    const conflictsDetected = sync.mode === 'INCREMENTAL' ? 2 : 0;
    const conflictsResolved =
      conflictPolicy.strategy === 'MANUAL_REVIEW' ? 0 : conflictsDetected;
    const writtenCount = validRecords - (conflictsDetected - conflictsResolved);
    pipelineSteps.push({
      name: 'WRITE_TARGET',
      status: 'COMPLETED',
      durationMs: Date.now() - step5Start,
    });

    // Step 6: Checkpoint
    const step6Start = Date.now();
    const lastCursor = `cursor-${Date.now()}`;
    pipelineSteps.push({
      name: 'CHECKPOINT',
      status: 'COMPLETED',
      durationMs: Date.now() - step6Start,
    });

    const durationMs = Date.now() - startTime;
    const runStatus =
      conflictsDetected > conflictsResolved ? 'PARTIAL' : 'SUCCEEDED';

    // Update synchronization status
    await this.prisma.synchronization.update({
      where: { id },
      data: { status: runStatus },
    });

    const executionRun: SyncExecutionRun = {
      runId,
      synchronizationId: sync.id,
      traceId,
      status: runStatus,
      startedAt: new Date(startTime).toISOString(),
      finishedAt: new Date().toISOString(),
      durationMs,
      mode: sync.mode,
      checkpoint: {
        lastProcessedCursor: lastCursor,
        recordsRead: validRecords,
        recordsWritten: writtenCount,
        conflictsDetected,
        conflictsResolved,
        failedRecords: 0,
      },
      pipelineSteps,
      summary: `Processed ${writtenCount}/${validRecords} records successfully in mode ${sync.mode}. Conflict policy: ${conflictPolicy.strategy}.`,
    };

    const history = this.runsHistory.get(id) || [];
    history.unshift(executionRun);
    this.runsHistory.set(id, history.slice(0, 50));

    return executionRun;
  }

  async pause(id: string) {
    await this.findOne(id);

    return this.prisma.synchronization.update({
      where: { id },
      data: { status: 'PAUSED' },
    });
  }

  async resume(id: string) {
    const sync = await this.findOne(id);

    if (sync.status !== 'PAUSED') {
      throw new IntegrationException(
        IntegrationErrorCode.INTEGRATION_INVALID_STATE,
        `Synchronization "${sync.code}" is not in PAUSED state`,
        HttpStatus.BAD_REQUEST,
      );
    }

    return this.prisma.synchronization.update({
      where: { id },
      data: { status: 'PENDING' },
    });
  }

  async cancel(id: string) {
    await this.findOne(id);

    return this.prisma.synchronization.update({
      where: { id },
      data: { status: 'CANCELLED' },
    });
  }

  async getHistory(id: string) {
    await this.findOne(id);
    return {
      synchronizationId: id,
      runs: this.runsHistory.get(id) || [],
    };
  }
}
