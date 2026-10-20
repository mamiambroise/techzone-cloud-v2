import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { isUUID } from 'class-validator';
import { PrismaService } from '../../prisma/prisma.service';
import { contractHash, publicJson, RecordValue } from '../pack-manager/pack-contract';

export type RuntimeProof = {
  resolutionId: string; tenantId: string; applicationId?: string;
  applicationVersionId?: string; packVersionId?: string; environmentId?: string;
};

/** Shared by administrative activation and data execution. Never trusts client status. */
@Injectable()
export class RuntimeExecutionService {
  constructor(private readonly db: PrismaService) {}

  async assertExecutable(proof: RuntimeProof, requireActive = true, db: PrismaService = this.db) {
    if (!proof.tenantId) throw new BadRequestException('TENANT_CONTEXT_REQUIRED');
    if (!proof.resolutionId) throw new BadRequestException('RUNTIME_RESOLUTION_ID_REQUIRED');
    if (!isUUID(proof.resolutionId)) throw new BadRequestException('RUNTIME_RESOLUTION_ID_INVALID');
    const item = await db.runtimeResolution.findFirst({
      where: { id: proof.resolutionId, tenantId: proof.tenantId }, include: { effectiveManifest: true },
    });
    if (!item) throw new NotFoundException('RUNTIME_RESOLUTION_NOT_FOUND');
    const manifest = item.effectiveManifest;
    const content = manifest?.content as RecordValue | undefined;
    const result = item.result as RecordValue | null;
    if (item.status !== 'EXECUTABLE' || manifest?.executable !== true || content?.executable !== true || content.status !== 'EXECUTABLE') throw new ConflictException('RUNTIME_RESOLUTION_BLOCKED');
    if (!result?.expiresAt || !Number.isFinite(Date.parse(result.expiresAt)) || Date.parse(result.expiresAt) <= Date.now()) throw new ConflictException('RUNTIME_RESOLUTION_EXPIRED');
    if (!content || contractHash(content) !== manifest.functionalHash || manifest.manifestHash !== manifest.functionalHash) throw new ConflictException('RUNTIME_HASH_MISMATCH');
    publicJson(content);
    if (content.scope?.tenantId !== item.tenantId || content.scope?.applicationId !== item.applicationId || content.scope?.environment !== item.environment) throw new ConflictException('RUNTIME_MANIFEST_INVALID');
    if (proof.applicationId && proof.applicationId !== item.applicationId) throw new BadRequestException('RUNTIME_APPLICATION_MISMATCH');
    if (proof.environmentId && ![item.environment, content.businessConfiguration?.environment?.id].includes(proof.environmentId)) throw new BadRequestException('RUNTIME_ENVIRONMENT_MISMATCH');
    if (proof.packVersionId && proof.packVersionId !== item.packVersionId) throw new BadRequestException('RUNTIME_PACK_VERSION_MISMATCH');
    const versionId = content.scope?.businessVersionId;
    if (!versionId || (proof.applicationVersionId && proof.applicationVersionId !== versionId)) throw new BadRequestException('RUNTIME_APPLICATION_VERSION_MISMATCH');
    const environment = await db.environment.findFirst({ where: { tenantId: item.tenantId, code: item.environment, status: 'ACTIVE' }, select: { id: true } });
    if (!environment) throw new ConflictException('RUNTIME_READINESS_FAILED');
    const publication = await db.packVersion.findFirst({
      where: { id: item.packVersionId, tenantId: item.tenantId, status: 'PUBLISHED', pack: { archivedAt: null } },
      include: { snapshot: true, manifest: true },
    });
    if (!publication || publication.applicationVersionId !== versionId) throw new ConflictException('RUNTIME_APPLICATION_VERSION_MISMATCH');
    const source = publication.manifest;
    const snapshot = publication.snapshot;
    const sourceContent = source?.content as RecordValue | undefined;
    if (!source || source.status !== 'PUBLISHED' || !snapshot || source.manifestHash !== content.source?.manifestHash || contractHash(source.content) !== source.manifestHash || publication.manifestHash !== source.manifestHash || contractHash(snapshot.content) !== snapshot.snapshotHash || publication.snapshotHash !== snapshot.snapshotHash || sourceContent?.snapshotHash !== snapshot.snapshotHash) throw new ConflictException('RUNTIME_HASH_MISMATCH');
    const ui = content.ui?.definition;
    if (!ui || content.ui?.applicationVersionId !== versionId || ui.applicationVersionId !== versionId || ui.businessContext?.applicationVersionId !== versionId) throw new ConflictException('RUNTIME_APPLICATION_VERSION_MISMATCH');
    if (requireActive && (result.runtimeContext?.status !== 'ACTIVE' || result.runtimeContext?.readiness !== 'READY')) throw new ConflictException('RUNTIME_CONTEXT_NOT_ACTIVE');
    return item;
  }
}
