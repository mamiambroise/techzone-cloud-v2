import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { createHash, randomUUID } from 'node:crypto';
import { DataSource, Repository } from 'typeorm';
import { RuntimeResolution } from '../entities/runtime-resolution.entity';
import { RuntimeResolutionStep } from '../entities/runtime-resolution-step.entity';
import type { RuntimeContext } from './contracts/runtime.contracts';
import { RuntimeResolverService } from './runtime-resolver.service';
import type { ManifestLookup, PackManifestProvider } from './providers/pack-manifest.provider';

export const RUNTIME_MANIFEST_PROVIDER = 'RUNTIME_MANIFEST_PROVIDER';

export interface RuntimeResolveRequest extends Omit<ManifestLookup, 'tenantId' | 'applicationId'> {
  tenantId?: string;
  applicationId: string;
  userId?: string;
  context?: Partial<RuntimeContext>;
  timeoutMs?: number;
  retryOf?: string;
}

@Injectable()
export class RuntimeResolutionService {
  private readonly resolutions: Repository<RuntimeResolution>;
  private readonly steps: Repository<RuntimeResolutionStep>;

  constructor(
    @InjectDataSource() dataSource: DataSource,
    @Inject(RUNTIME_MANIFEST_PROVIDER) private readonly manifests: PackManifestProvider,
    private readonly resolver: RuntimeResolverService,
  ) {
    this.resolutions = dataSource.getRepository(RuntimeResolution);
    this.steps = dataSource.getRepository(RuntimeResolutionStep);
  }

  async resolve(request: RuntimeResolveRequest, authenticatedTenantId?: string) {
    const tenantId = authenticatedTenantId ?? request.tenantId;
    if (!tenantId || tenantId !== request.tenantId && request.tenantId) throw this.error('RUNTIME_TENANT_MISMATCH', 'The request tenant does not match the authenticated tenant.');
    if (!request.applicationId || !request.environment) throw this.error('RUNTIME_CONTEXT_INVALID', 'applicationId and environment are required.');
    const traceId = randomUUID();
    const startedAt = new Date();
    const loaded = await this.step(traceId, 'MANIFEST', () => this.manifests.getPublishedManifest({ ...request, tenantId } as ManifestLookup));
    this.validateManifestRequest(loaded.manifest, request);

    const resolution = await this.resolutions.save(this.resolutions.create({
      tenantId,
      applicationId: request.applicationId,
      packCode: loaded.manifest.pack.code,
      packVersion: loaded.manifest.pack.version,
      environment: request.environment,
      sourceManifestHash: loaded.manifest.manifestHash,
      status: 'RESOLVING',
      traceId,
      retryOf: request.retryOf,
      startedAt,
      summary: { publicationStatus: loaded.publicationStatus, sourceRef: loaded.sourceRef },
    }));

    try {
      const context: RuntimeContext = {
        ...(request.context ?? {}),
        tenantId,
        applicationId: request.applicationId,
        userId: request.userId ?? request.context?.userId,
        environment: request.environment,
      };
      const result = await this.withTimeout(
        this.step(resolution.id, 'RESOLVE', () => this.resolver.resolve(loaded.manifest, context)),
        request.timeoutMs ?? 30_000,
      );
      const completedAt = new Date();
      const status = result.resolution.status;
      await this.resolutions.update(resolution.id, { status, completedAt, durationMs: completedAt.getTime() - startedAt.getTime(), summary: { effectiveManifestHash: result.effectiveManifestHash, issueCount: result.resolution.issues.length } });
      return { resolutionId: resolution.id, traceId, status, effectiveManifest: result };
    } catch (cause) {
      const errorCode = cause instanceof BadRequestException ? this.exceptionCode(cause) : 'RUNTIME_RESOLUTION_ERROR';
      const completedAt = new Date();
      await this.resolutions.update(resolution.id, { status: errorCode === 'RUNTIME_RESOLUTION_TIMEOUT' ? 'ERROR' : 'BLOCKED', completedAt, durationMs: completedAt.getTime() - startedAt.getTime(), summary: { errorCode } });
      throw cause;
    }
  }

  async getResolution(id: string) {
    const resolution = await this.resolutions.findOne({ where: { id } });
    if (!resolution) throw this.error('RUNTIME_RESOLUTION_NOT_FOUND', 'Runtime resolution was not found.');
    const steps = await this.steps.find({ where: { resolutionId: id }, order: { createdAt: 'ASC' } });
    return { ...resolution, steps };
  }

  async getSteps(id: string) {
    await this.getResolution(id);
    return this.steps.find({ where: { resolutionId: id }, order: { createdAt: 'ASC' } });
  }

  async retry(id: string, tenantId: string) {
    const previous = await this.getResolution(id);
    if (previous.tenantId !== tenantId) throw this.error('RUNTIME_RESOLUTION_NOT_FOUND', 'Runtime resolution was not found.');
    return this.resolve({ tenantId, applicationId: previous.applicationId, packCode: previous.packCode, packVersion: previous.packVersion, environment: previous.environment, retryOf: id });
  }

  private async step<T>(resolutionId: string, stepType: string, operation: () => Promise<T>): Promise<T> {
    const startedAt = new Date();
    const step = await this.steps.save(this.steps.create({ resolutionId, stepType, status: 'RUNNING', startedAt, details: {} }));
    try {
      const result = await operation();
      const completedAt = new Date();
      await this.steps.update(step.id, { status: 'SUCCESS', completedAt, durationMs: completedAt.getTime() - startedAt.getTime() });
      return result;
    } catch (cause) {
      const completedAt = new Date();
      await this.steps.update(step.id, { status: 'FAILED', completedAt, durationMs: completedAt.getTime() - startedAt.getTime(), errorCode: cause instanceof BadRequestException ? this.exceptionCode(cause) : 'RUNTIME_PROVIDER_UNAVAILABLE' });
      throw cause;
    }
  }

  private validateManifestRequest(manifest: { contract: string; contractVersion: string; pack: { code: string; version: string }; modules: unknown[]; features: unknown[] }, request: RuntimeResolveRequest) {
    if (manifest.contract !== 'techzone.pack-manifest' || !['1.0', '1.1'].includes(manifest.contractVersion)) throw this.error('RUNTIME_CONTRACT_UNSUPPORTED', 'The Pack Manifest contract is not supported.');
    if (!manifest.modules || !manifest.features || new Set(manifest.modules.map((item: any) => item.code)).size !== manifest.modules.length || new Set(manifest.features.map((item: any) => item.code)).size !== manifest.features.length) throw this.error('RUNTIME_MANIFEST_INVALID', 'The Pack Manifest structure is invalid.');
    if (request.packCode && request.packCode !== manifest.pack.code || request.packVersion && request.packVersion !== manifest.pack.version) throw this.error('RUNTIME_MANIFEST_INVALID', 'The requested Pack Manifest does not match the request.');
  }

  private withTimeout<T>(promise: Promise<T>, timeoutMs: number) {
    return new Promise<T>((resolve, reject) => {
      const timer = setTimeout(() => reject(this.error('RUNTIME_RESOLUTION_TIMEOUT', 'Runtime resolution timed out.')), timeoutMs);
      promise.then((value) => { clearTimeout(timer); resolve(value); }, (error) => { clearTimeout(timer); reject(error); });
    });
  }

  private error(code: string, message: string) { return new BadRequestException({ error: { code, message } }); }
  private exceptionCode(exception: BadRequestException) { return String((exception.getResponse() as any)?.error?.code ?? 'RUNTIME_RESOLUTION_ERROR'); }
}