import { Injectable, HttpStatus } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { PlatformErrorCode } from '../../../common/errors/platform-error-code.enum';
import { PlatformException } from '../../../common/errors/platform.exception';
import { BmNavigationStatus, BmRuntimeReadiness, BmContractStatus } from '../../../generated/prisma/enums';
import { CreateRuntimeManifestDto, CreateRuntimeBindingDto, UpdateRuntimeBindingDto } from './dto/create-runtime.dto';

@Injectable()
export class RuntimeBridgeService {
  constructor(private readonly prisma: PrismaService) {}

  private async ensureApplicationVersionExists(applicationVersionId: string, tenantId: string | null) {
    const version = await this.prisma.applicationVersion.findFirst({
      where: {
        id: applicationVersionId,
        tenantId: tenantId ?? undefined,
      },
    });

    if (!version) {
      throw new PlatformException(
        PlatformErrorCode.VERSION_NOT_FOUND,
        `Application version "${applicationVersionId}" not found`,
        HttpStatus.NOT_FOUND,
      );
    }

    return version;
  }

  // =====================================================================
  // RUNTIME MANIFEST
  // =====================================================================

  async createManifest(applicationVersionId: string, dto: CreateRuntimeManifestDto, tenantId: string | null) {
    await this.ensureApplicationVersionExists(applicationVersionId, tenantId);

    const code = dto.code.trim().toLowerCase();
    const version = dto.version || '1.0.0';

    const appVersion = await this.prisma.applicationVersion.findUnique({
      where: { id: applicationVersionId },
      include: { application: true },
    });

    const existing = await this.prisma.bmRuntimeManifest.findFirst({
      where: {
        applicationVersionId,
        code,
        version,
        tenantId: tenantId ?? undefined,
      },
    });

    if (existing) {
      throw new PlatformException(
        PlatformErrorCode.CONTRACT_EXISTS,
        `Runtime manifest with code "${code}" version "${version}" already exists`,
        HttpStatus.CONFLICT,
      );
    }

    return this.prisma.bmRuntimeManifest.create({
      data: {
        applicationId: appVersion?.applicationId ?? '',
        applicationVersionId,
        code,
        name: dto.name,
        description: dto.description,
        version,
        status: BmNavigationStatus.DRAFT,
        manifest: (dto.manifest || undefined) as any,
        hash: this.computeHash(dto.manifest || {}),
        tenantId: tenantId ?? undefined,
      },
    });
  }

  async findAllManifests(applicationVersionId: string, tenantId: string | null) {
    await this.ensureApplicationVersionExists(applicationVersionId, tenantId);

    return this.prisma.bmRuntimeManifest.findMany({
      where: {
        applicationVersionId,
        tenantId: tenantId ?? undefined,
      },
      include: {
        bindings: true,
      },
    });
  }

  async findOneManifest(id: string, tenantId: string | null) {
    const manifest = await this.prisma.bmRuntimeManifest.findFirst({
      where: {
        id,
        tenantId: tenantId ?? undefined,
      },
      include: {
        bindings: true,
      },
    });

    if (!manifest) {
      throw new PlatformException(
        PlatformErrorCode.CONTRACT_NOT_FOUND,
        `Runtime manifest "${id}" not found`,
        HttpStatus.NOT_FOUND,
      );
    }

    return manifest;
  }

  async updateManifest(id: string, dto: CreateRuntimeManifestDto, tenantId: string | null) {
    const manifest = await this.findOneManifest(id, tenantId);

    if (manifest.status === BmNavigationStatus.ACTIVE) {
      throw new PlatformException(
        PlatformErrorCode.CONTRACT_LOCKED,
        'Active manifest cannot be modified',
        HttpStatus.CONFLICT,
      );
    }

    return this.prisma.bmRuntimeManifest.update({
      where: { id },
      data: {
        code: dto.code?.trim().toLowerCase(),
        name: dto.name,
        description: dto.description,
        version: dto.version,
        manifest: dto.manifest as any,
        hash: this.computeHash(dto.manifest || {}),
      },
    });
  }

  // =====================================================================
  // RUNTIME BINDING
  // =====================================================================

  async createBinding(manifestId: string, dto: CreateRuntimeBindingDto, tenantId: string | null) {
    const manifest = await this.findOneManifest(manifestId, tenantId);

    const existing = await this.prisma.bmRuntimeBinding.findFirst({
      where: {
        manifestId,
        targetType: dto.targetType,
        targetId: dto.targetId,
        tenantId: tenantId ?? undefined,
      },
    });

    if (existing) {
      throw new PlatformException(
        PlatformErrorCode.CONTRACT_EXISTS,
        `Binding for target "${dto.targetType}:${dto.targetId}" already exists`,
        HttpStatus.CONFLICT,
      );
    }

    return this.prisma.bmRuntimeBinding.create({
      data: {
        manifestId,
        targetType: dto.targetType,
        targetId: dto.targetId,
        configuration: (dto.configuration || undefined) as any,
        status: BmRuntimeReadiness.NOT_READY,
        tenantId: tenantId ?? undefined,
      },
    });
  }

  async findAllBindings(manifestId: string, tenantId: string | null) {
    const manifest = await this.findOneManifest(manifestId, tenantId);

    return this.prisma.bmRuntimeBinding.findMany({
      where: {
        manifestId,
        tenantId: tenantId ?? undefined,
      },
    });
  }

  async updateBinding(id: string, dto: UpdateRuntimeBindingDto, tenantId: string | null) {
    const binding = await this.prisma.bmRuntimeBinding.findFirst({
      where: { id, tenantId: tenantId ?? undefined },
    });

    if (!binding) {
      throw new PlatformException(
        PlatformErrorCode.CONTRACT_NOT_FOUND,
        `Runtime binding "${id}" not found`,
        HttpStatus.NOT_FOUND,
      );
    }

    return this.prisma.bmRuntimeBinding.update({
      where: { id },
      data: {
        configuration: dto.configuration as any,
        status: dto.status,
      },
    });
  }

  // =====================================================================
  // RUNTIME MANIFEST RESOLVER
  // =====================================================================

  async resolveManifest(manifestId: string, tenantId: string | null) {
    const manifest = await this.findOneManifest(manifestId, tenantId);

    const contracts = await this.prisma.bmBusinessContract.findMany({
      where: {
        applicationId: manifest.applicationId,
        applicationVersionId: manifest.applicationVersionId,
        status: { in: [BmContractStatus.LOCKED, BmContractStatus.ACTIVE] },
        tenantId: tenantId ?? undefined,
      },
    });

    const entities = await this.prisma.bmEntity.findMany({
      where: {
        applicationVersionId: manifest.applicationVersionId,
        tenantId: tenantId ?? undefined,
      },
      include: { fields: true },
    });

    const features = await this.prisma.bmFeature.findMany({
      where: {
        applicationVersionId: manifest.applicationVersionId,
        tenantId: tenantId ?? undefined,
      },
      include: { capabilities: true },
    });

    const versionFeatures = await this.prisma.bmVersionFeature.findMany({
      where: {
        applicationVersionId: manifest.applicationVersionId,
        enabled: true,
        tenantId: tenantId ?? undefined,
      },
    });

    const versionCapabilities = await this.prisma.bmVersionCapability.findMany({
      where: {
        applicationVersionId: manifest.applicationVersionId,
        enabled: true,
        tenantId: tenantId ?? undefined,
      },
    });

    const readiness: string = versionFeatures.length > 0 && contracts.length > 0
      ? BmRuntimeReadiness.READY
      : BmRuntimeReadiness.NOT_READY;

    const manifestData = (manifest.manifest as any) || {};

    return {
      manifest: {
        id: manifest.id,
        code: manifest.code,
        version: manifest.version,
        hash: manifest.hash,
      },
      dataModel: entities.map(e => ({
        code: e.code,
        name: e.name,
        fields: e.fields.map(f => ({
          code: f.code,
          type: f.type,
          required: f.required,
          unique: f.unique,
        })),
      })),
      features: features.map(f => ({
        code: f.code,
        name: f.name,
        capabilities: f.capabilities.map(c => ({
          code: c.code,
          name: c.name,
          required: c.required,
        })),
      })),
      versionFeatures: versionFeatures.map(vf => vf.featureCode),
      versionCapabilities: versionCapabilities.map(vc => ({
        featureCode: vc.featureCode,
        capabilityCode: vc.capabilityCode,
      })),
      contracts: contracts.map(c => ({
        code: c.code,
        version: c.version,
        hash: c.contractHash,
      })),
      bindings: manifest.bindings.map(b => ({
        targetType: b.targetType,
        targetId: b.targetId,
        status: b.status,
      })),
      readiness,
      ...(manifestData.sections ? { sections: manifestData.sections } : {}),
    };
  }

  // =====================================================================
  // RUNTIME CONTEXT RESOLVER
  // =====================================================================

  async resolveBinding(bindingId: string, context: Record<string, unknown>, tenantId: string | null) {
    const binding = await this.prisma.bmRuntimeBinding.findFirst({
      where: { id: bindingId, tenantId: tenantId ?? undefined },
      include: { manifest: true },
    });

    if (!binding) {
      throw new PlatformException(
        PlatformErrorCode.CONTRACT_NOT_FOUND,
        `Runtime binding "${bindingId}" not found`,
        HttpStatus.NOT_FOUND,
      );
    }

    const config = (binding.configuration as any) || {};

    return {
      bindingId: binding.id,
      targetType: binding.targetType,
      targetId: binding.targetId,
      resolvedConfiguration: {
        ...config,
        _meta: {
          resolvedAt: new Date().toISOString(),
          contextKeys: Object.keys(context),
          manifestCode: binding.manifest.code,
          manifestVersion: binding.manifest.version,
        },
      },
      status: binding.status,
    };
  }

  private computeHash(data: unknown): string {
    const json = JSON.stringify(data);
    let hash = 0;
    for (let i = 0; i < json.length; i++) {
      const char = json.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(36);
  }
}


