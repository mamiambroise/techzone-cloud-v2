import { HttpStatus, Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreateReleaseDto } from './dto/create-release-dto';
import { QueryReleaseDto } from './dto/query-release.dto';
import { ApproveReleaseDto } from './dto/approve-release.dto';
import { DeploymentErrorCode } from '../../../common/errors/deployment-error-code.enum';
import { DeploymentException } from '../../../common/errors/deployment.exception';
import { type IamAuthContext } from '../../../iam/decorators/current-user.decorator';
import { randomUUID } from 'crypto';

@Injectable()
export class ReleaseService {
  constructor(private readonly prisma: PrismaService) {}

  private requireTenant(principal: IamAuthContext): string {
    const tenantId = principal?.tenantId;
    if (!tenantId || tenantId === 'legacy') {
      throw new DeploymentException(
        DeploymentErrorCode.DEP_PERMISSION_DENIED,
        'An active tenant context is required for release operations',
        HttpStatus.FORBIDDEN,
      );
    }
    return tenantId;
  }

  async create(dto: CreateReleaseDto, principal: IamAuthContext) {
    const tenantId = this.requireTenant(principal);
    const actor = principal.userId;
    // 1. Vérifier l'application
    const application = await this.prisma.application.findFirst({
      where: { id: dto.applicationId, tenantId },
    });

    if (!application) {
      throw new DeploymentException(
        DeploymentErrorCode.DEP_RELEASE_INVALID,
        `Application "${dto.applicationId}" not found`,
        HttpStatus.NOT_FOUND,
      );
    }

    // 2. Vérifier la version de l'application
    const applicationVersion = await this.prisma.applicationVersion.findFirst({
      where: {
        id: dto.applicationVersionId,
        applicationId: application.id,
        tenantId,
      },
    });

    if (!applicationVersion) {
      throw new DeploymentException(
        DeploymentErrorCode.DEP_RELEASE_INVALID,
        `Application version "${dto.applicationVersionId}" not found`,
        HttpStatus.NOT_FOUND,
      );
    }

    // 3. Vérifier le snapshot
    const snapshot = await this.prisma.snapshot.findFirst({
      where: {
        id: dto.snapshotId,
        applicationId: application.id,
        applicationVersionId: applicationVersion.id,
        tenantId,
      },
    });

    if (!snapshot) {
      throw new DeploymentException(
        DeploymentErrorCode.DEP_RELEASE_INVALID,
        `Snapshot "${dto.snapshotId}" not found`,
        HttpStatus.NOT_FOUND,
      );
    }

    // 4. Vérifier l'unicité code + version + tenantId
    const existingRelease = await this.prisma.release.findFirst({
      where: {
        tenantId,
        code: dto.code,
        version: dto.version,
      },
    });

    if (existingRelease) {
      throw new DeploymentException(
        DeploymentErrorCode.DEP_RELEASE_EXISTS,
        `Release "${dto.code}:${dto.version}" already exists`,
        HttpStatus.CONFLICT,
      );
    }

    const traceId = `trc-rel-${randomUUID().slice(0, 8)}`;

    // 5. Créer le Release
    const release = await this.prisma.release.create({
      data: {
        code: dto.code,
        version: dto.version,
        applicationId: dto.applicationId,
        applicationVersionId: dto.applicationVersionId,
        snapshotId: dto.snapshotId,
        tenantId,
        artifactRefs: (dto.artifactRefs ?? {
          containerImage: `registry.techzone.internal/${application.code}:${dto.version}`,
          digest: `sha256:${randomUUID().replace(/-/g, '')}`,
        }) as any,
        contractVersions: (dto.contractVersions ?? {}) as any,
        configurationVersion: dto.configurationVersion,
        status: 'DRAFT',
        createdBy: actor,
      },
    });

    // Enregistrer dans l'historique
    await this.prisma.deploymentHistory.create({
      data: {
        traceId,
        tenantId,
        releaseId: release.id,
        applicationId: release.applicationId,
        action: 'CREATED',
        status: 'DRAFT',
        actor,
        metadata: {
          code: release.code,
          version: release.version,
          snapshotId: release.snapshotId,
        },
      },
    });

    return release;
  }

  async findAll(query: QueryReleaseDto | undefined, principal: IamAuthContext) {
    const tenantId = this.requireTenant(principal);
    const where: Record<string, any> = { tenantId };

    if (query?.applicationId) {
      where.applicationId = query.applicationId;
    }

    if (query?.status) {
      where.status = query.status;
    }

    const releases = await this.prisma.release.findMany({
      where,
      include: {
        application: true,
        applicationVersion: true,
        snapshot: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    if (query?.search) {
      const s = query.search.toLowerCase();
      return releases.filter(
        (r: any) =>
          r.code.toLowerCase().includes(s) ||
          r.version.toLowerCase().includes(s) ||
          r.application?.name?.toLowerCase().includes(s),
      );
    }

    return releases;
  }

  async findOne(id: string, principal: IamAuthContext) {
    const tenantId = this.requireTenant(principal);
    const release = await this.prisma.release.findFirst({
      where: { id, tenantId },
      include: {
        application: true,
        applicationVersion: true,
        snapshot: true,
        deployments: true,
      },
    });

    if (!release) {
      throw new DeploymentException(
        DeploymentErrorCode.DEP_RELEASE_NOT_FOUND,
        `Release "${id}" not found`,
        HttpStatus.NOT_FOUND,
      );
    }

    return release;
  }

  async assemble(id: string, principal: IamAuthContext) {
    const tenantId = this.requireTenant(principal);
    const release = await this.findOne(id, principal);

    if (release.status !== 'DRAFT') {
      throw new DeploymentException(
        DeploymentErrorCode.DEP_RELEASE_LIFECYCLE_INVALID,
        `Release "${id}" cannot be assembled from status "${release.status}"`,
        HttpStatus.CONFLICT,
      );
    }

    // Résoudre le snapshot et geler la configuration et les contrats
    const snapshot = await this.prisma.snapshot.findUnique({
      where: { id: release.snapshotId },
    });

    const contracts = (snapshot?.contracts as Record<string, any>[]) || [];
    const resolvedContractVersions: Record<string, string> = {};
    for (const c of contracts) {
      if (c.contractCode && c.contractVersion) {
        resolvedContractVersions[c.contractCode] = c.contractVersion;
      }
    }

    const updated = await this.prisma.release.update({
      where: { id },
      data: {
        status: 'ASSEMBLING',
        contractVersions: (Object.keys(resolvedContractVersions).length > 0
          ? resolvedContractVersions
          : release.contractVersions) as any,
      },
    });

    await this.prisma.deploymentHistory.create({
      data: {
        traceId: `trc-asm-${randomUUID().slice(0, 8)}`,
        tenantId,
        releaseId: id,
        applicationId: release.applicationId,
        action: 'VALIDATING',
        status: 'ASSEMBLING',
        actor: principal.userId,
        metadata: {
          assembledAt: new Date().toISOString(),
          contractsResolved: Object.keys(resolvedContractVersions).length,
        },
      },
    });

    return updated;
  }

  async validate(id: string, principal: IamAuthContext) {
    const tenantId = this.requireTenant(principal);
    const release = await this.findOne(id, principal);

    if (release.status !== 'ASSEMBLING') {
      throw new DeploymentException(
        DeploymentErrorCode.DEP_RELEASE_LIFECYCLE_INVALID,
        `Release "${id}" cannot be validated from status "${release.status}"`,
        HttpStatus.CONFLICT,
      );
    }

    // Vérifier les artefacts
    const artifacts = release.artifactRefs as Record<string, any>;
    if (!artifacts || Object.keys(artifacts).length === 0) {
      throw new DeploymentException(
        DeploymentErrorCode.DEP_ARTIFACT_MISSING,
        `Release "${id}" is missing required runtime artifact references`,
        HttpStatus.UNPROCESSABLE_ENTITY,
      );
    }

    // Mettre à jour en READY
    const updated = await this.prisma.release.update({
      where: { id },
      data: {
        status: 'READY',
      },
    });

    await this.prisma.deploymentHistory.create({
      data: {
        traceId: `trc-val-${randomUUID().slice(0, 8)}`,
        tenantId,
        releaseId: id,
        applicationId: release.applicationId,
        action: 'GATE_CHECK',
        status: 'READY',
        actor: principal.userId,
        metadata: {
          validatedAt: new Date().toISOString(),
          artifactsVerified: true,
        },
      },
    });

    return updated;
  }

  async approve(
    id: string,
    dto: ApproveReleaseDto | undefined,
    principal: IamAuthContext,
  ) {
    const tenantId = this.requireTenant(principal);
    const release = await this.findOne(id, principal);

    if (release.status !== 'READY') {
      throw new DeploymentException(
        DeploymentErrorCode.DEP_RELEASE_LIFECYCLE_INVALID,
        `Release "${id}" cannot be approved from status "${release.status}". Must be in READY state.`,
        HttpStatus.CONFLICT,
      );
    }

    const approver = principal.userId;

    const updated = await this.prisma.release.update({
      where: { id },
      data: {
        status: 'APPROVED',
        approvedAt: new Date(),
      },
    });

    await this.prisma.deploymentHistory.create({
      data: {
        traceId: `trc-appr-${randomUUID().slice(0, 8)}`,
        tenantId,
        releaseId: id,
        applicationId: release.applicationId,
        action: 'GATE_CHECK',
        status: 'APPROVED',
        actor: approver,
        metadata: {
          notes: dto?.notes || 'Manual approval confirmed',
          approvedAt: new Date().toISOString(),
        },
      },
    });

    return updated;
  }

  async publish(id: string, principal: IamAuthContext) {
    const tenantId = this.requireTenant(principal);
    const release = await this.findOne(id, principal);

    if (release.status !== 'APPROVED') {
      throw new DeploymentException(
        DeploymentErrorCode.DEP_RELEASE_LIFECYCLE_INVALID,
        `Release "${id}" cannot be published from status "${release.status}". Must be APPROVED.`,
        HttpStatus.CONFLICT,
      );
    }

    const updated = await this.prisma.release.update({
      where: { id },
      data: {
        status: 'RELEASED',
        releasedAt: new Date(),
      },
    });

    await this.prisma.deploymentHistory.create({
      data: {
        traceId: `trc-pub-${randomUUID().slice(0, 8)}`,
        tenantId,
        releaseId: id,
        applicationId: release.applicationId,
        action: 'SUCCEEDED',
        status: 'RELEASED',
        actor: principal.userId,
        metadata: {
          releasedAt: new Date().toISOString(),
        },
      },
    });

    return updated;
  }

  async archive(id: string, principal: IamAuthContext) {
    await this.findOne(id, principal);

    return this.prisma.release.update({
      where: { id },
      data: {
        status: 'ARCHIVED',
      },
    });
  }

  async compare(id1: string, id2: string, principal: IamAuthContext) {
    const r1 = await this.findOne(id1, principal);
    const r2 = await this.findOne(id2, principal);

    return {
      release1: {
        id: r1.id,
        code: r1.code,
        version: r1.version,
        status: r1.status,
        configurationVersion: r1.configurationVersion,
        contractVersions: r1.contractVersions,
        artifactRefs: r1.artifactRefs,
      },
      release2: {
        id: r2.id,
        code: r2.code,
        version: r2.version,
        status: r2.status,
        configurationVersion: r2.configurationVersion,
        contractVersions: r2.contractVersions,
        artifactRefs: r2.artifactRefs,
      },
      differences: {
        versionChanged: r1.version !== r2.version,
        configVersionChanged: r1.configurationVersion !== r2.configurationVersion,
        contractsDiff: {
          r1Contracts: r1.contractVersions,
          r2Contracts: r2.contractVersions,
        },
        artifactsDiff: {
          r1Artifacts: r1.artifactRefs,
          r2Artifacts: r2.artifactRefs,
        },
      },
    };
  }

  async getHistory(id: string, principal: IamAuthContext) {
    const tenantId = this.requireTenant(principal);
    await this.findOne(id, principal);

    return this.prisma.deploymentHistory.findMany({
      where: {
        releaseId: id,
        tenantId,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });
  }
}
