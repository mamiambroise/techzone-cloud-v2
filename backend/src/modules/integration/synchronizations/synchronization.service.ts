import { Injectable, HttpStatus } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { Prisma } from '../../../generated/prisma/client';
import {
  IntegrationLogDirection,
  IntegrationLogStatus,
  SynchronizationDirection,
  SynchronizationMode,
  SynchronizationStatus,
} from '../../../generated/prisma/enums';
import { IntegrationException } from '../../../common/errors/integration-exception';
import { IntegrationErrorCode } from '../../../common/errors/integration-error-code';
import { MockIntegrationProvider } from '../../../common/providers/mock-integration.provider';
import { IntegrationResilienceService } from '../../../common/resilience/integration-resilience.service';
import { IdempotencyService } from '../../../common/resilience/idempotency.service';
import {
  CreateSynchronizationDto,
  UpdateSynchronizationDto,
  SyncPipelineResult,
  SyncCheckpoint,
} from './dto/create-synchronization.dto';
import { randomUUID } from 'node:crypto';

export interface SyncEntity {
  id: string;
  code: string;
  connectorId: string;
  direction: string;
  mode: string;
  conflictPolicy: unknown;
  source: string;
  target: string;
  batchSize: number | null;
  schedule: string | null;
  mappingRef: string | null;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

@Injectable()
export class SynchronizationService {
  private readonly checkpoints: Map<string, SyncCheckpoint> = new Map();

  constructor(
    private readonly prisma: PrismaService,
    private readonly mockProvider: MockIntegrationProvider,
    private readonly resilienceService: IntegrationResilienceService,
    private readonly idempotencyService: IdempotencyService,
  ) {}

  async create(dto: CreateSynchronizationDto): Promise<SyncEntity> {
    const connector = await this.prisma.connector.findUnique({
      where: { id: dto.connectorId },
      select: { id: true, status: true },
    });

    if (!connector) {
      throw new IntegrationException(
        IntegrationErrorCode.INTEGRATION_PROVIDER_UNAVAILABLE,
        `Connector "${dto.connectorId}" not found`,
        HttpStatus.NOT_FOUND,
      );
    }

    if (connector.status !== 'ACTIVE') {
      throw new IntegrationException(
        IntegrationErrorCode.INTEGRATION_INVALID_STATE,
        `Connector "${dto.connectorId}" must be ACTIVE to create a synchronization`,
        HttpStatus.BAD_REQUEST,
      );
    }

    const existing = await this.prisma.synchronization.findUnique({
      where: { code: dto.code },
      select: { id: true },
    });

    if (existing) {
      throw new IntegrationException(
        IntegrationErrorCode.INTEGRATION_CONTRACT_UNSUPPORTED,
        `Synchronization with code "${dto.code}" already exists`,
        HttpStatus.CONFLICT,
      );
    }

    const created = await this.prisma.synchronization.create({
      data: {
        code: dto.code,
        connector: { connect: { id: dto.connectorId } },
        source: dto.source,
        target: dto.target,
        direction: dto.direction as SynchronizationDirection,
        mode: dto.mode as SynchronizationMode,
        schedule: dto.schedule ?? null,
        mappingRef: dto.mappingRef ?? null,
        conflictPolicy: dto.conflictPolicy as Prisma.InputJsonValue,
        batchSize: dto.batchSize ?? 100,
        status: 'PENDING' as SynchronizationStatus,
      },
    });

    return created as unknown as SyncEntity;
  }

  async findAll() {
    return this.prisma.synchronization.findMany({
      include: { connector: { select: { id: true, code: true, name: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string): Promise<SyncEntity> {
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

    return sync as unknown as SyncEntity;
  }

  async update(id: string, dto: UpdateSynchronizationDto): Promise<SyncEntity> {
    const sync = await this.prisma.synchronization.findUnique({
      where: { id },
    });

    if (!sync) {
      throw new IntegrationException(
        IntegrationErrorCode.INTEGRATION_PROVIDER_UNAVAILABLE,
        `Synchronization "${id}" not found`,
        HttpStatus.NOT_FOUND,
      );
    }

    const updated = await this.prisma.synchronization.update({
      where: { id },
      data: {
        code: dto.code,
        source: dto.source,
        target: dto.target,
        direction: dto.direction as SynchronizationDirection | undefined,
        mode: dto.mode as SynchronizationMode | undefined,
        schedule: dto.schedule ?? undefined,
        mappingRef: dto.mappingRef ?? undefined,
        conflictPolicy: dto.conflictPolicy as Prisma.InputJsonValue | undefined,
        batchSize: dto.batchSize,
        status: dto.status as SynchronizationStatus | undefined,
      },
    });

    return updated as unknown as SyncEntity;
  }

  async remove(id: string) {
    const sync = await this.prisma.synchronization.findUnique({
      where: { id },
      select: { id: true, status: true },
    });

    if (!sync) {
      throw new IntegrationException(
        IntegrationErrorCode.INTEGRATION_PROVIDER_UNAVAILABLE,
        `Synchronization "${id}" not found`,
        HttpStatus.NOT_FOUND,
      );
    }

    return this.prisma.synchronization.delete({ where: { id } });
  }

  async run(id: string): Promise<SyncPipelineResult> {
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

    if (sync.status !== 'PENDING' && sync.status !== 'PAUSED') {
      throw new IntegrationException(
        IntegrationErrorCode.INTEGRATION_INVALID_STATE,
        `Synchronization "${sync.code}" cannot be started from status ${sync.status}`,
        HttpStatus.BAD_REQUEST,
      );
    }

    const traceId = randomUUID();
    const startTime = Date.now();

    await this.prisma.synchronization.update({
      where: { id },
      data: { status: 'RUNNING' as SynchronizationStatus },
    });

    const context = {
      traceId,
      syncId: id,
      syncCode: sync.code,
      connectorId: sync.connectorId,
    };

    try {
      const executeWithIdempotency = <T>(op: () => Promise<T>): Promise<T> => {
        const idempotencyKey = `${traceId}:sync:${id}`;
        return this.idempotencyService.execute(idempotencyKey, op);
      };

      const config = await executeWithIdempotency(() =>
        this.loadConfiguration(sync, context),
      );

      await executeWithIdempotency(() => this.authenticate(sync, config));

      const readBatch = await executeWithIdempotency(() =>
        this.readSource(sync, config, context),
      );

      const { written, conflicts } = await executeWithIdempotency(() =>
        this.writeTarget(sync, readBatch, config, context),
      );

      await executeWithIdempotency(() =>
        this.checkpoint(sync, context, {
          step: 'complete',
          position: written,
          timestamp: new Date(),
          data: config,
        }),
      );

      const duration = Date.now() - startTime;

      await this.logIntegration(
        traceId,
        sync.connectorId,
        sync.direction as IntegrationLogDirection,
        startTime,
        duration,
        'SUCCEEDED',
      );

      await this.prisma.synchronization.update({
        where: { id },
        data: { status: 'SUCCEEDED' as SynchronizationStatus },
      });

      return {
        traceId,
        status: 'SUCCEEDED',
        read: readBatch.length,
        written,
        conflicts,
        checkpoints: 1,
        duration,
      };
    } catch (error) {
      const err = error as Error;
      const duration = Date.now() - startTime;

      const errorCode = err.message?.includes('auth')
        ? IntegrationErrorCode.INTEGRATION_AUTH_FAILED
        : IntegrationErrorCode.INTERNAL_INTEGRATION_ERROR;

      await this.logIntegration(
        traceId,
        sync.connectorId,
        sync.direction as IntegrationLogDirection,
        startTime,
        duration,
        'FAILED',
        errorCode,
      );

      await this.prisma.synchronization.update({
        where: { id },
        data: { status: 'FAILED' as SynchronizationStatus },
      });

      throw new IntegrationException(
        errorCode,
        `Synchronization "${sync.code}" failed: ${err.message}`,
        HttpStatus.FAILED_DEPENDENCY,
        undefined,
        traceId,
      );
    }
  }

  private async loadConfiguration(
    sync: SyncEntity,
    _context: Record<string, unknown>,
  ): Promise<Record<string, unknown>> {
    return this.resilienceService.execute(
      async () => {
        const connector = await this.prisma.connector.findUnique({
          where: { id: sync.connectorId },
          select: { configurationSchema: true, credentialRef: true },
        });

        return {
          syncCode: sync.code,
          configuration:
            (connector?.configurationSchema as Record<string, unknown>) ?? {},
          credentialRef: connector?.credentialRef ?? null,
        };
      },
      {
        timeout: { timeoutMs: 5000 },
        retry: { maxAttempts: 3, initialDelayMs: 500, backoffMultiplier: 2 },
      },
    );
  }

  private async authenticate(
    sync: SyncEntity,
    config: Record<string, unknown>,
  ): Promise<boolean> {
    const connector = await this.prisma.connector.findUnique({
      where: { id: sync.connectorId },
      select: { configurationSchema: true, credentialRef: true },
    });

    const configuration =
      (connector?.configurationSchema as Record<string, unknown>) ?? {};

    await this.mockProvider.connect({ ...configuration, ...config });

    const health = await this.mockProvider.healthCheck();

    return health.status === 'HEALTHY';
  }

  private async readSource(
    _sync: SyncEntity,
    _config: Record<string, unknown>,
    _context: Record<string, unknown>,
  ): Promise<Record<string, unknown>[]> {
    return this.resilienceService.execute(
      async () => [
        { id: 1, data: { name: 'source-record-1' } },
        { id: 2, data: { name: 'source-record-2' } },
      ],
      {
        timeout: { timeoutMs: 10000 },
        retry: { maxAttempts: 2, initialDelayMs: 1000 },
      },
    );
  }

  private async writeTarget(
    sync: SyncEntity,
    records: Record<string, unknown>[],
    _config: Record<string, unknown>,
    _context: Record<string, unknown>,
  ): Promise<{ written: number; conflicts: number }> {
    const batchSize = sync.batchSize ?? 100;
    let written = 0;
    let conflicts = 0;

    const conflictPolicy = (sync.conflictPolicy as Record<string, unknown> | null) ?? {};
    const policy = (conflictPolicy.policy as string) ?? 'source_wins';

    for (let i = 0; i < records.length; i += batchSize) {
      const batch = records.slice(i, i + batchSize);

      const result = await this.resilienceService.execute(
        async () => {
          let batchWritten = 0;
          let batchConflicts = 0;

          for (const record of batch) {
            const writeResult = await this.mockProvider.execute('write', {
              target: sync.target,
              record,
              conflictPolicy: policy,
            });

            const res = writeResult as Record<string, unknown> | null;

            if (res?.success) {
              batchWritten++;
            } else if (res?.conflict) {
              batchConflicts++;
            } else {
              throw new IntegrationException(
                IntegrationErrorCode.INTERNAL_INTEGRATION_ERROR,
                `Write failed for record: ${JSON.stringify(record)}`,
                HttpStatus.FAILED_DEPENDENCY,
              );
            }
          }

          return { batchWritten, batchConflicts };
        },
        {
          timeout: { timeoutMs: 30000 },
          retry: { maxAttempts: 3, initialDelayMs: 2000, backoffMultiplier: 2 },
          circuitBreaker: { failureThreshold: 5, resetTimeoutMs: 30000 },
        },
      );

      written += result.batchWritten;
      conflicts += result.batchConflicts;

      await this.checkpoint(sync, { traceId: 'checkpoint' }, {
        step: 'write',
        position: i + batch.length,
        timestamp: new Date(),
        data: { batchSize: batch.length, written: result.batchWritten },
      });
    }

    return { written, conflicts };
  }

  private async checkpoint(
    sync: SyncEntity,
    _context: Record<string, unknown>,
    checkpoint: SyncCheckpoint,
  ): Promise<void> {
    const key = `sync:${sync.id}:checkpoint`;
    this.checkpoints.set(key, checkpoint);
  }

  async getCheckpoint(id: string): Promise<SyncCheckpoint | null> {
    return this.checkpoints.get(`sync:${id}:checkpoint`) ?? null;
  }

  async resume(id: string): Promise<SyncPipelineResult> {
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

    if (sync.status !== 'PAUSED' && sync.status !== 'FAILED') {
      throw new IntegrationException(
        IntegrationErrorCode.INTEGRATION_INVALID_STATE,
        `Synchronization "${sync.code}" can only be resumed from PAUSED or FAILED`,
        HttpStatus.BAD_REQUEST,
      );
    }

    const checkpoint = this.checkpoints.get(`sync:${sync.id}:checkpoint`);

    if (!checkpoint) {
      return this.run(id);
    }

    await this.prisma.synchronization.update({
      where: { id },
      data: { status: 'RUNNING' as SynchronizationStatus },
    });

    return this.run(id);
  }

  async cancel(id: string) {
    const sync = await this.prisma.synchronization.findUnique({
      where: { id },
      select: { id: true, status: true, code: true },
    });

    if (!sync) {
      throw new IntegrationException(
        IntegrationErrorCode.INTEGRATION_PROVIDER_UNAVAILABLE,
        `Synchronization "${id}" not found`,
        HttpStatus.NOT_FOUND,
      );
    }

    if (sync.status !== 'RUNNING') {
      throw new IntegrationException(
        IntegrationErrorCode.INTEGRATION_INVALID_STATE,
        `Synchronization "${sync.code}" is not running`,
        HttpStatus.BAD_REQUEST,
      );
    }

    this.checkpoints.delete(`sync:${sync.id}:checkpoint`);

    return this.prisma.synchronization.update({
      where: { id },
      data: { status: 'CANCELLED' as SynchronizationStatus },
    });
  }

  async pause(id: string) {
    const sync = await this.prisma.synchronization.findUnique({
      where: { id },
      select: { id: true, status: true, code: true },
    });

    if (!sync) {
      throw new IntegrationException(
        IntegrationErrorCode.INTEGRATION_PROVIDER_UNAVAILABLE,
        `Synchronization "${id}" not found`,
        HttpStatus.NOT_FOUND,
      );
    }

    if (sync.status !== 'RUNNING') {
      throw new IntegrationException(
        IntegrationErrorCode.INTEGRATION_INVALID_STATE,
        `Synchronization "${sync.code}" is not running`,
        HttpStatus.BAD_REQUEST,
      );
    }

    return this.prisma.synchronization.update({
      where: { id },
      data: { status: 'PAUSED' as SynchronizationStatus },
    });
  }

  private async logIntegration(
    traceId: string,
    connectorId: string,
    direction: IntegrationLogDirection,
    startTime: number,
    duration: number,
    status: 'SUCCEEDED' | 'FAILED',
    errorCode?: IntegrationErrorCode,
  ): Promise<void> {
    await this.prisma.integrationLog.create({
      data: {
        traceId,
        tenantId: null,
        connectorId,
        operation: 'synchronization',
        direction,
        startedAt: new Date(startTime),
        finishedAt: new Date(),
        duration,
        status: errorCode
          ? ('FAILED' as IntegrationLogStatus)
          : ('SUCCEEDED' as IntegrationLogStatus),
        errorCode: errorCode ?? null,
        attempt: 1,
      },
    });
  }
}
